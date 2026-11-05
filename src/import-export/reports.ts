import type { CalculationResult, Project } from "../domain/types";

export type ReportLocale = "en" | "de" | "yo" | "pcm";
export type BillKind = "estimate" | "invoice";
export type BillLine = {
  id: string;
  description: string;
  category: "material" | "labour" | "other";
  quantity: string;
  unitPrice: string;
};
export type BillDocument = {
  schemaVersion: 1;
  projectName: string;
  currency: string;
  locale: ReportLocale;
  kind: BillKind;
  number: string;
  date: string;
  dueDate: string;
  seller: string;
  sellerTaxId: string;
  customer: string;
  customerReference: string;
  notes: string;
  paymentDetails: string;
  discountPercent: string;
  taxPercent: string;
  lines: BillLine[];
};
export type BillTotals = {
  digits: number;
  lineMinor: number[];
  subtotalMinor: number;
  discountMinor: number;
  netMinor: number;
  taxMinor: number;
  totalMinor: number;
};

export const reportLabels: Record<ReportLocale, Record<string, string>> = {
  en: {
    estimate: "Customer estimate",
    invoice: "Invoice",
    project: "Project",
    number: "Document number",
    date: "Issue date",
    dueDate: "Due / valid until",
    seller: "Supplier",
    customer: "Customer",
    taxId: "Tax / registration reference",
    customerReference: "Customer reference",
    description: "Description",
    quantity: "Qty",
    unitPrice: "Unit price",
    amount: "Amount",
    subtotal: "Subtotal",
    discount: "Discount",
    net: "Net amount",
    tax: "Tax",
    total: "Total",
    notes: "Notes",
    payment: "Payment details",
    page: "Page",
    material: "Material",
    labour: "Labour",
    other: "Other",
    method:
      "Line amounts rounded to currency precision. Discount before tax. Quantities and prices entered by the preparer.",
    generated: "Prepared with AdigunPowerLab",
    reference: "Reference",
    draft: "Draft",
  },
  de: {
    estimate: "Kostenvoranschlag",
    invoice: "Rechnung",
    project: "Projekt",
    number: "Belegnummer",
    date: "Ausstellungsdatum",
    dueDate: "Fällig / gültig bis",
    seller: "Lieferant",
    customer: "Kunde",
    taxId: "Steuer- / Registrierungsnummer",
    customerReference: "Kundenreferenz",
    description: "Beschreibung",
    quantity: "Menge",
    unitPrice: "Einzelpreis",
    amount: "Betrag",
    subtotal: "Zwischensumme",
    discount: "Rabatt",
    net: "Nettobetrag",
    tax: "Steuer",
    total: "Gesamt",
    notes: "Hinweise",
    payment: "Zahlungsangaben",
    page: "Seite",
    material: "Material",
    labour: "Arbeit",
    other: "Sonstiges",
    method:
      "Positionen werden auf Währungsgenauigkeit gerundet. Rabatt vor Steuer. Mengen und Preise werden vom Ersteller eingegeben.",
    generated: "Erstellt mit AdigunPowerLab",
    reference: "Referenz",
    draft: "Entwurf",
  },
  yo: {
    estimate: "Ìṣírò owó oníbàárà",
    invoice: "Ìwé ìbéèrè owó",
    project: "Iṣẹ́",
    number: "Nọ́ńbà ìwé",
    date: "Ọjọ́ ìwé",
    dueDate: "Ọjọ́ ìsanwó / ìparí",
    seller: "Olùpèsè",
    customer: "Oníbàárà",
    taxId: "Nọ́ńbà owó-orí / ìforúkọsílẹ̀",
    customerReference: "Ìtọ́kasí oníbàárà",
    description: "Àpèjúwe",
    quantity: "Iye",
    unitPrice: "Owó ẹyọ",
    amount: "Àpapọ̀",
    subtotal: "Àpapọ̀ àkọ́kọ́",
    discount: "Ẹ̀dínwó",
    net: "Owó lẹ́yìn ẹ̀dínwó",
    tax: "Owó-orí",
    total: "Àpapọ̀ owó",
    notes: "Àwọn àkọsílẹ̀",
    payment: "Àlàyé ìsanwó",
    page: "Ojú ìwé",
    material: "Ohun èlò",
    labour: "Iṣẹ́ ọwọ́",
    other: "Míràn",
    method:
      "A yí owó ìlà kọ̀ọ̀kan sí iye ẹyọ owó. Ẹ̀dínwó wá ṣáájú owó-orí. Olùṣètò ló tẹ iye àti owó sílẹ̀.",
    generated: "A pèsè rẹ̀ pẹ̀lú AdigunPowerLab",
    reference: "Ìtọ́kasí",
    draft: "Àkọ́kọ́ ìwé",
  },
  pcm: {
    estimate: "Customer price estimate",
    invoice: "Bill",
    project: "Project",
    number: "Bill number",
    date: "Date wey dem prepare am",
    dueDate: "Pay before / valid till",
    seller: "Supplier",
    customer: "Customer",
    taxId: "Tax / registration number",
    customerReference: "Customer reference",
    description: "Wetin e be",
    quantity: "How many",
    unitPrice: "Price for one",
    amount: "Amount",
    subtotal: "Subtotal",
    discount: "Discount",
    net: "Amount after discount",
    tax: "Tax",
    total: "Total to pay",
    notes: "Extra notes",
    payment: "How to pay",
    page: "Page",
    material: "Material",
    labour: "Work money",
    other: "Other",
    method:
      "Each line rounds to currency precision. Discount comes before tax. Na person wey prepare am enter quantity and price.",
    generated: "Prepared with AdigunPowerLab",
    reference: "Reference",
    draft: "Draft",
  },
};

export function currencyDigits(currency: string): number {
  if (!/^[A-Z]{3}$/.test(currency))
    throw new Error("Enter a three-letter currency code.");
  return (
    new Intl.NumberFormat("en", {
      style: "currency",
      currency,
    }).resolvedOptions().maximumFractionDigits ?? 2
  );
}

/** Decimal strings become integer minor units before arithmetic. Excess precision is rejected. */
export function decimalInteger(
  value: string,
  digits: number,
  name = "Value",
): bigint {
  const clean = value.trim();
  if (clean.length > 32) throw new Error(`${name} is too long.`);
  if (!/^\d+(?:\.\d+)?$/.test(clean))
    throw new Error(`${name} must be a non-negative decimal number.`);
  const [whole, fraction = ""] = clean.split(".");
  if (fraction.length > digits)
    throw new Error(`${name} allows at most ${digits} decimal places.`);
  const scaled =
    BigInt(whole) * 10n ** BigInt(digits) +
    BigInt(fraction.padEnd(digits, "0") || "0");
  if (scaled > BigInt(Number.MAX_SAFE_INTEGER))
    throw new Error(`${name} is too large.`);
  return scaled;
}

const roundDivide = (value: bigint, divisor: bigint) =>
  (value + divisor / 2n) / divisor;
const safeNumber = (value: bigint) => {
  if (value > BigInt(Number.MAX_SAFE_INTEGER))
    throw new Error("The total exceeds the supported amount.");
  return Number(value);
};

export function calculateBill(
  bill: Pick<
    BillDocument,
    "currency" | "lines" | "discountPercent" | "taxPercent"
  >,
): BillTotals {
  const digits = currencyDigits(bill.currency);
  const lineBig = bill.lines.map((line, i) => {
    const quantity = decimalInteger(line.quantity, 3, `Quantity ${i + 1}`);
    if (quantity === 0n)
      throw new Error(`Quantity ${i + 1} must be greater than zero.`);
    return roundDivide(
      quantity * decimalInteger(line.unitPrice, digits, `Unit price ${i + 1}`),
      1000n,
    );
  });
  const discountRate = decimalInteger(bill.discountPercent, 2, "Discount");
  const taxRate = decimalInteger(bill.taxPercent, 2, "Tax");
  if (discountRate > 10000n || taxRate > 10000n)
    throw new Error("Discount and tax must be between 0 and 100%.");
  const subtotal = lineBig.reduce((sum, value) => sum + value, 0n);
  const discount = roundDivide(subtotal * discountRate, 10000n);
  const net = subtotal - discount;
  const tax = roundDivide(net * taxRate, 10000n);
  return {
    digits,
    lineMinor: lineBig.map(safeNumber),
    subtotalMinor: safeNumber(subtotal),
    discountMinor: safeNumber(discount),
    netMinor: safeNumber(net),
    taxMinor: safeNumber(tax),
    totalMinor: safeNumber(net + tax),
  };
}

function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

export function validateBill(bill: BillDocument): string[] {
  const errors: string[] = [];
  for (const [key, limit] of Object.entries({
    projectName: 240,
    number: 80,
    seller: 1000,
    customer: 1000,
    sellerTaxId: 120,
    customerReference: 120,
    notes: 4000,
    paymentDetails: 4000,
  }))
    if (String(bill[key as keyof BillDocument]).length > limit)
      errors.push(`${key} is too long.`);
  if (!bill.projectName.trim()) errors.push("Enter a project name.");
  if (!bill.number.trim()) errors.push("Enter a document number.");
  if (!bill.seller.trim()) errors.push("Enter the supplier details.");
  if (!bill.customer.trim()) errors.push("Enter the customer details.");
  if (!validDate(bill.date)) errors.push("Enter a valid issue date.");
  if (bill.dueDate && (!validDate(bill.dueDate) || bill.dueDate < bill.date))
    errors.push("Due / validity date must not precede the issue date.");
  if (!bill.lines.length) errors.push("Add at least one priced line.");
  if (bill.lines.length > 1000)
    errors.push("At most 1,000 lines are supported.");
  bill.lines.forEach((line, i) => {
    if (!line.description.trim())
      errors.push(`Enter a description for line ${i + 1}.`);
    if (line.description.length > 240)
      errors.push(`Description ${i + 1} is too long.`);
  });
  try {
    calculateBill(bill);
  } catch (error) {
    errors.push(
      error instanceof Error ? error.message : "Check the line amounts.",
    );
  }
  return errors;
}

export const reportLocaleTag = (locale: ReportLocale) =>
  ({ en: "en-GB", de: "de-DE", yo: "yo-NG", pcm: "en-NG" })[locale];
export function money(
  minor: number,
  currency: string,
  locale: ReportLocale = "en",
) {
  return new Intl.NumberFormat(reportLocaleTag(locale), {
    style: "currency",
    currency,
  }).format(minor / 10 ** currencyDigits(currency));
}

/** Text cells are quoted and formula-prefixed values are neutralized; numeric strings remain numeric. */
export function safeCsvCell(value: string | number): string {
  if (typeof value === "number") {
    if (!Number.isFinite(value))
      throw new Error("CSV cannot contain a non-finite number.");
    return String(value);
  }
  const safe = /^[\s]*[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function billCsv(bill: BillDocument): string {
  const totals = calculateBill(bill);
  const labels = reportLabels[bill.locale];
  const rows: (string | number)[][] = [
    [labels.project, bill.projectName],
    [labels.number, bill.number],
    [labels.date, bill.date],
    [labels.seller, bill.seller],
    [labels.customer, bill.customer],
    ["Currency", bill.currency],
    [labels.description, labels.quantity, labels.unitPrice, labels.amount],
    ...bill.lines.map((line, i) => [
      line.description,
      Number(line.quantity),
      Number(line.unitPrice),
      totals.lineMinor[i] / 10 ** totals.digits,
    ]),
    [labels.subtotal, "", "", totals.subtotalMinor / 10 ** totals.digits],
    [
      `${labels.discount} ${bill.discountPercent}%`,
      "",
      "",
      -totals.discountMinor / 10 ** totals.digits,
    ],
    [
      `${labels.tax} ${bill.taxPercent}%`,
      "",
      "",
      totals.taxMinor / 10 ** totals.digits,
    ],
    [labels.total, "", "", totals.totalMinor / 10 ** totals.digits],
    [labels.notes, bill.notes],
    [labels.payment, bill.paymentDetails],
  ];
  return (
    "\uFEFF" + rows.map((row) => row.map(safeCsvCell).join(",")).join("\r\n")
  );
}

export function downloadReport(
  name: string,
  content: Blob | string,
  type = "text/plain;charset=utf-8",
) {
  const blob =
    typeof content === "string" ? new Blob([content], { type }) : content;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const reportFilename = (
  bill: Pick<BillDocument, "number" | "kind" | "projectName">,
  extension: string,
) =>
  `${bill.kind}-${
    (bill.number || bill.projectName)
      .normalize("NFKD")
      .replace(/[^a-zA-Z0-9_-]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 70) || "AdigunPowerLab"
  }.${extension}`;

let fontPromise: Promise<string> | undefined;
async function embeddedFont(): Promise<string> {
  if (!fontPromise)
    fontPromise = (async () => {
      const response = await fetch(
        `${import.meta.env.BASE_URL}assets/fonts/DejaVuSans.ttf`,
      );
      if (!response.ok)
        throw new Error(
          "The PDF font could not be loaded. Reload online once, or use Print.",
        );
      const bytes = new Uint8Array(await response.arrayBuffer());
      let binary = "";
      for (let offset = 0; offset < bytes.length; offset += 8192)
        binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
      return btoa(binary);
    })().catch((error) => {
      fontPromise = undefined;
      throw error;
    });
  return fontPromise;
}

/** A frozen billing snapshot is rendered with an embedded Unicode font and repeated table headers. */
export async function createBillPdf(
  source: BillDocument,
  options: { fontBase64?: string } = {},
): Promise<Blob> {
  const bill = structuredClone(source);
  const errors = validateBill(bill);
  if (errors.length) throw new Error(errors.join(" "));
  const [{ jsPDF }, font] = await Promise.all([
    import("jspdf"),
    options.fontBase64 ? Promise.resolve(options.fontBase64) : embeddedFont(),
  ]);
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  doc.addFileToVFS("DejaVuSans.ttf", font);
  doc.addFont("DejaVuSans.ttf", "PowerLab", "normal");
  doc.setFont("PowerLab", "normal");
  doc.setProperties({
    title: `${reportLabels[bill.locale][bill.kind]} ${bill.number}`,
    subject: bill.projectName,
    author: bill.seller.split("\n")[0],
    creator: "AdigunPowerLab",
  });
  const l = reportLabels[bill.locale];
  const totals = calculateBill(bill);
  const width = 182;
  let y = 15;
  let insideTable = false;
  const text = (value: string, x: number, yy: number, size = 9) => {
    doc.setFontSize(size);
    doc.text(value, x, yy);
  };
  const lines = (value: string, maxWidth: number, size = 9): string[] => {
    doc.setFontSize(size);
    return doc.splitTextToSize(value, maxWidth) as string[];
  };
  const tableHeader = () => {
    doc.setFillColor(235, 241, 247);
    doc.rect(14, y, 182, 8, "F");
    text(l.description, 16, y + 5, 8);
    text(l.quantity, 87, y + 5, 8);
    text(l.unitPrice, 122, y + 5, 8);
    text(l.amount, 162, y + 5, 8);
    y += 10;
  };
  const newPage = () => {
    doc.addPage();
    y = 14;
    doc.setTextColor(30, 45, 65);
    for (const line of lines(`${l[bill.kind]} · ${bill.number}`, 182, 10)) {
      text(line, 14, y, 10);
      y += 5;
    }
    y += 3;
    if (insideTable) tableHeader();
  };
  const ensure = (height: number) => {
    if (y + height > 278) newPage();
  };
  const paragraph = (value: string, size = 9) => {
    for (const line of lines(value, width, size)) {
      ensure(5);
      text(line, 14, y, size);
      y += 5;
    }
  };
  doc.setTextColor(15, 35, 55);
  text("AdigunPowerLab", 14, y, 17);
  text("BY HB ELEKTRONIKER", 146, y, 8);
  y += 10;
  paragraph(l[bill.kind], 17);
  y += 3;
  paragraph(`${l.project}: ${bill.projectName}`, 11);
  y += 2;
  paragraph(`${l.number}: ${bill.number}    ${l.date}: ${bill.date}`, 9);
  if (bill.dueDate) paragraph(`${l.dueDate}: ${bill.dueDate}`, 9);
  y += 5;
  text(l.seller, 14, y, 10);
  text(l.customer, 108, y, 10);
  y += 6;
  const sellerLines = lines(bill.seller, 84);
  const customerLines = lines(bill.customer, 86);
  const addressRows = Math.max(sellerLines.length, customerLines.length);
  for (let i = 0; i < addressRows; i++) {
    ensure(5);
    if (sellerLines[i]) text(sellerLines[i], 14, y);
    if (customerLines[i]) text(customerLines[i], 108, y);
    y += 5;
  }
  if (bill.sellerTaxId) paragraph(`${l.taxId}: ${bill.sellerTaxId}`, 8);
  if (bill.customerReference)
    paragraph(`${l.customerReference}: ${bill.customerReference}`, 8);
  y += 6;
  ensure(18);
  insideTable = true;
  tableHeader();
  bill.lines.forEach((line, index) => {
    const description = lines(
      `${line.description} (${l[line.category]})`,
      68,
      8.5,
    );
    const height = Math.max(10, description.length * 4.5 + 4);
    ensure(height);
    description.forEach((part, i) => text(part, 16, y + 4 + i * 4.5, 8.5));
    doc.setFontSize(8);
    doc.text(
      new Intl.NumberFormat(reportLocaleTag(bill.locale), {
        maximumFractionDigits: 3,
      }).format(Number(line.quantity)),
      118,
      y + 4,
      { align: "right" },
    );
    doc.text(
      money(
        decimalToMinorNumber(line.unitPrice, totals.digits),
        bill.currency,
        bill.locale,
      ),
      155,
      y + 4,
      { align: "right" },
    );
    doc.text(
      money(totals.lineMinor[index], bill.currency, bill.locale),
      194,
      y + 4,
      { align: "right" },
    );
    y += height;
    doc.setDrawColor(222, 228, 235);
    doc.line(14, y, 196, y);
  });
  insideTable = false;
  y += 8;
  const summary: [string, number][] = [
    [l.subtotal, totals.subtotalMinor],
    [`${l.discount} (${bill.discountPercent}%)`, -totals.discountMinor],
    [l.net, totals.netMinor],
    [`${l.tax} (${bill.taxPercent}%)`, totals.taxMinor],
    [`${l.total} (${bill.currency})`, totals.totalMinor],
  ];
  ensure(summary.length * 7 + 4);
  summary.forEach(([label, value], i) => {
    text(label, 96, y, i === summary.length - 1 ? 10 : 9);
    doc.setFontSize(i === summary.length - 1 ? 10 : 9);
    doc.text(money(value, bill.currency, bill.locale), 196, y, {
      align: "right",
    });
    y += 7;
  });
  if (bill.notes) {
    y += 5;
    ensure(12);
    paragraph(l.notes, 10);
    paragraph(bill.notes);
  }
  if (bill.paymentDetails) {
    y += 5;
    ensure(12);
    paragraph(l.payment, 10);
    paragraph(bill.paymentDetails);
  }
  y += 5;
  paragraph(l.method, 7.5);
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page);
    doc.setTextColor(100, 110, 125);
    text(l.generated, 14, 287, 7);
    doc.setFontSize(7);
    doc.text(`${l.page} ${page} / ${pages}`, 196, 287, { align: "right" });
  }
  return doc.output("blob");
}

function decimalToMinorNumber(value: string, digits: number) {
  return Number(decimalInteger(value, digits));
}

/** Runtime-safe billing import. The current draft is retained unless the complete payload validates. */
export function parseBillJson(text: string): BillDocument {
  if (text.length > 2_000_000)
    throw new Error("Billing import is limited to 2 MB.");
  const data: unknown = JSON.parse(text);
  if (!data || typeof data !== "object" || Array.isArray(data))
    throw new Error("Invalid billing document.");
  const b = data as Record<string, unknown>;
  if (
    b.schemaVersion !== 1 ||
    !["en", "de", "yo", "pcm"].includes(String(b.locale)) ||
    !["estimate", "invoice"].includes(String(b.kind))
  )
    throw new Error("Unsupported billing schema, language or document type.");
  for (const key of [
    "projectName",
    "currency",
    "number",
    "date",
    "dueDate",
    "seller",
    "sellerTaxId",
    "customer",
    "customerReference",
    "notes",
    "paymentDetails",
    "discountPercent",
    "taxPercent",
  ]) {
    if (typeof b[key] !== "string" || (b[key] as string).length > 4000)
      throw new Error(`Invalid ${key}.`);
  }
  if (!Array.isArray(b.lines) || b.lines.length > 1000)
    throw new Error("Invalid billing lines.");
  const ids = new Set<string>();
  for (const line of b.lines) {
    if (!line || typeof line !== "object" || Array.isArray(line))
      throw new Error("Invalid billing line.");
    for (const key of ["id", "description", "quantity", "unitPrice"])
      if (typeof line[key] !== "string" || line[key].length > 240)
        throw new Error(`Invalid line ${key}.`);
    if (
      !line.id ||
      ids.has(line.id) ||
      !["material", "labour", "other"].includes(line.category)
    )
      throw new Error("Invalid line ID or category.");
    ids.add(line.id);
  }
  const bill = b as unknown as BillDocument;
  currencyDigits(bill.currency);
  return structuredClone(bill);
}

export type EngineeringReportSection =
  "summary" | "loads" | "circuits" | "issues" | "trace";
const engineeringLabels: Record<ReportLocale, Record<string, string>> = {
  en: {
    title: "Electrical engineering report",
    summary: "Calculation summary",
    loads: "Load schedule",
    circuits: "Circuit schedule",
    issues: "Issues & incomplete checks",
    trace: "Method & evidence",
    revision: "Project revision",
    engine: "Engine version",
    schema: "Schema",
    timezone: "Timezone",
    jurisdiction: "Jurisdiction / criteria",
    updated: "Input timestamp",
    installed: "Installed power",
    operating: "On-state operating demand",
    design: "Design demand",
    apparent: "Net apparent power",
    energy: "Daily energy estimate",
    cost: "Daily energy cost estimate",
    peak: "Profile peak",
    pf: "Power factor",
    phase: "Phase",
    current: "Current",
    neutral: "Fundamental neutral",
    imbalance: "Current imbalance",
    name: "Equipment / quantity",
    connection: "Connection",
    kw: "Input kW",
    amps: "On-state A",
    kwh: "Daily kWh",
    source: "Origin",
    board: "Board",
    protection: "Device A",
    cable: "Cable length",
    severity: "Assessment",
    message: "Finding",
    noLoads: "No loads have been entered.",
    noCircuits: "No circuits have been entered.",
    noIssues:
      "No issues were returned by the implemented checks. This is not an installation approval.",
    complete: "Supported calculation inputs are complete.",
    incomplete:
      "Some checks are incomplete or outside the supported model. Review the issue register.",
    boundary:
      "Calculated planning output from entered inputs. No physical inspection, installation certification or manufacturer approval is implied.",
    profile: "Illustrative daily schedule from the entered operating windows",
    hour: "Hour",
    assumptions: "Assumptions",
    references: "Source references",
    notes: "Project notes",
    notApplicable: "N/A",
    sourceDetail: "Load evidence",
    notEntered: "Not entered",
    page: "Page",
    generated: "Prepared with AdigunPowerLab",
  },
  de: {
    title: "Elektrotechnischer Berechnungsbericht",
    summary: "Berechnungsübersicht",
    loads: "Verbraucherliste",
    circuits: "Stromkreisliste",
    issues: "Hinweise & unvollständige Prüfungen",
    trace: "Methode & Nachweise",
    revision: "Projektrevision",
    engine: "Berechnungsversion",
    schema: "Schema",
    timezone: "Zeitzone",
    jurisdiction: "Geltungsbereich / Kriterien",
    updated: "Eingabezeitpunkt",
    installed: "Installierte Leistung",
    operating: "Betriebsbedarf im eingeschalteten Zustand",
    design: "Bemessungsbedarf",
    apparent: "Netto-Scheinleistung",
    energy: "Tägliche Energieschätzung",
    cost: "Tägliche Energiekostenschätzung",
    peak: "Profilspitze",
    pf: "Leistungsfaktor",
    phase: "Phase",
    current: "Strom",
    neutral: "Grundschwingungs-Neutralleiterstrom",
    imbalance: "Stromunsymmetrie",
    name: "Verbraucher / Anzahl",
    connection: "Anschluss",
    kw: "Eingang kW",
    amps: "Betrieb A",
    kwh: "Tag kWh",
    source: "Herkunft",
    board: "Verteiler",
    protection: "Gerät A",
    cable: "Kabellänge",
    severity: "Bewertung",
    message: "Feststellung",
    noLoads: "Es wurden keine Verbraucher eingegeben.",
    noCircuits: "Es wurden keine Stromkreise eingegeben.",
    noIssues:
      "Die implementierten Prüfungen meldeten keine Probleme. Dies ist keine Installationsfreigabe.",
    complete: "Eingaben für die unterstützte Berechnung sind vollständig.",
    incomplete:
      "Einige Prüfungen sind unvollständig oder außerhalb des unterstützten Modells. Prüfen Sie das Hinweisregister.",
    boundary:
      "Berechnete Planung aus eingegebenen Daten. Keine Besichtigung, Installationsbescheinigung oder Herstellerfreigabe wird behauptet.",
    profile:
      "Beispielhafter Tagesverlauf aus den eingegebenen Betriebsfenstern",
    hour: "Stunde",
    assumptions: "Annahmen",
    references: "Quellenangaben",
    notes: "Projektnotizen",
    notApplicable: "n. z.",
    sourceDetail: "Verbrauchernachweise",
    notEntered: "Nicht eingegeben",
    page: "Seite",
    generated: "Erstellt mit AdigunPowerLab",
  },
  yo: {
    title: "Ìròyìn ìṣírò ẹ̀rọ iná",
    summary: "Àkótán ìṣírò",
    loads: "Àtòjọ ohun èlò",
    circuits: "Àtòjọ iyíká iná",
    issues: "Àwọn ìṣòro àti àyẹ̀wò tí kò pé",
    trace: "Ọ̀nà àti ẹ̀rí",
    revision: "Àtúnṣe iṣẹ́",
    engine: "Ẹ̀dà ẹ̀rọ ìṣírò",
    schema: "Ẹ̀dà dátà",
    timezone: "Àgbègbè àkókò",
    jurisdiction: "Àgbègbè òfin / àlà",
    updated: "Àkókò ìwọlé",
    installed: "Agbára tí a fi sílẹ̀",
    operating: "Agbára nígbà iṣẹ́",
    design: "Agbára ìṣètò",
    apparent: "Agbára hàn àpapọ̀",
    energy: "Ìṣírò agbára ojoojúmọ́",
    cost: "Ìṣírò owó iná ojoojúmọ́",
    peak: "Òkè agbára àtòjọ",
    pf: "Ìpín agbára",
    phase: "Fésì",
    current: "Ìṣàn iná",
    neutral: "Ìṣàn nùtràlì ìpilẹ̀",
    imbalance: "Àìdọ́gba ìṣàn",
    name: "Ohun èlò / iye",
    connection: "Ìsopọ̀",
    kw: "Ìwọlé kW",
    amps: "Ní iṣẹ́ A",
    kwh: "Ọjọ́ kWh",
    source: "Orísun",
    board: "Pánẹ́lì",
    protection: "Ẹ̀rọ A",
    cable: "Gígùn okun",
    severity: "Ìdájọ́",
    message: "Àbájáde àyẹ̀wò",
    noLoads: "A kò tíì tẹ ohun èlò sílẹ̀.",
    noCircuits: "A kò tíì tẹ iyíká iná sílẹ̀.",
    noIssues: "Àyẹ̀wò tó wà kò rí ìṣòro. Èyí kì í ṣe ìwé ìfọwọ́sí fífi iná sílẹ̀.",
    complete: "Àwọn ìwọlé fún ìṣírò tó wà ti pé.",
    incomplete:
      "Àwọn àyẹ̀wò kan kò pé tàbí wọn wà lẹ́yìn àlà àwòṣe. Wo àtòjọ ìṣòro.",
    boundary:
      "Ìṣírò ètò láti ìwọlé. A kò sọ pé a ti ṣe àyẹ̀wò ojú iṣẹ́, ìfọwọ́sí tàbí àṣẹ olùpèsè.",
    profile: "Àtòjọ ọjọ́ àpẹẹrẹ láti àkókò iṣẹ́ tí a tẹ sílẹ̀",
    hour: "Wákàtí",
    assumptions: "Àwọn àfojúsùn",
    references: "Àwọn ìtọ́kasí orísun",
    notes: "Àkọsílẹ̀ iṣẹ́",
    notApplicable: "Kò kan án",
    sourceDetail: "Ẹ̀rí ohun èlò",
    notEntered: "A kò tẹ sílẹ̀",
    page: "Ojú ìwé",
    generated: "A pèsè rẹ̀ pẹ̀lú AdigunPowerLab",
  },
  pcm: {
    title: "Electrical engineering report",
    summary: "Calculation summary",
    loads: "List of loads",
    circuits: "List of circuits",
    issues: "Issues & checks wey never complete",
    trace: "Method & evidence",
    revision: "Project revision",
    engine: "Engine version",
    schema: "Data version",
    timezone: "Timezone",
    jurisdiction: "Area / rules wey apply",
    updated: "Time wey input change",
    installed: "Installed power",
    operating: "Power while equipment dey on",
    design: "Design demand",
    apparent: "Net apparent power",
    energy: "Daily energy estimate",
    cost: "Daily energy cost estimate",
    peak: "Highest profile demand",
    pf: "Power factor",
    phase: "Phase",
    current: "Current",
    neutral: "Fundamental neutral current",
    imbalance: "Current imbalance",
    name: "Equipment / how many",
    connection: "Connection",
    kw: "Input kW",
    amps: "On-state A",
    kwh: "Daily kWh",
    source: "Source",
    board: "Board",
    protection: "Device A",
    cable: "Cable length",
    severity: "Check result",
    message: "Wetin check find",
    noLoads: "You never enter any load.",
    noCircuits: "You never enter any circuit.",
    noIssues:
      "The checks wey dey available no find issue. This one no be installation approval.",
    complete: "Inputs for supported calculation don complete.",
    incomplete:
      "Some checks never complete or model no cover dem. Check the issue list.",
    boundary:
      "Planning result from inputs wey person enter. No physical inspection, installation certificate or manufacturer approval dey implied.",
    profile: "Example daily schedule from operating times wey you enter",
    hour: "Hour",
    assumptions: "Assumptions",
    references: "Source references",
    notes: "Project notes",
    notApplicable: "N/A",
    sourceDetail: "Load evidence",
    notEntered: "Nobody enter am",
    page: "Page",
    generated: "Prepared with AdigunPowerLab",
  },
};

export async function createEngineeringPdf(
  projectInput: Project,
  resultInput: CalculationResult,
  options: {
    locale?: ReportLocale;
    sections?: EngineeringReportSection[];
    fontBase64?: string;
  } = {},
): Promise<Blob> {
  const project = structuredClone(projectInput);
  const result = structuredClone(resultInput);
  if (project.revision !== result.revision)
    throw new Error(
      "Recalculate the current project revision before exporting.",
    );
  const locale = options.locale ?? "en";
  const l = engineeringLabels[locale];
  const sections = options.sections ?? [
    "summary",
    "loads",
    "circuits",
    "issues",
    "trace",
  ];
  const [{ jsPDF }, font] = await Promise.all([
    import("jspdf"),
    options.fontBase64 ? Promise.resolve(options.fontBase64) : embeddedFont(),
  ]);
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  doc.addFileToVFS("DejaVuSans.ttf", font);
  doc.addFont("DejaVuSans.ttf", "PowerLab", "normal");
  doc.setFont("PowerLab", "normal");
  doc.setProperties({
    title: `AdigunPowerLab — ${project.name}`,
    subject: l.title,
    creator: "AdigunPowerLab",
  });
  let y = 16;
  const margin = 14,
    width = 182;
  const number = (n: number | null, digits = 3) =>
    n === null || !Number.isFinite(n)
      ? l.notApplicable
      : new Intl.NumberFormat(reportLocaleTag(locale), {
          maximumFractionDigits: digits,
        }).format(n);
  const put = (value: string, x: number, yy: number, size = 9) => {
    doc.setFontSize(size);
    doc.text(value, x, yy);
  };
  const split = (value: string, w: number, size = 9): string[] => {
    doc.setFontSize(size);
    return doc.splitTextToSize(value, w) as string[];
  };
  const page = () => {
    doc.addPage();
    y = 15;
    doc.setTextColor(30, 45, 65);
    put(`AdigunPowerLab · ${l.revision} ${project.revision}`, margin, y, 8);
    y += 10;
  };
  const need = (height: number) => {
    if (y + height > 278) page();
  };
  const paragraph = (value: string, size = 9) => {
    for (const line of split(value, width, size)) {
      need(5);
      put(line, margin, y, size);
      y += 5;
    }
  };
  const heading = (value: string) => {
    need(20);
    y += 5;
    doc.setTextColor(8, 96, 115);
    put(value, margin, y, 12);
    doc.setTextColor(25, 40, 60);
    y += 8;
  };
  const table = (headers: string[], widths: number[], rows: string[][]) => {
    const rowHeight = (cells: string[]) =>
      Math.max(
        ...cells.map((cell, i) => split(cell, widths[i] - 4, 8).length),
      ) *
        4.2 +
      5;
    const draw = (cells: string[], header: boolean) => {
      const height = rowHeight(cells);
      if (header) {
        doc.setFillColor(235, 241, 247);
        doc.rect(margin, y, width, height, "F");
      }
      let x = margin;
      cells.forEach((cell, i) => {
        const wrapped = split(cell, widths[i] - 4, 8);
        wrapped.forEach((line, j) => put(line, x + 2, y + 4 + j * 4.2, 8));
        x += widths[i];
      });
      y += height;
      doc.setDrawColor(225, 231, 237);
      doc.line(margin, y, margin + width, y);
    };
    need(rowHeight(headers) + 12);
    draw(headers, true);
    for (const cells of rows) {
      const height = rowHeight(cells);
      if (y + height > 277) {
        page();
        draw(headers, true);
      }
      draw(cells, false);
    }
    y += 6;
  };
  doc.setTextColor(15, 35, 55);
  put("AdigunPowerLab", margin, y, 19);
  put("BY HB ELEKTRONIKER", 145, y, 8);
  y += 11;
  paragraph(l.title, 14);
  y += 3;
  paragraph(project.name, 12);
  y += 2;
  paragraph(
    `${l.revision}: ${project.revision} · ${l.engine}: ${result.engineVersion} · ${l.schema}: ${project.schemaVersion}`,
    8,
  );
  paragraph(
    `${l.updated}: ${project.updatedAt} · ${l.timezone}: ${project.timezone}`,
    8,
  );
  paragraph(`${l.jurisdiction}: ${project.jurisdiction}`, 8);
  y += 4;
  paragraph(l.boundary, 8);
  if (sections.includes("summary")) {
    heading(l.summary);
    table(
      [l.summary, ""],
      [110, 72],
      [
        [l.installed, `${number(result.installedKW)} kW`],
        [l.operating, `${number(result.operatingKW)} kW`],
        [l.design, `${number(result.designKW)} kW`],
        [l.apparent, `${number(result.apparentKVA)} kVA`],
        [l.pf, number(result.powerFactor, 4)],
        [l.energy, `${number(result.dailyKWh)} kWh`],
        [
          l.cost,
          new Intl.NumberFormat(reportLocaleTag(locale), {
            style: "currency",
            currency: project.currency,
          }).format(result.dailyCost),
        ],
        [l.peak, `${number(result.peakKW)} kW`],
        [l.neutral, `${number(result.neutralA)} A`],
        [l.imbalance, `${number(result.imbalancePercent, 2)} %`],
      ],
    );
    paragraph(result.complete ? l.complete : l.incomplete, 8);
    table(
      [l.phase, l.current, l.amps],
      [60, 61, 61],
      (["L1", "L2", "L3"] as const).map((phase) => [
        phase,
        `${number(result.phaseCurrents[phase])} A`,
        `${number(result.phaseOnStateCurrents[phase])} A`,
      ]),
    );
    if (result.profile.length) {
      need(70);
      paragraph(l.profile, 9);
      const x0 = 24,
        y0 = y + 43,
        w = 162,
        h = 35;
      const max = Math.max(1, ...result.profile.map((p) => p.kw));
      doc.setDrawColor(175, 190, 205);
      doc.line(x0, y0, x0 + w, y0);
      doc.line(x0, y0, x0, y0 - h);
      put(`${number(max, 2)} kW`, 14, y0 - h - 3, 7);
      put("0", 17, y0, 7);
      doc.setDrawColor(8, 155, 178);
      doc.setLineWidth(0.7);
      for (let i = 1; i < result.profile.length; i++) {
        const a = result.profile[i - 1],
          b = result.profile[i];
        doc.line(
          x0 + (a.hour / 24) * w,
          y0 - (a.kw / max) * h,
          x0 + (b.hour / 24) * w,
          y0 - (b.kw / max) * h,
        );
      }
      doc.setLineWidth(0.2);
      [0, 6, 12, 18, 24].forEach((hour) =>
        put(String(hour), x0 + (hour / 24) * w - 1, y0 + 5, 7),
      );
      put(l.hour, x0 + w - 10, y0 + 11, 7);
      y = y0 + 18;
    }
  }
  if (sections.includes("loads")) {
    heading(l.loads);
    const byId = new Map(result.loads.map((load) => [load.id, load]));
    if (!project.loads.length) paragraph(l.noLoads);
    else
      table(
        [l.name, l.connection, l.kw, l.amps, l.kwh, l.source],
        [63, 29, 23, 23, 25, 19],
        project.loads.map((load) => {
          const normalized = byId.get(load.id);
          return [
            `${load.name}\n× ${load.quantity} · ${load.entryMode}`,
            `${load.connection}\n${load.connection === "three" ? "L1/L2/L3" : load.phase}`,
            normalized?.valid
              ? number(normalized.operatingKW)
              : l.notApplicable,
            normalized?.valid ? number(normalized.currentA) : l.notApplicable,
            normalized?.valid ? number(normalized.energyKWh) : l.notApplicable,
            load.source.kind,
          ];
        }),
      );
  }
  if (sections.includes("circuits")) {
    heading(l.circuits);
    if (!project.circuits.length) paragraph(l.noCircuits);
    else
      table(
        [l.circuits, l.board, l.phase, l.protection, l.cable],
        [61, 44, 20, 26, 31],
        project.circuits.map((circuit) => [
          circuit.name,
          project.boards.find((board) => board.id === circuit.boardId)?.name ??
            circuit.boardId,
          circuit.phase,
          circuit.protectiveA === undefined
            ? l.notEntered
            : number(circuit.protectiveA),
          circuit.cable ? `${number(circuit.cable.lengthM)} m` : l.notEntered,
        ]),
      );
  }
  if (sections.includes("issues")) {
    heading(l.issues);
    if (!result.issues.length) paragraph(l.noIssues);
    else
      table(
        [l.severity, l.message],
        [35, 147],
        result.issues.map((issue) => [
          `${issue.severity}\n${issue.assessment}`,
          `${issue.message}${issue.entityId ? `\nID: ${issue.entityId}` : ""}`,
        ]),
      );
  }
  if (sections.includes("trace")) {
    heading(l.trace);
    paragraph(result.trace.method);
    paragraph(result.trace.formula, 8);
    paragraph(
      `${result.trace.origin} · ${result.trace.assessment} · ${l.revision} ${result.trace.revision}`,
      8,
    );
    heading(l.assumptions);
    for (const assumption of result.trace.assumptions)
      paragraph(`• ${assumption}`, 8);
    if (result.trace.sources.length) {
      heading(l.references);
      for (const source of result.trace.sources) paragraph(source, 8);
    }
    if (project.loads.length) {
      heading(l.sourceDetail);
      for (const load of project.loads) {
        paragraph(
          `${load.name}: ${load.source.kind} — ${load.source.reference}${load.source.date ? ` (${load.source.date})` : ""}`,
          8,
        );
      }
    }
    if (project.notes) {
      heading(l.notes);
      paragraph(project.notes, 8);
    }
  }
  const count = doc.getNumberOfPages();
  for (let p = 1; p <= count; p++) {
    doc.setPage(p);
    doc.setTextColor(100, 110, 125);
    put(l.generated, 14, 287, 7);
    doc.setFontSize(7);
    doc.text(`${l.page} ${p} / ${count}`, 196, 287, { align: "right" });
  }
  return doc.output("blob");
}
