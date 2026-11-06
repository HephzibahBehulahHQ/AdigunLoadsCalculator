import {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { CalculationResult, Project } from "../domain/types";
import { LanguageContext, numberFormat, useT, type Locale } from "../i18n";
import {
  applyProposal,
  runLocalCommand,
  type LocalResponse,
  type Proposal,
} from "./adapter";
import "./bot.css";
import {
  botSessions as sessions,
  nextBotMessageId,
  type BotMessage as Message,
} from "./sessionState";
import {
  clampBotGeometry,
  readBotWindowState,
  writeBotWindowState,
  type BotGeometry,
} from "./windowState";
export { resetBotWindowState } from "./windowState";

export interface LocalBotProps {
  project: Project;
  result: CalculationResult;
  selectedId?: string;
  onChange: (mutator: (draft: Project) => void) => void | boolean;
  onClose: () => void;
  onReport: () => void;
}
type Geometry = BotGeometry;

const text: Record<string, [string, string, string]> = {
  "Deterministic tools. No external AI connection.": [
    "Deterministische Werkzeuge. Keine externe KI-Verbindung.",
    "Irinṣẹ́ ìṣírò pàtó. Kò sí ìsopọ̀ AI òde.",
    "Na fixed calculation tools. No external AI connection.",
  ],
  "Save project keeps this conversation and unfinished command.": [
    "Projekt speichern bewahrt diesen Verlauf und den unfertigen Befehl.",
    "Fi iṣẹ́ pamọ́ yóò pa ìjíròrò àti àṣẹ tí kò parí mọ́.",
    "Save project go keep this chat and command wey never finish.",
  ],
  "Local assistant controls": [
    "Lokale Assistentensteuerung",
    "Ètò olùrànlọ́wọ́ abẹ́lé",
    "Local assistant controls",
  ],
  "Move window with arrow keys; Home centers it.": [
    "Fenster mit Pfeiltasten verschieben; Pos1 zentriert es.",
    "Lo kọ́kọ́rọ́ ọfà láti gbé fèrèsé; Home yóò fi sí àárín.",
    "Use arrow keys move window; Home go center am.",
  ],
  "Center window": [
    "Fenster zentrieren",
    "Gbé fèrèsé sí àárín",
    "Center window",
  ],
  "Resize larger": ["Vergrößern", "Mú un tóbi", "Make am bigger"],
  "Resize smaller": ["Verkleinern", "Mú un kéré", "Make am smaller"],
  "Live assistance": [
    "Laufende Unterstützung",
    "Ìrànlọ́wọ́ aláṣiṣẹ́",
    "Live assistance",
  ],
  Off: ["Aus", "Pa", "Off"],
  Quiet: ["Leise", "Dákẹ́", "Quiet"],
  Standard: ["Standard", "Boṣewa", "Standard"],
  Proactive: ["Proaktiv", "Ṣáájú", "Proactive"],
  "I can explain this project, list missing inputs, preview phase balancing, or open the real report exporter.":
    [
      "Ich kann dieses Projekt erklären, fehlende Eingaben auflisten, einen Phasenausgleich vorschlagen oder den tatsächlichen Berichtsexport öffnen.",
      "Mo lè ṣàlàyé iṣẹ́ yìí, fi ohun tó kù hàn, ṣàyẹ̀wò ìdọ́gba fásì, tàbí ṣí ìròyìn.",
      "I fit explain this project, show missing inputs, preview phase balance or open the real report export.",
    ],
  "Typed load command": [
    "Strukturierter Lastbefehl",
    "Àṣẹ ẹrù tí a kọ",
    "Typed load command",
  ],
  "All proposals require your confirmation.": [
    "Alle Vorschläge benötigen Ihre Bestätigung.",
    "Gbogbo àbá nílò ìfọwọ́sí rẹ.",
    "You must confirm every proposal.",
  ],
  "Review proposal": ["Vorschlag prüfen", "Ṣàyẹ̀wò àbá", "Review proposal"],
  "Apply confirmed changes": [
    "Bestätigte Änderungen anwenden",
    "Lo àtúnṣe tí o fọwọ́ sí",
    "Apply changes you confirm",
  ],
  Dismiss: ["Verwerfen", "Kọ̀", "Dismiss"],
  "Applied through project history. Use Undo to restore.": [
    "Über den Projektverlauf angewendet. Mit Rückgängig wiederherstellen.",
    "A ti lo àtúnṣe sí ìtàn iṣẹ́. Lo Dápadà láti mú padà.",
    "Changes don enter project history. Use Undo to restore.",
  ],
  "This preview is stale. Request a new one.": [
    "Diese Vorschau ist veraltet. Fordern Sie eine neue an.",
    "Àbá yìí ti kọjá. Béèrè tuntun.",
    "This preview don old. Ask for new one.",
  ],
  "No certified installation approval is produced.": [
    "Keine zertifizierte Freigabe der Installation.",
    "Èyí kì í ṣe ìfọwọ́sí ìfìsí iná.",
    "This one no be certified installation approval.",
  ],
  "Local command failed": [
    "Lokaler Befehl fehlgeschlagen",
    "Àṣẹ abẹ́lé kùnà",
    "Local command no work",
  ],
  "Response copied": ["Antwort kopiert", "A da èsì kọ", "Response copied"],
  "Copy failed": ["Kopieren fehlgeschlagen", "Dídàkọ kùnà", "Copy no work"],
  "Copy response": ["Antwort kopieren", "Da ìdáhùn kọ", "Copy response"],
  "No supported command found. Choose an action below.": [
    "Kein unterstützter Befehl gefunden. Wählen Sie eine Aktion unten.",
    "A kò rí àṣẹ tó bá mu. Yan ìṣe ní ìsàlẹ̀.",
    "No supported command match. Choose one action below.",
  ],
  "Open report exporter": [
    "Berichtsexport öffnen",
    "Ṣí irinṣẹ́ ìròyìn",
    "Open report exporter",
  ],
  "Current project inputs": [
    "Aktuelle Projekteingaben",
    "Àwọn ìwọlé iṣẹ́ lọ́wọ́lọ́wọ́",
    "Current project inputs",
  ],
  "Circuit checks and manufacturer evidence remain separate.": [
    "Stromkreisprüfungen und Herstellernachweise bleiben separat.",
    "Ìṣàyẹ̀wò àyíká àti ẹ̀rí olùṣe nílò ìtọ́jú wọn.",
    "Circuit checks and manufacturer evidence still need separate review.",
  ],
  "Technical diagnostic": [
    "Technischer Hinweis",
    "Àlàyé ìmọ̀ ẹ̀rọ",
    "Technical diagnostic",
  ],
  "Project data changed. Recheck the current issues before applying an older proposal.":
    [
      "Projektdaten geändert. Prüfen Sie aktuelle Hinweise, bevor Sie einen älteren Vorschlag anwenden.",
      "Àwọn ìwọlé iṣẹ́ yí padà. Ṣàyẹ̀wò àwọn ìṣòro lọ́wọ́lọ́wọ́.",
      "Project data don change. Check current issues before you apply old proposal.",
    ],
  "Confirm clear session history?": [
    "Sitzungsverlauf wirklich löschen?",
    "Ṣé kí a pa ìtàn ìgbà yìí rẹ́?",
    "You confirm make we clear session history?",
  ],
  "Cancel pending command": [
    "Ausstehenden Befehl abbrechen",
    "Fagilé àṣẹ tó ń dúró",
    "Cancel pending command",
  ],
  Working: ["Wird bearbeitet", "Ń ṣiṣẹ́", "Working"],
  "Preview defaults: one single-phase unit on L1, start 08:00, duty 1, utilization 1. Review before applying.":
    [
      "Vorschauannahmen: ein einphasiges Gerät an L1, Start 08:00, Tastgrad 1, Auslastung 1. Vor Übernahme prüfen.",
      "Àwọn èrò àbá: ohun èlò fásì kan lórí L1, ìbẹ̀rẹ̀ 08:00, duty 1, ìlò 1. Ṣàyẹ̀wò kí o tó lò ó.",
      "Preview defaults: one single-phase unit for L1, start 08:00, duty 1, utilization 1. Review before apply.",
    ],
};
function local(key: string, locale: Locale): string {
  return locale === "en"
    ? key
    : (text[key]?.[locale === "de" ? 0 : locale === "yo" ? 1 : 2] ?? key);
}
function clampGeometry(g: Geometry): Geometry {
  return clampBotGeometry(g, {
    width: window.innerWidth,
    height: window.innerHeight,
  });
}

export default function LocalBot({
  project,
  result,
  selectedId,
  onChange,
  onClose,
  onReport,
}: LocalBotProps) {
  const t = useT();
  const locale = useContext(LanguageContext);
  const l = (key: string) => local(key, locale);
  const { messages, draft: input } = useSyncExternalStore(
    useCallback(
      (listener) => sessions.subscribe(project.id, listener),
      [project.id],
    ),
    useCallback(() => sessions.get(project.id), [project.id]),
  );
  const setMessages = useCallback(
    (value: Message[] | ((previous: Message[]) => Message[])) =>
      sessions.setMessages(project.id, value),
    [project.id],
  );
  const setInput = (value: string) => sessions.setDraft(project.id, value);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [initialWindow] = useState(() => readBotWindowState());
  const [geometry, setGeometry] = useState(initialWindow.geometry);
  const [minimized, setMinimized] = useState(initialWindow.minimized);
  const [maximized, setMaximized] = useState(initialWindow.maximized);
  const [live, setLive] = useState<"off" | "quiet" | "standard" | "proactive">(
    "quiet",
  );
  const [viewport, setViewport] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const drag = useRef<{ x: number; y: number; geometry: Geometry } | null>(
    null,
  );
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const commandId = useRef(0);
  const latest = useRef({ project, selectedId });
  latest.current = { project, selectedId };
  const windowRef = useRef<HTMLElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const returnFocus = useRef(
    document.activeElement instanceof HTMLElement &&
      document.activeElement !== document.body
      ? document.activeElement
      : null,
  );
  const composing = useRef(false);
  const log = useRef<HTMLDivElement>(null);
  const lastSuggestion = useRef(0);
  const lastSeenRevision = useRef(project.revision);
  const firstProject = useRef(project.id);
  const format = (value: number, digits = 2) =>
    Number.isFinite(value) ? numberFormat(value, digits, locale) : "—";

  useEffect(() => {
    if (!windowRef.current?.closest("[inert]"))
      (composerRef.current ?? headerRef.current)?.focus({
        preventScroll: true,
      });
  }, []);

  const close = () => {
    const botWindow = windowRef.current;
    onClose();
    requestAnimationFrame(() => {
      const active = document.activeElement;
      if (
        active instanceof HTMLElement &&
        active !== document.body &&
        active !== document.documentElement &&
        !botWindow?.contains(active)
      )
        return;
      const candidates = [
        returnFocus.current,
        document.querySelector<HTMLButtonElement>(".bot-launcher"),
      ];
      candidates
        .find(
          (target) =>
            target?.isConnected &&
            !target.closest("[inert]") &&
            !target.matches(":disabled") &&
            target.getClientRects().length > 0,
        )
        ?.focus({ preventScroll: true });
    });
  };

  useEffect(() => {
    if (firstProject.current !== project.id) {
      firstProject.current = project.id;
      setError("");
      commandId.current++;
      if (timer.current) clearTimeout(timer.current);
      setBusy(false);
      lastSeenRevision.current = project.revision;
    }
  }, [project.id, project.revision]);
  useEffect(() => {
    const restored = (event: Event) => {
      if (
        (event as CustomEvent<{ projectId: string }>).detail.projectId !==
        project.id
      )
        return;
      commandId.current++;
      if (timer.current) clearTimeout(timer.current);
      setBusy(false);
      setError("");
    };
    window.addEventListener("powerlab-bot-session-restored", restored);
    return () =>
      window.removeEventListener("powerlab-bot-session-restored", restored);
  }, [project.id]);
  useEffect(() => {
    writeBotWindowState({ geometry, minimized, maximized });
  }, [geometry, minimized, maximized]);
  useEffect(() => {
    const resize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
      setGeometry((previous) => clampGeometry(previous));
    };
    const move = (event: PointerEvent) => {
      if (drag.current)
        setGeometry(
          clampGeometry({
            ...drag.current.geometry,
            x: drag.current.geometry.x + event.clientX - drag.current.x,
            y: drag.current.geometry.y + event.clientY - drag.current.y,
          }),
        );
    };
    const end = () => {
      drag.current = null;
    };
    const reset = () => {
      const state = readBotWindowState({ getItem: () => null });
      setGeometry(state.geometry);
      setMinimized(false);
      setMaximized(false);
    };
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("powerlab-bot-reset", reset);
    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("powerlab-bot-reset", reset);
      commandId.current++;
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);
  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight });
  }, [messages, minimized]);
  useEffect(() => {
    if (
      live === "off" ||
      live === "quiet" ||
      input.trim() ||
      project.revision === lastSeenRevision.current
    )
      return;
    const current = project.revision;
    const timeout = setTimeout(() => {
      if (
        Date.now() - lastSuggestion.current <
        (live === "proactive" ? 20000 : 30000)
      )
        return;
      if (
        latest.current.project.id !== project.id ||
        latest.current.project.revision !== current ||
        !result.issues.length
      )
        return;
      lastSuggestion.current = Date.now();
      lastSeenRevision.current = current;
      setMessages((previous) => [
        ...previous,
        {
          id: nextBotMessageId(project.id),
          role: "assistant",
          response: runLocalCommand(latest.current.project, "issues"),
        },
      ]);
    }, 1000);
    return () => clearTimeout(timeout);
  }, [project.revision, project.id, live, input, result.issues.length]);

  const send = (quickCommand?: string) => {
    const command = quickCommand ?? input;
    if (!command.trim() || busy) return;
    if (quickCommand === undefined) setInput("");
    setError("");
    setBusy(true);
    const id = ++commandId.current;
    const captured = { project: structuredClone(project), selectedId };
    const userId = nextBotMessageId(project.id);
    setMessages((previous) => [
      ...previous,
      { id: userId, role: "user", text: command.trim() },
    ]);
    timer.current = setTimeout(() => {
      if (
        id !== commandId.current ||
        latest.current.project.id !== captured.project.id
      )
        return;
      try {
        const response = runLocalCommand(
          captured.project,
          command,
          captured.selectedId,
        );
        const responseId = nextBotMessageId(captured.project.id);
        if (id === commandId.current)
          setMessages((previous) => [
            ...previous,
            { id: responseId, role: "assistant", response },
          ]);
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : l("Local command failed"),
        );
      } finally {
        if (id === commandId.current) setBusy(false);
      }
    }, 0);
  };
  const apply = (proposal: Proposal, messageId: number) => {
    try {
      if (
        project.id !== proposal.projectId ||
        project.revision !== proposal.revision
      )
        throw new Error(l("This preview is stale. Request a new one."));
      const accepted = onChange((draft) => applyProposal(draft, proposal));
      if (accepted === false)
        throw new Error(l("This preview is stale. Request a new one."));
      setMessages((previous) =>
        previous.map((message) =>
          message.id === messageId ? { ...message, applied: true } : message,
        ),
      );
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : l("Local command failed"),
      );
    }
  };
  const startDrag = (event: ReactPointerEvent) => {
    if (
      maximized ||
      viewport.width < 600 ||
      (event.target as HTMLElement).closest("button,details,summary")
    )
      return;
    drag.current = { x: event.clientX, y: event.clientY, geometry };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const mobile = viewport.width < 600;
  const style: CSSProperties =
    maximized || mobile
      ? {
          left: 8,
          top: 8,
          width: viewport.width - 16,
          height: minimized ? 56 : viewport.height - 16,
        }
      : {
          left: geometry.x,
          top: geometry.y,
          width: geometry.width,
          height: minimized ? 56 : geometry.height,
        };
  const summary = (response: LocalResponse) => (
    <dl className="bot-metrics">
      <div>
        <dt>{t("Design demand")}</dt>
        <dd>{format(response.result.designKW)} kW</dd>
      </div>
      <div>
        <dt>{t("Daily energy")}</dt>
        <dd>{format(response.result.dailyKWh)} kWh</dd>
      </div>
      <div>
        <dt>{t("Apparent power")}</dt>
        <dd>{format(response.result.apparentKVA)} kVA</dd>
      </div>
      <div>
        <dt>{t("Issues")}</dt>
        <dd>{response.result.issues.length}</dd>
      </div>
    </dl>
  );
  const renderResponse = (message: Message) => {
    const response = message.response!;
    const proposal = response.proposal;
    const stale =
      message.restored ||
      response.projectId !== project.id ||
      response.revision !== project.revision;
    return (
      <>
        <div className="bot-message-meta">
          Adigun BOT · {t("Revision")} {response.revision}
        </div>
        {(response.kind === "summary" || response.kind === "report") && (
          <>
            {summary(response)}
            <p>{t("All results use entered assumptions.")}</p>
          </>
        )}
        {response.kind === "explain" && (
          <>
            {response.selectedLoad && (
              <p>
                <strong>{response.selectedLoad.name}</strong> ·{" "}
                {response.selectedLoad.rating} {response.selectedLoad.entryMode}{" "}
                · {response.selectedLoad.voltage} V · PF{" "}
                {response.selectedLoad.pf} · ×{response.selectedLoad.quantity}
              </p>
            )}
            {summary(response)}
            <p className="bot-formula">{t(response.result.trace.formula)}</p>
            <p>
              {l("Circuit checks and manufacturer evidence remain separate.")}
            </p>
            <a
              href="https://www.electrical-installation.org/enwiki/Estimation_of_actual_maximum_kVA_demand"
              target="_blank"
              rel="noopener noreferrer"
            >
              Schneider Electric · {t("Sources")}
            </a>
          </>
        )}
        {response.kind === "issues" && (
          <>
            {response.issues?.length ? (
              <ul>
                {response.issues.map((issue) => (
                  <li key={issue.id}>
                    <strong>{t("Incomplete")}: </strong>
                    {t(issue.message)}
                  </li>
                ))}
              </ul>
            ) : (
              <p>{t("No unresolved issues")}</p>
            )}
            <p>{l("No certified installation approval is produced.")}</p>
          </>
        )}
        {response.kind === "report" && (
          <button className="button" onClick={onReport}>
            {l("Open report exporter")}
          </button>
        )}
        {proposal && (
          <div className="bot-proposal">
            <strong>{l("Review proposal")}</strong>
            {proposal.kind === "balance" ? (
              <>
                <p>
                  {t("Before")}: {format(proposal.plan.beforeImbalance)}% →{" "}
                  {t("After")}: {format(proposal.plan.afterImbalance)}%
                </p>
                {proposal.plan.moves.length ? (
                  <ul>
                    {proposal.plan.moves.map((move) => (
                      <li key={move.loadId}>
                        {project.loads.find((load) => load.id === move.loadId)
                          ?.name ?? move.loadId}
                        : {move.from} → {move.to}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>{t("No phase moves required")}</p>
                )}
              </>
            ) : (
              <>
                <p>
                  {proposal.load.name} · {proposal.load.rating} kW ·{" "}
                  {proposal.load.voltage} V · PF {proposal.load.pf} ·{" "}
                  {proposal.load.hoursPerDay} h
                </p>
                <p>
                  {l(
                    "Preview defaults: one single-phase unit on L1, start 08:00, duty 1, utilization 1. Review before applying.",
                  )}
                </p>
                <p>
                  {t("Design demand")}: {format(proposal.beforeKW)} →{" "}
                  {format(proposal.afterKW)} kW
                </p>
              </>
            )}
            {message.applied ? (
              <p role="status">
                {l("Applied through project history. Use Undo to restore.")}
              </p>
            ) : message.dismissed ? (
              <p>{l("Dismiss")}</p>
            ) : stale ? (
              <p className="bot-stale">
                {l("This preview is stale. Request a new one.")}
              </p>
            ) : (
              <div className="bot-actions">
                <button
                  className="button"
                  disabled={
                    proposal.kind === "balance" &&
                    proposal.plan.moves.length === 0
                  }
                  onClick={() => apply(proposal, message.id)}
                >
                  {l("Apply confirmed changes")}
                </button>
                <button
                  className="button secondary"
                  onClick={() =>
                    setMessages((previous) =>
                      previous.map((item) =>
                        item.id === message.id
                          ? { ...item, dismissed: true }
                          : item,
                      ),
                    )
                  }
                >
                  {l("Dismiss")}
                </button>
              </div>
            )}
          </div>
        )}
        {response.kind === "help" && (
          <>
            <p>{l("No supported command found. Choose an action below.")}</p>
            <p>{l("Typed load command")}:</p>
            <code>load: Heater; 2.3 kW; 230 V; PF 1; 8 h</code>
            <p>{l("All proposals require your confirmation.")}</p>
          </>
        )}
        <button
          className="bot-copy"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(
                JSON.stringify(response, null, 2),
              );
              setError("");
            } catch {
              setError(l("Copy failed"));
            }
          }}
        >
          {l("Copy response")}
        </button>
      </>
    );
  };

  return (
    <section
      ref={windowRef}
      className={`local-bot ${minimized ? "is-minimized" : ""}`}
      style={style}
      aria-label="Adigun BOT"
      role="region"
      onKeyDown={(event) => {
        if (
          event.key === "Escape" &&
          !event.defaultPrevented &&
          !composing.current &&
          !event.nativeEvent.isComposing &&
          event.nativeEvent.keyCode !== 229
        ) {
          event.preventDefault();
          event.stopPropagation();
          close();
        }
      }}
    >
      <header
        ref={headerRef}
        className="bot-header"
        onPointerDown={startDrag}
        tabIndex={0}
        title={l("Move window with arrow keys; Home centers it.")}
        aria-label={l("Move window with arrow keys; Home centers it.")}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget || maximized || mobile)
            return;
          const step = event.shiftKey ? 40 : 10;
          if (
            ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(
              event.key,
            )
          ) {
            event.preventDefault();
            setGeometry((previous) =>
              clampGeometry({
                ...previous,
                x:
                  previous.x +
                  (event.key === "ArrowRight"
                    ? step
                    : event.key === "ArrowLeft"
                      ? -step
                      : 0),
                y:
                  previous.y +
                  (event.key === "ArrowDown"
                    ? step
                    : event.key === "ArrowUp"
                      ? -step
                      : 0),
              }),
            );
          }
          if (event.key === "Home") {
            event.preventDefault();
            setGeometry((previous) =>
              clampGeometry({
                ...previous,
                x: (viewport.width - previous.width) / 2,
                y: (viewport.height - previous.height) / 2,
              }),
            );
          }
        }}
      >
        <div className="bot-title">
          <span className="bot-symbol" aria-hidden="true">
            ✦
          </span>
          <span>
            <strong>Adigun BOT</strong>
            <small>{t("Local engineering help")}</small>
          </span>
        </div>
        <div className="bot-window-actions">
          <button
            className="icon-button"
            title={minimized ? t("Restore") : t("Minimize")}
            aria-label={minimized ? t("Restore") : t("Minimize")}
            onClick={() => setMinimized(!minimized)}
          >
            −
          </button>
          <button
            className="icon-button"
            title={maximized ? t("Restore") : t("Maximize")}
            aria-label={maximized ? t("Restore") : t("Maximize")}
            onClick={() => {
              setMinimized(false);
              setMaximized(!maximized);
            }}
          >
            □
          </button>
          <button
            className="icon-button"
            title={t("Close")}
            aria-label={t("Close")}
            onClick={close}
          >
            ×
          </button>
        </div>
      </header>
      {!minimized && (
        <>
          <div className="bot-mode">
            <span className="bot-mode-dot" aria-hidden="true" />
            {l("Deterministic tools. No external AI connection.")}
          </div>
          <details className="bot-settings">
            <summary>{l("Local assistant controls")}</summary>
            <div className="bot-settings-content">
              <label>
                {l("Live assistance")}
                <select
                  aria-label={l("Live assistance")}
                  value={live}
                  onChange={(event) =>
                    setLive(event.target.value as typeof live)
                  }
                >
                  {(["off", "quiet", "standard", "proactive"] as const).map(
                    (mode) => (
                      <option key={mode} value={mode}>
                        {l(mode[0].toUpperCase() + mode.slice(1))}
                      </option>
                    ),
                  )}
                </select>
              </label>
              <div className="bot-actions">
                <button
                  className="button secondary"
                  onClick={() => {
                    setMaximized(false);
                    setGeometry(
                      clampGeometry({
                        ...geometry,
                        x: (viewport.width - geometry.width) / 2,
                        y: (viewport.height - geometry.height) / 2,
                      }),
                    );
                  }}
                >
                  {l("Center window")}
                </button>
                <button
                  className="button secondary"
                  onClick={() =>
                    setGeometry((previous) =>
                      clampGeometry({
                        ...previous,
                        width: previous.width + 40,
                        height: previous.height + 40,
                      }),
                    )
                  }
                >
                  {l("Resize larger")}
                </button>
                <button
                  className="button secondary"
                  onClick={() =>
                    setGeometry((previous) =>
                      clampGeometry({
                        ...previous,
                        width: previous.width - 40,
                        height: previous.height - 40,
                      }),
                    )
                  }
                >
                  {l("Resize smaller")}
                </button>
                <button
                  className="button secondary"
                  onClick={() => {
                    if (window.confirm(l("Confirm clear session history?")))
                      setMessages([]);
                  }}
                >
                  {t("Clear history")}
                </button>
              </div>
            </div>
          </details>
          <div
            className="bot-log"
            ref={log}
            role="log"
            aria-live="polite"
            aria-relevant="additions text"
          >
            <div className="bot-intro">
              <strong>{t("Local engineering help")}</strong>
              <p>
                {l(
                  "I can explain this project, list missing inputs, preview phase balancing, or open the real report exporter.",
                )}
              </p>
              <small>
                {l(
                  "Save project keeps this conversation and unfinished command.",
                )}
              </small>
            </div>
            {messages.map((message) => (
              <article
                key={message.id}
                className={`bot-message ${message.role}`}
              >
                {message.text ?? renderResponse(message)}
              </article>
            ))}
          </div>
          <div className="bot-quick-actions">
            <button onClick={() => send("summary")} disabled={busy}>
              {t("Overview")}
            </button>
            <button onClick={() => send("explain")} disabled={busy}>
              {t("Explain my results")}
            </button>
            <button onClick={() => send("issues")} disabled={busy}>
              {t("Check missing inputs")}
            </button>
            <button onClick={() => send("balance")} disabled={busy}>
              {t("Balance phases")}
            </button>
          </div>
          {error && (
            <p className="bot-error" role="alert">
              {t(error)}
            </p>
          )}
          <form
            className="bot-composer"
            onSubmit={(event) => {
              event.preventDefault();
              send();
            }}
          >
            <textarea
              ref={composerRef}
              className="field"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={t("Ask about your project")}
              aria-label={t("Ask about your project")}
              rows={2}
              maxLength={2000}
              onBlur={() => {
                composing.current = false;
              }}
              onCompositionStart={() => {
                composing.current = true;
              }}
              onCompositionEnd={() => {
                composing.current = false;
              }}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey &&
                  !composing.current &&
                  !event.nativeEvent.isComposing &&
                  event.nativeEvent.keyCode !== 229
                ) {
                  event.preventDefault();
                  send();
                }
              }}
            />
            {busy ? (
              <button
                className="button"
                type="button"
                aria-label={l("Cancel pending command")}
                onClick={() => {
                  commandId.current++;
                  if (timer.current) clearTimeout(timer.current);
                  setBusy(false);
                }}
              >
                {t("Cancel")}
              </button>
            ) : (
              <button className="button" type="submit" disabled={!input.trim()}>
                {t("Send")}
              </button>
            )}
          </form>
        </>
      )}
    </section>
  );
}

export { LocalBot };
