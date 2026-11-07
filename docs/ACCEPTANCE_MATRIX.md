# AdigunPowerLab acceptance audit

Audit date: 6 November 2026. Scope: original specification sections 01–33, fixtures F01–F20 and tools T01–T51, plus the recovered continuation.

## Localized toolbox search and custom-domain continuation

The 7 November continuation closes a specific section 25 usability defect: the Toolbox displayed translated titles but searched English metadata only. `src/tools/search.ts` now indexes displayed and English titles, categories, descriptions and tool IDs with case/accent/punctuation normalization. The real workspace adds localized live result counts and no-result keyboard recovery, preserving worksheet inputs and results. `tests/tools-search.test.ts` and `tests/browser/toolbox-search.spec.ts` supply focused evidence; the browser flows also run against the production bundle.

The Pages source was restored from branch publication to GitHub Actions after the custom-domain change exposed a competing Jekyll publisher. `deploy.yml` now rejects that configuration before preparing the exact validated artifact. This is a publication-configuration check, not DNS/TLS verification. Final release evidence belongs in [PR #6](https://github.com/HephzibahBehulahHQ/AdigunPowerLab/pull/6); professional language review and independent accessibility acceptance remain open.

## Searchable help and publication continuation

The next bounded continuation implements 20 workflow guides and guides for all 51 existing tools. `src/help/content.ts` connects searchable instructions to actual workspaces and tool metadata. `HelpSupport.tsx` provides local, responsive help with four-language content, keyboard access, real catalogue examples and an explicit GitHub support link. The existing command palette indexes the same content. Form drafts are protected from guide navigation, repeated external tool requests select the requested worksheet, and closing a help handoff restores the original keyboard focus.

`tests/help-search.test.ts` checks language/search coverage; `tests/browser/help-support.spec.ts` exercises real navigation, calculations, saved-project preservation, unfinished form protection and production offline use. The deployment workflow now consumes only the artifact from successful validation of the current main revision. Candidate acceptance and publication receipts are recorded separately in `TEST_EVIDENCE.md` and `DEPLOYMENT.md`; the historical section table below is not a replacement for those receipts.

## Release conclusion

**The complete original specification is not fully accepted.** The current local continuation adds substantial working behavior and closes the implementation gaps listed below; external datasets/services and exhaustive acceptance remain separate. This is not a claim that the new candidate is public.

Verification source candidate: `93d5e46`. The numerical gate passed **331 tests across 21 files**, and the production build passed. **32/32 browser cases passed** in the independent checkout. Offline root/subpath and clean-checkout gates passed; exact command/revision evidence is in `TEST_EVIDENCE.md`. Following explicit owner authorization, the continuation passed complete GitHub validation, merged through PR #2 and deployed main revision `92d5c437f7b48f2f6ea65ae55c5aa3d2992aefa9` through successful Pages run `42169441584`.

The E/S/P/U/B1/B2/R/I/L/N/O evidence codes below include historical initial-release evidence. Continuation files and new regression evidence are specified in the current section table; historical performance figures must not be presented as a new candidate measurement.

### Status meanings

- **Implemented / verified scope:** stated behavior exists, with the listed executed evidence. This does not imply universal physical applicability.
- **Partial:** useful implementation exists, but one or more requirements in that specification section remain open.
- **External / untested:** requires actual service, hardware, authoritative data or independent review; no successful integration is claimed.
- **Pending final gate:** the final candidate run or measurement has not yet been recorded.

### Evidence index

| Code | Actual implementation or verification evidence |
| --- | --- |
| E | `src/domain/types.ts`, `src/domain/project.ts`, `src/engine/electrical.ts`; independent tests in `tests/engine.test.ts` |
| S | `src/engine/simulation.ts`, `src/workers/simulation.ts`; calendar, DST, battery and conservation tests in `tests/engine.test.ts` |
| P | `src/engine/planning.ts`, `src/engine/assessments.ts`; constraint/phase/circuit tests in `tests/engine.test.ts` and `tests/engine-bot.test.ts` |
| U | `tests/tools.test.ts`: explicit independently entered expected values, T21 check-state assertions and additional boundary tests; methods in `docs/TOOL_METHODS.md` |
| B1 | `tests/browser/workspace.spec.ts`: six executed browser flows reported passed by the integration owner, including all 51 actual toolbox example forms, load/duty/undo/save/reload, import, DST simulation, BOT and core language/mobile checks |
| B2 | `tests/browser/recovery.spec.ts`: five executed browser tests passed; the save-copy flow was rerun successfully with Undo/Redo reset assertions after its source fix |
| R | `src/import-export/reports.ts`, `src/features/Billing.tsx`; `tests/billing.test.ts`, `tests/billing-pdf.test.ts`; rendered document evidence recorded in `TEST_EVIDENCE.md` and `docs/examples/`; billing browser verification passed as reported by the integration owner |
| I | `src/import-export/files.ts`, `legacy.ts`, `measurements.ts`, `src/storage/measurements.ts`; native/CSV import browser checks and `tests/import.test.ts`. Measurement import/persistence browser flow passed as reported by the integration owner; integrated 15-case browser run passed |
| L | `src/i18n/index.tsx`, `tests/i18n.test.ts`, language switches in B1, billing language/render checks. Full narrative coverage and professional linguistic review remain partial |
| N | `tests/engine.performance.test.ts`, `docs/PERFORMANCE.md`: 1,000 loads and 35,040 annual intervals; measured Node edit p95 37.17 ms and annual simulation 3,947 ms on the documented setup. These are not browser latency measurements |
| O | `docs/offline-verification.json`: offline check passed: controlled service worker, saved-project recovery, offline reload and offline toolbox calculation recorded true, with no recorded errors. Final bundle/update acceptance remains separately recorded |

## Specification sections 01–33

| Section | Status | Implemented evidence | Remaining requirement or boundary |
| --- | --- | --- | --- |
| 01 Mission/execution | Partial | Product repository, actual local workspace, E/S/P/R, maintained status and audit | Full original scope is larger than this initial release; no blanket completion claim |
| 02 References/revisions | Implemented reference record | `docs/REFERENCE_MANIFEST.md`; pinned brand/policy/source references | Future source changes require reviewed updates; historical pins are not claims about future main branches |
| 03 Template adoption | Implemented local contract | `AGENTS.md`, `product.config.json`, approved local corporate asset, branding in `App.tsx` | External account/provider capabilities remain explicitly unconfigured |
| 04 Honest data/results | Partial | Empty new projects; opt-in labelled cases; input validation, revisioned results and separate incomplete checks; E/P/B1/B2 | Uniform full evidence metadata on every tool/chart/export needs further alignment; no certification |
| 05 Brand/motion | Implemented local controls; partial full acceptance | Approved asset, themes, reduced motion, data-bound diagram/spatial flow and persisted display controls | Exhaustive motion/contrast/accessibility review remains open |
| 06 Workspace/navigation | Implemented; sampled verification | `App.tsx`, resizable panels, object tree, contextual inspector, mobile drawers and direct routes | Every navigation/error/device combination is not exhaustively tested |
| 07 Action inventory | Implemented local commands; partial full acceptance | `projectCommands.ts`, `LoadOperations.tsx`, previews/undo, clipboard/bulk edits, project close/open and revision comparison | Full shortcut/context-menu and failure-state matrix remains open |
| 08 Model/library | Implemented local models; external catalogue boundary | Building/zone/source registry, equipment favourites, linked replacement/version review and seven explicit analytical cases | No licensed manufacturer catalogue or verified automatic standards pack |
| 09 Electrical engine | Verified supported model | E; signed P/Q, leading/lagging cancellation, motor conversion, L–L phasors, phase/neutral quantities, duty separation | Stiff-neutral/fundamental assumptions apply; arbitrary load flow, distortion-derived Q and transient models are unsupported |
| 10 Boards/circuits/diagram | Implemented supported radial editor | `TopologyEditor.tsx`, `SpatialView.tsx`, graph commands, dependency guards, notes/coordinates, SVG/PDF and linked feeder routes | No meshed load-flow or physical equipment validation |
| 11 Schedules/measurements | Implemented bounded calendar workflows | `calendar.ts`, `AdvancedPlanning.tsx`, window unions, seasonal/date exceptions, timed duty/start events, timeline controls, measured import/resampling | Arbitrary device control and exhaustive measurement/timezone cases remain outside acceptance |
| 12 Cables/drop/losses | Implemented entered-data routes | `feeders.ts`, source-to-load shared current/drop/loss and independent conductor capacity; `feeder-safety.test.ts` and `circuit-safety.test.ts` | Licensed automatic cable selection, installation tables and manufacturer conditions require actual data; unsupported boundaries stay visible |
| 13 Protection/fault/earthing | Partial | Separate manual checks T21–T25 and explicit missing-data states; P/U/B1 | Manufacturer time-current/let-through/selectivity curves, complete RCD/RCBO criteria and jurisdiction-backed disconnection studies require actual data and validation |
| 14 Motors/supply | Implemented stated start/capacity model | Project-linked start events, entered source models and sequence energy/current; `engine-advanced.test.ts` | Manufacturer curves and validated dynamic voltage/frequency dips are not supplied |
| 15 Renewables/storage | Implemented entered chronological planning | PV/wind profiles, battery strategies/limits/losses, critical-load and declared island/transfer constraints, conserved flows | No live resource service, manufacturer degradation model or physical islanding validation |
| 16 EV/flexible loads | Implemented bounded scheduling | `flexible.ts`, process windows/minimum blocks, price/solar priorities, conservative site/phase constraints, preview/apply/undo and unmet-energy results | Heuristics do not prove global optimum; hardware control is unavailable |
| 17 Power quality | Verified stated worksheets | Signed power and phasors, PF correction, capacitor element sizing and supplied-spectrum RMS/THD; E/T33–T35/U/B1 | No inference of harmonics from PF, no automatic bank compatibility or resonance approval |
| 18 Costs/carbon/economics | Implemented entered tariff model | Effective-date/weekday bands, explicit fallback/coverage, import/export, rolling/aligned demand and taxes; exact fractional boundaries in `tariff-boundaries.test.ts` | Contract-specific tariffs and tax/statutory interpretation still require user evidence |
| 19 Scenarios/optimization | Implemented bounded comparison; partial optimization | Frozen baselines, input diffs, sensitivity inputs and dated comparison worker; comparisons bounded to 31 elapsed days | Project-wide optimality and every scenario combination are not proven |
| 20 Toolbox | Implemented sampled coverage | All 51 forms and fixtures; reviewed object applications via `ToolboxApply.tsx` and `tool-application.test.ts` | Every invalid-input/application path is not exhaustively covered; unsupported model boundaries remain explicit |
| 21 Reports/BOM/estimates | Implemented selected outputs | Section-selectable frozen reports, model-derived BOM, bills/estimates/print, real vector PDFs and series/scenario exports; separate feeder voltage/capacity evidence | Analytical PDF rendering and numerical checks do not certify statutory invoices or installation compliance |
| 22 Saving/offline/recovery | Implemented supported local recovery | Unified project/revision/bill/measurement archive, reviewed copy restore, transactional rollback, migration, conflict recovery and scoped offline cache | Exhaustive quota/update-interruption and cross-device recovery tests remain open |
| 23 Imports/migration | Implemented supported formats | Reviewed native/legacy/measurement imports, explicit column/unit mapping, merge/replace and raw unsupported-source retention | Unsupported historical semantics remain visible; historical result parity is not implied |
| 24 Adigun BOT | Partial | Deterministic local commands, previews, stale guards, accepted mutations/undo, real reports, session-only chat, persisted/clamped window state; `src/bot/`, B1, `engine-bot.test.ts` | Connected AI/OCR/retrieval absent; full live-mode interaction, every window lifecycle and every capability/action combination need broader browser evidence |
| 25 Languages/accessibility | Implemented catalogues; partial independent acceptance | EN/DE/Yorùbá/Pidgin UI/report/technical catalogues, localized numeric drafts, modal focus, keyboard graph controls and responsive layouts | Professional linguistic review, independent WCAG audit and fully differentiated Simple/Engineering modes remain open |
| 26 Architecture/performance/security | Implemented architecture; partial assurance | Typed engine/workers, bounded parsers, pinned dependencies, CSV protection, 1,000-load/35,040-interval numerical fixture | Earlier browser p95 is historical; no new browser performance, peak-memory, penetration or cloud-ownership certification |
| 27 Standards/data rights | Partial / external | `REFERENCE_MANIFEST.md`, `DATA_SOURCES.md`, source-bearing manual worksheets and unchanged approved asset | No invented standards tables. Licensed current normative data, manufacturer curves and jurisdiction packs require acquisition/review |
| 28 Numerical fixtures | Verified within declared models | F01–F19 supported arithmetic/state cases and F20 partial integration evidence below | Independent fixtures validate implemented equations, not universal physical-model or regulatory correctness |
| 29 Full acceptance verification | Partial; candidate gates recorded separately | 331 current numerical tests, production build, focused current/report regressions and rendered PDF review | Current browser/offline/clean-checkout gate results are in `TEST_EVIDENCE.md`; exhaustive full-spec matrix remains open |
| 30 Milestones | Partial | Usable workflows across milestones 1–5; implemented-scope release gates | Milestone 6 full original-spec acceptance remains open |
| 31 Continuation/checkpoints | Synchronized, verified, integrated and deployed | Published branch `51736e6`; PR #2 merged main `92d5c43`; GitHub validation and Pages deployment succeeded; original checkout preserved | Release evidence is recorded separately from remaining original-spec acceptance |
| 32 Deliverables | Current continuation delivered | Source/lockfile/assets/instructions/docs/cases/tests and reviewed report samples; live Pages release | Full original-scope acceptance remains partial; see the remaining work below |
| 33 Definition of done | **Not fully accepted** | Implemented local workflow is usable and tested as described | Full listed original definition remains broader than the accepted initial implementation |

## Independent fixtures F01–F20

The named tests below are actual test names or direct prefixes in the cited files. “Verified” applies to the documented model and fixture; it is not installation approval.

| Fixture | Status | Concrete proof |
| --- | --- | --- |
| F01 2.3 kW / 230 V / PF 1 → 10 A | Verified | `engine.test.ts`: `F01/F02: 2.3 kW / 230 V...`; actual heater browser flow B1 |
| F02 8 h → 18.4 kWh; €0.30 → €5.52 | Verified | Same independent fixture; B1 verifies energy; T47 bill arithmetic U |
| F03 50% duty → 9.2 kWh, still 10 A | Verified | `F03: energy duty never reduces on-state current`; B1 edits duty and checks both values |
| F04 7.5 kW shaft motor conversion | Verified | `F04: motor shaft rating converts once`; independent 8.333333 kW / 14.150742 A expectations |
| F05 signed reactive cancellation | Verified | `F05: leading/lagging cancellation preserves branch current`; branches remain individually loaded |
| F06 quarter-hour energy/hour average | Verified | `F06: quarter-hour integration preserves average power`; T44 U |
| F07 balanced/one-phase neutral | Verified | `F07: balanced currents cancel neutral; one phase returns 10 A`; T28 U |
| F08 0.4 Ω outgoing + return at 10 A | Verified | `F08: two 0.4 Ω conductors at 10 A drop 8 V`; T16/T17 U |
| F09 0.80→0.95 PF correction | Verified | `F09: 10 kW PF correction...`; T33 independent kvar expectation U |
| F10 noon export/evening import separate | Verified | `F10: noon export and evening import cannot cancel physical flows` |
| F11 battery efficiencies applied once | Verified | `F11: charging 2 kWh AC at 90%, then discharging...`; final 6.8/4.3 kWh expected |
| F12 usable delivered battery energy | Verified | `F12: a 10 kWh battery from 80% to 20%...`; expected 5.4 kWh AC |
| F13 DST/leap calendar | Verified | Two `F13` tests: 23/25-hour days and 696-hour leap February; B1 actual DST worker result |
| F14 missing evidence invalidates pass | Verified | `F14: removing ampacity evidence invalidates an old pass`; individual incomplete state |
| F15 locked phase/group constraints | Verified supported heuristic | `F15: phase balancing preserves locks...`; BOT preview/acceptance test, conservative EV-envelope tests |
| F16 no unverified island supply | Verified model boundary | `F16: grid-following PV and battery cannot serve an island...`; stored energy is not refilled |
| F17 infeasible EV deadline | Verified | `F17: an infeasible EV deadline reports unmet energy...`; `engine-bot.test.ts` partial-hour application/current test |
| F18 invalid import preservation/round-trip | Verified native model; broader paths partial | Two `F18` tests; malformed JSON/CSV browser flow B1; actual persisted-data/copy recovery B2; recognized legacy tests I |
| F19 conservation/SOC/power boundaries | Verified supported dispatch | `F19: interval energy closes at all SOC and power boundaries`; complete energy-balance loops across SOC/generation/load/grid cases |
| F20 shared revision/stale-result protection | Partial full-system acceptance | `F20: calculation outputs retain the input revision...`; stale PDF rejection R; stale BOT rejection; B2 actually cancels old-range worker and retains only new-range output. Exhaustive agreement of every requested view/report/scenario combination remains open |

## Toolbox inventory T01–T51

All rows are **implemented and example-verified within the stated method scope**. U contains independent numerical/check-state fixtures; B1 executed every tool’s real “Load worked example” → “Calculate” UI. These are sampled numerical/UI checks, not an assertion that every possible input branch, Apply-to-object path or manufacturer model has been accepted. Numerical examples are opt-in labelled analytical inputs.

| Tool | Actual tool | Implementation | Independent fixture/check evidence |
| --- | --- | --- | --- |
| T01 | Ohm’s law | `src/tools/fundamentals.ts` | U: 10 A; overdetermined-input consistency; B1 example executed |
| T02 | DC load power/energy | `src/tools/fundamentals.ts` | U: 0.72 kWh; B1 example executed |
| T03 | Single-phase AC current/power | `src/tools/fundamentals.ts` | U: 10 A on-state; B1 example executed |
| T04 | Balanced three-phase current/power | `src/tools/fundamentals.ts` | U: 17.320508 A on-state; B1 example executed |
| T05 | Signed power triangle | `src/tools/fundamentals.ts` | U: 5 kVA magnitude; signed quadrants; B1 example executed |
| T06 | Series/parallel resistance | `src/tools/fundamentals.ts` | U: 4 Ω equivalent; stated topology; B1 example executed |
| T07 | Series RLC impedance | `src/tools/fundamentals.ts` | U: 31.415927 Ω inductive reactance; B1 example executed |
| T08 | Engineering units | `src/tools/fundamentals.ts` | U: 4,800 converted energy units; explicit conversion; B1 example executed |
| T09 | Useful output → electrical input | `src/tools/fundamentals.ts` | U: 8.333333 kW electrical input; B1 example executed |
| T10 | Motor input/current | `src/tools/motors.ts` | U: 14.150742 A line current; B1 example executed |
| T11 | Torque/speed/power | `src/tools/motors.ts` | U: 15.707963 kW shaft power; B1 example executed |
| T12 | Synchronous speed/slip | `src/tools/motors.ts` | U: 4% slip; B1 example executed |
| T13 | Star/delta winding relations | `src/tools/motors.ts` | U: 34.641016 A line current; compatible winding assumption; B1 example executed |
| T14 | Motor start sequence | `src/tools/motors.ts` | U: 6 s entered start period; independent start PF; B1 example executed |
| T15 | Conductor resistance/temperature | `src/tools/cables.ts` | U: 0.83755 Ω operating resistance; B1 example executed |
| T16 | DC complete-loop drop | `src/tools/cables.ts` | U: 8 V drop; B1 example executed |
| T17 | AC drop/rise | `src/tools/cables.ts` | U: 8 V signed drop; supported single/balanced-three-phase model; B1 example executed |
| T18 | Route length/cross-section by drop | `src/tools/cables.ts` | U: 38.333333 m for entered criterion; not ampacity selection; B1 example executed |
| T19 | Conductor loss energy | `src/tools/cables.ts` | U: 0.32 kWh window loss; B1 example executed |
| T20 | Ampacity corrections | `src/tools/cables.ts` | U: 21.6 A corrected capacity; entered source/factors; B1 example executed |
| T21 | Device/load/cable checks | `src/tools/cables.ts` | U: Separate meets/fails checks; aggregate remains incomplete without full evidence; B1 example executed |
| T22 | Simplified fault current | `src/tools/cables.ts` | U: 0.475 kA minimum-factor estimate; B1 example executed |
| T23 | Loop/disconnection worksheet | `src/tools/cables.ts` | U: 1.365625 Ω entered-Ia limit; B1 example executed |
| T24 | Adiabatic withstand | `src/tools/cables.ts` | U: 82,656.25 A²s entered thermal withstand; B1 example executed |
| T25 | PE/bonding worksheet | `src/tools/cables.ts` | U: 2.5 mm² controlling entered requirement; B1 example executed |
| T26 | Connected/coincident demand | `src/tools/supply.ts` | U: 10.56 kW target with explicit allowance; B1 example executed |
| T27 | Phase-current imbalance | `src/tools/supply.ts` | U: 50% maximum deviation/mean; B1 example executed |
| T28 | Fundamental neutral phasors | `src/tools/supply.ts` | U: 0 A balanced neutral; B1 example executed |
| T29 | Transformer current/loading/loss | `src/tools/supply.ts` | U: 840 W entered-model loss; B1 example executed |
| T30 | Generator capacity | `src/tools/supply.ts` | U: 6 kW real-power headroom; B1 example executed |
| T31 | Inverter/overload envelope | `src/tools/supply.ts` | U: 2 kW continuous headroom; B1 example executed |
| T32 | UPS energy runtime | `src/tools/supply.ts` | U: 1.8 h energy-only runtime; B1 example executed |
| T33 | PF correction | `src/tools/supply.ts` | U: 4.213159 kvar compensation; B1 example executed |
| T34 | Capacitor elements | `src/tools/supply.ts` | U: 66.314560 μF per element; B1 example executed |
| T35 | Supplied harmonics/RMS/THD | `src/tools/supply.ts` | U: 50% THD relative to fundamental; B1 example executed |
| T36 | Battery usable energy | `src/tools/renewables.ts` | U: 5.4 kWh available AC energy; B1 example executed |
| T37 | Battery rates/runtime | `src/tools/renewables.ts` | U: 5.4 h feasible constant-load runtime; B1 example executed |
| T38 | Chronological battery dispatch | `src/tools/renewables.ts` | U: 4.3 kWh final stored energy; conservation cases; B1 example executed |
| T39 | PV yield/clipping | `src/tools/renewables.ts` | U: 17.28 kWh pre-clipping daily energy; B1 example executed |
| T40 | PV string voltage/current | `src/tools/renewables.ts` | U: 549 V cold string Voc; entered manufacturer ratings; B1 example executed |
| T41 | Supplied wind energy | `src/tools/renewables.ts` | U: 3.6 kWh delivered energy; B1 example executed |
| T42 | EV deadline feasibility | `src/tools/profiles.ts` | U: 10.8 kWh unmet battery energy; B1 example executed |
| T43 | Managed charging allocation | `src/tools/profiles.ts` | U: 12 kWh unmet; stated shared-window, constant-background scope; B1 example executed |
| T44 | Power-profile integration | `src/tools/profiles.ts` | U: 0.25 kW whole-window average; B1 example executed |
| T45 | Load factor/duration curve | `src/tools/profiles.ts` | U: 0.625 load factor; B1 example executed |
| T46 | Demand-factor definitions | `src/tools/profiles.ts` | U: 0.75 coincidence factor; B1 example executed |
| T47 | Interval tariff/demand bill | `src/tools/economics.ts` | U: 5.52 total bill estimate; import/export and entered tax basis; B1 example executed |
| T48 | Standby/replacement savings | `src/tools/economics.ts` | U: 21.12 kWh reduction; B1 example executed |
| T49 | Operational carbon | `src/tools/economics.ts` | U: 400 kg CO₂e using entered sourced factor; B1 example executed |
| T50 | Payback/break-even | `src/tools/economics.ts` | U: 5-year simple payback; B1 example executed |
| T51 | NPV/sensitivity | `src/tools/economics.ts` | U: 41.322314 currency-unit NPV; B1 example executed |

## Remaining work, ordered by impact

1. Continue recording distinct source, validation and deployment receipts for future releases; the current continuation is published.
2. Extend full-spec acceptance: every action/failure path, all four languages, Simple/Engineering detail modes, independent accessibility review, storage quota and update-interruption scenarios.
3. Obtain actual licensed jurisdiction/manufacturer data and independent engineering validation before enabling automatic standards recommendations, coordination or dynamic equipment claims.
4. Review the German/Yorùbá/Pidgin technical narratives professionally; existing catalogue and browser checks establish implementation coverage only.
5. Configure optional connected AI, cloud ownership/sync, OCR/resource feeds or physical telemetry only with real services, explicit scope and live verification. Preserve complete local operation.

Unified backup, radial graph editing, source/library workflows, cumulative feeders, calendar/flexible planning, selected reports and model-derived BOM are now implemented; they are not remaining empty-page work. Their supported boundaries and untested combinations remain explicit.
