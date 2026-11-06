import type { Project } from "../domain/types";
import { newId, validateProjectImport } from "../domain/project";

/** Merge whole imported objects into fresh IDs; retain the receiving site's assumptions. */
export function mergeProjectObjects(current: Project, incoming: Project): Project {
  const next = structuredClone(current), copy = structuredClone(incoming);
  const ids = new Map<string,string>();
  const collections = ["loads","boards","circuits","sources","zones","equipmentLibrary","startEvents","flexibleLoads","evSessions"] as const;
  for (const collection of collections) for (const record of copy[collection] ?? []) ids.set(record.id,newId(collection));
  const mapped = (id: string | undefined) => id ? ids.get(id) ?? id : undefined;
  copy.loads.forEach(load => {load.id=mapped(load.id)!;load.boardId=mapped(load.boardId);load.circuitId=mapped(load.circuitId);});
  copy.boards.forEach(board => {board.id=mapped(board.id)!;board.parentId=mapped(board.parentId);board.zoneId=mapped(board.zoneId);});
  copy.circuits.forEach(circuit => {circuit.id=mapped(circuit.id)!;circuit.boardId=mapped(circuit.boardId)!;});
  copy.sources?.forEach(source => {source.id=mapped(source.id)!;source.boardId=mapped(source.boardId);});
  copy.zones?.forEach(zone => {zone.id=mapped(zone.id)!;zone.parentId=mapped(zone.parentId);});
  copy.equipmentLibrary?.forEach(load => {load.id=mapped(load.id)!;delete load.boardId;delete load.circuitId;});
  copy.startEvents?.forEach(event => {event.id=mapped(event.id)!;event.loadId=mapped(event.loadId)!;});
  copy.flexibleLoads?.forEach(row => {row.id=mapped(row.id)!;row.loadId=mapped(row.loadId)!;});
  copy.evSessions.forEach(row => {row.id=mapped(row.id)!;});
  for (const collection of collections) {
    if (copy[collection]?.length) (next as unknown as Record<string,unknown>)[collection] = [...(next[collection] ?? []), ...copy[collection]!];
  }
  const validation = validateProjectImport(next);
  if (!validation.project) throw new Error(validation.errors.join(" "));
  return validation.project;
}

export function replaceProjectContents(current: Project, incoming: Project): Project {
  const next = {...structuredClone(incoming),id:current.id,createdAt:current.createdAt,revision:current.revision,updatedAt:current.updatedAt};
  const validation=validateProjectImport(next);
  if (!validation.project) throw new Error(validation.errors.join(" "));
  return validation.project;
}
