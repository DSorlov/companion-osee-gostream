# OSEE GoStream — Companion Module

Control the **OSEE GoStream Deck**, **GoStream Duet**, and **GoStream Duet 8 ISO** live-production switchers from Bitfocus Companion.

---

## Requirements

This module **only supports the v2 GSP protocol** (JSON-based). Make sure your device is running the following firmware or newer:

| Device              | Minimum firmware |
| ------------------- | ---------------- |
| GoStream Deck       | v2.3.0           |
| GoStream Duet       | v2.3.0           |
| GoStream Duet 8 ISO | v2.1.0           |

If your device is running an older firmware, please update it before using this module.

---

## Connection Setup

1. Connect your GoStream device to the same network as your Companion machine.
2. Add a new module connection and search for **OSEE GoStream**.
3. Set the **IP Address** to the IP shown in the GoStream control-panel network settings.
4. Leave the **Port** as `19010` unless your network administrator has changed it.
5. Select the correct **Model** from the dropdown, or leave it on **Auto-detect** to let the device report its own model.
6. Click **Save**.

A green status light means Companion has successfully connected. The module will automatically attempt to reconnect if the connection is lost.

---

## Bonjour / Auto-discovery

If the **Device** dropdown has entries, your GoStream device was discovered automatically on the local network via mDNS. Selecting a device from the dropdown will fill in the IP address automatically and hide the manual host field.

---

## Actions

| Category     | Action                                                                   |
| ------------ | ------------------------------------------------------------------------ |
| Mix Effect   | Set PGM Source, Set PVW Source, AUTO, CUT, FTB, Transition Style & Rates |
| Keys (USK)   | On Air, Key Type, Fill/Key Sources                                       |
| Keys (DSK)   | On Air, Fill/Key Sources, Rate                                           |
| Streaming    | Go Live (toggle/on/off), Enable individual streams                       |
| Recording    | Start, Stop, Toggle, Set Format                                          |
| Audio        | Enable/Disable, Fader Level, AFV, Switch Type                            |
| Macros       | Run, Stop, Start/Stop Recording                                          |
| Playback     | Play, Repeat                                                             |
| Multi Source | Set layout style, Set window source                                      |

---

## Variables

| Variable                              | Description                                       |
| ------------------------------------- | ------------------------------------------------- |
| `$(osee-gostream:pgm_source)`         | Current PGM source name                           |
| `$(osee-gostream:pvw_source)`         | Current PVW source name                           |
| `$(osee-gostream:transition_style)`   | Transition style name (Mix / Dip / Wipe)          |
| `$(osee-gostream:transition_rate)`    | Transition rate (frames)                          |
| `$(osee-gostream:ftb_status)`         | FTB active (1/0)                                  |
| `$(osee-gostream:record_status)`      | Recording status string                           |
| `$(osee-gostream:record_duration)`    | Recording duration (HH:MM:SS)                     |
| `$(osee-gostream:record_duration_hm)` | Recording duration (HH:MM) — suitable for buttons |
| `$(osee-gostream:live_status)`        | Streaming live status                             |
| `$(osee-gostream:macro_running)`      | Macro currently running (1/0)                     |
| `$(osee-gostream:macro_run_index)`    | Index of the running macro (1-based)              |

---

## Notes

- **Action timing:** The GoStream device processes commands sequentially. When building button sequences that depend on one action completing before the next (e.g. cut then set source), add a **200 ms delay** between actions.
- **Multiple streams:** The GoStream supports up to 3 simultaneous streaming destinations. Actions and feedbacks for each stream use a 0-based index internally but are shown as Stream 1/2/3 in the UI.
- **Key count:** USK and DSK slot counts are reported by the device at connect time. Companion will rebuild its action/feedback lists automatically once the device confirms its configuration.
