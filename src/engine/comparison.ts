import type { Project, Issue } from "../domain/types";
import { calculateProject } from "./electrical";
import {
  simulateRange,
  simulateEnergy,
  type EnergyOptions,
} from "./simulation";
import { simulateStartEvents } from "./start-events";
import { assessEndpointRoute } from "./feeders";
export interface ComparisonOptions {
  start: string;
  end: string;
  outageRange?: EnergyOptions["outageRange"];
}
export interface ScenarioMetrics {
  projectId: string;
  revision: number;
  name: string;
  currency: string;
  timezone: string;
  values: Record<string, number | null>;
  issues: string[];
  assumptions: string[];
}
export function compareScenarioPeriod(
  project: Project,
  options: ComparisonOptions,
): ScenarioMetrics {
  const elapsed =
    (Date.parse(options.end) - Date.parse(options.start)) / 86400000;
  if (!Number.isFinite(elapsed) || elapsed <= 0 || elapsed > 31)
    throw new Error("Compare a positive range of at most 31 elapsed days.");
  const design = calculateProject(project),
    calendar = simulateRange(project, {
      start: options.start,
      end: options.end,
      intervalMinutes: 15,
    }),
    energy = simulateEnergy(project, {
      range: options,
      intervalMinutes: 15,
      outageRange: options.outageRange,
    });
  let starts:{peakKVA:number;issues:Issue[]}|undefined;
  const periodStart=Date.parse(options.start),periodEnd=Date.parse(options.end);
  for(let start=periodStart;start<periodEnd;start+=7*86400000){const end=Math.min(periodEnd,start+7*86400000);const events=project.startEvents?.filter(event=>Date.parse(event.start)<end&&Date.parse(event.start)+event.durationSeconds*1000>start);if(events?.length){const run=simulateStartEvents({...project,startEvents:events},{start:new Date(start).toISOString(),end:new Date(end).toISOString()});starts={peakKVA:Math.max(starts?.peakKVA??0,run.peakKVA),issues:[...(starts?.issues??[]),...run.issues]};}}
  const routes = new Map<string, string>();
  let lossComplete = project.loads.length > 0;
  for (const load of project.loads) {
    const key = load.circuitId ?? load.boardId;
    if (key && !routes.has(key)) routes.set(key, load.id);
    if (!key) lossComplete = false;
  }
  const segments = new Map<string, number>();
  const feederIssues: string[] = [];
  for (const loadId of routes.values()) {
    const route = assessEndpointRoute(project, loadId, {
      scenario: "running",
      at: options.start,
    });
    if (!route.complete) lossComplete = false;
    for (const segment of route.segments) {
      if (segment.lossW === null) lossComplete = false;
      else segments.set(segment.id, segment.lossW);
    }
    feederIssues.push(...route.issues.map((issue) => issue.message));
  }
  const values: ScenarioMetrics["values"] = {
    installedKW: design.installedKW,
    designKW: design.designKW,
    phaseL1A: design.phaseOnStateCurrents.L1,
    phaseL2A: design.phaseOnStateCurrents.L2,
    phaseL3A: design.phaseOnStateCurrents.L3,
    intervalPeakKW: calendar.peakKW,
    startPeakKVA: starts?.peakKVA ?? null,
    loadKWh: energy.loadKWh,
    generationKWh: energy.generationKWh,
    importKWh: energy.importKWh,
    exportKWh: energy.exportKWh,
    storageLossKWh: energy.lossesKWh,
    curtailedKWh: energy.curtailedKWh,
    unservedKWh: energy.unservedKWh,
    criticalUnservedKWh: energy.criticalUnservedKWh,
    feederLossW: lossComplete
      ? [...segments.values()].reduce((sum, value) => sum + value, 0)
      : null,
    totalCost: energy.bill?.complete===false || !energy.complete ? null : energy.totalCost,
    carbonKg:
      project.tariff.carbonKgPerKWh === undefined
        ? null
        : energy.importKWh * project.tariff.carbonKgPerKWh,
    unresolvedChecks:
      design.issues.filter((issue) =>
        ["incomplete", "unsupported", "failed"].includes(issue.assessment),
      ).length +
      energy.issues.filter((issue) =>
        ["incomplete", "unsupported", "failed"].includes(issue.assessment),
      ).length,
  };
  return {
    projectId: project.id,
    revision: project.revision,
    name: project.name,
    currency: project.currency,
    timezone: project.timezone,
    values,
    issues: [
      ...new Set(
        [
          ...design.issues,
          ...calendar.issues,
          ...energy.issues,
          ...(starts?.issues ?? []),
        ]
          .map((issue) => issue.message)
          .concat(feederIssues),
      ),
    ],
    assumptions: [
      energy.method,
      "Both projects use the same explicit elapsed period; each retains its entered timezone, tariff and equipment assumptions.",
      "Phase currents are on-state design values; interval demand is a chronological 15-minute average. These definitions are kept separate.",
      "Feeder losses are nominal-model instantaneous losses at the comparison start. Missing route evidence is unavailable, not zero. Storage losses are integrated separately.",
      "Starting capacity is unavailable unless explicit events overlap the selected period. Carbon covers imported energy only and needs an entered factor; no avoided-export credit is inferred.",
    ],
  };
}
