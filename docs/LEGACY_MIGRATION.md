# Legacy calculator migration

The reference application is [AdigunTokenCalculator](https://github.com/HephzibahBehulahHQ/AdigunTokenCalculator/tree/c04d971a97e490efd8fda47727039623a9f28218), not a former name or repository of this product. Its existing pages and stored profiles remain unchanged.

## Current import boundary

Native AdigunPowerLab engineering-project JSON uses `schemaVersion: 1`. Its validator rejects unsupported schemas before replacing the current project. A dedicated automatic legacy V1/V2 profile adapter is not currently implemented. Do not present the native import action as if it can read another site's browser storage. Keep the original exported legacy profile when transcribing or converting it.

Billing drafts have their own versioned JSON export/import. They are saved in a separate local IndexedDB store keyed by project ID; the engineering-project JSON alone does not include the separate customer billing draft. Export both when backing up a project with a bill. Invalid billing input never replaces the open draft.

## Reviewed field map for a future explicit adapter

| Legacy field or behavior | New representation | Required review |
| --- | --- | --- |
| Equipment `watts`, `quantity` | Load `rating` in kW and `quantity` | Divide W by 1,000; preserve the original unit in source notes |
| `hoursPerDay`, `dutyCycle` | `hoursPerDay`, `duty` | Check whether legacy duty is a percentage; convert once |
| `standbyW` | Per-unit standby W | Check quantity treatment and off-window behavior |
| `pf` | PF with explicit displacement/true distinction | Do not invent reactive direction or harmonic content |
| V2 phase assignment | Explicit L1/L2/L3 or linked three-phase assignment | Preserve locked assignment and validate the connection |
| `demandFactor`, `diversityFactor`, growth | Coincidence/design-growth assumptions | Do not apply two reductions for the same scheduling effect |
| Legacy households multiplier | Explicit quantities or reviewed replicated loads | Avoid applying the multiplier twice |
| Tariff/renewable approximations | Recorded historical assumptions | Do not silently relabel them measured or current |

## Deliberate semantic changes

- A 2.3 kW unity-PF load at 230 V is 10 A while on. At 50% energy duty for eight hours it uses 9.2 kWh, but its on-state current remains 10 A.
- Design coincidence and growth do not automatically scale the useful energy consumed by the appliance.
- Daily renewable netting cannot prove physical self-consumption. One kWh exported at noon and one kWh imported later are separate flows without storage.
- Fixed 30-day or 365-day values remain labelled estimates; they are not calendar simulation results.
- Starting current, starting PF, duration and sequence are separate input fields rather than one simultaneous fixed-PF multiplier for an entire installation.
- A 1.25 × current planning breaker candidate is not a completed protection assessment.
- A resistivity-based voltage-drop estimate requires its assumed conditions; it cannot supply missing ampacity, protective-device or jurisdiction evidence.

No exact result parity is promised when correcting these semantics. Historical legacy outputs should be retained as historical approximations alongside any newly calculated project.
