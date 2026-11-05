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

Customer billing uses a separate `AdigunPowerLab-billing` IndexedDB store keyed by project ID, with its own revision token and explicit Save draft action. Active drafts also survive route changes in session memory. `loadBillingDocument` and `saveBillingDocument` provide integration points for combined backups; the exported billing JSON remains independently portable. Cross-database restores need caller-owned validation and rollback. See the current backup behavior in `USER_GUIDE.md` and `LEGACY_MIGRATION.md`.

Small non-sensitive preferences such as language, theme and layout are namespaced separately. Browser storage is not encrypted secret storage and is not a remote backup. The app does not upload customer data merely because the network becomes available.

## Report pipeline

Reports clone their source before asynchronous rendering. Engineering PDFs reject a project/result revision mismatch. jsPDF is loaded on demand and embeds local DejaVu Sans; the renderer paginates, repeats schedule headers and adds page numbers. Customer billing parses decimal strings into integer minor units before line rounding, discounts and tax. JSON retains original strings and stable IDs; CSV neutralizes formula-looking text.

The PDF renderer supports optional engineering sections: summary, loads, circuits, issues and trace. The first release UI may expose the standard complete report rather than every renderer option. Direct PDF output is independent of browser-print layout.

## Assistant, translations and deployment boundary

Adigun BOT is local deterministic help, not an imitation generative provider. Changes are typed proposals bound to project ID and revision; application requires confirmation and stale proposals are rejected. Provider credentials, remote accounts, cloud project storage and equipment control are not implemented by the static shell.

Language, currency and engineering jurisdiction remain independent. Navigation, all 51 toolbox titles/categories, common controls, billing and PDF headings have explicit EN/DE/YO/PCM messages. Untranslated technical prose remains visible in English instead of being hidden or misrepresented as reviewed translation. Native-language review is a separate release requirement.

The build uses a project base path suitable for GitHub Pages. Deployment configuration and offline caching are owned by the product repository. Their verified status is recorded in `TEST_EVIDENCE.md`; a checked-in workflow, manifest or successful build alone is not proof of deployment or offline acceptance.
