import type { Cable, Load, Project } from "../domain/types";
import { previewProjectCommand, type CommandPreview, type LoadPatch, type ProjectCommand } from "../commands/projectCommands";
import { calculateProject } from "../engine/electrical";
import { tools } from "./index";
import type { ToolResult, ToolValues } from "./types";

export type ToolTarget = { kind: "load" | "board" | "circuit" | "energy" | "ev" | "project"; id?: string };
export interface ToolApplication { targetKind: ToolTarget["kind"]; label: string; description: string }
const mappings: Record<string, ToolApplication> = {
  T01: { targetKind: "load", label: "Apply DC resistor input", description: "Sets one DC load's electrical input and voltage. Connect only through a supported DC model; AC assignments must be disconnected first." },
  T02: { targetKind: "load", label: "Apply DC load values", description: "Sets per-unit DC input, quantity, voltage and daily hours. The elapsed period must fit a 0–24 hour daily schedule." },
  T03: { targetKind: "load", label: "Apply single-phase load values", description: "Sets one sinusoidal single-phase load's input, voltage and displacement PF. Quantity becomes 1; schedule remains unchanged." },
  T04: { targetKind: "load", label: "Apply three-phase load values", description: "Sets one balanced three-phase load's input, line voltage and displacement PF. Quantity becomes 1." },
  T05: { targetKind: "load", label: "Apply signed complex input", description: "Sets one load's consumption kW and signed kvar. Negative real-power generation is not a supported appliance entry." },
  T09: { targetKind: "load", label: "Apply electrical input", description: "Stores already-converted electrical input in kW. Efficiency is not applied a second time. Quantity becomes 1." },
  T10: { targetKind: "load", label: "Apply motor operating point", description: "Stores one motor's shaft power, efficiency, displacement PF, connection and terminal voltage." },
  T15: { targetKind: "circuit", label: "Apply conductor resistance data", description: "Copies route length, cross-section and operating-temperature resistance per kilometre. Parallel conductors require a separately supported installation model." },
  T17: { targetKind: "circuit", label: "Apply AC cable data", description: "Copies entered route length and conductor R/X. Entered test current and PF are not forced onto connected loads." },
  T20: { targetKind: "circuit", label: "Apply sourced ampacity factors", description: "Copies the entered base ampacity and individual correction factors with source evidence. Existing cable length is required." },
  T21: { targetKind: "circuit", label: "Apply entered protective-device data", description: "Copies entered device rating, breaking capacity and prospective fault current. Assessment status remains independently calculated." },
  T22: { targetKind: "circuit", label: "Apply modelled maximum fault current", description: "Stores the calculated upper symmetrical RMS fault-current estimate with the stated source/path assumptions." },
  T36: { targetKind: "energy", label: "Apply battery energy window", description: "Copies nominal kWh, minimum/maximum/initial SOC and discharge efficiency. Power limits and island capability remain explicit project inputs." },
  T37: { targetKind: "energy", label: "Apply battery limits and efficiencies", description: "Copies the stated capacity, reserve, initial SOC, AC power limits and efficiencies. Existing maximum SOC and island capability are retained." },
  T39: { targetKind: "energy", label: "Apply PV assumptions", description: "Daily mode copies capacity, resource hours and combined performance factor and clears the old chronological profile. Profile mode requires exactly 24 one-hour values and stores delivered AC shape with losses/clipping already included." },
  T42: { targetKind: "ev", label: "Apply EV energy and power limits", description: "Copies required battery energy and charger/vehicle/site limits. Existing arrival/departure times remain; rerun the EV planner against those times." },
  T46: { targetKind: "project", label: "Apply verified project coincidence", description: "Requires the tool's installed and individual maximum totals to match the current project. Applies only the coincidence factor." },
  T49: { targetKind: "project", label: "Apply sourced operational carbon factor", description: "Copies kg CO₂e/kWh with geography, period and method. Export credits are not introduced." },
};

export function toolApplicationInfo(toolId: string): ToolApplication | undefined { return mappings[toolId]; }
function numeric(values: ToolValues, key: string): number {
  const value = values[key];
  if (value === undefined || String(value).trim() === "" || !Number.isFinite(Number(value))) throw new Error(`${key}: enter a finite value before applying.`);
  return Number(value);
}
function resultNumber(result: ToolResult, label: string): number {
  const value = result.values.find((item) => item.label === label)?.value;
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`The calculation has no finite ${label} value to apply.`);
  return value;
}
function trace(toolId: string, values: ToolValues, result: ToolResult): string {
  const text = `[${toolId} calculation · ${result.status}]\nInputs: ${JSON.stringify(values)}\n${result.values.map((item) => `${item.label}: ${item.value}${item.unit ? " " + item.unit : ""}`).join("\n")}\nMethod: ${result.formula}\n${result.notes.join("\n")}\n${result.warnings.length ? "Warnings: " + result.warnings.join("; ") + "\n" : ""}Sources: ${result.sources.join("; ") || "Entered assumptions; no external evidence supplied."}`;
  if (text.length > 50000) throw new Error("This calculation trace exceeds the 50,000-character attachment limit. Export the complete calculation instead.");
  return text;
}
const appended = (original: string | undefined, note: string) => original?.trim() ? `${original.trim()}\n\n${note}` : note;
function noteCommand(project: Project, target: ToolTarget, note: string): ProjectCommand {
  if (target.kind === "load") { const load = project.loads.find((item) => item.id === target.id); if (!load) throw new Error("Choose an existing load."); return { kind: "loads.patch", ids: [load.id], patch: { notes: appended(load.notes, note) } }; }
  if (target.kind === "circuit") { const circuit = project.circuits.find((item) => item.id === target.id); if (!circuit) throw new Error("Choose an existing circuit."); return { kind: "circuit.patch", id: circuit.id, patch: { notes: appended(circuit.notes, note) } }; }
  if (target.kind === "board") { const board = project.boards.find((item) => item.id === target.id); if (!board) throw new Error("Choose an existing board."); return { kind: "board.patch", id: board.id, patch: { notes: appended(board.notes, note) } }; }
  if (target.kind === "ev" && !project.evSessions.some((item) => item.id === target.id)) throw new Error("Choose an existing EV session.");
  return { kind: "project.patch", patch: { notes: appended(project.notes, target.kind === "ev" ? `EV session ${project.evSessions.find((item) => item.id === target.id)!.name}\n${note}` : note) } };
}

/** Recalculates from the inputs at the project boundary; supplied displayed results are never trusted. */
export function previewToolApplication(project: Project, request: { toolId: string; values: ToolValues; target: ToolTarget; mode: "fields" | "note" }): CommandPreview {
  const tool = tools.find((item) => item.id === request.toolId);
  if (!tool) throw new Error("Unknown engineering tool.");
  const values = structuredClone(request.values), result = tool.calculate(values), note = trace(tool.id, values, result), noteAction = noteCommand(project, request.target, note);
  if (request.mode === "note") return previewProjectCommand(project, noteAction);
  const info = toolApplicationInfo(tool.id);
  if (!info || request.target.kind !== info.targetKind) throw new Error("This tool has no supported field mapping to the selected object. Attach a calculation note instead.");
  if (result.status !== "calculated") throw new Error("Resolve missing or unsupported evidence before applying engineering fields. A labelled calculation note may still be attached.");
  const commands: ProjectCommand[] = [];
  const load = project.loads.find((item) => item.id === request.target.id);
  const circuit = project.circuits.find((item) => item.id === request.target.id);
  let loadPatch: LoadPatch | undefined, cable: Cable | undefined;
  if (info.targetKind === "load" && !load) throw new Error("Choose an existing load.");
  if (info.targetKind === "circuit" && !circuit) throw new Error("Choose an existing circuit.");
  switch (tool.id) {
    case "T01": loadPatch = { entryMode: "kw", connection: "dc", rating: resultNumber(result, "Power") / 1000, voltage: resultNumber(result, "Voltage"), quantity: 1, pf: 1, efficiency: 1 }; break;
    case "T02":
      if (numeric(values, "hours") > 24) throw new Error("Elapsed hours exceed a daily schedule. Attach the result as a note instead.");
      loadPatch = { entryMode: "kw", connection: "dc", rating: numeric(values, "voltage") * numeric(values, "current") / 1000, voltage: numeric(values, "voltage"), quantity: numeric(values, "quantity"), hoursPerDay: numeric(values, "hours"), pf: 1, efficiency: 1 }; break;
    case "T03": case "T04": loadPatch = { entryMode: "kw", connection: tool.id === "T03" ? "single" : "three", rating: numeric(values, "power"), voltage: numeric(values, "voltage"), pf: numeric(values, "pf"), pfKind: "displacement", reactive: values.reactive === "leading" ? "leading" : "lagging", quantity: 1, efficiency: 1 }; break;
    case "T05": loadPatch = { entryMode: "complex", rating: numeric(values, "real"), reactiveKvar: numeric(values, "reactive"), quantity: 1, pfKind: "displacement", reactive: numeric(values, "reactive") < 0 ? "leading" : "lagging" }; break;
    case "T09": loadPatch = { entryMode: "kw", rating: resultNumber(result, "Electrical input"), quantity: 1, efficiency: 1 }; break;
    case "T10": loadPatch = { entryMode: "motor", rating: numeric(values, "shaft"), efficiency: numeric(values, "efficiency"), pf: numeric(values, "pf"), pfKind: "displacement", voltage: numeric(values, "voltage"), connection: values.connection as Load["connection"], quantity: 1 }; break;
    case "T15": {
      const length = numeric(values, "length");
      if (length <= 0 || numeric(values, "parallel") !== 1) throw new Error("Apply a positive route length with one conductor per path. Parallel installation assessment requires its own supported cable model.");
      cable = { ...circuit!.cable, lengthM: length, areaMm2: numeric(values, "section"), resistanceOhmPerKm: resultNumber(result, "Resistance at operating temperature") * 1000 / length, source: String(values.source || "Entered resistivity and temperature assumptions; unverified material evidence.") }; break;
    }
    case "T17": cable = { ...circuit!.cable, lengthM: numeric(values, "length"), resistanceOhmPerKm: numeric(values, "resistance"), reactanceOhmPerKm: numeric(values, "reactance"), source: appended(circuit!.cable?.source, "T17: entered conductor R/X and one-way route length.") }; break;
    case "T20":
      if (!circuit!.cable) throw new Error("Set the circuit's actual cable length first, then apply the sourced ampacity data.");
      cable = { ...circuit!.cable, baseAmpacityA: numeric(values, "base"), correctionFactors: [numeric(values, "temperatureFactor"), numeric(values, "groupingFactor"), numeric(values, "otherFactor")], source: `${values.source}; ${values.installation}` }; break;
    case "T21": commands.push({ kind: "circuit.patch", id: circuit!.id, patch: { protectiveA: numeric(values, "deviceRating"), breakingCapacityKA: numeric(values, "breaking"), prospectiveFaultKA: numeric(values, "fault") } }); break;
    case "T22": {
      const maximum = result.values.find((item) => /maximum/i.test(item.label) && item.unit === "kA")?.value;
      if (typeof maximum !== "number") throw new Error("No finite upper fault-current result is available.");
      commands.push({ kind: "circuit.patch", id: circuit!.id, patch: { prospectiveFaultKA: maximum } }); break;
    }
    case "T36": commands.push({ kind: "energy.patch", patch: { battery: { ...project.energy.battery, capacityKWh: resultNumber(result, "Nominal stored-energy approximation"), initialSoc: numeric(values, "initialSOC") / 100, minSoc: numeric(values, "minimumSOC") / 100, maxSoc: numeric(values, "maximumSOC") / 100, dischargeEfficiency: numeric(values, "efficiency") } } }); break;
    case "T37": commands.push({ kind: "energy.patch", patch: { battery: { ...project.energy.battery, capacityKWh: numeric(values, "capacity"), initialSoc: numeric(values, "initialSOC") / 100, minSoc: numeric(values, "minimumSOC") / 100, chargeKW: numeric(values, "chargeLimit"), dischargeKW: numeric(values, "dischargeLimit"), chargeEfficiency: numeric(values, "chargeEfficiency"), dischargeEfficiency: numeric(values, "dischargeEfficiency") } } }); break;
    case "T39": {
      const capacity = numeric(values, "capacity");
      if (values.mode === "daily") commands.push({ kind: "energy.patch", patch: { pvKW: capacity, peakSunHours: numeric(values, "sunHours"), pvPerformanceRatio: (1 - numeric(values, "loss")) * numeric(values, "efficiency"), pvHourlyProfile: undefined, source: String(values.source || "T39 entered daily resource assumptions; no chronological profile.") } });
      else {
        if (result.series?.length !== 24 || numeric(values, "interval") !== 1) throw new Error("The project needs exactly 24 one-hour profile values. Export this other time basis or attach it as a note.");
        const profile = result.series.map((row) => capacity ? Number(row.deliveredACKW) / capacity : 0);
        if (profile.some((value) => !Number.isFinite(value) || value < 0 || value > 1)) throw new Error("Delivered AC profile must remain between 0 and 1 kW per installed kWp for this project model.");
        commands.push({ kind: "energy.patch", patch: { pvKW: capacity, peakSunHours: profile.reduce((sum, value) => sum + value, 0), pvPerformanceRatio: 1, pvHourlyProfile: profile, source: `${String(values.source || "Entered T39 profile")}. Fixed delivered-AC profile with losses and clipping already included. Recalculate this profile when changing equipment size.` } });
      }
      break;
    }
    case "T42": commands.push({ kind: "ev.patch", id: request.target.id!, patch: { requiredKWh: numeric(values, "capacity") * (numeric(values, "targetSOC") - numeric(values, "initialSOC")) / 100, chargerKW: numeric(values, "chargerLimit"), vehicleKW: numeric(values, "vehicleLimit"), siteLimitKW: numeric(values, "siteLimit"), efficiency: numeric(values, "efficiency") } }); break;
    case "T46": {
      const totals = calculateProject(project), inputInstalled = numeric(values, "connected"), inputMaximum = numeric(values, "individualMaxima");
      if (Math.abs(inputInstalled - totals.installedKW) > 1e-8 * Math.max(1, totals.installedKW) || Math.abs(inputMaximum - totals.operatingKW) > 1e-8 * Math.max(1, totals.operatingKW)) throw new Error("Tool totals do not match this project's installed and operating maxima. Re-enter current project totals or attach a note.");
      commands.push({ kind: "project.patch", patch: { coincidence: resultNumber(result, "Coincidence factor") } }); break;
    }
    case "T49": commands.push({ kind: "tariff.patch", patch: { carbonKgPerKWh: numeric(values, "factor"), source: appended(project.tariff.source, `Operational carbon factor: ${values.source}; ${values.geography}; ${values.period}.`) } }); break;
    default: throw new Error("No direct field mapping exists for this method.");
  }
  if (loadPatch) {
    loadPatch.source = { kind: "user", reference: `${tool.id} reviewed calculation; inputs, method and evidence are recorded in the load notes.` };
    commands.push({ kind: "loads.patch", ids: [load!.id], patch: loadPatch });
  }
  if (cable) commands.push({ kind: "circuit.patch", id: circuit!.id, patch: { cable } });
  commands.push(noteAction);
  const preview = previewProjectCommand(project, { kind: "batch", commands });
  preview.warnings.unshift(info.description, ...result.warnings);
  return preview;
}
