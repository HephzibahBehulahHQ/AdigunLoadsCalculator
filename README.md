# AdigunPowerLab

Electrical & Engineering Power Studio · Hephzibah Behulah → HB Elektroniker → AdigunPowerLab.

A local-first React/TypeScript workspace for explainable electrical load studies, circuit organization, energy planning, 51 engineering worksheets, customer estimates and printable bills. New projects start empty. Seven analytical reference cases are available only when explicitly opened.

## Run

Requires a compatible Node.js release (tested with Node 24.22.1) and npm.

```sh
npm ci
npm run dev -- --host 127.0.0.1
npm run lint
npm test
npm run build
npm run preview -- --host 127.0.0.1
```

Browser verification:

```sh
npx playwright install chromium
npm run test:browser
npm run test:offline
```

Dependencies are pinned in `package-lock.json`. The application is a client-side static build; there is no account service, secret API key, paid dependency or background customer-data transfer.

## Working features

- Empty/new projects, IndexedDB saves, undo/redo, named scenario copies, local revisions, trash/restore, JSON and CSV import preview/export.
- Electrical kW, kVA, nameplate current, shaft-output motor and explicit P/Q entry; single-phase, L–L, balanced three-phase and DC models with stated assumptions.
- Distinct on-state current, demand allowance and energy duty; signed reactive power, phase and fundamental neutral currents, circuit assignments and phase-balancing previews.
- A data-bound radial single-line diagram with SVG export, equipment selection and calculated-flow animation.
- Cancellable calendar simulation in a worker, actual IANA timezone/DST handling and 15-minute/hourly results.
- Chronological entered PV profiles, battery state/limits/losses, grid import/export and supported outage assumptions; EV scheduling under entered site and conservative phase constraints.
- All 51 toolbox forms with validated inputs, opt-in examples, formula traces, exports and manual evidence requirements. See [tool methods](docs/TOOL_METHODS.md).
- Tariff and carbon assumptions, separately maintained customer billing drafts, decimal-safe amounts, quantities/labor/material lines, tax/discount, CSV/JSON backups, direct Unicode PDF and print layouts.
- Local deterministic Adigun BOT with actual result explanations, missing inputs, preview/confirmation for load and phase proposals, and real report export.
- Dark/light/system themes, reduced-motion settings and English/German/Yoruba/Nigerian Pidgin interface dictionaries. Detailed diagnostic/technical prose coverage and review limits are recorded honestly.

## Engineering scope

Results are planning calculations under entered assumptions. A successful worksheet check is not installation approval. Licensed standards tables, manufacturer coordination/curve datasets, physical verification, live telemetry and connected generative AI are not invented or supplied by this build. Manual evidence fields keep unavailable checks incomplete. See [calculation methods](docs/CALCULATION_METHODS.md), [data sources](docs/DATA_SOURCES.md) and [known limitations](docs/KNOWN_LIMITATIONS.md).

The durable product specification is `AdigunPowerLab  Pursuing Goal prompt.txt`. [PROJECT_STATUS.md](PROJECT_STATUS.md) and the [acceptance matrix](docs/ACCEPTANCE_MATRIX.md) distinguish implemented behavior from remaining requirements; this initial implementation is not a claim that every broad product-specification requirement has passed full acceptance.

## Data and offline use

Engineering projects and local history use IndexedDB. Customer bills have their own IndexedDB drafts and explicit JSON backup/import. Measured-data CSV imports and their validated backups use a separate local store. Export engineering projects and billing drafts for backups; browser storage is not remote backup. Imports are reviewed before changing a project, and unsupported/malformed files preserve the current work. The production build caches its scoped application assets for offline reopening after a successful first load. Development mode does not register an offline worker.

## Deployment

`.github/workflows/ci.yml` checks source and creates a static build artifact. `.github/workflows/deploy.yml` provides a manually invoked GitHub Pages build/deploy workflow. Enable GitHub Pages with **GitHub Actions** as its source and dispatch the workflow only under the owner's publication authorization. Relative asset paths support repository Pages URLs. A committed workflow is not evidence that a deployment ran; the current deployment state is recorded in PROJECT_STATUS.md.

## Documentation

[Architecture](docs/ARCHITECTURE.md) · [User guide](docs/USER_GUIDE.md) · [Reference manifest](docs/REFERENCE_MANIFEST.md) · [Migration](docs/LEGACY_MIGRATION.md) · [Test evidence](docs/TEST_EVIDENCE.md) · [Performance](docs/PERFORMANCE.md).

The approved corporate image remains unchanged. Its provenance and the bundled Unicode font license are recorded in the reference manifest. Reference repositories were read-only during implementation.
