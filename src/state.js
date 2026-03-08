'use strict'

/**
 * State management for the GoStream device.
 *
 * createState() builds the initial state object.
 * handleCommand() mutates the state when a Push command arrives and
 * returns true if the action/feedback/preset definitions need re-initialising.
 */

const { getDefaultCaps, Model } = require('./model')
const { ReqType } = require('./protocol')

function createState(modelId) {
	const caps = getDefaultCaps(modelId)
	return {
		// ── device caps (populated or updated by push commands) ──────────
		device: {
			modelId,
			keyCount: caps.keyCount,
			dskCount: caps.dskCount,
			streamCount: caps.streamCount,
			multiSourceWindowCount: caps.multiSourceWindowCount,
			playCount: caps.playCount,
			macros: caps.macros,
			mediaStills: caps.mediaStills,
			recordISO: caps.recordISO,
			audioMixEffect: caps.audioMixEffect,
			audioSwitcherCount: caps.audioSwitcherCount,
		},

		// ── mix effect ───────────────────────────────────────────────────
		effect: {
			pgmIndex: 1,
			pvwIndex: 2,
			transitionStyle: 0, // 0=mix, 1=dip, 2=wipe
			transitionRate: 1.5,
			transitionStatus: 0, // 0=idle, 1=running
			previewTransition: false,
			ftbStatus: 0, // 0=off, 1=on (fade-to-black)
			ftbRate: 2.0,
			ftbAfv: false,
			transitionMixRate: 1.5,
			transitionDipRate: 1.0,
			transitionWipeRate: 1.0,
			transitionDipFillSource: 0,
			transitionWipeFillSource: 0,
			transitionWipePatternIndex: 0,
		},

		// ── upstream keyers (array indexed 0..keyCount-1) ────────────────
		usk: Array.from({ length: caps.keyCount }, () => ({
			keyType: 0, // 0=luma, 1=chroma, 2=pattern, 3=pip
			enabled: false,
			onAir: false,
			lumaFillSource: 1,
			lumaKeySource: 1,
			chromaFillSource: 1,
			patternFillSource: 1,
			pipFillSource: 1,
		})),

		// ── downstream keyers (array indexed 0..dskCount-1) ──────────────
		dsk: Array.from({ length: caps.dskCount }, () => ({
			enabled: false,
			onAir: false,
			fillSource: 0,
			keySource: 0,
			rate: 0.5,
		})),

		// ── streaming ────────────────────────────────────────────────────
		streaming: {
			liveStatus: 0, // 0=off, 1=on, 2=abnormal
			streams: Array.from({ length: caps.streamCount }, () => ({
				enabled: false,
				status: 0,
				serviceName: '',
				url: '',
			})),
			bitrate: 0,
		},

		// ── recording ────────────────────────────────────────────────────
		record: {
			status: 0, // 0=stopped, 1=PGM recording, 2=ISO recording
			format: 0, // 0=h264, 1=h265
			duration: 0, // seconds
			durationStr: '00:00:00',
			free: 0,
		},

		// ── audio mixer ──────────────────────────────────────────────────
		audio: {
			inputs: {}, // keyed by sourceId: { enable, fader, afv, panning }
			headphone: 2301,
			switchType: 0,
		},

		// ── macro ────────────────────────────────────────────────────────
		macro: {
			runIndex: -1,
			running: false,
			recordIndex: -1,
			recording: false,
			macros: {}, // keyed by index: { name }
		},

		// ── playback ─────────────────────────────────────────────────────
		playback: {
			players: Array.from({ length: caps.playCount }, () => ({
				status: 0,
				mode: 0,
				repeat: false,
			})),
		},

		// ── multiview / multi-source ──────────────────────────────────────
		multiSource: {
			style: 0,
			windows: Array.from({ length: caps.multiSourceWindowCount }, () => ({ source: 0 })),
		},
	}
}

/**
 * Process one incoming command (from a Push message) and update the given state.
 * Returns { changed: bool, needReinit: bool }
 * - changed    : some state variable was updated (triggers variable/feedback refresh)
 * - needReinit : action/feedback/preset definitions need rebuilt (e.g. key count changed)
 */
function handleCommand(state, cmd) {
	// Accept both push (unsolicited) and res (response to a GET)
	if (cmd.type !== ReqType.Push && cmd.type !== ReqType.Get && cmd.type !== ReqType.Res)
		return { changed: false, needReinit: false }

	const v = cmd.value
	let changed = true
	let needReinit = false

	switch (cmd.id) {
		// ── Device / Caps ──────────────────────────────────────────────
		case 'deviceType': {
			// Raw protocol value → our Model enum
			// 0=Deck, 1=Duet, 10=Duet8ISO (device sends decimal 10, not 0x10)
			const rawType = Number(v[0])
			let detectedModel = state.device.modelId
			if (rawType === 0) detectedModel = Model.Deck
			else if (rawType === 1) detectedModel = Model.Duet
			else if (rawType === 10) detectedModel = Model.Duet8ISO
			if (detectedModel !== state.device.modelId) {
				const newCaps = getDefaultCaps(detectedModel)
				state.device.modelId = detectedModel
				state.device.recordISO = newCaps.recordISO
				state.device.audioMixEffect = newCaps.audioMixEffect
				needReinit = true
			}
			break
		}
		case 'keyCount': {
			const n = Number(v[0])
			if (state.device.keyCount !== n) {
				state.device.keyCount = n
				// Resize usk array
				while (state.usk.length < n) {
					state.usk.push({
						keyType: 0,
						enabled: false,
						onAir: false,
						lumaFillSource: 1,
						lumaKeySource: 1,
						chromaFillSource: 1,
						patternFillSource: 1,
						pipFillSource: 1,
					})
				}
				state.usk.length = n
				needReinit = true
			}
			break
		}
		case 'dskCount': {
			const n = Number(v[0])
			if (state.device.dskCount !== n) {
				state.device.dskCount = n
				while (state.dsk.length < n)
					state.dsk.push({ enabled: false, onAir: false, fillSource: 0, keySource: 0, rate: 0.5 })
				state.dsk.length = n
				needReinit = true
			}
			break
		}
		case 'streamCount': {
			const n = Number(v[0])
			if (state.device.streamCount !== n) {
				state.device.streamCount = n
				while (state.streaming.streams.length < n)
					state.streaming.streams.push({ enabled: false, status: 0, serviceName: '', url: '' })
				state.streaming.streams.length = n
				needReinit = true
			}
			break
		}

		// ── Mix Effect ─────────────────────────────────────────────────
		case 'pgmIndex':
			state.effect.pgmIndex = Number(v[0])
			break
		case 'pvwIndex':
			state.effect.pvwIndex = Number(v[0])
			break
		case 'transitionStyle':
			state.effect.transitionStyle = Number(v[0])
			break
		case 'transitionRate':
			state.effect.transitionRate = Number(v[0])
			break
		case 'transitionStatus':
			state.effect.transitionStatus = Number(v[0])
			break
		case 'previewTransition':
			state.effect.previewTransition = Boolean(v[0])
			break
		case 'ftbStatus':
			state.effect.ftbStatus = Number(v[0])
			break
		case 'ftbRate':
			state.effect.ftbRate = Number(v[0])
			break
		case 'ftbAfv':
			state.effect.ftbAfv = Boolean(v[0])
			break
		case 'transitionMixRate':
			state.effect.transitionMixRate = Number(v[0])
			break
		case 'transitionDipRate':
			state.effect.transitionDipRate = Number(v[0])
			break
		case 'transitionWipeRate':
			state.effect.transitionWipeRate = Number(v[0])
			break
		case 'transitionDipFillSource':
			state.effect.transitionDipFillSource = Number(v[0])
			break
		case 'transitionWipeFillSource':
			state.effect.transitionWipeFillSource = Number(v[0])
			break
		case 'transitionWipePatternIndex':
			state.effect.transitionWipePatternIndex = Number(v[0])
			break

		// ── USK ────────────────────────────────────────────────────────
		case 'keyType': {
			const idx = Number(v[0])
			if (state.usk[idx]) state.usk[idx].keyType = Number(v[1])
			break
		}
		case 'keyEnable':
		case 'keyOnAir': {
			const idx = Number(v[0])
			if (state.usk[idx]) {
				state.usk[idx].enabled = Boolean(v[1])
				state.usk[idx].onAir = Boolean(v[1])
			}
			break
		}
		case 'lumaFillSource': {
			const idx = Number(v[0])
			if (state.usk[idx]) state.usk[idx].lumaFillSource = Number(v[1])
			break
		}
		case 'lumaKeySource': {
			const idx = Number(v[0])
			if (state.usk[idx]) state.usk[idx].lumaKeySource = Number(v[1])
			break
		}
		case 'chromaFillSource': {
			const idx = Number(v[0])
			if (state.usk[idx]) state.usk[idx].chromaFillSource = Number(v[1])
			break
		}
		case 'patternFillSource': {
			const idx = Number(v[0])
			if (state.usk[idx]) state.usk[idx].patternFillSource = Number(v[1])
			break
		}
		case 'pipFillSource': {
			const idx = Number(v[0])
			if (state.usk[idx]) state.usk[idx].pipFillSource = Number(v[1])
			break
		}

		// ── DSK ────────────────────────────────────────────────────────
		case 'dskEnable':
		case 'dskOnAir': {
			const idx = Number(v[0])
			if (state.dsk[idx]) {
				state.dsk[idx].enabled = Boolean(v[1])
				state.dsk[idx].onAir = Boolean(v[1])
			}
			break
		}
		case 'dskFillSource': {
			const idx = Number(v[0])
			if (state.dsk[idx]) state.dsk[idx].fillSource = Number(v[1])
			break
		}
		case 'dskKeySource': {
			const idx = Number(v[0])
			if (state.dsk[idx]) state.dsk[idx].keySource = Number(v[1])
			break
		}
		case 'dskRate': {
			const idx = Number(v[0])
			if (state.dsk[idx]) state.dsk[idx].rate = Number(v[1])
			break
		}

		// ── Streaming ──────────────────────────────────────────────────
		case 'live':
			state.streaming.liveStatus = Number(v[0])
			break
		case 'liveStreamOutputEnable': {
			const idx = Number(v[0])
			if (state.streaming.streams[idx]) state.streaming.streams[idx].enabled = Boolean(v[1])
			break
		}
		case 'liveStreamOutputStatus': {
			const idx = Number(v[0])
			if (state.streaming.streams[idx]) state.streaming.streams[idx].status = Number(v[1])
			break
		}
		case 'liveStreamOutputServiceName': {
			const idx = Number(v[0])
			if (state.streaming.streams[idx]) state.streaming.streams[idx].serviceName = String(v[1] ?? '')
			break
		}
		case 'liveStreamOutputUrl': {
			const idx = Number(v[0])
			if (state.streaming.streams[idx]) state.streaming.streams[idx].url = String(v[1] ?? '')
			break
		}
		case 'liveStreamOutputBitrate':
			state.streaming.bitrate = Number(v[0])
			break

		// ── Recording ──────────────────────────────────────────────────
		case 'recordStatus':
			state.record.status = Number(v[0])
			break
		case 'recordFormat':
			state.record.format = Number(v[0])
			break
		case 'recordDuration': {
			const secs = Number(v[0])
			state.record.duration = secs
			const hh = String(Math.floor(secs / 3600)).padStart(2, '0')
			const mm = String(Math.floor((secs % 3600) / 60)).padStart(2, '0')
			const ss = String(secs % 60).padStart(2, '0')
			state.record.durationStr = `${hh}:${mm}:${ss}`
			break
		}
		case 'recordFree':
			state.record.free = Number(v[0])
			break

		// ── Audio ──────────────────────────────────────────────────────
		case 'audioMixerEnable': {
			const src = Number(v[0])
			if (!state.audio.inputs[src]) state.audio.inputs[src] = {}
			state.audio.inputs[src].enable = Boolean(v[1])
			break
		}
		case 'audioMixerFader': {
			const src = Number(v[0])
			if (!state.audio.inputs[src]) state.audio.inputs[src] = {}
			state.audio.inputs[src].fader = Number(v[1])
			break
		}
		case 'AudioMixerAFVEnable': {
			const src = Number(v[0])
			if (!state.audio.inputs[src]) state.audio.inputs[src] = {}
			state.audio.inputs[src].afv = Number(v[1])
			break
		}
		case 'audioMixerPanning': {
			const src = Number(v[0])
			if (!state.audio.inputs[src]) state.audio.inputs[src] = {}
			state.audio.inputs[src].panning = Number(v[1])
			break
		}
		case 'audioMixerHeadphone':
			state.audio.headphone = Number(v[0])
			break
		case 'audioMixerSwitchType':
			state.audio.switchType = Number(v[0])
			break

		// ── Macro ──────────────────────────────────────────────────────
		case 'macroRunIndex':
			state.macro.runIndex = Number(v[0])
			state.macro.running = true
			break
		case 'macroRunStop':
			state.macro.running = false
			state.macro.runIndex = -1
			break
		case 'macroRecordIndex':
			state.macro.recordIndex = Number(v[0])
			state.macro.recording = true
			break
		case 'macroRecordStop':
			state.macro.recording = false
			state.macro.recordIndex = -1
			break
		case 'macroInfo': {
			const idx = Number(v[0])
			const name = String(v[1] ?? '')
			state.macro.macros[idx] = { name }
			break
		}

		// ── Playback ───────────────────────────────────────────────────
		case 'playStatus': {
			const idx = Number(v[0])
			if (state.playback.players[idx]) state.playback.players[idx].status = Number(v[1])
			break
		}
		case 'playbackMode': {
			const idx = Number(v[0])
			if (state.playback.players[idx]) state.playback.players[idx].mode = Number(v[1])
			break
		}
		case 'playRepeat': {
			const idx = Number(v[0])
			if (state.playback.players[idx]) state.playback.players[idx].repeat = Boolean(v[1])
			break
		}

		// ── Multi Source ───────────────────────────────────────────────
		case 'multiSourceStyle':
			state.multiSource.style = Number(v[0])
			break

		default:
			changed = false
			break
	}

	return { changed, needReinit }
}

module.exports = { createState, handleCommand }
