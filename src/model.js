'use strict'

/**
 * Model definitions for OSEE GoStream devices.
 * These are used for model-specific choices and capabilities.
 */

// Source IDs as defined in the GSP protocol
const SourceID = {
	Black: 0,
	IN1: 1,
	IN2: 2,
	IN3: 3,
	IN4: 4,
	IN5: 5,
	IN6: 6,
	IN7: 7,
	IN8: 8,
	ColorBar: 1000,
	Color1: 2001,
	Color2: 2002,
	MP1: 3010,
	MP1_Key: 3011,
	MP2: 3020,
	MP2_Key: 3021,
	MultiSource: 5001,
	AUX1: 4001,
	AUX2: 4002,
	AUX3: 4003,
	AUX4: 4004,
	PGM: 10010,
	PVW: 10011,
}

const Model = {
	Auto: 0xff,
	Deck: 0x00,
	Duet: 0x01,
	Duet8ISO: 0x10,
}

/**
 * Returns an array of {id, label} source choices for the given model.
 * These are used for PGM/PVW source selection and keyer fill sources.
 */
function getInputSources(model) {
	const sources = []
	const inputCount = model === Model.Duet8ISO ? 8 : 4

	for (let i = 1; i <= inputCount; i++) {
		sources.push({ id: i, label: `IN${i}` })
	}
	sources.push({ id: SourceID.ColorBar, label: 'Color Bar' })
	sources.push({ id: SourceID.Color1, label: 'Color 1' })
	sources.push({ id: SourceID.Color2, label: 'Color 2' })
	sources.push({ id: SourceID.MP1, label: 'Media Player 1' })
	sources.push({ id: SourceID.MP1_Key, label: 'Media Player 1 Key' })
	sources.push({ id: SourceID.MP2, label: 'Media Player 2' })
	sources.push({ id: SourceID.MP2_Key, label: 'Media Player 2 Key' })
	sources.push({ id: SourceID.MultiSource, label: 'Multi Source' })
	return sources
}

/**
 * Additional sources available for DSK/USK fill (includes PGM/PVW)
 */
function getKeyerFillSources(model) {
	return [...getInputSources(model), { id: SourceID.PGM, label: 'PGM' }, { id: SourceID.PVW, label: 'PVW' }]
}

/**
 * Returns default capabilities for the given model ID.
 * These are later updated when the device reports its actual config.
 */
function getDefaultCaps(modelId) {
	const base = {
		keyCount: 2,
		dskCount: 2,
		streamCount: 3,
		multiSourceWindowCount: 4,
		playCount: 2,
		macros: 100,
		mediaStills: 31,
		recordISO: false,
		audioMixEffect: false,
		audioSwitcherCount: 2,
	}

	switch (modelId) {
		case Model.Deck:
		case Model.Duet:
			return { ...base }
		case Model.Duet8ISO:
			return { ...base, keyCount: 4, dskCount: 2, recordISO: true, audioMixEffect: true }
		default:
			return { ...base }
	}
}

/** Human-readable label for a source ID */
function sourceName(sourceId, modelId) {
	const all = getInputSources(modelId)
	const extra = [
		{ id: SourceID.PGM, label: 'PGM' },
		{ id: SourceID.PVW, label: 'PVW' },
		{ id: SourceID.Black, label: 'Black' },
	]
	const found = [...all, ...extra].find((s) => s.id === sourceId)
	return found ? found.label : `Source ${sourceId}`
}

/** All model choices shown in the config dropdown */
const MODEL_CHOICES = [
	{ id: Model.Auto, label: 'Auto Detect' },
	{ id: Model.Deck, label: 'GoStream Deck' },
	{ id: Model.Duet, label: 'GoStream Duet' },
	{ id: Model.Duet8ISO, label: 'GoStream Duet 8 ISO' },
]

module.exports = { SourceID, Model, MODEL_CHOICES, getInputSources, getKeyerFillSources, getDefaultCaps, sourceName }
