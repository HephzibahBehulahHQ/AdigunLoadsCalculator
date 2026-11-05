# Test evidence

This file is updated with the final candidate and commands after integration verification. No unrun check is counted as passed.

## Initial integrated checks

Environment: Node 24.22.1, Linux managed workspace. Dependencies are pinned by the committed lockfile.

- `npm run typecheck`: passed after integration syntax repairs.
- `npm test`: 187 passed at the first integrated run. Covers independent electrical, calendar/DST, battery/conservation, EV, toolbox, billing/PDF and performance fixtures.
- `npm run build`: passed; lazy report and BOT chunks plus scoped service worker were generated.
- PDF QA: seven-page English/Yoruba customer estimates and six-page German engineering report generated from explicit analytical fixtures, rendered and inspected. Repeated headers, totals and Unicode checked. pdfplumber found no out-of-page glyphs.
- Browser QA: empty project, 2.3 kW heater → 10 A and 18.4 kWh; 50% duty → 9.2 kWh while current remains 10 A; undo, JSON export and saved reload passed. Malformed JSON preserved the current project; valid CSV preview/apply passed.

## Browser runtime

The standard Chromium binary cannot initialize its process-singleton socket in this runtime. The installed headless-shell binary is usable in a single-process configuration. The local Playwright fixture therefore creates a fresh browser per test; ordinary environments use standard Chromium. Development server and browser must share the same execution process tree in this environment.

The first full browser run exposed test-harness lifecycle/selector defects. Those failures were retained and repaired; they were not counted as application successes. The final browser result is recorded below after rerun.

## Not claimed

No physical hardware, connected AI provider, cloud owner-scoped authorization, licensed standards dataset, or complete WCAG audit has been tested. Node timing is not substituted for browser timing; see PERFORMANCE.md.
