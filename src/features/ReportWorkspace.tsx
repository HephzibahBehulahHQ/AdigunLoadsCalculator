import { useEffect, useMemo, useRef, useState } from "react";
import { Download, FileText, Printer, RefreshCw } from "lucide-react";
import type { CalculationResult, Project } from "../domain/types";
import { useT, numberFormat, type Locale } from "../i18n";
import { parseLocaleNumber, formatEditableNumber } from "../i18n/numbers";
import { Field } from "./ui";
import { downloadFile, safeName } from "../import-export/files";
import {
  calculateBill,
  createEngineeringPdf,
  currencyDigits,
  decimalInteger,
  type BillDocument,
  type BillLine,
  type EngineeringReportSection,
} from "../import-export/reports";
import {
  deriveBOM,
  bomCsv,
  pricedBOMLines,
  type BOMPricing,
} from "../import-export/bom";
import {
  freezeReportSnapshot,
  reportSnapshotJson,
  type ReportContext,
  type ReportSnapshot,
} from "../import-export/reportSnapshot";
import {
  REPORT_SECTIONS,
  reportBlocks,
  type ReportBlock,
} from "../import-export/reportSections";
import {
  circuitScheduleCsv,
  reportSeriesCsv,
  scenarioComparisonCsv,
} from "../import-export/scenarioExports";
import { loadBillingDocument, saveBillingDocument } from "../storage/billing";
import { readMeasurements } from "../storage/measurements";
import { buildDiagramSnapshot, diagramSVG } from "../commands/diagram";

const blankDetails = {
  reference: "",
  preparedBy: "",
  customer: "",
  scopeNotes: "",
};
const initialSections: EngineeringReportSection[] = [
  "summary",
  "loads",
  "boards",
  "circuits",
  "issues",
  "trace",
];
function emptyBill(project: Project, locale: Locale): BillDocument {
  return {
    schemaVersion: 1,
    projectName: project.name,
    currency: project.currency,
    locale,
    kind: "estimate",
    number: "",
    date: new Date().toISOString().slice(0, 10),
    dueDate: "",
    seller: "",
    sellerTaxId: "",
    customer: "",
    customerReference: "",
    notes: "",
    paymentDetails: "",
    discountPercent: "0",
    taxPercent: "0",
    lines: [],
  };
}
const minorDecimal = (value: number | bigint, digits: number) => {
  const n = BigInt(value),
    scale = 10n ** BigInt(digits);
  return digits
    ? `${n / scale}.${String(n % scale).padStart(digits, "0")}`
    : String(n);
};

export function ReportWorkspace({
  project,
  result,
  locale,
  context,
  onDetailsChange,
  onOpenBilling,
}: {
  project: Project;
  result: CalculationResult;
  locale: Locale;
  context?: ReportContext;
  onDetailsChange: (details: NonNullable<Project["reportDetails"]>) => void;
  onOpenBilling?: () => void;
}) {
  const t = useT(),
    sequence = useRef(0),
    current = useRef({ id: project.id, revision: project.revision });
  current.current = { id: project.id, revision: project.revision };
  const [details, setDetails] = useState(project.reportDetails ?? blankDetails),
    [selected, setSelected] =
      useState<EngineeringReportSection[]>(initialSections),
    [snapshot, setSnapshot] = useState<ReportSnapshot | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [prices, setPrices] = useState<BOMPricing>({}),
    [bomPage, setBomPage] = useState(0),
    [contingency, setContingency] = useState("0"),
    [billPreview, setBillPreview] = useState<BillDocument | null>(null),
    [series, setSeries] = useState<"profile" | "calendar" | "energy" | "ev">(
      "profile",
    );
  const bom = useMemo(() => deriveBOM(project), [project]),
    dirtyDetails =
      JSON.stringify(details) !==
      JSON.stringify(project.reportDetails ?? blankDetails);
  useEffect(() => {
    setDetails(project.reportDetails ?? blankDetails);
    setPrices({});
    setBomPage(0);
    setBillPreview(null);
    let alive = true;
    void loadBillingDocument(project.id)
      .then((bill) => {
        if (!alive || !bill) return;
        const next: BOMPricing = {};
        for (const row of deriveBOM(project).rows) {
          const material = bill.lines.find(
              (line) => line.id === `bom:${project.id}:${row.id}`,
            ),
            labour = bill.lines.find(
              (line) => line.id === `bom-labour:${project.id}:${row.id}`,
            );
          if (material)
            next[row.id] = {
              unitPrice: formatEditableNumber(material.unitPrice, locale),
              wastePercent: formatEditableNumber(
                material.source?.wastePercent ?? "0",
                locale,
              ),
              labourQuantity: formatEditableNumber(
                labour?.quantity ?? "",
                locale,
              ),
              labourRate: formatEditableNumber(labour?.unitPrice ?? "", locale),
            };
        }
        setPrices(next);
      })
      .catch((cause) => {
        if (alive) setError(t((cause as Error).message));
      });
    return () => {
      alive = false;
    };
  }, [project.id]);
  useEffect(() => {
    setDetails(project.reportDetails ?? blankDetails);
  }, [project.reportDetails]);
  useEffect(() => {
    sequence.current++;
    setSnapshot(null);
    setBillPreview(null);
    setBusy(false);
  }, [project.id, project.revision, locale]);
  const blocks = useMemo(
    () =>
      snapshot
        ? selected.map((section) => ({
            section,
            blocks: reportBlocks(snapshot, section),
          }))
        : [],
    [snapshot, selected],
  );
  async function prepare() {
    const ticket = ++sequence.current,
      frozenProject = structuredClone(project),
      frozenResult = structuredClone(result),
      supplied = structuredClone(context ?? {});
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const [measurements, bill] = await Promise.all([
        readMeasurements(project.id),
        loadBillingDocument(project.id),
      ]);
      if (ticket !== sequence.current) return;
      if (measurements)
        supplied.measurements = {
          projectId: project.id,
          savedAt: measurements.saved.savedAt,
          payload: measurements.saved,
        };
      if (bill) supplied.bill = bill;
      supplied.diagram = buildDiagramSnapshot(frozenProject, frozenResult);
      setSnapshot(
        freezeReportSnapshot(frozenProject, frozenResult, {
          locale,
          context: supplied,
        }),
      );
      setMessage(
        t(
          "Report snapshot frozen. Preview and exports use this exact revision.",
        ),
      );
    } catch (cause) {
      if (ticket === sequence.current) setError(t((cause as Error).message));
    } finally {
      if (ticket === sequence.current) setBusy(false);
    }
  }
  async function pdf() {
    if (!snapshot) return;
    const ticket = ++sequence.current;
    setBusy(true);
    setError("");
    try {
      const blob = await createEngineeringPdf(
        snapshot.project,
        snapshot.result,
        { locale: snapshot.locale, sections: [...selected], snapshot },
      );
      if (ticket !== sequence.current) return;
      downloadFile(
        `${safeName(snapshot.project.name)}-r${snapshot.project.revision}-report.pdf`,
        blob,
      );
      setMessage(t("Engineering PDF generated from the reviewed snapshot."));
    } catch (cause) {
      if (ticket === sequence.current) setError(t((cause as Error).message));
    } finally {
      if (ticket === sequence.current) setBusy(false);
    }
  }
  function data(kind: "json" | "circuits" | "scenarios" | "series") {
    if (!snapshot) return;
    try {
      const base = `${safeName(snapshot.project.name)}-r${snapshot.project.revision}`;
      if (kind === "json")
        downloadFile(
          base + "-report-snapshot.json",
          reportSnapshotJson(snapshot),
          "application/json",
        );
      else if (kind === "circuits")
        downloadFile(
          base + "-circuits.csv",
          circuitScheduleCsv(snapshot.project),
          "text/csv;charset=utf-8",
        );
      else if (kind === "scenarios")
        downloadFile(
          base + "-scenarios.csv",
          scenarioComparisonCsv(snapshot, snapshot.context.scenarios ?? []),
          "text/csv;charset=utf-8",
        );
      else
        downloadFile(
          base + `-${series}.csv`,
          reportSeriesCsv(snapshot, series),
          "text/csv;charset=utf-8",
        );
    } catch (cause) {
      setError(t((cause as Error).message));
    }
  }
  function price(
    rowId: string,
    field: keyof BOMPricing[string],
    value: string,
  ) {
    setBillPreview(null);
    setPrices((previous) => ({
      ...previous,
      [rowId]: {
        ...(previous[rowId] ?? {
          unitPrice: "",
          wastePercent: "0",
          labourQuantity: "",
          labourRate: "",
        }),
        [field]: value,
      },
    }));
  }
  function normalizeDecimal(value: string, places: number): string {
    if (!value.trim()) return "";
    const parsed = parseLocaleNumber(value, locale, {
      min: 0,
      allowScientific: false,
      decimalPlaces: places,
    });
    if (!parsed.ok) throw new Error(parsed.message);
    return parsed.canonical;
  }
  async function previewEstimate() {
    const ticket = ++sequence.current;
    setError("");
    setBillPreview(null);
    try {
      const normalized: BOMPricing = {};
      for (const [id, row] of Object.entries(prices))
        normalized[id] = {
          unitPrice: normalizeDecimal(
            row.unitPrice,
            currencyDigits(project.currency),
          ),
          wastePercent: normalizeDecimal(row.wastePercent, 2) || "0",
          labourQuantity: normalizeDecimal(row.labourQuantity, 3),
          labourRate: normalizeDecimal(
            row.labourRate,
            currencyDigits(project.currency),
          ),
        };
      const lines = pricedBOMLines(bom, normalized);
      const total = calculateBill({
        currency: project.currency,
        lines,
        taxPercent: "0",
        discountPercent: "0",
      });
      const rate = decimalInteger(
        normalizeDecimal(contingency, 2) || "0",
        2,
        "Contingency",
      );
      if (rate > 10000n)
        throw new Error("Contingency must be between 0 and 100 percent.");
      if (rate > 0n)
        lines.push({
          id: `bom-contingency:${project.id}`,
          category: "other",
          description: `${t("Entered contingency")} ${contingency}%`,
          quantity: "1",
          unitPrice: minorDecimal(
            (BigInt(total.subtotalMinor) * rate + 5000n) / 10000n,
            total.digits,
          ),
        });
      const existing = await loadBillingDocument(project.id);
      if (ticket !== sequence.current) return;
      if (existing && existing.currency !== project.currency)
        throw new Error(
          "The saved bill uses a different currency. Review that bill before adding model prices.",
        );
      const document = existing ?? emptyBill(project, locale);
      const preserved = document.lines.filter(
        (line) =>
          !line.id.startsWith(`bom:${project.id}:`) &&
          !line.id.startsWith(`bom-labour:${project.id}:`) &&
          line.id !== `bom-contingency:${project.id}`,
      );
      document.lines = [...preserved, ...lines];
      calculateBill(document);
      setBillPreview(document);
    } catch (cause) {
      if (ticket === sequence.current) setError(t((cause as Error).message));
    }
  }
  async function applyEstimate() {
    if (!billPreview) return;
    const ticket = ++sequence.current;
    setBusy(true);
    setError("");
    try {
      await saveBillingDocument(project.id, billPreview);
      if (ticket !== sequence.current) return;
      setBillPreview(null);
      setMessage(
        t(
          "Reviewed model quantities were saved to the customer billing draft.",
        ),
      );
      onOpenBilling?.();
    } catch (cause) {
      if (ticket === sequence.current) setError(t((cause as Error).message));
    } finally {
      if (ticket === sequence.current) setBusy(false);
    }
  }
  function print() {
    if (!snapshot) return;
    document.body.classList.add("engineering-report-print-mode");
    const cleanup = () =>
      document.body.classList.remove("engineering-report-print-mode");
    window.addEventListener("afterprint", cleanup, { once: true });
    try {
      window.print();
    } catch (cause) {
      cleanup();
      setError(t((cause as Error).message));
    }
  }
  return (
    <div className="report-workspace">
      <section className="panel panel-pad report-controls">
        <h2>{t("Report details and sections")}</h2>
        <div className="form-grid">
          <Field label={t("Project reference")}>
            <input
              value={details.reference}
              maxLength={120}
              onChange={(event) =>
                setDetails({ ...details, reference: event.target.value })
              }
            />
          </Field>
          <Field label={t("Prepared by")}>
            <textarea
              value={details.preparedBy}
              maxLength={1000}
              onChange={(event) =>
                setDetails({ ...details, preparedBy: event.target.value })
              }
            />
          </Field>
          <Field label={t("Customer / recipient")}>
            <textarea
              value={details.customer}
              maxLength={1000}
              onChange={(event) =>
                setDetails({ ...details, customer: event.target.value })
              }
            />
          </Field>
          <Field label={t("Report scope and limitations")}>
            <textarea
              value={details.scopeNotes}
              maxLength={4000}
              onChange={(event) =>
                setDetails({ ...details, scopeNotes: event.target.value })
              }
            />
          </Field>
        </div>
        <button
          className="button"
          disabled={!dirtyDetails || busy}
          onClick={() => onDetailsChange({ ...details })}
        >
          {t("Save report details")}
        </button>
        <fieldset>
          <legend>{t("Choose report sections")}</legend>
          <div className="form-grid">
            {REPORT_SECTIONS.map((section) => (
              <label className="check-row" key={section.id}>
                <input
                  type="checkbox"
                  checked={selected.includes(section.id)}
                  disabled={busy}
                  onChange={(event) => {
                    setSelected((previous) =>
                      event.target.checked
                        ? [...previous, section.id]
                        : previous.filter((id) => id !== section.id),
                    );
                    setSnapshot(null);
                  }}
                />
                {t(section.title)}
              </label>
            ))}
          </div>
        </fieldset>
        {dirtyDetails && (
          <p className="muted">
            {t("Save the entered report details before freezing the preview.")}
          </p>
        )}
        <div className="button-row">
          <button
            className="button primary"
            disabled={busy || !selected.length || dirtyDetails}
            onClick={() => void prepare()}
          >
            <RefreshCw size={16} />
            {t("Freeze report preview")}
          </button>
          <button
            className="button"
            disabled={!snapshot || busy}
            onClick={() => void pdf()}
          >
            <FileText size={16} />
            {t("Generate selected PDF")}
          </button>
          <button
            className="button"
            disabled={!snapshot || busy}
            onClick={print}
          >
            <Printer size={16} />
            {t("Print reviewed report")}
          </button>
          <button
            className="button"
            disabled={!snapshot || busy}
            onClick={() => data("json")}
          >
            <Download size={16} />
            {t("Export frozen report data")}
          </button>
        </div>
        <div className="button-row">
          <button
            className="button"
            disabled={!snapshot || busy}
            onClick={() => data("circuits")}
          >
            {t("Export circuit CSV")}
          </button>
          <button
            className="button"
            disabled={!snapshot?.context.scenarios?.length || busy}
            onClick={() => data("scenarios")}
          >
            {t("Export scenario comparison")}
          </button>
          <select
            aria-label={t("Time-series export")}
            value={series}
            onChange={(event) => setSeries(event.target.value as typeof series)}
          >
            <option value="profile">{t("Representative daily profile")}</option>
            <option value="calendar" disabled={!snapshot?.context.calendar}>
              {t("Calendar simulation")}
            </option>
            <option value="energy" disabled={!snapshot?.context.energy}>
              {t("Energy dispatch")}
            </option>
            <option value="ev" disabled={!snapshot?.context.ev}>
              {t("Charging plan")}
            </option>
          </select>
          <button
            className="button"
            disabled={!snapshot || busy}
            onClick={() => data("series")}
          >
            {t("Export selected series")}
          </button>
        </div>
        <p className="small muted">
          {t(
            "Completed simulation evidence is included only for the same project revision. Missing runs remain explicitly unavailable.",
          )}
        </p>
      </section>
      {busy && <p role="status">{t("Preparing report…")}</p>}
      {message && <p role="status">{message}</p>}
      {error && (
        <p className="error-text" role="alert">
          {error}
        </p>
      )}
      {snapshot && (
        <article
          id="engineering-report-preview"
          className="panel panel-pad report-preview"
        >
          <header>
            <span className="eyebrow">AdigunPowerLab · BY HB ELEKTRONIKER</span>
            <h2>{snapshot.project.name}</h2>
            <p>
              {t("Revision")} {snapshot.project.revision} ·{" "}
              {snapshot.result.engineVersion} · {snapshot.generatedAt}
            </p>
            <p>{snapshot.project.reportDetails?.reference}</p>
            <p style={{ whiteSpace: "pre-wrap" }}>
              {snapshot.project.reportDetails?.preparedBy}
            </p>
            <p style={{ whiteSpace: "pre-wrap" }}>
              {snapshot.project.reportDetails?.customer}
            </p>
            <p>{snapshot.project.reportDetails?.scopeNotes}</p>
            <p>
              {snapshot.project.jurisdiction} · {snapshot.project.timezone}
            </p>
          </header>
          {blocks.map((group) => (
            <section key={group.section} className="report-section">
              {group.blocks.map((block, index) => (
                <Block key={index} block={block} />
              ))}
              {group.section === "diagram" && snapshot.context.diagram && (
                <figure>
                  <img
                    style={{ width: "100%", height: "auto" }}
                    src={
                      "data:image/svg+xml;charset=utf-8," +
                      encodeURIComponent(diagramSVG(snapshot.context.diagram))
                    }
                    alt={t(
                      "Model topology overview; the exported PDF includes readable vector tiles and the full object legend.",
                    )}
                  />
                  <figcaption>
                    {t(
                      "Model topology overview; the exported PDF includes readable vector tiles and the full object legend.",
                    )}
                  </figcaption>
                  <Block
                    block={{
                      kind: "table",
                      headers: [t("Object"), t("Name"), t("Entered details")],
                      rows: snapshot.context.diagram.nodes.map((node) => [
                        node.id,
                        node.name,
                        node.detail,
                      ]),
                    }}
                  />
                </figure>
              )}
            </section>
          ))}
        </article>
      )}
      <section className="panel panel-pad report-controls bom-workspace">
        <h2>{t("Model-derived bill of materials")}</h2>
        <p className="muted">
          {t(
            "Only modeled components and entered cable routes are counted. Blank prices stay unpriced; no company or tax details are invented.",
          )}
        </p>
        <div className="button-row">
          <button
            className="button"
            onClick={() =>
              downloadFile(
                `${safeName(project.name)}-r${project.revision}-bom.csv`,
                bomCsv(bom),
                "text/csv;charset=utf-8",
              )
            }
          >
            {t("Export model quantities")}
          </button>
          <button
            className="button"
            disabled={bomPage === 0}
            onClick={() => setBomPage((page) => page - 1)}
          >
            {t("Previous")}
          </button>
          <span>
            {bomPage * 50 + 1}–{Math.min((bomPage + 1) * 50, bom.rows.length)} /{" "}
            {bom.rows.length}
          </span>
          <button
            className="button"
            disabled={(bomPage + 1) * 50 >= bom.rows.length}
            onClick={() => setBomPage((page) => page + 1)}
          >
            {t("Next")}
          </button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t("Item / source")}</th>
                <th>{t("Model quantity")}</th>
                <th>{t("Unit price")}</th>
                <th>{t("Waste (%)")}</th>
                <th>{t("Labour quantity")}</th>
                <th>{t("Labour unit price")}</th>
              </tr>
            </thead>
            <tbody>
              {bom.rows.slice(bomPage * 50, (bomPage + 1) * 50).map((row) => (
                <tr key={row.id}>
                  <td>
                    {row.description}
                    <small className="muted">{row.evidence}</small>
                  </td>
                  <td>
                    {numberFormat(row.quantity, 3, locale)} {t(row.unit)}
                  </td>
                  {(
                    [
                      "unitPrice",
                      "wastePercent",
                      "labourQuantity",
                      "labourRate",
                    ] as const
                  ).map((field) => (
                    <td key={field}>
                      <input
                        type="text"
                        inputMode="decimal"
                        aria-label={`${t(field === "unitPrice" ? "Unit price" : field === "wastePercent" ? "Waste (%)" : field === "labourQuantity" ? "Labour quantity" : "Labour unit price")} — ${row.description}`}
                        maxLength={32}
                        value={
                          prices[row.id]?.[field] ??
                          (field === "wastePercent" ? "0" : "")
                        }
                        onChange={(event) =>
                          price(row.id, field, event.target.value)
                        }
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Field label={t("Contingency (%)")}>
          <input
            inputMode="decimal"
            value={contingency}
            onChange={(event) => {
              setContingency(event.target.value);
              setBillPreview(null);
            }}
          />
        </Field>
        {bom.notes.map((note) => (
          <p className="small muted" key={note}>
            {t(note)}
          </p>
        ))}
        <p className="muted">
          {t(
            "Waste increases each entered quantity. Contingency applies to the priced material and labour subtotal; bill discount and tax remain separately entered.",
          )}
        </p>
        <button
          className="button primary"
          disabled={busy}
          onClick={() => void previewEstimate()}
        >
          {t("Preview priced estimate")}
        </button>
        {billPreview && (
          <section aria-label={t("Reviewed estimate changes")}>
            <h3>{t("Reviewed estimate changes")}</h3>
            <p>
              {t(
                "Previously derived lines for this project will be replaced. Other entered billing lines are preserved.",
              )}
            </p>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{t("Description")}</th>
                    <th>{t("Qty")}</th>
                    <th>{t("Unit price")}</th>
                  </tr>
                </thead>
                <tbody>
                  {billPreview.lines.map((line) => (
                    <tr key={line.id}>
                      <td>{line.description}</td>
                      <td>{line.quantity}</td>
                      <td>
                        {line.unitPrice} {billPreview.currency}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              className="button primary"
              disabled={busy}
              onClick={() => void applyEstimate()}
            >
              {t("Apply reviewed quantities to bill")}
            </button>
            <button className="button" onClick={() => setBillPreview(null)}>
              {t("Cancel")}
            </button>
          </section>
        )}
      </section>
    </div>
  );
}

function Block({ block }: { block: ReportBlock }) {
  if (block.kind === "heading") return <h3>{block.text}</h3>;
  if (block.kind === "paragraph")
    return (
      <p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
        {block.text}
      </p>
    );
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {block.headers.map((header, index) => (
              <th key={index}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, column) => (
                <td
                  key={column}
                  style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
