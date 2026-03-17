'use strict'

/**
 * All dropdown choices used throughout the module.
 * Functions that take a `state` argument build their lists dynamically
 * depending on the device capabilities stored in state.
 */

const { getInputSources, getKeyerFillSources } = require('./model')

// ── Generic On/Off/Toggle ──────────────────────────────────────────────────────
const SwitchChoices = [
	{ id: 0, label: 'Off' },
	{ id: 1, label: 'On' },
	{ id: 2, label: 'Toggle' },
]

const EnableChoices = [
	{ id: 0, label: 'Off' },
	{ id: 1, label: 'On' },
]

// ── Transition style ──────────────────────────────────────────────────────────
const TransitionStyleChoices = [
	{ id: 0, label: 'Mix' },
	{ id: 1, label: 'Dip' },
	{ id: 2, label: 'Wipe' },
]

// ── USK key types ─────────────────────────────────────────────────────────────
const KeyTypeChoices = [
	{ id: 0, label: 'Luma Key' },
	{ id: 1, label: 'Chroma Key' },
	{ id: 2, label: 'Pattern' },
	{ id: 3, label: 'PIP' },
]

// ── Wipe patterns ─────────────────────────────────────────────────────────────
const WipePatternChoices = [
	{ id: 0, label: 'Left → Right' },
	{ id: 1, label: 'Top → Bottom' },
	{ id: 2, label: 'Right → Left' },
	{ id: 3, label: 'Bottom → Top' },
	{ id: 4, label: 'Surround' },
	{ id: 5, label: 'Rectangle' },
	{ id: 6, label: 'Diamond' },
	{ id: 7, label: 'Circle' },
	{ id: 8, label: 'Rectangle (TL)' },
	{ id: 9, label: 'Rectangle (TR)' },
	{ id: 10, label: 'Rectangle (BR)' },
	{ id: 11, label: 'Rectangle (BL)' },
	{ id: 12, label: 'Rectangle (TC)' },
	{ id: 13, label: 'Rectangle (RC)' },
	{ id: 14, label: 'Rectangle (BC)' },
	{ id: 15, label: 'Rectangle (LC)' },
	{ id: 16, label: 'Diagonal L→R' },
	{ id: 17, label: 'Diagonal R→L' },
]

// ── Audio AFV ─────────────────────────────────────────────────────────────────
const AudioAfvChoices = [
	{ id: 0, label: 'Off' },
	{ id: 1, label: 'On' },
	{ id: 2, label: 'AFV (follow PGM)' },
]

// ── Audio switch type ─────────────────────────────────────────────────────────
const AudioSwitchTypeChoices = [
	{ id: 0, label: 'Hard Cut' },
	{ id: 1, label: 'Switch with Effect' },
]

// ── Record formats ────────────────────────────────────────────────────────────
const RecordFormatChoices = [
	{ id: 0, label: 'H.264' },
	{ id: 1, label: 'H.265' },
]

// ── Media type ────────────────────────────────────────────────────────────────
const MediaTypeChoices = [
	{ id: 0, label: 'Still Image' },
	{ id: 1, label: 'Browser' },
]

// ── Multi-source styles ───────────────────────────────────────────────────────
const MultiSourceStyleChoices = [
	{ id: 0, label: 'Zoom Out' },
	{ id: 1, label: 'Crop + Zoom Out' },
	{ id: 2, label: 'Zoom Out + Crop' },
	{ id: 3, label: 'Crop' },
	{ id: 4, label: 'Crop/Zoom 2:3' },
	{ id: 5, label: 'Zoom/Crop 2:3' },
]

// ── Dynamic choice builders ───────────────────────────────────────────────────

/** PGM/PVW source choices based on current model */
function getSourceChoices(state) {
	const modelId = state.device.modelId
	return getInputSources(modelId)
}

/** DSK/USK fill source choices (includes PGM/PVW) */
function getKeyerSourceChoices(state) {
	const modelId = state.device.modelId
	return getKeyerFillSources(modelId)
}

/** USK index choices based on keyCount */
function getUSKChoices(state) {
	return Array.from({ length: state.device.keyCount }, (_, i) => ({ id: i, label: `Key ${i + 1}` }))
}

/** DSK index choices based on dskCount */
function getDSKChoices(state) {
	return Array.from({ length: state.device.dskCount }, (_, i) => ({ id: i, label: `DSK ${i + 1}` }))
}

/** Stream choices based on streamCount */
function getStreamChoices(state) {
	return Array.from({ length: state.device.streamCount }, (_, i) => ({ id: i, label: `Stream ${i + 1}` }))
}

/** Playback player choices */
function getPlayerChoices(state) {
	return Array.from({ length: state.device.playCount }, (_, i) => ({ id: i, label: `Player ${i + 1}` }))
}

/** Macro choices (0-based internally, displayed 1-based) */
function getMacroChoices(state) {
	return Array.from({ length: state.device.macros }, (_, i) => {
		const name = state.macro.macros[i] ? state.macro.macros[i].name : ''
		const label = name ? `Macro ${i + 1}: ${name}` : `Macro ${i + 1}`
		return { id: i, label }
	})
}

/** Multi-source window choices */
function getMultiSourceWindowChoices(state) {
	return Array.from({ length: state.device.multiSourceWindowCount }, (_, i) => ({
		id: i,
		label: `Window ${i + 1}`,
	}))
}

/** Audio input source choices */
function getAudioInputChoices(state) {
	const modelId = state.device.modelId
	// Include IN1–IN4 (IDs 1–4) and, on Duet 8 ISO, IN5–IN8 (IDs 4001–4004)
	const sources = getInputSources(modelId).filter((s) => (s.id >= 1 && s.id <= 4) || (s.id >= 4001 && s.id <= 4004))
	return [...sources, { id: 1301, label: 'MIC 1' }, { id: 1302, label: 'MIC 2' }, { id: 2301, label: 'Headphone' }]
}

module.exports = {
	SwitchChoices,
	EnableChoices,
	TransitionStyleChoices,
	KeyTypeChoices,
	WipePatternChoices,
	AudioAfvChoices,
	AudioSwitchTypeChoices,
	RecordFormatChoices,
	MediaTypeChoices,
	MultiSourceStyleChoices,
	getSourceChoices,
	getKeyerSourceChoices,
	getUSKChoices,
	getDSKChoices,
	getStreamChoices,
	getPlayerChoices,
	getMacroChoices,
	getMultiSourceWindowChoices,
	getAudioInputChoices,
}
