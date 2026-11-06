import { translate } from "../i18n";
import type { Locale } from "../i18n";
import { tools } from "../tools";

export interface HelpTopic {
  id: string;
  kind: "workflow" | "tool";
  title: string;
  summary: string;
  steps: readonly string[];
  example?: string;
  route?: string;
  toolId?: string;
  category: string;
  keywords: readonly string[];
}

const workflows: Omit<HelpTopic, "kind" | "category">[] = [
  {
    id: "getting-started",
    title: "Start a project and find your way",
    summary:
      "Create your own installation, then use Overview to see what your entered equipment needs.",
    steps: [
      "Open Project in the toolbar. New starts a named project; Open returns to saved projects. Rename and Duplicate help organize separate studies.",
      "Open Settings and enter the supply, voltage, timezone and currency. Choose Add load to enter equipment from its nameplate or measurement.",
      "Use the left navigation to change workspaces. Collapse groups or open the navigation button on a small screen. Select a load to inspect it; Calculation trace explains its result.",
    ],
    example:
      "For a small workshop, enter the lights and heater first. Check installed power, design demand and daily energy in Overview before adding more equipment.",
    route: "overview",
    keywords: [
      "navigation",
      "menu",
      "header",
      "dashboard",
      "new",
      "open",
      "rename",
      "duplicate",
      "inspector",
      "trace",
    ],
  },
  {
    id: "save-and-recover",
    title: "Save, reopen and recover work",
    summary:
      "Saved projects belong to this browser. Download a backup to keep a portable copy.",
    steps: [
      "Engineering changes autosave. Use Project → Save or Ctrl/Cmd+S and wait for Saved locally. Open project resumes a saved project. Close saves it and opens a blank workspace; a failed save keeps the current work.",
      "Export project saves engineering JSON; Export loads saves CSV. Import previews and validates a file before New project, Merge or Replace. A failed validation leaves the current project intact.",
      "Settings → Workspace backup includes saved projects, revisions, bills, measurements and library records. Save each draft first. Validate the archive and review its restore mode before restoring.",
      "Use History & Issues to compare or restore revisions, and Undo/Redo for project edits. Move to trash and Restore are in the project switcher. A downloaded backup is needed on another device.",
    ],
    example:
      "Before clearing browser data or changing device, export a Workspace backup and keep the downloaded file. Local history cannot recover storage that the browser has removed.",
    route: "history",
    keywords: [
      "Save",
      "Saved locally",
      "Unsaved changes",
      "resume",
      "recovery",
      "backup",
      "restore",
      "trash",
      "import",
      "export",
      "history",
      "undo",
      "redo",
      "close",
      "JSON",
      "CSV",
    ],
  },
  {
    id: "load-schedule",
    title: "Load Schedule",
    summary:
      "A load is an appliance or piece of equipment that uses electricity.",
    steps: [
      "Choose Add load. Enter a name, quantity, rating, connection, voltage basis and power factor. Use shaft output only for a motor's mechanical rating, with its efficiency.",
      "Enter operating hours, start time, utilization and energy duty. Record the source of each rating, then save. Duty changes average energy; it does not reduce on-state current.",
      "Select rows to review Bulk operations. Filter by category, phase, board, source or issue. Right-click a load, or press Shift+F10 on its name, for Inspect, Edit, Duplicate or Delete.",
    ],
    example:
      "For a heater marked 2 kW electrical input, use electrical kW and its actual schedule. Do not enter the same rating as motor shaft output.",
    route: "loads",
    keywords: [
      "appliance",
      "equipment",
      "add",
      "edit",
      "duplicate",
      "delete",
      "bulk",
      "clipboard",
      "nameplate",
      "power factor",
    ],
  },
  {
    id: "boards-and-circuits",
    title: "Boards & Circuits",
    summary: "Group loads into their actual distribution boards and circuits.",
    steps: [
      "Create a board, add its circuits and assign the appropriate loads. Use site, building and zone groups to organize the project without inventing electrical connections.",
      "Review phase loading and phase-balancing proposals before applying them. A circuit phase change moves its associated single-phase loads; locked loads stay protected.",
      "Check issues after editing assignments. Supply topology, load connections and dependent objects must remain compatible.",
    ],
    example:
      "Put workshop lighting on its actual lighting circuit and assign that circuit to the workshop board. A zone name alone does not connect the circuit.",
    route: "boards",
    keywords: [
      "distribution",
      "phase",
      "balance",
      "lock",
      "site",
      "building",
      "zone",
      "group",
      "assignment",
    ],
  },
  {
    id: "single-line-studio",
    title: "Single-Line Studio",
    summary: "Inspect the diagram made from your actual project connections.",
    steps: [
      "Select an object to inspect it. Use Connect/Disconnect and the topology controls to change supported connections; check issues after every change.",
      "Use zoom, fit, labels, notes, manual positions or auto-layout to make the diagram readable. Export SVG or PDF for a copy of the displayed diagram.",
      "Open Analytical spatial view for orbit, elevation, zoom, board isolation and the hourly cursor. Pause flow animation when needed. Chart tables provide the underlying values.",
    ],
    example:
      "Use Fit after adding a board, then export the diagram. Its line lengths and spatial coordinates do not measure installed cable lengths.",
    route: "diagram",
    keywords: [
      "diagram",
      "connect",
      "disconnect",
      "zoom",
      "fit",
      "SVG",
      "PDF",
      "spatial",
      "3D",
      "orbit",
      "animation",
    ],
  },
  {
    id: "simulation-and-measurements",
    title: "Schedules & Simulation",
    summary:
      "Calculate an actual date range or import measured power intervals.",
    steps: [
      "Choose the date range and check the project timezone before running. Cancel stops a new run; a previous completed run retains its own dates. Use Play/Pause, step and speed controls to inspect it.",
      "Advanced planning supports operating windows, weekdays, seasons, holidays, timed cycles and start events. Review a proposed flexible schedule before applying it.",
      "Measured intervals imports CSV: map timestamp and power columns, choose W or kW and enter interval minutes. Timestamps need Z or a UTC offset. Preview, then Save measured data; Reopen saved measurements restores it.",
    ],
    example:
      "For readings every 15 minutes, enter 15 as the interval. Missing rows remain gaps; the app does not invent measurements. Export the cleaned CSV or completed simulation series.",
    route: "simulation",
    keywords: [
      "calendar",
      "date",
      "timezone",
      "DST",
      "schedule",
      "worker",
      "cancel",
      "measurement",
      "measured",
      "CSV",
      "profile",
      "timeline",
    ],
  },
  {
    id: "cables-and-protection",
    title: "Cables & Protection",
    summary:
      "Assess a feeder or use a cable/protection worksheet with your actual evidence.",
    steps: [
      "Open Feeder assessment and select the actual source-to-load route. Enter conductor impedance, ampacity and the conditions supporting those values.",
      "Review voltage drop, losses and capacity separately, including running and starting assumptions. Missing evidence produces an incomplete check.",
      "Use the cable and protection worksheets for a specific calculation. Read the method and source conditions; a computed value is not installation certification.",
    ],
    example:
      "If you have no verified ampacity for a cable's installation method, obtain that evidence before accepting a capacity check.",
    route: "cables",
    keywords: [
      "feeder",
      "cable",
      "voltage drop",
      "ampacity",
      "fault",
      "protection",
      "earthing",
      "breaker",
      "loss",
    ],
  },
  {
    id: "motors-and-supply",
    title: "Motors & Supply",
    summary:
      "Keep motor input, starting demand and supply capability separate.",
    steps: [
      "Choose the motor, transformer, generator, inverter or UPS worksheet that matches your question. Enter the stated units and the rating basis.",
      "Use Source register to record actual source ratings, derating, evidence, served boundary and any verified overload envelope.",
      "Review continuous kW, kVA, phase current and starting capacity independently. Island, transfer and black-start entries describe evidence; they do not switch equipment.",
    ],
    example:
      "A generator that meets running kW may still lack starting kVA. Check both with the actual motor and generator data.",
    route: "motors",
    keywords: [
      "motor",
      "transformer",
      "generator",
      "inverter",
      "UPS",
      "source",
      "starting",
      "derating",
      "black start",
    ],
  },
  {
    id: "power-quality",
    title: "Power Quality",
    summary:
      "Study power factor, capacitor sizing and supplied harmonic data within each stated model.",
    steps: [
      "Select a worksheet and read its description. Enter the actual P, Q, power-factor or harmonic values it requires, including leading/lagging direction where requested.",
      "Calculate, then review assumptions and warnings. Do not infer a harmonic spectrum from one power-factor value or assume a simple sinusoidal model fits distorted waveforms.",
    ],
    example:
      "Use measured harmonic components when assessing harmonics. A capacitor-sizing result alone does not establish suitable switching or resonance protection.",
    route: "quality",
    keywords: [
      "power factor",
      "capacitor",
      "harmonic",
      "THD",
      "reactive",
      "leading",
      "lagging",
    ],
  },
  {
    id: "using-the-toolbox",
    title: "Engineering Toolbox",
    summary:
      "Find a worksheet by name, category or tool ID. Every tool guide below uses the live catalogue.",
    steps: [
      "Open a tool, read its description and enter your values in the displayed units. Load worked example fills labelled training values; it does not describe your installation.",
      "Choose Calculate, then inspect the result, formula, assumptions, sources and warnings. Reset clears that worksheet's inputs and result.",
      "Copy or export the calculated result when available. A supported Apply action previews project changes for review; a calculation alone does not change your project.",
    ],
    example:
      "Open T01, load its worked example of 230 V and 23 Ω, then Calculate. Replace the example with your actual resistor data before using it for your own study.",
    route: "tools",
    keywords: [
      "calculator",
      "worksheet",
      "example",
      "copy",
      "reset",
      "apply",
      "tool",
      "formula",
    ],
  },
  {
    id: "renewables-and-storage",
    title: "Renewables & Storage",
    summary:
      "Model generation and battery dispatch using a real chronological profile and explicit limits.",
    steps: [
      "Enter PV or wind generation profiles, grid/inverter limits, battery capacity, reserve and the chosen dispatch strategy.",
      "Run the study and inspect import, export, curtailment, losses and unmet demand. For an outage, enter its actual time range and check source, transfer and islanding evidence.",
    ],
    example:
      "Peak-sun-hours can support a daily estimate but cannot replace an hourly PV profile for battery dispatch. Grid-tied-only PV does not automatically supply an islanded load.",
    route: "renewables",
    keywords: [
      "PV",
      "solar",
      "wind",
      "battery",
      "storage",
      "dispatch",
      "outage",
      "import",
      "export",
      "curtailment",
    ],
  },
  {
    id: "ev-and-flexible-loads",
    title: "EV & Flexible Loads",
    summary:
      "Check whether charging or flexible work can finish within its allowed window.",
    steps: [
      "Enter charging arrival and departure, required energy or SOC, charger/vehicle limits and one/three-phase constraints.",
      "Run the planner and inspect delivered energy, unmet energy and deadline feasibility. Review any generation-following or price priority, then preview before applying dated load schedules.",
    ],
    example:
      "A short charging window can remain infeasible even when the charger rating is high. Check the vehicle limit and actual energy delivered before changing the plan.",
    route: "ev",
    keywords: [
      "EV",
      "vehicle",
      "charger",
      "charging",
      "SOC",
      "deadline",
      "flexible",
      "session",
      "unmet",
    ],
  },
  {
    id: "scenarios-and-optimization",
    title: "Scenarios & Optimization",
    summary: "Compare changes against a frozen baseline before applying them.",
    steps: [
      "Create a scenario from the project. Change its inputs, then compare field-level differences and metrics with its saved baseline.",
      "For a dated engineering comparison, run both input sets over the same explicit period, up to 31 elapsed days. You can add a common outage and export CSV or JSON.",
      "Review selected differences before applying them. Undo restores the prior project. Missing evidence remains unavailable, and different currencies are not subtracted.",
    ],
    example:
      "Compare existing lighting with a proposed lower-power design while keeping the operating period the same. Explain any changed hours or tariffs in the assumptions.",
    route: "scenarios",
    keywords: [
      "scenario",
      "baseline",
      "compare",
      "optimization",
      "sensitivity",
      "difference",
      "dated",
    ],
  },
  {
    id: "costs-and-carbon",
    title: "Costs & Carbon",
    summary:
      "Estimate energy cost and emissions using the prices and factors you enter.",
    steps: [
      "Enter currency, import/export prices, tariff bands, charges, taxes and emissions factors with their source and conditions.",
      "Inspect the cost breakdown and the period being calculated. Daily and 30-day estimates differ from a simulation of actual calendar dates.",
    ],
    example:
      "Use your actual tariff's day and night bands instead of one flat rate when the price changes with time. An estimate is not a supplier invoice.",
    route: "costs",
    keywords: [
      "cost",
      "tariff",
      "price",
      "tax",
      "carbon",
      "CO2",
      "emissions",
      "currency",
      "energy bill",
    ],
  },
  {
    id: "equipment-library",
    title: "Equipment Library",
    summary:
      "Reuse sourced equipment records while keeping project copies independent.",
    steps: [
      "Search or filter the library, mark favorites, create a sourced record or save an existing load as a template. Check generic starting assumptions before use.",
      "Adding a template creates an independent load. When updating a template, review which linked loads receive new nameplate fields and evidence; schedules, names and assignments remain as entered.",
      "Worked reference projects are labelled learning examples. Equipment JSON and Workspace backup preserve saved version history.",
    ],
    example:
      "Keep the manufacturer's datasheet reference with a motor template. An attractive library card does not make an assumed rating a verified manufacturer specification.",
    route: "library",
    keywords: [
      "equipment",
      "template",
      "favorite",
      "source",
      "library",
      "reference project",
      "version",
      "datasheet",
    ],
  },
  {
    id: "engineering-reports",
    title: "Reports & Estimates",
    summary:
      "Review an immutable report preview before sharing engineering results.",
    steps: [
      "Enter report metadata, save it and choose the report sections. Complete any calendar, renewable or EV analyses needed for those sections.",
      "Choose Freeze report preview. Review the project revision, input evidence, assumptions and unresolved issues, then export PDF, print, snapshot JSON or report CSV.",
      "The model-derived BOM leaves unknown prices blank. Enter prices, labour, waste and contingency, review proposed bill changes and apply them explicitly; manual bill lines are preserved.",
    ],
    example:
      "If you edit a load after a simulation, rerun that analysis before including it in a new report. An older run is not evidence for changed inputs.",
    route: "reports",
    keywords: [
      "report",
      "PDF",
      "print",
      "snapshot",
      "freeze",
      "metadata",
      "BOM",
      "materials",
      "estimate",
    ],
  },
  {
    id: "customer-bills",
    title: "Print a customer estimate or invoice",
    summary:
      "Prepare a separate priced customer document with your actual business and customer details.",
    steps: [
      "Open Reports & Estimates → Customer bill. Choose Customer estimate or Invoice and enter the document number, dates, supplier, customer and payment details.",
      "Add material, labour or other lines with description, quantity and unit price. Enter discount and tax, then check subtotal, net, tax and total in the preview.",
      "Choose Save draft locally. Download PDF exports the document; Print / Save PDF opens the browser print dialog; Export CSV saves the priced schedule. Invalid fields keep exports disabled with an explanation.",
      "Export draft JSON and Import draft JSON move a bill independently. Save billing drafts before a Workspace backup; engineering JSON alone is not a billing backup.",
    ],
    example:
      "Enter three hours of labour as quantity 3 with your actual hourly price. Check the tax treatment and customer details before printing; the app supplies no invented business identity.",
    route: "reports",
    keywords: [
      "bill",
      "invoice",
      "customer",
      "estimate",
      "print",
      "PDF",
      "billing",
      "tax",
      "discount",
      "labour",
    ],
  },
  {
    id: "settings-and-shortcuts",
    title: "Settings, display and keyboard shortcuts",
    summary:
      "Choose a comfortable view without changing the meaning of your engineering inputs.",
    steps: [
      "Choose English, Deutsch, Yorùbá or Nigerian Pidgin in the header. Settings controls supply defaults, theme, detail mode, motion, layout widths and recovery. Language does not change currency or engineering criteria.",
      "Simple mode explains core quantities; Engineering mode exposes more detail. Failed or incomplete checks remain visible. Paused motion stops decorative effects and playback. Reset layout restores the default widths.",
      "Ctrl/Cmd+K opens search, Ctrl/Cmd+S saves, Ctrl/Cmd+Z undoes and Ctrl/Cmd+Shift+Z redoes outside text fields. Escape closes a dialog. Tab moves between controls; the split handles support arrows, Home and End.",
    ],
    example:
      "For German entry, use decimal commas in numeric fields. Use semicolons between list values; imported canonical CSV numbers use decimal points.",
    route: "settings",
    keywords: [
      "settings",
      "keyboard",
      "shortcut",
      "language",
      "Deutsch",
      "Yoruba",
      "Pidgin",
      "simple",
      "engineering",
      "theme",
      "motion",
      "layout",
      "decimal",
    ],
  },
  {
    id: "local-bot",
    title: "Use Adigun BOT",
    summary:
      "The local assistant explains actual project results and prepares proposals for your review.",
    steps: [
      "Open the Adigun BOT launcher. Ask about results, missing inputs, phase balance or report context. Local mode works without an online model provider.",
      "A structured load command can prepare a proposed load. Inspect its values and demand impact, then explicitly Apply. Editing the project invalidates an older proposal.",
      "Close, minimize, maximize and restore control the assistant window. Chat context stays with each project during the session; it is not part of the engineering backup.",
    ],
    example:
      "Try this supported command: load: Workshop heater; 2.3 kW; 230 V; PF 1; 8 h",
    keywords: [
      "Adigun BOT",
      "assistant",
      "chat",
      "AI",
      "proposal",
      "apply",
      "maximize",
      "minimize",
      "local",
    ],
  },
  {
    id: "results-and-troubleshooting",
    title: "Understand results and solve problems",
    summary:
      "A result is useful only when its inputs, method and limits match your installation.",
    steps: [
      "Calculated means the supported arithmetic ran. Incomplete means inputs or evidence are missing; Unsupported means the selected condition is outside the model. Read the issue and Calculation trace before using the result.",
      "If saving fails, keep the tab open and use Export project to preserve the current engineering work before reloading. If another tab saved a newer revision, preserve your work as an export or copy, then reopen the saved project.",
      "If an import fails, fix the fields listed in its preview. If a calculation fails, check units, required values and model assumptions. Engineering Reference links the supported formulas and sources.",
      "App updates wait while edits or calculations are active. Finish or cancel them before reloading. Help works offline after the app has been cached; external source and GitHub links need an internet connection.",
    ],
    example:
      "For a reproducible problem, note the workspace, tool ID, steps and exact message. Share a minimal example only after removing customer details and other private data.",
    route: "reference",
    keywords: [
      "error",
      "issue",
      "troubleshooting",
      "Save failed",
      "storage",
      "quota",
      "conflict",
      "unsupported",
      "incomplete",
      "support",
      "offline",
      "update",
      "reference",
    ],
  },
];

export const toolGuideSteps = [
  "Read the purpose, input units and conditions below. Open the tool and enter your own supported values.",
  "To learn the controls, choose Load worked example, then Calculate. These catalogue examples are training data, not your project inputs.",
  "Review the formula, assumptions, warnings and sources before copying or exporting a result. Reset clears the worksheet; applying to a project requires a separate review where supported.",
] as const;

export const helpTopics: HelpTopic[] = [
  ...workflows.map((topic) => ({
    ...topic,
    kind: "workflow" as const,
    category: "Workflow guides",
  })),
  ...tools.map((tool) => ({
    id: `tool-${tool.id}`,
    kind: "tool" as const,
    title: tool.title,
    summary: tool.description,
    steps: toolGuideSteps,
    route: "tools",
    toolId: tool.id,
    category: tool.category,
    keywords: [
      tool.id,
      ...tool.inputs.flatMap((input) => [
        input.label,
        input.unit ?? "",
        input.hint ?? "",
        ...(input.options?.map((option) => option.label) ?? []),
      ]),
    ],
  })),
];

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[’'`]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

const indexes = new Map<
  Locale,
  { topic: HelpTopic; title: string; text: string; aliases: string[] }[]
>();

/** Search the actual guide/catalogue in both the selected language and English. */
export function searchHelp(
  query: string,
  locale: Locale,
  limit = 6,
): HelpTopic[] {
  let index = indexes.get(locale);
  if (!index) {
    index = helpTopics.map((topic) => {
      const strings = [
        topic.title,
        topic.summary,
        topic.category,
        ...topic.steps,
        topic.example ?? "",
        ...topic.keywords,
      ];
      return {
        topic,
        title: normalize(
          `${topic.title} ${translate(topic.title, locale)} ${topic.toolId ?? ""}`,
        ),
        text: normalize(
          strings.flatMap((text) => [text, translate(text, locale)]).join(" "),
        ),
        aliases: [topic.title, topic.toolId ?? "", ...topic.keywords]
          .flatMap((text) => [
            normalize(text),
            normalize(translate(text, locale)),
          ])
          .filter(Boolean),
      };
    });
    indexes.set(locale, index);
  }
  const phrase = normalize(query);
  const terms = phrase.split(" ").filter(Boolean);
  const count = Number.isFinite(limit)
    ? Math.max(0, Math.floor(limit))
    : helpTopics.length;
  const score = (entry: (typeof index)[number]) =>
    (phrase && entry.aliases.includes(phrase) ? 100 : 0) +
    terms.filter((term) => entry.title.includes(term)).length;
  return index
    .filter((entry) => terms.every((term) => entry.text.includes(term)))
    .sort((a, b) => score(b) - score(a))
    .slice(0, count)
    .map((entry) => entry.topic);
}
