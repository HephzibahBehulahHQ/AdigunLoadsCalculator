# Legacy calculator migration

The reference application is [AdigunTokenCalculator](https://github.com/HephzibahBehulahHQ/AdigunTokenCalculator/tree/c04d971a97e490efd8fda47727039623a9f28218), not a former name or repository of this product. Its existing pages and stored profiles remain unchanged.

## Current import boundary

Native AdigunPowerLab engineering-project JSON uses `schemaVersion: 1`. Its validator rejects unsupported schemas before replacing the current project. The dedicated adapter in `src/import-export/legacy.ts` recognizes the actual persisted source format `{format: 'adigun-electrical-load', version: 1 | 2, devices, settings, extensions}`; `extensions` applies to V2. It validates the complete original schema and returns a previewable new project plus semantic warnings. Arbitrary objects with similar field names are not accepted as source profiles.

The original JSON, limited to the source format's 1 MB bound, is retained as inert text in `project.legacyImport.originalJson`. It is not executed. The browser cannot read another site's localStorage automatically; the user supplies an exported file. Import should be applied only after reviewing the preview and its changed-semantics warnings.

The adapter's inspected schema source was a clean local AdigunTokenCalculator reference checkout at `2e4f24e0ccb7fc92a78c7632bc54d7cc13fccf12`, specifically `loadProfile.js`, `loadCalculator.js`, `loadProfileStorage.js` and `loadStorageV2.test.js`. This is an inspected local revision, not a claim that it is current GitHub main. The specification/start-of-task GitHub baseline remains `c04d971a97e490efd8fda47727039623a9f28218`.

Billing drafts have their own versioned JSON export/import. They are saved in a separate local IndexedDB store keyed by project ID; the engineering-project JSON alone does not include the separate customer billing draft. Export both when backing up a project with a bill. Invalid billing input never replaces the open draft.

## Implemented field map

| Legacy field or behavior | New representation | Required review |
| --- | --- | --- |
| Equipment `watts`, `quantity` | Load `rating` in kW and `quantity` | Canonical W schema is required; divide W by 1,000 and multiply quantity by household count once |
| `hoursPerDay`, `dutyCycle` | `hoursPerDay`, `duty` | Duty percentage becomes a fraction once; current remains separate |
| `standbyW` | Per-unit standby W | Check quantity treatment and off-window behavior |
| `pf`, `type` | Sinusoidal displacement PF with declared reactive direction | Positive electrical power with PF=0 is rejected, including when energy duty is zero |
| Legacy supply and voltage | Single L–N/L1 or balanced three-phase provisional model | Legacy single-phase data cannot prove L–N versus L–L or a surveyed phase; the warning requires review |
| `demandFactor`, `diversityFactor` | Design coincidence | One non-unity factor maps design-only; if both are non-unity, coincidence is left at 1 pending explicit review |
| Growth | Design-growth allowance | Energy is not multiplied silently by the design-growth factor |
| Currency and flat tariff | Project currency and entered import price | No claim that the historical tariff is current |
| V2 TOU/frequency/current limit/inrush multiplier | Supported explicit project/load settings | Invalid bands are rejected; zero/unknown current limits remain warned assumptions |
| Preferred occupancy window | Contiguous operating window | The changed profile is explained rather than represented as exact legacy parity |
| Seasonal/monthly factors, daily renewable netting and historical carbon | Original JSON only | Chronological physical flows and carbon evidence need new reviewed inputs |
| Legacy cable, protection and PF penalty fields | Original JSON only | No invented circuits, cables, protective devices or verified compliance |

Zero-quantity equipment is omitted with a warning. V1's 50 Hz and the new project's timezone/current-limit defaults are identified as assumptions when absent in the old format. Carbon geography, date and methodology need renewed evidence.

## Deliberate semantic changes

- A 2.3 kW unity-PF load at 230 V is 10 A while on. At 50% energy duty for eight hours it uses 9.2 kWh, but its on-state current remains 10 A.
- Design coincidence and growth do not automatically scale the useful energy consumed by the appliance.
- Daily renewable netting cannot prove physical self-consumption. One kWh exported at noon and one kWh imported later are separate flows without storage.
- Fixed 30-day or 365-day values remain labelled estimates; they are not calendar simulation results.
- Starting current, starting PF, duration and sequence are separate input fields rather than one simultaneous fixed-PF multiplier for an entire installation.
- A 1.25 × current planning breaker candidate is not a completed protection assessment.
- A resistivity-based voltage-drop estimate requires its assumed conditions; it cannot supply missing ampacity, protective-device or jurisdiction evidence.

No exact result parity is promised when correcting these semantics. Historical legacy outputs should be retained as historical approximations alongside any newly calculated project.
