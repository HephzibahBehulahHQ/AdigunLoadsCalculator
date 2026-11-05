# Test evidence

Final candidate verification is being recorded here. No unrun check is counted as passed.

## Verification environment and checks

Environment: Node 24.22.1, Linux managed workspace. Dependencies are pinned by the committed lockfile.

- `npm run typecheck`: passed after integration syntax repairs.
- `npm test`: **215 tests across 8 files passed** in the final numerical/reference run (4.91 seconds). Covers independent electrical, calendar/DST, battery/conservation, EV, toolbox, billing/PDF and performance fixtures.
- `npm run build`: passed; lazy report and BOT chunks plus scoped service worker were generated.
- PDF QA: seven-page English/Yoruba customer estimates and six-page German engineering report generated from explicit analytical fixtures, rendered and inspected. Repeated headers, totals and Unicode checked. pdfplumber found no out-of-page glyphs.
- Browser QA: empty project, 2.3 kW heater → 10 A and 18.4 kWh; 50% duty → 9.2 kWh while current remains 10 A; undo, JSON export and saved reload passed. Malformed JSON preserved the current project; valid CSV preview/apply passed.

## Browser runtime

The standard Chromium binary cannot initialize its process-singleton socket in this runtime. The installed headless-shell binary is usable in a single-process configuration. The local Playwright fixture therefore creates a fresh browser per test; ordinary environments use standard Chromium. Development server and browser must share the same execution process tree in this environment.

The first full browser run exposed test-harness lifecycle/selector defects. Those failures were retained and repaired; they were not counted as application successes. The final combined browser result is recorded below after rerun.

## Additional executed checks

- Workspace: 6 browser tests passed, including every tool example, DST CSV, local BOT confirmation/undo, locale/theme and mobile flows.
- Recovery: 5 browser tests passed for conflicting tabs, save-copy recovery, trash protection, invalid stored records, calendar cancellation and unsaved input safety.
- Measurements: 1 actual browser CSV/save/reload/backup/mobile test passed.
- Billing: 1 actual browser test passed for exact €53.53, persistence, PDF signature, print lifecycle, Yoruba and 390 px layout.
- Production offline smoke passed: service worker controls the page, saved project survives offline reload, and the toolbox calculates while offline, with no page errors. Machine-readable evidence is `offline-verification.json`.
- Customer PDFs and print examples in `examples/` are analytical fixtures and contain no real customer data.

## Final candidate gate

- `npm run lint`: passed, including TypeScript and Prettier.
- `npm test`: 215/215 passed across eight test files.
- `npm run build`: passed; 2,291 modules, scoped service worker and lazy feature chunks.
- Combined browser gate: **15/15 tests passed in 1.2 minutes**, covering billing, measurements, planning, recovery and workspace flows.
- Production offline candidate checks passed at both `/` and `/AdigunPowerLab/`, including lazy billing and actual PDF export, with zero page errors and zero failed requests. The rerun exposed `Vary: Origin` differing between precache fetches and module requests; the fix matches only the dedicated static-asset cache while ignoring that header and isolates cache cleanup by scope.
- Actual development-browser benchmark: 1,000 loads, 30 real editor saves, p95 184.3 ms; annual UI worker simulation 3,910 ms, 35,040 rows, 8,760,000 kWh within floating-point tolerance. See `browser-performance.json` and `PERFORMANCE.md` for method and limits.
- Fresh-checkout verification passed for exact remote source candidate `cdff7e3591b0ab8c28cf3ed280379678834e2677`: `git clone --depth 1 --branch feat/power-studio`, asserted `git rev-parse HEAD`, `npm ci`, lint, all 215 tests (4.89 seconds), production build and repository-subpath offline smoke including actual PDF. No working-tree source files or node_modules were copied into the recovery checkout.
- `npm audit --json`: zero known advisory vulnerabilities across the pinned tree; see `security-audit.json`. This is not a penetration test.

## Not claimed

No physical hardware, connected AI provider, cloud owner-scoped authorization, licensed standards dataset, or complete WCAG audit has been tested. Node timing is not substituted for browser timing; see PERFORMANCE.md.

## Delivered source

The verified application source candidate is `cdff7e3591b0ab8c28cf3ed280379678834e2677`; subsequent delivery documentation records these observations. [PR #1](https://github.com/HephzibahBehulahHQ/AdigunPowerLab/pull/1) contains the exact branch/integration history. Public deployment has not been run.

## Remote CI

[GitHub Actions run 42125403239](https://github.com/HephzibahBehulahHQ/AdigunPowerLab/actions/runs/42125403239) completed successfully for exact candidate `cdff7e3591b0ab8c28cf3ed280379678834e2677`. Its fresh Ubuntu runner passed dependency installation, TypeScript/Prettier lint, all unit tests, production build, Chromium installation, the full browser suite, root offline smoke, repository-subpath offline smoke and static artifact upload. The earlier candidate failed offline module lookup; the documented cache fix resolved that failure before this successful run.
