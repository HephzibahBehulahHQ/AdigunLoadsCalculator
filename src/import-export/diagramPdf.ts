import type { jsPDF } from "jspdf";
import type { DiagramSnapshot } from "../commands/diagram";
import { embeddedFont, type ReportLocale } from "./reports";
import { translate } from "../i18n";

/** Vector tiles retain readable type and repeat overlapping boundaries instead of shrinking a large graph into illegibility. */
export function appendDiagramPages(
  doc: jsPDF,
  snapshot: DiagramSnapshot,
  options: {
    locale?: ReportLocale;
    firstPage?: boolean;
    showTileFooter?: boolean;
  } = {},
): void {
  const t = (key: string) => translate(key, options.locale ?? "en");
  if (
    !Number.isFinite(snapshot.width) ||
    !Number.isFinite(snapshot.height) ||
    snapshot.width <= 0 ||
    snapshot.height <= 0 ||
    snapshot.nodes.length > 10000
  )
    throw new Error("Diagram bounds or size are invalid.");
  for (const node of snapshot.nodes)
    if (
      ![node.x, node.y, node.width, node.height].every(Number.isFinite) ||
      node.width <= 0 ||
      node.height <= 0
    )
      throw new Error("Diagram contains an invalid node position or size.");
  const pageW = doc.internal.pageSize.getWidth(),
    pageH = doc.internal.pageSize.getHeight(),
    margin = 14,
    top = 43,
    bottom = 20;
  const viewW = pageW - margin * 2,
    viewH = pageH - top - bottom,
    scale = 0.24;
  const overlapX = Math.min(
      viewW / 3,
      Math.max(20, ...snapshot.nodes.map((n) => n.width * scale + 4)),
    ),
    overlapY = Math.min(
      viewH / 3,
      Math.max(15, ...snapshot.nodes.map((n) => n.height * scale + 4)),
    );
  const stepX = viewW - overlapX,
    stepY = viewH - overlapY;
  const columns = Math.max(
      1,
      Math.ceil((snapshot.width * scale - overlapX) / stepX),
    ),
    rows = Math.max(1, Math.ceil((snapshot.height * scale - overlapY) / stepY));
  if (columns * rows > 500)
    throw new Error(
      "Diagram requires more than 500 readable pages. Split the project or reduce unused layout space before exporting.",
    );
  const byId = new Map(snapshot.nodes.map((node) => [node.id, node]));
  const colors: Record<string, [number, number, number]> = {
    source: [220, 244, 247],
    board: [231, 238, 248],
    circuit: [244, 239, 221],
    load: [235, 243, 237],
  };
  for (let row = 0; row < rows; row++)
    for (let column = 0; column < columns; column++) {
      if (!options.firstPage || row || column) doc.addPage();
      doc.setFont("PowerLab", "normal");
      doc.setTextColor(20, 40, 60);
      doc.setFontSize(14);
      doc.text("AdigunPowerLab · " + t("Single-line diagram"), margin, 16);
      doc.setFontSize(9);
      doc.text(doc.splitTextToSize(snapshot.projectName, viewW), margin, 23);
      doc.setFontSize(7);
      doc.text(
        `${t("Revision")} ${snapshot.revision} · ${t("Tile")} ${row + 1}/${rows} × ${column + 1}/${columns} · ${t("Entered topology; not installation certification")}`,
        margin,
        top - 5,
      );
      const offsetX = column * stepX,
        offsetY = row * stepY,
        x = (value: number) => margin + value * scale - offsetX,
        y = (value: number) => top + value * scale - offsetY;
      doc.saveGraphicsState();
      doc.rect(margin, top, viewW, viewH, null);
      doc.clip();
      doc.discardPath();
      doc.setDrawColor(90, 115, 135);
      doc.setLineWidth(0.4);
      for (const edge of snapshot.edges) {
        const from = byId.get(edge.from),
          to = byId.get(edge.to);
        if (!from || !to)
          throw new Error("Diagram edge refers to a missing node.");
        const a = { x: x(from.x + from.width / 2), y: y(from.y + from.height) },
          b = { x: x(to.x + to.width / 2), y: y(to.y) },
          middle = (a.y + b.y) / 2;
        doc.line(a.x, a.y, a.x, middle);
        doc.line(a.x, middle, b.x, middle);
        doc.line(b.x, middle, b.x, b.y);
        if (edge.label && snapshot.showLabels) {
          doc.setFontSize(6.5);
          doc.setTextColor(65, 85, 105);
          const labelWidth = Math.max(
            25,
            Math.min(60, Math.abs(b.x - a.x) || 40),
          );
          const labelX = Math.min(a.x, b.x) + 2,
            labelY = middle - 2;
          if (
            labelX >= margin &&
            labelX + labelWidth <= pageW - margin &&
            labelY >= top + 3 &&
            labelY + 8 <= pageH - bottom
          )
            doc.text(
              doc.splitTextToSize(edge.label, labelWidth).slice(0, 3),
              labelX,
              labelY,
            );
        }
      }
      for (const node of snapshot.nodes) {
        const xx = x(node.x),
          yy = y(node.y),
          w = node.width * scale,
          h = node.height * scale;
        if (
          xx + w < margin ||
          xx > pageW - margin ||
          yy + h < top ||
          yy > pageH - bottom
        )
          continue;
        doc.setFillColor(...(colors[node.kind] ?? colors.load));
        doc.setDrawColor(65, 95, 115);
        doc.roundedRect(xx, yy, w, h, 1, 1, "FD");
        doc.setTextColor(20, 40, 60);
        doc.setFontSize(8);
        if (
          xx < margin ||
          xx + w > pageW - margin ||
          yy < top ||
          yy + h > pageH - bottom
        )
          continue;
        const title = `${node.symbol ? node.symbol + " · " : ""}${snapshot.showLabels ? node.name : node.id}`;
        doc.text(
          doc
            .splitTextToSize(title, Math.max(4, w - 4))
            .slice(0, Math.max(1, Math.floor((h - 6) / 3.6))),
          xx + 2,
          yy + 4,
        );
        if (snapshot.showRatings && node.detail) {
          doc.setFontSize(6.5);
          doc.text(
            doc.splitTextToSize(node.detail, Math.max(4, w - 4)).slice(0, 2),
            xx + 2,
            yy + h - 5,
          );
        }
      }
      for (const [index, note] of snapshot.notes.entries()) {
        doc.setFontSize(8);
        doc.setTextColor(110, 70, 20);
        if (
          x(note.x) >= margin &&
          x(note.x) + 25 <= pageW - margin &&
          y(note.y) >= top + 4 &&
          y(note.y) <= pageH - bottom
        )
          doc.text(`${t("Note")} ${index + 1}`, x(note.x), y(note.y));
      }
      doc.restoreGraphicsState();
      doc.setDrawColor(170, 185, 195);
      doc.rect(margin, top, viewW, viewH);
      doc.setFontSize(7);
      doc.setTextColor(80, 95, 110);
      if (options.showTileFooter !== false)
        doc.text(
          t(
            "Overlapping vector tiles preserve readable labels. Full connection details and notes follow.",
          ),
          margin,
          pageH - 11,
        );
    }
  doc.addPage();
  let y = 18;
  doc.setFontSize(13);
  doc.setTextColor(20, 40, 60);
  doc.text(t("Diagram legend & source details"), margin, y);
  y += 9;
  const paragraph = (value: string) => {
    doc.setFontSize(8);
    for (const line of doc.splitTextToSize(value, viewW)) {
      if (y > pageH - 20) {
        doc.addPage();
        y = 18;
      }
      doc.text(line, margin, y);
      y += 4;
    }
    y += 2;
  };
  paragraph(
    t(
      "Source → distribution board → circuit → load. Lines represent modeled electrical relationships; they do not measure cable length.",
    ),
  );
  for (const node of snapshot.nodes)
    paragraph(
      `${node.id} · ${t(node.kind)} · ${node.name}${node.detail ? " · " + node.detail : ""}`,
    );
  for (const edge of snapshot.edges)
    if (edge.label) paragraph(`${edge.from} → ${edge.to}: ${edge.label}`);
  for (const [index, note] of snapshot.notes.entries())
    paragraph(`${t("Note")} ${index + 1}: ${note.text}`);
}

export async function createDiagramPdf(
  snapshotInput: DiagramSnapshot,
  options: { locale?: ReportLocale; fontBase64?: string } = {},
): Promise<Blob> {
  const snapshot = structuredClone(snapshotInput),
    [{ jsPDF }, font] = await Promise.all([
      import("jspdf"),
      options.fontBase64 ? Promise.resolve(options.fontBase64) : embeddedFont(),
    ]);
  const doc = new jsPDF({
    unit: "mm",
    format: snapshot.pageSize,
    orientation: snapshot.orientation,
    compress: true,
  });
  doc.addFileToVFS("DejaVuSans.ttf", font);
  doc.addFont("DejaVuSans.ttf", "PowerLab", "normal");
  doc.setFont("PowerLab", "normal");
  doc.setProperties({
    title: `${snapshot.projectName} — single-line diagram`,
    creator: "AdigunPowerLab",
    subject: `Project revision ${snapshot.revision}; vector topology`,
  });
  appendDiagramPages(doc, snapshot, {
    locale: options.locale,
    firstPage: true,
  });
  const count = doc.getNumberOfPages();
  for (let i = 1; i <= count; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(80, 95, 110);
    doc.text(
      `${i} / ${count}`,
      doc.internal.pageSize.getWidth() - 14,
      doc.internal.pageSize.getHeight() - 6,
      { align: "right" },
    );
  }
  return doc.output("blob");
}
