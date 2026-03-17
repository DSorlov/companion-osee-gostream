# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.5.1] — 2026-03-17

### Fixed

- **Duet 8 ISO: IN5–IN8 source IDs corrected** — inputs 5–8 now use the correct protocol IDs (4001–4004) instead of the incorrect 5–8.

---

## [2.5.0] — 2025-03-08

### Added

- **Bonjour / mDNS auto-discovery** — GoStream devices on the local network are now surfaced in a **Device** dropdown; selecting one fills the IP address automatically.
- **Multi Source actions** — Set layout style and set individual window source for the Multi Source output.
- **Audio actions** — Enable/Disable inputs, set fader level, toggle AFV, set switch type.
- **Macro actions** — Run, Stop, and Start/Stop Recording.
- **Playback actions** — Play and Repeat for media players.
- **DSK Rate action** — Set the downstream keyer transition rate.
- **`record_duration_hm` variable** — HH:MM formatted recording duration, convenient for button labels.
- **`macro_running` / `macro_run_index` variables** — Track which macro is currently running.
- **Preset bank** — Pre-built button presets for PGM/PVW selection, AUTO, CUT, FTB, Record, and Live.

### Changed

- Module id renamed to `osee-gostream-community` to reflect community-maintained status.
- Minimum firmware versions documented: GoStream Deck/Duet require v2.3.0, Duet 8 ISO requires v2.1.0.
- Upgraded to `@companion-module/base` ~1.14.1.
- Node.js engine requirement raised to ≥ 22.20.

### Fixed

- Reconnection loop now uses a clean back-off.
- Variable values are correctly reset to defaults when the connection drops.

---

## [2.4.0]

### Added

- **Streaming actions** — Go Live toggle/on/off, enable individual stream destinations (up to 3).
- **`live_status` variable** — Exposes the current streaming status.
- Per-stream feedbacks for streaming status and stream service name.

### Changed

- Stream index is 0-based internally and shown as Stream 1/2/3 in the UI.

---

## [2.3.0]

### Added

- **Recording actions** — Start, Stop, Toggle, Set Format.
- **`record_status`** and **`record_duration`** variables.
- Recording feedback (idle / recording / stopping).

---

## [2.2.0]

### Added

- **USK (upstream keyer) actions** — On Air, Key Type, Fill Source, Key Source.
- **DSK (downstream keyer) actions** — On Air, Fill Source, Key Source.
- USK and DSK on-air feedbacks.

### Changed

- Key and DSK counts are now queried from the device at connect time; the action and feedback lists rebuild automatically.

---

## [2.1.0]

### Added

- **FTB (Fade to Black)** action and `ftb_status` variable.
- **Transition Style & Rate actions** — set style (Mix / Dip / Wipe) and individual per-style rates.
- `transition_style` and `transition_rate` variables.
- Transition style feedback.

---

## [2.0.0]

### Added

- Initial release as a community module targeting the **v2 GSP (JSON-based) protocol**.
- TCP connection to GoStream devices on port 19010 with automatic reconnection.
- **Mix Effect actions** — Set PGM Source, Set PVW Source, AUTO, CUT.
- **`pgm_source`** and **`pvw_source`** variables and feedbacks.
- Auto-detect model from device-reported `deviceType`.
- Support for GoStream Deck, GoStream Duet, and GoStream Duet 8 ISO.

