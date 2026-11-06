# AdigunPowerLab complete user guide

Updated 6 November 2026. This guide matches the platform's implemented menus, project setup interview, explicit local saving, customer bills and engineering tools. Open **Help & Support** in the app or press **F1** to read it without leaving an active project or editor. Press **Escape** to return.

The detailed instructions are in English. The in-app help shell and menu labels follow English, Deutsch, Yorùbá or Nigerian Pidgin as selected; detailed technical prose and external references are not claimed to be fully translated.

## Find a task

1. [Start a project](#task-1)
2. [Navigating the platform](#task-2)
3. [Understand the input units](#task-3)
4. [Save, refresh and resume](#task-4)
5. [Project menu and saved work](#task-5)
6. [Overview](#task-6)
7. [Load Schedule](#task-7)
8. [Bulk actions & clipboard](#task-8)
9. [Review project changes](#task-9)
10. [Import files and supported formats](#task-10)
11. [Boards & Circuits](#task-11)
12. [Single-Line Studio](#task-12)
13. [Analytical spatial view](#task-13)
14. [Schedules & Simulation](#task-14)
15. [Advanced schedules, starts and flexible loads](#task-15)
16. [Measured intervals](#task-16)
17. [Cables & Protection](#task-17)
18. [Motors & Supply](#task-18)
19. [Power Quality](#task-19)
20. [Engineering Toolbox](#task-20)
21. [Renewables & Storage](#task-21)
22. [EV & Flexible Loads](#task-22)
23. [Costs & Carbon](#task-23)
24. [Scenarios & Optimization](#task-24)
25. [Equipment Library](#task-25)
26. [Reports & Estimates](#task-26)
27. [Create and print a customer bill](#task-27)
28. [Build an estimate from model quantities](#task-28)
29. [History & Issues](#task-29)
30. [Settings](#task-30)
31. [Workspace backup & restore](#task-31)
32. [Adigun BOT](#task-32)
33. [Engineering Reference](#task-33)
34. [Warnings and common problems](#task-34)
35. [Get support](#task-35)

[All 51 engineering worksheets](#tool-directory) include exact inputs, worked-example values, calculated output, formula, notes and sources. The example values below are produced from the same live tool registry used by the app. They are analytical practice inputs, not surveyed installations or manufacturer approval.

## Task 1

### Start a project

A project is one installation or power study. Begin with its basic details, add your equipment, then save the work you want to keep.

1. On a fresh visit, open **Overview** and use **Project setup interview**. For another new study, open **Project** → **New project**, enter a clear name such as Workshop power study, then click **Create**.
2. In setup step 1, enter **Project name**, choose **Context** and **Currency**, then click **Next step**. These describe the study; changing language does not change its currency.
3. In setup step 2, enter the actual **L–N voltage**, **L–L voltage**, **Frequency** and **Supply limit**. Use the supply information for your installation, then click **Next step**.
4. In step 3, review the details. Click **Finish setup** when they are correct. This finishes the questions; click **Save project** separately to keep the project. You can save partway through the interview and resume that step later.
5. Click **Add load** to enter one item of equipment, or open **Load Schedule** for the equipment list. Finish the load form before saving the project. **Calculate** opens the calculation trace; results update from the entered project inputs.
6. Before leaving, click **Save project** and wait for **Saved locally**. After a reload, use **Resume project** and choose your saved project. A new visit starts a fresh setup instead of restoring unsaved work.

#### Practice example

Practice with a clearly labelled training project: add one single-phase resistive load with electrical input 2.3 kW, 230 V, power factor 1, quantity 1 and 8 operating hours. With full utilization and energy duty, its current is 10 A and its daily energy is 18.4 kWh. These are practice inputs, not a recommendation for an installation.

#### Remember

- If you do not know a supply or nameplate value, find the actual evidence before relying on the result. Defaults and worked examples are assumptions, not measurements.

## Task 2

### Navigating the platform

The header selects projects, the left navigation selects workspaces, and the right inspector explains the selected item or calculation.

1. Click a left-hand menu such as **Load Schedule** or **Reports & Estimates** to open that workspace. Click the group heading (**Workspace**, **Engineering**, **Energy & Planning** or **Resources**) to collapse or expand its menu items.
2. On a small screen, click **Open navigation**, choose a page, and the workspace becomes visible. **Collapse navigation** makes more room for the current page.
3. Click **Search** in the header or press Ctrl/Cmd+K. Enter a page name, equipment name or tool ID, then select the matching result to open it.
4. Click a load, board, circuit or diagram object to open its inspector. Read its values and evidence, use **Edit load** or **Edit selected object** to change it, and close the inspector with its X button.
5. Click **Help & Support** whenever you need instructions, or press F1 even while an editor is open. Search for a task, menu, warning or tool ID. The guide opens over your current work; close it or press Escape to return to that same work.

#### Buttons, controls and choices

| Control | What it does |
| --- | --- |
| Project name in the header | Opens the local project list. Choose a saved entry to reopen it. |
| Save status | Unsaved changes means work differs from the saved copy; Saving means a write is in progress; Saved locally appears after success; Save failed needs your attention. |
| Calculate | Opens the project calculation trace with the current revision, formulas, assumptions and issues. It does not save the project. |
| Undo / Redo | Reverses or reapplies a project edit. Disabled buttons mean there is no applicable history. These do not replace portable backups. |
| Simple / Engineering | Shows explained core values or expanded technical details. Failed and incomplete checks remain visible in both modes. |
| Language | Selects English, Deutsch, Yorùbá or Nigerian Pidgin. It does not convert currency or change engineering assumptions. |
| Footer issue count | Opens History & Issues. The engine version and current object counts are also shown in the footer. |
| Hephzibah Behulah logo | Opens the corporate website in another tab. |

## Task 3

### Understand the input units

Read the unit beside each field before typing. Similar-looking quantities answer different questions.

1. Find the value on the equipment nameplate, measurement or documentation and note its unit. Enter that value only in a field with the same unit, or use the Engineering unit converter worksheet first.
2. For an efficiency, power factor, duty or SOC field, check whether the label requests percent or a fraction from 0 to 1. For example, 90% is 0.9 in a 0–1 field; entering 90 there is invalid.
3. Check whether voltage is line-to-neutral (L–N), line-to-line (L–L) or DC, and whether a rating is per item or for the whole installation. Enter the quantity separately where requested.
4. Review the calculated units again after Calculate. Use the input example in each tool guide to learn the format, then replace practice values with your own evidence.

#### Buttons, controls and choices

| Control | What it does |
| --- | --- |
| V — voltage | The electrical potential difference at the equipment or supply. Select the correct AC/DC and line/phase basis. |
| A — current | The electrical current through a conductor. Average energy duty does not necessarily reduce its on-state value. |
| W / kW — real power | The rate at which useful electrical energy is transferred or consumed. 1 kW = 1,000 W; do not enter watts into a kW field without converting. |
| kWh — energy | Power accumulated over time. A constant 2 kW load for 3 hours uses 6 kWh before any other model adjustments. |
| kVA — apparent power | Voltage/current-based electrical capacity. It differs from real kW when PF is below 1. |
| kvar — reactive power | The reactive part of AC power. Sign/lagging/leading conventions matter when combining equipment. |
| PF — power factor | The relation between real and apparent power. Displacement PF and true PF describe different conditions; select the supported basis. |
| Efficiency / utilization / energy duty | Efficiency relates useful output to electrical input; utilization scales the entered operating point; energy duty describes average operation while scheduled. They are not interchangeable. |
| Ω — resistance / Hz — frequency | Resistance describes opposition to current in the stated model; frequency is AC cycles per second. |
| m / mm² | Metres describe route length; square millimetres describe conductor cross-section. They are different measurements. |
| Ah / kWh / SOC | Ampere-hours describe charge capacity; kWh describes energy. SOC is the battery state of charge, entered in the form's specified fraction or percent. |
| rpm / N·m | Revolutions per minute describe rotational speed; newton-metres describe torque. Motor shaft output still needs efficiency to obtain electrical input. |

## Task 4

### Save, refresh and resume

Only an explicit successful save keeps the current project for another visit. Unsaved drafts are temporary and separate from saved projects.

1. Finish an open equipment/settings/report form using its own **Save**, **Add load**, **Save report details** or reviewed **Apply changes** button. Then click **Save project** in the workspace toolbar, or use Ctrl/Cmd+S outside another dialog. The checkpoint keeps the current engineering project, setup answers/step, current customer bill and BOT conversation/composer together.
2. Wait until the status says **Saved locally**. Do not treat **Saving** as a completed save. If **Save failed** appears, keep the tab open, read the error, and export a copy before trying again.
3. If you refresh or close with unsaved changes, the browser may show its standard leave-page warning. Choose Cancel/Stay to keep the current work. The platform does not delete anything while asking the question.
4. If you choose Leave/Reload, the next load starts a fresh project setup and discards unsaved temporary work. Previously saved projects remain in the local project list.
5. Click **Resume project**, find the project by its name and saved time, and click it. The saved engineering project, setup progress and supported session context reopen. Changes made after the last successful save are not in that saved copy.
6. The bill also has a Save draft locally action, which saves the bill with its associated project checkpoint. Save measured datasets with **Save measured data** before keeping a combined backup. Use **Settings** → **Workspace backup & restore** for a portable archive of saved projects, revisions, bills and measurements; export individual drafts when needed.

#### Practice example

Save a project named Workshop A, change a load from 2.3 kW to 3 kW, then cancel the browser's leave warning: 3 kW remains on screen. If you leave without saving, Resume project reopens the earlier 2.3 kW version.

#### Remember

- Saved locally means this browser profile on this device. It is not cloud synchronization. Browser cleanup, private browsing or device loss can remove local data; keep downloaded backups elsewhere.
- The browser controls the warning wording and whether it appears. Mobile browsers or forced browser shutdowns may skip it, so save before leaving.
- Opening Help & Support does not navigate away, complete a form, save it or clear it. Press F1 from an open editor, then Escape to return to that form. If Save project asks you to finish/apply an editor, do that first; an unsubmitted editor is not silently treated as a saved engineering input.

## Task 5

### Project menu and saved work

Use the Project menu for names, copies, imports, history, closing and recoverable deletion.

1. Open **Project** in the workspace toolbar. Choose the action from the menu below. If asked about unsaved changes, save first, discard deliberately, or cancel to remain on the current project.
2. For **Rename project**, enter the new name and confirm the form. Save the project afterward to keep the rename. For **Duplicate project**, review the new copy and save it with a name you can recognize.
3. For **Move to trash**, check the displayed project name before confirming. To recover it, choose **Restore from trash**, expand **Trash**, click **Restore** for the matching entry, then reopen it from the project list.

#### Buttons, controls and choices

| Control | What it does |
| --- | --- |
| New project | Opens the named-project creation form; Create begins a new study. |
| Open project / Resume project | Shows saved projects with their names, equipment counts and saved times. Click the desired entry. |
| Rename project / Duplicate project | Changes the current name or creates an independent copy; verify the active project name afterward. |
| Save project | Writes the current engineering project, setup progress, customer bill and BOT session together; wait for success. |
| Export project / Import project | Downloads native engineering JSON or previews a supported JSON/CSV import. |
| Revision history | Opens saved revisions and the issue register. |
| Close project | Leaves the active project and opens a fresh workspace; resolve any unsaved-change prompt first. |
| Move to trash / Restore from trash | Hides a saved project from the active list or recovers a trashed entry. Export a backup before browser cleanup. |

## Task 6

### Overview

Read the study's demand, energy, phases and issues before producing a report.

1. Click **Overview**. Enter equipment through **Add load**, or choose **Open reference case** to study a labelled analytical example in a separate project.
2. Read **Installed load**, **Design demand**, **Daily energy** and **Daily cost**. kW describes power; kWh describes energy over time. Costs use the prices entered in the project.
3. Inspect the demand profile and **Phase loading**. Open the chart's **Chart data table** for its numerical values when the graph is difficult to read.
4. Read **Project health** and **Issues**. Click **Calculate** to inspect the formula, assumptions and input revision behind the displayed results. Go to **Schedules & Simulation** for an explicit date range.

#### Remember

- Representative daily and 30-day estimates are planning summaries. They are not a completed calendar simulation or measured utility bill.

## Task 7

### Load Schedule

A load is an item that consumes electricity. Add its electrical data, operating schedule and source evidence.

1. Open **Load Schedule** → **Add load**. Enter **Name**, **Quantity** and **Rating**, then select the matching **Entry mode**: electrical kW, apparent kVA, nameplate current, motor shaft output or explicit real/reactive power.
2. Choose **Connection**, **Voltage**, **Phase** or **Phase pair**, **Power factor** and, when required, efficiency. Use shaft-output mode only when the rating is mechanical output; otherwise efficiency would be applied to the wrong quantity.
3. Enter operating hours, **Start hour**, **Energy duty**, **Utilization** and **Standby power**. Open **More assumptions** for advanced inputs; hiding this section does not disable those values.
4. Choose **Provenance** and enter **Source reference** so another person can tell whether the data came from a nameplate, measurement, datasheet or assumption. Review **Input preview**, then submit the form to add/update the load.
5. Click a load name to inspect it. Use the row's **Edit**, **Duplicate** or **Delete** controls; review a deletion before applying it. Search and phase filters narrow the displayed rows without removing equipment.
6. Click **Save project** after your changes. **Export** on the load schedule downloads a CSV of equipment; **Import** opens the validated project/CSV preview.

#### Buttons, controls and choices

| Control | What it does |
| --- | --- |
| Add from library | Opens reusable equipment. Review its assumptions and adjust the added load to your actual equipment. |
| Critical load | Marks a planning priority used by supported backup studies; it is not a hardware control. |
| Lock phase | Prevents supported phase-balancing operations from moving the load automatically. |
| Right-click / Shift+F10 | Opens the load actions menu for inspection, editing, duplication or deletion. |
| Back / Continue | Moves between load-list pages where pagination is shown. |
| Cancel | Closes the edit form without applying its pending changes. |

#### Remember

- Energy duty changes average energy while scheduled; it is not a safe way to reduce the on-state conductor current. Select an appropriate circuit or leave the load explicitly unassigned.

## Task 8

### Bulk actions & clipboard

Select several loads, review a shared change, and apply it together.

1. Open **Load Schedule** → **Bulk actions & clipboard**. Enter a name filter or choose category, phase, board or source filters. **Only loads with unresolved issues** limits the list to loads needing attention.
2. Tick individual loads or click **Select filtered loads**. Use **Clear selection** to remove the selection. Choose a **Bulk action** such as **Set field**, **Assign phase**, **Assign circuit**, **Set daily schedule**, **Attach source**, **Duplicate selected loads** or **Delete selected loads**.
3. Enter the requested value or destination. Click **Preview selected changes**, inspect Before/After and validation messages, then apply the reviewed changes. Cancel keeps the project unchanged; Undo can reverse a committed project edit.
4. For copied rows, click **Copy selected rows** then **Export copied rows** if you need a file. To bring rows in, click **Paste validated rows**, paste the row text or select a **Load row file**, use **Download headers template** if needed, then **Validate pasted rows**. Apply only after the preview is valid.

#### Remember

- Invalid pasted records are rejected together. The row-file limit is 2 MB. Replacing an advanced dated schedule with a basic daily schedule is a deliberate choice in the bulk form.

## Task 9

### Review project changes

A preview shows proposed changes before they modify your project. The same review pattern is used for bulk edits, topology, tool results and other supported actions.

1. After entering values in the relevant workspace, click its Preview action. Read the proposal summary, current revision and the table's Object, Field, Before and After columns.
2. Resolve errors before applying. Warnings describe assumptions or effects that need review. Expand **Read complete value** for long content; if only the first 250 changes are visible, use **Export preview** to inspect the entire proposal.
3. Click **Apply reviewed changes** to commit the reviewed proposal or **Cancel** to keep the project unchanged. If the project changed after the preview, close it and generate a fresh preview against the new revision.
4. Check the resulting project, use **Undo** if needed, then **Save project** to keep the desired version. Applying a project change and saving a durable checkpoint are separate actions.

## Task 10

### Import files and supported formats

Choose the importer that matches the kind of data. File extensions alone do not make a file compatible.

1. For an engineering project or load list, choose **Project** → **Import project** (or **Load Schedule** → **Import**) and select PowerLab .json or load-schedule .csv. This importer accepts up to 5 MB and 10,000 CSV loads.
2. For CSV, include a header row and at least one load. Match source columns in the preview and choose the correct rating unit: W, kW, VA, kVA, A or native entry mode. After changing the mapping, refresh the preview before applying.
3. Choose the destination: **New project** creates an independent project; **Merge into current project** adds imported objects while retaining current supply and tariff settings; **Replace current project contents** replaces the contents while keeping the current project identity.
4. Read every error and warning. Fix errors in the source or column mapping, then preview again. Click **Apply import** only when the preview is valid. A rejected file leaves the project unchanged; an applied merge or replacement can be undone.
5. For other data, use its dedicated importer from the format list below. A billing JSON file, workspace archive and engineering project JSON have different structures and must not be interchanged.

#### Buttons, controls and choices

| Control | What it does |
| --- | --- |
| PowerLab project JSON / load CSV | Project → Import project. The app also recognizes specific supported AdigunTokenCalculator V1/V2 exports; unrecognized legacy structures are rejected. |
| Customer bill JSON | Reports & Estimates → Customer bill → Import draft JSON, up to 2 MB. Review the replacement confirmation; Export draft JSON keeps a portable editable bill. |
| Measurement CSV / measurement backup JSON | Schedules & Simulation → Measured intervals → Open measured CSV or backup. CSV limit: 5 MB; measurement JSON: 32 MB. Map timestamp/power columns before preview. |
| Equipment library JSON | Equipment Library → Import equipment, up to 2 MB. Inspect the preview and Apply import to add supported equipment records. |
| Workspace backup JSON | Settings → Workspace backup & restore → Inspect workspace backup. Validate the entire archive before Restore reviewed backup; maximum 64 MiB. |
| PDF, image, DWG and spreadsheet workbook | These are not native project imports. Export compatible CSV from a spreadsheet first; PDF is an output/report format here, not an OCR importer. |

#### Practice example

For a basic CSV use headers name,rating,quantity,entrymode,voltage,connection,pf,phase,hoursperday,starthour,duty,utilization and a data row matching an exported load. The safest template is a real Export loads CSV from this platform; replace its values and retain supported field names.

#### Remember

- CSV numeric data uses decimal points. German interactive number fields accept decimal commas. For list-valued inputs, use semicolons to separate numbers so decimal commas are not mistaken for separators.

## Task 11

### Boards & Circuits

Organize the electrical path from the supply through boards and circuits to loads.

1. Open **Boards & Circuits**. Click **Add board**, enter its name, available ways and documented supply/rating details, then confirm the form. Add a board before adding its circuits.
2. Click **Add circuit**, choose the parent board, enter its name, phase and protective-device information, then save. Assign each load to the intended circuit using the assignment selector; **Unassigned** means it has no circuit connection.
3. Use **Configure source and evidence** and **Cables & Protection** to supply supporting source/cable information before interpreting capacity checks. Missing evidence remains incomplete.
4. Click **Preview balance** to see proposed phase moves and the Before/After comparison. Review locked phases and proposed assignments, then **Apply changes** or **Cancel**.
5. For site organization, use **Site, buildings and zones**: enter **Group name**, select Building or Zone and a parent group, then **Add group**. Rename/remove the selected group as needed; these groups organize records rather than creating electrical connections.

#### Remember

- Removing an organization group reparents its child groups and detaches board assignments to that group. Review topology changes separately from organization labels.

## Task 12

### Single-Line Studio

Inspect and edit the same boards, circuits and loads as a connected diagram.

1. Open **Single-Line Studio** → **Single-line diagram**. Click a component or choose **Select diagram object** to inspect it. Use **Add board**, **Add circuit** or **Add note** for a new object; enter the requested details and review the addition.
2. Select a load, choose a circuit under **Connect load to circuit**, and click **Connect**. **Disconnect** removes the circuit assignment without deleting the load. Phase or object edits use **Preview object changes** / **Preview phase assignment** before applying.
3. Under cable evidence, enter the actual route and conductor data plus source reference, then **Preview cable changes**. **Clear cable data** removes that evidence. For removal, choose how dependencies should be handled before **Preview removal**.
4. Use **Pan**, directional pan buttons, **Zoom in**, **Zoom out** and **Fit view** to position the diagram. Enter Diagram X/Y and **Save position** for manual placement; **Auto-layout** reorganizes it. Toggle labels, ratings and **Flow animation** to control the display.
5. Choose **Isolate board** to focus the view. **Export SVG** downloads a vector image; choose page size/orientation before **Export diagram PDF**. These exports show the displayed diagram and entered data.

#### Buttons, controls and choices

| Control | What it does |
| --- | --- |
| Remove subtree; keep loads unassigned | Removes the selected board/circuit hierarchy while retaining affected loads for reassignment; inspect the preview first. |
| Move direct dependants to another board | Choose the destination board and review the proposed dependency changes before removal. |
| Diagram notes / Remove note | Adds or removes an explanatory annotation; it is not an electrical component. |

#### Remember

- Diagram distances are not surveyed cable lengths. Drawing a line does not prove an installation is safe or create a billable measured quantity.

## Task 13

### Analytical spatial view

Explore a perspective rendering of the project graph without changing the electrical model.

1. Open **Single-Line Studio** → **Analytical spatial view**. Adjust **Orbit angle**, **Elevation** and **Zoom** to inspect the graph; **Reset view** returns to the default camera.
2. Choose **Isolate board** to show one branch, or **Whole project** to show every branch. Click an object or use the selection controls to inspect its details.
3. Move **Representative hour** to see modelled hourly power. **Export spatial SVG** downloads the displayed graph for sharing.

#### Remember

- This is a hierarchy-based analytical view, not a surveyed 3D building. Hourly flow labels represent model energy averages, not live telemetry or motor-start currents.

## Task 14

### Schedules & Simulation

Calculate energy across explicit dates and use the timeline to inspect the result.

1. Open **Schedules & Simulation**. Choose **Start date**, **End date** and **Interval**, and check the project **Timezone**. The period follows elapsed time, including supported timezone changes.
2. Click **Validate inputs** to see missing requirements, then **Run simulation**. Wait for a completed range; **Cancel simulation** / **Cancel** stops a calculation in progress.
3. Inspect the result and use Play/Pause, **Playback speed**, **Step backward**, **Step forward** or **Timeline hour** to move through it. **Show details** and the data table expose numeric values.
4. Click **Export series** to download the completed series. If you edit proposed dates without completing another run, the old output remains labelled with its previous completed dates; rerun to obtain new evidence.

#### Remember

- Project edits can invalidate an earlier analysis. Run again before freezing a report that needs results from the new revision.

## Task 15

### Advanced schedules, starts and flexible loads

Enter real operating windows, exceptional dates and start events, then review constrained schedules.

1. Open **Schedules & Simulation** → **Advanced schedules, starts and flexible loads**. Choose a **Selected load**. Add operating windows with start hour, duration, weekdays, months and effective dates, then **Save calendar rules**. Empty weekday/month lists mean every day/month.
2. Use **Add date exception** for a closed day or replacement windows. **Use explicit on/off cycle instead of average duty** enables timed cycling. Remove an unwanted window/exception with its labelled remove button. **Use basic daily schedule** returns to the simple daily model.
3. For starts, click **Add start event**, choose the load and an offset-qualified timestamp, then enter documented total starting current or a current multiplier, PF, method and source. **Save start events** stores the inputs; **Assess start sequence** calculates the combined events; **Export complete start sequence** downloads the assessment.
4. For flexible work, click **Add flexible process**, enter energy, minimum uninterrupted run, priority and evidence, then **Add available window** with arrival/deadline timestamps. Choose whether splitting is allowed and whether the requirement is locked. **Save requirements** commits these inputs.
5. Enter the actual calendar period, interval, site power limit and scheduling objective. For generation-following, provide one generation value for every planning interval. Click **Preview constrained schedule**, review delivered/unmet energy and dates, then **Apply reviewed schedule**. Undo reverses the applied schedule.
6. Use **Export complete calendar** for the completed range. Read **Separate billing lines** when demand, standing charges and taxes are included.

#### Practice example

An explicit timestamp such as 2026-11-06T08:00:00+01:00 identifies an instant and its UTC offset. A bare local time does not resolve daylight-saving ambiguity.

## Task 16

### Measured intervals

Import measured average power separately from estimated equipment data.

1. Open **Schedules & Simulation** → **Measured intervals** → **Open measured CSV or backup**. Choose a CSV up to 5 MB or a compatible measurement backup JSON up to 32 MB.
2. For CSV, choose **Timestamp column**, **Interval-average power column**, **Power unit** (W or kW) and **Declared elapsed interval** in minutes. Timestamps mark interval starts and need Z or an explicit UTC offset.
3. Click **Preview measured data**. Inspect assumptions, coverage warnings and the validated table. Negative power represents export; missing intervals remain missing rather than being filled with zero.
4. Click **Save measured data** and wait for success. **Reopen saved measurements** reloads the stored dataset for the current project. **Inspect**, **Previous** and **Next** help you review individual rows.
5. Use **Export cleaned CSV** for normalized kW/kWh data or **Export measurement backup** for portable recovery. Save before exporting a combined workspace backup.

## Task 17

### Cables & Protection

Assess an entered cable route and use the related worksheets with documented conductor and device evidence.

1. Open **Cables & Protection** → **Cumulative feeder assessment**. Choose **Segment to edit** (feeder or final circuit) and its actual board/circuit. Enter route length, conductor/neutral impedance, ampacity, correction factors and source conditions.
2. Click **Save segment evidence**. **Remove segment evidence** clears that segment's inputs. Choose **Endpoint load** and **Operating scenario**, and enter a voltage criterion override or start instant only when applicable.
3. Click **Assess complete route**. Review cumulative voltage drop, receiving voltage, losses and independent capacity/neutral checks. **Export route evidence** downloads the actual assessment.
4. For a standalone cable/protection calculation, choose the worksheet below the route assessment, enter its requested data and **Calculate**. The full tool directory in this guide explains every worksheet's inputs and example output.

#### Remember

- A missing or unsupported input produces an incomplete/unsupported result. The app does not supply a licensed cable table, select manufacturer coordination evidence for you, or certify the installation.

## Task 18

### Motors & Supply

Record actual source equipment and compare its documented limits with running or starting requirements.

1. Open **Motors & Supply** → **Source register and capacity checks** → **Add source**. Enter name, type, electrical connection, served board/whole project, ratings, derating and evidence reference, then **Save source**.
2. If supported by the source documentation, enable **Enter documented overload envelope** and enter duration and envelope reference. Record island/transfer/restart/black-start evidence only when you have it.
3. Choose **Assessment source**, **Operating scenario** and **Assessment instant**. Inspect the independent kW, kVA, phase-current and starting-envelope checks, then **Export assessment** for a copy.
4. Use **Edit** or **Delete** beside an equipment record to maintain it. For motor, generator, transformer, UPS or inverter arithmetic, choose a worksheet below and follow its inputs, formulas and warnings.

#### Remember

- Source declarations describe entered planning evidence. They do not control equipment or prove safe transfer, islanding or paralleling.

## Task 19

### Power Quality

Use the power-factor, capacitor and harmonic worksheets to inspect values you supply.

1. Open **Power Quality**, then choose the worksheet that matches your question. Enter its real power, existing/target PF, frequency, connection or supplied harmonic spectrum as requested.
2. Click **Calculate**. Read the formula and units, including whether PF is displacement PF or true PF. Open **Load worked example** for labelled practice values if you are learning the worksheet.
3. Read the limitations and warnings before copying/exporting the result. If you want the result in a project, use the available reviewed application or attach a calculation note to an existing object.

#### Remember

- True PF alone does not determine a harmonic spectrum. A capacitor arithmetic result is not a verified capacitor-bank or resonance design.

## Task 20

### Engineering Toolbox

Search the real worksheet registry, calculate from your inputs and review the result before applying it to a project.

1. Open **Engineering Toolbox** and type a title, topic or ID such as T01 into **Search tools**. Click the worksheet name to open its input form. Cables & Protection, Motors & Supply and Power Quality show related subsets of this same registry.
2. Enter the requested values in the displayed units. Select a value in every required dropdown. Optional inputs may be left blank only when the selected model permits it. **Load worked example** fills labelled example inputs; it does not measure your installation.
3. Click **Calculate**. Inspect Result, formula, status, warnings, assumptions and sources. Changing an input clears the previous result so an old calculation is not shown as current.
4. Use **Copy result** to copy the result JSON and **Export** for the worksheet's JSON file. **Reset** clears the worksheet. The per-tool instructions in this guide list exact input names and a real calculation of the registry's worked example.
5. Under **Apply to project object**, choose the application method and existing target. **Attach calculation note** records reviewed evidence; selected supported tools can also update specific project fields. Click **Preview application**, review the changed fields, then apply. A later project edit can make a proposal stale; preview it again.

#### Remember

- A standalone worksheet calculation does not add equipment or change a project until a reviewed application is confirmed. Tool examples are analytical teaching cases. Check the tool's status and supported model instead of treating any number as installation approval.

## Task 21

### Renewables & Storage

Model entered generation, battery operation and optional outages over the selected period.

1. Open **Renewables & Storage**. Enter PV/wind assumptions and source references, inverter/grid limits, battery capacity, SOC limits/reserve, power limits, efficiencies and the chosen dispatch strategy.
2. For chronological generation, enter the actual hourly PV profile from 00:00 to 23:00 and supported wind/profile data. A daily energy or peak-sun-hours estimate alone does not identify when generation occurs.
3. Choose a representative local date or **Use actual timestamped calendar range**, then enter offset-qualified start/end timestamps. Enable **Simulate grid outage** only for a study that needs it and enter the outage period and available source capabilities.
4. Click **Save** for the entered project assumptions, then **Run simulation**. **Cancel simulation** stops a running calculation. Read grid import/export, battery stored energy, conversion losses, curtailment and unmet/critical unserved demand.
5. Inspect the graph/table and energy-balance check. **Export series** downloads the completed dispatch; **Save project** preserves the committed project inputs for continuation.

#### Buttons, controls and choices

| Control | What it does |
| --- | --- |
| Dispatch objective | Choose the supported self-consumption, reserve or peak-shaving objective. Enter its reserve SOC or grid-import peak target when requested. |
| Explicitly permit grid charging in entered windows | Enables intentional grid charging only in the entered windows. Add grid-charge window asks for start, end and target SOC; Remove charging window removes that entry. |
| Use evidenced source and explicit outage shedding | Enables backup planning with a selected island-forming source and entered restart delay/evidence. |
| Serve only loads marked critical | Limits the supported outage supply plan to loads marked critical; inspect the resulting unmet demand. |
| Require entered black-start capability | Requires that entered source evidence before the model supplies the relevant outage start. |
| Add a load to the priority order / Move up / Remove | Selects loads for the explicit shedding priority, moves a selected load earlier or removes it from that ordered list. |

#### Remember

- Backup supply depends on the entered source/island/transfer/black-start evidence. This is a simulation with your profiles, not live solar forecasts or hardware control.

## Task 22

### EV & Flexible Loads

Plan charging energy within arrival, departure and electrical limits.

1. Open **EV & Flexible Loads** → **Add session**. Enter the vehicle/session name, arrival/departure, connection/phase, charger and vehicle limits, efficiency and either required delivered energy or usable capacity plus SOC change.
2. Choose **Charging strategy**: immediate, lowest-cost available intervals or supplied-generation following. Enter the actual tariff/calendar date and any needed generation values, then save the session.
3. Run the displayed plan and review **Delivered energy**, unmet energy, cost and deadline feasibility. A shortfall means the entered limits/time window cannot provide all requested energy.
4. Click **Apply changes** only after reviewing the proposed dated load schedule. Use **Edit** or **Delete** beside a session to change/remove it, and **Save project** to keep committed inputs.

#### Practice example

A 10 kWh requirement with only one hour at a 7 kW input limit cannot be fulfilled, even before charging losses. Extend the window or revise evidence-backed limits, then recalculate.

## Task 23

### Costs & Carbon

Enter prices, charge rules and carbon factors explicitly; the app calculates from those assumptions.

1. Open **Costs & Carbon**. Confirm **Currency**, then enter import/export prices, standing and demand charges, tax and carbon-factor evidence.
2. For time-of-use rates, click **Add tariff band**, name it, enter its price/time window and active weekdays/effective dates, then save the tariff inputs. Choose whether uncovered times use an explicit base rate or require complete bands.
3. Under **Demand and billing-period rules**, choose aligned intervals or rolling windows, the demand window/step, billing period and applicable time restrictions. Select the standing-charge day basis and tax basis matching the study assumptions.
4. Save the form and run a dated simulation to inspect the applicable energy and separate billing lines. A quick daily cost is a planning estimate; it is not a customer invoice. Create the invoice separately in **Reports & Estimates** → **Customer bill**.

#### Remember

- Changing a currency label does not perform foreign-exchange conversion. Carbon results use the factor, geography, period and method you entered; export credits are not invented.

## Task 24

### Scenarios & Optimization

Create a separate alternative, compare it with a saved baseline and apply only reviewed differences.

1. Open **Scenarios & Optimization**, enter a name and click **Create scenario**. The alternative has its own project identity and a frozen baseline. **Set baseline** updates the reference deliberately.
2. Change equipment, schedules or assumptions in the alternative. Choose **Compare against** and **Preview changes** to inspect differences. Tick selected fields, or use **Select all** / **Clear selection**, then **Apply selected changes** after validation.
3. For **Sensitivity study**, choose a parameter such as growth allowance, coincidence, import price or a load's energy duty. Enter sweep values, choose the target load when required, then **Run sensitivity** and **Export data**.
4. For **Dated engineering comparison**, choose both projects and a common explicit period of at most 31 elapsed days. Add a common outage only when needed, click **Run dated comparison**, then export the actual CSV/JSON result. **Cancel** stops a comparison in progress.
5. Use **Open**, **Compare** and **Move to trash** on scenario entries carefully. Save each project you want to retain; Undo can reverse an applied project change.

#### Remember

- Unavailable evidence stays unavailable. Different currencies are not subtracted. A sensitivity case computes independent inputs; it is not a forecast or automatically applied recommendation.

## Task 25

### Equipment Library

Reuse sourced equipment, inspect earlier versions or open labelled analytical reference cases.

1. Open **Equipment Library**. Search by name/category/source, choose an equipment category, or enable **Favorites only**. Click a favorite marker to keep frequently used templates easy to find.
2. Choose an existing load under **Save an existing load as a template**, then click **Save selected equipment**, or click **New equipment template** and enter the required nameplate/evidence fields.
3. Click **Add load** beside a template to create an independent equipment entry. Review its quantities, operating schedule, phase and source against your actual installation before saving the project.
4. For a template edit, inspect **Review equipment replacement**, choose which linked loads should receive the new nameplate/evidence fields, then **Apply reviewed replacement**. Existing quantities, schedules, names and circuit assignments are retained. **Equipment version history** → **Show details** opens prior versions.
5. Use **Export equipment** for a portable library JSON file. **Import equipment** opens a preview; **Apply import** applies valid records. **Delete template** removes the selected template through its confirmation workflow.
6. The generic starting points and **Open reference case** cards are opt-in practice data. Read their expected results and assumptions; they do not claim manufacturer verification or surveyed customer equipment.

## Task 26

### Reports & Estimates

Freeze a reviewed engineering report, then export or print that same revision.

1. Open **Reports & Estimates** → **Engineering report**. Enter **Project reference**, **Prepared by**, **Customer / recipient** and **Report scope and limitations**, then **Save report details**.
2. Under **Choose report sections**, tick the sections you need. Complete relevant simulation, dispatch or charging runs first if their results belong in the report; missing evidence is shown as unavailable.
3. Click **Freeze report preview**. Read the generated preview and its project revision before sharing it. Later project changes do not silently rewrite that frozen review; freeze a new preview after rerunning affected analysis.
4. Click **Generate selected PDF** for the report file, **Print reviewed report** for the browser's print dialog, or **Export frozen report data** for JSON of the reviewed snapshot. In the print dialog choose a printer or Save as PDF, check pages/orientation, then confirm.
5. Use **Export circuit CSV**, **Export scenario comparison** or choose **Time-series export** and **Export selected series** for specific data. Select a completed representative profile, calendar simulation, energy dispatch or charging plan as applicable.

#### Buttons, controls and choices

| Control | What it does |
| --- | --- |
| Calculation summary | Includes installed/demand power, energy estimates, PF and phase-current summaries from the reviewed revision. |
| Load schedule | Lists entered equipment quantities, calculated power/current/energy and source kinds. |
| Board and phase summary | Includes the board hierarchy, entered ratings, ways and phase-related values. |
| Circuit schedule | Lists actual circuit, parent board, phase, protection rating and entered cable length. |
| Cable, protection and feeder checks | Shows individual evidence-backed checks plus source-to-load route assessments; incomplete inputs stay visible. |
| Motor starts and supply capacity | Includes entered start events and source-capacity evidence/assessments. |
| Energy, tariffs and carbon | Reports energy and the entered cost/carbon assumptions used for the available evidence. |
| Renewables and storage evidence | Includes entered renewable/battery assumptions and available completed dispatch evidence. |
| Charging requirements and feasibility | Reports entered EV requirements and completed feasible/unmet charging results. |
| Scenario comparison | Includes the selected saved scenario metrics and their revision context. |
| Model-derived bill of materials | Lists model quantities and evidence; it does not invent missing prices or measured lengths. |
| Vector single-line diagram | Includes the data-bound diagram of the reviewed project. |
| Measurement provenance | Describes validated saved measurement evidence, coverage and origin. |
| Time-series evidence | Includes the available completed profile/calendar/dispatch/charging evidence selected for the report. |
| Issues and incomplete checks | Keeps unresolved errors, warnings and model boundaries visible to the reader. |
| Methods, assumptions and sources | Includes the calculation method, entered assumptions and supporting source references. |

#### Remember

- Engineering PDFs, CSVs, SVGs and frozen report JSON are output documents. Use Export project or Workspace backup for editable project recovery. A downloaded report is not a substitute for a saved engineering project.

## Task 27

### Create and print a customer bill

Prepare an estimate or invoice using your real supplier/customer details, quantities and prices.

1. Click **Reports & Estimates** → **Customer bill**. Under Document details choose Customer estimate or Invoice. Enter Document number and Issue date; enter Due / valid until when required. Choose the currency and optional Customer reference.
2. Under Supplier & customer, enter your actual business name/address/contact details in Supplier and the customer's details in Customer. Enter Tax / registration reference if applicable. Do not leave practice names on a document you intend to issue.
3. Under Materials & labour, click Add line. Type a clear Description, choose Material/Labour/Other, enter Qty and Unit price. Repeat for each item; Remove line deletes that row. Quantities allow three decimal places; prices follow the selected currency's precision.
4. Enter Discount (%) and Tax (%) only as applicable to this document. Add Notes and Payment details, such as payment terms and the correct payment reference. Review every line amount and the document preview.
5. Check Subtotal, Discount, Net amount, Tax and Total. Line amounts are rounded to currency precision; discount is applied to subtotal; tax is applied to the discounted net amount. Fix the messages under Complete these details to export until the document is ready.
6. Click Save draft locally and wait for Draft saved locally. Click Download PDF for the generated customer file, Print / Save PDF for the browser print dialog, or Export CSV for the priced schedule. Printing or downloading does not send the bill to anyone.
7. Click Export draft JSON to keep an editable copy. Later, reopen this saved project and Customer bill, use Reload saved draft, or choose Import draft JSON and confirm the reviewed replacement. An invalid import leaves your current bill intact.

#### Buttons, controls and choices

| Control | What it does |
| --- | --- |
| New empty document | Starts a blank bill after confirmation. The previous saved draft remains until another successful save; export it first if you need both documents. |
| Reload saved draft | Replaces the displayed draft with the saved version after confirmation. Cancel keeps unsaved edits. |
| Save draft locally | Stores this project's bill in this browser. Incomplete drafts can be kept, but required valid fields are needed for customer export. |
| Download PDF / Print / Save PDF | Produces or prints the displayed validated bill. Choose your own printer or PDF destination; the app does not email it. |
| Export CSV / Export draft JSON / Import draft JSON | Exports priced rows, exports an editable bill, or restores a supported bill file. These are separate from engineering project JSON. |

#### Practice example

Practice example: two items at €20 each plus one labour line at €10 gives €50 subtotal. A 10% discount removes €5, leaving €45 net. An entered 19% tax is €8.55, giving €53.55 total. This example teaches the calculation; it does not determine which tax rate applies to your bill.

#### Remember

- Local bills are linked to the project identity. The app does not supply legal/tax approval, company data or signatures. Measured/entered cable lengths are required; diagram strokes do not create billable length.

## Task 28

### Build an estimate from model quantities

Turn actual project quantities into a reviewed customer estimate without inventing prices or measured lengths.

1. Open **Reports & Estimates** → **Engineering report** → **Model-derived bill of materials**. Review each Item / source and Model quantity. **Previous** / **Next** moves through the list.
2. Enter Unit price for quantities you can price, and enter applicable Waste (%), Labour quantity, Labour unit price and Contingency (%). Unknown prices remain blank; use actual measured cable data for length-based lines.
3. Click **Preview priced estimate**. Review the resulting descriptions, quantities, rates and totals. Click **Apply reviewed quantities to bill** to update the customer bill, or **Cancel** to keep it unchanged. Existing manual bill lines are preserved.
4. Open **Customer bill** to enter the real parties, document details and tax, review the total and save/export the bill. **Export model quantities** gives an independent copy of the model-derived schedule.

## Task 29

### History & Issues

Find missing inputs and inspect or restore saved project revisions.

1. Open **History & Issues** or click the footer's issue count. Read the actual message and affected object, then open the corresponding workspace to supply or correct its inputs.
2. For recovery, select a saved revision in **Compare revisions**. Read Before/After, tick the fields to restore, and click **Restore selected fields**. Include dependent boards/circuits when restoring an object that needs them.
3. Use the whole-revision restore control when you intend to restore all the chosen saved inputs. Validate the result, use Undo if the applied change was unintended, and **Save project** to keep the restored state.
4. Click **Export comparison** for an audit copy of revision differences. Keep a separate workspace backup; browser history alone cannot recover a lost device.

#### Remember

- A Calculated status means the supported arithmetic ran. Incomplete means required inputs/evidence are missing. Unsupported means the selected case is outside the implemented model. A passing number is not certification.

## Task 30

### Settings

Maintain project defaults and adjust the display without changing the meaning of your data.

1. Open **Settings**. In **Project settings**, enter the actual supply voltages, connection, frequency, timezone, currency, jurisdiction and design assumptions, then save that form and **Save project**. Changing defaults is a project edit, so review affected calculations.
2. Under the display settings, select **Language**, **Detail level**, **Theme** and **Motion**. Dark, Light or System controls appearance; Simple/Engineering changes the detail shown, while checks remain visible.
3. Choose Reduced to limit decorative motion or Paused to stop ongoing animation/timeline playback. You can still read tables and calculate results.
4. Adjust **Navigation width** / **Inspector width** sliders or the desktop split handles. Keyboard arrows and Home/End work on the handles. **Reset layout** restores the default widths, expanded groups and engineering detail view.
5. Use the project Export/Import/Trash controls or **Workspace backup & restore** for recovery. **Open / restore Adigun BOT** resets its window layout and opens the local helper.

## Task 31

### Workspace backup & restore

Keep a portable archive of saved engineering projects and their related saved records.

1. Save the project, bill and measured data you want in the backup. Open **Settings** → **Workspace backup & restore**. Choose **Backup scope**: all local projects or the current project and linked baselines.
2. Choose whether to **Include saved revision history**, then click **Export workspace backup**. Keep the downloaded JSON somewhere outside this browser profile. It contains supported saved projects, histories, bills, measurements and embedded library/diagram/scenario records.
3. On the destination browser, click **Inspect workspace backup** and select the archive. Read the validation results and the preview's project, revision, bill and measured-data counts. An invalid archive is not applied.
4. Choose **Restore as independent copies** when you want to preserve existing work with new identities, or **Preserve project IDs when absent** to keep an absent identity without overwriting an existing/trash entry. If the archive contains a working draft, enable its explicit restore option only if you want it promoted.
5. Click **Restore reviewed backup** and wait for success, then use **Resume project** to open the restored project. **Cancel** closes the preview without changing saved records.

#### Remember

- A backup is a file you must keep. The platform does not synchronize it to another device automatically. Native project JSON, bill JSON and measurement JSON remain useful individual exports.

## Task 32

### Adigun BOT

The local helper explains real project inputs and prepares changes for your review.

1. Click the Adigun BOT launcher, or **Settings** → **Open / restore Adigun BOT**. Use **Overview**, **Explain my results**, **Check missing inputs** or **Balance phases** for a focused question about the current project.
2. Enter a supported question/command in **Ask about your project**, then click **Send**. **Cancel** stops the pending local request. Read the answer's project revision and limitations.
3. For a structured load request, enter the example syntax below. The BOT prepares a proposal; review its input and demand changes, then explicitly apply it. A project edit invalidates an older proposal, so ask/preview again.
4. Use **Minimize**, **Maximize**, **Restore** and **Close** to manage the window. **Clear history** clears the current local conversation through its confirmation. **Save project** keeps the current conversation and typed message as part of the local project checkpoint; **Resume project** restores that saved session.

#### Practice example

load: Workshop heater; 2.3 kW; 230 V; PF 1; 8 h

#### Remember

- The helper is deterministic local engineering support. There is no configured connected generative AI, OCR, account sync or hardware telemetry. A local project checkpoint keeps supported BOT context, while a native engineering JSON export contains engineering data; do not assume every export format contains the chat.

## Task 33

### Engineering Reference

Check formulas, supported assumptions and primary-source links when interpreting a calculation.

1. Open **Engineering Reference**. Find the equation for the connection/model in use, then read the listed assumptions and source links.
2. Use **Calculate** or an object's **Calculation trace** / **Explain result** to compare those general equations with the actual project revision, inputs and evidence.
3. Follow the linked calculation-method documentation for model boundaries and tool sources. External references open separately so the active project stays available.

#### Buttons, controls and choices

| Control | What it does |
| --- | --- |
| Ctrl/Cmd+K | Opens the command/search palette outside another dialog. |
| Ctrl/Cmd+S | Requests an explicit project save; check the save status afterward. |
| Ctrl/Cmd+Z / Ctrl/Cmd+Shift+Z | Undo/Redo project edits outside text inputs. Inside text fields, the normal text-editing shortcuts apply. |
| Escape | Closes the active supported dialog or overlay; closing Help returns focus to its opener. |
| F1 | Opens Help & Support without replacing an active editor. Escape returns to the current form. |
| Tab / Shift+Tab | Moves forward/backward between controls. In a dialog, focus stays inside until it closes. |

## Task 34

### Warnings and common problems

Read the message beside the affected control. Keep current work open while you resolve a failed save or conflict.

1. If a save fails, do not reload first. Use **Export project** for engineering data, Export draft JSON for a bill, or the available measurement export. Check browser storage permissions/free space, close conflicting tabs where requested, then retry the explicit save and wait for success.
2. If another tab has a newer revision, export your version or save a recovered copy before reopening the saved project. Do not assume your older tab may silently overwrite newer work.
3. If a file is rejected, read the preview error and check its format, size, column mapping, units and required fields. Keep the current project; correct the source file and preview again.
4. If PDF/print/export is disabled, read the required-detail messages. Bills need a project/document name, supplier, customer, valid issue/due dates and at least one valid priced line. Reports need saved metadata and a frozen review; simulations need completed results for their exports.
5. If a result is Incomplete or Unsupported, open the trace/issue register and add the missing evidence or select a supported model. Do not enter arbitrary values just to remove the warning. If a worker fails, keep the project, review its inputs and rerun.
6. If **Update available** appears, save/export your work first, finish pending forms, close their dialogs and click **Save and reload** when ready. Pending edits or a running task may prevent a safe reload. After the update, use **Resume project** for the saved checkpoint. Help can be read while leaving the current workspace intact.
7. If a saved project appears missing after reload, click **Resume project** and check **Trash**. Confirm you are using the same browser profile, device and site address. Restore a downloaded workspace backup when moving to a different browser/device.

#### Buttons, controls and choices

| Control | What it does |
| --- | --- |
| Unsaved changes | Save the desired work before leaving. Cancel the leave warning to continue editing. |
| Saving / Save failed | Wait for completion or preserve a portable copy and resolve the displayed storage error. No success is promised before the write completes. |
| Blocked storage upgrade | Close other tabs/windows using this app as requested, then retry. Export any editable work before refreshing. |
| Project changed / stale preview | Reopen or regenerate the preview against the current revision, review it again and apply deliberately. |
| No printer / popup or download blocked | Check the browser's printer, download and popup settings. Download PDF is an alternative to the print dialog. |
| Unexpected numeric result | Check W versus kW, A versus kVA, line versus phase voltage, PF, efficiency, quantities, hours, duty and timezone before comparing results. |

## Task 35

### Get support

Use this guide first, then describe the exact reproducible problem if you need to report it.

1. Search this guide for the visible menu, button, error message or tool ID. Read the matching task and try the listed correction while keeping the current work open.
2. If the problem remains, note the page, button, exact error, browser/device, engine version from the footer, and the steps needed to reproduce it. State the expected result and what actually happened.
3. Use **Report an issue** below to open the repository's issue page in a new tab. Check the information before submitting it yourself. Remove customer details, prices and private project contents from screenshots or example files you share publicly.
4. Use **Complete user guide** for the repository copy of these instructions. You can return to the app without closing the active project or the help overlay.

#### Remember

- There is no live support chat or configured email sender in the platform. Opening an issue link does not send a message or upload project data.

## Tool directory

For every worksheet: open **Engineering Toolbox**, search its ID, click its title, enter the inputs in the displayed units and click **Calculate**. **Load worked example** enters the practice values below. **Reset** clears the form. **Copy result** copies result JSON, and **Export** downloads the result JSON file. A calculation alone does not change project equipment. Use **Apply to project object**, choose the supported application method/target, **Preview application**, review the affected fields and **Apply reviewed changes** to commit an available application.

The guide shows full source example values; numbers in the interactive UI follow the selected locale. List-valued inputs use semicolon-separated values. Required inputs, model restrictions and supplied data govern whether the result is calculated, incomplete or unsupported.

| ID | Worksheet | Category |
| --- | --- | --- |
| [T01](#t01) | Ohm’s law | Electrical fundamentals |
| [T02](#t02) | DC load power & energy | Electrical fundamentals |
| [T03](#t03) | Single-phase AC current | Electrical fundamentals |
| [T04](#t04) | Three-phase AC current | Electrical fundamentals |
| [T05](#t05) | Signed power triangle | Electrical fundamentals |
| [T06](#t06) | Series & parallel resistance | Electrical fundamentals |
| [T07](#t07) | Series RLC impedance | Electrical fundamentals |
| [T08](#t08) | Engineering unit converter | Electrical fundamentals |
| [T09](#t09) | Useful output → electrical input | Electrical fundamentals |
| [T10](#t10) | Motor input & full-load current | Motors & starting |
| [T11](#t11) | Torque, speed & shaft power | Motors & starting |
| [T12](#t12) | Synchronous speed & slip | Motors & starting |
| [T13](#t13) | Star / delta winding relations | Motors & starting |
| [T14](#t14) | Motor start sequence | Motors & starting |
| [T15](#t15) | Conductor resistance & temperature | Cables & protection |
| [T16](#t16) | DC complete-loop voltage drop | Cables & protection |
| [T17](#t17) | AC voltage drop / rise | Cables & protection |
| [T18](#t18) | Route length / cross-section by drop | Cables & protection |
| [T19](#t19) | Conductor loss & loss energy | Cables & protection |
| [T20](#t20) | Cable ampacity correction worksheet | Cables & protection |
| [T21](#t21) | Device, load & cable checks | Cables & protection |
| [T22](#t22) | Simplified prospective fault current | Cables & protection |
| [T23](#t23) | Loop impedance & disconnection | Cables & protection |
| [T24](#t24) | Cable adiabatic withstand | Cables & protection |
| [T25](#t25) | Protective conductor / bonding worksheet | Cables & protection |
| [T26](#t26) | Connected & coincident demand | Distribution & supply |
| [T27](#t27) | Phase-current imbalance | Distribution & supply |
| [T28](#t28) | Fundamental neutral current | Distribution & supply |
| [T29](#t29) | Transformer current, loading & losses | Distribution & supply |
| [T30](#t30) | Generator capacity worksheet | Distribution & supply |
| [T31](#t31) | Inverter & overload envelope | Distribution & supply |
| [T32](#t32) | UPS energy-based runtime | Distribution & supply |
| [T33](#t33) | Power-factor correction | Power quality |
| [T34](#t34) | Capacitor element sizing | Power quality |
| [T35](#t35) | Harmonic RMS & THD | Power quality |
| [T36](#t36) | Battery capacity & usable energy | Renewables & storage |
| [T37](#t37) | Battery rates & constrained runtime | Renewables & storage |
| [T38](#t38) | Chronological battery dispatch | Renewables & storage |
| [T39](#t39) | PV yield / inverter clipping | Renewables & storage |
| [T40](#t40) | PV string voltage & current | Renewables & storage |
| [T41](#t41) | Wind supplied-profile energy | Renewables & storage |
| [T42](#t42) | EV charging & deadline feasibility | EV, energy & economics |
| [T43](#t43) | Managed charging allocation | EV, energy & economics |
| [T44](#t44) | Power-profile integration | EV, energy & economics |
| [T45](#t45) | Load factor & duration curve | EV, energy & economics |
| [T46](#t46) | Demand-factor definitions | EV, energy & economics |
| [T47](#t47) | Interval tariff & demand bill | EV, energy & economics |
| [T48](#t48) | Standby & replacement savings | EV, energy & economics |
| [T49](#t49) | Operational electricity carbon | EV, energy & economics |
| [T50](#t50) | Simple payback & break-even | EV, energy & economics |
| [T51](#t51) | NPV & discount-rate sensitivity | EV, energy & economics |

## T01

### Ohm’s law

Solve a passive DC resistor from any two independent quantities. Extra supplied values are checked for consistency.

1. Click **Engineering Toolbox**, search **T01**, then select **Ohm’s law**.
2. Enter actual inputs from the table, or click **Load worked example** to practice with the example values.
3. Click **Calculate**. Read the result, formula, notes and warnings below before copying, exporting or applying anything.

| Input | Unit | Requirement / valid entries | Worked-example value |
| --- | --- | --- | --- |
| Voltage | V | Optional / model dependent; min 0 | 230 |
| Current | A | Optional / model dependent; min 0 | Left blank |
| Resistance | Ω | Optional / model dependent; min 0 | 23 |
| Power | W | Optional / model dependent; min 0 | Left blank |

**Worked-example status:** calculated.

| Result | Value | Unit |
| --- | --- | --- |
| Voltage | 230 | V |
| Current | 10 | A |
| Resistance | 23 | Ω |
| Power | 2300 | W |

**Formula:** V = IR; P = VI = I²R = V²/R

**Model notes:**

- Passive, non-negative steady DC quantities. Ideal open-circuit resistance has no finite numerical value.

## T02

### DC load power & energy

Terminal electrical input and elapsed-time energy for identical DC loads.

1. Click **Engineering Toolbox**, search **T02**, then select **DC load power & energy**.
2. Enter actual inputs from the table, or click **Load worked example** to practice with the example values.
3. Click **Calculate**. Read the result, formula, notes and warnings below before copying, exporting or applying anything.

| Input | Unit | Requirement / valid entries | Worked-example value |
| --- | --- | --- | --- |
| Terminal voltage | V | Required; min 0 | 24 |
| On-state current per load | A | Required; min 0 | 5 |
| Quantity | — | Required; min 1 | 2 |
| Elapsed operating time | h | Required; min 0 | 3 |

**Worked-example status:** calculated.

| Result | Value | Unit |
| --- | --- | --- |
| Total power | 240 | W |
| Energy | 0.72 | kWh |

**Formula:** P = VI × quantity; E = P × elapsed hours / 1000

**Model notes:**

- Steady input power. Supply losses and time-varying voltage are excluded.

## T03

### Single-phase AC current

Sinusoidal electrical input at the entered terminal voltage.

1. Click **Engineering Toolbox**, search **T03**, then select **Single-phase AC current**.
2. Enter actual inputs from the table, or click **Load worked example** to practice with the example values.
3. Click **Calculate**. Read the result, formula, notes and warnings below before copying, exporting or applying anything.

| Input | Unit | Requirement / valid entries | Worked-example value |
| --- | --- | --- | --- |
| Electrical input | kW | Required; min 0 | 2.3 |
| Terminal voltage | V | Required; min 0 | 230 |
| Displacement power factor | — | Required; min 0; max 1 | 1 |
| Reactive behavior | — | Required; Inductive / lagging (lagging); Capacitive / leading (leading) | Inductive / lagging |

**Worked-example status:** calculated.

| Result | Value | Unit |
| --- | --- | --- |
| On-state current | 10 | A |
| Apparent power | 2.3 | kVA |
| Signed reactive power | 0 | kvar |

**Formula:** I = 1000P / (V × PF)

**Model notes:**

- Displacement PF under a sinusoidal model; true PF with unknown distortion cannot establish reactive power.
- Electrical input is already input power: motor efficiency is not applied.

## T04

### Three-phase AC current

Balanced sinusoidal three-phase electrical input at the entered line-to-line voltage.

1. Click **Engineering Toolbox**, search **T04**, then select **Three-phase AC current**.
2. Enter actual inputs from the table, or click **Load worked example** to practice with the example values.
3. Click **Calculate**. Read the result, formula, notes and warnings below before copying, exporting or applying anything.

| Input | Unit | Requirement / valid entries | Worked-example value |
| --- | --- | --- | --- |
| Electrical input | kW | Required; min 0 | 12 |
| Line-to-line voltage | V | Required; min 0 | 400 |
| Displacement power factor | — | Required; min 0; max 1 | 1 |
| Reactive behavior | — | Required; Inductive / lagging (lagging); Capacitive / leading (leading) | Inductive / lagging |

**Worked-example status:** calculated.

| Result | Value | Unit |
| --- | --- | --- |
| On-state current | 17.32050808 | A |
| Apparent power | 12 | kVA |
| Signed reactive power | 0 | kvar |

**Formula:** I = 1000P / (√3 × VLL × PF)

**Model notes:**

- Displacement PF under a sinusoidal model; true PF with unknown distortion cannot establish reactive power.
- Electrical input is already input power: motor efficiency is not applied.

## T05

### Signed power triangle

Explicit signed P and Q preserve reactive cancellation and regenerative quadrants.

1. Click **Engineering Toolbox**, search **T05**, then select **Signed power triangle**.
2. Enter actual inputs from the table, or click **Load worked example** to practice with the example values.
3. Click **Calculate**. Read the result, formula, notes and warnings below before copying, exporting or applying anything.

| Input | Unit | Requirement / valid entries | Worked-example value |
| --- | --- | --- | --- |
| Signed real power | kW | Required | 4 |
| Signed reactive power | kvar | Required | -3 |

**Worked-example status:** calculated.

| Result | Value | Unit |
| --- | --- | --- |
| Apparent power magnitude | 5 | kVA |
| Power factor magnitude | 0.8 | — |
| Complex-power angle | -36.86989765 | ° |
| Real-power direction | Consumption | — |
| Reactive direction | Capacitive supply | — |

**Formula:** S = √(P² + Q²); |PF| = |P|/S; angle = atan2(Q,P)

**Model notes:**

- Passive sign convention: consumption P > 0; inductive absorption Q > 0. Pure reactive power is supported without division by PF.

## T06

### Series & parallel resistance

One all-series or all-parallel bank of ideal resistors; no arbitrary network solver.

1. Click **Engineering Toolbox**, search **T06**, then select **Series & parallel resistance**.
2. Enter actual inputs from the table, or click **Load worked example** to practice with the example values.
3. Click **Calculate**. Read the result, formula, notes and warnings below before copying, exporting or applying anything.

| Input | Unit | Requirement / valid entries | Worked-example value |
| --- | --- | --- | --- |
| Topology | — | Required; All series (series); All parallel (parallel) | All parallel |
| Resistance values | — | Required; Comma-separated resistances in ohms, including zero for an ideal short. | 10, 10, 20 |

**Worked-example status:** calculated.

| Result | Value | Unit |
| --- | --- | --- |
| Equivalent resistance | 4 | Ω |
| Number of resistors | 3 | — |

**Formula:** 1/Req = Σ(1/R)

**Model notes:**

- All resistances are ideal and temperature-independent for this worksheet.

## T07

### Series RLC impedance

Fundamental steady-state impedance of a single series R/L/C branch.

1. Click **Engineering Toolbox**, search **T07**, then select **Series RLC impedance**.
2. Enter actual inputs from the table, or click **Load worked example** to practice with the example values.
3. Click **Calculate**. Read the result, formula, notes and warnings below before copying, exporting or applying anything.

| Input | Unit | Requirement / valid entries | Worked-example value |
| --- | --- | --- | --- |
| Resistance | Ω | Required; min 0 | 10 |
| Inductance | mH | Required; min 0 | 100 |
| Capacitance (0 = capacitor omitted) | µF | Required; min 0 | 0 |
| Frequency | Hz | Required; min 0 | 50 |
| Applied RMS voltage | V | Required; min 0 | 230 |

**Worked-example status:** calculated.

| Result | Value | Unit |
| --- | --- | --- |
| Inductive reactance | 31.41592654 | Ω |
| Capacitive reactance | 0 | Ω |
| Impedance magnitude | 32.96908309 | Ω |
| Impedance angle | 72.34321285 | ° |
| RMS current | 6.976232834 | A |

**Formula:** XL = 2πfL; XC = 1/(2πfC); Z = R + j(XL − XC)

**Model notes:**

- Zero capacitance means no series capacitor component, not a physical zero-farad capacitor.
- Ignores ESR, saturation, transient response and component tolerances.

## T08

### Engineering unit converter

Explicit unit pairs; Ah to energy always requires the nominal voltage.

1. Click **Engineering Toolbox**, search **T08**, then select **Engineering unit converter**.
2. Enter actual inputs from the table, or click **Load worked example** to practice with the example values.
3. Click **Calculate**. Read the result, formula, notes and warnings below before copying, exporting or applying anything.

| Input | Unit | Requirement / valid entries | Worked-example value |
| --- | --- | --- | --- |
| Conversion | — | Required; W → kW (W-kW); kW → W (kW-W); VA → kVA (VA-kVA); kVA → VA (kVA-VA); Wh → kWh (Wh-kWh); kWh → Wh (kWh-Wh); Ah → Wh (Ah-Wh); Wh → Ah (Wh-Ah); ft → m (ft-m); m → ft (m-ft); in → mm (in-mm); mm → in (mm-in); °C → °F (C-F); °F → °C (F-C) | Ah → Wh |
| Value | — | Required | 100 |
| Nominal voltage (Ah conversions only) | V | Optional / model dependent; min 0 | 48 |

**Worked-example status:** calculated.

| Result | Value | Unit |
| --- | --- | --- |
| Converted value | 4800 | Wh |

**Formula:** Wh ≈ nominal V × Ah

**Model notes:**

- Ah energy conversion assumes fixed nominal voltage; actual battery energy depends on the discharge voltage profile.
- International foot = 0.3048 m; international inch = 25.4 mm.

## T09

### Useful output → electrical input

Keep mechanical efficiency separate from a heat pump’s coefficient of performance.

1. Click **Engineering Toolbox**, search **T09**, then select **Useful output → electrical input**.
2. Enter actual inputs from the table, or click **Load worked example** to practice with the example values.
3. Click **Calculate**. Read the result, formula, notes and warnings below before copying, exporting or applying anything.

| Input | Unit | Requirement / valid entries | Worked-example value |
| --- | --- | --- | --- |
| Conversion basis | — | Required; Mechanical output / efficiency (mechanical); Heating or cooling output / COP (thermal) | Mechanical output / efficiency |
| Useful output | kW | Required; min 0 | 7.5 |
| Efficiency (0–1) or COP | — | Required; min 0 | 0.9 |

**Worked-example status:** calculated.

| Result | Value | Unit |
| --- | --- | --- |
| Electrical input | 8.333333333 | kW |
| Conversion loss | 0.8333333333 | kW |

**Formula:** Pin = Pshaft / η

**Model notes:**

- The entered ratio applies only to the stated operating point.
- Do not divide an already electrical input rating by efficiency again.

## T10

### Motor input & full-load current

Shaft-output motor rating with an explicitly entered operating-point efficiency and displacement PF.

1. Click **Engineering Toolbox**, search **T10**, then select **Motor input & full-load current**.
2. Enter actual inputs from the table, or click **Load worked example** to practice with the example values.
3. Click **Calculate**. Read the result, formula, notes and warnings below before copying, exporting or applying anything.

| Input | Unit | Requirement / valid entries | Worked-example value |
| --- | --- | --- | --- |
| Shaft output | kW | Required; min 0 | 7.5 |
| Motor efficiency | — | Required; min 0; max 1 | 0.9 |
| Displacement power factor | — | Required; min 0; max 1 | 0.85 |
| Terminal voltage (line-to-line for three phase) | V | Required; min 0 | 400 |
| Supply connection | — | Required; Single phase (single); Balanced three phase (three) | Balanced three phase |

**Worked-example status:** calculated.

| Result | Value | Unit |
| --- | --- | --- |
| Electrical input | 8.333333333 | kW |
| Electrical losses | 0.8333333333 | kW |
| Apparent input | 9.803921569 | kVA |
| On-state line current | 14.15074189 | A |

**Formula:** Pin = Pshaft/η; I = Pin × 1000/(phase factor × V × PF)

**Model notes:**

- Balanced sinusoidal input for the three-phase case. Starting current requires separate manufacturer/entered data.

**Sources:**

- [https://www.electrical-installation.org/enwiki/Induction_motors](https://www.electrical-installation.org/enwiki/Induction_motors)

## T11

### Torque, speed & shaft power

Mechanical conversion at a non-negative rotational speed; no motor efficiency applied.

1. Click **Engineering Toolbox**, search **T11**, then select **Torque, speed & shaft power**.
2. Enter actual inputs from the table, or click **Load worked example** to practice with the example values.
3. Click **Calculate**. Read the result, formula, notes and warnings below before copying, exporting or applying anything.

| Input | Unit | Requirement / valid entries | Worked-example value |
| --- | --- | --- | --- |
| Calculate | — | Required; Shaft power from torque (power); Torque from shaft power (torque) | Shaft power from torque |
| Known torque (N·m) or shaft power (kW) | — | Required; min 0 | 100 |
| Rotational speed | rpm | Required; min 0 | 1500 |

**Worked-example status:** calculated.

| Result | Value | Unit |
| --- | --- | --- |
| Angular speed | 157.0796327 | rad/s |
| Shaft power | 15.70796327 | kW |

**Formula:** P = Tω; ω = 2πn/60

**Model notes:**

- Steady rotational mechanical power; stall torque needs a separate motor model.

## T12

### Synchronous speed & slip

Induction-machine speed relative to the rotating supply field.

1. Click **Engineering Toolbox**, search **T12**, then select **Synchronous speed & slip**.
2. Enter actual inputs from the table, or click **Load worked example** to practice with the example values.
3. Click **Calculate**. Read the result, formula, notes and warnings below before copying, exporting or applying anything.

| Input | Unit | Requirement / valid entries | Worked-example value |
| --- | --- | --- | --- |
| Supply frequency | Hz | Required; min 0 | 50 |
| Number of poles | — | Required; min 2 | 4 |
| Rotor speed | rpm | Required; min 0 | 1440 |

**Worked-example status:** calculated.

| Result | Value | Unit |
| --- | --- | --- |
| Synchronous speed | 1500 | rpm |
| Slip | 4 | % |
| Rotor electrical frequency magnitude | 2 | Hz |

**Formula:** ns = 120f/p; s = (ns − n)/ns

**Model notes:**

- A negative slip indicates super-synchronous operation; it is not a normal loaded motor point.

## T13

### Star / delta winding relations

Balanced identical winding impedances at a fixed operating point; nameplate connection compatibility is recorded separately.

1. Click **Engineering Toolbox**, search **T13**, then select **Star / delta winding relations**.
2. Enter actual inputs from the table, or click **Load worked example** to practice with the example values.
3. Click **Calculate**. Read the result, formula, notes and warnings below before copying, exporting or applying anything.

| Input | Unit | Requirement / valid entries | Worked-example value |
| --- | --- | --- | --- |
| Line-to-line supply voltage | V | Required; min 0 | 400 |
| Magnitude of each winding impedance | Ω | Required; min 0 | 20 |
| Rated winding voltage | V | Required; min 0 | 400 |
| Winding connection | — | Required; Star (star); Delta (delta) | Delta |
| Motor nameplate / winding compatibility evidence | — | Optional / model dependent; Enter the actual datasheet, table or design criterion and its conditions. | Analytical reference: 400 V winding, fixed \|Z\| = 20 Ω; no manufacturer motor claim. |

**Worked-example status:** calculated.

| Result | Value | Unit |
| --- | --- | --- |
| Winding voltage | 400 | V |
| Winding current | 20 | A |
| Line current | 34.64101615 | A |
| Winding voltage / rating | 100 | % |

**Formula:** Star: Vw = VLL/√3, IL = Iw. Delta: Vw = VLL, IL = √3Iw.

**Model notes:**

- Fixed equal winding impedance model. It does not predict acceleration, torque, transition current or acceptable starting duty.
- At the same line voltage and fixed winding impedance, star line current is one-third of delta line current.
- User-entered evidence: source: Analytical reference: 400 V winding, fixed |Z| = 20 Ω; no manufacturer motor claim.
- A source reference records provenance; this application has not independently validated its applicability.

**Sources:**

- [https://www.electrical-installation.org/enwiki/Induction_motors](https://www.electrical-installation.org/enwiki/Induction_motors)

## T14

### Motor start sequence

Compare simultaneous or sequential starts from entered start/run currents and separate PFs.

1. Click **Engineering Toolbox**, search **T14**, then select **Motor start sequence**.
2. Enter actual inputs from the table, or click **Load worked example** to practice with the example values.
3. Click **Calculate**. Read the result, formula, notes and warnings below before copying, exporting or applying anything.

| Input | Unit | Requirement / valid entries | Worked-example value |
| --- | --- | --- | --- |
| Supply connection | — | Required; Single phase (single); Balanced three phase (three) | Balanced three phase |
| Terminal / line-to-line voltage | V | Required; min 0 | 400 |
| Already-running background real power | kW | Required; min 0 | 5 |
| Background displacement PF | — | Required; min 0; max 1 | 0.9 |
| Identical motors to start | — | Required; min 1; max 1000 | 2 |
| Motor running current | A | Required; min 0 | 14.15 |
| Motor running displacement PF | — | Required; min 0; max 1 | 0.85 |
| Motor starting current | A | Required; min 0 | 80 |
| Motor starting displacement PF | — | Required; min 0; max 1 | 0.35 |
| Start duration per motor | s | Required; min 0 | 3 |
| Sequence | — | Required; Start together (simultaneous); One start at a time (staggered) | One start at a time |

**Worked-example status:** calculated.

| Result | Value | Unit |
| --- | --- | --- |
| Maximum sequence / final apparent demand | 67.9140409 | kVA |
| Maximum sequence / final line current | 98.02547448 | A |
| All-motors-running apparent demand | 25.13906689 | kVA |
| Total start period | 6 | s |
| Motor start-only energy | 0.03233161507 | kWh |

**Formula:** P and Q are summed at each start stage; S = √[(ΣP)² + (ΣQ)²]

**Model notes:**

- All entered PFs are assumed lagging and sinusoidal. Staggered starts begin after the preceding motor finishes starting.
- No generic starting multiplier, voltage dip or frequency-dip prediction is used.
- Start-only energy excludes background and already-running motors.

## T15

### Conductor resistance & temperature

Linear temperature correction from entered resistivity and coefficient; parallel equal conductors only.

1. Click **Engineering Toolbox**, search **T15**, then select **Conductor resistance & temperature**.
2. Enter actual inputs from the table, or click **Load worked example** to practice with the example values.
3. Click **Calculate**. Read the result, formula, notes and warnings below before copying, exporting or applying anything.

| Input | Unit | Requirement / valid entries | Worked-example value |
| --- | --- | --- | --- |
| Resistivity at reference temperature | Ω·mm²/m | Required; min 0 | 0.0175 |
| One conductor length | m | Required; min 0 | 100 |
| Cross-section per conductor | mm² | Required; min 0 | 2.5 |
| Equal parallel conductors | — | Required; min 1 | 1 |
| Temperature coefficient at reference temperature | 1/K | Required | 0.00393 |
| Reference temperature | °C | Required; min -273.15 | 20 |
| Operating temperature | °C | Required; min -273.15 | 70 |
| Source / document / conditions | — | Optional / model dependent; Enter the actual datasheet, table or design criterion and its conditions. | Left blank |

**Worked-example status:** calculated.

| Result | Value | Unit |
| --- | --- | --- |
| Resistance at reference temperature | 0.7 | Ω |
| Resistance at operating temperature | 0.83755 | Ω |
| Equivalent resistance per kilometre | 8.3755 | Ω/km |

**Formula:** Rθ = ρref × L/(S × n) × [1 + αref(θ − θref)]

**Model notes:**

- All parallel paths have equal length, material, section and temperature. Current sharing and installation derating need separate checks.
- Properties are user assumptions until their source and valid temperature range are recorded.

## T16

### DC complete-loop voltage drop

Separate outgoing and return conductor resistances; current is the actual on-state circuit current.

1. Click **Engineering Toolbox**, search **T16**, then select **DC complete-loop voltage drop**.
2. Enter actual inputs from the table, or click **Load worked example** to practice with the example values.
3. Click **Calculate**. Read the result, formula, notes and warnings below before copying, exporting or applying anything.

| Input | Unit | Requirement / valid entries | Worked-example value |
| --- | --- | --- | --- |
| Supply voltage | V | Required; min 0 | 230 |
| On-state current | A | Required; min 0 | 10 |
| Outgoing conductor resistance | Ω | Required; min 0 | 0.4 |
| Return conductor resistance | Ω | Required; min 0 | 0.4 |

**Worked-example status:** calculated.

| Result | Value | Unit |
| --- | --- | --- |
| Complete loop resistance | 0.8 | Ω |
| Voltage drop | 8 | V |
| Voltage drop | 3.47826087 | % |
| Receiving voltage estimate | 222 | V |
| Loop conductor loss | 80 | W |

**Formula:** ΔV = I(Rout + Rreturn); Ploss = I²(Rout + Rreturn)

**Model notes:**

- A specified-current resistive model. The load operating point may change when voltage drops.
- This is a scoped entered-data check, not installation certification or automatic cable selection.

## T17

### AC voltage drop / rise

One-way route length and per-conductor impedance; single-phase two-wire or balanced three-phase approximation.

1. Click **Engineering Toolbox**, search **T17**, then select **AC voltage drop / rise**.
2. Enter actual inputs from the table, or click **Load worked example** to practice with the example values.
3. Click **Calculate**. Read the result, formula, notes and warnings below before copying, exporting or applying anything.

| Input | Unit | Requirement / valid entries | Worked-example value |
| --- | --- | --- | --- |
| Connection | — | Required; Single phase, equal outgoing/return (single); Balanced three phase (three) | Single phase, equal outgoing/return |
| Terminal / line-to-line voltage | V | Required; min 0 | 230 |
| On-state current | A | Required; min 0 | 10 |
| One-way route length | m | Required; min 0 | 100 |
| Conductor resistance | Ω/km | Required; min 0 | 4 |
| Conductor inductive reactance | Ω/km | Required; min 0 | 0 |
| Displacement PF | — | Required; min 0; max 1 | 1 |
| Reactive behavior | — | Required; Lagging (lagging); Leading (leading) | Lagging |

**Worked-example status:** calculated.

| Result | Value | Unit |
| --- | --- | --- |
| Signed voltage drop | 8 | V |
| Signed voltage drop | 3.47826087 | % |
| Receiving-voltage estimate | 222 | V |
| Conductor losses | 80 | W |

**Formula:** ΔV = kIL(R cosφ + X sinφ), k = 2 single phase or √3 balanced three phase

**Model notes:**

- Negative drop denotes voltage rise in this approximation.
- Use conductor data at the actual operating temperature. This result covers this segment only; include upstream segments separately.
- This is a scoped entered-data check, not installation certification or automatic cable selection.

**Sources:**

- [https://www.electrical-installation.org/enwiki/Calculation_of_voltage_drop_in_steady_load_conditions](https://www.electrical-installation.org/enwiki/Calculation_of_voltage_drop_in_steady_load_conditions)

## T18

### Route length / cross-section by drop

Explicit voltage-change criterion under a unity-PF resistive model. Ampacity and protection remain separate.

1. Click **Engineering Toolbox**, search **T18**, then select **Route length / cross-section by drop**.
2. Enter actual inputs from the table, or click **Load worked example** to practice with the example values.
3. Click **Calculate**. Read the result, formula, notes and warnings below before copying, exporting or applying anything.

| Input | Unit | Requirement / valid entries | Worked-example value |
| --- | --- | --- | --- |
| Calculate | — | Required; Maximum one-way route length (length); Minimum calculated cross-section (section) | Maximum one-way route length |
| Connection | — | Required; DC / single phase, equal return (single); Balanced three phase (three) | DC / single phase, equal return |
| Terminal / line-to-line voltage | V | Required; min 0 | 230 |
| On-state current | A | Required; min 0 | 10 |
| User-entered maximum voltage change | % | Required; min 0; max 100 | 3 |
| Resistivity at operating temperature | Ω·mm²/m | Required; min 0 | 0.0225 |
| Candidate cross-section (length mode) | mm² | Optional / model dependent; min 0 | 2.5 |
| One-way route length (section mode) | m | Optional / model dependent; min 0 | Left blank |

**Worked-example status:** calculated.

| Result | Value | Unit |
| --- | --- | --- |
| Maximum one-way route length | 38.33333333 | m |
| Allowed voltage change | 6.9 | V |

**Formula:** ΔV = kIρL/S; Lmax = ΔVlimit S/(kIρ); Smin = kIρL/ΔVlimit

**Model notes:**

- Unity PF, negligible reactance, equal path conductors. Resistivity must represent the selected temperature.
- A calculated section is not an available cable size; choose a real sourced candidate and assess it.
- This is a scoped entered-data check, not installation certification or automatic cable selection.

**Sources:**

- [https://www.electrical-installation.org/enwiki/Calculation_of_voltage_drop_in_steady_load_conditions](https://www.electrical-installation.org/enwiki/Calculation_of_voltage_drop_in_steady_load_conditions)

## T19

### Conductor loss & loss energy

Identical loaded conductors at an entered resistance and on-state current.

1. Click **Engineering Toolbox**, search **T19**, then select **Conductor loss & loss energy**.
2. Enter actual inputs from the table, or click **Load worked example** to practice with the example values.
3. Click **Calculate**. Read the result, formula, notes and warnings below before copying, exporting or applying anything.

| Input | Unit | Requirement / valid entries | Worked-example value |
| --- | --- | --- | --- |
| On-state conductor current | A | Required; min 0 | 10 |
| Resistance per loaded conductor | Ω | Required; min 0 | 0.4 |
| Equal loaded conductor count | — | Required; min 1 | 2 |
| Elapsed assessment window | h | Required; min 0 | 8 |
| On-state energy duty fraction | — | Required; min 0; max 1 | 0.5 |

**Worked-example status:** calculated.

| Result | Value | Unit |
| --- | --- | --- |
| On-state conductor loss | 80 | W |
| Window loss energy | 0.32 | kWh |

**Formula:** Ploss = nI²R; Eloss = Ploss × elapsed hours × duty / 1000

**Model notes:**

- Duty changes loss energy only; it does not reduce on-state current or on-state heating.
- For unequal phase/neutral currents, calculate each conductor separately and sum.

## T20

### Cable ampacity correction worksheet

Multiply a sourced base rating by applicable entered correction factors, without invented standards tables.

1. Click **Engineering Toolbox**, search **T20**, then select **Cable ampacity correction worksheet**.
2. Enter actual inputs from the table, or click **Load worked example** to practice with the example values.
3. Click **Calculate**. Read the result, formula, notes and warnings below before copying, exporting or applying anything.

| Input | Unit | Requirement / valid entries | Worked-example value |
| --- | --- | --- | --- |
| Base current-carrying capacity | A | Required; min 0 | 30 |
| Temperature factor | — | Required; min 0 | 0.9 |
| Grouping factor | — | Required; min 0 | 0.8 |
| Other applicable combined factor | — | Required; min 0 | 1 |
| Design on-state current | A | Required; min 0 | 20 |
| Rating / factor tables, edition and conditions | — | Optional / model dependent; Enter the actual datasheet, table or design criterion and its conditions. | Left blank |
| Installation method, insulation and loaded conductors | — | Optional / model dependent; Enter the actual datasheet, table or design criterion and its conditions. | Left blank |

**Worked-example status:** incomplete.

| Result | Value | Unit |
| --- | --- | --- |
| Corrected current-carrying capacity | 21.6 | A |
| Capacity minus design current | 1.6 | A |
| Design-current comparison | Meets entered corrected-capacity limit | — |

**Formula:** Iz = Ibase × ktemperature × kgrouping × kother

**Warnings from this example:**

- Assessment incomplete: enter source, installation. Numerical results use unverified entered values.

**Model notes:**

- This is a scoped entered-data check, not installation certification or automatic cable selection.
- Factors must apply to the same installation, conductor, temperature and loaded-conductor basis.

**Sources:**

- [https://www.electrical-installation.org/enwiki/General_method_for_cable_sizing](https://www.electrical-installation.org/enwiki/General_method_for_cable_sizing)

## T21

### Device, load & cable checks

Separate numerical overload and breaking-capacity checks against entered requirements and device data.

1. Click **Engineering Toolbox**, search **T21**, then select **Device, load & cable checks**.
2. Enter actual inputs from the table, or click **Load worked example** to practice with the example values.
3. Click **Calculate**. Read the result, formula, notes and warnings below before copying, exporting or applying anything.

| Input | Unit | Requirement / valid entries | Worked-example value |
| --- | --- | --- | --- |
| Design current Ib | A | Required; min 0 | 20 |
| Device rating / setting In | A | Required; min 0 | 25 |
| Corrected cable capacity Iz | A | Required; min 0 | 28 |
| Conventional operating current I₂ | A | Required; min 0 | 36.25 |
| Permitted I₂ / Iz from applicable rule | — | Required; min 0 | 1.45 |
| Prospective fault current | kA | Required; min 0 | 4 |
| Device breaking capacity at applicable voltage | kA | Required; min 0 | 6 |
| Applicable overload rule and scope | — | Optional / model dependent; Enter the actual datasheet, table or design criterion and its conditions. | Left blank |
| Device datasheet / voltage / AC-DC / characteristics | — | Optional / model dependent; Enter the actual datasheet, table or design criterion and its conditions. | Left blank |
| Cable corrected-capacity evidence | — | Optional / model dependent; Enter the actual datasheet, table or design criterion and its conditions. | Left blank |

**Worked-example status:** incomplete.

| Result | Value | Unit |
| --- | --- | --- |
| Ib ≤ In | Meets device rating | — |
| In ≤ Iz | Meets cable capacity | — |
| I₂ ≤ entered multiple × Iz | Meets entered thermal relationship | — |
| Fault ≤ breaking capacity | Meets entered breaking capacity | — |

**Formula:** Ib ≤ In ≤ Iz; I₂ ≤ entered multiplier × Iz; fault duty ≤ breaking capacity

**Warnings from this example:**

- Assessment incomplete: enter ruleSource, deviceSource, cableSource. Numerical results use unverified entered values.

**Model notes:**

- This is a scoped entered-data check, not installation certification or automatic cable selection.
- Disconnection, selectivity, backup protection, RCD compatibility and physical testing are separate. The multiplier is not an automatic universal rule.

**Sources:**

- [https://www.electrical-installation.org/enwiki/Overcurrent_protection_principles](https://www.electrical-installation.org/enwiki/Overcurrent_protection_principles)

## T22

### Simplified prospective fault current

Stiff-voltage source plus entered series R/X; balanced three-phase or single-phase loop RMS estimate.

1. Click **Engineering Toolbox**, search **T22**, then select **Simplified prospective fault current**.
2. Enter actual inputs from the table, or click **Load worked example** to practice with the example values.
3. Click **Calculate**. Read the result, formula, notes and warnings below before copying, exporting or applying anything.

| Input | Unit | Requirement / valid entries | Worked-example value |
| --- | --- | --- | --- |
| Fault model | — | Required; Single-phase complete loop (single); Balanced three-phase, positive-sequence path (three) | Single-phase complete loop |
| Terminal / line-to-line voltage | V | Required; min 0 | 230 |
| Source resistance | Ω | Required; min 0 | 0.1 |
| Source reactance | Ω | Required | 0 |
| Complete model path resistance | Ω | Required; min 0 | 0.36 |
| Complete model path reactance | Ω | Required | 0 |
| Entered minimum voltage factor | — | Required; min 0 | 0.95 |
| Entered maximum voltage factor | — | Required; min 0 | 1.05 |
| Source / document / conditions | — | Optional / model dependent; Enter the actual datasheet, table or design criterion and its conditions. | Left blank |

**Worked-example status:** incomplete.

| Result | Value | Unit |
| --- | --- | --- |
| Model impedance magnitude | 0.46 | Ω |
| Minimum-factor RMS estimate | 0.475 | kA |
| Maximum-factor RMS estimate | 0.525 | kA |

**Formula:** Isc = cV/|Z| (single loop); Isc = cVLL/(√3|Z₁|) (balanced three phase)

**Warnings from this example:**

- Assessment incomplete: enter source. Numerical results use unverified entered values.

**Model notes:**

- The two estimates vary voltage factor only; temperature/path changes must be entered as separate cases.
- No asymmetric peak/DC offset, meshed-network, generator or inverter fault model.
- This is a scoped entered-data check, not installation certification or automatic cable selection.

## T23

### Loop impedance & disconnection

TN-loop worksheet using entered required operating current and manufacturer clearing-time evidence.

1. Click **Engineering Toolbox**, search **T23**, then select **Loop impedance & disconnection**.
2. Enter actual inputs from the table, or click **Load worked example** to practice with the example values.
3. Click **Calculate**. Read the result, formula, notes and warnings below before copying, exporting or applying anything.

| Input | Unit | Requirement / valid entries | Worked-example value |
| --- | --- | --- | --- |
| Earthing model | — | Required; TN, stated loop model (TN); TT — requires a different touch-voltage/RCD method (TT); IT — requires a different fault model (IT) | TN, stated loop model |
| Nominal line-to-earth voltage | V | Required; min 0 | 230 |
| Applicable minimum voltage factor | — | Required; min 0 | 0.95 |
| Complete fault-loop impedance | Ω | Required; min 0 | 1 |
| Device current Ia for required disconnection time | A | Required; min 0 | 160 |
| Required disconnection time | s | Required; min 0 | 0.4 |
| Documented clearing time at calculated fault current | s | Required; min 0 | 0.1 |
| Earthing rule / required-time source | — | Optional / model dependent; Enter the actual datasheet, table or design criterion and its conditions. | Left blank |
| Device curve and temperature / current evidence | — | Optional / model dependent; Enter the actual datasheet, table or design criterion and its conditions. | Left blank |

**Worked-example status:** incomplete.

| Result | Value | Unit |
| --- | --- | --- |
| Calculated fault-loop current | 218.5 | A |
| Maximum impedance for entered Ia | 1.365625 | Ω |
| Loop-impedance condition | Meets entered criterion | — |
| Entered clearing-time condition | Meets entered criterion | — |

**Formula:** Zs ≤ cU₀/Ia; If = cU₀/Zs

**Warnings from this example:**

- Assessment incomplete: enter ruleSource, deviceSource. Numerical results use unverified entered values.

**Model notes:**

- Device clearing-time evidence must correspond to the calculated fault current, tolerances and operating conditions.
- This is a scoped entered-data check, not installation certification or automatic cable selection.

## T24

### Cable adiabatic withstand

Compare manufacturer let-through fault energy with entered conductor thermal withstand.

1. Click **Engineering Toolbox**, search **T24**, then select **Cable adiabatic withstand**.
2. Enter actual inputs from the table, or click **Load worked example** to practice with the example values.
3. Click **Calculate**. Read the result, formula, notes and warnings below before copying, exporting or applying anything.

| Input | Unit | Requirement / valid entries | Worked-example value |
| --- | --- | --- | --- |
| Conductor cross-section | mm² | Required; min 0 | 2.5 |
| Sourced adiabatic coefficient k | A√s/mm² | Required; min 0 | 115 |
| Applicable manufacturer let-through I²t | A²s | Required; min 0 | 50000 |
| Fault clearing duration | s | Required; min 0 | 0.1 |
| Initial conductor temperature | °C | Required; min -273.15 | 70 |
| Permitted final temperature for chosen k | °C | Required; min -273.15 | 160 |
| k source / material / insulation / temperatures | — | Optional / model dependent; Enter the actual datasheet, table or design criterion and its conditions. | Left blank |
| Let-through curve / voltage / prospective current | — | Optional / model dependent; Enter the actual datasheet, table or design criterion and its conditions. | Left blank |

**Worked-example status:** incomplete.

| Result | Value | Unit |
| --- | --- | --- |
| Conductor thermal withstand | 82656.25 | A²s |
| Minimum thermal section | 1.944406937 | mm² |
| Entered energy condition | Meets adiabatic energy limit | — |

**Formula:** I²t ≤ k²S²; Smin = √(I²t)/k

**Warnings from this example:**

- Assessment incomplete: enter coefficientSource, energySource. Numerical results use unverified entered values.

**Model notes:**

- Manufacturer let-through energy is used directly; prospective fault current is not assumed to persist unchanged through a current-limiting device.
- This is a scoped entered-data check, not installation certification or automatic cable selection.

**Sources:**

- [https://www.electrical-installation.org/enwiki/Verification_of_the_withstand_capabilities_of_cables_under_short-circuit_conditions](https://www.electrical-installation.org/enwiki/Verification_of_the_withstand_capabilities_of_cables_under_short-circuit_conditions)

## T25

### Protective conductor / bonding worksheet

PE adiabatic thermal requirement plus an entered mechanical minimum, or a sourced bonding minimum comparison.

1. Click **Engineering Toolbox**, search **T25**, then select **Protective conductor / bonding worksheet**.
2. Enter actual inputs from the table, or click **Load worked example** to practice with the example values.
3. Click **Calculate**. Read the result, formula, notes and warnings below before copying, exporting or applying anything.

| Input | Unit | Requirement / valid entries | Worked-example value |
| --- | --- | --- | --- |
| Applicable method | — | Required; PE: adiabatic + entered mechanical minimum (PE); Bonding: entered applicable minimum (bonding) | PE: adiabatic + entered mechanical minimum |
| Proposed cross-section | mm² | Required; min 0 | 4 |
| Applicable mechanical / bonding minimum | mm² | Required; min 0 | 2.5 |
| Applicable let-through I²t (PE only) | A²s | Optional / model dependent; min 0 | 50000 |
| Applicable k (PE only) | A√s/mm² | Optional / model dependent; min 0 | 115 |
| Fault duration (PE only, ≤5 s) | s | Optional / model dependent; min 0 | 0.1 |
| Applicable method, minimum, material and coefficient evidence | — | Optional / model dependent; Enter the actual datasheet, table or design criterion and its conditions. | Left blank |

**Worked-example status:** incomplete.

| Result | Value | Unit |
| --- | --- | --- |
| Thermal minimum | 1.944406937 | mm² |
| Controlling entered requirement | 2.5 | mm² |
| Proposed section comparison | Meets entered section requirement | — |

**Formula:** Srequired = max[√(I²t)/k, entered mechanical minimum]

**Warnings from this example:**

- Assessment incomplete: enter source. Numerical results use unverified entered values.

**Model notes:**

- No universal conductor-size table is embedded. Loop impedance, continuity, termination and local material requirements remain separate.
- This is a scoped entered-data check, not installation certification or automatic cable selection.

**Sources:**

- [https://www.electrical-installation.org/enwiki/Sizing_of_protective_earthing_conductor](https://www.electrical-installation.org/enwiki/Sizing_of_protective_earthing_conductor)

## T26

### Connected & coincident demand

Aggregate entered electrical input ratings and apply each distinct design assumption once.

1. Click **Engineering Toolbox**, search **T26**, then select **Connected & coincident demand**.
2. Enter actual inputs from the table, or click **Load worked example** to practice with the example values.
3. Click **Calculate**. Read the result, formula, notes and warnings below before copying, exporting or applying anything.

| Input | Unit | Requirement / valid entries | Worked-example value |
| --- | --- | --- | --- |
| Individual electrical input ratings | — | Required; Comma-separated kW. | 2, 3, 5 |
| Coincidence factor for this boundary | — | Required; min 0; max 1 | 0.8 |
| Future demand growth allowance | % | Required; min 0 | 10 |
| Capacity allowance added to demand | % | Required; min 0 | 20 |

**Worked-example status:** calculated.

| Result | Value | Unit |
| --- | --- | --- |
| Connected electrical input | 10 | kW |
| Coincident demand | 8 | kW |
| Demand including growth | 8.8 | kW |
| Target capacity including added allowance | 10.56 | kW |

**Formula:** Pdemand = ΣP × coincidence; Pfuture = Pdemand(1 + growth); capacity = Pfuture(1 + added allowance)

**Model notes:**

- A scalar real-power demand worksheet; phase currents and signed reactive power require their own aggregation.
- The capacity allowance is a percentage added to demand, not a percentage of installed capacity left unused.
- Energy duty is not an extra current reduction.

## T27

### Phase-current imbalance

Compare entered line-current RMS magnitudes using a visible current-imbalance definition.

1. Click **Engineering Toolbox**, search **T27**, then select **Phase-current imbalance**.
2. Enter actual inputs from the table, or click **Load worked example** to practice with the example values.
3. Click **Calculate**. Read the result, formula, notes and warnings below before copying, exporting or applying anything.

| Input | Unit | Requirement / valid entries | Worked-example value |
| --- | --- | --- | --- |
| L1 RMS current | A | Required; min 0 | 10 |
| L2 RMS current | A | Required; min 0 | 20 |
| L3 RMS current | A | Required; min 0 | 30 |

**Worked-example status:** calculated.

| Result | Value | Unit |
| --- | --- | --- |
| Mean phase current | 20 | A |
| Maximum phase current | 30 | A |
| Maximum deviation from mean / mean | 50 | % |

**Formula:** Imbalance = 100 × max(|Ii − Imean|)/Imean

**Model notes:**

- This is a current-magnitude metric. It is not negative-sequence voltage imbalance and does not determine neutral current.

## T28

### Fundamental neutral current

Vector sum of three supplied fundamental current phasors at one common boundary.

1. Click **Engineering Toolbox**, search **T28**, then select **Fundamental neutral current**.
2. Enter actual inputs from the table, or click **Load worked example** to practice with the example values.
3. Click **Calculate**. Read the result, formula, notes and warnings below before copying, exporting or applying anything.

| Input | Unit | Requirement / valid entries | Worked-example value |
| --- | --- | --- | --- |
| L1 fundamental RMS current | A | Required; min 0 | 10 |
| L1 current phase angle | ° | Required | 0 |
| L2 fundamental RMS current | A | Required; min 0 | 10 |
| L2 current phase angle | ° | Required | -120 |
| L3 fundamental RMS current | A | Required; min 0 | 10 |
| L3 current phase angle | ° | Required | 120 |

**Worked-example status:** calculated.

| Result | Value | Unit |
| --- | --- | --- |
| Fundamental neutral RMS magnitude | 3.552713679e-15 | A |
| Sum real current component | 3.552713679e-15 | A |
| Sum imaginary current component | 0 | A |

**Formula:** IN = |IL1 + IL2 + IL3| using complex current phasors

**Model notes:**

- Phasor angles share one reference. The neutral return direction is opposite the summed phase-current vector.
- Harmonics, including triplen components, are excluded. No floating-neutral voltage solution is implied.

## T29

### Transformer current, loading & losses

Balanced three-phase transformer with entered no-load and rated-load loss data.

1. Click **Engineering Toolbox**, search **T29**, then select **Transformer current, loading & losses**.
2. Enter actual inputs from the table, or click **Load worked example** to practice with the example values.
3. Click **Calculate**. Read the result, formula, notes and warnings below before copying, exporting or applying anything.

| Input | Unit | Requirement / valid entries | Worked-example value |
| --- | --- | --- | --- |
| Transformer rating | kVA | Required; min 0 | 100 |
| Primary line-to-line voltage | V | Required; min 0 | 11000 |
| Secondary line-to-line voltage | V | Required; min 0 | 400 |
| Load real power | kW | Required; min 0 | 72 |
| Load displacement PF | — | Required; min 0; max 1 | 0.9 |
| No-load loss | W | Required; min 0 | 200 |
| Load-dependent loss at rated current | W | Required; min 0 | 1000 |
| Energized elapsed time | h | Required; min 0 | 24 |

**Worked-example status:** calculated.

| Result | Value | Unit |
| --- | --- | --- |
| Rated primary current | 5.248638811 | A |
| Rated secondary current | 144.3375673 | A |
| Actual secondary current | 115.4700538 | A |
| Loading | 80 | % |
| Entered-model loss | 840 | W |
| Loss energy | 20.16 | kWh |
| Operating-point efficiency | 98.84678748 | % |

**Formula:** Irated = 1000S/(√3VLL); Ploss = P₀ + Pload,rated × (Sload/Srated)²

**Model notes:**

- Assumes constant voltage, sinusoidal balanced load and loss-data conditions matching this operating point. Harmonic and thermal derating are separate.

## T30

### Generator capacity worksheet

Independent steady kW/kVA limits and an entered start-capacity duration envelope.

1. Click **Engineering Toolbox**, search **T30**, then select **Generator capacity worksheet**.
2. Enter actual inputs from the table, or click **Load worked example** to practice with the example values.
3. Click **Calculate**. Read the result, formula, notes and warnings below before copying, exporting or applying anything.

| Input | Unit | Requirement / valid entries | Worked-example value |
| --- | --- | --- | --- |
| Applicable continuous / standby real-power rating | kW | Required; min 0 | 40 |
| Applicable apparent-power rating | kVA | Required; min 0 | 50 |
| Applicable operating-condition multiplier | — | Required; min 0; max 1 | 0.9 |
| Steady load real power | kW | Required; min 0 | 30 |
| Steady load PF | — | Required; min 0; max 1 | 0.8 |
| Total start-stage demand including existing loads | kVA | Required; min 0 | 70 |
| Sourced permissible start-stage apparent demand | kVA | Required; min 0 | 80 |
| Start-stage duration | s | Required; min 0 | 3 |
| Sourced permitted duration | s | Required; min 0 | 5 |
| Source / document / conditions | — | Optional / model dependent; Enter the actual datasheet, table or design criterion and its conditions. | Left blank |

**Worked-example status:** incomplete.

| Result | Value | Unit |
| --- | --- | --- |
| Real-power headroom | 6 | kW |
| Apparent-power headroom | 7.5 | kVA |
| Steady real-power check | Meets entered criterion | — |
| Steady apparent-power check | Meets entered criterion | — |
| Entered start envelope | Meets entered criterion | — |

**Formula:** Check load kW and kVA separately; compare start demand and duration with entered capability

**Warnings from this example:**

- Assessment incomplete: enter source. Numerical results use unverified entered values.

**Model notes:**

- Rating basis, altitude, temperature, fuel and permissible step changes need actual applicable manufacturer data.
- Voltage/frequency dip, speed governor and alternator transient dynamics are not predicted.

## T31

### Inverter & overload envelope

Compare continuous and transient real/apparent limits with explicit phase compatibility.

1. Click **Engineering Toolbox**, search **T31**, then select **Inverter & overload envelope**.
2. Enter actual inputs from the table, or click **Load worked example** to practice with the example values.
3. Click **Calculate**. Read the result, formula, notes and warnings below before copying, exporting or applying anything.

| Input | Unit | Requirement / valid entries | Worked-example value |
| --- | --- | --- | --- |
| Continuous real-power limit | kW | Required; min 0 | 5 |
| Continuous apparent-power limit | kVA | Required; min 0 | 5 |
| Continuous load real power | kW | Required; min 0 | 3 |
| Continuous load PF | — | Required; min 0; max 1 | 0.9 |
| Transient real demand | kW | Required; min 0 | 6 |
| Transient apparent demand | kVA | Required; min 0 | 7 |
| Sourced transient real-power limit | kW | Required; min 0 | 8 |
| Sourced transient apparent-power limit | kVA | Required; min 0 | 8 |
| Demand transient duration | s | Required; min 0 | 2 |
| Sourced permitted duration | s | Required; min 0 | 5 |
| Phase / operating-mode compatibility | — | Required; Not established (unknown); Confirmed by entered source (confirmed); Incompatible (incompatible) | Not established |
| Source / document / conditions | — | Optional / model dependent; Enter the actual datasheet, table or design criterion and its conditions. | Left blank |

**Worked-example status:** incomplete.

| Result | Value | Unit |
| --- | --- | --- |
| Continuous real-power headroom | 2 | kW |
| Continuous apparent-power headroom | 1.666666667 | kVA |
| Transient envelope | Meets entered criterion | — |
| Phase / operating-mode evidence | unknown | — |

**Formula:** Continuous P and S limits; transient P, S and duration limits checked independently

**Warnings from this example:**

- Assessment incomplete: enter source. Numerical results use unverified entered values.
- Confirm actual phase and operating-mode compatibility.

**Model notes:**

- DC voltage/current, battery BMS, per-phase limits, islanding and transfer arrangements require separate manufacturer checks.

## T32

### UPS energy-based runtime

Constant usable DC energy and entered conversion efficiency; no manufacturer discharge-curve claim.

1. Click **Engineering Toolbox**, search **T32**, then select **UPS energy-based runtime**.
2. Enter actual inputs from the table, or click **Load worked example** to practice with the example values.
3. Click **Calculate**. Read the result, formula, notes and warnings below before copying, exporting or applying anything.

| Input | Unit | Requirement / valid entries | Worked-example value |
| --- | --- | --- | --- |
| UPS real-power rating | kW | Required; min 0 | 3 |
| UPS apparent-power rating | kVA | Required; min 0 | 3 |
| Load real power | kW | Required; min 0 | 1 |
| Load power factor | — | Required; min 0; max 1 | 0.9 |
| Usable stored DC energy above cutoff | kWh | Required; min 0 | 2 |
| DC-to-AC efficiency | — | Required; min 0; max 1 | 0.9 |
| Additional AC-side auxiliary demand | W | Required; min 0 | 0 |

**Worked-example status:** calculated.

| Result | Value | Unit |
| --- | --- | --- |
| Available AC energy | 1.8 | kWh |
| Combined real demand | 1 | kW |
| Combined apparent demand assumption | 1.111111111 | kVA |
| Energy-only runtime | 1.8 | h |
| Rated-power feasibility | Meets entered criterion | — |

**Formula:** Runtime ≈ usable DC kWh × η / (load kW + auxiliary kW)

**Model notes:**

- Auxiliary demand is assumed unity PF and the apparent demands are conservatively added.
- No-load consumption, battery aging, temperature, Peukert behavior and manufacturer discharge curves are not inferred.

## T33

### Power-factor correction

Fundamental lagging compensation from the initial to a higher displacement PF.

1. Click **Engineering Toolbox**, search **T33**, then select **Power-factor correction**.
2. Enter actual inputs from the table, or click **Load worked example** to practice with the example values.
3. Click **Calculate**. Read the result, formula, notes and warnings below before copying, exporting or applying anything.

| Input | Unit | Requirement / valid entries | Worked-example value |
| --- | --- | --- | --- |
| Real load input | kW | Required; min 0 | 10 |
| Initial displacement PF | — | Required; min 0; max 1 | 0.8 |
| Target displacement PF | — | Required; min 0; max 1 | 0.95 |
| Terminal / line-to-line voltage | V | Required; min 0 | 400 |
| Supply connection | — | Required; Single phase (single); Balanced three phase (three) | Balanced three phase |

**Worked-example status:** calculated.

| Result | Value | Unit |
| --- | --- | --- |
| Capacitive compensation magnitude | 4.213158948 | kvar |
| Before apparent power | 12.5 | kVA |
| After apparent power | 10.52631579 | kVA |
| Before supply current | 18.04219591 | A |
| After supply current | 15.19342814 | A |

**Formula:** Qc = P[tan(acos(PFinitial)) − tan(acos(PFtarget))]

**Model notes:**

- Useful-load kWh is not automatically reduced by displacement-PF correction.
- Capacitor switching, harmonic resonance, VFD compatibility and motor self-excitation need separate equipment-specific assessment.

**Sources:**

- [https://www.electrical-installation.org/enwiki/Power_factor_correction_of_induction_motors](https://www.electrical-installation.org/enwiki/Power_factor_correction_of_induction_motors)

## T34

### Capacitor element sizing

Ideal sinusoidal capacitor elements for single-phase, three-phase star or delta connection.

1. Click **Engineering Toolbox**, search **T34**, then select **Capacitor element sizing**.
2. Enter actual inputs from the table, or click **Load worked example** to practice with the example values.
3. Click **Calculate**. Read the result, formula, notes and warnings below before copying, exporting or applying anything.

| Input | Unit | Requirement / valid entries | Worked-example value |
| --- | --- | --- | --- |
| Total compensation magnitude | kvar | Required; min 0 | 10 |
| Terminal voltage (line-to-line for star/delta) | V | Required; min 0 | 400 |
| Frequency | Hz | Required; min 0 | 50 |
| Capacitor connection | — | Required; One single-phase element (single); Three equal star elements (star); Three equal delta elements (delta) | Three equal delta elements |

**Worked-example status:** calculated.

| Result | Value | Unit |
| --- | --- | --- |
| Voltage per element | 400 | V |
| Capacitance per element | 66.31455962 | µF |
| Number of equal elements | 3 | — |
| Supply line current magnitude | 14.43375673 | A |

**Formula:** Qc = n × 2πf × Celement × Velement²

**Model notes:**

- Ideal sizing only. Select actual voltage/duty ratings, protection, discharge and harmonic compatibility separately.

**Sources:**

- [https://www.electrical-installation.org/enwiki/Reactive_power_of_capacitors](https://www.electrical-installation.org/enwiki/Reactive_power_of_capacitors)

## T35

### Harmonic RMS & THD

Compute total RMS and THD from an explicitly supplied harmonic spectrum; fundamental is the THD denominator.

1. Click **Engineering Toolbox**, search **T35**, then select **Harmonic RMS & THD**.
2. Enter actual inputs from the table, or click **Load worked example** to practice with the example values.
3. Click **Calculate**. Read the result, formula, notes and warnings below before copying, exporting or applying anything.

| Input | Unit | Requirement / valid entries | Worked-example value |
| --- | --- | --- | --- |
| Spectrum quantity | — | Required; Current (A RMS) (A); Voltage (V RMS) (V) | Current (A RMS) |
| Fundamental RMS magnitude | — | Required; min 0 | 10 |
| Harmonic RMS magnitudes h2, h3, … | — | Required; Comma-separated non-negative values. Enter 0 for an absent harmonic. | 0, 3, 0, 4 |

**Worked-example status:** calculated.

| Result | Value | Unit |
| --- | --- | --- |
| Combined harmonic RMS | 5 | A |
| Total RMS including fundamental | 11.18033989 | A |
| THD relative to fundamental | 50 | % |

**Formula:** THDF = √(Σh≥2 Xh²) / X₁; XRMS = √(X₁² + Σh≥2 Xh²)

**Model notes:**

- Spectral bins are RMS magnitudes at integer harmonics of one common fundamental. DC and interharmonics are excluded.
- Harmonic phase angles are not supplied; no time waveform or three-phase harmonic-neutral current is inferred.

## T36

### Battery capacity & usable energy

SOC percentages refer to one nominal stored-energy capacity; reserve is applied once.

1. Click **Engineering Toolbox**, search **T36**, then select **Battery capacity & usable energy**.
2. Enter actual inputs from the table, or click **Load worked example** to practice with the example values.
3. Click **Calculate**. Read the result, formula, notes and warnings below before copying, exporting or applying anything.

| Input | Unit | Requirement / valid entries | Worked-example value |
| --- | --- | --- | --- |
| Nominal battery voltage | V | Required; min 0 | 100 |
| Nominal charge capacity | Ah | Required; min 0 | 100 |
| Initial SOC | % | Required; min 0; max 100 | 80 |
| Minimum operating SOC / reserve boundary | % | Required; min 0; max 100 | 20 |
| Maximum operating SOC | % | Required; min 0; max 100 | 100 |
| Discharge DC-to-AC efficiency | — | Required; min 0; max 1 | 0.9 |

**Worked-example status:** calculated.

| Result | Value | Unit |
| --- | --- | --- |
| Nominal stored-energy approximation | 10 | kWh |
| Usable stored-energy window | 8 | kWh |
| Initial stored energy | 8 | kWh |
| Available AC energy above reserve | 5.4 | kWh |

**Formula:** Enom ≈ Vnom × Ah / 1000; Eavailable,AC = Enom(SOCinitial − SOCmin)η

**Model notes:**

- Fixed nominal-voltage energy approximation. Actual discharge capacity, temperature, aging and BMS limits require manufacturer data.
- Energy availability does not establish output-power or island/backup compatibility.

## T37

### Battery rates & constrained runtime

Constant-power charge/discharge estimates within stated stored-energy and power limits.

1. Click **Engineering Toolbox**, search **T37**, then select **Battery rates & constrained runtime**.
2. Enter actual inputs from the table, or click **Load worked example** to practice with the example values.
3. Click **Calculate**. Read the result, formula, notes and warnings below before copying, exporting or applying anything.

| Input | Unit | Requirement / valid entries | Worked-example value |
| --- | --- | --- | --- |
| Nominal stored energy | kWh | Required; min 0 | 10 |
| Initial SOC | % | Required; min 0; max 100 | 80 |
| Lower SOC / reserve | % | Required; min 0; max 100 | 20 |
| Charge target SOC | % | Required; min 0; max 100 | 100 |
| Requested AC charging power | kW | Required; min 0 | 2 |
| Maximum permitted AC charge power | kW | Required; min 0 | 3 |
| Required AC load power | kW | Required; min 0 | 1 |
| Maximum permitted AC discharge power | kW | Required; min 0 | 3 |
| AC-to-stored charge efficiency | — | Required; min 0; max 1 | 0.9 |
| Stored-to-AC discharge efficiency | — | Required; min 0; max 1 | 0.9 |

**Worked-example status:** calculated.

| Result | Value | Unit |
| --- | --- | --- |
| Accepted AC charging power | 2 | kW |
| Stored-energy charge rate / nominal energy | 0.18 | h⁻¹ |
| Stored-energy discharge rate / nominal energy | 0.1111111111 | h⁻¹ |
| Charge duration to target | 1.111111111 | h |
| Available AC energy | 5.4 | kWh |
| Feasible constant-load runtime | 5.4 | h |

**Formula:** tcharge = ΔEstored/(PAC,charge ηcharge); tdischarge = ΔEstored ηdischarge/PAC,load

**Model notes:**

- Energy-normalized rates equal approximate C-rates only under a fixed nominal-voltage assumption.
- Charge and discharge are separate scenarios. Constant-power estimates omit taper, no-load loss, temperature and battery discharge curves.

## T38

### Chronological battery dispatch

Reconcile physical flows per equal elapsed-time interval with explicit grid and islanding state.

1. Click **Engineering Toolbox**, search **T38**, then select **Chronological battery dispatch**.
2. Enter actual inputs from the table, or click **Load worked example** to practice with the example values.
3. Click **Calculate**. Read the result, formula, notes and warnings below before copying, exporting or applying anything.

| Input | Unit | Requirement / valid entries | Worked-example value |
| --- | --- | --- | --- |
| Load power profile | — | Required; Comma-separated kW per elapsed interval. | 0, 2 |
| Available generation power profile | — | Required; One value or one kW value per interval. | 2, 0 |
| Actual elapsed interval duration | h | Required; min 0 | 1 |
| Maximum stored energy | kWh | Required; min 0 | 10 |
| Initial stored energy | kWh | Required; min 0 | 5 |
| Minimum stored energy / reserve | kWh | Required; min 0 | 0 |
| Maximum AC charge power | kW | Required; min 0 | 5 |
| Maximum AC discharge power | kW | Required; min 0 | 5 |
| AC-to-stored charging efficiency | — | Required; min 0; max 1 | 0.9 |
| Stored-to-AC discharging efficiency | — | Required; min 0; max 1 | 0.8 |
| Grid state for this profile | — | Required; Grid available (connected); Grid outage (outage) | Grid available |
| Confirmed island-capable source / transfer arrangement | — | Required; No (no); Yes, entered verified configuration (yes) | No |

**Worked-example status:** calculated.

| Result | Value | Unit |
| --- | --- | --- |
| Load demand | 2 | kWh |
| Available generation | 2 | kWh |
| Physical grid import | 0 | kWh |
| Physical grid export | 0 | kWh |
| AC battery charge energy | 2 | kWh |
| AC battery discharge energy | 2 | kWh |
| Conversion losses | 0.7 | kWh |
| Final stored energy | 4.3 | kWh |
| Unserved load | 0 | kWh |
| Curtailed available generation | 0 | kWh |
| Maximum interval energy-balance residual | 2.220446049e-16 | kWh |

**Formula:** Generation + grid import + starting stored energy = served load + grid export + curtailment + losses + ending stored energy

**Model notes:**

- Greedy self-consumption dispatch with fixed reserve; no simultaneous charging and discharging.
- Elapsed durations are explicit; this worksheet does not reinterpret calendar dates or daylight saving.
- An outage begins at the entered initial stored energy. No free precharging is introduced.
- Grid-following generation and battery output are unavailable during outage without the stated island-capable arrangement.

## T39

### PV yield / inverter clipping

Entered peak-sun-hour estimate or supplied normalized DC profile with chronological clipping.

1. Click **Engineering Toolbox**, search **T39**, then select **PV yield / inverter clipping**.
2. Enter actual inputs from the table, or click **Load worked example** to practice with the example values.
3. Click **Calculate**. Read the result, formula, notes and warnings below before copying, exporting or applying anything.

| Input | Unit | Requirement / valid entries | Worked-example value |
| --- | --- | --- | --- |
| Input basis | — | Required; Daily peak-sun-hour estimate (daily); Supplied DC profile (profile) | Daily peak-sun-hour estimate |
| Installed DC nameplate capacity | kWp | Required; min 0 | 5 |
| DC-side loss fraction | — | Required; min 0; max 1 | 0.1 |
| Inverter efficiency assumption | — | Required; min 0; max 1 | 0.96 |
| Peak sun hours (daily mode) | h | Optional / model dependent; min 0 | 4 |
| Normalized DC profile (profile mode) | — | Optional / model dependent; Comma-separated DC kW per installed kWp. | Left blank |
| Elapsed interval duration (profile mode) | h | Optional / model dependent; min 0 | Left blank |
| AC inverter output limit (profile mode) | kW | Optional / model dependent; min 0 | Left blank |
| Irradiance / generation profile source and period | — | Optional / model dependent; Enter the actual datasheet, table or design criterion and its conditions. | Left blank |

**Worked-example status:** calculated.

| Result | Value | Unit |
| --- | --- | --- |
| Daily DC energy after stated losses | 18 | kWh/day |
| Daily AC energy before clipping | 17.28 | kWh/day |

**Formula:** EAC ≈ kWp × peak-sun hours × (1 − losses) × ηinverter

**Warnings from this example:**

- Daily totals cannot resolve inverter clipping or self-consumption; use a chronological profile for those checks.

**Model notes:**

- Entered resource/profile assumptions; no live weather, location yield or orientation model is implied.
- Resource provenance is an unverified user assumption.

## T40

### PV string voltage & current

Manufacturer-input temperature-voltage worksheet with separate MPPT, absolute-voltage and current comparisons.

1. Click **Engineering Toolbox**, search **T40**, then select **PV string voltage & current**.
2. Enter actual inputs from the table, or click **Load worked example** to practice with the example values.
3. Click **Calculate**. Read the result, formula, notes and warnings below before copying, exporting or applying anything.

| Input | Unit | Requirement / valid entries | Worked-example value |
| --- | --- | --- | --- |
| Module open-circuit voltage at reference temperature | V | Required; min 0 | 50 |
| Module maximum-power voltage at reference temperature | V | Required; min 0 | 42 |
| Voc temperature coefficient | %/°C | Required | -0.28 |
| Vmp temperature coefficient | %/°C | Required | -0.35 |
| Datasheet reference temperature | °C | Required; min -273.15 | 25 |
| Design minimum cell temperature | °C | Required; min -273.15 | -10 |
| Design maximum cell temperature | °C | Required; min -273.15 | 70 |
| Modules in series per string | — | Required; min 1 | 10 |
| Equal parallel strings on this MPPT | — | Required; min 1 | 1 |
| Module short-circuit current | A | Required; min 0 | 11 |
| Module maximum-power current | A | Required; min 0 | 10.5 |
| Applicable maximum-current adjustment factor | — | Required; min 0 | 1 |
| Inverter absolute maximum DC voltage | V | Required; min 0 | 600 |
| Applicable MPPT voltage minimum | V | Required; min 0 | 250 |
| Applicable MPPT voltage maximum | V | Required; min 0 | 500 |
| MPPT maximum operating current | A | Required; min 0 | 13 |
| MPPT maximum short-circuit current | A | Required; min 0 | 16 |
| Module datasheet and coefficient conditions | — | Optional / model dependent; Enter the actual datasheet, table or design criterion and its conditions. | Left blank |
| Inverter datasheet and design-condition evidence | — | Optional / model dependent; Enter the actual datasheet, table or design criterion and its conditions. | Left blank |

**Worked-example status:** incomplete.

| Result | Value | Unit |
| --- | --- | --- |
| Cold string Voc | 549 | V |
| Hot string Vmp | 353.85 | V |
| Cold string Vmp | 471.45 | V |
| Adjusted array short-circuit current | 11 | A |
| Adjusted operating current | 10.5 | A |
| Absolute DC voltage condition | Meets entered criterion | — |
| MPPT voltage conditions | Meets entered criterion | — |
| Operating current condition | Meets entered criterion | — |
| Short-circuit current condition | Meets entered criterion | — |

**Formula:** Vstring(T) = Nseries × Vref × [1 + β(%/°C)/100 × (T − Tref)]; Iarray = Nparallel × Imodule × entered adjustment

**Warnings from this example:**

- Assessment incomplete: enter moduleSource, inverterSource. Numerical results use unverified entered values.

**Model notes:**

- Temperature coefficients are distinct for Voc and Vmp; the power coefficient is never substituted.
- All limits, irradiance/current adjustments, tolerances and temperature bounds must be appropriate to the chosen equipment. Startup voltage, protection and overall installation compliance are separate.

**Sources:**

- [https://files.sma.de/downloads/DC-PL-en-11.pdf](https://files.sma.de/downloads/DC-PL-en-11.pdf)
- [https://manuals.sma.de/SBSExx-US-50/en-US/12406857099.html](https://manuals.sma.de/SBSExx-US-50/en-US/12406857099.html)

## T41

### Wind supplied-profile energy

Integrate supplied output, or interpolate an entered manufacturer power curve with wind-speed samples.

1. Click **Engineering Toolbox**, search **T41**, then select **Wind supplied-profile energy**.
2. Enter actual inputs from the table, or click **Load worked example** to practice with the example values.
3. Click **Calculate**. Read the result, formula, notes and warnings below before copying, exporting or applying anything.

| Input | Unit | Requirement / valid entries | Worked-example value |
| --- | --- | --- | --- |
| Input basis | — | Required; Supplied output power (power); Supplied wind speed + power curve (curve) | Supplied output power |
| Power (kW) or wind-speed (m/s) samples | — | Required; Comma-separated samples; basis follows the selected mode. | 0, 1, 2, 1 |
| Manufacturer curve, wind speed:power pairs | — | Optional / model dependent; For example, each entry is speed in m/s : output in kW. No extrapolation. | Left blank |
| Actual elapsed time per sample | h | Required; min 0 | 1 |
| Additional loss fraction not already in data | — | Required; min 0; max 1 | 0.1 |
| Profile / power-curve source, conditions and period | — | Optional / model dependent; Enter the actual datasheet, table or design criterion and its conditions. | Left blank |

**Worked-example status:** incomplete.

| Result | Value | Unit |
| --- | --- | --- |
| Delivered wind energy | 3.6 | kWh |
| Peak delivered output | 1.8 | kW |

**Formula:** E = ΣPsupplied × (1 − additional losses) × Δt

**Warnings from this example:**

- Assessment incomplete: enter source. Numerical results use unverified entered values.

**Model notes:**

- No live wind measurement, air-density correction or invented turbine curve.
- Do not count losses already included in the supplied output/curve a second time.

## T42

### EV charging & deadline feasibility

Battery-delivered energy and AC meter energy with charger, vehicle and site limits.

1. Click **Engineering Toolbox**, search **T42**, then select **EV charging & deadline feasibility**.
2. Enter actual inputs from the table, or click **Load worked example** to practice with the example values.
3. Click **Calculate**. Read the result, formula, notes and warnings below before copying, exporting or applying anything.

| Input | Unit | Requirement / valid entries | Worked-example value |
| --- | --- | --- | --- |
| Usable battery capacity | kWh | Required; min 0 | 60 |
| Starting SOC | % | Required; min 0; max 100 | 20 |
| Target SOC | % | Required; min 0; max 100 | 80 |
| AC-to-battery charging efficiency | — | Required; min 0; max 1 | 0.9 |
| Charger power limit | kW | Required; min 0 | 11 |
| Vehicle acceptance limit | kW | Required; min 0 | 11 |
| Available site power | kW | Required; min 0 | 7 |
| Actual elapsed charging window | h | Required; min 0 | 4 |

**Worked-example status:** calculated.

| Result | Value | Unit |
| --- | --- | --- |
| Required battery-delivered energy | 36 | kWh |
| Required AC meter energy | 40 | kWh |
| Permitted charging power | 7 | kW |
| Minimum constant-power charging time | 5.714285714 | h |
| Battery energy delivered by deadline | 25.2 | kWh |
| Unmet battery energy | 10.8 | kWh |
| Deadline | Infeasible under entered constraints | — |

**Formula:** Erequired = C(SOCtarget − SOCinitial); EAC = Erequired/η; P = min(charger, vehicle, available site)

**Model notes:**

- Constant-power approximation; charging taper and temperature need actual vehicle behavior.
- This plans a session; it does not send commands to a charger.

## T43

### Managed charging allocation

Single-phase sessions, one common time window and constant background demand; allocate in explicit input priority order.

1. Click **Engineering Toolbox**, search **T43**, then select **Managed charging allocation**.
2. Enter actual inputs from the table, or click **Load worked example** to practice with the example values.
3. Click **Calculate**. Read the result, formula, notes and warnings below before copying, exporting or applying anything.

| Input | Unit | Requirement / valid entries | Worked-example value |
| --- | --- | --- | --- |
| Battery energy required by each session | — | Required; Comma-separated kWh, in priority order. | 10,10,10 |
| AC limit for each session | — | Required; One charger/vehicle minimum kW limit, or one per session. | 7.4 |
| Assigned phase for each session | — | Required; Use 1, 2 or 3; one per session. | 1,2,3 |
| Line-to-neutral voltage | V | Required; min 0 | 230 |
| Existing phase currents L1,L2,L3 | — | Required; Exactly three A values; assumed unity PF for headroom. | 10,10,10 |
| Permitted phase-current limits L1,L2,L3 | — | Required; One A value or exactly three. | 32 |
| Available total real-power headroom after background | kW | Required; min 0 | 10 |
| Common elapsed charging window | h | Required; min 0 | 2 |
| AC-to-battery efficiency | — | Required; min 0; max 1 | 0.9 |

**Worked-example status:** calculated.

| Result | Value | Unit |
| --- | --- | --- |
| Total allocated charging power | 10 | kW |
| Unmet battery energy by deadline | 12 | kWh |
| L1 resulting current | 32 | A |
| L2 resulting current | 31.47826087 | A |
| L3 resulting current | 10 | A |
| Deadline assessment | Some requirements infeasible under priority allocation | — |

**Formula:** Allocate min(session limit, phase headroom, remaining site headroom, required kWh/(η × window))

**Model notes:**

- Deterministic input-order priority heuristic; it does not claim a global optimal allocation.
- Unity-PF charging and background-current headroom, fixed single-phase assignments and one common window.
- Reordering sessions changes priorities. No physical charger is controlled.

## T44

### Power-profile integration

Elapsed-time energy integration with potentially unequal intervals; signed power denotes net flow.

1. Click **Engineering Toolbox**, search **T44**, then select **Power-profile integration**.
2. Enter actual inputs from the table, or click **Load worked example** to practice with the example values.
3. Click **Calculate**. Read the result, formula, notes and warnings below before copying, exporting or applying anything.

| Input | Unit | Requirement / valid entries | Worked-example value |
| --- | --- | --- | --- |
| Interval-average real power | — | Required; Comma-separated kW; positive import, negative export. | 1,0,0,0 |
| Actual elapsed duration per interval | — | Required; One positive duration in minutes, or one for each power value. | 15 |

**Worked-example status:** calculated.

| Result | Value | Unit |
| --- | --- | --- |
| Signed net energy | 0.25 | kWh |
| Physical import energy | 0.25 | kWh |
| Physical export energy | 0 | kWh |
| Elapsed duration | 1 | h |
| Whole-window mean power | 0.25 | kW |
| Maximum interval-average power | 1 | kW |

**Formula:** E = Σ(Pinterval × actual elapsed minutes/60); Pmean = E/elapsed hours

**Model notes:**

- Interval values are interval-average powers, not instantaneous samples interpolated without evidence.
- A local daylight-saving day may have 23 or 25 elapsed hours; enter actual durations.

## T45

### Load factor & duration curve

Equal elapsed intervals of non-negative real load; duration curve is sorted from actual supplied powers.

1. Click **Engineering Toolbox**, search **T45**, then select **Load factor & duration curve**.
2. Enter actual inputs from the table, or click **Load worked example** to practice with the example values.
3. Click **Calculate**. Read the result, formula, notes and warnings below before copying, exporting or applying anything.

| Input | Unit | Requirement / valid entries | Worked-example value |
| --- | --- | --- | --- |
| Interval-average load power | — | Required; Comma-separated non-negative kW. | 1,2,3,4 |
| Elapsed duration per interval | h | Required; min 0 | 1 |

**Worked-example status:** calculated.

| Result | Value | Unit |
| --- | --- | --- |
| Energy | 10 | kWh |
| Peak interval-average demand | 4 | kW |
| Average demand | 2.5 | kW |
| Load factor | 0.625 | — |
| Elapsed profile duration | 4 | h |

**Formula:** Load factor = average demand / peak interval demand

**Model notes:**

- Peak is defined by the supplied interval duration. Instantaneous inrush is not represented.
- A duration curve reorders values and therefore must not be used for chronological storage dispatch.

## T46

### Demand-factor definitions

Keep coincidence, diversity, utilization and demand factor separate at the same declared electrical boundary.

1. Click **Engineering Toolbox**, search **T46**, then select **Demand-factor definitions**.
2. Enter actual inputs from the table, or click **Load worked example** to practice with the example values.
3. Click **Calculate**. Read the result, formula, notes and warnings below before copying, exporting or applying anything.

| Input | Unit | Requirement / valid entries | Worked-example value |
| --- | --- | --- | --- |
| Installed electrical input capacity | kW | Required; min 0 | 20 |
| Sum of individual maximum demands | kW | Required; min 0 | 16 |
| Coincident group maximum demand | kW | Required; min 0 | 12 |
| Selected operating real demand | kW | Required; min 0 | 10 |

**Worked-example status:** calculated.

| Result | Value | Unit |
| --- | --- | --- |
| Coincidence factor | 0.75 | — |
| Diversity factor | 1.333333333 | — |
| Demand factor | 0.6 | — |
| Operating utilization | 0.5 | — |

**Formula:** Coincidence = group peak/Σindividual peaks; diversity = reciprocal; demand factor = group peak/installed; utilization = operating/installed

**Model notes:**

- All demand quantities must use the same boundary, power definition and assessment period.
- Do not multiply coincidence and diversity reductions together; they express inverse definitions.

## T47

### Interval tariff & demand bill

Separate imported/exported energy, aligned interval peak demand, standing charges and tax with explicit decimal rounding.

1. Click **Engineering Toolbox**, search **T47**, then select **Interval tariff & demand bill**.
2. Enter actual inputs from the table, or click **Load worked example** to practice with the example values.
3. Click **Calculate**. Read the result, formula, notes and warnings below before copying, exporting or applying anything.

| Input | Unit | Requirement / valid entries | Worked-example value |
| --- | --- | --- | --- |
| Metered import energy by interval | — | Required; Comma-separated kWh; at most six decimals. | 18.4 |
| Metered export energy by interval | — | Required; One value or one per import interval; kWh. | 0 |
| Import tariff by interval | — | Required; One price/kWh or one per interval. Negative prices are supported. | .30 |
| Export tariff by interval | — | Required; One price/kWh or one per interval. | 0 |
| Aligned demand interval duration | min | Required; min 0 | 480 |
| Charge per peak aligned kW for this period | currency/kW | Required; min 0 | 0 |
| Standing charge per billable day | currency/day | Required; min 0 | 0 |
| Billable day count | days | Required; min 0; max 36600 | 1 |
| Tax rate | % | Required; min 0; max 100 | 0 |
| Tax basis | — | Required; Import + demand + standing, before export credit (gross); Net charges after export credit (net) | Import + demand + standing, before export credit |
| Currency denomination | — | Required; EUR (EUR); NGN (NGN); USD (USD); GBP (GBP) | EUR |

**Worked-example status:** calculated.

| Result | Value | Unit |
| --- | --- | --- |
| Physical import | 18.4 | kWh |
| Physical export | 0 | kWh |
| Peak aligned interval import demand | 2.3 | kW |
| Import energy charge | 5.52 | EUR |
| Demand charge | 0 | EUR |
| Standing charge | 0 | EUR |
| Export credit (subtracted) | 0 | EUR |
| Subtotal | 5.52 | EUR |
| Tax | 0 | EUR |
| Total bill estimate | 5.52 | EUR |

**Formula:** Energy charge = Σ(import kWh × price); demand = max(interval import kWh / elapsed h) × price; total = charges − export credits + selected tax

**Model notes:**

- Prices are supplied for every interval; assign the intended time-of-use/calendar band before using this worksheet.
- All selected currencies use two minor-unit decimals here. Each aggregate charge and tax line is rounded half away from zero using integer decimal arithmetic. Inputs support six decimal places.
- Demand uses aligned intervals. Rolling-window demand and provider-specific tariff rules are not inferred.
- Currency selection is denomination only; it does not perform foreign-exchange conversion.
- Tax basis: import + demand + standing, excluding export credit. Negative taxable amounts produce a negative tax estimate; verify applicability.

## T48

### Standby & replacement savings

Compare entered old/new active and standby input power over the same explicit period.

1. Click **Engineering Toolbox**, search **T48**, then select **Standby & replacement savings**.
2. Enter actual inputs from the table, or click **Load worked example** to practice with the example values.
3. Click **Calculate**. Read the result, formula, notes and warnings below before copying, exporting or applying anything.

| Input | Unit | Requirement / valid entries | Worked-example value |
| --- | --- | --- | --- |
| Existing active electrical input | W | Required; min 0 | 100 |
| Replacement active electrical input | W | Required; min 0 | 20 |
| Existing standby electrical input | W | Required; min 0 | 5 |
| Replacement standby electrical input | W | Required; min 0 | 1 |
| Active hours per assumed 24-hour day | h/day | Required; min 0; max 24 | 8 |
| Number of assumed days | days | Required; min 0 | 30 |
| Energy price | currency/kWh | Required | 0.3 |

**Worked-example status:** calculated.

| Result | Value | Unit |
| --- | --- | --- |
| Existing energy | 26.4 | kWh |
| Replacement energy | 5.28 | kWh |
| Energy reduction | 21.12 | kWh |
| Energy-charge reduction | 6.336 | currency |

**Formula:** E = [Pactive × active hours + Pstandby × (24 − active hours)] × days/1000

**Model notes:**

- Assumed 24-hour daily estimate; not a calendar/DST simulation.
- Equipment must provide comparable service. Fixed/demand charges and capital costs are separate.

## T49

### Operational electricity carbon

Apply a geographically and temporally identified user-supplied operational emissions factor to imported electricity.

1. Click **Engineering Toolbox**, search **T49**, then select **Operational electricity carbon**.
2. Enter actual inputs from the table, or click **Load worked example** to practice with the example values.
3. Click **Calculate**. Read the result, formula, notes and warnings below before copying, exporting or applying anything.

| Input | Unit | Requirement / valid entries | Worked-example value |
| --- | --- | --- | --- |
| Physical imported electricity | kWh | Required; min 0 | 1000 |
| Operational emissions factor | kg CO₂e/kWh | Required; min 0 | 0.4 |
| Factor publisher, URL and method | — | Optional / model dependent; Enter the actual datasheet, table or design criterion and its conditions. | Left blank |
| Factor geographical scope | — | Optional / model dependent; Enter the actual datasheet, table or design criterion and its conditions. | Left blank |
| Factor year / applicable period | — | Optional / model dependent; Enter the actual datasheet, table or design criterion and its conditions. | Left blank |

**Worked-example status:** incomplete.

| Result | Value | Unit |
| --- | --- | --- |
| Estimated operational emissions | 400 | kg CO₂e |
| Estimated operational emissions | 0.4 | t CO₂e |

**Formula:** Operational CO₂e = imported kWh × applicable kg CO₂e/kWh

**Warnings from this example:**

- Assessment incomplete: enter source, geography, period. Numerical results use unverified entered values.

**Model notes:**

- No automatic emissions credit for exports. Embodied impacts, offsets and supplier marketing claims are excluded.
- The example factor is an analytical assumption, not a current national emissions value.

## T50

### Simple payback & break-even

Undiscounted constant annual savings compared with entered investment and recurring costs.

1. Click **Engineering Toolbox**, search **T50**, then select **Simple payback & break-even**.
2. Enter actual inputs from the table, or click **Load worked example** to practice with the example values.
3. Click **Calculate**. Read the result, formula, notes and warnings below before copying, exporting or applying anything.

| Input | Unit | Requirement / valid entries | Worked-example value |
| --- | --- | --- | --- |
| Initial investment | currency | Required; min 0 | 5000 |
| Annual gross cost saving | currency/year | Required | 1200 |
| Additional annual maintenance cost | currency/year | Required; min 0 | 200 |
| Assessment horizon | years | Required; min 0 | 10 |

**Worked-example status:** calculated.

| Result | Value | Unit |
| --- | --- | --- |
| Net annual saving | 1000 | currency/year |
| Simple payback | 5 | years |
| Undiscounted net benefit at horizon | 5000 | currency |
| Break-even within horizon | Yes under constant assumptions | — |

**Formula:** Net saving = gross saving − added maintenance; payback = investment/net annual saving

**Model notes:**

- No financing, discounting, tax, replacement, degradation or future price prediction is included. Use the discounted cash-flow worksheet for an explicit discount model.

## T51

### NPV & discount-rate sensitivity

Explicit annual cash flows, saving escalation, fixed annual maintenance and end-of-horizon residual value.

1. Click **Engineering Toolbox**, search **T51**, then select **NPV & discount-rate sensitivity**.
2. Enter actual inputs from the table, or click **Load worked example** to practice with the example values.
3. Click **Calculate**. Read the result, formula, notes and warnings below before copying, exporting or applying anything.

| Input | Unit | Requirement / valid entries | Worked-example value |
| --- | --- | --- | --- |
| Initial investment | currency | Required; min 0 | 1000 |
| First-year gross annual saving | currency | Required | 600 |
| Fixed annual added maintenance | currency | Required; min 0 | 0 |
| Annual gross-saving escalation | % | Required; min -99.99 | 0 |
| Annual discount rate | % | Required; min -99.99 | 10 |
| Number of years | years | Required; min 1; max 100 | 2 |
| End-of-horizon residual value | currency | Required | 0 |
| Discount-rate sensitivity half-width | percentage points | Required; min 0 | 2 |

**Worked-example status:** calculated.

| Result | Value | Unit |
| --- | --- | --- |
| Net present value | 41.32231405 | currency |
| First cumulative discounted break-even year | 2 | year |
| NPV at 8% discount | 69.95884774 | currency |
| NPV at 12.000000000000002% discount | 14.03061224 | currency |

**Formula:** NPV = −investment + Σyear[(saving₁(1+escalation)^(year−1) − maintenance + final residual)/(1+discount)^year]

**Model notes:**

- Cash flows occur at each year end. Gross saving escalates; maintenance is held constant in this stated model.
- A first break-even year is not a guarantee that later cumulative cash flow remains positive.
- Entered scenarios are assumptions, not forecasts or investment advice.

## Further documentation

- [Calculation methods](CALCULATION_METHODS.md)
- [Tool methods](TOOL_METHODS.md)
- [Supported legacy migration](LEGACY_MIGRATION.md)
- [Known limitations](KNOWN_LIMITATIONS.md)
- [Data sources and rights](DATA_SOURCES.md)
- [Test evidence](TEST_EVIDENCE.md)
- [Acceptance matrix](ACCEPTANCE_MATRIX.md)
- [Report a repository issue](https://github.com/HephzibahBehulahHQ/AdigunPowerLab/issues)
