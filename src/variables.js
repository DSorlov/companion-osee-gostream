'use strict'

const { sourceName } = require('./model')

/**
 * Return stream status label
 */
function streamStatusLabel(status) {
	switch (status) {
		case 1:
			return 'On Air'
		case 2:
			return 'Abnormal'
		default:
			return 'Off'
	}
}

/**
 * Define all variable definitions (called once / on reinit)
 */
module.exports = function UpdateVariableDefinitions(self) {
	const state = self.getState()
	const defs = [
		// Mix effect
		{ variableId: 'pgm_source', name: 'PGM Source Name' },
		{ variableId: 'pgm_source_id', name: 'PGM Source ID' },
		{ variableId: 'pvw_source', name: 'PVW Source Name' },
		{ variableId: 'pvw_source_id', name: 'PVW Source ID' },
		{ variableId: 'transition_style', name: 'Transition Style' },
		{ variableId: 'transition_rate', name: 'Transition Rate (s)' },
		{ variableId: 'ftb_status', name: 'Fade to Black Status' },
		{ variableId: 'transition_running', name: 'Transition Running' },

		// Recording
		{ variableId: 'record_status', name: 'Recording Status' },
		{ variableId: 'record_duration', name: 'Recording Duration (s)' },
		{ variableId: 'record_duration_hm', name: 'Recording Duration (HH:MM:SS)' },
		{ variableId: 'record_free', name: 'Recording Free Space (MB)' },

		// Live
		{ variableId: 'live_status', name: 'Live Streaming Status' },
	]

	// USK variables (one per key)
	for (let i = 0; i < state.device.keyCount; i++) {
		defs.push({ variableId: `usk_${i + 1}_on_air`, name: `USK ${i + 1} On Air` })
		defs.push({ variableId: `usk_${i + 1}_key_type`, name: `USK ${i + 1} Key Type` })
	}

	// DSK variables (one per DSK)
	for (let i = 0; i < state.device.dskCount; i++) {
		defs.push({ variableId: `dsk_${i + 1}_on_air`, name: `DSK ${i + 1} On Air` })
	}

	// Stream variables (one per stream)
	for (let i = 0; i < state.device.streamCount; i++) {
		defs.push({ variableId: `stream_${i + 1}_status`, name: `Stream ${i + 1} Status` })
		defs.push({ variableId: `stream_${i + 1}_enabled`, name: `Stream ${i + 1} Enabled` })
	}

	// Macro
	defs.push({ variableId: 'macro_running', name: 'Macro Running' })
	defs.push({ variableId: 'macro_run_index', name: 'Macro Run Index (1-based)' })

	// Playback
	for (let i = 0; i < state.device.playCount; i++) {
		defs.push({ variableId: `player_${i + 1}_status`, name: `Player ${i + 1} Status` })
	}

	self.setVariableDefinitions(defs)

	// Populate initial values immediately
	updateVariableValues(self)
}

/**
 * Push current state values to all defined variables.
 * Called after every state change.
 */
function updateVariableValues(self) {
	const state = self.getState()
	const modelId = state.device.modelId

	const styleLabels = ['Mix', 'Dip', 'Wipe']

	const vals = {
		pgm_source: sourceName(state.effect.pgmIndex, modelId),
		pgm_source_id: state.effect.pgmIndex,
		pvw_source: sourceName(state.effect.pvwIndex, modelId),
		pvw_source_id: state.effect.pvwIndex,
		transition_style: styleLabels[state.effect.transitionStyle] ?? 'Unknown',
		transition_rate: state.effect.transitionRate,
		ftb_status: state.effect.ftbStatus === 1 ? 'Active' : 'Off',
		transition_running: state.effect.transitionStatus === 1 ? 'Yes' : 'No',

		// Recording
		record_status:
			state.record.status === 2 ? 'ISO Recording' : state.record.status === 1 ? 'PGM Recording' : 'Stopped',
		record_duration: state.record.duration,
		record_duration_hm: state.record.durationStr,
		record_free: state.record.free,

		// Live
		live_status: streamStatusLabel(state.streaming.liveStatus),

		// Macro
		macro_running: state.macro.running ? 'Yes' : 'No',
		macro_run_index: state.macro.running ? state.macro.runIndex + 1 : 0,
	}

	// USK
	for (let i = 0; i < state.device.keyCount; i++) {
		const key = state.usk[i] ?? {}
		vals[`usk_${i + 1}_on_air`] = key.onAir ? 'On Air' : 'Off'
		const ktLabels = ['Luma', 'Chroma', 'Pattern', 'PIP']
		vals[`usk_${i + 1}_key_type`] = ktLabels[key.keyType ?? 0] ?? 'Unknown'
	}

	// DSK
	for (let i = 0; i < state.device.dskCount; i++) {
		const dsk = state.dsk[i] ?? {}
		vals[`dsk_${i + 1}_on_air`] = dsk.onAir ? 'On Air' : 'Off'
	}

	// Streams
	for (let i = 0; i < state.device.streamCount; i++) {
		const stream = state.streaming.streams[i] ?? {}
		vals[`stream_${i + 1}_status`] = streamStatusLabel(stream.status ?? 0)
		vals[`stream_${i + 1}_enabled`] = stream.enabled ? 'Enabled' : 'Disabled'
	}

	// Playback
	for (let i = 0; i < state.device.playCount; i++) {
		const player = state.playback.players[i] ?? {}
		vals[`player_${i + 1}_status`] = player.status === 1 ? 'Playing' : 'Stopped'
	}

	self.setVariableValues(vals)
}

module.exports.updateVariableValues = updateVariableValues
