import { createLoad } from '../domain/project';
import type { CalculationResult, Issue, Load, Project } from '../domain/types';
import { calculateProject, normalizeLoad } from '../engine/electrical';
import { applyPhaseBalance, previewPhaseBalance, type BalancePlan } from '../engine/planning';

export const LOCAL_CAPABILITIES = [
  { id: 'getProjectSummary', mutates: false }, { id: 'getSelectedObject', mutates: false },
  { id: 'explainCalculation', mutates: false }, { id: 'listMissingInputs', mutates: false },
  { id: 'runCalculation', mutates: false }, { id: 'proposePhaseBalance', mutates: false },
  { id: 'proposeLoads', mutates: false }, { id: 'previewProjectChanges', mutates: false },
  { id: 'applyConfirmedChanges', mutates: true, requiresConfirmation: true },
  { id: 'prepareReportNarrative', mutates: false },
] as const;

export interface LoadProposal { kind: 'load'; projectId: string; revision: number; load: Load; beforeKW: number; afterKW: number }
export interface PhaseProposal { kind: 'balance'; projectId: string; revision: number; plan: BalancePlan }
export type Proposal = LoadProposal | PhaseProposal;
export interface LocalResponse {
  kind: 'summary' | 'explain' | 'issues' | 'balance' | 'load' | 'report' | 'help';
  projectId: string;
  revision: number;
  result: CalculationResult;
  selectedLoad?: Load;
  issues?: Issue[];
  proposal?: Proposal;
}

export function getProjectSummary(project: Project): CalculationResult { return calculateProject(project); }
export function getSelectedObject(project: Project, id?: string) { return project.loads.find((item) => item.id === id) ?? project.circuits.find((item) => item.id === id) ?? project.boards.find((item) => item.id === id); }
export function listMissingInputs(project: Project): Issue[] { return calculateProject(project).issues.filter((issue) => ['incomplete', 'unsupported', 'failed'].includes(issue.assessment)); }
export function proposePhaseBalance(project: Project): PhaseProposal { return { kind: 'balance', projectId: project.id, revision: project.revision, plan: previewPhaseBalance(project) }; }

/** Deliberately narrow typed command, not an imitation language model. */
export function parseLoadProposal(project: Project, input: string): LoadProposal | undefined {
  const match = /^load\s*:\s*([^;]{1,120})\s*;\s*(\d+(?:[.,]\d+)?)\s*kw\s*;\s*(\d+(?:[.,]\d+)?)\s*v\s*;\s*pf\s*(\d+(?:[.,]\d+)?)\s*;\s*(\d+(?:[.,]\d+)?)\s*h\s*$/i.exec(input.trim());
  if (!match) return undefined;
  const parse = (number: string) => Number(number.replace(',', '.'));
  const load = createLoad({ name: match[1].trim(), rating: parse(match[2]), voltage: parse(match[3]), pf: parse(match[4]), hoursPerDay: parse(match[5]), source: { kind: 'user', reference: 'Explicit typed local-assistant proposal; accepted only after review.' } });
  const normalized = normalizeLoad(load);
  if (!normalized.valid) throw new Error(normalized.issues.map((issue) => issue.message).join(' '));
  const before = calculateProject(project); const after = calculateProject({ ...project, loads: [...project.loads, load] });
  return { kind: 'load', projectId: project.id, revision: project.revision, load, beforeKW: before.designKW, afterKW: after.designKW };
}

export function runLocalCommand(project: Project, input: string, selectedId?: string): LocalResponse {
  const result = calculateProject(project);
  const base = { projectId: project.id, revision: project.revision, result };
  const loadProposal = parseLoadProposal(project, input);
  if (loadProposal) return { ...base, kind: 'load', proposal: loadProposal };
  const command = input.trim().toLocaleLowerCase();
  if (/balance|phasen|ìdọ́gba|ido.gba|phases/.test(command)) return { ...base, kind: 'balance', proposal: proposePhaseBalance(project) };
  if (/missing|issue|warn|fehl|hinweis|ìṣòro|ohun.*kù|problem|check/.test(command)) return { ...base, kind: 'issues', issues: listMissingInputs(project) };
  if (/explain|formula|method|erklär|berechn|ṣàlàyé|salaye/.test(command)) return { ...base, kind: 'explain', selectedLoad: project.loads.find((load) => load.id === selectedId) };
  if (/report|print|bericht|ìròyìn|iroyin/.test(command)) return { ...base, kind: 'report' };
  if (/summary|overview|result|zusammen|übersicht|àkótán|akotan|energy|power|demand/.test(command)) return { ...base, kind: 'summary' };
  return { ...base, kind: 'help' };
}

/** Run inside the owner's single undoable command. Stale proposal data never changes a newer project. */
export function applyProposal(draft: Project, proposal: Proposal): void {
  if (draft.id !== proposal.projectId || draft.revision !== proposal.revision) throw new Error('Project changed after this preview. Request a new proposal before applying changes.');
  if (proposal.kind === 'balance') {
    const next = applyPhaseBalance(draft, proposal.plan.moves, proposal.revision);
    // The root command layer owns revision increments and undo history.
    draft.loads = next.loads; draft.circuits = next.circuits;
  } else {
    const normalized = normalizeLoad(proposal.load);
    if (!normalized.valid || draft.loads.some((load) => load.id === proposal.load.id)) throw new Error('Load proposal is invalid or already applied.');
    draft.loads.push(structuredClone(proposal.load));
  }
}
