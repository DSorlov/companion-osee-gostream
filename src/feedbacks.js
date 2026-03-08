'use strict'

const { combineRgb } = require('@companion-module/base')
const {
	getSourceChoices,
	getUSKChoices,
	getDSKChoices,
	getStreamChoices,
	TransitionStyleChoices,
	KeyTypeChoices,
	getAudioInputChoices,
	getPlayerChoices,
} = require('./choices')

// Common colour palette
const COLOR_RED = combineRgb(255, 0, 0)
const COLOR_GREEN = combineRgb(0, 204, 0)
const COLOR_YELLOW = combineRgb(255, 255, 0)
const COLOR_ORANGE = combineRgb(255, 128, 0)
const COLOR_WHITE = combineRgb(255, 255, 255)
const COLOR_BLACK = combineRgb(0, 0, 0)

module.exports = function UpdateFeedbacks(self) {
	const state = self.getState()

	self.setFeedbackDefinitions({
		// ── Mix Effect ─────────────────────────────────────────────────────────

		pgm_source: {
			name: 'Mix Effect: PGM Source Active',
			type: 'boolean',
			label: 'When the selected source is on PGM',
			defaultStyle: {
				bgcolor: COLOR_RED,
				color: COLOR_WHITE,
			},
			options: [
				{
					id: 'source',
					type: 'dropdown',
					label: 'Source',
					choices: getSourceChoices(state),
					default: getSourceChoices(state)[0]?.id ?? 1,
				},
			],
			callback: (feedback) => {
				return state.effect.pgmIndex === Number(feedback.options.source)
			},
		},

		pvw_source: {
			name: 'Mix Effect: PVW Source Active',
			type: 'boolean',
			label: 'When the selected source is on PVW',
			defaultStyle: {
				bgcolor: COLOR_GREEN,
				color: COLOR_BLACK,
			},
			options: [
				{
					id: 'source',
					type: 'dropdown',
					label: 'Source',
					choices: getSourceChoices(state),
					default: getSourceChoices(state)[0]?.id ?? 1,
				},
			],
			callback: (feedback) => {
				return state.effect.pvwIndex === Number(feedback.options.source)
			},
		},

		transition_style: {
			name: 'Mix Effect: Transition Style Active',
			type: 'boolean',
			label: 'When the selected transition style is active',
			defaultStyle: {
				bgcolor: COLOR_YELLOW,
				color: COLOR_BLACK,
			},
			options: [
				{
					id: 'style',
					type: 'dropdown',
					label: 'Style',
					choices: TransitionStyleChoices,
					default: 0,
				},
			],
			callback: (feedback) => {
				return state.effect.transitionStyle === Number(feedback.options.style)
			},
		},

		transition_running: {
			name: 'Mix Effect: Transition Running',
			type: 'boolean',
			label: 'While a transition is in progress',
			defaultStyle: {
				bgcolor: COLOR_ORANGE,
				color: COLOR_WHITE,
			},
			options: [],
			callback: () => {
				return state.effect.transitionStatus === 1
			},
		},

		ftb_active: {
			name: 'Mix Effect: Fade to Black Active',
			type: 'boolean',
			label: 'While Fade to Black is active',
			defaultStyle: {
				bgcolor: COLOR_BLACK,
				color: COLOR_WHITE,
			},
			options: [],
			callback: () => {
				return state.effect.ftbStatus === 1
			},
		},

		preview_transition: {
			name: 'Mix Effect: Preview Transition Enabled',
			type: 'boolean',
			label: 'When Preview Transition is enabled',
			defaultStyle: {
				bgcolor: COLOR_YELLOW,
				color: COLOR_BLACK,
			},
			options: [],
			callback: () => {
				return Boolean(state.effect.previewTransition)
			},
		},

		// ── Upstream Keyer ─────────────────────────────────────────────────────

		usk_on_air: {
			name: 'USK: On Air',
			type: 'boolean',
			label: 'When a USK is on air',
			defaultStyle: {
				bgcolor: COLOR_YELLOW,
				color: COLOR_BLACK,
			},
			options: [
				{
					id: 'key',
					type: 'dropdown',
					label: 'Key',
					choices: getUSKChoices(state),
					default: 0,
				},
			],
			callback: (feedback) => {
				const idx = Number(feedback.options.key)
				return state.usk[idx]?.onAir ?? false
			},
		},

		usk_key_type: {
			name: 'USK: Key Type Active',
			type: 'boolean',
			label: 'When a USK has the specified key type',
			defaultStyle: {
				bgcolor: COLOR_YELLOW,
				color: COLOR_BLACK,
			},
			options: [
				{
					id: 'key',
					type: 'dropdown',
					label: 'Key',
					choices: getUSKChoices(state),
					default: 0,
				},
				{
					id: 'keyType',
					type: 'dropdown',
					label: 'Key Type',
					choices: KeyTypeChoices,
					default: 0,
				},
			],
			callback: (feedback) => {
				const idx = Number(feedback.options.key)
				return (state.usk[idx]?.keyType ?? 0) === Number(feedback.options.keyType)
			},
		},

		// ── Downstream Keyer ───────────────────────────────────────────────────

		dsk_on_air: {
			name: 'DSK: On Air',
			type: 'boolean',
			label: 'When a DSK is on air',
			defaultStyle: {
				bgcolor: COLOR_YELLOW,
				color: COLOR_BLACK,
			},
			options: [
				{
					id: 'dsk',
					type: 'dropdown',
					label: 'DSK',
					choices: getDSKChoices(state),
					default: 0,
				},
			],
			callback: (feedback) => {
				const idx = Number(feedback.options.dsk)
				return state.dsk[idx]?.onAir ?? false
			},
		},

		// ── Streaming ──────────────────────────────────────────────────────────

		live_on_air: {
			name: 'Streaming: Live On Air',
			type: 'boolean',
			label: 'While the device is live on air',
			defaultStyle: {
				bgcolor: COLOR_RED,
				color: COLOR_WHITE,
			},
			options: [],
			callback: () => {
				return state.streaming.liveStatus === 1
			},
		},

		stream_enabled: {
			name: 'Streaming: Stream Enabled',
			type: 'boolean',
			label: 'When a specific stream is enabled',
			defaultStyle: {
				bgcolor: COLOR_YELLOW,
				color: COLOR_BLACK,
			},
			options: [
				{
					id: 'stream',
					type: 'dropdown',
					label: 'Stream',
					choices: getStreamChoices(state),
					default: 0,
				},
			],
			callback: (feedback) => {
				const idx = Number(feedback.options.stream)
				return state.streaming.streams[idx]?.enabled ?? false
			},
		},

		stream_status: {
			name: 'Streaming: Stream Status',
			type: 'boolean',
			label: 'When a stream has the selected status',
			defaultStyle: {
				bgcolor: COLOR_RED,
				color: COLOR_WHITE,
			},
			options: [
				{
					id: 'stream',
					type: 'dropdown',
					label: 'Stream',
					choices: getStreamChoices(state),
					default: 0,
				},
				{
					id: 'status',
					type: 'dropdown',
					label: 'Status',
					choices: [
						{ id: 0, label: 'Off' },
						{ id: 1, label: 'On Air' },
						{ id: 2, label: 'Abnormal' },
					],
					default: 1,
				},
			],
			callback: (feedback) => {
				const idx = Number(feedback.options.stream)
				return (state.streaming.streams[idx]?.status ?? 0) === Number(feedback.options.status)
			},
		},

		// ── Recording ─────────────────────────────────────────────────────────

		recording: {
			name: 'Recording: Active',
			type: 'boolean',
			label: 'While recording is active',
			defaultStyle: {
				bgcolor: COLOR_RED,
				color: COLOR_WHITE,
			},
			options: [],
			callback: () => {
				return state.record.status !== 0
			},
		},

		// ── Macro ─────────────────────────────────────────────────────────────

		macro_running: {
			name: 'Macro: Running',
			type: 'boolean',
			label: 'While a macro is running',
			defaultStyle: {
				bgcolor: COLOR_ORANGE,
				color: COLOR_WHITE,
			},
			options: [],
			callback: () => {
				return state.macro.running
			},
		},

		macro_index_running: {
			name: 'Macro: Specific Macro Running',
			type: 'boolean',
			label: 'While the specified macro is running',
			defaultStyle: {
				bgcolor: COLOR_ORANGE,
				color: COLOR_WHITE,
			},
			options: [
				{
					id: 'macro',
					type: 'number',
					label: 'Macro Number (1-based)',
					default: 1,
					min: 1,
					max: 100,
				},
			],
			callback: (feedback) => {
				return state.macro.running && state.macro.runIndex === Number(feedback.options.macro) - 1
			},
		},

		// ── Audio ─────────────────────────────────────────────────────────────

		audio_input_enabled: {
			name: 'Audio: Input Enabled',
			type: 'boolean',
			label: 'When an audio input is enabled',
			defaultStyle: {
				bgcolor: COLOR_GREEN,
				color: COLOR_WHITE,
			},
			options: [
				{
					id: 'source',
					type: 'dropdown',
					label: 'Input Source',
					choices: getAudioInputChoices(state),
					default: 1,
				},
			],
			callback: (feedback) => {
				const src = Number(feedback.options.source)
				return Boolean(state.audio.inputs[src]?.enable)
			},
		},

		// ── Playback ──────────────────────────────────────────────────────────

		playback_playing: {
			name: 'Playback: Playing',
			type: 'boolean',
			label: 'While a player is playing',
			defaultStyle: {
				bgcolor: COLOR_GREEN,
				color: COLOR_WHITE,
			},
			options: [
				{
					id: 'player',
					type: 'dropdown',
					label: 'Player',
					choices: getPlayerChoices(state),
					default: 0,
				},
			],
			callback: (feedback) => {
				const idx = Number(feedback.options.player)
				return (state.playback.players[idx]?.status ?? 0) === 1
			},
		},
	})
}
