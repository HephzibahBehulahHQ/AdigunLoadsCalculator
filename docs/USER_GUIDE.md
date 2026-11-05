# AdigunPowerLab user guide

## Start with your installation

Open the project switcher in the header and create a named project. A new project starts without customer equipment. Open **Settings** to enter the supply, voltage, frequency, timezone, currency, jurisdiction and design assumptions. Language is independent of currency and engineering criteria.

Choose **Add load**. Enter a name, rating, quantity, electrical connection and voltage basis. Select the correct input mode: electrical kW, apparent kVA, nameplate current, motor shaft output or explicit real/reactive power. Shaft-output mode uses efficiency to find electrical input; do not choose it for a rating that is already electrical input.

Set operating hours, starting hour, energy duty, utilization and standby power. Energy duty affects the average energy used while scheduled; on-state current remains a separate result. Record whether values come from a nameplate, measurement, datasheet or an assumption. Saving the load recalculates the active project and makes the edit undoable.

## Find the right workspace

| Destination | Available workflow |
| --- | --- |
| Overview | Inspect installed power, demand, daily estimates, phase loading and current issues; open the calculation trace |
| Load Schedule | Add, edit, duplicate, delete, select and filter loads; inspect their calculated input, current and energy |
| Boards & Circuits | Create boards/circuits, organize load assignments and review phase-balancing suggestions |
| Single-Line Studio | Inspect a data-bound diagram, select loads, zoom, fit, toggle flow animation and export SVG; edit topology through boards/circuit assignments |
| Schedules & Simulation | Run a calendar-range calculation using the project timezone, cancel the worker, inspect interval results and export the series |
| Cables & Protection | Use the relevant validated toolbox worksheets with your supplied cable/device evidence |
| Motors & Supply | Calculate motor, transformer, generator, inverter and UPS planning quantities within each worksheet's stated model |
| Power Quality | Inspect power-factor correction, capacitor sizing and supplied harmonic data |
| Engineering Toolbox | Search all 51 worksheets, enter inputs, calculate, open a labelled worked example, reset, copy or export the actual result |
| Renewables & Storage | Enter PV/storage assumptions and an explicit hourly generation profile; simulate dispatch and an optional outage |
| EV & Flexible Loads | Enter charging sessions, requirements and limits; inspect delivered/unmet energy and deadline feasibility |
| Scenarios & Optimization | Create a separate scenario project and compare its metrics with the baseline |
| Costs & Carbon | Enter prices, tariff bands, charges, taxes and emissions assumptions; inspect the planning estimates |
| Equipment Library | Open generic analytical equipment starting points or explicitly labelled worked reference projects |
| Reports & Estimates | Generate an engineering PDF or prepare a separate customer estimate/invoice |
| Engineering Reference | Read supported equations, model assumptions, source links and keyboard shortcuts |
| History & Issues | Inspect project issues and saved local revisions; restore a selected revision through the project workflow |
| Settings | Change project defaults, theme, language and motion; access backups and recoverable trash |

Library records are starting assumptions, not verified manufacturer specifications. Reference cases are opt-in instructional projects with expected results. They do not represent your surveyed installation.

## Interpret results

Use **Calculation trace** to inspect the formula, model, revision, origin and assumptions. Check the issue register before using a report. `Calculated` means the supported arithmetic was evaluated. `Incomplete` means required inputs/evidence are absent. `Unsupported` means the selected condition is outside the declared model. A passed numerical check does not establish installation certification or manufacturer approval.

Quick daily and 30-day figures are planning estimates. Use the calendar simulation for actual elapsed dates and timezone transitions. Enter physical chronological generation when studying import/export or storage; peak-sun-hours alone does not provide an hourly PV curve.

## Save, back up and recover

Engineering edits autosave locally. The header shows the actual save state. **Ctrl/Cmd+S** requests an explicit save. If a save fails, export a backup before reloading. If another tab has a newer revision, preserve your changes through export or a copy, then reopen the saved project.

**Export project** creates native PowerLab engineering JSON. **Export loads** creates a spreadsheet-friendly CSV schedule. Import opens a preview with validation errors before applying changes; invalid input preserves the current project. Unsupported schemas are rejected unless an explicitly implemented adapter recognizes them. See `LEGACY_MIGRATION.md` for the current legacy support boundary.

Customer bills have their own **Save draft locally**, **Export draft JSON** and **Import draft JSON** controls. A native engineering JSON export and a billing draft are distinct unless the current export explicitly includes the billing document. Export both when making a complete backup. Browser storage can be removed by browser/device cleanup and does not synchronize between devices.

Use **Move to trash** and **Restore** in the project switcher to recover deleted projects. A separate device needs the exported file; local history is not remote backup.

## Print a bill for a customer

1. Open **Reports & Estimates → Customer bill**.
2. Choose **Customer estimate** or **Invoice**. Enter your document number and dates.
3. Enter the actual supplier and customer details. Add tax/registration reference, customer reference and payment details where applicable.
4. Add material, labour or other lines. Enter the description, quantity and unit price. Quantities support three decimal places; prices use the currency's minor-unit precision.
5. Enter any discount and tax percentage. The preview shows the exact subtotal, discount, net, tax and final total.
6. Save the draft. Choose **Download PDF** for a paginated Unicode PDF, **Print / Save PDF** for the browser's print dialog, or **Export CSV** for the priced schedule.

Exports remain disabled until required fields and amounts are valid. The reason is shown beside the form. Bill quantities come from the values you enter; decorative diagram lines do not measure cable length. The app does not invent company information, signatures or legal/tax certification.

Billing rounds each line to currency precision, applies discount to subtotal, then applies tax to the discounted net amount. This order is documented in the exported PDF. Importing a billing JSON draft requires confirmation and does not discard your current document on a validation failure.

## Use Adigun BOT

Open the single assistant launcher. Local mode can explain current results, identify missing inputs, propose phase balancing and prepare report context. It operates on actual project state and remains usable without an online model provider.

A narrow structured equipment command is supported:

```text
load: Workshop heater; 2.3 kW; 230 V; PF 1; 8 h
```

The assistant previews the proposed load and the affected demand. Review the proposal and explicitly apply it; it enters the same undoable project workflow. Editing the project invalidates a stale proposal. A generative AI backend, OCR, telemetry and account service are not implied by the local assistant.

The assistant window supports close/minimize and retained session context. Refer to the actual controls for resize/restore behavior. Chat text is local session content unless a separate persistence feature explicitly says otherwise.

## Keyboard, language and display

- **Ctrl/Cmd+K:** command/search palette.
- **Ctrl/Cmd+S:** save the engineering project.
- **Ctrl/Cmd+Z:** undo a project command outside text fields.
- **Ctrl/Cmd+Shift+Z:** redo outside text fields.
- **Escape:** close the current dialog where supported.

Choose English, Deutsch, Yorùbá or Nigerian Pidgin in the header. Theme and motion controls are in Settings. Reduced motion keeps calculations functional without continuous effects. Some detailed technical explanations/source content may remain English; a translated selector does not mean every external document has been translated or every message reviewed by a native specialist.

For supported numerical boundaries and source rights, read `CALCULATION_METHODS.md`, `TOOL_METHODS.md` and `DATA_SOURCES.md`. For what has actually passed verification, read `TEST_EVIDENCE.md` and `ACCEPTANCE_MATRIX.md`.
