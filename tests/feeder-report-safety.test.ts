import { describe, expect, it } from "vitest";
import {
  createCircuit,
  createLoad,
  createProject,
} from "../src/domain/project";
import { calculateProject } from "../src/engine/electrical";
import { translate } from "../src/i18n";
import type { ReportLocale } from "../src/import-export/reports";
import {
  reportBlocks,
  type ReportBlock,
} from "../src/import-export/reportSections";
import { freezeReportSnapshot } from "../src/import-export/reportSnapshot";

function fixture() {
  const project = createProject("Independent feeder report verification");
  const board = project.boards[0];
  board.name = "Shared board";
  board.feeder = {
    lengthM: 100,
    resistanceOhmPerKm: 1,
    reactanceOhmPerKm: 0,
    baseAmpacityA: 15,
    correctionFactors: [1],
    voltageDropLimitPercent: 5,
    source: "Independent entered conductor test values",
  };
  const circuit = createCircuit(board.id, {
    name: "Final branch",
    cable: structuredClone(board.feeder),
  });
  const target = createLoad({
    name: "Lagging machine",
    entryMode: "amps",
    rating: 10,
    pf: 0.5,
    phase: "L1",
    reactive: "lagging",
    boardId: board.id,
    circuitId: circuit.id,
  });
  const other = createLoad({
    name: "Leading branch",
    entryMode: "amps",
    rating: 10,
    pf: 0.5,
    phase: "L2",
    reactive: "leading",
    boardId: board.id,
  });
  project.circuits = [circuit];
  project.loads = [target, other];
  return { project, target, other };
}

type ReportTable = Extract<ReportBlock, { kind: "table" }>;
function tables(
  project: ReturnType<typeof createProject>,
  locale: ReportLocale,
) {
  const snapshot = freezeReportSnapshot(project, calculateProject(project), {
    locale,
  });
  return reportBlocks(snapshot, "assessments").filter(
    (block): block is ReportTable => block.kind === "table",
  );
}

describe("feeder safety in exported engineering report blocks", () => {
  it("shows a failed conductor limit beside a passed voltage result and reports neutral overload evidence", () => {
    const { project, target } = fixture();
    const blocks = tables(project, "en");
    const routes = blocks.find((block) => block.headers[0] === "Endpoint")!;
    const route = routes.rows.find((row) => row[0] === target.name)!;
    expect(route.at(-2)).toBe("passed");
    expect(route.at(-1)).toBe("failed");

    const capacities = blocks.find((block) => block.headers[0] === "Segment")!;
    const feeder = capacities.rows.find(
      (row) => row[0] === "Shared board feeder",
    )!;
    // Two 10 A currents with coincident -60° phase angles sum to 20 A in N.
    expect(feeder.slice(1, 4)).toEqual(["failed", "20 / 15 A", "20 A"]);
    expect(feeder[4]).toBe("Independent entered conductor test values");
    expect(capacities.rows.filter((row) => row[0] === feeder[0])).toHaveLength(
      1,
    );
  });

  it("exports incompatible feeder currents as unavailable with an unsupported check", () => {
    const { project, target, other } = fixture();
    Object.assign(other, { connection: "dc", voltage: 48, pf: 1 });
    const blocks = tables(project, "en");
    const routes = blocks.find((block) => block.headers[0] === "Endpoint")!;
    expect(routes.rows.find((row) => row[0] === target.name)?.at(-1)).toBe(
      "unsupported",
    );
    const capacities = blocks.find((block) => block.headers[0] === "Segment")!;
    expect(
      capacities.rows
        .find((row) => row[0] === "Shared board feeder")
        ?.slice(1, 4),
    ).toEqual(["unsupported", "Not available / 15 A", "Not available A"]);
  });

  it.each<ReportLocale>(["de", "yo", "pcm"])(
    "uses the existing translated capacity and unavailable labels in %s",
    (locale) => {
      const { project, other } = fixture();
      Object.assign(other, { connection: "dc", voltage: 48, pf: 1 });
      const blocks = tables(project, locale);
      const capacities = blocks.find(
        (block) => block.headers[0] === translate("Segment", locale),
      )!;
      expect(capacities.headers).toEqual(
        [
          "Segment",
          "Capacity check",
          "Value / limit",
          "Neutral current",
          "Source",
        ].map((label) => translate(label, locale)),
      );
      const feeder = capacities.rows.find(
        (row) => row[0] === "Shared board feeder",
      )!;
      expect(feeder[1]).toBe(translate("unsupported", locale));
      expect(feeder[2]).toBe(`${translate("Not available", locale)} / 15 A`);
      expect(feeder[3]).toBe(`${translate("Not available", locale)} A`);
    },
  );
});
