import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  lazy,
  Suspense,
} from "react";
import {
  Activity,
  Zap,
  LayoutDashboard,
  Table2,
  Network,
  GitBranch,
  Clock3,
  Cable,
  Cog,
  Waves,
  Calculator,
  Sun,
  CarFront,
  GitCompareArrows,
  CircleDollarSign,
  Library,
  FileText,
  BookOpen,
  History,
  Settings2,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Download,
  Upload,
  Search,
  Undo2,
  Redo2,
  Save,
  X,
  ArrowUpRight,
  ChevronRight,
  Copy,
  Bot,
  ExternalLink,
  AlertTriangle,
  Check,
  Info,
  HelpCircle,
  LoaderCircle,
  ChevronDown,
  ArrowRight,
  Trash2,
  RefreshCw,
  FolderOpen,
  SlidersHorizontal,
} from "lucide-react";
import type { Project, Load } from "./domain/types";
import {
  createProject,
  createLoad,
  duplicateProject,
  validateProjectImport,
} from "./domain/project";
import { calculateProject } from "./engine/electrical";
import {
  REFERENCE_CASES,
  createReferenceProject,
} from "./data/reference-projects";
import {
  listProjects,
  saveProject,
  setTrashed,
  projectHistory,
  readPreference,
  writePreference,
} from "./storage/projects";
import type { ProjectRecord } from "./storage/projects";
import {
  downloadFile,
  exportProject,
  exportLoads,
  previewImport,
  parseCSV,
  safeName,
} from "./import-export/files";
import type { ImportPreview, CSVImportMapping } from "./import-export/files";
import {
  mergeProjectObjects,
  replaceProjectContents,
} from "./import-export/projectDestination";
import {
  LanguageContext,
  languages,
  translate,
  numberFormat,
  money,
} from "./i18n";
import type { Locale } from "./i18n";
import { LocaleNumberInput } from "./i18n/LocaleNumberInput";
import { CommandReview } from "./features/CommandReview";
import type {
  CommandPreview,
  ProjectCommand,
} from "./commands/projectCommands";
import { Modal, Field, Notice, ResizeHandle } from "./features/ui";
import { LoadEditor } from "./features/LoadEditor";
import {
  DetailModeControl,
  LoadCalculationDetails,
  type DetailMode,
} from "./features/DetailViews";
import { UpdateBanner } from "./features/UpdateBanner";
import { useUpdateGuard } from "./pwa/useUpdateGuard";
import {
  Overview,
  Loads,
  Boards,
  Diagram,
  Simulation,
} from "./features/WorkspacePages";
import {
  Renewables,
  EVPlanner,
  Costs,
  Scenarios,
} from "./features/EnergyPages";
import { Toolbox } from "./features/Toolbox";
import { EquipmentLibrary } from "./features/EquipmentLibrary";
import {
  ScenarioWorkspace,
  RevisionComparison,
} from "./features/ProjectComparison";
import { WorkspaceRecovery } from "./features/WorkspaceRecovery";
import { LoadOperations } from "./features/LoadOperations";
import { TopologyEditor } from "./features/TopologyEditor";
import { AdvancedPlanning } from "./features/AdvancedPlanning";
import { FeederAssessment } from "./features/FeederAssessment";
import { SourceRegistry, ProjectOrganization } from "./features/SourceRegistry";

import type { ReportContext } from "./import-export/reportSnapshot";
import type {
  CalendarResult,
  RangeOptions,
  EnergyOptions,
} from "./engine/simulation";
import {
  previewProjectCommand,
  applyProjectCommand,
} from "./commands/projectCommands";
import { tools } from "./tools";
import { resetBotWindowState } from "./bot/windowState";
const ReportWorkspace = lazy(() =>
  import("./features/ReportWorkspace").then((module) => ({
    default: module.ReportWorkspace,
  })),
);
const Billing = lazy(() =>
  import("./features/Billing").then((m) => ({ default: m.Billing })),
);
const SpatialView = lazy(() => import("./features/SpatialView"));
const Measurements = lazy(() => import("./features/Measurements"));
const LocalBot = lazy(() =>
  import("./bot/LocalBot").then((m) => ({ default: m.LocalBot })),
);
const routes = [
  {
    id: "overview",
    label: "Overview",
    icon: LayoutDashboard,
    group: "Workspace",
  },
  { id: "loads", label: "Load Schedule", icon: Table2, group: "Workspace" },
  {
    id: "boards",
    label: "Boards & Circuits",
    icon: Network,
    group: "Workspace",
  },
  {
    id: "diagram",
    label: "Single-Line Studio",
    icon: GitBranch,
    group: "Workspace",
  },
  {
    id: "simulation",
    label: "Schedules & Simulation",
    icon: Clock3,
    group: "Workspace",
  },
  {
    id: "cables",
    label: "Cables & Protection",
    icon: Cable,
    group: "Engineering",
  },
  { id: "motors", label: "Motors & Supply", icon: Cog, group: "Engineering" },
  { id: "quality", label: "Power Quality", icon: Waves, group: "Engineering" },
  {
    id: "tools",
    label: "Engineering Toolbox",
    icon: Calculator,
    group: "Engineering",
  },
  {
    id: "renewables",
    label: "Renewables & Storage",
    icon: Sun,
    group: "Energy & Planning",
  },
  {
    id: "ev",
    label: "EV & Flexible Loads",
    icon: CarFront,
    group: "Energy & Planning",
  },
  {
    id: "scenarios",
    label: "Scenarios & Optimization",
    icon: GitCompareArrows,
    group: "Energy & Planning",
  },
  {
    id: "costs",
    label: "Costs & Carbon",
    icon: CircleDollarSign,
    group: "Energy & Planning",
  },
  {
    id: "library",
    label: "Equipment Library",
    icon: Library,
    group: "Resources",
  },
  {
    id: "reports",
    label: "Reports & Estimates",
    icon: FileText,
    group: "Resources",
  },
  {
    id: "reference",
    label: "Engineering Reference",
    icon: BookOpen,
    group: "Resources",
  },
  {
    id: "history",
    label: "History & Issues",
    icon: History,
    group: "Resources",
  },
  { id: "settings", label: "Settings", icon: Settings2, group: "Resources" },
];
const equipment: [string, string, number, number, number][] = [
  ["LED lighting point", "Lighting", 0.01, 1, 5],
  ["LED panel", "Lighting", 0.04, 0.95, 8],
  ["Resistive heater", "Heating", 2, 1, 4],
  ["Domestic kettle", "Appliances", 2.3, 1, 0.25],
  ["Electric oven", "Appliances", 2.5, 1, 1],
  ["Refrigerator", "Refrigeration", 0.15, 0.85, 24],
  ["Desktop workstation", "IT & servers", 0.15, 0.95, 8],
  ["Network rack", "IT & servers", 0.5, 0.95, 24],
  ["Laptop power supply", "IT & servers", 0.065, 0.95, 8],
  ["Ventilation fan", "HVAC", 0.12, 0.8, 8],
  ["Small water pump", "Pumps", 0.75, 0.8, 4],
  ["Workshop drill", "Workshop", 0.8, 0.8, 1],
  ["Air compressor", "Workshop", 2.2, 0.85, 4],
  ["Washing machine", "Appliances", 2, 1, 1],
  ["Water heater", "Heating", 3, 1, 2],
  ["EV single-phase charger", "EV", 7.4, 1, 4],
  ["General three-phase motor", "Motor", 7.5, 0.85, 4],
  ["User-entered equipment", "General", 0, 1, 0],
];
export default function App() {
  const [locale, setLocale] = useState<Locale>(() =>
    readPreference("locale", "en"),
  );
  const t = (s: string) => translate(s, locale);
  const [project, setProject] = useState<Project>(() =>
    createProject("Untitled project"),
  );
  const [loaded, setLoaded] = useState(false);
  const [records, setRecords] = useState<ProjectRecord[]>([]);
  const [route, setRoute] = useState(() => {
    const r = location.hash.slice(2);
    return routes.some((x) => x.id === r) ? r : "overview";
  });
  const [saveState, setSaveState] = useState("Saving");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [theme, setTheme] = useState(() => readPreference("theme", "dark"));
  const [motion, setMotion] = useState(() =>
    readPreference("motion", "system"),
  );
  const [sidebar, setSidebar] = useState(() =>
    readPreference("sidebar", innerWidth > 900),
  );
  const [sidebarWidth, setSidebarWidth] = useState(() =>
    readPreference("sidebarWidth", 240),
  );
  const [inspectorWidth, setInspectorWidth] = useState(() =>
    readPreference("inspectorWidth", 300),
  );
  const [detailMode, setDetailMode] = useState<DetailMode>(() =>
    readPreference<string>("detailMode", "engineering") === "simple"
      ? "simple"
      : "engineering",
  );
  const [collapsedGroups, setCollapsedGroups] = useState<string[]>(() =>
    readPreference("collapsedGroups", []),
  );
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar",
      sidebarWidth + "px",
    );
    document.documentElement.style.setProperty(
      "--inspector",
      inspectorWidth + "px",
    );
    writePreference("sidebarWidth", sidebarWidth);
    writePreference("inspectorWidth", inspectorWidth);
    writePreference("detailMode", detailMode);
    writePreference("collapsedGroups", collapsedGroups);
  }, [sidebarWidth, inspectorWidth, detailMode, collapsedGroups]);
  const [selected, setSelected] = useState<string>();
  const [showTrace, setShowTrace] = useState(false);
  const [diagramView, setDiagramView] = useState<"single" | "spatial">(
    "single",
  );
  const [editor, setEditor] = useState<{ load?: Load } | null>(null);
  const [dialog, setDialog] = useState<
    "projects" | "import" | "commands" | "references" | "rename" | null
  >(null);
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [commandReview, setCommandReview] = useState<{
    preview: CommandPreview;
    selectedId?: string;
  }>();
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [importBusy, setImportBusy] = useState(false);
  const [csvFile, setCSVFile] = useState<File>();
  const [csvHeaders, setCSVHeaders] = useState<string[]>([]);
  const [csvMapping, setCSVMapping] = useState<CSVImportMapping>({});
  const [mappingDirty, setMappingDirty] = useState(false);
  const [importMode, setImportMode] = useState<"new" | "merge" | "replace">(
    "new",
  );
  const [importTarget, setImportTarget] = useState<{
    id: string;
    revision: number;
  }>();
  const [botOpen, setBotOpen] = useState(false);
  const [reportTab, setReportTab] = useState<"engineering" | "billing">(
    "engineering",
  );
  const [, setReportBusy] = useState(false);
  const [reportContext, setReportContext] = useState<ReportContext>({});
  useEffect(
    () =>
      setReportContext((previous) => {
        const next = { ...previous };
        for (const key of ["calendar", "energy", "ev"] as const)
          if (
            next[key] &&
            (next[key]!.projectId !== project.id ||
              next[key]!.revision !== project.revision)
          )
            delete next[key];
        return next;
      }),
    [project.id, project.revision],
  );
  const rememberCalendar = (
    calculated: CalendarResult,
    inputs: Record<string, unknown> | RangeOptions,
  ) =>
    setReportContext((context) => ({
      ...context,
      calendar: {
        projectId: project.id,
        revision: project.revision,
        calculatedAt: new Date().toISOString(),
        result: calculated,
        inputs: inputs as RangeOptions,
        source: "Completed calendar simulation",
      },
    }));
  const [toolId, setToolId] = useState("");
  const [revisions, setRevisions] = useState<Project[]>([]);
  const undo = useRef<Project[]>([]),
    redo = useRef<Project[]>([]);
  const [historyTick, setHistoryTick] = useState(0);
  const latest = useRef(project);
  latest.current = project;
  const lastSaved = useRef(new Map<string, number>());
  const saveQueue = useRef<Promise<void>>(Promise.resolve());
  const channel = useRef<BroadcastChannel | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const result = useMemo(() => calculateProject(project), [project]);
  const selectedLoad = project.loads.find((l) => l.id === selected);
  const selectedResult = result.loads.find((l) => l.id === selected);
  const selectedBoard = project.boards.find((row) => row.id === selected);
  const selectedCircuit = project.circuits.find((row) => row.id === selected);
  const selectedSource = project.sources?.find((row) => row.id === selected);
  const selectedObject =
    selectedLoad ?? selectedBoard ?? selectedCircuit ?? selectedSource;
  const refreshRecords = useCallback(async () => {
    try {
      setRecords(await listProjects(true));
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);
  useEffect(() => {
    let alive = true;
    listProjects(true)
      .then((all) => {
        if (!alive) return;
        setRecords(all);
        const id = readPreference("currentProject", "");
        const found =
          all.find((r) => r.id === id && !r.deleted) ||
          all.find((r) => !r.deleted);
        if (found) {
          lastSaved.current.set(found.id, found.project.revision);
          setProject(found.project);
          setSaveState("Saved locally");
        }
        setLoaded(true);
      })
      .catch((e) => {
        if (alive) {
          setError((e as Error).message);
          setSaveState("Save failed");
          setLoaded(true);
        }
      });
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    const media = matchMedia("(max-width: 800px)");
    const closeSmall = () => {
      if (media.matches) setSidebar(false);
    };
    media.addEventListener("change", closeSmall);
    return () => media.removeEventListener("change", closeSmall);
  }, []);
  useEffect(() => {
    writePreference("locale", locale);
    document.documentElement.lang = locale;
    writePreference("theme", theme);
    writePreference("motion", motion);
    writePreference("sidebar", sidebar);
    const mq = matchMedia("(prefers-color-scheme: light)");
    const apply = () => {
      document.documentElement.dataset.theme =
        theme === "system" ? (mq.matches ? "light" : "dark") : theme;
    };
    apply();
    mq.addEventListener("change", apply);
    document.documentElement.dataset.motion = motion;
    return () => mq.removeEventListener("change", apply);
  }, [locale, theme, motion, sidebar]);
  function persist(p: Project = latest.current) {
    setSaveState("Saving");
    const work = saveQueue.current
      .catch(() => {})
      .then(async () => {
        await saveProject(p, lastSaved.current.get(p.id));
        lastSaved.current.set(p.id, p.revision);
        if (
          latest.current.id === p.id &&
          latest.current.revision === p.revision
        )
          setSaveState("Saved locally");
        writePreference("currentProject", p.id);
        channel.current?.postMessage({
          id: p.id,
          revision: p.revision,
          updatedAt: p.updatedAt,
        });
        await refreshRecords();
      });
    saveQueue.current = work;
    work.catch((e) => {
      setSaveState("Save failed");
      setError((e as Error).message);
    });
    return work;
  }
  useEffect(() => {
    if (!loaded) return;
    setSaveState("Unsaved changes");
    const id = setTimeout(() => {
      void persist(project);
    }, 450);
    return () => clearTimeout(id);
  }, [project, loaded]);
  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const c = new BroadcastChannel("AdigunPowerLab");
    channel.current = c;
    c.onmessage = (e) => {
      if (
        e.data.id === latest.current.id &&
        e.data.updatedAt !== latest.current.updatedAt &&
        e.data.revision >= latest.current.revision
      ) {
        setError(
          "Another tab has changed this project. Export your work, save a copy, or reopen the saved project.",
        );
        setSaveState("Save failed");
      }
      void refreshRecords();
    };
    return () => c.close();
  }, [refreshRecords]);
  useEffect(() => {
    const handler = (e: Event) => setError((e as CustomEvent<string>).detail);
    window.addEventListener("powerlab-storage-warning", handler);
    return () =>
      window.removeEventListener("powerlab-storage-warning", handler);
  }, []);
  function change(mutator: (draft: Project) => void) {
    const previous = latest.current;
    const draft = structuredClone(previous);
    try {
      mutator(draft);
    } catch (e) {
      setError((e as Error).message);
      return false;
    }
    draft.revision = previous.revision + 1;
    draft.updatedAt = new Date().toISOString();
    undo.current.push(previous);
    if (undo.current.length > 50) undo.current.shift();
    redo.current = [];
    latest.current = draft;
    setSaveState("Unsaved changes");
    setProject(draft);
    setHistoryTick((n) => n + 1);
    return true;
  }
  function undoChange() {
    const next = undo.current.pop();
    if (!next) return;
    const current = latest.current;
    redo.current.push(current);
    const restored = {
      ...structuredClone(next),
      revision: current.revision + 1,
      updatedAt: new Date().toISOString(),
    };
    latest.current = restored;
    setProject(restored);
    setHistoryTick((n) => n + 1);
  }
  function redoChange() {
    const next = redo.current.pop();
    if (!next) return;
    const current = latest.current;
    undo.current.push(current);
    const restored = {
      ...structuredClone(next),
      revision: current.revision + 1,
      updatedAt: new Date().toISOString(),
    };
    latest.current = restored;
    setProject(restored);
    setHistoryTick((n) => n + 1);
  }
  function go(r: string) {
    setRoute(r);
    history.replaceState(null, "", "#/" + r);
    setDialog(null);
    setQuery("");
    if (innerWidth < 900) setSidebar(false);
    if (r === "history")
      void projectHistory(project.id)
        .then(setRevisions)
        .catch((e) => setError(e.message));
  }
  async function openProject(next: Project) {
    try {
      const source = latest.current;
      if (saveState === "Save failed" && next.id === source.id) {
        if (
          !confirm("Reload the saved project? Export your unsaved work first.")
        )
          return;
        setError("");
      } else {
        await persist(source);
        if (
          latest.current.id !== source.id ||
          latest.current.revision !== source.revision
        ) {
          setError(
            "Project changed during saving. Your edits are preserved; open the other project again.",
          );
          return;
        }
      }
      undo.current = [];
      redo.current = [];
      setHistoryTick((n) => n + 1);
      lastSaved.current.set(
        next.id,
        records.find((r) => r.id === next.id)?.project.revision ??
          next.revision,
      );
      latest.current = structuredClone(next);
      setProject(latest.current);
      setSelected(undefined);
      setDialog(null);
      go("overview");
    } catch {
      /* Preserve current project when persistence fails. */
    }
  }
  async function createAndOpen(next: Project) {
    try {
      const source = latest.current;
      await persist(source);
      if (
        latest.current.id !== source.id ||
        latest.current.revision !== source.revision
      ) {
        setError(
          "Project changed during saving. Your edits are preserved; create the project again.",
        );
        return;
      }
      await saveProject(next);
      lastSaved.current.set(next.id, next.revision);
      await refreshRecords();
      undo.current = [];
      redo.current = [];
      latest.current = next;
      setProject(next);
      setSelected(undefined);
      setDialog(null);
      go("overview");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function closeProject(trash: boolean) {
    const source = latest.current;
    const next = createProject("Untitled project");
    await createAndOpen(next);
    if (latest.current.id !== next.id) return;
    try {
      if (trash) await setTrashed(source.id, true);
      await refreshRecords();
      setMessage(
        t(
          trash
            ? "Project moved to trash"
            : "Project closed; saved work remains available in Open project.",
        ),
      );
    } catch (error) {
      setError((error as Error).message);
    }
  }
  function saveLoad(load: Load) {
    const prior = project.loads.find((row) => row.id === load.id);
    if (
      prior?.locked &&
      (prior.phase !== load.phase ||
        prior.connection !== load.connection ||
        JSON.stringify(prior.phasePair) !== JSON.stringify(load.phasePair))
    )
      throw new Error(
        t("Unlock the load first before changing its phase or connection."),
      );
    const commands: ProjectCommand[] = [];
    if (!prior) commands.push({ kind: "loads.insert", loads: [load] });
    else {
      const { id, phase, boardId, circuitId, ...patch } = load;
      commands.push({ kind: "loads.patch", ids: [id], patch });
      if (prior.circuitId !== circuitId || prior.boardId !== boardId)
        commands.push({ kind: "loads.assign", ids: [id], boardId, circuitId });
      if (prior.phase !== phase)
        commands.push({ kind: "loads.phase", ids: [id], phase });
    }
    const reviewed = previewProjectCommand(project, {
      kind: "batch",
      commands,
    });
    if (reviewed.errors.length) throw new Error(reviewed.errors.join(" "));
    if (reviewed.changes.some((item) => item.objectId !== load.id)) {
      setEditor(null);
      setCommandReview({ preview: reviewed, selectedId: load.id });
      return;
    }
    if (change((p) => Object.assign(p, applyProjectCommand(p, reviewed)))) {
      setEditor(null);
      setSelected(load.id);
      setMessage(t("Load updated"));
      go("loads");
    }
  }
  async function pdf() {
    setReportBusy(true);
    setError("");
    try {
      const { createEngineeringPdf } = await import("./import-export/reports");
      const frozen = structuredClone(project);
      const blob = await createEngineeringPdf(
        frozen,
        calculateProject(frozen),
        { locale },
      );
      downloadFile(
        safeName(project.name) + "-engineering-report.pdf",
        blob,
        "application/pdf",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setReportBusy(false);
    }
  }
  useEffect(() => {
    function key(e: KeyboardEvent) {
      const input = (e.target as HTMLElement)?.closest(
        'input,textarea,select,[contenteditable="true"]',
      );
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setDialog("commands");
        setQuery("");
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void persist();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !input) {
        e.preventDefault();
        e.shiftKey ? redoChange() : undoChange();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y" && !input) {
        e.preventDefault();
        redoChange();
      }
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [project]);
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(""), 3500);
    return () => clearTimeout(timer);
  }, [message]);
  async function importFile(file: File) {
    setImportBusy(true);
    setError("");
    try {
      let next: ImportPreview;
      setCSVFile(undefined);
      setCSVHeaders([]);
      setCSVMapping({});
      setMappingDirty(false);
      if (file.name.toLowerCase().endsWith(".csv") && file.size <= 5_000_000) {
        const headers = parseCSV(await file.text())[0] ?? [];
        setCSVFile(file);
        setCSVHeaders(headers);
        const aliases: Record<string, string> = {
          power_kw: "rating",
          kw: "rating",
          power: "rating",
          hours: "hoursperday",
          powerfactor: "pf",
        };
        const columns: Record<string, number> = {};
        headers.forEach((header, index) => {
          const key = header
            .trim()
            .toLowerCase()
            .replace(/^\uFEFF/, "");
          if (
            [
              "name",
              "rating",
              "quantity",
              "entrymode",
              "voltage",
              "connection",
              "pf",
              "phase",
              "hoursperday",
              "starthour",
              "duty",
              "utilization",
              "efficiency",
              "reactive",
              "standbyw",
              "pfkind",
              "reactivekvar",
              "phasepair",
              "source",
            ].includes(aliases[key] ?? key)
          )
            columns[aliases[key] ?? key] = index;
        });
        setCSVMapping({ columns, ratingUnit: "native" });
        try {
          next = await previewImport(file);
        } catch (error) {
          next = {
            kind: "loads",
            loads: [],
            warnings: [],
            errors: [(error as Error).message],
          };
        }
      } else next = await previewImport(file);
      if (next.kind !== "project") {
        next.project = {
          ...createProject(file.name.replace(/\.[^.]+$/, "")),
          loads: next.loads,
        };
      }
      setPreview(next);
      setImportMode(next.kind === "project" ? "new" : "merge");
      setImportTarget({
        id: latest.current.id,
        revision: latest.current.revision,
      });
      setDialog("import");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setImportBusy(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }
  async function applyImport() {
    if (!preview?.project || preview.errors.length) return;
    setError("");
    try {
      if (
        importMode !== "new" &&
        (latest.current.id !== importTarget?.id ||
          latest.current.revision !== importTarget?.revision)
      )
        throw new Error(
          t("Project changed. Preview the import again before applying."),
        );
      if (importMode === "new") {
        const next = duplicateProject(
          preview.project,
          preview.project.name + " · imported",
        );
        await createAndOpen(next);
        if (latest.current.id !== next.id) return;
      } else {
        const next =
          importMode === "merge"
            ? mergeProjectObjects(latest.current, preview.project)
            : replaceProjectContents(latest.current, preview.project);
        if (
          !change((p) => {
            for (const key of Object.keys(p))
              delete (p as unknown as Record<string, unknown>)[key];
            Object.assign(p, next);
          })
        )
          return;
      }
      setDialog(null);
      setPreview(null);
      go("loads");
    } catch (error) {
      setError((error as Error).message);
    }
  }
  function libraryPage() {
    return (
      <>
        <EquipmentLibrary
          key={project.id}
          project={project}
          detailMode={detailMode}
          onDetailModeChange={setDetailMode}
          change={change}
          onAdd={(load) => setEditor({ load })}
        />
        <Notice>
          {t("Typical estimate")}. Generic analytical starting values, clearly
          identified as assumptions. Review each rating and source before adding
          to your project.
        </Notice>
        <div className="equipment-grid">
          {equipment.map(([name, category, rating, pf, hours]) => (
            <button
              className="panel equipment-card"
              key={name}
              onClick={() =>
                setEditor({
                  load: createLoad({
                    name,
                    category,
                    rating,
                    pf,
                    hoursPerDay: hours,
                    connection:
                      name === "General three-phase motor" ? "three" : "single",
                    voltage: name === "General three-phase motor" ? 400 : 230,
                    duty: name === "Refrigerator" ? 0.35 : 1,
                    source: {
                      kind: "estimate",
                      reference:
                        "AdigunPowerLab generic analytical starting value; verify actual nameplate. Not manufacturer data.",
                    },
                  }),
                })
              }
            >
              <span className="equipment-icon">
                <Zap size={22} />
              </span>
              <span className="eyebrow">{category}</span>
              <h3>{name}</h3>
              <p>
                {rating} kW · PF {pf}
              </p>
              <span className="text-button">
                {t("Add load")}
                <Plus size={16} />
              </span>
            </button>
          ))}
        </div>
        <div className="panel panel-pad">
          <h3>{t("Worked reference case")}</h3>
          <div className="reference-grid">
            {REFERENCE_CASES.map((c) => (
              <button
                key={c.id}
                className="reference-card"
                onClick={() => setDialog("references")}
              >
                <BookOpen size={20} />
                <strong>{c.name}</strong>
                <small>{c.description}</small>
              </button>
            ))}
          </div>
        </div>
      </>
    );
  }
  function historyPage() {
    return (
      <>
        <RevisionComparison
          key={project.id}
          project={project}
          revisions={revisions}
          change={change}
        />
        <section className="panel panel-pad">
          <div className="panel-title">
            <h3>{t("Issues")}</h3>
            <span className="tag amber">{result.issues.length}</span>
          </div>
          {result.issues.length ? (
            result.issues.map((issue) => (
              <div className="issue-detail" key={issue.id}>
                <AlertTriangle size={18} />
                <div>
                  <span
                    className={
                      "tag " + (issue.severity === "error" ? "red" : "amber")
                    }
                  >
                    {issue.assessment}
                  </span>
                  <p>{t(issue.message)}</p>
                  {issue.entityId && (
                    <button
                      className="text-button"
                      onClick={() => {
                        setSelected(issue.entityId);
                        go("loads");
                      }}
                    >
                      {t("Show details")}
                      <ArrowUpRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p>{t("No unresolved issues")}</p>
          )}
        </section>
        <section className="panel panel-pad">
          <div className="panel-title">
            <h3>{t("History & Issues")}</h3>
            <button
              className="button"
              onClick={() => void projectHistory(project.id).then(setRevisions)}
            >
              <RefreshCw size={15} />
              {t("History")}
            </button>
          </div>
          <div className="history-list">
            {revisions.map((p) => (
              <div key={p.revision}>
                <span className="history-dot" />
                <span>
                  <strong>
                    {t("Revision")} {p.revision}
                  </strong>
                  <small>
                    {new Date(p.updatedAt).toLocaleString(
                      locale === "pcm" ? "en-NG" : locale,
                    )}{" "}
                    · {p.loads.length} loads ·{" "}
                    {calculateProject(p).installedKW.toFixed(3)} kW
                  </small>
                </span>
                <button
                  className="button"
                  onClick={() => {
                    if (
                      confirm(`${t("Restore")} ${t("Revision")} ${p.revision}?`)
                    )
                      change((d) => {
                        const id = d.id;
                        for (const key of Object.keys(d))
                          delete (d as unknown as Record<string, unknown>)[key];
                        Object.assign(d, structuredClone(p), { id });
                      });
                  }}
                >
                  {t("Restore")}
                </button>
              </div>
            ))}
          </div>
          <Notice>
            Local revisions and undo history. Export a project backup for
            recovery on another device.
          </Notice>
        </section>
      </>
    );
  }
  function referencePage() {
    return (
      <>
        <div className="panel panel-pad">
          <span className="eyebrow">
            ADIGUNPOWERLAB · ENGINE {result.engineVersion}
          </span>
          <h2>{t("Engineering Reference")}</h2>
          <p>{t("Engineering estimate, not installation approval.")}</p>
          <div className="formula-grid">
            {[
              ["Single-phase AC", "P = V × I × PF"],
              ["Balanced three-phase AC", "P = √3 × VLL × I × PF"],
              ["Motor mechanical output", "Pin = Pshaft / η"],
              ["Signed reactive power", "Q = ±P × tan(acos(PF))"],
              ["Combined sinusoidal power", "S = √((ΣP)² + (ΣQ)²)"],
              ["Energy integration", "E = Σ(Pinterval × elapsed Δt)"],
              ["Single-phase voltage drop", "ΔV = 2 I L (R cosφ + X sinφ)"],
              ["Power-factor compensation", "Qc = P (tanφ₁ − tanφ₂)"],
            ].map(([label, formula]) => (
              <div key={label}>
                <span>{label}</span>
                <code>{formula}</code>
              </div>
            ))}
          </div>
          <h3>{t("Assumptions")}</h3>
          <ul>
            {result.trace.assumptions.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
          <Notice>
            On-state conductor current and energy duty are separate. Three-phase
            supply assumes a stiff neutral. True power factor does not determine
            a harmonic spectrum. Manual cable/device data must include its
            source.
          </Notice>
          <h3>{t("Sources")}</h3>
          {[
            [
              "Schneider Electric · voltage drop",
              "https://www.electrical-installation.org/enwiki/Calculation_of_voltage_drop_in_steady_load_conditions",
            ],
            [
              "Schneider Electric · actual maximum demand",
              "https://www.electrical-installation.org/enwiki/Estimation_of_actual_maximum_kVA_demand",
            ],
            [
              "Schneider Electric · cable sizing",
              "https://www.electrical-installation.org/enwiki/General_method_for_cable_sizing",
            ],
            [
              "Project calculation methods",
              "https://github.com/HephzibahBehulahHQ/AdigunPowerLab/blob/main/docs/CALCULATION_METHODS.md",
            ],
          ].map(([label, url]) => (
            <a
              className="reference-link"
              key={url}
              href={url}
              target="_blank"
              rel="noreferrer"
            >
              {label}
              <ExternalLink size={15} />
            </a>
          ))}
        </div>
        <div className="panel panel-pad">
          <h3>{t("Keyboard")}</h3>
          <dl className="detail-list">
            <dt>Ctrl / ⌘ K</dt>
            <dd>{t("Search")}</dd>
            <dt>Ctrl / ⌘ S</dt>
            <dd>{t("Save")}</dd>
            <dt>Ctrl / ⌘ Z</dt>
            <dd>{t("Undo")}</dd>
            <dt>Ctrl / ⌘ Shift Z</dt>
            <dd>{t("Redo")}</dd>
            <dt>Esc</dt>
            <dd>{t("Close")}</dd>
          </dl>
        </div>
      </>
    );
  }
  const current = routes.find((r) => r.id === route)!;
  return (
    <LanguageContext.Provider value={locale}>
      <div
        className={
          "app " +
          (sidebar ? "" : "sidebar-collapsed") +
          " " +
          detailMode +
          "-mode"
        }
      >
        <a href="#workspace" className="skip-link">
          {t("Workspace")}
        </a>
        <header className="topbar">
          <div className="brand">
            <a
              className="corporate-logo"
              href="https://hephzibahbehulahhq.github.io/"
              target="_blank"
              rel="noreferrer"
              aria-label="Hephzibah Behulah"
            >
              <img
                src="./assets/corporate/hephzibah-behulah-official.jpg"
                alt="Hephzibah Behulah"
              />
            </a>
            <div>
              <h1>
                Adigun<span>PowerLab</span>
              </h1>
              <p>BY HB ELEKTRONIKER</p>
            </div>
            <span className="brand-divider" />
          </div>
          <button
            className="project-switch"
            onClick={() => {
              setDialog("projects");
              void refreshRecords();
            }}
          >
            <FolderOpen size={16} />
            <span>{project.name}</span>
            <ChevronDown size={14} />
          </button>
          <span
            className={
              "save-badge " + (saveState === "Save failed" ? "bad" : "")
            }
            title={t(saveState)}
          >
            {saveState === "Saving" ? (
              <LoaderCircle size={13} className="spin" />
            ) : saveState === "Saved locally" ? (
              <Check size={13} />
            ) : (
              <span className="small-dot" />
            )}
            <span>{t(saveState)}</span>
          </span>
          <span className="spacer" />
          <button
            className="command-button"
            onClick={() => setDialog("commands")}
          >
            <Search size={16} />
            <span>{t("Search")}</span>
            <kbd>⌘ K</kbd>
          </button>
          <select
            className="language-select"
            aria-label={t("Language")}
            value={locale}
            onChange={(e) => setLocale(e.target.value as Locale)}
          >
            {Object.entries(languages).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
          <button
            className="icon-button"
            title={t("Settings")}
            onClick={() => go("settings")}
          >
            <Settings2 size={18} />
          </button>
        </header>
        <aside className="sidebar">
          <div className="sidebar-head">
            <span>{t("Workspace")}</span>
            <button
              className="icon-button"
              aria-label={t("Collapse navigation")}
              onClick={() => setSidebar(false)}
            >
              <PanelLeftClose size={17} />
            </button>
          </div>
          <nav aria-label="Main navigation">
            {["Workspace", "Engineering", "Energy & Planning", "Resources"].map(
              (group) => (
                <div className="nav-group" key={group}>
                  <button
                    className="nav-heading nav-group-toggle"
                    aria-expanded={!collapsedGroups.includes(group)}
                    onClick={() =>
                      setCollapsedGroups((groups) =>
                        groups.includes(group)
                          ? groups.filter((item) => item !== group)
                          : [...groups, group],
                      )
                    }
                  >
                    {t(group)}
                    <ChevronDown size={12} />
                  </button>
                  {!collapsedGroups.includes(group) &&
                    routes
                      .filter((r) => r.group === group)
                      .map((r) => (
                        <button
                          key={r.id}
                          className={
                            "nav-item " + (route === r.id ? "active" : "")
                          }
                          onClick={() => go(r.id)}
                          aria-current={route === r.id ? "page" : undefined}
                        >
                          <r.icon size={17} />
                          <span>{t(r.label)}</span>
                          {r.id === "loads" && (
                            <span className="nav-count">
                              {project.loads.length}
                            </span>
                          )}
                          {r.id === "tools" && (
                            <span className="nav-count">{tools.length}</span>
                          )}
                        </button>
                      ))}
                </div>
              ),
            )}
          </nav>
          <div className="sidebar-bottom">
            <div className="local-dot" />
            <div>
              <strong>{t("Local only")}</strong>
              <small>{t("No cloud connection")}</small>
            </div>
            <button
              className="icon-button"
              title={t("Help")}
              onClick={() => go("reference")}
            >
              <HelpCircle size={17} />
            </button>
          </div>
          <ResizeHandle
            value={sidebarWidth}
            min={190}
            max={390}
            variable="--sidebar"
            label={t("Navigation width")}
            onChange={setSidebarWidth}
          />
        </aside>
        <div className="workspace-shell">
          <div className="workspace-toolbar">
            {!sidebar && (
              <button
                className="icon-button"
                aria-label={t("Open navigation")}
                onClick={() => setSidebar(true)}
              >
                <PanelLeftOpen size={19} />
              </button>
            )}
            <div className="breadcrumb">
              <span>{t(current?.group || "Workspace")}</span>
              <ChevronRight size={14} />
              <strong>{t(current?.label || "Overview")}</strong>
            </div>
            <span className="spacer" />
            <details className="project-actions">
              <summary className="button small-button">{t("Project")}</summary>
              <div
                className="project-menu"
                role="group"
                aria-label={t("Project actions")}
                onClick={(event) => {
                  if ((event.target as HTMLElement).closest("button"))
                    (
                      event.currentTarget.parentElement as HTMLDetailsElement
                    ).open = false;
                }}
              >
                <button
                  onClick={() => {
                    setName("");
                    setDialog("projects");
                    void refreshRecords();
                  }}
                >
                  {t("New project")}
                </button>
                <button
                  onClick={() => {
                    setDialog("projects");
                    void refreshRecords();
                  }}
                >
                  {t("Open project")}
                </button>
                <button
                  onClick={() => {
                    setName(project.name);
                    setDialog("rename");
                  }}
                >
                  {t("Rename project")}
                </button>
                <button
                  onClick={() => void createAndOpen(duplicateProject(project))}
                >
                  {t("Duplicate project")}
                </button>
                <button onClick={() => void persist()}>{t("Save")}</button>
                <button onClick={() => exportProject(project)}>
                  {t("Export project")}
                </button>
                <button onClick={() => fileInput.current?.click()}>
                  {t("Import project")}
                </button>
                <button onClick={() => go("history")}>
                  {t("Revision history")}
                </button>
                <button
                  onClick={() => {
                    setDialog("projects");
                    void refreshRecords();
                  }}
                >
                  {t("Restore from trash")}
                </button>
                <button onClick={() => void closeProject(false)}>
                  {t("Close project")}
                </button>
                <button
                  className="danger"
                  onClick={() => {
                    if (confirm(t("Move to trash") + " " + project.name + "?"))
                      void closeProject(true);
                  }}
                >
                  {t("Move to trash")}
                </button>
              </div>
            </details>
            <div className="history-buttons">
              <button
                className="icon-button"
                title={t("Undo") + " · Ctrl Z"}
                aria-label={t("Undo")}
                disabled={!undo.current.length}
                onClick={undoChange}
              >
                <Undo2 size={17} />
              </button>
              <button
                className="icon-button"
                title={t("Redo")}
                aria-label={t("Redo")}
                disabled={!redo.current.length}
                onClick={redoChange}
              >
                <Redo2 size={17} />
              </button>
            </div>
            <button
              className="button small-button"
              onClick={() => void persist()}
            >
              <Save size={15} />
              <span>{t("Save")}</span>
            </button>
            <button
              className="button small-button"
              onClick={() => exportProject(project)}
            >
              <Download size={15} />
              <span>{t("Export project")}</span>
            </button>
            <button
              className="button primary small-button"
              onClick={() => {
                setShowTrace(true);
                setMessage(result.complete ? t("Calculated") : t("Incomplete"));
              }}
            >
              <Activity size={15} />
              {t("Calculate")}
            </button>
          </div>
          {error && (
            <div className="app-alert" role="alert">
              <AlertTriangle size={17} />
              <span>{error}</span>
              <button
                className="button small-button"
                onClick={() => exportProject(project)}
              >
                {t("Export project")}
              </button>
              <button
                className="button small-button"
                onClick={async () => {
                  try {
                    const copy = duplicateProject(
                      latest.current,
                      latest.current.name + " · recovered copy",
                    );
                    await saveProject(copy);
                    lastSaved.current.set(copy.id, copy.revision);
                    undo.current = [];
                    redo.current = [];
                    setHistoryTick((n) => n + 1);
                    latest.current = copy;
                    setProject(copy);
                    setSelected(undefined);
                    setShowTrace(false);
                    setError("");
                    await refreshRecords();
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                {t("Save a copy")}
              </button>
              <button
                className="icon-button"
                onClick={() => setError("")}
                aria-label={t("Close")}
              >
                <X size={17} />
              </button>
            </div>
          )}
          <UpdateBanner
            save={() => persist()}
            version={`${project.id}:${project.revision}`}
          />
          <div
            className={
              "workspace-content " +
              (selectedObject || showTrace ? "with-inspector" : "")
            }
          >
            <main id="workspace" className="main-content">
              <div className="page-heading">
                <div>
                  <span className="eyebrow">
                    ELECTRICAL & ENGINEERING POWER STUDIO
                  </span>
                  <h2>{t(current?.label || "Overview")}</h2>
                </div>
                <DetailModeControl
                  value={detailMode}
                  onChange={setDetailMode}
                />
                {project.referenceCase && (
                  <span className="tag amber">
                    <BookOpen size={13} />
                    {t("Worked reference case")}
                  </span>
                )}
              </div>
              <p className="detail-help detail-mode-intro">
                {t(
                  detailMode === "simple"
                    ? "Essential inputs and explained results. Your project stays the same."
                    : "All assumptions and calculation values are shown.",
                )}{" "}
                {t("Checks remain visible in both views.")}
              </p>
              {!loaded ? (
                <div className="loading">
                  <LoaderCircle className="spin" />
                  {t("Open project")}…
                </div>
              ) : (
                <>
                  {route === "overview" && (
                    <Overview
                      project={project}
                      result={result}
                      detailMode={detailMode}
                      change={change}
                      onLocale={setLocale}
                      onAdd={() => setEditor({})}
                      onReference={() => setDialog("references")}
                      onRoute={go}
                    />
                  )}
                  {route === "loads" && (
                    <>
                      <LoadOperations project={project} change={change} />
                      <button className="button" onClick={() => go("library")}>
                        {t("Add from library")}
                      </button>
                      <Loads
                        project={project}
                        result={result}
                        detailMode={detailMode}
                        selected={selected}
                        onAdd={() => setEditor({})}
                        onEdit={(load) => setEditor({ load })}
                        onSelect={(id) => {
                          setSelected(id);
                          setShowTrace(false);
                        }}
                        onDuplicate={(load) =>
                          change((p) =>
                            p.loads.push({
                              ...structuredClone(load),
                              id: crypto.randomUUID(),
                              name: load.name + " · copy",
                            }),
                          )
                        }
                        onDelete={(id) =>
                          setCommandReview({
                            preview: previewProjectCommand(project, {
                              kind: "loads.delete",
                              ids: [id],
                            }),
                          })
                        }
                        onImport={() => fileInput.current?.click()}
                        onExport={() => exportLoads(project)}
                        onLibrary={() => go("library")}
                      />
                    </>
                  )}
                  {route === "boards" && (
                    <>
                      <ProjectOrganization project={project} change={change} />
                      <Boards
                        project={project}
                        result={result}
                        change={change}
                        onSelect={setSelected}
                      />
                    </>
                  )}
                  {route === "diagram" && (
                    <>
                      <div className="tab-bar">
                        <button
                          className={diagramView === "single" ? "active" : ""}
                          onClick={() => setDiagramView("single")}
                        >
                          {t("Single-line diagram")}
                        </button>
                        <button
                          className={diagramView === "spatial" ? "active" : ""}
                          onClick={() => setDiagramView("spatial")}
                        >
                          {t("Analytical spatial view")}
                        </button>
                      </div>
                      {diagramView === "single" ? (
                        <TopologyEditor
                          project={project}
                          result={result}
                          onSelect={setSelected}
                          selectedId={selected}
                          change={change}
                        />
                      ) : (
                        <Suspense
                          fallback={
                            <div className="loading">
                              <LoaderCircle className="spin" />
                            </div>
                          }
                        >
                          <SpatialView
                            project={project}
                            result={result}
                            onSelect={setSelected}
                          />
                        </Suspense>
                      )}
                    </>
                  )}
                  {route === "simulation" && (
                    <>
                      <Simulation
                        project={project}
                        result={result}
                        onComplete={rememberCalendar}
                        animationsPaused={motion === "paused"}
                      />
                      <details
                        className="advanced-section"
                        open={detailMode === "engineering"}
                      >
                        <summary>
                          {t("Advanced schedules, starts and flexible loads")}
                        </summary>
                        <AdvancedPlanning
                          project={project}
                          onChange={change}
                          onCalendarComplete={rememberCalendar}
                        />
                      </details>
                      <Suspense
                        fallback={
                          <div className="loading">
                            <LoaderCircle className="spin" />
                          </div>
                        }
                      >
                        <Measurements projectId={project.id} />
                      </Suspense>
                    </>
                  )}
                  {route === "motors" && (
                    <SourceRegistry
                      project={project}
                      change={change}
                      onSelect={setSelected}
                    />
                  )}
                  {route === "cables" && (
                    <FeederAssessment project={project} onChange={change} />
                  )}
                  {["cables", "motors", "quality", "tools"].includes(route) && (
                    <Toolbox
                      project={project}
                      change={change}
                      selectedId={selected}
                      key={route + toolId}
                      initialTool={toolId}
                      category={
                        route === "cables"
                          ? "Cables|Protection"
                          : route === "motors"
                            ? "Motors|Supply|Distribution"
                            : route === "quality"
                              ? "Quality"
                              : undefined
                      }
                    />
                  )}
                  {route === "renewables" && (
                    <Renewables
                      key={project.id}
                      project={project}
                      change={change}
                      onComplete={(calculated, inputs) =>
                        setReportContext((context) => ({
                          ...context,
                          energy: {
                            projectId: latest.current.id,
                            revision: calculated.revision,
                            calculatedAt: new Date().toISOString(),
                            result: calculated,
                            inputs: inputs as EnergyOptions,
                            source:
                              "Completed renewable/storage dispatch with entered profiles",
                          },
                        }))
                      }
                    />
                  )}
                  {route === "ev" && (
                    <EVPlanner
                      project={project}
                      result={result}
                      change={change}
                      onComplete={(sessionId, plan, inputs) =>
                        setReportContext((context) => {
                          const revision = latest.current.revision;
                          const prior =
                            context.ev?.revision === revision
                              ? context.ev.result
                              : [];
                          return {
                            ...context,
                            ev: {
                              projectId: latest.current.id,
                              revision,
                              calculatedAt: new Date().toISOString(),
                              result: [
                                ...prior.filter(
                                  (row) => row.sessionId !== sessionId,
                                ),
                                { sessionId, plan },
                              ],
                              inputs,
                              source:
                                "Completed dated EV allocation with entered session constraints",
                            },
                          };
                        })
                      }
                    />
                  )}
                  {route === "costs" && (
                    <Costs
                      key={project.id}
                      project={project}
                      result={result}
                      change={change}
                    />
                  )}
                  {route === "scenarios" && (
                    <ScenarioWorkspace
                      key={project.id}
                      change={change}
                      onTrash={(id) =>
                        void setTrashed(id, true)
                          .then(refreshRecords)
                          .catch((e) => setError(e.message))
                      }
                      project={project}
                      records={records}
                      onCreate={(p) => void createAndOpen(p)}
                      onOpen={(p) => void openProject(p)}
                    />
                  )}
                  {route === "library" && libraryPage()}
                  {route === "reports" && (
                    <>
                      <div className="tab-bar">
                        <button
                          className={
                            reportTab === "engineering" ? "active" : ""
                          }
                          onClick={() => setReportTab("engineering")}
                        >
                          <FileText size={16} />
                          {t("Engineering report")}
                        </button>
                        <button
                          className={reportTab === "billing" ? "active" : ""}
                          onClick={() => setReportTab("billing")}
                        >
                          <CircleDollarSign size={16} />
                          {t("Customer bill")}
                        </button>
                      </div>
                      {reportTab === "billing" ? (
                        <Suspense
                          fallback={
                            <div className="loading">
                              <LoaderCircle className="spin" />
                            </div>
                          }
                        >
                          <Billing
                            projectId={project.id}
                            projectName={project.name}
                            currency={project.currency}
                            locale={locale}
                          />
                        </Suspense>
                      ) : (
                        <Suspense
                          fallback={
                            <div className="loading">
                              <LoaderCircle className="spin" />
                            </div>
                          }
                        >
                          <ReportWorkspace
                            project={project}
                            result={result}
                            locale={locale}
                            context={{
                              ...reportContext,
                              scenarios: records
                                .filter(
                                  (r) =>
                                    !r.deleted &&
                                    r.id !== project.id &&
                                    (r.project.scenarioOf === project.id ||
                                      r.id === project.scenarioOf ||
                                      (project.scenarioOf &&
                                        r.project.scenarioOf ===
                                          project.scenarioOf)),
                                )
                                .map((r) => ({
                                  project: r.project,
                                  result: calculateProject(r.project),
                                  label: r.project.name,
                                })),
                            }}
                            onDetailsChange={(details) =>
                              change((p) => {
                                p.reportDetails = details;
                              })
                            }
                            onOpenBilling={() => setReportTab("billing")}
                          />
                        </Suspense>
                      )}
                    </>
                  )}
                  {route === "reference" && referencePage()}
                  {route === "history" && historyPage()}
                  {route === "settings" && (
                    <>
                      <ProjectSettings
                        key={project.id}
                        project={project}
                        change={change}
                      />
                      <section className="panel panel-pad">
                        <h3>{t("Settings")}</h3>
                        <div className="form-grid three">
                          <Field label={t("Language")}>
                            <select
                              value={locale}
                              onChange={(e) =>
                                setLocale(e.target.value as Locale)
                              }
                            >
                              {Object.entries(languages).map(([l, n]) => (
                                <option key={l} value={l}>
                                  {n}
                                </option>
                              ))}
                            </select>
                          </Field>
                          <Field label={t("Detail level")}>
                            <select
                              value={detailMode}
                              onChange={(e) =>
                                setDetailMode(e.target.value as DetailMode)
                              }
                            >
                              <option value="simple">{t("Simple")}</option>
                              <option value="engineering">
                                {t("Engineering")}
                              </option>
                            </select>
                          </Field>
                          <Field label={t("Theme")}>
                            <select
                              value={theme}
                              onChange={(e) => setTheme(e.target.value)}
                            >
                              {["dark", "light", "system"].map((v) => (
                                <option key={v} value={v}>
                                  {t(v[0].toUpperCase() + v.slice(1))}
                                </option>
                              ))}
                            </select>
                          </Field>
                          <Field label={t("Motion")}>
                            <select
                              value={motion}
                              onChange={(e) => setMotion(e.target.value)}
                            >
                              {["system", "reduced", "full", "paused"].map(
                                (v) => (
                                  <option key={v} value={v}>
                                    {t(v[0].toUpperCase() + v.slice(1))}
                                  </option>
                                ),
                              )}
                            </select>
                          </Field>
                        </div>
                        <div className="form-grid three">
                          <Field label={t("Navigation width")} unit="px">
                            <input
                              type="range"
                              min="190"
                              max="390"
                              value={sidebarWidth}
                              onChange={(e) =>
                                setSidebarWidth(Number(e.target.value))
                              }
                            />
                          </Field>
                          <Field label={t("Inspector width")} unit="px">
                            <input
                              type="range"
                              min="250"
                              max="550"
                              value={inspectorWidth}
                              onChange={(e) =>
                                setInspectorWidth(Number(e.target.value))
                              }
                            />
                          </Field>
                          <button
                            className="button"
                            onClick={() => {
                              setSidebarWidth(240);
                              setInspectorWidth(300);
                              setCollapsedGroups([]);
                              setSidebar(innerWidth > 900);
                              setDetailMode("engineering");
                            }}
                          >
                            {t("Reset layout")}
                          </button>
                        </div>
                        <Notice>
                          {t("Local only")}.{" "}
                          {t(
                            "Use Workspace backup to export projects, histories, bills and measurements together. Local browser storage is not a remote backup.",
                          )}
                        </Notice>
                        <div className="button-row">
                          <button
                            className="button"
                            onClick={() => exportProject(project)}
                          >
                            <Download size={16} />
                            {t("Export project")}
                          </button>
                          <button
                            className="button"
                            onClick={() => fileInput.current?.click()}
                          >
                            <Upload size={16} />
                            {t("Import")}
                          </button>
                          <button
                            className="button"
                            onClick={() => {
                              setDialog("projects");
                              void refreshRecords();
                            }}
                          >
                            {t("Trash")}
                          </button>
                        </div>
                      </section>
                      <WorkspaceRecovery
                        activeProject={project}
                        onRestored={async ({ activeIds }) => {
                          await refreshRecords();
                          const saved = await listProjects();
                          const restored = saved.find(
                            (record) =>
                              activeIds.includes(record.id) && !record.deleted,
                          );
                          if (restored) await openProject(restored.project);
                        }}
                      />
                      <section className="panel panel-pad">
                        <h3>Adigun BOT</h3>
                        <p>
                          {t("Local engineering help")}.{" "}
                          {t("No connected AI service")}.
                        </p>
                        <button
                          className="button"
                          onClick={() => {
                            resetBotWindowState();
                            setBotOpen(true);
                          }}
                        >
                          <Bot size={16} />
                          Open / restore Adigun BOT
                        </button>
                        <p className="muted small">
                          Connected AI requires an authenticated backend. API
                          keys are never stored in this browser application.
                        </p>
                      </section>
                    </>
                  )}
                </>
              )}
            </main>
            {(selectedObject || showTrace) && (
              <aside className="inspector">
                <ResizeHandle
                  value={inspectorWidth}
                  min={250}
                  max={550}
                  variable="--inspector"
                  label={t("Inspector width")}
                  reverse
                  onChange={setInspectorWidth}
                />
                <div className="inspector-head">
                  <span>
                    {t(showTrace ? "Calculation trace" : "Selected object")}
                  </span>
                  <button
                    className="icon-button"
                    aria-label={t("Close")}
                    onClick={() => {
                      setSelected(undefined);
                      setShowTrace(false);
                    }}
                  >
                    <X size={17} />
                  </button>
                </div>
                {showTrace ? (
                  <>
                    <div className="inspector-section">
                      <span className="tag cyan">{t("Calculated")}</span>
                      <h3>{project.name}</h3>
                      <dl className="detail-list">
                        <dt>{t("Revision")}</dt>
                        <dd>{result.revision}</dd>
                        <dt>{t("Engine")}</dt>
                        <dd>{result.engineVersion}</dd>
                        <dt>{t("Origin")}</dt>
                        <dd>{result.trace.origin}</dd>
                        <dt>{t("Method")}</dt>
                        <dd>{t(result.trace.method)}</dd>
                      </dl>
                      <div className="formula">{result.trace.formula}</div>
                    </div>
                    <div className="inspector-section">
                      <h4>{t("Assumptions")}</h4>
                      {result.trace.assumptions.map((a, i) => (
                        <p className="small muted" key={i}>
                          {t(a)}
                        </p>
                      ))}
                    </div>
                    <div className="inspector-section">
                      <h4>{t("Issues")}</h4>
                      {result.issues.map((i) => (
                        <p className="small" key={i.id}>
                          {t(i.message)}
                        </p>
                      ))}
                    </div>
                  </>
                ) : selectedObject && !selectedLoad ? (
                  <div className="inspector-section">
                    <span className="tag">
                      {t(
                        selectedBoard
                          ? "Board"
                          : selectedCircuit
                            ? "Circuit"
                            : "Source equipment",
                      )}
                    </span>
                    <h3>{selectedObject.name}</h3>
                    <dl className="detail-list">
                      {Object.entries(selectedObject)
                        .filter(([key]) => key !== "id" && key !== "name")
                        .map(([key, value]) => (
                          <div key={key}>
                            <dt>{t(key)}</dt>
                            <dd>
                              {typeof value === "object" ? (
                                <details>
                                  <summary>{t("Show details")}</summary>
                                  <pre className="comparison-value">
                                    {JSON.stringify(value, null, 2)}
                                  </pre>
                                </details>
                              ) : (
                                String(value ?? "—")
                              )}
                            </dd>
                          </div>
                        ))}
                    </dl>
                    <button
                      className="button"
                      onClick={() => go(selectedSource ? "motors" : "boards")}
                    >
                      {t("Edit selected object")}
                    </button>
                    <button
                      className="text-button"
                      onClick={() => setShowTrace(true)}
                    >
                      {t("Calculation trace")}
                    </button>
                  </div>
                ) : (
                  selectedLoad && (
                    <>
                      <div className="inspector-section">
                        <div className="selected-icon">
                          <Zap size={24} />
                        </div>
                        <span className="eyebrow">{selectedLoad.category}</span>
                        <h3>{selectedLoad.name}</h3>
                        <span className="tag">{selectedLoad.source.kind}</span>
                      </div>
                      <div className="inspector-section">
                        <dl className="detail-list">
                          <dt>{t("Rating")}</dt>
                          <dd>
                            {selectedLoad.rating}{" "}
                            {selectedLoad.entryMode === "amps"
                              ? "A"
                              : selectedLoad.entryMode === "kva"
                                ? "kVA"
                                : "kW"}
                          </dd>
                          <dt>{t("Voltage")}</dt>
                          <dd>{selectedLoad.voltage} V</dd>
                          <dt>{t("Phase")}</dt>
                          <dd>{selectedLoad.phase}</dd>
                          <dt>{t("Power factor")}</dt>
                          <dd>{selectedLoad.pf}</dd>
                          <dt>{t("Operating hours")}</dt>
                          <dd>{selectedLoad.hoursPerDay} h</dd>
                          <dt>{t("Energy duty")}</dt>
                          <dd>{selectedLoad.duty * 100}%</dd>
                        </dl>
                        <LoadCalculationDetails
                          load={selectedLoad}
                          result={selectedResult}
                          mode={detailMode}
                        />
                        <button
                          className="button full-width"
                          onClick={() => setEditor({ load: selectedLoad })}
                        >
                          <SlidersHorizontal size={16} />
                          {t("Edit load")}
                        </button>
                      </div>
                      <div className="inspector-section">
                        <h4>{t("Provenance")}</h4>
                        <p className="small muted">
                          {selectedLoad.source.reference ||
                            t("User assumption")}
                        </p>
                        <p className="small muted">{selectedLoad.notes}</p>
                        <button
                          className="text-button"
                          onClick={() => setShowTrace(true)}
                        >
                          {t("Explain result")}
                          <ArrowRight size={15} />
                        </button>
                      </div>
                    </>
                  )
                )}
              </aside>
            )}
          </div>
          <footer className="statusbar">
            <span>
              <span className="local-dot" /> {t("Local only")}
            </span>
            <span>
              {project.loads.length} loads · {project.circuits.length} circuits
              · {t("Revision")} {project.revision}
            </span>
            <span className="spacer" />
            <span>
              {t("Engine")} {result.engineVersion}
            </span>
            <span>{t("Engineering estimate, not installation approval.")}</span>
            <button onClick={() => go("history")} className="status-issues">
              <AlertTriangle size={13} />
              {result.issues.length}
            </button>
          </footer>
        </div>
        <button
          className={"bot-launcher " + (botOpen ? "hidden" : "")}
          onClick={() => setBotOpen(true)}
          aria-label="Open Adigun BOT"
        >
          <Bot size={23} />
          <span>Adigun BOT</span>
          <span className="bot-status-dot" />
        </button>
        {botOpen && (
          <Suspense fallback={null}>
            <LocalBot
              project={project}
              result={result}
              selectedId={selected}
              onChange={change}
              onClose={() => setBotOpen(false)}
              onReport={() => void pdf()}
            />
          </Suspense>
        )}
        {message && (
          <div className="toast" role="status">
            <Check size={16} />
            {message}
          </div>
        )}
        <input
          type="file"
          accept=".json,.csv"
          ref={fileInput}
          hidden
          onChange={(e) => {
            if (e.target.files?.[0]) void importFile(e.target.files[0]);
          }}
        />
        {editor && (
          <LoadEditor
            load={editor.load}
            project={project}
            detailMode={detailMode}
            onDetailModeChange={setDetailMode}
            onSave={saveLoad}
            onClose={() => setEditor(null)}
          />
        )}
        {dialog === "references" && (
          <Modal
            title={t("Worked reference case")}
            onClose={() => setDialog(null)}
            wide
          >
            <div className="modal-body">
              <Notice>
                These are opt-in analytical cases with entered assumptions and
                independent expected results. They are saved as new projects.
              </Notice>
              <div className="reference-grid">
                {REFERENCE_CASES.map((c) => (
                  <button
                    className="reference-card"
                    key={c.id}
                    onClick={() =>
                      void createAndOpen(createReferenceProject(c.id))
                    }
                  >
                    <BookOpen size={22} />
                    <strong>{c.name}</strong>
                    <small>{c.description}</small>
                    <span>
                      {c.expected.installedKW.toFixed(3)} kW ·{" "}
                      {c.expected.dailyKWh.toFixed(3)} kWh/day
                    </span>
                    <p>{c.assumptions.join(" ")}</p>
                    <span className="text-button">
                      {t("Open")}
                      <ArrowRight size={14} />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </Modal>
        )}
        {dialog === "rename" && (
          <Modal title={t("Rename project")} onClose={() => setDialog(null)}>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (
                  change((draft) => {
                    if (!name.trim()) throw new Error("Enter a project name.");
                    draft.name = name.trim();
                  })
                )
                  setDialog(null);
              }}
            >
              <div className="modal-body">
                <Field label={t("Project name")}>
                  <input
                    autoFocus
                    required
                    maxLength={160}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </Field>
              </div>
              <div className="modal-footer">
                <button
                  className="button"
                  type="button"
                  onClick={() => setDialog(null)}
                >
                  {t("Cancel")}
                </button>
                <button className="button primary">{t("Save")}</button>
              </div>
            </form>
          </Modal>
        )}
        {dialog === "projects" && (
          <Modal title={t("Open project")} onClose={() => setDialog(null)} wide>
            <div className="modal-body">
              <form
                className="inline-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  void createAndOpen(createProject(name.trim()));
                  setName("");
                }}
              >
                <Field label={t("New project")}>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={160}
                  />
                </Field>
                <button className="button primary">
                  <Plus size={16} />
                  {t("Create")}
                </button>
              </form>
              <div className="project-list">
                {records
                  .filter((r) => !r.deleted)
                  .map((r) => (
                    <div key={r.id}>
                      <button onClick={() => void openProject(r.project)}>
                        <FolderOpen size={20} />
                        <span>
                          <strong>{r.project.name}</strong>
                          <small>
                            {r.project.loads.length} loads ·{" "}
                            {new Date(r.savedAt).toLocaleString()}
                          </small>
                        </span>
                        {r.id === project.id && (
                          <span className="tag cyan">{t("Open")}</span>
                        )}
                      </button>
                      <button
                        className="icon-button"
                        aria-label={t("Duplicate") + " " + r.project.name}
                        onClick={() =>
                          void createAndOpen(
                            duplicateProject(
                              r.project,
                              r.project.name + " · copy",
                            ),
                          )
                        }
                      >
                        <Copy size={17} />
                      </button>
                      <button
                        className="icon-button danger"
                        disabled={r.id === project.id}
                        title={
                          r.id === project.id
                            ? "Open another project before moving this one to trash"
                            : t("Move to trash")
                        }
                        aria-label={t("Move to trash") + " " + r.project.name}
                        onClick={() => {
                          if (
                            confirm(
                              t("Move to trash") + " " + r.project.name + "?",
                            )
                          )
                            void setTrashed(r.id, true).then(refreshRecords);
                        }}
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  ))}
              </div>
              <details>
                <summary>
                  {t("Trash")} ({records.filter((r) => r.deleted).length})
                </summary>
                {records
                  .filter((r) => r.deleted)
                  .map((r) => (
                    <div className="trash-row" key={r.id}>
                      <span>{r.project.name}</span>
                      <button
                        className="button"
                        onClick={() =>
                          void setTrashed(r.id, false).then(refreshRecords)
                        }
                      >
                        {t("Restore")}
                      </button>
                    </div>
                  ))}
              </details>
              <div className="button-row">
                <button
                  className="button"
                  onClick={() => fileInput.current?.click()}
                >
                  <Upload size={16} />
                  {t("Import")}
                </button>
                <button
                  className="button"
                  onClick={() => setDialog("references")}
                >
                  <BookOpen size={16} />
                  {t("Open reference case")}
                </button>
              </div>
            </div>
          </Modal>
        )}
        {commandReview && (
          <CommandReview
            project={project}
            preview={commandReview.preview}
            change={change}
            onClose={() => setCommandReview(undefined)}
            onApplied={() => {
              setSelected(commandReview.selectedId);
              setCommandReview(undefined);
              go("loads");
            }}
          />
        )}
        {dialog === "import" && preview && (
          <Modal
            title={t("Preview import")}
            onClose={() => setDialog(null)}
            wide
          >
            <div className="modal-body">
              {csvFile && (
                <details open={preview.errors.length > 0}>
                  <summary>{t("CSV column and unit mapping")}</summary>
                  <div className="form-grid three">
                    {[
                      "name",
                      "rating",
                      "quantity",
                      "entrymode",
                      "voltage",
                      "connection",
                      "pf",
                      "phase",
                      "hoursperday",
                      "starthour",
                      "duty",
                      "utilization",
                      "efficiency",
                      "reactive",
                      "standbyw",
                      "pfkind",
                      "reactivekvar",
                      "phasepair",
                      "source",
                    ].map((field) => (
                      <Field key={field} label={field}>
                        <select
                          value={csvMapping.columns?.[field] ?? ""}
                          onChange={(e) => {
                            const columns = { ...csvMapping.columns };
                            if (e.target.value === "") delete columns[field];
                            else columns[field] = Number(e.target.value);
                            setCSVMapping({ ...csvMapping, columns });
                            setMappingDirty(true);
                          }}
                        >
                          <option value="">{t("Use default / omit")}</option>
                          {csvHeaders.map((header, index) => (
                            <option key={index} value={index}>
                              {header}
                            </option>
                          ))}
                        </select>
                      </Field>
                    ))}
                    <Field label={t("Imported rating unit")}>
                      <select
                        value={csvMapping.ratingUnit ?? "native"}
                        onChange={(e) => {
                          setCSVMapping({
                            ...csvMapping,
                            ratingUnit: e.target
                              .value as CSVImportMapping["ratingUnit"],
                          });
                          setMappingDirty(true);
                        }}
                      >
                        {["native", "W", "kW", "VA", "kVA", "A"].map((unit) => (
                          <option key={unit} value={unit}>
                            {unit === "native"
                              ? t("Use entry-mode column (default kW)")
                              : unit}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                  <p className="small muted">
                    {t(
                      "CSV numeric values use decimal points. Explicit rating units override the entry-mode column; W and VA are converted to kW and kVA.",
                    )}
                  </p>
                  <button
                    className="button"
                    disabled={importBusy}
                    onClick={async () => {
                      setImportBusy(true);
                      try {
                        const next = await previewImport(csvFile, csvMapping);
                        next.project = {
                          ...createProject(
                            csvFile.name.replace(/\.[^.]+$/, ""),
                          ),
                          loads: next.loads,
                        };
                        setPreview(next);
                        setMappingDirty(false);
                        setImportTarget({
                          id: project.id,
                          revision: project.revision,
                        });
                        setError("");
                      } catch (error) {
                        setError((error as Error).message);
                      } finally {
                        setImportBusy(false);
                      }
                    }}
                  >
                    {t("Refresh import preview")}
                  </button>
                </details>
              )}
              <div className="metric-strip">
                <div>
                  <span>{t("Valid rows")}</span>
                  <strong>
                    {preview.kind === "project"
                      ? preview.project?.loads.length
                      : preview.loads.length}
                  </strong>
                </div>
                <div>
                  <span>{t("Errors")}</span>
                  <strong>{preview.errors.length}</strong>
                </div>
              </div>
              {preview.warnings.map((w, i) => (
                <Notice key={i} tone="warning">
                  {w}
                </Notice>
              ))}
              {preview.errors.map((e, i) => (
                <p className="error-text" key={i}>
                  {e}
                </p>
              ))}
              <Field label={t("Import destination")}>
                <select
                  value={importMode}
                  onChange={(e) =>
                    setImportMode(e.target.value as typeof importMode)
                  }
                >
                  <option value="new">{t("New project")}</option>
                  <option value="merge">
                    {t("Merge into current project")}
                  </option>
                  <option value="replace">
                    {t("Replace current project contents")}
                  </option>
                </select>
              </Field>
              <p>
                {importMode === "new" ? preview.project?.name : project.name} ·{" "}
                {t("Revision")} {importTarget?.revision}
              </p>
              <Notice tone={importMode === "replace" ? "warning" : "info"}>
                {t(
                  importMode === "merge"
                    ? "Imports objects with new IDs and their dependencies. Current supply, tariff, energy, baseline and diagram settings are retained."
                    : importMode === "replace"
                      ? "Replaces the current project contents. The prior state remains available through Undo and saved history."
                      : "Creates a separate project. Imported object IDs and evidence are preserved.",
                )}
              </Notice>
              <p className="small muted">
                {preview.project?.boards.length ?? 0} {t("Boards")} ·{" "}
                {preview.project?.circuits.length ?? 0} {t("Circuits")} ·{" "}
                {preview.project?.loads.length ?? 0} {t("Loads")}
              </p>
              {error && <Notice tone="error">{error}</Notice>}
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>{t("Name")}</th>
                      <th>{t("Rating")}</th>
                      <th>{t("Voltage")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(preview.project?.loads || preview.loads)
                      .slice(0, 10)
                      .map((l) => (
                        <tr key={l.id}>
                          <td>{l.name}</td>
                          <td>{l.rating}</td>
                          <td>{l.voltage} V</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button className="button" onClick={() => setDialog(null)}>
                {t("Cancel")}
              </button>
              <button
                className="button primary"
                disabled={
                  preview.errors.length > 0 || importBusy || mappingDirty
                }
                onClick={() => void applyImport()}
              >
                {t("Apply import")}
              </button>
            </div>
          </Modal>
        )}
        {dialog === "commands" && (
          <Modal title={t("Search")} onClose={() => setDialog(null)}>
            <div className="modal-body">
              <div className="search-field large">
                <Search size={19} />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("Search tools, loads and pages")}
                />
              </div>
              <div className="command-results">
                {routes
                  .filter(
                    (r) =>
                      t(r.label).toLowerCase().includes(query.toLowerCase()) ||
                      r.label.toLowerCase().includes(query.toLowerCase()),
                  )
                  .map((r) => (
                    <button key={r.id} onClick={() => go(r.id)}>
                      <r.icon size={17} />
                      {t(r.label)}
                      <ChevronRight size={14} />
                    </button>
                  ))}
                {query &&
                  tools
                    .filter((tool) =>
                      [tool.title, tool.id]
                        .join(" ")
                        .toLowerCase()
                        .includes(query.toLowerCase()),
                    )
                    .slice(0, 8)
                    .map((tool) => (
                      <button
                        key={tool.id}
                        onClick={() => {
                          setToolId(tool.id);
                          go("tools");
                        }}
                      >
                        <Calculator size={17} />
                        {tool.id} · {tool.title}
                        <ChevronRight size={14} />
                      </button>
                    ))}
                {query &&
                  project.loads
                    .filter((l) =>
                      l.name.toLowerCase().includes(query.toLowerCase()),
                    )
                    .slice(0, 8)
                    .map((l) => (
                      <button
                        key={l.id}
                        onClick={() => {
                          setSelected(l.id);
                          go("loads");
                        }}
                      >
                        <Zap size={17} />
                        {l.name}
                        <ChevronRight size={14} />
                      </button>
                    ))}
                {!!query &&
                  [
                    ...project.boards.map((row) => ({
                      ...row,
                      route: "boards",
                    })),
                    ...project.circuits.map((row) => ({
                      ...row,
                      route: "boards",
                    })),
                    ...(project.sources ?? []).map((row) => ({
                      ...row,
                      route: "motors",
                    })),
                    ...(project.equipmentLibrary ?? []).map((row) => ({
                      ...row,
                      route: "library",
                    })),
                  ]
                    .filter((row) =>
                      row.name
                        .toLocaleLowerCase()
                        .includes(query.toLocaleLowerCase()),
                    )
                    .slice(0, 12)
                    .map((row) => (
                      <button
                        key={row.id}
                        onClick={() => {
                          setSelected(row.id);
                          go(row.route);
                        }}
                      >
                        <Network size={17} />
                        {row.name}
                        <ChevronRight size={14} />
                      </button>
                    ))}
              </div>
            </div>
          </Modal>
        )}
      </div>
    </LanguageContext.Provider>
  );
}
function ProjectSettings({
  project,
  change,
}: {
  project: Project;
  change: (mutator: (p: Project) => void) => void;
}) {
  const [draft, setDraft] = useState(structuredClone(project));
  const [unsavedInput, setUnsavedInput] = useState(false);
  const [error, setError] = useState("");
  const locale = useContextLocale();
  const t = (s: string) => translate(s, locale);
  useUpdateGuard(unsavedInput, t("Project settings"));
  return (
    <form
      className="panel panel-pad"
      onChangeCapture={() => setUnsavedInput(true)}
      onSubmit={(e) => {
        e.preventDefault();
        const v = validateProjectImport(draft);
        if (!v.valid) {
          setError(v.errors.join(" "));
          return;
        }
        change((p) => {
          p.name = draft.name;
          p.context = draft.context;
          p.currency = draft.currency;
          p.timezone = draft.timezone;
          p.jurisdiction = draft.jurisdiction;
          p.supply = draft.supply;
          p.coincidence = draft.coincidence;
          p.growthPercent = draft.growthPercent;
          p.notes = draft.notes;
        });
        setError("");
        setUnsavedInput(false);
      }}
    >
      <h3>{t("Project settings")}</h3>
      <div className="form-grid three">
        <Field label={t("Project name")}>
          <input
            required
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
        </Field>
        <Field label={t("Context")}>
          <select
            value={draft.context}
            onChange={(e) => setDraft({ ...draft, context: e.target.value })}
          >
            {[
              "Residential",
              "Commercial",
              "Workshop",
              "Industrial",
              "Agricultural",
              "Community",
            ].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label={t("Currency")}>
          <select
            value={draft.currency}
            onChange={(e) => setDraft({ ...draft, currency: e.target.value })}
          >
            {["EUR", "NGN", "USD", "GBP", "JPY", "KWD"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label={t("Timezone")}>
          <input
            required
            value={draft.timezone}
            onChange={(e) => setDraft({ ...draft, timezone: e.target.value })}
          />
        </Field>
        <Field label={t("Jurisdiction")}>
          <input
            value={draft.jurisdiction}
            onChange={(e) =>
              setDraft({ ...draft, jurisdiction: e.target.value })
            }
          />
        </Field>
        {[
          ["voltageLN", "L–N voltage", "V"],
          ["voltageLL", "L–L voltage", "V"],
          ["frequency", "Frequency", "Hz"],
          ["limitA", "Supply limit", "A"],
        ].map(([key, label, unit]) => (
          <Field key={key} label={t(label)} unit={unit}>
            <LocaleNumberInput
              required
              min={0.01}
              value={draft.supply[key as keyof typeof draft.supply]}
              onValueChange={(value) =>
                setDraft({
                  ...draft,
                  supply: { ...draft.supply, [key]: value },
                })
              }
            />
          </Field>
        ))}
        <Field label={t("Coincidence factor")} unit="0–1">
          <LocaleNumberInput
            required
            min={0}
            max={1}
            value={draft.coincidence}
            onValueChange={(value) =>
              setDraft({ ...draft, coincidence: value })
            }
          />
        </Field>
        <Field label={t("Growth allowance")} unit="%">
          <LocaleNumberInput
            required
            min={0}
            value={draft.growthPercent}
            onValueChange={(value) =>
              setDraft({ ...draft, growthPercent: value })
            }
          />
        </Field>
      </div>
      <Field label={t("Notes")}>
        <textarea
          rows={3}
          value={draft.notes}
          onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
        />
      </Field>
      {error && (
        <p role="alert" className="error-text">
          {error}
        </p>
      )}
      <button className="button primary">
        <Save size={16} />
        {t("Save")}
      </button>
    </form>
  );
}
import { useContext } from "react";
function useContextLocale() {
  return useContext(LanguageContext);
}
