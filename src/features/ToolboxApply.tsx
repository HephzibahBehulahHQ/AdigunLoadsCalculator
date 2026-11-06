import { useEffect, useState } from "react";
import type { Project } from "../domain/types";
import type { CommandPreview, ProjectChange } from "../commands/projectCommands";
import type { ToolResult, ToolValues } from "../tools/types";
import { previewToolApplication, toolApplicationInfo, type ToolTarget } from "../tools/apply";
import { useT } from "../i18n";
import { Field, Notice } from "./ui";
import { CommandReview } from "./CommandReview";
import "./topology.css";

export function ToolboxApply({ project, change, toolId, values, result, selectedId }: { project: Project; change: ProjectChange; toolId: string; values: ToolValues; result: ToolResult; selectedId?: string }) {
  const t = useT();
  const info = toolApplicationInfo(toolId);
  const [mode, setMode] = useState<"fields" | "note">(info ? "fields" : "note");
  const [target, setTarget] = useState("");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<CommandPreview | null>(null);
  const candidates: { value: string; label: string; target: ToolTarget }[] = [];
  const kinds = mode === "fields" && info ? [info.targetKind] : ["load", "board", "circuit", "project"];
  if (kinds.includes("load")) project.loads.forEach((load) => candidates.push({ value: `load:${load.id}`, label: `${t("Load")}: ${load.name}`, target: { kind: "load", id: load.id } }));
  if (kinds.includes("board")) project.boards.forEach((board) => candidates.push({ value: `board:${board.id}`, label: `${t("Board")}: ${board.name}`, target: { kind: "board", id: board.id } }));
  if (kinds.includes("circuit")) project.circuits.forEach((circuit) => candidates.push({ value: `circuit:${circuit.id}`, label: `${t("Circuit")}: ${circuit.name}`, target: { kind: "circuit", id: circuit.id } }));
  if (kinds.includes("ev")) project.evSessions.forEach((session) => candidates.push({ value: `ev:${session.id}`, label: `${t("EV session")}: ${session.name}`, target: { kind: "ev", id: session.id } }));
  if (kinds.includes("energy")) candidates.push({ value: `energy:${project.id}`, label: `${t("Renewables & Storage")}: ${project.name}`, target: { kind: "energy", id: project.id } });
  if (kinds.includes("project")) candidates.push({ value: `project:${project.id}`, label: `${t("Project")}: ${project.name}`, target: { kind: "project", id: project.id } });
  const targetList = candidates.map((item) => item.value).join("|");
  useEffect(() => { setMode(toolApplicationInfo(toolId) ? "fields" : "note"); setPreview(null); setError(""); }, [toolId, project.id]);
  useEffect(() => { setTarget((current) => candidates.some((item) => item.value === current) ? current : candidates.find((item) => item.target.id === selectedId)?.value ?? candidates[0]?.value ?? ""); }, [targetList, selectedId]);
  return <div className="tool-apply">
    <h4>{t("Apply to project object")}</h4>
    <div className="form-grid"><Field label={t("Application method")}><select value={mode} onChange={(e) => { setMode(e.target.value as "fields" | "note"); setError(""); setPreview(null); }}>{info && <option value="fields">{t(info.label)}</option>}<option value="note">{t("Attach calculation note")}</option></select></Field><Field label={t("Application target")}><select value={target} onChange={(e) => { setTarget(e.target.value); setError(""); }}><option value="">{t("Select target")}</option>{candidates.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></Field></div>
    <Notice>{t(mode === "fields" && info ? info.description : "Attaches inputs, units, results, formula, assumptions, status and sources to the selected object's notes. Electrical inputs remain unchanged.")}</Notice>
    {mode === "fields" && result.status !== "calculated" && <Notice tone="warning">{t("Resolve missing or unsupported evidence before applying engineering fields. You can attach a labelled calculation note now.")}</Notice>}
    {!candidates.length && <Notice>{t("Create a compatible project object first, or choose Attach calculation note for a project-level record.")}</Notice>}
    <button className="button primary" disabled={!target || (mode === "fields" && result.status !== "calculated")} onClick={() => { try { const selected = candidates.find((item) => item.value === target); if (!selected) throw new Error("Select a current project target."); setPreview(previewToolApplication(project, { toolId, values, target: selected.target, mode })); setError(""); } catch (cause) { setError((cause as Error).message); } }}>{t("Preview application")}</button>
    {error && <p className="error-text" role="alert">{t(error)}</p>}
    {preview && <CommandReview project={project} preview={preview} change={change} onClose={() => setPreview(null)} />}
  </div>;
}
