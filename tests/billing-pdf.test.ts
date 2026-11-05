import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  createBillPdf,
  createEngineeringPdf,
} from "../src/import-export/reports";
import type { BillDocument } from "../src/import-export/reports";
import { createLoad, createProject } from "../src/domain/project";
import { calculateProject } from "../src/engine/electrical";

const fontBase64 = readFileSync(
  resolve("public/assets/fonts/DejaVuSans.ttf"),
).toString("base64");
const fixture = (locale: "en" | "yo"): BillDocument => ({
  schemaVersion: 1,
  projectName: "Analytical report fixture — Yorùbá, Überprüfung, ààbò ẹ̀rọ iná",
  currency: "EUR",
  locale,
  kind: "estimate",
  number: "QA-2026-001",
  date: "2026-11-05",
  dueDate: "2026-12-05",
  seller: "Analytical test supplier\nNot a real company or customer invoice",
  sellerTaxId: "",
  customer: "Analytical test customer\nÀdánwò Yorùbá / Hamburg",
  customerReference: "QA only",
  notes:
    "An explicitly labelled generated reference document. All quantities and prices are analytical verification inputs.",
  paymentDetails: "",
  discountPercent: "10",
  taxPercent: "19",
  lines: Array.from({ length: 90 }, (_, i) => ({
    id: `qa-${i}`,
    description: `${i + 1}. Àtùpà / Leitung für Überprüfung — analytical material line, entered length 2.5 m`,
    category: i % 2 ? "labour" : "material",
    quantity: "2.5",
    unitPrice: "19.99",
  })),
});

async function verifyPdf(blob: Blob, name: string) {
  const bytes = Buffer.from(await blob.arrayBuffer());
  expect(bytes.subarray(0, 4).toString()).toBe("%PDF");
  expect(bytes.length).toBeGreaterThan(20000);
  const pageCount =
    bytes.toString("latin1").match(/\/Type \/Page\b/g)?.length ?? 0;
  expect(pageCount).toBeGreaterThan(1);
  if (process.env.POWERLAB_PDF_QA_DIR) {
    mkdirSync(process.env.POWERLAB_PDF_QA_DIR, { recursive: true });
    writeFileSync(resolve(process.env.POWERLAB_PDF_QA_DIR, name), bytes);
  }
}

describe("real Unicode PDF export", () => {
  it.each(["en", "yo"] as const)(
    "renders a paginated %s estimate with an embedded font",
    async (locale) => {
      await verifyPdf(
        await createBillPdf(fixture(locale), { fontBase64 }),
        `reference-estimate-${locale}.pdf`,
      );
    },
  );
  it("renders a frozen engineering revision and rejects stale results", async () => {
    const project = createProject(
      "Analytical electrical report — Überprüfung / Yorùbá",
      "2026-11-05T12:00:00.000Z",
    );
    project.loads = Array.from({ length: 45 }, (_, i) =>
      createLoad({
        id: `load-${i}`,
        name: `Analytical load ${i + 1} — Àtùpà`,
        rating: 2.3,
        voltage: 230,
        pf: 1,
        hoursPerDay: 8,
        duty: 0.5,
        phase: (["L1", "L2", "L3"] as const)[i % 3],
        source: {
          kind: "user",
          reference:
            "F01/F03 arithmetic scaled only for multipage rendering; not a surveyed installation.",
        },
      }),
    );
    const result = calculateProject(project);
    await verifyPdf(
      await createEngineeringPdf(project, result, { locale: "de", fontBase64 }),
      "reference-engineering-de.pdf",
    );
    await expect(
      createEngineeringPdf(
        { ...project, revision: project.revision + 1 },
        result,
        { fontBase64 },
      ),
    ).rejects.toThrow("Recalculate");
  });
});
