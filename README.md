# companion-module-osee-gostream-community

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Community Bitfocus Companion module for the **OSEE GoStream Deck**, **GoStream Duet**, and **GoStream Duet 8 ISO** live-production switchers. This is not the official module, nor is it supported or connected to Osee. I developed this module to solve some of the issues we had in our studio with the official module, specifically around slow response and lagging updates. This have been used privately in our studio for some time and 2.5.0 is the initial github release.

> **Protocol:** v2 GSP (JSON-based) only. Your device must be running the minimum firmware listed below.

---

## Supported Devices & Firmware

| Device              | Minimum Firmware |
| ------------------- | ---------------- |
| GoStream Deck       | v2.3.0           |
| GoStream Duet       | v2.3.0           |
| GoStream Duet 8 ISO | v2.1.0           |

---

## Installation

This module is distributed as a Companion module package. To install it:

1. Download the latest `.pkg` file from the [releases page](https://github.com/dsorlov/companion-module-osee-gostream-community/releases).
2. Open Bitfocus Companion, go to **Settings → Modules** and click **Install from file**, then select the `.pkg`.
3. Alternatively, copy the built package into Companion's module directory.

---

## Connection Setup

1. Connect your GoStream device to the same network as the Companion machine.
2. Add a new module connection and search for **OSEE GoStream**.
3. Set **IP Address** to the address shown in the GoStream control-panel network settings.
4. Select the correct **Model** from the dropdown, or leave it on **Auto-detect** to let the device report its own model (will add about 300ms to connect time).
5. Click **Save**.

A green status indicator means Companion is connected. The module reconnects automatically if the connection drops.

### Bonjour / Auto-discovery

If GoStream devices are discovered automatically via mDNS on the local network, they will appear in the **Device** dropdown. Selecting one fills in the IP address automatically.

---

## Features

### Actions

| Category     | Actions                                                                    |
| ------------ | -------------------------------------------------------------------------- |
| Mix Effect   | Set PGM Source, Set PVW Source, AUTO, CUT, FTB, Transition Style & Rates  |
| Keys (USK)   | On Air, Key Type, Fill/Key Sources                                         |
| Keys (DSK)   | On Air, Fill/Key Sources, Rate                                             |
| Streaming    | Go Live (toggle / on / off), Enable individual streams                     |
| Recording    | Start, Stop, Toggle, Set Format                                            |
| Audio        | Enable/Disable, Fader Level, AFV, Switch Type                              |
| Macros       | Run, Stop, Start/Stop Recording                                            |
| Playback     | Play, Repeat                                                               |
| Multi Source | Set layout style, Set window source                                        |

### Feedbacks

Feedbacks are available for PGM/PVW source, transition style, USK/DSK on-air state, streaming and recording status, and more.

### Variables

| Variable                              | Description                                        |
| ------------------------------------- | -------------------------------------------------- |
| `$(gostream-community:pgm_source)`         | Current PGM source name                            |
| `$(gostream-community:pvw_source)`         | Current PVW source name                            |
| `$(gostream-community:transition_style)`   | Transition style name (Mix / Dip / Wipe)           |
| `$(gostream-community:transition_rate)`    | Transition rate (frames)                           |
| `$(gostream-community:ftb_status)`         | FTB active (1/0)                                   |
| `$(gostream-community:record_status)`      | Recording status string                            |
| `$(gostream-community:record_duration)`    | Recording duration (HH:MM:SS)                      |
| `$(gostream-community:record_duration_hm)` | Recording duration (HH:MM) — suitable for buttons  |
| `$(gostream-community:live_status)`        | Streaming live status                              |
| `$(gostream-community:macro_running)`      | Macro currently running (1/0)                      |
| `$(gostream-community:macro_run_index)`    | Index of the running macro (1-based)               |

### Presets

Pre-built button presets are included for common operations (PGM/PVW source selection, AUTO/CUT, FTB, Record, Live).

---

## Notes

- **Action timing:** The GoStream processes commands sequentially. When chaining actions that depend on the previous one completing (e.g. CUT then set source), add a **200 ms delay** between them.
- **Multiple streams:** Up to 3 simultaneous streaming destinations are supported. Actions and feedbacks use a 0-based index internally but are labelled Stream 1/2/3 in the UI.
- **Key count:** USK and DSK slot counts are reported by the device at connect time. Action and feedback lists are rebuilt automatically once the device confirms its configuration.

---

## Development

### Prerequisites

- Node.js ≥ 22.20
- Yarn 4

### Setup

```bash
yarn install
```

### Build

```bash
yarn package
```

The packaged module (`.pkg`) will be written to the `pkg/` directory.

### Lint / Format

```bash
yarn lint
yarn format
```

---

## Contributing

Bug reports and pull requests are welcome on the [GitHub repository](https://github.com/dsorlov/companion-module-osee-gostream-community). For major changes, please open an issue first to discuss what you'd like to change.

---

## License

[MIT](LICENSE) — © Daniel Sörlöv
