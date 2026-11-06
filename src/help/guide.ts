export interface HelpArticle {
  id: string;
  title: string;
  summary: string;
  steps: string[];
  controls?: [string, string][];
  example?: string;
  notes?: string[];
}

/** The in-app guide and repository guide share this reviewed task catalogue. */
export const helpArticles: HelpArticle[] = [
  {
    id: "start",
    title: "Start a project",
    summary:
      "A project is one installation or power study. Begin with its basic details, add your equipment, then save the work you want to keep.",
    steps: [
      "On a fresh visit, open [[Overview]] and use [[Project setup interview]]. For another new study, open [[Project]] → [[New project]], enter a clear name such as Workshop power study, then click [[Create]].",
      "In setup step 1, enter [[Project name]], choose [[Context]] and [[Currency]], then click [[Next step]]. These describe the study; changing language does not change its currency.",
      "In setup step 2, enter the actual [[L–N voltage]], [[L–L voltage]], [[Frequency]] and [[Supply limit]]. Use the supply information for your installation, then click [[Next step]].",
      "In step 3, review the details. Click [[Finish setup]] when they are correct. This finishes the questions; click [[Save project]] separately to keep the project. You can save partway through the interview and resume that step later.",
      "Click [[Add load]] to enter one item of equipment, or open [[Load Schedule]] for the equipment list. Finish the load form before saving the project. [[Calculate]] opens the calculation trace; results update from the entered project inputs.",
      "Before leaving, click [[Save project]] and wait for [[Saved locally]]. After a reload, use [[Resume project]] and choose your saved project. A new visit starts a fresh setup instead of restoring unsaved work.",
    ],
    example:
      "Practice with a clearly labelled training project: add one single-phase resistive load with electrical input 2.3 kW, 230 V, power factor 1, quantity 1 and 8 operating hours. With full utilization and energy duty, its current is 10 A and its daily energy is 18.4 kWh. These are practice inputs, not a recommendation for an installation.",
    notes: [
      "If you do not know a supply or nameplate value, find the actual evidence before relying on the result. Defaults and worked examples are assumptions, not measurements.",
    ],
  },
  {
    id: "navigation",
    title: "Navigating the platform",
    summary:
      "The header selects projects, the left navigation selects workspaces, and the right inspector explains the selected item or calculation.",
    steps: [
      "Click a left-hand menu such as [[Load Schedule]] or [[Reports & Estimates]] to open that workspace. Click the group heading ([[Workspace]], [[Engineering]], [[Energy & Planning]] or [[Resources]]) to collapse or expand its menu items.",
      "On a small screen, click [[Open navigation]], choose a page, and the workspace becomes visible. [[Collapse navigation]] makes more room for the current page.",
      "Click [[Search]] in the header or press Ctrl/Cmd+K. Enter a page name, equipment name or tool ID, then select the matching result to open it.",
      "Click a load, board, circuit or diagram object to open its inspector. Read its values and evidence, use [[Edit load]] or [[Edit selected object]] to change it, and close the inspector with its X button.",
      "Click [[Help & Support]] whenever you need instructions, or press F1 even while an editor is open. Search for a task, menu, warning or tool ID. The guide opens over your current work; close it or press Escape to return to that same work.",
    ],
    controls: [
      [
        "Project name in the header",
        "Opens the local project list. Choose a saved entry to reopen it.",
      ],
      [
        "Save status",
        "Unsaved changes means work differs from the saved copy; Saving means a write is in progress; Saved locally appears after success; Save failed needs your attention.",
      ],
      [
        "Calculate",
        "Opens the project calculation trace with the current revision, formulas, assumptions and issues. It does not save the project.",
      ],
      [
        "Undo / Redo",
        "Reverses or reapplies a project edit. Disabled buttons mean there is no applicable history. These do not replace portable backups.",
      ],
      [
        "Simple / Engineering",
        "Shows explained core values or expanded technical details. Failed and incomplete checks remain visible in both modes.",
      ],
      [
        "Language",
        "Selects English, Deutsch, Yorùbá or Nigerian Pidgin. It does not convert currency or change engineering assumptions.",
      ],
      [
        "Footer issue count",
        "Opens History & Issues. The engine version and current object counts are also shown in the footer.",
      ],
      ["Hephzibah Behulah logo", "Opens the corporate website in another tab."],
    ],
  },
  {
    id: "quantities",
    title: "Understand the input units",
    summary:
      "Read the unit beside each field before typing. Similar-looking quantities answer different questions.",
    steps: [
      "Find the value on the equipment nameplate, measurement or documentation and note its unit. Enter that value only in a field with the same unit, or use the Engineering unit converter worksheet first.",
      "For an efficiency, power factor, duty or SOC field, check whether the label requests percent or a fraction from 0 to 1. For example, 90% is 0.9 in a 0–1 field; entering 90 there is invalid.",
      "Check whether voltage is line-to-neutral (L–N), line-to-line (L–L) or DC, and whether a rating is per item or for the whole installation. Enter the quantity separately where requested.",
      "Review the calculated units again after Calculate. Use the input example in each tool guide to learn the format, then replace practice values with your own evidence.",
    ],
    controls: [
      [
        "V — voltage",
        "The electrical potential difference at the equipment or supply. Select the correct AC/DC and line/phase basis.",
      ],
      [
        "A — current",
        "The electrical current through a conductor. Average energy duty does not necessarily reduce its on-state value.",
      ],
      [
        "W / kW — real power",
        "The rate at which useful electrical energy is transferred or consumed. 1 kW = 1,000 W; do not enter watts into a kW field without converting.",
      ],
      [
        "kWh — energy",
        "Power accumulated over time. A constant 2 kW load for 3 hours uses 6 kWh before any other model adjustments.",
      ],
      [
        "kVA — apparent power",
        "Voltage/current-based electrical capacity. It differs from real kW when PF is below 1.",
      ],
      [
        "kvar — reactive power",
        "The reactive part of AC power. Sign/lagging/leading conventions matter when combining equipment.",
      ],
      [
        "PF — power factor",
        "The relation between real and apparent power. Displacement PF and true PF describe different conditions; select the supported basis.",
      ],
      [
        "Efficiency / utilization / energy duty",
        "Efficiency relates useful output to electrical input; utilization scales the entered operating point; energy duty describes average operation while scheduled. They are not interchangeable.",
      ],
      [
        "Ω — resistance / Hz — frequency",
        "Resistance describes opposition to current in the stated model; frequency is AC cycles per second.",
      ],
      [
        "m / mm²",
        "Metres describe route length; square millimetres describe conductor cross-section. They are different measurements.",
      ],
      [
        "Ah / kWh / SOC",
        "Ampere-hours describe charge capacity; kWh describes energy. SOC is the battery state of charge, entered in the form's specified fraction or percent.",
      ],
      [
        "rpm / N·m",
        "Revolutions per minute describe rotational speed; newton-metres describe torque. Motor shaft output still needs efficiency to obtain electrical input.",
      ],
    ],
  },
  {
    id: "save",
    title: "Save, refresh and resume",
    summary:
      "Only an explicit successful save keeps the current project for another visit. Unsaved drafts are temporary and separate from saved projects.",
    steps: [
      "Finish an open equipment/settings/report form using its own [[Save]], [[Add load]], [[Save report details]] or reviewed [[Apply changes]] button. Then click [[Save project]] in the workspace toolbar, or use Ctrl/Cmd+S outside another dialog. The checkpoint keeps the current engineering project, setup answers/step, current customer bill and BOT conversation/composer together.",
      "Wait until the status says [[Saved locally]]. Do not treat [[Saving]] as a completed save. If [[Save failed]] appears, keep the tab open, read the error, and export a copy before trying again.",
      "If you refresh or close with unsaved changes, the browser may show its standard leave-page warning. Choose Cancel/Stay to keep the current work. The platform does not delete anything while asking the question.",
      "If you choose Leave/Reload, the next load starts a fresh project setup and discards unsaved temporary work. Previously saved projects remain in the local project list.",
      "Click [[Resume project]], find the project by its name and saved time, and click it. The saved engineering project, setup progress and supported session context reopen. Changes made after the last successful save are not in that saved copy.",
      "The bill also has a Save draft locally action, which saves the bill with its associated project checkpoint. Save measured datasets with [[Save measured data]] before keeping a combined backup. Use [[Settings]] → [[Workspace backup & restore]] for a portable archive of saved projects, revisions, bills and measurements; export individual drafts when needed.",
    ],
    example:
      "Save a project named Workshop A, change a load from 2.3 kW to 3 kW, then cancel the browser's leave warning: 3 kW remains on screen. If you leave without saving, Resume project reopens the earlier 2.3 kW version.",
    notes: [
      "Saved locally means this browser profile on this device. It is not cloud synchronization. Browser cleanup, private browsing or device loss can remove local data; keep downloaded backups elsewhere.",
      "The browser controls the warning wording and whether it appears. Mobile browsers or forced browser shutdowns may skip it, so save before leaving.",
      "Opening Help & Support does not navigate away, complete a form, save it or clear it. Press F1 from an open editor, then Escape to return to that form. If Save project asks you to finish/apply an editor, do that first; an unsubmitted editor is not silently treated as a saved engineering input.",
    ],
  },
  {
    id: "project-actions",
    title: "Project menu and saved work",
    summary:
      "Use the Project menu for names, copies, imports, history, closing and recoverable deletion.",
    steps: [
      "Open [[Project]] in the workspace toolbar. Choose the action from the menu below. If asked about unsaved changes, save first, discard deliberately, or cancel to remain on the current project.",
      "For [[Rename project]], enter the new name and confirm the form. Save the project afterward to keep the rename. For [[Duplicate project]], review the new copy and save it with a name you can recognize.",
      "For [[Move to trash]], check the displayed project name before confirming. To recover it, choose [[Restore from trash]], expand [[Trash]], click [[Restore]] for the matching entry, then reopen it from the project list.",
    ],
    controls: [
      [
        "New project",
        "Opens the named-project creation form; Create begins a new study.",
      ],
      [
        "Open project / Resume project",
        "Shows saved projects with their names, equipment counts and saved times. Click the desired entry.",
      ],
      [
        "Rename project / Duplicate project",
        "Changes the current name or creates an independent copy; verify the active project name afterward.",
      ],
      [
        "Save project",
        "Writes the current engineering project, setup progress, customer bill and BOT session together; wait for success.",
      ],
      [
        "Export project / Import project",
        "Downloads native engineering JSON or previews a supported JSON/CSV import.",
      ],
      ["Revision history", "Opens saved revisions and the issue register."],
      [
        "Close project",
        "Leaves the active project and opens a fresh workspace; resolve any unsaved-change prompt first.",
      ],
      [
        "Move to trash / Restore from trash",
        "Hides a saved project from the active list or recovers a trashed entry. Export a backup before browser cleanup.",
      ],
    ],
  },
  {
    id: "overview",
    title: "Overview",
    summary:
      "Read the study's demand, energy, phases and issues before producing a report.",
    steps: [
      "Click [[Overview]]. Enter equipment through [[Add load]], or choose [[Open reference case]] to study a labelled analytical example in a separate project.",
      "Read [[Installed load]], [[Design demand]], [[Daily energy]] and [[Daily cost]]. kW describes power; kWh describes energy over time. Costs use the prices entered in the project.",
      "Inspect the demand profile and [[Phase loading]]. Open the chart's [[Chart data table]] for its numerical values when the graph is difficult to read.",
      "Read [[Project health]] and [[Issues]]. Click [[Calculate]] to inspect the formula, assumptions and input revision behind the displayed results. Go to [[Schedules & Simulation]] for an explicit date range.",
    ],
    notes: [
      "Representative daily and 30-day estimates are planning summaries. They are not a completed calendar simulation or measured utility bill.",
    ],
  },
  {
    id: "loads",
    title: "Load Schedule",
    summary:
      "A load is an item that consumes electricity. Add its electrical data, operating schedule and source evidence.",
    steps: [
      "Open [[Load Schedule]] → [[Add load]]. Enter [[Name]], [[Quantity]] and [[Rating]], then select the matching [[Entry mode]]: electrical kW, apparent kVA, nameplate current, motor shaft output or explicit real/reactive power.",
      "Choose [[Connection]], [[Voltage]], [[Phase]] or [[Phase pair]], [[Power factor]] and, when required, efficiency. Use shaft-output mode only when the rating is mechanical output; otherwise efficiency would be applied to the wrong quantity.",
      "Enter operating hours, [[Start hour]], [[Energy duty]], [[Utilization]] and [[Standby power]]. Open [[More assumptions]] for advanced inputs; hiding this section does not disable those values.",
      "Choose [[Provenance]] and enter [[Source reference]] so another person can tell whether the data came from a nameplate, measurement, datasheet or assumption. Review [[Input preview]], then submit the form to add/update the load.",
      "Click a load name to inspect it. Use the row's [[Edit]], [[Duplicate]] or [[Delete]] controls; review a deletion before applying it. Search and phase filters narrow the displayed rows without removing equipment.",
      "Click [[Save project]] after your changes. [[Export]] on the load schedule downloads a CSV of equipment; [[Import]] opens the validated project/CSV preview.",
    ],
    controls: [
      [
        "Add from library",
        "Opens reusable equipment. Review its assumptions and adjust the added load to your actual equipment.",
      ],
      [
        "Critical load",
        "Marks a planning priority used by supported backup studies; it is not a hardware control.",
      ],
      [
        "Lock phase",
        "Prevents supported phase-balancing operations from moving the load automatically.",
      ],
      [
        "Right-click / Shift+F10",
        "Opens the load actions menu for inspection, editing, duplication or deletion.",
      ],
      [
        "Back / Continue",
        "Moves between load-list pages where pagination is shown.",
      ],
      ["Cancel", "Closes the edit form without applying its pending changes."],
    ],
    notes: [
      "Energy duty changes average energy while scheduled; it is not a safe way to reduce the on-state conductor current. Select an appropriate circuit or leave the load explicitly unassigned.",
    ],
  },
  {
    id: "bulk",
    title: "Bulk actions & clipboard",
    summary:
      "Select several loads, review a shared change, and apply it together.",
    steps: [
      "Open [[Load Schedule]] → [[Bulk actions & clipboard]]. Enter a name filter or choose category, phase, board or source filters. [[Only loads with unresolved issues]] limits the list to loads needing attention.",
      "Tick individual loads or click [[Select filtered loads]]. Use [[Clear selection]] to remove the selection. Choose a [[Bulk action]] such as [[Set field]], [[Assign phase]], [[Assign circuit]], [[Set daily schedule]], [[Attach source]], [[Duplicate selected loads]] or [[Delete selected loads]].",
      "Enter the requested value or destination. Click [[Preview selected changes]], inspect Before/After and validation messages, then apply the reviewed changes. Cancel keeps the project unchanged; Undo can reverse a committed project edit.",
      "For copied rows, click [[Copy selected rows]] then [[Export copied rows]] if you need a file. To bring rows in, click [[Paste validated rows]], paste the row text or select a [[Load row file]], use [[Download headers template]] if needed, then [[Validate pasted rows]]. Apply only after the preview is valid.",
    ],
    notes: [
      "Invalid pasted records are rejected together. The row-file limit is 2 MB. Replacing an advanced dated schedule with a basic daily schedule is a deliberate choice in the bulk form.",
    ],
  },
  {
    id: "review",
    title: "Review project changes",
    summary:
      "A preview shows proposed changes before they modify your project. The same review pattern is used for bulk edits, topology, tool results and other supported actions.",
    steps: [
      "After entering values in the relevant workspace, click its Preview action. Read the proposal summary, current revision and the table's Object, Field, Before and After columns.",
      "Resolve errors before applying. Warnings describe assumptions or effects that need review. Expand [[Read complete value]] for long content; if only the first 250 changes are visible, use [[Export preview]] to inspect the entire proposal.",
      "Click [[Apply reviewed changes]] to commit the reviewed proposal or [[Cancel]] to keep the project unchanged. If the project changed after the preview, close it and generate a fresh preview against the new revision.",
      "Check the resulting project, use [[Undo]] if needed, then [[Save project]] to keep the desired version. Applying a project change and saving a durable checkpoint are separate actions.",
    ],
  },
  {
    id: "imports",
    title: "Import files and supported formats",
    summary:
      "Choose the importer that matches the kind of data. File extensions alone do not make a file compatible.",
    steps: [
      "For an engineering project or load list, choose [[Project]] → [[Import project]] (or [[Load Schedule]] → [[Import]]) and select PowerLab .json or load-schedule .csv. This importer accepts up to 5 MB and 10,000 CSV loads.",
      "For CSV, include a header row and at least one load. Match source columns in the preview and choose the correct rating unit: W, kW, VA, kVA, A or native entry mode. After changing the mapping, refresh the preview before applying.",
      "Choose the destination: [[New project]] creates an independent project; [[Merge into current project]] adds imported objects while retaining current supply and tariff settings; [[Replace current project contents]] replaces the contents while keeping the current project identity.",
      "Read every error and warning. Fix errors in the source or column mapping, then preview again. Click [[Apply import]] only when the preview is valid. A rejected file leaves the project unchanged; an applied merge or replacement can be undone.",
      "For other data, use its dedicated importer from the format list below. A billing JSON file, workspace archive and engineering project JSON have different structures and must not be interchanged.",
    ],
    controls: [
      [
        "PowerLab project JSON / load CSV",
        "Project → Import project. The app also recognizes specific supported AdigunTokenCalculator V1/V2 exports; unrecognized legacy structures are rejected.",
      ],
      [
        "Customer bill JSON",
        "Reports & Estimates → Customer bill → Import draft JSON, up to 2 MB. Review the replacement confirmation; Export draft JSON keeps a portable editable bill.",
      ],
      [
        "Measurement CSV / measurement backup JSON",
        "Schedules & Simulation → Measured intervals → Open measured CSV or backup. CSV limit: 5 MB; measurement JSON: 32 MB. Map timestamp/power columns before preview.",
      ],
      [
        "Equipment library JSON",
        "Equipment Library → Import equipment, up to 2 MB. Inspect the preview and Apply import to add supported equipment records.",
      ],
      [
        "Workspace backup JSON",
        "Settings → Workspace backup & restore → Inspect workspace backup. Validate the entire archive before Restore reviewed backup; maximum 64 MiB.",
      ],
      [
        "PDF, image, DWG and spreadsheet workbook",
        "These are not native project imports. Export compatible CSV from a spreadsheet first; PDF is an output/report format here, not an OCR importer.",
      ],
    ],
    example:
      "For a basic CSV use headers name,rating,quantity,entrymode,voltage,connection,pf,phase,hoursperday,starthour,duty,utilization and a data row matching an exported load. The safest template is a real Export loads CSV from this platform; replace its values and retain supported field names.",
    notes: [
      "CSV numeric data uses decimal points. German interactive number fields accept decimal commas. For list-valued inputs, use semicolons to separate numbers so decimal commas are not mistaken for separators.",
    ],
  },
  {
    id: "boards",
    title: "Boards & Circuits",
    summary:
      "Organize the electrical path from the supply through boards and circuits to loads.",
    steps: [
      "Open [[Boards & Circuits]]. Click [[Add board]], enter its name, available ways and documented supply/rating details, then confirm the form. Add a board before adding its circuits.",
      "Click [[Add circuit]], choose the parent board, enter its name, phase and protective-device information, then save. Assign each load to the intended circuit using the assignment selector; [[Unassigned]] means it has no circuit connection.",
      "Use [[Configure source and evidence]] and [[Cables & Protection]] to supply supporting source/cable information before interpreting capacity checks. Missing evidence remains incomplete.",
      "Click [[Preview balance]] to see proposed phase moves and the Before/After comparison. Review locked phases and proposed assignments, then [[Apply changes]] or [[Cancel]].",
      "For site organization, use [[Site, buildings and zones]]: enter [[Group name]], select Building or Zone and a parent group, then [[Add group]]. Rename/remove the selected group as needed; these groups organize records rather than creating electrical connections.",
    ],
    notes: [
      "Removing an organization group reparents its child groups and detaches board assignments to that group. Review topology changes separately from organization labels.",
    ],
  },
  {
    id: "diagram",
    title: "Single-Line Studio",
    summary:
      "Inspect and edit the same boards, circuits and loads as a connected diagram.",
    steps: [
      "Open [[Single-Line Studio]] → [[Single-line diagram]]. Click a component or choose [[Select diagram object]] to inspect it. Use [[Add board]], [[Add circuit]] or [[Add note]] for a new object; enter the requested details and review the addition.",
      "Select a load, choose a circuit under [[Connect load to circuit]], and click [[Connect]]. [[Disconnect]] removes the circuit assignment without deleting the load. Phase or object edits use [[Preview object changes]] / [[Preview phase assignment]] before applying.",
      "Under cable evidence, enter the actual route and conductor data plus source reference, then [[Preview cable changes]]. [[Clear cable data]] removes that evidence. For removal, choose how dependencies should be handled before [[Preview removal]].",
      "Use [[Pan]], directional pan buttons, [[Zoom in]], [[Zoom out]] and [[Fit view]] to position the diagram. Enter Diagram X/Y and [[Save position]] for manual placement; [[Auto-layout]] reorganizes it. Toggle labels, ratings and [[Flow animation]] to control the display.",
      "Choose [[Isolate board]] to focus the view. [[Export SVG]] downloads a vector image; choose page size/orientation before [[Export diagram PDF]]. These exports show the displayed diagram and entered data.",
    ],
    controls: [
      [
        "Remove subtree; keep loads unassigned",
        "Removes the selected board/circuit hierarchy while retaining affected loads for reassignment; inspect the preview first.",
      ],
      [
        "Move direct dependants to another board",
        "Choose the destination board and review the proposed dependency changes before removal.",
      ],
      [
        "Diagram notes / Remove note",
        "Adds or removes an explanatory annotation; it is not an electrical component.",
      ],
    ],
    notes: [
      "Diagram distances are not surveyed cable lengths. Drawing a line does not prove an installation is safe or create a billable measured quantity.",
    ],
  },
  {
    id: "spatial",
    title: "Analytical spatial view",
    summary:
      "Explore a perspective rendering of the project graph without changing the electrical model.",
    steps: [
      "Open [[Single-Line Studio]] → [[Analytical spatial view]]. Adjust [[Orbit angle]], [[Elevation]] and [[Zoom]] to inspect the graph; [[Reset view]] returns to the default camera.",
      "Choose [[Isolate board]] to show one branch, or [[Whole project]] to show every branch. Click an object or use the selection controls to inspect its details.",
      "Move [[Representative hour]] to see modelled hourly power. [[Export spatial SVG]] downloads the displayed graph for sharing.",
    ],
    notes: [
      "This is a hierarchy-based analytical view, not a surveyed 3D building. Hourly flow labels represent model energy averages, not live telemetry or motor-start currents.",
    ],
  },
  {
    id: "simulation",
    title: "Schedules & Simulation",
    summary:
      "Calculate energy across explicit dates and use the timeline to inspect the result.",
    steps: [
      "Open [[Schedules & Simulation]]. Choose [[Start date]], [[End date]] and [[Interval]], and check the project [[Timezone]]. The period follows elapsed time, including supported timezone changes.",
      "Click [[Validate inputs]] to see missing requirements, then [[Run simulation]]. Wait for a completed range; [[Cancel simulation]] / [[Cancel]] stops a calculation in progress.",
      "Inspect the result and use Play/Pause, [[Playback speed]], [[Step backward]], [[Step forward]] or [[Timeline hour]] to move through it. [[Show details]] and the data table expose numeric values.",
      "Click [[Export series]] to download the completed series. If you edit proposed dates without completing another run, the old output remains labelled with its previous completed dates; rerun to obtain new evidence.",
    ],
    notes: [
      "Project edits can invalidate an earlier analysis. Run again before freezing a report that needs results from the new revision.",
    ],
  },
  {
    id: "advanced",
    title: "Advanced schedules, starts and flexible loads",
    summary:
      "Enter real operating windows, exceptional dates and start events, then review constrained schedules.",
    steps: [
      "Open [[Schedules & Simulation]] → [[Advanced schedules, starts and flexible loads]]. Choose a [[Selected load]]. Add operating windows with start hour, duration, weekdays, months and effective dates, then [[Save calendar rules]]. Empty weekday/month lists mean every day/month.",
      "Use [[Add date exception]] for a closed day or replacement windows. [[Use explicit on/off cycle instead of average duty]] enables timed cycling. Remove an unwanted window/exception with its labelled remove button. [[Use basic daily schedule]] returns to the simple daily model.",
      "For starts, click [[Add start event]], choose the load and an offset-qualified timestamp, then enter documented total starting current or a current multiplier, PF, method and source. [[Save start events]] stores the inputs; [[Assess start sequence]] calculates the combined events; [[Export complete start sequence]] downloads the assessment.",
      "For flexible work, click [[Add flexible process]], enter energy, minimum uninterrupted run, priority and evidence, then [[Add available window]] with arrival/deadline timestamps. Choose whether splitting is allowed and whether the requirement is locked. [[Save requirements]] commits these inputs.",
      "Enter the actual calendar period, interval, site power limit and scheduling objective. For generation-following, provide one generation value for every planning interval. Click [[Preview constrained schedule]], review delivered/unmet energy and dates, then [[Apply reviewed schedule]]. Undo reverses the applied schedule.",
      "Use [[Export complete calendar]] for the completed range. Read [[Separate billing lines]] when demand, standing charges and taxes are included.",
    ],
    example:
      "An explicit timestamp such as 2026-11-06T08:00:00+01:00 identifies an instant and its UTC offset. A bare local time does not resolve daylight-saving ambiguity.",
  },
  {
    id: "measurements",
    title: "Measured intervals",
    summary:
      "Import measured average power separately from estimated equipment data.",
    steps: [
      "Open [[Schedules & Simulation]] → [[Measured intervals]] → [[Open measured CSV or backup]]. Choose a CSV up to 5 MB or a compatible measurement backup JSON up to 32 MB.",
      "For CSV, choose [[Timestamp column]], [[Interval-average power column]], [[Power unit]] (W or kW) and [[Declared elapsed interval]] in minutes. Timestamps mark interval starts and need Z or an explicit UTC offset.",
      "Click [[Preview measured data]]. Inspect assumptions, coverage warnings and the validated table. Negative power represents export; missing intervals remain missing rather than being filled with zero.",
      "Click [[Save measured data]] and wait for success. [[Reopen saved measurements]] reloads the stored dataset for the current project. [[Inspect]], [[Previous]] and [[Next]] help you review individual rows.",
      "Use [[Export cleaned CSV]] for normalized kW/kWh data or [[Export measurement backup]] for portable recovery. Save before exporting a combined workspace backup.",
    ],
  },
  {
    id: "cables",
    title: "Cables & Protection",
    summary:
      "Assess an entered cable route and use the related worksheets with documented conductor and device evidence.",
    steps: [
      "Open [[Cables & Protection]] → [[Cumulative feeder assessment]]. Choose [[Segment to edit]] (feeder or final circuit) and its actual board/circuit. Enter route length, conductor/neutral impedance, ampacity, correction factors and source conditions.",
      "Click [[Save segment evidence]]. [[Remove segment evidence]] clears that segment's inputs. Choose [[Endpoint load]] and [[Operating scenario]], and enter a voltage criterion override or start instant only when applicable.",
      "Click [[Assess complete route]]. Review cumulative voltage drop, receiving voltage, losses and independent capacity/neutral checks. [[Export route evidence]] downloads the actual assessment.",
      "For a standalone cable/protection calculation, choose the worksheet below the route assessment, enter its requested data and [[Calculate]]. The full tool directory in this guide explains every worksheet's inputs and example output.",
    ],
    notes: [
      "A missing or unsupported input produces an incomplete/unsupported result. The app does not supply a licensed cable table, select manufacturer coordination evidence for you, or certify the installation.",
    ],
  },
  {
    id: "sources",
    title: "Motors & Supply",
    summary:
      "Record actual source equipment and compare its documented limits with running or starting requirements.",
    steps: [
      "Open [[Motors & Supply]] → [[Source register and capacity checks]] → [[Add source]]. Enter name, type, electrical connection, served board/whole project, ratings, derating and evidence reference, then [[Save source]].",
      "If supported by the source documentation, enable [[Enter documented overload envelope]] and enter duration and envelope reference. Record island/transfer/restart/black-start evidence only when you have it.",
      "Choose [[Assessment source]], [[Operating scenario]] and [[Assessment instant]]. Inspect the independent kW, kVA, phase-current and starting-envelope checks, then [[Export assessment]] for a copy.",
      "Use [[Edit]] or [[Delete]] beside an equipment record to maintain it. For motor, generator, transformer, UPS or inverter arithmetic, choose a worksheet below and follow its inputs, formulas and warnings.",
    ],
    notes: [
      "Source declarations describe entered planning evidence. They do not control equipment or prove safe transfer, islanding or paralleling.",
    ],
  },
  {
    id: "quality",
    title: "Power Quality",
    summary:
      "Use the power-factor, capacitor and harmonic worksheets to inspect values you supply.",
    steps: [
      "Open [[Power Quality]], then choose the worksheet that matches your question. Enter its real power, existing/target PF, frequency, connection or supplied harmonic spectrum as requested.",
      "Click [[Calculate]]. Read the formula and units, including whether PF is displacement PF or true PF. Open [[Load worked example]] for labelled practice values if you are learning the worksheet.",
      "Read the limitations and warnings before copying/exporting the result. If you want the result in a project, use the available reviewed application or attach a calculation note to an existing object.",
    ],
    notes: [
      "True PF alone does not determine a harmonic spectrum. A capacitor arithmetic result is not a verified capacitor-bank or resonance design.",
    ],
  },
  {
    id: "toolbox",
    title: "Engineering Toolbox",
    summary:
      "Search the real worksheet registry, calculate from your inputs and review the result before applying it to a project.",
    steps: [
      "Open [[Engineering Toolbox]] and type a title, topic or ID such as T01 into [[Search tools]]. Click the worksheet name to open its input form. Cables & Protection, Motors & Supply and Power Quality show related subsets of this same registry.",
      "Enter the requested values in the displayed units. Select a value in every required dropdown. Optional inputs may be left blank only when the selected model permits it. [[Load worked example]] fills labelled example inputs; it does not measure your installation.",
      "Click [[Calculate]]. Inspect Result, formula, status, warnings, assumptions and sources. Changing an input clears the previous result so an old calculation is not shown as current.",
      "Use [[Copy result]] to copy the result JSON and [[Export]] for the worksheet's JSON file. [[Reset]] clears the worksheet. The per-tool instructions in this guide list exact input names and a real calculation of the registry's worked example.",
      "Under [[Apply to project object]], choose the application method and existing target. [[Attach calculation note]] records reviewed evidence; selected supported tools can also update specific project fields. Click [[Preview application]], review the changed fields, then apply. A later project edit can make a proposal stale; preview it again.",
    ],
    notes: [
      "A standalone worksheet calculation does not add equipment or change a project until a reviewed application is confirmed. Tool examples are analytical teaching cases. Check the tool's status and supported model instead of treating any number as installation approval.",
    ],
  },
  {
    id: "renewables",
    title: "Renewables & Storage",
    summary:
      "Model entered generation, battery operation and optional outages over the selected period.",
    steps: [
      "Open [[Renewables & Storage]]. Enter PV/wind assumptions and source references, inverter/grid limits, battery capacity, SOC limits/reserve, power limits, efficiencies and the chosen dispatch strategy.",
      "For chronological generation, enter the actual hourly PV profile from 00:00 to 23:00 and supported wind/profile data. A daily energy or peak-sun-hours estimate alone does not identify when generation occurs.",
      "Choose a representative local date or [[Use actual timestamped calendar range]], then enter offset-qualified start/end timestamps. Enable [[Simulate grid outage]] only for a study that needs it and enter the outage period and available source capabilities.",
      "Click [[Save]] for the entered project assumptions, then [[Run simulation]]. [[Cancel simulation]] stops a running calculation. Read grid import/export, battery stored energy, conversion losses, curtailment and unmet/critical unserved demand.",
      "Inspect the graph/table and energy-balance check. [[Export series]] downloads the completed dispatch; [[Save project]] preserves the committed project inputs for continuation.",
    ],
    controls: [
      [
        "Dispatch objective",
        "Choose the supported self-consumption, reserve or peak-shaving objective. Enter its reserve SOC or grid-import peak target when requested.",
      ],
      [
        "Explicitly permit grid charging in entered windows",
        "Enables intentional grid charging only in the entered windows. Add grid-charge window asks for start, end and target SOC; Remove charging window removes that entry.",
      ],
      [
        "Use evidenced source and explicit outage shedding",
        "Enables backup planning with a selected island-forming source and entered restart delay/evidence.",
      ],
      [
        "Serve only loads marked critical",
        "Limits the supported outage supply plan to loads marked critical; inspect the resulting unmet demand.",
      ],
      [
        "Require entered black-start capability",
        "Requires that entered source evidence before the model supplies the relevant outage start.",
      ],
      [
        "Add a load to the priority order / Move up / Remove",
        "Selects loads for the explicit shedding priority, moves a selected load earlier or removes it from that ordered list.",
      ],
    ],
    notes: [
      "Backup supply depends on the entered source/island/transfer/black-start evidence. This is a simulation with your profiles, not live solar forecasts or hardware control.",
    ],
  },
  {
    id: "ev",
    title: "EV & Flexible Loads",
    summary:
      "Plan charging energy within arrival, departure and electrical limits.",
    steps: [
      "Open [[EV & Flexible Loads]] → [[Add session]]. Enter the vehicle/session name, arrival/departure, connection/phase, charger and vehicle limits, efficiency and either required delivered energy or usable capacity plus SOC change.",
      "Choose [[Charging strategy]]: immediate, lowest-cost available intervals or supplied-generation following. Enter the actual tariff/calendar date and any needed generation values, then save the session.",
      "Run the displayed plan and review [[Delivered energy]], unmet energy, cost and deadline feasibility. A shortfall means the entered limits/time window cannot provide all requested energy.",
      "Click [[Apply changes]] only after reviewing the proposed dated load schedule. Use [[Edit]] or [[Delete]] beside a session to change/remove it, and [[Save project]] to keep committed inputs.",
    ],
    example:
      "A 10 kWh requirement with only one hour at a 7 kW input limit cannot be fulfilled, even before charging losses. Extend the window or revise evidence-backed limits, then recalculate.",
  },
  {
    id: "costs",
    title: "Costs & Carbon",
    summary:
      "Enter prices, charge rules and carbon factors explicitly; the app calculates from those assumptions.",
    steps: [
      "Open [[Costs & Carbon]]. Confirm [[Currency]], then enter import/export prices, standing and demand charges, tax and carbon-factor evidence.",
      "For time-of-use rates, click [[Add tariff band]], name it, enter its price/time window and active weekdays/effective dates, then save the tariff inputs. Choose whether uncovered times use an explicit base rate or require complete bands.",
      "Under [[Demand and billing-period rules]], choose aligned intervals or rolling windows, the demand window/step, billing period and applicable time restrictions. Select the standing-charge day basis and tax basis matching the study assumptions.",
      "Save the form and run a dated simulation to inspect the applicable energy and separate billing lines. A quick daily cost is a planning estimate; it is not a customer invoice. Create the invoice separately in [[Reports & Estimates]] → [[Customer bill]].",
    ],
    notes: [
      "Changing a currency label does not perform foreign-exchange conversion. Carbon results use the factor, geography, period and method you entered; export credits are not invented.",
    ],
  },
  {
    id: "scenarios",
    title: "Scenarios & Optimization",
    summary:
      "Create a separate alternative, compare it with a saved baseline and apply only reviewed differences.",
    steps: [
      "Open [[Scenarios & Optimization]], enter a name and click [[Create scenario]]. The alternative has its own project identity and a frozen baseline. [[Set baseline]] updates the reference deliberately.",
      "Change equipment, schedules or assumptions in the alternative. Choose [[Compare against]] and [[Preview changes]] to inspect differences. Tick selected fields, or use [[Select all]] / [[Clear selection]], then [[Apply selected changes]] after validation.",
      "For [[Sensitivity study]], choose a parameter such as growth allowance, coincidence, import price or a load's energy duty. Enter sweep values, choose the target load when required, then [[Run sensitivity]] and [[Export data]].",
      "For [[Dated engineering comparison]], choose both projects and a common explicit period of at most 31 elapsed days. Add a common outage only when needed, click [[Run dated comparison]], then export the actual CSV/JSON result. [[Cancel]] stops a comparison in progress.",
      "Use [[Open]], [[Compare]] and [[Move to trash]] on scenario entries carefully. Save each project you want to retain; Undo can reverse an applied project change.",
    ],
    notes: [
      "Unavailable evidence stays unavailable. Different currencies are not subtracted. A sensitivity case computes independent inputs; it is not a forecast or automatically applied recommendation.",
    ],
  },
  {
    id: "library",
    title: "Equipment Library",
    summary:
      "Reuse sourced equipment, inspect earlier versions or open labelled analytical reference cases.",
    steps: [
      "Open [[Equipment Library]]. Search by name/category/source, choose an equipment category, or enable [[Favorites only]]. Click a favorite marker to keep frequently used templates easy to find.",
      "Choose an existing load under [[Save an existing load as a template]], then click [[Save selected equipment]], or click [[New equipment template]] and enter the required nameplate/evidence fields.",
      "Click [[Add load]] beside a template to create an independent equipment entry. Review its quantities, operating schedule, phase and source against your actual installation before saving the project.",
      "For a template edit, inspect [[Review equipment replacement]], choose which linked loads should receive the new nameplate/evidence fields, then [[Apply reviewed replacement]]. Existing quantities, schedules, names and circuit assignments are retained. [[Equipment version history]] → [[Show details]] opens prior versions.",
      "Use [[Export equipment]] for a portable library JSON file. [[Import equipment]] opens a preview; [[Apply import]] applies valid records. [[Delete template]] removes the selected template through its confirmation workflow.",
      "The generic starting points and [[Open reference case]] cards are opt-in practice data. Read their expected results and assumptions; they do not claim manufacturer verification or surveyed customer equipment.",
    ],
  },
  {
    id: "reports",
    title: "Reports & Estimates",
    summary:
      "Freeze a reviewed engineering report, then export or print that same revision.",
    steps: [
      "Open [[Reports & Estimates]] → [[Engineering report]]. Enter [[Project reference]], [[Prepared by]], [[Customer / recipient]] and [[Report scope and limitations]], then [[Save report details]].",
      "Under [[Choose report sections]], tick the sections you need. Complete relevant simulation, dispatch or charging runs first if their results belong in the report; missing evidence is shown as unavailable.",
      "Click [[Freeze report preview]]. Read the generated preview and its project revision before sharing it. Later project changes do not silently rewrite that frozen review; freeze a new preview after rerunning affected analysis.",
      "Click [[Generate selected PDF]] for the report file, [[Print reviewed report]] for the browser's print dialog, or [[Export frozen report data]] for JSON of the reviewed snapshot. In the print dialog choose a printer or Save as PDF, check pages/orientation, then confirm.",
      "Use [[Export circuit CSV]], [[Export scenario comparison]] or choose [[Time-series export]] and [[Export selected series]] for specific data. Select a completed representative profile, calendar simulation, energy dispatch or charging plan as applicable.",
    ],
    controls: [
      [
        "Calculation summary",
        "Includes installed/demand power, energy estimates, PF and phase-current summaries from the reviewed revision.",
      ],
      [
        "Load schedule",
        "Lists entered equipment quantities, calculated power/current/energy and source kinds.",
      ],
      [
        "Board and phase summary",
        "Includes the board hierarchy, entered ratings, ways and phase-related values.",
      ],
      [
        "Circuit schedule",
        "Lists actual circuit, parent board, phase, protection rating and entered cable length.",
      ],
      [
        "Cable, protection and feeder checks",
        "Shows individual evidence-backed checks plus source-to-load route assessments; incomplete inputs stay visible.",
      ],
      [
        "Motor starts and supply capacity",
        "Includes entered start events and source-capacity evidence/assessments.",
      ],
      [
        "Energy, tariffs and carbon",
        "Reports energy and the entered cost/carbon assumptions used for the available evidence.",
      ],
      [
        "Renewables and storage evidence",
        "Includes entered renewable/battery assumptions and available completed dispatch evidence.",
      ],
      [
        "Charging requirements and feasibility",
        "Reports entered EV requirements and completed feasible/unmet charging results.",
      ],
      [
        "Scenario comparison",
        "Includes the selected saved scenario metrics and their revision context.",
      ],
      [
        "Model-derived bill of materials",
        "Lists model quantities and evidence; it does not invent missing prices or measured lengths.",
      ],
      [
        "Vector single-line diagram",
        "Includes the data-bound diagram of the reviewed project.",
      ],
      [
        "Measurement provenance",
        "Describes validated saved measurement evidence, coverage and origin.",
      ],
      [
        "Time-series evidence",
        "Includes the available completed profile/calendar/dispatch/charging evidence selected for the report.",
      ],
      [
        "Issues and incomplete checks",
        "Keeps unresolved errors, warnings and model boundaries visible to the reader.",
      ],
      [
        "Methods, assumptions and sources",
        "Includes the calculation method, entered assumptions and supporting source references.",
      ],
    ],
    notes: [
      "Engineering PDFs, CSVs, SVGs and frozen report JSON are output documents. Use Export project or Workspace backup for editable project recovery. A downloaded report is not a substitute for a saved engineering project.",
    ],
  },
  {
    id: "bill",
    title: "Create and print a customer bill",
    summary:
      "Prepare an estimate or invoice using your real supplier/customer details, quantities and prices.",
    steps: [
      "Click [[Reports & Estimates]] → [[Customer bill]]. Under Document details choose Customer estimate or Invoice. Enter Document number and Issue date; enter Due / valid until when required. Choose the currency and optional Customer reference.",
      "Under Supplier & customer, enter your actual business name/address/contact details in Supplier and the customer's details in Customer. Enter Tax / registration reference if applicable. Do not leave practice names on a document you intend to issue.",
      "Under Materials & labour, click Add line. Type a clear Description, choose Material/Labour/Other, enter Qty and Unit price. Repeat for each item; Remove line deletes that row. Quantities allow three decimal places; prices follow the selected currency's precision.",
      "Enter Discount (%) and Tax (%) only as applicable to this document. Add Notes and Payment details, such as payment terms and the correct payment reference. Review every line amount and the document preview.",
      "Check Subtotal, Discount, Net amount, Tax and Total. Line amounts are rounded to currency precision; discount is applied to subtotal; tax is applied to the discounted net amount. Fix the messages under Complete these details to export until the document is ready.",
      "Click Save draft locally and wait for Draft saved locally. Click Download PDF for the generated customer file, Print / Save PDF for the browser print dialog, or Export CSV for the priced schedule. Printing or downloading does not send the bill to anyone.",
      "Click Export draft JSON to keep an editable copy. Later, reopen this saved project and Customer bill, use Reload saved draft, or choose Import draft JSON and confirm the reviewed replacement. An invalid import leaves your current bill intact.",
    ],
    controls: [
      [
        "New empty document",
        "Starts a blank bill after confirmation. The previous saved draft remains until another successful save; export it first if you need both documents.",
      ],
      [
        "Reload saved draft",
        "Replaces the displayed draft with the saved version after confirmation. Cancel keeps unsaved edits.",
      ],
      [
        "Save draft locally",
        "Stores this project's bill in this browser. Incomplete drafts can be kept, but required valid fields are needed for customer export.",
      ],
      [
        "Download PDF / Print / Save PDF",
        "Produces or prints the displayed validated bill. Choose your own printer or PDF destination; the app does not email it.",
      ],
      [
        "Export CSV / Export draft JSON / Import draft JSON",
        "Exports priced rows, exports an editable bill, or restores a supported bill file. These are separate from engineering project JSON.",
      ],
    ],
    example:
      "Practice example: two items at €20 each plus one labour line at €10 gives €50 subtotal. A 10% discount removes €5, leaving €45 net. An entered 19% tax is €8.55, giving €53.55 total. This example teaches the calculation; it does not determine which tax rate applies to your bill.",
    notes: [
      "Local bills are linked to the project identity. The app does not supply legal/tax approval, company data or signatures. Measured/entered cable lengths are required; diagram strokes do not create billable length.",
    ],
  },
  {
    id: "bom",
    title: "Build an estimate from model quantities",
    summary:
      "Turn actual project quantities into a reviewed customer estimate without inventing prices or measured lengths.",
    steps: [
      "Open [[Reports & Estimates]] → [[Engineering report]] → [[Model-derived bill of materials]]. Review each Item / source and Model quantity. [[Previous]] / [[Next]] moves through the list.",
      "Enter Unit price for quantities you can price, and enter applicable Waste (%), Labour quantity, Labour unit price and Contingency (%). Unknown prices remain blank; use actual measured cable data for length-based lines.",
      "Click [[Preview priced estimate]]. Review the resulting descriptions, quantities, rates and totals. Click [[Apply reviewed quantities to bill]] to update the customer bill, or [[Cancel]] to keep it unchanged. Existing manual bill lines are preserved.",
      "Open [[Customer bill]] to enter the real parties, document details and tax, review the total and save/export the bill. [[Export model quantities]] gives an independent copy of the model-derived schedule.",
    ],
  },
  {
    id: "history",
    title: "History & Issues",
    summary:
      "Find missing inputs and inspect or restore saved project revisions.",
    steps: [
      "Open [[History & Issues]] or click the footer's issue count. Read the actual message and affected object, then open the corresponding workspace to supply or correct its inputs.",
      "For recovery, select a saved revision in [[Compare revisions]]. Read Before/After, tick the fields to restore, and click [[Restore selected fields]]. Include dependent boards/circuits when restoring an object that needs them.",
      "Use the whole-revision restore control when you intend to restore all the chosen saved inputs. Validate the result, use Undo if the applied change was unintended, and [[Save project]] to keep the restored state.",
      "Click [[Export comparison]] for an audit copy of revision differences. Keep a separate workspace backup; browser history alone cannot recover a lost device.",
    ],
    notes: [
      "A Calculated status means the supported arithmetic ran. Incomplete means required inputs/evidence are missing. Unsupported means the selected case is outside the implemented model. A passing number is not certification.",
    ],
  },
  {
    id: "settings",
    title: "Settings",
    summary:
      "Maintain project defaults and adjust the display without changing the meaning of your data.",
    steps: [
      "Open [[Settings]]. In [[Project settings]], enter the actual supply voltages, connection, frequency, timezone, currency, jurisdiction and design assumptions, then save that form and [[Save project]]. Changing defaults is a project edit, so review affected calculations.",
      "Under the display settings, select [[Language]], [[Detail level]], [[Theme]] and [[Motion]]. Dark, Light or System controls appearance; Simple/Engineering changes the detail shown, while checks remain visible.",
      "Choose Reduced to limit decorative motion or Paused to stop ongoing animation/timeline playback. You can still read tables and calculate results.",
      "Adjust [[Navigation width]] / [[Inspector width]] sliders or the desktop split handles. Keyboard arrows and Home/End work on the handles. [[Reset layout]] restores the default widths, expanded groups and engineering detail view.",
      "Use the project Export/Import/Trash controls or [[Workspace backup & restore]] for recovery. [[Open / restore Adigun BOT]] resets its window layout and opens the local helper.",
    ],
  },
  {
    id: "backup",
    title: "Workspace backup & restore",
    summary:
      "Keep a portable archive of saved engineering projects and their related saved records.",
    steps: [
      "Save the project, bill and measured data you want in the backup. Open [[Settings]] → [[Workspace backup & restore]]. Choose [[Backup scope]]: all local projects or the current project and linked baselines.",
      "Choose whether to [[Include saved revision history]], then click [[Export workspace backup]]. Keep the downloaded JSON somewhere outside this browser profile. It contains supported saved projects, histories, bills, measurements and embedded library/diagram/scenario records.",
      "On the destination browser, click [[Inspect workspace backup]] and select the archive. Read the validation results and the preview's project, revision, bill and measured-data counts. An invalid archive is not applied.",
      "Choose [[Restore as independent copies]] when you want to preserve existing work with new identities, or [[Preserve project IDs when absent]] to keep an absent identity without overwriting an existing/trash entry. If the archive contains a working draft, enable its explicit restore option only if you want it promoted.",
      "Click [[Restore reviewed backup]] and wait for success, then use [[Resume project]] to open the restored project. [[Cancel]] closes the preview without changing saved records.",
    ],
    notes: [
      "A backup is a file you must keep. The platform does not synchronize it to another device automatically. Native project JSON, bill JSON and measurement JSON remain useful individual exports.",
    ],
  },
  {
    id: "bot",
    title: "Adigun BOT",
    summary:
      "The local helper explains real project inputs and prepares changes for your review.",
    steps: [
      "Click the Adigun BOT launcher, or [[Settings]] → [[Open / restore Adigun BOT]]. Use [[Overview]], [[Explain my results]], [[Check missing inputs]] or [[Balance phases]] for a focused question about the current project.",
      "Enter a supported question/command in [[Ask about your project]], then click [[Send]]. [[Cancel]] stops the pending local request. Read the answer's project revision and limitations.",
      "For a structured load request, enter the example syntax below. The BOT prepares a proposal; review its input and demand changes, then explicitly apply it. A project edit invalidates an older proposal, so ask/preview again.",
      "Use [[Minimize]], [[Maximize]], [[Restore]] and [[Close]] to manage the window. [[Clear history]] clears the current local conversation through its confirmation. [[Save project]] keeps the current conversation and typed message as part of the local project checkpoint; [[Resume project]] restores that saved session.",
    ],
    example: "load: Workshop heater; 2.3 kW; 230 V; PF 1; 8 h",
    notes: [
      "The helper is deterministic local engineering support. There is no configured connected generative AI, OCR, account sync or hardware telemetry. A local project checkpoint keeps supported BOT context, while a native engineering JSON export contains engineering data; do not assume every export format contains the chat.",
    ],
  },
  {
    id: "reference",
    title: "Engineering Reference",
    summary:
      "Check formulas, supported assumptions and primary-source links when interpreting a calculation.",
    steps: [
      "Open [[Engineering Reference]]. Find the equation for the connection/model in use, then read the listed assumptions and source links.",
      "Use [[Calculate]] or an object's [[Calculation trace]] / [[Explain result]] to compare those general equations with the actual project revision, inputs and evidence.",
      "Follow the linked calculation-method documentation for model boundaries and tool sources. External references open separately so the active project stays available.",
    ],
    controls: [
      [
        "Ctrl/Cmd+K",
        "Opens the command/search palette outside another dialog.",
      ],
      [
        "Ctrl/Cmd+S",
        "Requests an explicit project save; check the save status afterward.",
      ],
      [
        "Ctrl/Cmd+Z / Ctrl/Cmd+Shift+Z",
        "Undo/Redo project edits outside text inputs. Inside text fields, the normal text-editing shortcuts apply.",
      ],
      [
        "Escape",
        "Closes the active supported dialog or overlay; closing Help returns focus to its opener.",
      ],
      [
        "F1",
        "Opens Help & Support without replacing an active editor. Escape returns to the current form.",
      ],
      [
        "Tab / Shift+Tab",
        "Moves forward/backward between controls. In a dialog, focus stays inside until it closes.",
      ],
    ],
  },
  {
    id: "troubleshooting",
    title: "Warnings and common problems",
    summary:
      "Read the message beside the affected control. Keep current work open while you resolve a failed save or conflict.",
    steps: [
      "If a save fails, do not reload first. Use [[Export project]] for engineering data, Export draft JSON for a bill, or the available measurement export. Check browser storage permissions/free space, close conflicting tabs where requested, then retry the explicit save and wait for success.",
      "If another tab has a newer revision, export your version or save a recovered copy before reopening the saved project. Do not assume your older tab may silently overwrite newer work.",
      "If a file is rejected, read the preview error and check its format, size, column mapping, units and required fields. Keep the current project; correct the source file and preview again.",
      "If PDF/print/export is disabled, read the required-detail messages. Bills need a project/document name, supplier, customer, valid issue/due dates and at least one valid priced line. Reports need saved metadata and a frozen review; simulations need completed results for their exports.",
      "If a result is Incomplete or Unsupported, open the trace/issue register and add the missing evidence or select a supported model. Do not enter arbitrary values just to remove the warning. If a worker fails, keep the project, review its inputs and rerun.",
      "If [[Update available]] appears, save/export your work first, finish pending forms, close their dialogs and click [[Save and reload]] when ready. Pending edits or a running task may prevent a safe reload. After the update, use [[Resume project]] for the saved checkpoint. Help can be read while leaving the current workspace intact.",
      "If a saved project appears missing after reload, click [[Resume project]] and check [[Trash]]. Confirm you are using the same browser profile, device and site address. Restore a downloaded workspace backup when moving to a different browser/device.",
    ],
    controls: [
      [
        "Unsaved changes",
        "Save the desired work before leaving. Cancel the leave warning to continue editing.",
      ],
      [
        "Saving / Save failed",
        "Wait for completion or preserve a portable copy and resolve the displayed storage error. No success is promised before the write completes.",
      ],
      [
        "Blocked storage upgrade",
        "Close other tabs/windows using this app as requested, then retry. Export any editable work before refreshing.",
      ],
      [
        "Project changed / stale preview",
        "Reopen or regenerate the preview against the current revision, review it again and apply deliberately.",
      ],
      [
        "No printer / popup or download blocked",
        "Check the browser's printer, download and popup settings. Download PDF is an alternative to the print dialog.",
      ],
      [
        "Unexpected numeric result",
        "Check W versus kW, A versus kVA, line versus phase voltage, PF, efficiency, quantities, hours, duty and timezone before comparing results.",
      ],
    ],
  },
  {
    id: "support",
    title: "Get support",
    summary:
      "Use this guide first, then describe the exact reproducible problem if you need to report it.",
    steps: [
      "Search this guide for the visible menu, button, error message or tool ID. Read the matching task and try the listed correction while keeping the current work open.",
      "If the problem remains, note the page, button, exact error, browser/device, engine version from the footer, and the steps needed to reproduce it. State the expected result and what actually happened.",
      "Use [[Report an issue]] below to open the repository's issue page in a new tab. Check the information before submitting it yourself. Remove customer details, prices and private project contents from screenshots or example files you share publicly.",
      "Use [[Complete user guide]] for the repository copy of these instructions. You can return to the app without closing the active project or the help overlay.",
    ],
    notes: [
      "There is no live support chat or configured email sender in the platform. Opening an issue link does not send a message or upload project data.",
    ],
  },
];
