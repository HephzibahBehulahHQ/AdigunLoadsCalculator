# Scope and remaining acceptance work

This initial product is a real, local engineering workspace. The original specification is broader than the first implementation; the following differences are explicit so no partial result is presented as full acceptance.

## Engineering/model boundaries

- The electrical model supports entered DC, single-phase, L–L and balanced three-phase loads at a stiff-neutral supply. Arbitrary meshed networks, floating neutrals, voltage-dependent load flow and transient electromagnetic solving are outside this model.
- Nameplate/on-state current and energy duty remain separate. Unknown true-PF reactive/phase information is incomplete. No harmonic spectrum is inferred from PF.
- Current manual circuit checks require entered cable impedance, sourced ampacity/correction factors and device evidence. Automatic licensed table selection, manufacturer time-current/selectivity curves and cumulative feeder-path assessment still require expanded datasets/models and acceptance work.
- Calendar simulations use daily operating windows and selected weekdays, actual elapsed time and IANA offsets. Full seasonal calendars, holiday exceptions and arbitrary overlapping windows are not yet an editing workflow.
- PV chronology requires entered profiles. There is no live weather retrieval. Battery dispatch is a declared energy model, not manufacturer-specific performance certification. Backup suitability depends on entered island-capable equipment assumptions.
- EV plans apply conservative site/phase envelopes and report infeasibility. The implemented heuristics do not claim a global optimum.

## Product/UI boundaries

- The single-line diagram is a real view of circuit/load relationships with selections, flow and SVG export. Manual coordinate editing, arbitrary symbol insertion, editable feeder routing and optional 3D are not implemented.
- A paged load schedule handles large projects; general multi-select bulk editing, clipboard paste mapping, split-pane resizing and the full expanded menu inventory need further work.
- Native JSON and supported CSV have preview and validation. Structured legacy import and measurement parsers are tracked separately in the migration/acceptance documents.
- Billing and engineering project drafts use separate stores and explicit backups. A bill is user-authored; the software does not invent legal/tax details or claim jurisdiction-specific invoice compliance.
- Core navigation/forms and billing have four-language dictionaries. Detailed equation narratives, some engine errors and technical source prose still require full translation and professional review. Yoruba/Pidgin translations are drafts; no native-speaker review is claimed.
- The local BOT is deterministic. It runs real project tools and checked proposals; it is not a remote generative model. General OCR, document retrieval and external tool execution require actual integrations.

## Verification boundaries

Node benchmarks, unit tests, browser-flow checks and rendered PDF inspection are separate evidence categories. Performance targets are not claimed for untested devices. A build or GitHub commit does not prove public deployment. Accessibility checks and responsive screenshots do not constitute a complete WCAG certification.

Local browser storage may be cleared by the browser or operating system; actual exported backups are the cross-device recovery mechanism. Hardware, licensed-data and live provider checks remain untested until those capabilities are supplied and configured.
