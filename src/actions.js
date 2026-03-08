'use strict'

const { ReqType } = require('./protocol')
const {
	SwitchChoices,
	EnableChoices,
	TransitionStyleChoices,
	KeyTypeChoices,
	WipePatternChoices,
	AudioAfvChoices,
	AudioSwitchTypeChoices,
	RecordFormatChoices,
	getSourceChoices,
	getKeyerSourceChoices,
	getUSKChoices,
	getDSKChoices,
	getStreamChoices,
	getPlayerChoices,
	getMacroChoices,
	getMultiSourceWindowChoices,
	getAudioInputChoices,
	MultiSourceStyleChoices,
} = require('./choices')

/**
 * Toggle helper: given current boolean value and a 0/1/2 option,
 * returns the value to send.  2 = toggle.
 */
function resolveToggle(optValue, currentBool) {
	if (optValue === 2) return currentBool ? 0 : 1
	return optValue
}

module.exports = function UpdateActions(self) {
	const state = self.getState()

	self.setActionDefinitions({
		// ── Mix Effect ───────────────────────────────────────────────────────

		pgm_source: {
			name: 'Mix Effect: Set PGM Source',
			options: [
				{
					id: 'source',
					type: 'dropdown',
					label: 'Source',
					choices: getSourceChoices(state),
					default: getSourceChoices(state)[0]?.id ?? 1,
				},
			],
			callback: async (action) => {
				await self.sendSet('pgmIndex', [action.options.source])
			},
		},

		pvw_source: {
			name: 'Mix Effect: Set PVW Source',
			options: [
				{
					id: 'source',
					type: 'dropdown',
					label: 'Source',
					choices: getSourceChoices(state),
					default: getSourceChoices(state)[0]?.id ?? 1,
				},
			],
			callback: async (action) => {
				await self.sendSet('pvwIndex', [action.options.source])
			},
		},

		auto_transition: {
			name: 'Mix Effect: AUTO Transition',
			options: [],
			callback: async () => {
				await self.sendCmds([{ id: 'autoTransition', type: ReqType.Set }])
			},
		},

		cut_transition: {
			name: 'Mix Effect: CUT Transition',
			options: [],
			callback: async () => {
				await self.sendCmds([{ id: 'cutTransition', type: ReqType.Set }])
			},
		},

		ftb: {
			name: 'Mix Effect: Fade to Black',
			options: [
				{
					id: 'enable',
					type: 'dropdown',
					label: 'Action',
					choices: SwitchChoices,
					default: 2,
				},
			],
			callback: async (action) => {
				const val = resolveToggle(action.options.enable, state.effect.ftbStatus === 1)
				await self.sendSet('ftb', [val])
			},
		},

		transition_style: {
			name: 'Mix Effect: Set Transition Style',
			options: [
				{
					id: 'style',
					type: 'dropdown',
					label: 'Style',
					choices: TransitionStyleChoices,
					default: 0,
				},
			],
			callback: async (action) => {
				await self.sendSet('transitionStyle', [action.options.style])
			},
		},

		transition_mix_rate: {
			name: 'Mix Effect: Set MIX Rate',
			options: [
				{
					id: 'rate',
					type: 'number',
					label: 'Rate (seconds)',
					default: 1.5,
					min: 0.5,
					max: 8.0,
					step: 0.1,
				},
			],
			callback: async (action) => {
				await self.sendSet('transitionMixRate', [action.options.rate])
			},
		},

		transition_dip_rate: {
			name: 'Mix Effect: Set DIP Rate',
			options: [
				{
					id: 'rate',
					type: 'number',
					label: 'Rate (seconds)',
					default: 1.0,
					min: 0.5,
					max: 8.0,
					step: 0.1,
				},
			],
			callback: async (action) => {
				await self.sendSet('transitionDipRate', [action.options.rate])
			},
		},

		transition_wipe_rate: {
			name: 'Mix Effect: Set WIPE Rate',
			options: [
				{
					id: 'rate',
					type: 'number',
					label: 'Rate (seconds)',
					default: 1.0,
					min: 0.5,
					max: 8.0,
					step: 0.1,
				},
			],
			callback: async (action) => {
				await self.sendSet('transitionWipeRate', [action.options.rate])
			},
		},

		wipe_pattern: {
			name: 'Mix Effect: Set WIPE Pattern',
			options: [
				{
					id: 'pattern',
					type: 'dropdown',
					label: 'Pattern',
					choices: WipePatternChoices,
					default: 0,
				},
			],
			callback: async (action) => {
				await self.sendSet('transitionWipePatternIndex', [action.options.pattern])
			},
		},

		ftb_rate: {
			name: 'Mix Effect: Set FTB Rate',
			options: [
				{
					id: 'rate',
					type: 'number',
					label: 'Rate (seconds)',
					default: 2.0,
					min: 0.5,
					max: 8.0,
					step: 0.1,
				},
			],
			callback: async (action) => {
				await self.sendSet('ftbRate', [action.options.rate])
			},
		},

		preview_transition: {
			name: 'Mix Effect: Preview Transition',
			options: [
				{
					id: 'enable',
					type: 'dropdown',
					label: 'Enable',
					choices: SwitchChoices,
					default: 2,
				},
			],
			callback: async (action) => {
				const val = resolveToggle(action.options.enable, state.effect.previewTransition)
				await self.sendSet('previewTransition', [val])
			},
		},

		// ── Upstream Keyer ───────────────────────────────────────────────────

		usk_on_air: {
			name: 'USK: On Air',
			options: [
				{
					id: 'key',
					type: 'dropdown',
					label: 'Key',
					choices: getUSKChoices(state),
					default: 0,
				},
				{
					id: 'enable',
					type: 'dropdown',
					label: 'Action',
					choices: SwitchChoices,
					default: 2,
				},
			],
			callback: async (action) => {
				const keyIdx = Number(action.options.key)
				const current = state.usk[keyIdx]?.onAir ?? false
				const val = resolveToggle(action.options.enable, current)
				await self.sendSet('keyOnAir', [keyIdx, val])
			},
		},

		usk_key_type: {
			name: 'USK: Set Key Type',
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
			callback: async (action) => {
				await self.sendSet('keyType', [action.options.key, action.options.keyType])
			},
		},

		usk_luma_fill: {
			name: 'USK: Set Luma Fill Source',
			options: [
				{
					id: 'key',
					type: 'dropdown',
					label: 'Key',
					choices: getUSKChoices(state),
					default: 0,
				},
				{
					id: 'source',
					type: 'dropdown',
					label: 'Fill Source',
					choices: getKeyerSourceChoices(state),
					default: getKeyerSourceChoices(state)[0]?.id ?? 1,
				},
			],
			callback: async (action) => {
				await self.sendSet('lumaFillSource', [action.options.key, action.options.source])
			},
		},

		usk_luma_key: {
			name: 'USK: Set Luma Key Source',
			options: [
				{
					id: 'key',
					type: 'dropdown',
					label: 'Key',
					choices: getUSKChoices(state),
					default: 0,
				},
				{
					id: 'source',
					type: 'dropdown',
					label: 'Key Source',
					choices: getKeyerSourceChoices(state),
					default: getKeyerSourceChoices(state)[0]?.id ?? 1,
				},
			],
			callback: async (action) => {
				await self.sendSet('lumaKeySource', [action.options.key, action.options.source])
			},
		},

		usk_chroma_fill: {
			name: 'USK: Set Chroma Fill Source',
			options: [
				{
					id: 'key',
					type: 'dropdown',
					label: 'Key',
					choices: getUSKChoices(state),
					default: 0,
				},
				{
					id: 'source',
					type: 'dropdown',
					label: 'Fill Source',
					choices: getKeyerSourceChoices(state),
					default: getKeyerSourceChoices(state)[0]?.id ?? 1,
				},
			],
			callback: async (action) => {
				await self.sendSet('chromaFillSource', [action.options.key, action.options.source])
			},
		},

		usk_pattern_fill: {
			name: 'USK: Set Pattern Fill Source',
			options: [
				{
					id: 'key',
					type: 'dropdown',
					label: 'Key',
					choices: getUSKChoices(state),
					default: 0,
				},
				{
					id: 'source',
					type: 'dropdown',
					label: 'Fill Source',
					choices: getKeyerSourceChoices(state),
					default: getKeyerSourceChoices(state)[0]?.id ?? 1,
				},
			],
			callback: async (action) => {
				await self.sendSet('patternFillSource', [action.options.key, action.options.source])
			},
		},

		usk_pip_fill: {
			name: 'USK: Set PIP Fill Source',
			options: [
				{
					id: 'key',
					type: 'dropdown',
					label: 'Key',
					choices: getUSKChoices(state),
					default: 0,
				},
				{
					id: 'source',
					type: 'dropdown',
					label: 'Fill Source',
					choices: getKeyerSourceChoices(state),
					default: getKeyerSourceChoices(state)[0]?.id ?? 1,
				},
			],
			callback: async (action) => {
				await self.sendSet('pipFillSource', [action.options.key, action.options.source])
			},
		},

		// ── Downstream Keyer ─────────────────────────────────────────────────

		dsk_on_air: {
			name: 'DSK: On Air',
			options: [
				{
					id: 'dsk',
					type: 'dropdown',
					label: 'DSK',
					choices: getDSKChoices(state),
					default: 0,
				},
				{
					id: 'enable',
					type: 'dropdown',
					label: 'Action',
					choices: SwitchChoices,
					default: 2,
				},
			],
			callback: async (action) => {
				const idx = Number(action.options.dsk)
				const current = state.dsk[idx]?.onAir ?? false
				const val = resolveToggle(action.options.enable, current)
				await self.sendSet('dskOnAir', [idx, val])
			},
		},

		dsk_fill_source: {
			name: 'DSK: Set Fill Source',
			options: [
				{
					id: 'dsk',
					type: 'dropdown',
					label: 'DSK',
					choices: getDSKChoices(state),
					default: 0,
				},
				{
					id: 'source',
					type: 'dropdown',
					label: 'Fill Source',
					choices: getKeyerSourceChoices(state),
					default: getKeyerSourceChoices(state)[0]?.id ?? 1,
				},
			],
			callback: async (action) => {
				await self.sendSet('dskFillSource', [action.options.dsk, action.options.source])
			},
		},

		dsk_key_source: {
			name: 'DSK: Set Key Source',
			options: [
				{
					id: 'dsk',
					type: 'dropdown',
					label: 'DSK',
					choices: getDSKChoices(state),
					default: 0,
				},
				{
					id: 'source',
					type: 'dropdown',
					label: 'Key Source',
					choices: getKeyerSourceChoices(state),
					default: getKeyerSourceChoices(state)[0]?.id ?? 1,
				},
			],
			callback: async (action) => {
				await self.sendSet('dskKeySource', [action.options.dsk, action.options.source])
			},
		},

		dsk_rate: {
			name: 'DSK: Set Rate',
			options: [
				{
					id: 'dsk',
					type: 'dropdown',
					label: 'DSK',
					choices: getDSKChoices(state),
					default: 0,
				},
				{
					id: 'rate',
					type: 'number',
					label: 'Rate (seconds)',
					default: 0.5,
					min: 0.5,
					max: 8.0,
					step: 0.1,
				},
			],
			callback: async (action) => {
				await self.sendSet('dskRate', [action.options.dsk, action.options.rate])
			},
		},

		// ── Streaming ────────────────────────────────────────────────────────

		live: {
			name: 'Streaming: Go Live',
			options: [
				{
					id: 'enable',
					type: 'dropdown',
					label: 'Action',
					choices: SwitchChoices,
					default: 2,
				},
			],
			callback: async (action) => {
				const current = state.streaming.liveStatus === 1
				const val = resolveToggle(action.options.enable, current)
				await self.sendSet('live', [val])
			},
		},

		stream_enable: {
			name: 'Streaming: Enable Stream',
			options: [
				{
					id: 'stream',
					type: 'dropdown',
					label: 'Stream',
					choices: getStreamChoices(state),
					default: 0,
				},
				{
					id: 'enable',
					type: 'dropdown',
					label: 'Action',
					choices: SwitchChoices,
					default: 2,
				},
			],
			callback: async (action) => {
				const idx = Number(action.options.stream)
				const current = state.streaming.streams[idx]?.enabled ?? false
				const val = resolveToggle(action.options.enable, current)
				await self.sendSet('liveStreamOutputEnable', [idx, val])
			},
		},

		// ── Recording ───────────────────────────────────────────────────────

		record_start: {
			name: 'Recording: Start',
			options: [],
			callback: async () => {
				await self.sendSet('recordStart', [1])
			},
		},

		record_stop: {
			name: 'Recording: Stop',
			options: [],
			callback: async () => {
				await self.sendSet('recordStop', [1])
			},
		},

		record_toggle: {
			name: 'Recording: Start/Stop Toggle',
			options: [],
			callback: async () => {
				const val = state.record.status === 1 ? 0 : 1
				if (val === 1) {
					await self.sendSet('recordStart', [1])
				} else {
					await self.sendSet('recordStop', [1])
				}
			},
		},

		record_format: {
			name: 'Recording: Set Format',
			options: [
				{
					id: 'format',
					type: 'dropdown',
					label: 'Format',
					choices: RecordFormatChoices,
					default: 0,
				},
			],
			callback: async (action) => {
				await self.sendSet('recordFormat', [action.options.format])
			},
		},

		// ── Audio ────────────────────────────────────────────────────────────

		audio_enable: {
			name: 'Audio: Enable Input',
			options: [
				{
					id: 'source',
					type: 'dropdown',
					label: 'Input Source',
					choices: getAudioInputChoices(state),
					default: 1,
				},
				{
					id: 'enable',
					type: 'dropdown',
					label: 'Action',
					choices: SwitchChoices,
					default: 2,
				},
			],
			callback: async (action) => {
				const src = Number(action.options.source)
				const current = state.audio.inputs[src]?.enable ?? false
				const val = resolveToggle(action.options.enable, current)
				await self.sendSet('audioMixerEnable', [src, val])
			},
		},

		audio_fader: {
			name: 'Audio: Set Fader Level',
			options: [
				{
					id: 'source',
					type: 'dropdown',
					label: 'Input Source',
					choices: getAudioInputChoices(state),
					default: 1,
				},
				{
					id: 'fader',
					type: 'number',
					label: 'Level (dB, -100 = minimum)',
					default: 0,
					min: -100,
					max: 10,
					step: 1,
				},
			],
			callback: async (action) => {
				await self.sendSet('audioMixerFader', [action.options.source, action.options.fader])
			},
		},

		audio_afv: {
			name: 'Audio: Set AFV',
			options: [
				{
					id: 'source',
					type: 'dropdown',
					label: 'Input Source',
					choices: getAudioInputChoices(state),
					default: 1,
				},
				{
					id: 'afv',
					type: 'dropdown',
					label: 'Mode',
					choices: AudioAfvChoices,
					default: 0,
				},
			],
			callback: async (action) => {
				await self.sendSet('AudioMixerAFVEnable', [action.options.source, action.options.afv])
			},
		},

		audio_switch_type: {
			name: 'Audio: Set Switch Type',
			options: [
				{
					id: 'type',
					type: 'dropdown',
					label: 'Type',
					choices: AudioSwitchTypeChoices,
					default: 0,
				},
			],
			callback: async (action) => {
				await self.sendSet('audioMixerSwitchType', [action.options.type])
			},
		},

		// ── Macro ────────────────────────────────────────────────────────────

		macro_run: {
			name: 'Macro: Run',
			options: [
				{
					id: 'macro',
					type: 'dropdown',
					label: 'Macro',
					choices: getMacroChoices(state),
					default: 0,
					minChoicesForSearch: 10,
				},
			],
			callback: async (action) => {
				await self.sendSet('macroRunStart', [action.options.macro])
			},
		},

		macro_stop: {
			name: 'Macro: Stop',
			options: [],
			callback: async () => {
				await self.sendSet('macroRunStop', [0])
			},
		},

		macro_record_start: {
			name: 'Macro: Start Recording',
			options: [
				{
					id: 'macro',
					type: 'dropdown',
					label: 'Macro',
					choices: getMacroChoices(state),
					default: 0,
					minChoicesForSearch: 10,
				},
			],
			callback: async (action) => {
				await self.sendSet('macroRecordStart', [action.options.macro])
			},
		},

		macro_record_stop: {
			name: 'Macro: Stop Recording',
			options: [],
			callback: async () => {
				await self.sendSet('macroRecordStop', [0])
			},
		},

		// ── Playback ─────────────────────────────────────────────────────────

		playback_play: {
			name: 'Playback: Play/Pause',
			options: [
				{
					id: 'player',
					type: 'dropdown',
					label: 'Player',
					choices: getPlayerChoices(state),
					default: 0,
				},
				{
					id: 'enable',
					type: 'dropdown',
					label: 'Action',
					choices: [
						{ id: 0, label: 'Pause' },
						{ id: 1, label: 'Play' },
						{ id: 2, label: 'Toggle' },
					],
					default: 2,
				},
			],
			callback: async (action) => {
				const idx = Number(action.options.player)
				const current = state.playback.players[idx]?.status === 1
				const val = resolveToggle(action.options.enable, current)
				await self.sendSet('playPause', [idx, val])
			},
		},

		playback_repeat: {
			name: 'Playback: Set Repeat',
			options: [
				{
					id: 'player',
					type: 'dropdown',
					label: 'Player',
					choices: getPlayerChoices(state),
					default: 0,
				},
				{
					id: 'enable',
					type: 'dropdown',
					label: 'Repeat',
					choices: SwitchChoices,
					default: 2,
				},
			],
			callback: async (action) => {
				const idx = Number(action.options.player)
				const current = state.playback.players[idx]?.repeat ?? false
				const val = resolveToggle(action.options.enable, current)
				await self.sendSet('playRepeat', [idx, val])
			},
		},

		// ── Multi Source ─────────────────────────────────────────────────────

		multisource_style: {
			name: 'Multi Source: Set Layout Style',
			options: [
				{
					id: 'style',
					type: 'dropdown',
					label: 'Style',
					choices: MultiSourceStyleChoices,
					default: 0,
				},
			],
			callback: async (action) => {
				await self.sendSet('multiSourceStyle', [action.options.style])
			},
		},

		multisource_window: {
			name: 'Multi Source: Set Window Source',
			options: [
				{
					id: 'window',
					type: 'dropdown',
					label: 'Window',
					choices: getMultiSourceWindowChoices(state),
					default: 0,
				},
				{
					id: 'source',
					type: 'dropdown',
					label: 'Source',
					choices: getSourceChoices(state),
					default: getSourceChoices(state)[0]?.id ?? 1,
				},
			],
			callback: async (action) => {
				await self.sendSet('multiSourceInput', [action.options.window, action.options.source])
			},
		},
	})
}
