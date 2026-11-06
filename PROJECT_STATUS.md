# AdigunPowerLab — current status

Date: 6 November 2026. Owner: Hephzibah Behulah.

## Active milestone: field usability and recovery

The owner has given standing authorization to continue unfinished project work, merge and deploy each verified milestone, then continue without a new approval request. Work is active on `feat/field-usability` from main `9fe8d479b36075e85c3751644320e209a746602c`.

Current scope: differentiated Simple/Engineering views, keyboard/dialog accessibility, safe application updates, storage failure recovery and deterministic local BOT lifecycle. The first checkpoint contains modal focus/background isolation, accessible field hints and update/draft protection infrastructure. Integration and release gates are pending; no new live release is claimed by this checkpoint.

## Current continuation

**The Engine 1.1.0 continuation is merged and publicly deployed.** The owner explicitly authorized push, merge into main and public deployment on 6 November 2026. Published branch: `51736e6f17987e113f663662919f6318f37b8a84`; deployed main: `92d5c437f7b48f2f6ea65ae55c5aa3d2992aefa9`. This delivery checkpoint records release evidence without changing application source.

This branch starts from remote `feat/complete-workflows` commit `0905f574216a36207698454501a6b8f6147d76c9` and recovers 28 unfinished tracked files in local commit `43fe0f9`. The previous working checkout was preserved.

The recovered scope includes reviewed bulk/project commands, editable topology and spatial views, sourced equipment/version workflows, building/source records, chronological calendars and start events, cumulative feeders, flexible-load planning, interval tariffs, unified workspace recovery, bounded scenario comparisons, selected reports and model-derived BOM/estimates. This is an update to the usable local product, not blanket acceptance of every original requirement.

## Correctness repairs

- Feeder capacity checks include the highest phase or neutral current. Mixed AC/DC boundaries are unsupported; missing evidence is unavailable rather than zero.
- Circuit worksheets use actual DC current, preserve incomplete/unsupported supply evidence and check neutral conductor capacity independently of phase-current envelopes.
- Engineering reports expose separate feeder voltage and conductor-capacity outcomes with currents, limits and source evidence.
- Tariff integration and demand eligibility split exact entered fractional boundaries, effective dates and DST changes.
- Re-selecting an unchanged circuit value preserves state/revision without a spurious error. Browser checks distinguish displayed hourly flow from fixed equipment-nameplate text.

## Verified gates

- Clean dependency installation, TypeScript/Prettier lint and production build passed.
- **331/331 numerical/reference/parser/report tests across 21 files passed**, including 1,000 loads and 35,040 annual intervals.
- **32/32 browser tests passed in 2.1 minutes** from the independent checkout, covering editing, all 51 tools, schedules, storage/recovery, reports/billing, topology/spatial view, languages and responsive workflows.
- Production offline checks passed at `/` and `/AdigunPowerLab/`: saved-project recovery, toolbox, lazy billing and real PDF export; zero page errors/failed requests.
- Ten Yoruba report pages and three German vector-diagram pages were rendered and inspected; no out-of-page glyphs. Desktop/mobile/spatial screenshots were inspected.
- Fresh local Git checkout `77d02dc406d384d9a709ef69e2c85282fe9201c6` passed `npm ci`, lint, all 331 tests, build and subpath offline/PDF. Its only later change was the spatial browser assertion; the independent checkout fast-forwarded to `93d5e46b484ac787c0b57249e2eaea10dd179ef8` and passed lint plus the complete browser gate. No application source, dependency or build configuration changed between these revisions.

Commands and boundaries are in `docs/TEST_EVIDENCE.md`; machine-readable results are in `docs/continuation-verification.json`.

## Synchronization and publication

The owner explicitly approved publication and resolved the earlier approval-review block. The published branch and merged main both match verified tree `d3c925aece07c5b56ae5011a338eb18abb93a5d0`. Existing remote work was preserved; no force push was used.

- [PR #2](https://github.com/HephzibahBehulahHQ/AdigunPowerLab/pull/2) merged the continuation into main at `92d5c437f7b48f2f6ea65ae55c5aa3d2992aefa9`.
- GitHub branch and PR validation runs [42168975954](https://github.com/HephzibahBehulahHQ/AdigunPowerLab/actions/runs/42168975954) and [42168980729](https://github.com/HephzibahBehulahHQ/AdigunPowerLab/actions/runs/42168980729) succeeded, including browser and offline gates.
- [Pages deployment 42169441584](https://github.com/HephzibahBehulahHQ/AdigunPowerLab/actions/runs/42169441584) succeeded for that exact main revision.
- Post-merge validation [42169342041](https://github.com/HephzibahBehulahHQ/AdigunPowerLab/actions/runs/42169342041) also succeeded. Public browser checks verified Engine 1.1.0, 10 A / 18.4 kWh, half-duty 9.2 kWh, saved reload, frozen report/BOM export and an actual customer PDF with the expected €53.53 total.
- Public application: [AdigunPowerLab](https://hephzibahbehulahhq.github.io/AdigunPowerLab/). Release receipts are in `docs/DEPLOYMENT.md` and `docs/continuation-verification.json`.

## Remaining scope

Full original-spec acceptance remains partial. Connected AI, cloud identity/sync, hardware telemetry/control and licensed jurisdiction/manufacturer datasets are not configured. Professional language review, full independent WCAG review, Simple/Engineering detail-mode completion and exhaustive failure-path coverage remain open. See `docs/ACCEPTANCE_MATRIX.md` and `docs/KNOWN_LIMITATIONS.md`.

## Next action

The authorized release is complete. Continue the remaining acceptance work listed above. This documentation receipt follows the deployed revision and does not change application assets.
