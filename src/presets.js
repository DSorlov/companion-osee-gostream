'use strict'

const { combineRgb } = require('@companion-module/base')
const { getSourceChoices, getUSKChoices, getDSKChoices, getStreamChoices } = require('./choices')

const C = {
	WHITE: combineRgb(255, 255, 255),
	BLACK: combineRgb(0, 0, 0),
	RED: combineRgb(255, 0, 0),
	GREEN: combineRgb(0, 180, 0),
	YELLOW: combineRgb(255, 255, 0),
	ORANGE: combineRgb(255, 128, 0),
	DARK_GREY: combineRgb(50, 50, 50),
}

module.exports = function UpdatePresets(self) {
	const state = self.getState()
	const presets = {}

	// ── PVW Source buttons ───────────────────────────────────────────────────
	for (const src of getSourceChoices(state)) {
		presets[`pvw_${src.id}`] = {
			type: 'button',
			category: 'PVW Sources',
			name: `Set PVW: ${src.label}`,
			style: {
				text: src.label,
				size: '18',
				color: C.WHITE,
				bgcolor: C.DARK_GREY,
			},
			feedbacks: [
				{
					feedbackId: 'pvw_source',
					options: { source: src.id },
					style: {
						bgcolor: C.GREEN,
						color: C.BLACK,
					},
				},
			],
			steps: [
				{
					down: [{ actionId: 'pvw_source', options: { source: src.id } }],
					up: [],
				},
			],
		}
	}

	// ── PGM Source buttons ───────────────────────────────────────────────────
	for (const src of getSourceChoices(state)) {
		presets[`pgm_${src.id}`] = {
			type: 'button',
			category: 'PGM Sources',
			name: `Set PGM: ${src.label}`,
			style: {
				text: src.label,
				size: '18',
				color: C.WHITE,
				bgcolor: C.DARK_GREY,
			},
			feedbacks: [
				{
					feedbackId: 'pgm_source',
					options: { source: src.id },
					style: {
						bgcolor: C.RED,
						color: C.WHITE,
					},
				},
			],
			steps: [
				{
					down: [{ actionId: 'pgm_source', options: { source: src.id } }],
					up: [],
				},
			],
		}
	}

	// ── Transition controls ───────────────────────────────────────────────────

	presets.auto_transition = {
		type: 'button',
		category: 'Transitions',
		name: 'AUTO Transition',
		style: {
			text: 'AUTO',
			size: '24',
			color: C.WHITE,
			bgcolor: combineRgb(0, 0, 128),
		},
		feedbacks: [
			{
				feedbackId: 'transition_running',
				options: {},
				style: {
					bgcolor: C.ORANGE,
					color: C.WHITE,
				},
			},
		],
		steps: [
			{
				down: [{ actionId: 'auto_transition', options: {} }],
				up: [],
			},
		],
	}

	presets.cut_transition = {
		type: 'button',
		category: 'Transitions',
		name: 'CUT Transition',
		style: {
			text: 'CUT',
			size: '24',
			color: C.WHITE,
			bgcolor: combineRgb(128, 0, 0),
		},
		feedbacks: [],
		steps: [
			{
				down: [{ actionId: 'cut_transition', options: {} }],
				up: [],
			},
		],
	}

	presets.ftb = {
		type: 'button',
		category: 'Transitions',
		name: 'Fade to Black',
		style: {
			text: 'FTB',
			size: '18',
			color: C.WHITE,
			bgcolor: C.DARK_GREY,
		},
		feedbacks: [
			{
				feedbackId: 'ftb_active',
				options: {},
				style: {
					bgcolor: C.BLACK,
					color: C.WHITE,
				},
			},
		],
		steps: [
			{
				down: [{ actionId: 'ftb', options: { enable: 2 } }],
				up: [],
			},
		],
	}

	// Transition style buttons
	const transStyles = [
		{ id: 0, label: 'MIX' },
		{ id: 1, label: 'DIP' },
		{ id: 2, label: 'WIPE' },
	]
	for (const style of transStyles) {
		presets[`trans_style_${style.id}`] = {
			type: 'button',
			category: 'Transitions',
			name: `Transition: ${style.label}`,
			style: {
				text: style.label,
				size: '18',
				color: C.WHITE,
				bgcolor: C.DARK_GREY,
			},
			feedbacks: [
				{
					feedbackId: 'transition_style',
					options: { style: style.id },
					style: {
						bgcolor: C.YELLOW,
						color: C.BLACK,
					},
				},
			],
			steps: [
				{
					down: [{ actionId: 'transition_style', options: { style: style.id } }],
					up: [],
				},
			],
		}
	}

	// ── USK buttons ──────────────────────────────────────────────────────────

	for (const key of getUSKChoices(state)) {
		presets[`usk_onair_${key.id}`] = {
			type: 'button',
			category: 'Keys (USK)',
			name: `${key.label} On Air`,
			style: {
				text: `${key.label}\nOn Air`,
				size: '14',
				color: C.WHITE,
				bgcolor: C.DARK_GREY,
			},
			feedbacks: [
				{
					feedbackId: 'usk_on_air',
					options: { key: key.id },
					style: {
						bgcolor: C.YELLOW,
						color: C.BLACK,
					},
				},
			],
			steps: [
				{
					down: [{ actionId: 'usk_on_air', options: { key: key.id, enable: 2 } }],
					up: [],
				},
			],
		}
	}

	// ── DSK buttons ──────────────────────────────────────────────────────────

	for (const dsk of getDSKChoices(state)) {
		presets[`dsk_onair_${dsk.id}`] = {
			type: 'button',
			category: 'Keys (DSK)',
			name: `${dsk.label} On Air`,
			style: {
				text: `${dsk.label}\nOn Air`,
				size: '14',
				color: C.WHITE,
				bgcolor: C.DARK_GREY,
			},
			feedbacks: [
				{
					feedbackId: 'dsk_on_air',
					options: { dsk: dsk.id },
					style: {
						bgcolor: C.YELLOW,
						color: C.BLACK,
					},
				},
			],
			steps: [
				{
					down: [{ actionId: 'dsk_on_air', options: { dsk: dsk.id, enable: 2 } }],
					up: [],
				},
			],
		}
	}

	// ── Streaming buttons ─────────────────────────────────────────────────────

	presets.go_live = {
		type: 'button',
		category: 'Streaming',
		name: 'Go Live',
		style: {
			text: 'LIVE',
			size: '24',
			color: C.WHITE,
			bgcolor: C.DARK_GREY,
		},
		feedbacks: [
			{
				feedbackId: 'live_on_air',
				options: {},
				style: {
					bgcolor: C.RED,
					color: C.WHITE,
				},
			},
		],
		steps: [
			{
				down: [{ actionId: 'live', options: { enable: 2 } }],
				up: [],
			},
		],
	}

	for (const stream of getStreamChoices(state)) {
		presets[`stream_${stream.id}`] = {
			type: 'button',
			category: 'Streaming',
			name: `${stream.label} Toggle`,
			style: {
				text: stream.label,
				size: '18',
				color: C.WHITE,
				bgcolor: C.DARK_GREY,
			},
			feedbacks: [
				{
					feedbackId: 'stream_enabled',
					options: { stream: stream.id },
					style: {
						bgcolor: C.YELLOW,
						color: C.BLACK,
					},
				},
			],
			steps: [
				{
					down: [{ actionId: 'stream_enable', options: { stream: stream.id, enable: 2 } }],
					up: [],
				},
			],
		}
	}

	// ── Recording button ──────────────────────────────────────────────────────

	presets.record_toggle = {
		type: 'button',
		category: 'Recording',
		name: 'Record Start/Stop',
		style: {
			text: '$(osee-gostream:record_duration_hm)',
			size: '14',
			color: C.WHITE,
			bgcolor: C.DARK_GREY,
		},
		feedbacks: [
			{
				feedbackId: 'recording',
				options: {},
				style: {
					bgcolor: C.RED,
					color: C.WHITE,
				},
			},
		],
		steps: [
			{
				down: [{ actionId: 'record_toggle', options: {} }],
				up: [],
			},
		],
	}

	// ── Macro buttons (first 10) ──────────────────────────────────────────────

	for (let i = 0; i < 10; i++) {
		presets[`macro_run_${i}`] = {
			type: 'button',
			category: 'Macros',
			name: `Run Macro ${i + 1}`,
			style: {
				text: `Macro ${i + 1}`,
				size: '14',
				color: C.WHITE,
				bgcolor: C.DARK_GREY,
			},
			feedbacks: [
				{
					feedbackId: 'macro_index_running',
					options: { macro: i + 1 },
					style: {
						bgcolor: C.ORANGE,
						color: C.WHITE,
					},
				},
			],
			steps: [
				{
					down: [{ actionId: 'macro_run', options: { macro: i } }],
					up: [],
				},
			],
		}
	}

	// ── Audio: Mute/Unmute first 4 inputs ────────────────────────────────────

	for (let i = 1; i <= 4; i++) {
		presets[`audio_enable_in${i}`] = {
			type: 'button',
			category: 'Audio',
			name: `Audio IN${i} Enable`,
			style: {
				text: `IN${i}\nAudio`,
				size: '14',
				color: C.WHITE,
				bgcolor: C.DARK_GREY,
			},
			feedbacks: [
				{
					feedbackId: 'audio_input_enabled',
					options: { source: i },
					style: {
						bgcolor: C.GREEN,
						color: C.WHITE,
					},
				},
			],
			steps: [
				{
					down: [{ actionId: 'audio_enable', options: { source: i, enable: 2 } }],
					up: [],
				},
			],
		}
	}

	self.setPresetDefinitions(presets)
}
