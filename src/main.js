'use strict'

const net = require('net')
const { InstanceBase, Regex, runEntrypoint, InstanceStatus } = require('@companion-module/base')

const { encodeCommands, createParser, ReqType } = require('./protocol')
const { createState, handleCommand } = require('./state')
const { Model, MODEL_CHOICES, getDefaultCaps } = require('./model')
const UpgradeScripts = require('./upgrades')
const UpdateActions = require('./actions')
const UpdateFeedbacks = require('./feedbacks')
const UpdateVariableDefinitions = require('./variables')
const UpdatePresets = require('./presets')
const { updateVariableValues } = require('./variables')

const DEFAULT_PORT = 19010
const RECONNECT_INTERVAL_MS = 5000

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// ─── Sync helpers ────────────────────────────────────────────────────────────
function buildDeviceInfoCmds() {
	const g = (id) => ({ id, type: ReqType.Get })
	return [
		g('buildInfo'),
		g('deviceId'),
		g('deviceName'),
		g('version'),
		g('deviceType'),
		g('inputList'),
		g('keyCount'),
		g('dskCount'),
		g('playCount'),
		g('outSourceList'),
		g('audioMixerInputSourceList'),
		g('audioMixerOutSourceList'),
	]
}

function buildFullSyncCmds(state) {
	const g = (id, value) => ({ id, type: ReqType.Get, ...(value !== undefined ? { value } : {}) })
	const cmds = [
		// Mix effect
		g('pgmIndex'),
		g('pvwIndex'),
		g('transitionStyle'),
		g('transitionRate'),
		g('transitionMixRate'),
		g('transitionDipRate'),
		g('transitionWipeRate'),
		g('transitionStatus'),
		g('previewTransition'),
		g('ftbStatus'),
		g('ftbRate'),
		// Recording
		g('recordStatus'),
		g('recordFormat'),
		g('recordDuration'),
		g('recordFree'),
		// Streaming
		g('liveStreamOutputBitrate'),
	]

	// Per-stream state
	for (let i = 0; i < state.device.streamCount; i++) {
		cmds.push(g('liveStreamOutputEnable', [i]))
		cmds.push(g('liveStreamOutputStatus', [i]))
		cmds.push(g('liveStreamOutputServiceName', [i]))
		cmds.push(g('liveStreamOutputUrl', [i]))
	}

	// Per-key USK state
	for (let i = 0; i < state.device.keyCount; i++) {
		cmds.push(g('keyEnable', [i]))
		cmds.push(g('keyType', [i]))
		cmds.push(g('keyOnAir', [i]))
		cmds.push(g('lumaFillSource', [i]))
		cmds.push(g('lumaKeySource', [i]))
		cmds.push(g('chromaFillSource', [i]))
		cmds.push(g('patternFillSource', [i]))
		cmds.push(g('pipFillSource', [i]))
	}

	// Per-DSK state
	for (let i = 0; i < state.device.dskCount; i++) {
		cmds.push(g('dskEnable', [i]))
		cmds.push(g('dskOnAir', [i]))
		cmds.push(g('dskFillSource', [i]))
		cmds.push(g('dskKeySource', [i]))
		cmds.push(g('dskRate', [i]))
	}

	// Macros
	cmds.push(g('macroInfos'))

	// Playback
	for (let i = 0; i < state.device.playCount; i++) {
		cmds.push(g('playStatus', [i]))
		cmds.push(g('playbackMode', [i]))
		cmds.push(g('playRepeat', [i]))
	}

	return cmds
}

// ─── Module class ────────────────────────────────────────────────────────────
class GoStreamInstance extends InstanceBase {
	constructor(internal) {
		super(internal)
		this._socket = null
		this._parser = null
		this._reconnectTimer = null
		this._heartbeatTimer = null
		this._state = null
		this._destroyed = false
	}

	// ── Lifecycle ────────────────────────────────────────────────────────────

	async init(config) {
		this.config = config
		this._state = createState(this._resolveModelId())
		this._initDefinitions()
		this._connect()
	}

	async destroy() {
		this._destroyed = true
		this._clearReconnectTimer()
		this._clearHeartbeatTimer()
		this._destroySocket()
		this.log('debug', 'destroy')
	}

	async configUpdated(config) {
		this.config = config
		this._state = createState(this._resolveModelId())
		this._clearReconnectTimer()
		this._clearHeartbeatTimer()
		this._destroySocket()
		this.updateStatus(InstanceStatus.Disconnected)
		this._initDefinitions()
		this._connect()
	}

	// ── Config fields ────────────────────────────────────────────────────────

	getConfigFields() {
		return [
			{
				type: 'static-text',
				label: 'Information',
				id: 'info',
				value:
					'Connects to a GoStream device over TCP port 19010 (fixed). Requires firmware v2.3.0+ for Deck/Duet, or v2.1.0+ for Duet 8 ISO.',
				width: 12,
			},
			{
				type: 'bonjour-device',
				id: 'bonjourDevices',
				label: 'Device (auto-discover)',
				width: 6,
			},
			{
				type: 'dropdown',
				id: 'modelId',
				label: 'Model',
				width: 6,
				choices: MODEL_CHOICES,
				default: Model.Auto,
				isVisible: (options) => !options['bonjourDevices'],
			},
			{
				type: 'textinput',
				id: 'host',
				label: 'Device IP',
				width: 6,
				default: '192.168.1.80',
				tooltip: 'IP address of the GoStream device',
				regex: Regex.IP,
				isVisible: (options) => !options['bonjourDevices'],
				required: true,
			},
		]
	}

	// ── Public helpers (used by actions / feedbacks / variables / presets) ───

	/** Return current state (read-only reference) */
	getState() {
		return this._state
	}

	/** Send one or more commands to the device */
	async sendCmds(cmds) {
		if (!this._socket || this._socket.destroyed) {
			this.log('debug', 'sendCmds: not connected')
			return false
		}
		try {
			const buf = encodeCommands(Array.isArray(cmds) ? cmds : [cmds])
			return new Promise((resolve) => {
				this._socket.write(buf, (err) => {
					if (err) {
						this.log('warn', `sendCmds error: ${err.message}`)
						resolve(false)
					} else {
						resolve(true)
					}
				})
			})
		} catch (err) {
			this.log('warn', `sendCmds exception: ${err.message}`)
			return false
		}
	}

	/** Convenience: send a single set command */
	async sendSet(id, value) {
		return this.sendCmds([{ id, type: ReqType.Set, value }])
	}

	/** Convenience: send a single get command */
	async sendGet(id, value) {
		return this.sendCmds([{ id, type: ReqType.Get, ...(value !== undefined ? { value } : {}) }])
	}

	/** Sync state from the device.
	 *
	 * When the model is explicitly configured (not Auto), keyCount/dskCount are
	 * already known so we send everything in one batch with zero delay.
	 *
	 * In Auto-detect mode we still need a short phase-1 pause so the device has
	 * time to reply with its capability responses before we build the per-key /
	 * per-DSK command list. 100 ms is ample on a local network.
	 */
	async _runSync(socket) {
		if (socket.destroyed) return

		if (this._resolveModelId() !== Model.Auto) {
			// Model known — send everything in one shot, no delay needed
			const allCmds = [...buildDeviceInfoCmds(), ...buildFullSyncCmds(this._state)]
			this.log('info', `Sync: sending ${allCmds.length} GETs in single batch`)
			await this.sendCmds(allCmds)
		} else {
			// Auto-detect — need caps first, then build per-key/DSK commands
			const devCmds = buildDeviceInfoCmds()
			this.log('info', `Sync phase 1: sending ${devCmds.length} device-info GETs (auto-detect)`)
			await this.sendCmds(devCmds)
			// 100 ms is enough on a LAN for the device to send back all cap responses
			await sleep(100)
			if (socket.destroyed) return
			const fullCmds = buildFullSyncCmds(this._state)
			this.log(
				'info',
				`Sync phase 2: sending ${fullCmds.length} state GETs (keyCount=${this._state.device.keyCount} dskCount=${this._state.device.dskCount})`,
			)
			await this.sendCmds(fullCmds)
		}
	}

	// ── Definition initialisation ────────────────────────────────────────────

	_initDefinitions() {
		UpdateActions(this)
		UpdateFeedbacks(this)
		UpdateVariableDefinitions(this)
		UpdatePresets(this)
	}

	// ── TCP connection ────────────────────────────────────────────────────────

	_resolveModelId() {
		const modelId = parseInt(this.config?.modelId)
		if (!isNaN(modelId) && modelId !== Model.Auto) return modelId
		return Model.Auto
	}

	_resolveHost() {
		if (this.config?.bonjourDevices) {
			const dev = this.config.bonjourDevices
			// Only use the IP from Bonjour; the advertised service port is NOT the
			// TCP protocol port — we must always connect on 19010.
			return { host: dev.host || dev.ip, port: DEFAULT_PORT }
		}
		return {
			host: this.config?.host || '192.168.1.80',
			port: DEFAULT_PORT,
		}
	}

	_connect() {
		if (this._destroyed) return
		const { host, port } = this._resolveHost()
		if (!host) {
			this.updateStatus(InstanceStatus.BadConfig, 'No IP configured')
			return
		}

		this.updateStatus(InstanceStatus.Connecting)
		this.log('info', `Connecting to ${host}:${port}`)

		this._parser = createParser()
		const socket = new net.Socket()
		this._socket = socket

		socket.setNoDelay(true)
		socket.setKeepAlive(true, 2000)

		// Abort connection attempt after 10 s if it never completes
		const connectTimeout = setTimeout(() => {
			if (!socket.destroyed) {
				this.log('warn', `Connection attempt to ${host}:${port} timed out`)
				socket.destroy()
			}
		}, 10000)

		socket.on('connect', () => {
			clearTimeout(connectTimeout)
			this.log('info', `Connected to ${host}:${port}`)
			this.updateStatus(InstanceStatus.Ok)
			this._clearReconnectTimer()
			// Start idle timeout only after the connection is established
			socket.setTimeout(30000)
			// Two-phase sync: device info first, then 300ms pause, then full state
			this._runSync(socket).catch((err) => {
				this.log('warn', `Sync error: ${err.message}`)
			})
			// Heartbeat: poll pgmIndex every 20s to keep TCP idle timer alive
			this._startHeartbeat(socket)
		})

		socket.on('data', (chunk) => {
			this.log(
				'debug',
				`RX ${chunk.length} bytes: ${chunk.toString('hex').substring(0, 120)}${chunk.length > 60 ? '…' : ''}`,
			)
			const cmds = this._parser.feed(chunk)
			let needDefinitionsUpdate = false
			for (const cmd of cmds) {
				const { changed, needReinit } = handleCommand(this._state, cmd)
				if (needReinit) needDefinitionsUpdate = true
				if (changed) {
					updateVariableValues(this)
					this.checkFeedbacks()
				}
			}
			if (needDefinitionsUpdate) {
				this._initDefinitions()
			}
		})

		socket.on('timeout', () => {
			this.log('warn', `TCP idle timeout — no data from ${host}:${port} for 30 s`)
			this.updateStatus(InstanceStatus.ConnectionFailure, 'Idle timeout')
			socket.destroy()
		})

		socket.on('error', (err) => {
			clearTimeout(connectTimeout)
			this.log('warn', `TCP error: ${err.message}`)
			this.updateStatus(InstanceStatus.ConnectionFailure, err.message)
		})

		socket.on('close', () => {
			clearTimeout(connectTimeout)
			this._clearHeartbeatTimer()
			this.log('info', 'TCP connection closed')
			this._socket = null
			if (!this._destroyed) {
				this.updateStatus(InstanceStatus.Disconnected)
				this._scheduleReconnect()
			}
		})

		socket.connect(port, host)
	}

	_scheduleReconnect() {
		if (this._destroyed || this._reconnectTimer) return
		this._reconnectTimer = setTimeout(() => {
			this._reconnectTimer = null
			if (!this._destroyed) this._connect()
		}, RECONNECT_INTERVAL_MS)
	}

	_clearReconnectTimer() {
		if (this._reconnectTimer) {
			clearTimeout(this._reconnectTimer)
			this._reconnectTimer = null
		}
	}

	_startHeartbeat(socket) {
		this._clearHeartbeatTimer()
		// Poll pgmIndex every 20 s to generate traffic and reset the 30s idle timer
		this._heartbeatTimer = setInterval(() => {
			if (!socket.destroyed) {
				this.sendCmds([{ id: 'pgmIndex', type: ReqType.Get }]).catch(() => {})
			} else {
				this._clearHeartbeatTimer()
			}
		}, 20000)
	}

	_clearHeartbeatTimer() {
		if (this._heartbeatTimer) {
			clearInterval(this._heartbeatTimer)
			this._heartbeatTimer = null
		}
	}

	_destroySocket() {
		if (this._socket) {
			this._socket.removeAllListeners()
			this._socket.destroy()
			this._socket = null
		}
		if (this._parser) {
			this._parser.reset()
			this._parser = null
		}
	}
}

runEntrypoint(GoStreamInstance, UpgradeScripts)
