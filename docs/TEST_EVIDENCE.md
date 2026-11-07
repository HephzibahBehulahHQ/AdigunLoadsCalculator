# Test evidence

## Localized toolbox continuation: 7 November 2026

Based on main `18f7a04`; first source checkpoint `b792614`. Focused checks passed 15 search unit cases, TypeScript, two real browser flows, YAML parsing and 10 Pages/provenance guard cases. Search coverage includes all four displayed languages, English fallback, German category/description matching, accented and unaccented Yoruba, whitespace/ID matching and no-result recovery. Browser evidence preserves the calculated worksheet JSON through search and language changes and restores keyboard focus after clearing an empty search.

`npm ci` passed in the separate continuation worktree. Complete lint/unit/build/browser/production/update/offline gates, fresh-checkout recovery, exact candidate/main revisions and deployed live checks are recorded in [PR #6](https://github.com/HephzibahBehulahHQ/AdigunPowerLab/pull/6) as they complete. No pending gate is counted as passed. Existing electrical, billing, storage and help acceptance below remains historical evidence, not a new measurement.

## Searchable-help continuation: 6 November 2026

Frozen application checkpoint: `4112b88891b0c549152fc3c70e2d797810c41ecc`. Release/integration receipts, including the final exact candidate and all workflow conclusions, are maintained in [PR #5](https://github.com/HephzibahBehulahHQ/AdigunPowerLab/pull/5). Subsequent release-documentation changes do not substitute for the full exact-revision repository workflow.

- Fresh-checkout recovery reproduced `npm ci`, `npm run lint`, `npm test` (**371/371 across 25 files**) and `npm run build`.
- `tests/help-search.test.ts` and `tests/i18n.test.ts`: **24/24 passed**, including all 51 tool IDs in four languages, actual localized save-error queries, accent-insensitive search, unknown queries and complete displayed-guide translation coverage.
- `tests/browser/help-support.spec.ts` covers visible desktop/mobile help, keyboard/focus lifecycle, localized search, command handoff, real 230 V / 23 Ω = 10 A calculation, repeated tool requests, unchanged project exports/reload, unfinished form protection and cached production help.
- Focused production calculation/navigation/persistence checks passed without weakening numerical assertions. An earlier development-only calculation check failed during active translation editing; concurrent HMR is a plausible but unproven cause. Final suites run against frozen files and built assets.
- Inspected desktop and 360 px mobile screenshots. The mobile page width was exactly 360 px and the help dialog scroll/client widths matched; no horizontal page overflow or page errors were observed.
- Deployment YAML parsing and 33 mocked workflow/provenance/failure/stale-main checks passed. Artifact fields were additionally checked against the actual GitHub artifact API. These checks are not the final live deployment receipt.
- Required final gates: complete development browser suite; production browser suite including offline help; `update-smoke.mjs` and `offline-smoke.mjs` at both `/` and `/AdigunPowerLab/`; successful repository CI on the final candidate and merged main; successful Pages deployment and live UI verification. See the release record for their observed results.

Professional translation review, independent accessibility certification, connected-service testing and hardware validation are not claimed.

## Historical workflow continuation: 6 November 2026

Locally verified source: `93d5e46b484ac787c0b57249e2eaea10dd179ef8`. This recovers the continuation based on remote `0905f574216a36207698454501a6b8f6147d76c9`, repairs feeder/circuit evidence and exact tariff boundaries, and updates report capacity visibility and no-op circuit controls. Published branch `51736e6f17987e113f663662919f6318f37b8a84` includes the final documentation checkpoint; merged and deployed main is `92d5c437f7b48f2f6ea65ae55c5aa3d2992aefa9`.

### Numerical and rendered-output checks

- `npm ci`: passed using the pinned lockfile.
- `npm test`: **331/331 tests across 21 files passed** (6.90 seconds in the working checkout). This includes the independent 1,000-load/35,040-interval annual fixture; Node timing is not browser interaction latency.
- Independent new regressions cover neutral-conductor overload, mixed AC/DC boundaries, real DC circuit current, missing PF evidence, separate exported capacity checks, fractional import/export tariff boundaries, coverage gaps, demand eligibility and DST transitions.
- `npm run build`: passed after TypeScript checks.
- `POWERLAB_PDF_QA_DIR=... npm test -- tests/reports.test.ts`: 5/5 passed and produced actual Yoruba engineering-report and German vector-diagram samples.
- PDF visual QA: rendered and inspected all 10 report pages and 3 diagram pages. Text/table/Unicode placement remained readable; pdfplumber found zero out-of-page glyphs. Vector diagrams intentionally use overlapping tiles with a separate complete legend. Samples in `docs/examples/` contain analytical inputs only.
- Desktop workspace and 360 px mobile settings screenshots were inspected. This is sampled layout review, not independent WCAG certification.

### Browser and offline gates

- Initial browser gate: 28 passed, 4 failed. Two failures were stale locale/ambiguous SVG selectors; one exposed an unchanged circuit selection raising a spurious error; recovery failed during concurrent source edits and required a stable rerun. These failures are not counted as passes.
- The next stable run passed 31/32: a spatial assertion still matched hidden nameplate text rather than displayed hourly power. The assertion was narrowed to the visible power value and independently passed its focused rerun.
- **Final independent-checkout browser gate: 32/32 passed in 2.1 minutes** at `93d5e46b484ac787c0b57249e2eaea10dd179ef8`, including all 51 toolbox examples and the previously failing recovery/billing/planning/spatial cases. No application source was edited during this run.
- Production offline checks passed at both `/` and `/AdigunPowerLab/`: service worker control, saved-project recovery, toolbox calculation, lazy billing and actual PDF export, with zero page errors and zero failed requests.
- Clean-checkout recovery: a new local Git clone at `77d02dc406d384d9a709ef69e2c85282fe9201c6`, with no copied source or node_modules, passed `npm ci`, lint, all 331 tests (7.77 seconds), production build and repository-subpath offline/PDF. The checkout then fast-forwarded to `93d5e46b484ac787c0b57249e2eaea10dd179ef8`, changing only one browser assertion file, and passed lint and all 32 browser cases. Application source, dependencies and build configuration are identical across these revisions. This is local recovery evidence, not proof of a new remote backup.

### Publication and limits

The initial public push was rejected for missing explicit publication authorization. The owner subsequently gave full approval to push, merge into main and deploy publicly on 6 November 2026. The approved publication then completed through [PR #2](https://github.com/HephzibahBehulahHQ/AdigunPowerLab/pull/2).

- Remote branch validation [42168975954](https://github.com/HephzibahBehulahHQ/AdigunPowerLab/actions/runs/42168975954) and PR validation [42168980729](https://github.com/HephzibahBehulahHQ/AdigunPowerLab/actions/runs/42168980729) both succeeded. Clean installation, lint, unit tests, build, browser tests, root offline and repository-subpath offline checks all passed.
- Uploaded branch and merged main match verified tree `d3c925aece07c5b56ae5011a338eb18abb93a5d0` exactly.
- Pages workflow [42169441584](https://github.com/HephzibahBehulahHQ/AdigunPowerLab/actions/runs/42169441584) successfully built and deployed exact main revision `92d5c437f7b48f2f6ea65ae55c5aa3d2992aefa9`. See `DEPLOYMENT.md` for the public URL and release receipts.
- Post-merge validation [42169342041](https://github.com/HephzibahBehulahHQ/AdigunPowerLab/actions/runs/42169342041) also completed successfully for that exact revision.
- Public interactive checks passed: Engine 1.1.0; 2.3 kW / 230 V → 10 A and 18.4 kWh; 50% duty → 9.2 kWh with 10 A unchanged; saved reload; frozen report/BOM with matching exported revision 4; analytical bill total €53.53 and a real one-page PDF download. PDF signature, trailer, document reference and total were independently checked. Exact values and export fingerprints are in `continuation-verification.json`.
- The first terminal-browser attempt lacked its expected executable; the next launched Chromium but received `ERR_EMPTY_RESPONSE` before any app assertions. Those environment failures are preserved as failures, and the live checks above were completed using the supported cloud browser.

No physical hardware, licensed standards/manufacturer dataset, connected AI, cloud ownership/security, professional language review, full independent accessibility audit or exhaustive original-spec acceptance is claimed. Historical browser performance below belongs to the earlier release.

## Historical initial release

Final candidate verification is being recorded here. No unrun check is counted as passed.

### Verification environment and checks

Environment: Node 24.22.1, Linux managed workspace. Dependencies are pinned by the committed lockfile.

- `npm run typecheck`: passed after integration syntax repairs.
- `npm test`: **215 tests across 8 files passed** in the final numerical/reference run (4.91 seconds). Covers independent electrical, calendar/DST, battery/conservation, EV, toolbox, billing/PDF and performance fixtures.
- `npm run build`: passed; lazy report and BOT chunks plus scoped service worker were generated.
- PDF QA: seven-page English/Yoruba customer estimates and six-page German engineering report generated from explicit analytical fixtures, rendered and inspected. Repeated headers, totals and Unicode checked. pdfplumber found no out-of-page glyphs.
- Browser QA: empty project, 2.3 kW heater → 10 A and 18.4 kWh; 50% duty → 9.2 kWh while current remains 10 A; undo, JSON export and saved reload passed. Malformed JSON preserved the current project; valid CSV preview/apply passed.

### Browser runtime

The standard Chromium binary cannot initialize its process-singleton socket in this runtime. The installed headless-shell binary is usable in a single-process configuration. The local Playwright fixture therefore creates a fresh browser per test; ordinary environments use standard Chromium. Development server and browser must share the same execution process tree in this environment.

The first full browser run exposed test-harness lifecycle/selector defects. Those failures were retained and repaired; they were not counted as application successes. The final combined browser result is recorded below after rerun.

### Additional executed checks

- Workspace: 6 browser tests passed, including every tool example, DST CSV, local BOT confirmation/undo, locale/theme and mobile flows.
- Recovery: 5 browser tests passed for conflicting tabs, save-copy recovery, trash protection, invalid stored records, calendar cancellation and unsaved input safety.
- Measurements: 1 actual browser CSV/save/reload/backup/mobile test passed.
- Billing: 1 actual browser test passed for exact €53.53, persistence, PDF signature, print lifecycle, Yoruba and 390 px layout.
- Production offline smoke passed: service worker controls the page, saved project survives offline reload, and the toolbox calculates while offline, with no page errors. Machine-readable evidence is `offline-verification.json`.
- Customer PDFs and print examples in `examples/` are analytical fixtures and contain no real customer data.

### Final candidate gate

- `npm run lint`: passed, including TypeScript and Prettier.
- `npm test`: 215/215 passed across eight test files.
- `npm run build`: passed; 2,291 modules, scoped service worker and lazy feature chunks.
- Combined browser gate: **15/15 tests passed in 1.2 minutes**, covering billing, measurements, planning, recovery and workspace flows.
- Production offline candidate checks passed at both `/` and `/AdigunPowerLab/`, including lazy billing and actual PDF export, with zero page errors and zero failed requests. The rerun exposed `Vary: Origin` differing between precache fetches and module requests; the fix matches only the dedicated static-asset cache while ignoring that header and isolates cache cleanup by scope.
- Actual development-browser benchmark: 1,000 loads, 30 real editor saves, p95 184.3 ms; annual UI worker simulation 3,910 ms, 35,040 rows, 8,760,000 kWh within floating-point tolerance. See `browser-performance.json` and `PERFORMANCE.md` for method and limits.
- Fresh-checkout verification passed for exact remote source candidate `cdff7e3591b0ab8c28cf3ed280379678834e2677`: `git clone --depth 1 --branch feat/power-studio`, asserted `git rev-parse HEAD`, `npm ci`, lint, all 215 tests (4.89 seconds), production build and repository-subpath offline smoke including actual PDF. No working-tree source files or node_modules were copied into the recovery checkout.
- `npm audit --json`: zero known advisory vulnerabilities across the pinned tree; see `security-audit.json`. This is not a penetration test.

### Not claimed

No physical hardware, connected AI provider, cloud owner-scoped authorization, licensed standards dataset, or complete WCAG audit has been tested. Node timing is not substituted for browser timing; see PERFORMANCE.md.

### Delivered source

The verified application source candidate is `cdff7e3591b0ab8c28cf3ed280379678834e2677`; subsequent delivery documentation records these observations. [PR #1](https://github.com/HephzibahBehulahHQ/AdigunPowerLab/pull/1) contains the exact branch/integration history. At the time of this initial source-delivery note, public deployment had not yet run; the subsequent historical deployment is recorded in DEPLOYMENT.md.

### Remote CI

[GitHub Actions run 42125403239](https://github.com/HephzibahBehulahHQ/AdigunPowerLab/actions/runs/42125403239) completed successfully for exact candidate `cdff7e3591b0ab8c28cf3ed280379678834e2677`. Its fresh Ubuntu runner passed dependency installation, TypeScript/Prettier lint, all unit tests, production build, Chromium installation, the full browser suite, root offline smoke, repository-subpath offline smoke and static artifact upload. The earlier candidate failed offline module lookup; the documented cache fix resolved that failure before this successful run.
