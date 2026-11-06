# AdigunPowerLab user guide

## Help inside the application

Select **Help & Support** beside the detail-level control on any workspace. The same guide is available from the sidebar help icon and **Ctrl/Cmd+K** search. Search in the selected language or English, or enter an exact tool number such as **T01**. Filters separate workflow guides from tool guides. Every tool guide displays its actual input names, units, conditions and catalogue example values.

Select a guide to read its steps and practical example. **Open workspace** and **Open tool** lead to the existing application controls. Reading help does not change a project. If a form has unfinished edits, finish or cancel those edits before using a guide to navigate away. Escape closes help and restores keyboard focus to its opening control.

Help is available offline after the production app has been cached. **Open a GitHub issue** opens the repository's issue form in a separate tab and needs an internet connection; it never sends project data automatically. Include only the minimum non-private example needed to explain a problem. The four-language guide has catalogue and browser coverage; professional technical-language review remains separate.

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

Customer bills have their own **Save draft locally**, **Export draft JSON** and **Import draft JSON** controls. A native engineering JSON export and a billing draft are distinct unless the current export explicitly includes the billing document. Use **Settings → Workspace backup** for a single validated archive containing projects, histories, bills, saved measurements, library versions and embedded diagram/scenario metadata. Separate exports remain useful for individual documents. Browser storage can be removed by browser/device cleanup and does not synchronize between devices.

Use **Move to trash** and **Restore** in the project switcher to recover deleted projects. A separate device needs the exported file; local history is not remote backup.

## Import measured intervals

Open **Schedules & Simulation → Measured intervals**. Upload a CSV, choose the timestamp and power columns, select W or kW, and enter the actual elapsed interval in minutes. Timestamps mark the start of each interval and require `Z` or an explicit UTC offset. Preview validates the inputs. Gaps remain missing; the energy totals cover observed intervals only. Negative power represents export.

**Save measured data** stores the validated dataset separately for the current project and browser. **Reopen saved measurements** restores and revalidates it. Use **Workspace backup** after saving measurements for combined recovery on another device; **measurement backup** remains an independent portable export. The cleaned CSV normalizes power and interval energy to kW and kWh. An invalid replacement leaves the previous validated display and saved dataset intact.

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

The assistant window supports close, minimize, maximize and restore, with retained context for each project during the session. Chat text is local session content; it is not included in the engineering project backup.

## Keyboard, language and display

- **Ctrl/Cmd+K:** command/search palette.
- **Ctrl/Cmd+S:** save the engineering project.
- **Ctrl/Cmd+Z:** undo a project command outside text fields.
- **Ctrl/Cmd+Shift+Z:** redo outside text fields.
- **Escape:** close the current dialog where supported.

Choose English, Deutsch, Yorùbá or Nigerian Pidgin in the header. Theme and motion controls are in Settings. Reduced motion keeps calculations functional without continuous effects. Some detailed technical explanations/source content may remain English; a translated selector does not mean every external document has been translated or every message reviewed by a native specialist.

For supported numerical boundaries and source rights, read `CALCULATION_METHODS.md`, `TOOL_METHODS.md` and `DATA_SOURCES.md`. For what has actually passed verification, read `TEST_EVIDENCE.md` and `ACCEPTANCE_MATRIX.md`.


## Project actions and reviewed changes

The toolbar **Project** menu provides New, Open, Rename, Duplicate, Save, Export, Import, Revision history, Trash, Restore and Close. Close saves the active project and opens a blank workspace. An unsuccessful save retains the working project. **History & Issues → Compare revisions** shows field-level differences from the current inputs to a saved revision. Select fields to restore; include dependent boards/circuits when restoring a removed load. The validator rejects dangling references. Whole-revision restore and Undo/Redo remain available.

**Load Schedule → Bulk operations** supports selected rows, source/issue/category/phase/board filters, reviewed changes and clipboard rows. Invalid pasted records are rejected together. Right-click a load, or focus its name and press **Shift+F10**, for Inspect, Edit, Duplicate and Delete. Circuit phase changes move the associated single-phase loads together. Unlock a load before changing its phase/connection; automatic and reviewed proposals respect locks.

## Equipment, sources and organization

Save an existing load as a reusable template or create a sourced equipment record in **Equipment Library**. Search/filter the library and mark favorites. Adding a template creates an independent load and retains the template/version reference. Editing a template opens a replacement preview: choose which linked loads receive the new electrical nameplate fields and evidence. Quantities, schedules, names and circuit assignments remain as entered. Other projects keep their saved copies. Historical template versions are retained; workspace and equipment JSON exports preserve the saved history.

**Boards & Circuits → Site, buildings and zones** organizes boards without creating electrical connections. Groups can be created, renamed, reparented and removed. Removing a group moves its child groups to its parent and detaches assigned boards from that group.

**Motors & Supply → Source register** records actual grid, transformer, generator, inverter or UPS ratings, derating, evidence, served boundary and optional overload envelope. Continuous kW, kVA, phase current and explicit starting envelope checks are independent. Island, transfer, restart and black-start declarations are entered evidence, not instructions to switch hardware or proof of safe paralleling.

## Diagram and spatial inspection

**Single-Line Studio** supports actual Connect/Disconnect operations, dependency-aware board/circuit changes, notes, manual coordinates, auto-layout, labels, keyboard pan and SVG/PDF exports. Planning source records have no active additional-feed edge. The **Analytical spatial view** projects this same graph into a perspective view with orbit/elevation/zoom, board isolation, keyboard selection and an hourly cursor. Coordinates express hierarchy rather than surveyed distances. Hourly flow labels are model energy averages; they are not measured telemetry or start currents. Exported spatial SVG contains the displayed graph.

## Calendar, feeders and dispatch

**Schedules & Simulation** separates the representative daily profile from a completed real-time calendar range. A completed range supports Play/Pause, speed, stepping, keyboard scrubbing and full CSV export. Changing the proposed dates preserves the previous completed range with its actual dates; Cancel stops the new worker. Advanced planning includes overlapping operating windows, weekday/season/effective-date rules, holiday exceptions, explicit timed cycles/start events and constrained flexible-process windows. Review a feasible schedule before applying it; Undo restores the prior project.

**Cables & Protection → Feeder assessment** evaluates an actual source-to-load route with shared downstream currents, conductor/neutral drops, losses and independent capacity checks. Enter impedance and ampacity evidence. Running and starting assumptions remain explicit. Missing data produces an incomplete result, not a default pass.

**Renewables & Storage** accepts entered PV/wind profiles, inverter/grid power limits, battery reserves, dispatch strategies and optional actual-time outage ranges. Supply, transfer/island/black-start evidence and entered priorities constrain backup service. Per-step physical conservation separates import, export, curtailment, storage losses and unmet demand. **EV & Flexible Loads** supports explicit charging energy or SOC-derived requirements, charger/vehicle/minimum power, one/three-phase constraints, deadlines and generation-following or price priorities. Previewed application creates actual dated load schedules.

## Comparisons, imports and reports

Scenario creation freezes its source baseline. Field-level comparisons can apply selected differences through validation and Undo. Sensitivity studies calculate independent copies. **Dated engineering comparison** evaluates both input sets over the same explicit period (up to 31 elapsed days), with an optional common outage. It separately labels design current, interval demand, starting capacity, physical energy, storage losses, feeder loss at the start instant, costs and entered-factor emissions. Missing evidence is unavailable; different currencies are not subtracted. Export the actual comparison as CSV/JSON.

Native/CSV imports expose **New project**, **Merge into current project**, and **Replace current project contents**. Merge assigns fresh object IDs and remaps dependencies while retaining the destination supply/tariff/energy settings. Replacement keeps the destination project identity and remains undoable. CSV column mapping and explicit W/kW/VA/kVA/A rating units are available before Apply. Canonical CSV numbers use decimal points; interactive German numeric entries use decimal commas. List inputs use semicolons to avoid confusing decimal commas with separators.

**Reports & Estimates** exposes 16 report sections and editable report metadata. Save metadata, choose sections and **Freeze report preview**. PDF, print, snapshot JSON and report CSV exports use that immutable reviewed revision. Calendar, renewable dispatch and EV sections use actual completed runs; absent evidence is labelled unavailable. A project edit invalidates older analysis evidence. The model-derived BOM leaves unknown prices blank; enter prices, labour, waste and contingency, review the resulting bill changes and apply them explicitly. Manual bill lines are preserved.

## Display and recovery controls

Navigation groups collapse. Desktop split handles resize navigation and inspector; keyboard arrows/Home/End or the Settings sliders provide alternatives. Settings remembers widths, detail mode and motion choices; **Reset layout** restores accessible defaults. Simple mode explains core quantities and collapses advanced assumptions while keeping failed/incomplete checks visible. **Paused** stops ongoing decorative animation and timeline playback. Each chart has a data-table alternative.

Workspace restore validates the complete archive and integrity digest before applying one transaction. Restore as copies remaps project relationships and embedded references; preserve-if-absent never overwrites an existing project or silently bypasses a trash record. Save measurements before backing them up. Invalid raw import text is not represented as saved engineering evidence. Keep downloaded backups outside browser storage.
