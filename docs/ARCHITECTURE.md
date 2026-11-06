# Architecture

AdigunPowerLab is a React/TypeScript application built with Vite. It is browser-local and deployable as a static application. Calculations, project editing, local persistence and reports do not require an account or a connected AI provider.

## Ownership and data flow

The application owns one active `Project` in `src/App.tsx`. All engineering edits go through the shared change operation, which copies the previous state, applies the mutation, advances the revision and retains undo history. The pure engine derives results from that same project. Tables, diagrams, overview metrics, reports and local assistant context consume those results rather than maintaining independent hardcoded totals.

| Location | Responsibility |
| --- | --- |
| `src/domain/types.ts` | Typed project, loads, boards, circuits, tariffs, storage, EV, issues and calculation traces |
| `src/domain/project.ts` | New entities, deep-copy duplication and full native-project import validation |
| `src/engine/electrical.ts` | Entry-mode normalization, signed power, phase currents, daily profiles, topology and project totals |
| `src/engine/simulation.ts` | Calendar-range integration and chronological generation/storage calculations |
| `src/engine/planning.ts` | Phase-balance proposals, charging allocation and supporting planning calculations |
| `src/engine/assessments.ts` | Explicit manual-data electrical assessments |
| `src/tools/` | T01–T51 standalone worksheets, shared input validation, formula/result metadata and independent example inputs |
| `src/features/` | Load editing, workspace pages, energy planning, toolbox and billing UI |
| `src/storage/projects.ts` | IndexedDB projects/revisions, recoverable trash and harmless UI preferences |
| `src/import-export/files.ts` | Native project/load-file import preview and exports |
| `src/import-export/legacy.ts` | Strict source-calculator V1/V2 adapter, original JSON retention and semantic-change warnings |
| `src/import-export/measurements.ts` | Timestamped measurement CSV parsing and validation |
| `src/import-export/reports.ts` | Decimal-safe customer billing, CSV protection and Unicode PDF generation |
| `src/bot/` | Deterministic local commands, typed proposals and assistant UI |
| `src/i18n/index.tsx` | Four-language dictionary, common validation templates and locale formatting |
| `src/workers/simulation.ts` | Background calendar simulation with main-thread cancellation by worker termination |
| `public/assets/` | Exact approved corporate JPG and licensed Unicode PDF font |

## Pure numerical boundary

The electrical engine does not read the DOM, storage, network or an implicit current time. Inputs contain the revision and timestamps. Result traces describe model, assumptions, origin, scope and completeness. Unsupported true-PF/reactive models, missing cable/device data and topology problems remain explicit issues.

Standalone toolbox experiments do not silently modify a project. They accept validated inputs and return values, units, formula, notes, warnings and source references. An arithmetic result labelled `calculated` is not an installation approval.

## Persistence and recovery

The `AdigunPowerLab` IndexedDB database stores engineering projects and revision history. Autosave runs after committed edits. Writes check the expected saved revision; a concurrent tab cannot silently overwrite a newer revision. BroadcastChannel reports conflicting edits. Trash is a recoverable record flag rather than immediate destruction.

IndexedDB version 2 uses one database for projects, revisions, bills, measurements, metadata and recovery records. A validated one-time migration retains the original legacy databases and quarantines invalid records. Separate billing/measurement APIs remain compatible, but unified archive restoration uses one transaction with prevalidated IDs, relationships and SHA-256 integrity. Restore-as-copies remaps related project IDs and diagram/BOM references; preserve-if-absent never overwrites records or tombstones. Native project JSON remains a narrower engineering export.

Small non-sensitive preferences such as language, theme and layout are namespaced separately. Browser storage is not encrypted secret storage and is not a remote backup. The app does not upload customer data merely because the network becomes available.

## Report pipeline

Reports clone their source before asynchronous rendering. Engineering PDFs reject a project/result revision mismatch. jsPDF is loaded on demand and embeds local DejaVu Sans; the renderer paginates, repeats schedule headers and adds page numbers. Customer billing parses decimal strings into integer minor units before line rounding, discounts and tax. JSON retains original strings and stable IDs; CSV neutralizes formula-looking text.

The report workspace exposes 16 sections and freezes a project/result/evidence snapshot. Completed calendar, energy and EV results carry their actual project/revision, inputs and calculation timestamp. Stale results are discarded. Saved measurement and bill records are loaded when freezing; absent evidence is explicit. SVG/PDF diagrams derive from the same typed graph. Model-derived BOM lines require entered pricing and reviewed merging into customer bills. Direct PDF output is independent of browser-print layout.

## Assistant, translations and deployment boundary

Adigun BOT is local deterministic help, not an imitation generative provider. Changes are typed proposals bound to project ID and revision; application requires confirmation and stale proposals are rejected. Provider credentials, remote accounts, cloud project storage and equipment control are not implemented by the static shell.

Language, currency and engineering jurisdiction remain independent. Navigation, all 51 toolbox titles/categories, common controls, billing and PDF headings have explicit EN/DE/YO/PCM messages. Untranslated technical prose remains visible in English instead of being hidden or misrepresented as reviewed translation. Native-language review is a separate release requirement.

The build uses a project base path suitable for GitHub Pages. Deployment configuration and offline caching are owned by the product repository. Their verified status is recorded in `TEST_EVIDENCE.md`; a checked-in workflow, manifest or successful build alone is not proof of deployment or offline acceptance.


## Shared editing and asynchronous analysis

`src/commands/projectCommands.ts` is the validated mutation boundary for load, circuit, board, topology and tool-application commands. Previews are bound to project identity/revision. A private WeakMap retains a validated candidate and canonical source/command fingerprints; Apply checks both fingerprints and returns a detached copy. Public preview fields, deserialized previews and same-revision mutated sources cannot bypass validation. The root workspace owns Undo/Redo, optimistic persistence and autosave.

Calendar, dispatch and period-comparison workers are cancelled on obsolete project/input revisions or unmount. Result consumers preserve the distinction between representative on-state models, energy-average profiles, explicit starting events and measured data. Dated comparison orchestration uses the existing pure engine functions, with a declared 31-day interactive scope. Perspective rendering is lazy, derives hierarchy/edges from the same graph and does not act as a solver. The report workspace, PDF renderer, BOT and spatial scene are deferred feature chunks.
