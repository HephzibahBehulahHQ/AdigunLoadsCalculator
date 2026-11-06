import { liveDrafts, loadDraft, saveDraft } from "../storage/billing";
export { loadBillingDocument, saveBillingDocument } from "../storage/billing";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  billCsv,
  calculateBill,
  createBillPdf,
  decimalInteger,
  downloadReport,
  money,
  parseBillJson,
  reportFilename,
  reportLabels,
  validateBill,
} from "../import-export/reports";
import type {
  BillDocument,
  BillLine,
  ReportLocale,
} from "../import-export/reports";
import "./Billing.css";
import { translate } from "../i18n";
import { LocaleDecimalInput } from "../i18n/LocaleDecimalInput";

export type BillingProps = {
  projectName: string;
  currency: string;
  projectId?: string;
  locale?: ReportLocale;
  totals?: {
    installedKW?: number;
    demandKW?: number;
    energyKWh?: number;
    estimatedCost?: number;
  };
};

const ui: Record<ReportLocale, Record<string, string>> = {
  en: {
    title: "Reports & customer billing",
    intro:
      "Prepare a customer estimate or invoice from quantities and prices you enter. Preview, download, print and reopen the same document.",
    details: "Document details",
    parties: "Supplier & customer",
    lineItems: "Materials & labour",
    addLine: "Add line",
    remove: "Remove line",
    save: "Save draft locally",
    saved: "Draft saved locally",
    unsaved: "Unsaved draft",
    saving: "Saving…",
    loading: "Opening saved draft…",
    downloadPdf: "Download PDF",
    print: "Print / Save PDF",
    exportCsv: "Export CSV",
    backup: "Export draft JSON",
    import: "Import draft JSON",
    preview: "Customer document preview",
    empty:
      "No priced items yet. Add materials, labour or a service line to begin.",
    currency: "Currency",
    kind: "Document type",
    category: "Category",
    discount: "Discount (%)",
    tax: "Tax (%)",
    ready: "Ready to export",
    needs: "Complete these details to export:",
    pdfWorking: "Generating PDF…",
    error: "Could not complete this action.",
    storageError:
      "Local saving is unavailable. Export the JSON draft to keep a copy.",
    conflict:
      "A newer draft was saved in another tab. Export your draft before reloading.",
    restore: "Reload saved draft",
    confirmReplace:
      "Replace this draft with the imported document? Export your current draft first if you want to keep it.",
    confirmReload: "Reloading replaces this unsaved draft. Continue?",
    clear: "New empty document",
    confirmClear:
      "Start a new empty document? Your saved draft remains available until you save again.",
    scope:
      "Prices and tax are entered values. Cable lengths must be measured or entered; diagram lines do not create billable quantities.",
    partial:
      "Draft backup saved. Customer details and prices stay in this browser unless you export them.",
    required: "Required details are missing or an amount is invalid.",
    imported: "Draft imported; review it before saving.",
    pdfDone: "PDF downloaded",
    csvDone: "CSV downloaded",
    draftDone: "Draft JSON downloaded",
    draftLoaded: "Saved draft reopened",
    localOnly: "Saved on this device",
    document: "Document",
    precision:
      "Quantity supports 3 decimal places. Unit prices use the selected currency precision.",
    download: "Download",
  },
  de: {
    title: "Berichte & Kundenabrechnung",
    intro:
      "Erstellen Sie einen Kostenvoranschlag oder eine Rechnung aus eingegebenen Mengen und Preisen. Vorschau, Download, Druck und erneutes Öffnen verwenden dieselben Daten.",
    details: "Belegangaben",
    parties: "Lieferant & Kunde",
    lineItems: "Material & Arbeit",
    addLine: "Position hinzufügen",
    remove: "Position entfernen",
    save: "Entwurf lokal speichern",
    saved: "Entwurf lokal gespeichert",
    unsaved: "Ungespeicherter Entwurf",
    saving: "Wird gespeichert…",
    loading: "Gespeicherten Entwurf öffnen…",
    downloadPdf: "PDF herunterladen",
    print: "Drucken / Als PDF speichern",
    exportCsv: "CSV exportieren",
    backup: "Entwurf als JSON exportieren",
    import: "JSON-Entwurf importieren",
    preview: "Vorschau des Kundenbelegs",
    empty:
      "Noch keine Positionen. Fügen Sie Material, Arbeit oder eine Dienstleistung hinzu.",
    currency: "Währung",
    kind: "Belegart",
    category: "Kategorie",
    discount: "Rabatt (%)",
    tax: "Steuer (%)",
    ready: "Exportbereit",
    needs: "Diese Angaben fehlen für den Export:",
    pdfWorking: "PDF wird erstellt…",
    error: "Diese Aktion konnte nicht abgeschlossen werden.",
    storageError:
      "Lokales Speichern ist nicht verfügbar. Exportieren Sie den JSON-Entwurf als Sicherung.",
    conflict:
      "In einem anderen Tab wurde ein neuerer Entwurf gespeichert. Exportieren Sie Ihren Entwurf vor dem Neuladen.",
    restore: "Gespeicherten Entwurf laden",
    confirmReplace:
      "Diesen Entwurf durch die importierte Datei ersetzen? Exportieren Sie zuerst Ihren aktuellen Entwurf, falls Sie ihn behalten möchten.",
    confirmReload: "Neuladen ersetzt den ungespeicherten Entwurf. Fortfahren?",
    clear: "Neuer leerer Beleg",
    confirmClear:
      "Neuen leeren Beleg beginnen? Der gespeicherte Entwurf bleibt bis zum nächsten Speichern verfügbar.",
    scope:
      "Preise und Steuern sind eingegebene Werte. Kabellängen müssen gemessen oder eingegeben werden; Diagrammlinien erzeugen keine abrechenbaren Mengen.",
    partial:
      "Sicherung gespeichert. Kundendaten und Preise bleiben bis zum Export in diesem Browser.",
    required: "Pflichtangaben fehlen oder ein Betrag ist ungültig.",
    imported: "Entwurf importiert; vor dem Speichern prüfen.",
    pdfDone: "PDF heruntergeladen",
    csvDone: "CSV heruntergeladen",
    draftDone: "JSON-Entwurf heruntergeladen",
    draftLoaded: "Gespeicherten Entwurf geöffnet",
    localOnly: "Auf diesem Gerät gespeichert",
    document: "Beleg",
    precision:
      "Mengen erlauben 3 Nachkommastellen. Einzelpreise verwenden die Genauigkeit der gewählten Währung.",
    download: "Herunterladen",
  },
  yo: {
    title: "Àwọn ìròyìn àti ìwé owó oníbàárà",
    intro:
      "Pèsè ìṣírò owó tàbí ìwé ìbéèrè owó láti iye àti owó tí o tẹ sílẹ̀. Ṣàyẹ̀wò, gba, tẹ̀ àti tún ìwé náà ṣí.",
    details: "Àlàyé ìwé",
    parties: "Olùpèsè àti oníbàárà",
    lineItems: "Ohun èlò àti iṣẹ́ ọwọ́",
    addLine: "Fi ìlà kún un",
    remove: "Yọ ìlà kúrò",
    save: "Fi àkọ́kọ́ ìwé pamọ́ lórí ẹ̀rọ",
    saved: "A ti fi àkọ́kọ́ ìwé pamọ́",
    unsaved: "A kò tíì fi pamọ́",
    saving: "Ń fi pamọ́…",
    loading: "Ń ṣí àkọ́kọ́ ìwé…",
    downloadPdf: "Gba PDF",
    print: "Tẹ̀ / Fi pamọ́ bí PDF",
    exportCsv: "Gba CSV",
    backup: "Gba àkọ́kọ́ ìwé JSON",
    import: "Gbé àkọ́kọ́ ìwé JSON wọlé",
    preview: "Àwòrán ìwé oníbàárà ṣáájú títẹ̀",
    empty: "Kò sí ìlà owó síbẹ̀. Fi ohun èlò, iṣẹ́ ọwọ́ tàbí iṣẹ́ míràn kún un.",
    currency: "Irú owó",
    kind: "Irú ìwé",
    category: "Ẹ̀ka",
    discount: "Ẹ̀dínwó (%)",
    tax: "Owó-orí (%)",
    ready: "Ó ti ṣetán láti gbà",
    needs: "Parí àwọn àlàyé wọ̀nyí:",
    pdfWorking: "Ń dá PDF sílẹ̀…",
    error: "A kò lè parí iṣẹ́ yìí.",
    storageError: "A kò lè fi pamọ́ lórí ẹ̀rọ. Gba JSON kí o lè ní ẹ̀dà.",
    conflict:
      "A ti fi àkọ́kọ́ ìwé tuntun pamọ́ nínú tábù mìíràn. Gba ẹ̀dà rẹ kí o tó tún ṣí.",
    restore: "Tún àkọ́kọ́ ìwé tí a fipamọ́ ṣí",
    confirmReplace:
      "Ṣé kí ìwé tí a gbé wọlé rọ́pò èyí? Gba ẹ̀dà èyí kọ́kọ́ bí o bá fẹ́ pa á mọ́.",
    confirmReload: "Títún ṣí yóò rọ́pò àkọ́kọ́ ìwé tí a kò fipamọ́. Tẹ̀síwájú?",
    clear: "Ìwé òfo tuntun",
    confirmClear:
      "Bẹ̀rẹ̀ ìwé òfo tuntun? Ẹ̀dà tí a fipamọ́ yóò dúró títí tí o fi tún fipamọ́.",
    scope:
      "Ìwọ ló tẹ owó àti owó-orí sílẹ̀. A gbọ́dọ̀ wọn gígùn okun tàbí tẹ ẹ́ sílẹ̀; ìlà àwòrán kì í dá iye owó sílẹ̀.",
    partial:
      "A ti gba ẹ̀dà. Àlàyé oníbàárà àti owó wà nínú aṣàwákiri yìí títí tí o fi gbà wọ́n.",
    required: "Àlàyé pàtàkì kò pé tàbí iye owó kò tọ́.",
    imported: "A ti gbé ìwé wọlé; ṣàyẹ̀wò rẹ̀ kí o tó fipamọ́.",
    pdfDone: "A ti gba PDF",
    csvDone: "A ti gba CSV",
    draftDone: "A ti gba JSON",
    draftLoaded: "A ti tún ìwé ṣí",
    localOnly: "A fi pamọ́ lórí ẹ̀rọ yìí",
    document: "Ìwé",
    precision:
      "Iye lè ní nọ́ńbà mẹ́ta lẹ́yìn àmì ẹlẹ́mẹwàá. Owó ẹyọ tẹ̀lé irú owó tí o yàn.",
    download: "Gba",
  },
  pcm: {
    title: "Reports & customer bill",
    intro:
      "Prepare customer estimate or bill with quantity and price wey you enter. Preview am, download am, print am or open am again.",
    details: "Bill details",
    parties: "Supplier & customer",
    lineItems: "Material & work money",
    addLine: "Add one line",
    remove: "Remove this line",
    save: "Save draft for this device",
    saved: "Draft don save for this device",
    unsaved: "Draft never save",
    saving: "E dey save…",
    loading: "E dey open saved draft…",
    downloadPdf: "Download PDF",
    print: "Print / Save as PDF",
    exportCsv: "Export CSV",
    backup: "Export draft JSON",
    import: "Import draft JSON",
    preview: "How customer bill go look",
    empty:
      "No item get price yet. Add material, work money or service line to start.",
    currency: "Currency",
    kind: "Type of bill",
    category: "Category",
    discount: "Discount (%)",
    tax: "Tax (%)",
    ready: "E ready to export",
    needs: "Complete these details first:",
    pdfWorking: "E dey create PDF…",
    error: "This action no fit finish.",
    storageError:
      "Local save no dey work. Export JSON draft so you go get copy.",
    conflict:
      "Another tab don save newer draft. Export your own before you reload.",
    restore: "Open saved draft again",
    confirmReplace:
      "Make imported document replace this draft? Export your current draft first if you wan keep am.",
    confirmReload: "Reload go replace this draft wey never save. Continue?",
    clear: "New empty document",
    confirmClear:
      "Start new empty document? Saved draft go remain till you save again.",
    scope:
      "Na you enter price and tax. Measure or enter cable length; diagram line no be quantity wey customer go pay for.",
    partial:
      "Backup don save. Customer details and prices stay for this browser unless you export dem.",
    required: "Some required details no complete or amount no correct.",
    imported: "Draft don import; check am before you save.",
    pdfDone: "PDF don download",
    csvDone: "CSV don download",
    draftDone: "Draft JSON don download",
    draftLoaded: "Saved draft don open",
    localOnly: "Saved for this device",
    document: "Document",
    precision:
      "Quantity fit use 3 decimal places. Unit price follows the currency wey you choose.",
    download: "Download",
  },
};

const today = () =>
  new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
const blankBill = (
  projectName: string,
  currency: string,
  locale: ReportLocale,
): BillDocument => ({
  schemaVersion: 1,
  projectName,
  currency,
  locale,
  kind: "estimate",
  number: "",
  date: today(),
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
});
function localizedError(error: string, locale: ReportLocale): string {
  if (locale === "en") return error;
  const translations: Record<string, [string, string, string]> = {
    "Enter a project name.": [
      "Projektname eingeben.",
      "Tẹ orúkọ iṣẹ́ sílẹ̀.",
      "Enter project name.",
    ],
    "Enter a document number.": [
      "Belegnummer eingeben.",
      "Tẹ nọ́ńbà ìwé sílẹ̀.",
      "Enter bill number.",
    ],
    "Enter the supplier details.": [
      "Lieferantenangaben eingeben.",
      "Tẹ àlàyé olùpèsè sílẹ̀.",
      "Enter supplier details.",
    ],
    "Enter the customer details.": [
      "Kundenangaben eingeben.",
      "Tẹ àlàyé oníbàárà sílẹ̀.",
      "Enter customer details.",
    ],
    "Enter a valid issue date.": [
      "Gültiges Ausstellungsdatum eingeben.",
      "Tẹ ọjọ́ ìwé tó tọ́ sílẹ̀.",
      "Enter correct bill date.",
    ],
    "Due / validity date must not precede the issue date.": [
      "Fälligkeitsdatum darf nicht vor dem Ausstellungsdatum liegen.",
      "Ọjọ́ ìsanwó kò gbọdọ̀ ṣáájú ọjọ́ ìwé.",
      "Date to pay no fit come before bill date.",
    ],
    "Add at least one priced line.": [
      "Mindestens eine bepreiste Position hinzufügen.",
      "Fi ó kéré tán ìlà owó kan kún un.",
      "Add at least one line with price.",
    ],
    "Discount and tax must be between 0 and 100%.": [
      "Rabatt und Steuer müssen zwischen 0 und 100 % liegen.",
      "Ẹ̀dínwó àti owó-orí gbọdọ̀ wà láàárín 0 àti 100%.",
      "Discount and tax must stay between 0 and 100%.",
    ],
  };
  const index = locale === "de" ? 0 : locale === "yo" ? 1 : 2;
  if (translations[error]) return translations[error][index];
  return translate(error, locale);
}

export function Billing({
  projectName,
  currency,
  projectId,
  locale = "en",
}: BillingProps) {
  const key = projectId ?? projectName;
  const l = reportLabels[locale];
  const u = ui[locale];
  const [bill, setBill] = useState(() =>
    blankBill(projectName, currency, locale),
  );
  const [revision, setRevision] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [documentKey, setDocumentKey] = useState(key);
  const [busy, setBusy] = useState<"load" | "save" | "pdf" | null>("load");
  const [status, setStatus] = useState("");
  const [failure, setFailure] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const currentKey = useRef(key);
  currentKey.current = key;
  const loadedKey = useRef<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    loadedKey.current = null;
    setDocumentKey(key);
    setBusy("load");
    setFailure("");
    setStatus("");
    setRevision(null);
    setBill(blankBill(projectName, currency, locale));
    setDirty(false);
    const live = liveDrafts.get(key);
    if (live) {
      loadedKey.current = key;
      setBill({ ...live.bill, projectName, locale });
      setRevision(live.revision);
      setDirty(live.dirty);
      setBusy(null);
      return () => {
        cancelled = true;
      };
    }
    loadDraft(key)
      .then((record) => {
        if (cancelled) return;
        if (record) {
          setBill({ ...record.bill, projectName, locale });
          setRevision(record.revision);
        }
      })
      .catch(() => {
        if (!cancelled) setFailure(ui[locale].storageError);
      })
      .finally(() => {
        if (!cancelled) {
          loadedKey.current = key;
          setBusy(null);
        }
      });
    return () => {
      cancelled = true;
    };
    // A project identity change opens a distinct document; renaming does not discard edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  useEffect(() => {
    setBill((current) => ({ ...current, projectName, locale }));
  }, [projectName, locale]);
  useEffect(() => {
    if (busy !== "load" && loadedKey.current === key && documentKey === key)
      liveDrafts.set(key, { bill: structuredClone(bill), revision, dirty });
  }, [key, documentKey, bill, revision, dirty, busy]);
  useEffect(() => {
    const restored = (event: Event) => {
      if (
        (event as CustomEvent<{ projectId: string }>).detail.projectId !== key
      )
        return;
      const live = liveDrafts.get(key);
      if (live) {
        setBill({ ...live.bill, projectName, locale });
        setRevision(live.revision);
        setDirty(false);
        setStatus(ui[locale].draftLoaded);
      }
    };
    window.addEventListener("adigun-billing-restored", restored);
    return () =>
      window.removeEventListener("adigun-billing-restored", restored);
  }, [key, projectName, locale]);
  const result = useMemo(() => {
    try {
      return { totals: calculateBill(bill), error: "" };
    } catch (error) {
      return {
        totals: null,
        error: error instanceof Error ? error.message : "Invalid amount",
      };
    }
  }, [bill]);
  const errors = useMemo(() => validateBill(bill), [bill]);
  const update = (field: keyof BillDocument, value: unknown) => {
    setBill((current) => ({ ...current, [field]: value }));
    setDirty(true);
    setStatus("");
  };
  const changeLine = (id: string, field: keyof BillLine, value: string) => {
    setBill((current) => ({
      ...current,
      lines: current.lines.map((line) =>
        line.id === id ? { ...line, [field]: value } : line,
      ),
    }));
    setDirty(true);
    setStatus("");
  };
  const decimalChange = (
    path: string,
    change:
      { canonical: string } | { draft: { text: string; locale: ReportLocale } },
    lineId?: string,
    field?: "quantity" | "unitPrice",
  ) => {
    setBill((current) => {
      const next = structuredClone(current);
      next.numericDrafts ??= {};
      if ("draft" in change) next.numericDrafts[path] = change.draft;
      else {
        delete next.numericDrafts[path];
        if (lineId && field) {
          const line = next.lines.find((row) => row.id === lineId);
          if (line) line[field] = change.canonical;
        } else if (path === "discountPercent" || path === "taxPercent")
          next[path] = change.canonical;
      }
      if (!Object.keys(next.numericDrafts).length) delete next.numericDrafts;
      return next;
    });
    setDirty(true);
    setStatus("");
  };
  const actionError = (error: unknown) =>
    setFailure(
      error instanceof Error && error.message === "conflict"
        ? u.conflict
        : error instanceof Error && error.message === "storage"
          ? u.storageError
          : u.error,
    );
  async function save() {
    const forKey = key;
    const snapshot = structuredClone(bill);
    setBusy("save");
    setFailure("");
    try {
      const next = await saveDraft(forKey, snapshot, revision);
      if (currentKey.current === forKey) {
        setRevision(next);
        setDirty(
          JSON.stringify(liveDrafts.get(forKey)?.bill ?? snapshot) !==
            JSON.stringify(snapshot),
        );
        setStatus(u.saved);
      }
    } catch (error) {
      if (currentKey.current === forKey) actionError(error);
    } finally {
      if (currentKey.current === forKey) setBusy(null);
    }
  }
  async function pdf() {
    const snapshot = structuredClone(bill);
    setBusy("pdf");
    setFailure("");
    try {
      const blob = await createBillPdf(snapshot);
      downloadReport(reportFilename(snapshot, "pdf"), blob);
      setStatus(u.pdfDone);
    } catch (error) {
      actionError(error);
    } finally {
      setBusy(null);
    }
  }
  async function reload() {
    if (dirty && !window.confirm(u.confirmReload)) return;
    const forKey = key;
    setBusy("load");
    setFailure("");
    try {
      const record = await loadDraft(forKey);
      if (currentKey.current !== forKey) return;
      setBill(
        record
          ? { ...record.bill, projectName, locale }
          : blankBill(projectName, currency, locale),
      );
      setRevision(record?.revision ?? null);
      setDirty(false);
      setStatus(u.draftLoaded);
    } catch (error) {
      if (currentKey.current === forKey) actionError(error);
    } finally {
      if (currentKey.current === forKey) setBusy(null);
    }
  }
  function print() {
    document.body.classList.add("billing-print-mode");
    const cleanup = () => document.body.classList.remove("billing-print-mode");
    window.addEventListener("afterprint", cleanup, { once: true });
    try {
      window.print();
    } catch (error) {
      cleanup();
      actionError(error);
    }
  }
  async function importFile(file?: File) {
    if (!file) return;
    setFailure("");
    try {
      if (file.size > 2_000_000) throw new Error("size");
      const incoming = parseBillJson(await file.text());
      if (!window.confirm(u.confirmReplace)) return;
      setBill({ ...incoming, locale, projectName });
      setDirty(true);
      setStatus(u.imported);
    } catch (error) {
      actionError(error);
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }
  const disabled = busy !== null;
  const ready = errors.length === 0;
  return (
    <section className="billing-workspace" aria-label={u.title}>
      <div className="billing-heading">
        <div>
          <p className="eyebrow">ADIGUNPOWERLAB / {u.document.toUpperCase()}</p>
          <h2>{u.title}</h2>
          <p>{u.intro}</p>
        </div>
        <span className="billing-save-state" role="status">
          {busy === "load"
            ? u.loading
            : busy === "save"
              ? u.saving
              : dirty
                ? u.unsaved
                : revision
                  ? u.localOnly
                  : u.unsaved}
        </span>
      </div>
      <div className="billing-actions">
        <button className="button" onClick={save} disabled={disabled}>
          {busy === "save" ? u.saving : u.save}
        </button>
        <button className="button" onClick={reload} disabled={disabled}>
          {u.restore}
        </button>
        <button
          className="button"
          onClick={() => {
            if (!dirty || window.confirm(u.confirmClear)) {
              setBill(blankBill(projectName, currency, locale));
              setDirty(true);
              setStatus("");
            }
          }}
          disabled={disabled}
        >
          {u.clear}
        </button>
      </div>
      {failure && (
        <div className="billing-alert error" role="alert">
          {failure}
        </div>
      )}
      {status && (
        <div className="billing-alert" role="status">
          {status}
        </div>
      )}
      <div className="billing-editor">
        <section className="panel">
          <h3>{u.details}</h3>
          <div className="form-grid billing-fields">
            <label className="field">
              {u.kind}
              <select
                value={bill.kind}
                onChange={(e) => update("kind", e.target.value)}
                disabled={disabled}
              >
                <option value="estimate">{l.estimate}</option>
                <option value="invoice">{l.invoice}</option>
              </select>
            </label>
            <label className="field">
              {l.number}
              <input
                value={bill.number}
                maxLength={80}
                onChange={(e) => update("number", e.target.value)}
                disabled={disabled}
                required
              />
            </label>
            <label className="field">
              {l.date}
              <input
                type="date"
                value={bill.date}
                onChange={(e) => update("date", e.target.value)}
                disabled={disabled}
                required
              />
            </label>
            <label className="field">
              {l.dueDate}
              <input
                type="date"
                value={bill.dueDate}
                min={bill.date}
                onChange={(e) => update("dueDate", e.target.value)}
                disabled={disabled}
              />
            </label>
            <label className="field">
              {u.currency}
              <select
                value={bill.currency}
                onChange={(e) => update("currency", e.target.value)}
                disabled={disabled}
              >
                {Array.from(
                  new Set([
                    bill.currency,
                    "EUR",
                    "GBP",
                    "USD",
                    "NGN",
                    "GHS",
                    "JPY",
                    "KWD",
                  ]),
                ).map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              {l.customerReference}
              <input
                value={bill.customerReference}
                maxLength={120}
                onChange={(e) => update("customerReference", e.target.value)}
                disabled={disabled}
              />
            </label>
          </div>
        </section>
        <section className="panel">
          <h3>{u.parties}</h3>
          <div className="form-grid billing-parties">
            <label className="field">
              {l.seller}
              <textarea
                rows={4}
                value={bill.seller}
                maxLength={1000}
                onChange={(e) => update("seller", e.target.value)}
                disabled={disabled}
                required
              />
            </label>
            <label className="field">
              {l.customer}
              <textarea
                rows={4}
                value={bill.customer}
                maxLength={1000}
                onChange={(e) => update("customer", e.target.value)}
                disabled={disabled}
                required
              />
            </label>
            <label className="field">
              {l.taxId}
              <input
                value={bill.sellerTaxId}
                maxLength={120}
                onChange={(e) => update("sellerTaxId", e.target.value)}
                disabled={disabled}
              />
            </label>
          </div>
        </section>
        <section className="panel">
          <div className="billing-section-title">
            <h3>{u.lineItems}</h3>
            <button
              className="button"
              onClick={() =>
                update("lines", [
                  ...bill.lines,
                  {
                    id: crypto.randomUUID(),
                    description: "",
                    category: "material",
                    quantity: "1",
                    unitPrice: "0",
                  },
                ])
              }
              disabled={disabled || bill.lines.length >= 1000}
            >
              + {u.addLine}
            </button>
          </div>
          <p className="billing-note">{u.scope}</p>
          {!bill.lines.length ? (
            <p className="billing-empty">{u.empty}</p>
          ) : (
            <div className="table-wrap">
              <table className="billing-entry-table">
                <thead>
                  <tr>
                    <th>{l.description}</th>
                    <th>{u.category}</th>
                    <th>{l.quantity}</th>
                    <th>
                      {l.unitPrice} ({bill.currency})
                    </th>
                    <th>{l.amount}</th>
                    <th>
                      <span className="sr-only">{u.remove}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {bill.lines.map((line, i) => (
                    <tr key={line.id}>
                      <td>
                        <input
                          aria-label={`${l.description} ${i + 1}`}
                          value={line.description}
                          maxLength={240}
                          onChange={(e) =>
                            changeLine(line.id, "description", e.target.value)
                          }
                          disabled={disabled}
                        />
                      </td>
                      <td>
                        <select
                          aria-label={`${u.category} ${i + 1}`}
                          value={line.category}
                          onChange={(e) =>
                            changeLine(line.id, "category", e.target.value)
                          }
                          disabled={disabled}
                        >
                          <option value="material">{l.material}</option>
                          <option value="labour">{l.labour}</option>
                          <option value="other">{l.other}</option>
                        </select>
                      </td>
                      <td>
                        <LocaleDecimalInput
                          aria-label={`${l.quantity} ${i + 1}`}
                          maxLength={32}
                          value={line.quantity}
                          locale={locale}
                          decimalPlaces={3}
                          draft={
                            bill.numericDrafts?.[`line:${line.id}:quantity`]
                          }
                          onDecimalChange={(change) =>
                            decimalChange(
                              `line:${line.id}:quantity`,
                              change,
                              line.id,
                              "quantity",
                            )
                          }
                          disabled={disabled}
                        />
                      </td>
                      <td>
                        <LocaleDecimalInput
                          aria-label={`${l.unitPrice} ${i + 1}`}
                          maxLength={32}
                          value={line.unitPrice}
                          locale={locale}
                          decimalPlaces={
                            result.totals?.digits ??
                            (bill.currency === "JPY"
                              ? 0
                              : bill.currency === "KWD"
                                ? 3
                                : 2)
                          }
                          draft={
                            bill.numericDrafts?.[`line:${line.id}:unitPrice`]
                          }
                          onDecimalChange={(change) =>
                            decimalChange(
                              `line:${line.id}:unitPrice`,
                              change,
                              line.id,
                              "unitPrice",
                            )
                          }
                          disabled={disabled}
                        />
                      </td>
                      <td className="billing-number">
                        {result.totals
                          ? money(
                              result.totals.lineMinor[i],
                              bill.currency,
                              locale,
                            )
                          : "—"}
                      </td>
                      <td>
                        <button
                          className="button billing-remove"
                          aria-label={`${u.remove} ${i + 1}`}
                          onClick={() =>
                            update(
                              "lines",
                              bill.lines.filter((item) => item.id !== line.id),
                            )
                          }
                          disabled={disabled}
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="billing-note">{u.precision}</p>
          <div className="billing-adjustments">
            <label className="field">
              {u.discount}
              <LocaleDecimalInput
                maxLength={8}
                value={bill.discountPercent}
                locale={locale}
                decimalPlaces={2}
                draft={bill.numericDrafts?.discountPercent}
                onDecimalChange={(change) =>
                  decimalChange("discountPercent", change)
                }
                disabled={disabled}
              />
            </label>
            <label className="field">
              {u.tax}
              <LocaleDecimalInput
                maxLength={8}
                value={bill.taxPercent}
                locale={locale}
                decimalPlaces={2}
                draft={bill.numericDrafts?.taxPercent}
                onDecimalChange={(change) =>
                  decimalChange("taxPercent", change)
                }
                disabled={disabled}
              />
            </label>
            <div className="billing-grand-total">
              <span>{l.total}</span>
              <strong>
                {result.totals
                  ? money(result.totals.totalMinor, bill.currency, locale)
                  : "—"}
              </strong>
            </div>
          </div>
        </section>
        <section className="panel">
          <div className="form-grid billing-parties">
            <label className="field">
              {l.notes}
              <textarea
                rows={3}
                maxLength={4000}
                value={bill.notes}
                onChange={(e) => update("notes", e.target.value)}
                disabled={disabled}
              />
            </label>
            <label className="field">
              {l.payment}
              <textarea
                rows={3}
                maxLength={4000}
                value={bill.paymentDetails}
                onChange={(e) => update("paymentDetails", e.target.value)}
                disabled={disabled}
              />
            </label>
          </div>
        </section>
      </div>
      {!ready && (
        <div className="billing-checklist">
          <strong>{u.needs}</strong>
          <ul>
            {errors.map((error, i) => (
              <li key={i}>{localizedError(error, locale)}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="billing-actions billing-export">
        <button
          className="button primary"
          disabled={!ready || disabled}
          onClick={pdf}
        >
          {busy === "pdf" ? u.pdfWorking : u.downloadPdf}
        </button>
        <button
          className="button"
          disabled={!ready || disabled}
          onClick={print}
        >
          {u.print}
        </button>
        <button
          className="button"
          disabled={!ready || disabled}
          onClick={() => {
            downloadReport(
              reportFilename(bill, "csv"),
              billCsv(bill),
              "text/csv;charset=utf-8",
            );
            setStatus(u.csvDone);
          }}
        >
          {u.exportCsv}
        </button>
        <button
          className="button"
          disabled={disabled}
          onClick={() => {
            downloadReport(
              reportFilename(bill, "json"),
              JSON.stringify(bill, null, 2),
              "application/json",
            );
            setStatus(u.draftDone);
          }}
        >
          {u.backup}
        </button>
        <button
          className="button"
          disabled={disabled}
          onClick={() => fileRef.current?.click()}
        >
          {u.import}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          hidden
          onChange={(e) => importFile(e.target.files?.[0])}
        />
      </div>
      <h3 className="billing-preview-heading">{u.preview}</h3>
      <article
        className="billing-paper"
        id="billing-print-document"
        aria-label={u.preview}
      >
        <header>
          <div>
            <span className="billing-paper-brand">AdigunPowerLab</span>
            <small>BY HB ELEKTRONIKER</small>
          </div>
          <span className="billing-document-kind">{l[bill.kind]}</span>
        </header>
        <h2>{bill.projectName}</h2>
        <dl className="billing-doc-meta">
          <div>
            <dt>{l.number}</dt>
            <dd>{bill.number || l.draft}</dd>
          </div>
          <div>
            <dt>{l.date}</dt>
            <dd>{bill.date}</dd>
          </div>
          {bill.dueDate && (
            <div>
              <dt>{l.dueDate}</dt>
              <dd>{bill.dueDate}</dd>
            </div>
          )}
        </dl>
        <div className="billing-addresses">
          <section>
            <h4>{l.seller}</h4>
            <p>{bill.seller || "—"}</p>
            {bill.sellerTaxId && (
              <p>
                <small>
                  {l.taxId}: {bill.sellerTaxId}
                </small>
              </p>
            )}
          </section>
          <section>
            <h4>{l.customer}</h4>
            <p>{bill.customer || "—"}</p>
            {bill.customerReference && (
              <p>
                <small>
                  {l.customerReference}: {bill.customerReference}
                </small>
              </p>
            )}
          </section>
        </div>
        <table className="billing-document-table">
          <thead>
            <tr>
              <th>{l.description}</th>
              <th>{l.quantity}</th>
              <th>{l.unitPrice}</th>
              <th>{l.amount}</th>
            </tr>
          </thead>
          <tbody>
            {bill.lines.map((line, i) => (
              <tr key={line.id}>
                <td>
                  {line.description}
                  <small>{l[line.category]}</small>
                </td>
                <td>{result.totals ? String(Number(line.quantity)) : "—"}</td>
                <td>
                  {result.totals
                    ? money(
                        Number(
                          decimalInteger(line.unitPrice, result.totals.digits),
                        ),
                        bill.currency,
                        locale,
                      )
                    : "—"}
                </td>
                <td>
                  {result.totals
                    ? money(result.totals.lineMinor[i], bill.currency, locale)
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {result.totals && (
          <dl className="billing-document-totals">
            <div>
              <dt>{l.subtotal}</dt>
              <dd>
                {money(result.totals.subtotalMinor, bill.currency, locale)}
              </dd>
            </div>
            <div>
              <dt>
                {l.discount} ({bill.discountPercent}%)
              </dt>
              <dd>
                −{money(result.totals.discountMinor, bill.currency, locale)}
              </dd>
            </div>
            <div>
              <dt>{l.net}</dt>
              <dd>{money(result.totals.netMinor, bill.currency, locale)}</dd>
            </div>
            <div>
              <dt>
                {l.tax} ({bill.taxPercent}%)
              </dt>
              <dd>{money(result.totals.taxMinor, bill.currency, locale)}</dd>
            </div>
            <div className="total">
              <dt>{l.total}</dt>
              <dd>{money(result.totals.totalMinor, bill.currency, locale)}</dd>
            </div>
          </dl>
        )}
        {bill.notes && (
          <section className="billing-document-notes">
            <h4>{l.notes}</h4>
            <p>{bill.notes}</p>
          </section>
        )}
        {bill.paymentDetails && (
          <section className="billing-document-notes">
            <h4>{l.payment}</h4>
            <p>{bill.paymentDetails}</p>
          </section>
        )}
        <footer>
          {l.method}
          <br />
          {l.generated}
        </footer>
      </article>
    </section>
  );
}
export default Billing;
