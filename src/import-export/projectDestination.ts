import type { Project } from "../domain/types";
import { newId, validateProjectImport } from "../domain/project";

/** Merge whole imported objects into fresh IDs; retain the receiving site's assumptions. */
export function mergeProjectObjects(
  current: Project,
  incoming: Project,
): Project {
  const next = structuredClone(current),
    copy = structuredClone(incoming);
  const ids = new Map<string, string>();
  const collections = [
    "loads",
    "boards",
    "circuits",
    "sources",
    "zones",
    "equipmentLibrary",
    "startEvents",
    "flexibleLoads",
    "evSessions",
  ] as const;
  for (const collection of collections)
    for (const record of copy[collection] ?? [])
      ids.set(record.id, newId(collection));
  for (const record of copy.equipmentVersions ?? [])
    if (!ids.has(record.templateId))
      ids.set(record.templateId, newId("equipment"));
  const mapped = (id: string | undefined) =>
    id ? (ids.get(id) ?? id) : undefined;
  copy.loads.forEach((load) => {
    load.id = mapped(load.id)!;
    load.boardId = mapped(load.boardId);
    load.circuitId = mapped(load.circuitId);
    if (load.libraryRef)
      load.libraryRef.templateId = mapped(load.libraryRef.templateId)!;
  });
  copy.boards.forEach((board) => {
    board.id = mapped(board.id)!;
    board.parentId = mapped(board.parentId);
    board.zoneId = mapped(board.zoneId);
  });
  copy.circuits.forEach((circuit) => {
    circuit.id = mapped(circuit.id)!;
    circuit.boardId = mapped(circuit.boardId)!;
  });
  copy.sources?.forEach((source) => {
    source.id = mapped(source.id)!;
    source.boardId = mapped(source.boardId);
  });
  copy.zones?.forEach((zone) => {
    zone.id = mapped(zone.id)!;
    zone.parentId = mapped(zone.parentId);
  });
  copy.equipmentLibrary?.forEach((load) => {
    load.id = mapped(load.id)!;
    delete load.boardId;
    delete load.circuitId;
    if (load.libraryRef)
      load.libraryRef.templateId = mapped(load.libraryRef.templateId)!;
  });
  copy.startEvents?.forEach((event) => {
    event.id = mapped(event.id)!;
    event.loadId = mapped(event.loadId)!;
  });
  copy.flexibleLoads?.forEach((row) => {
    row.id = mapped(row.id)!;
    row.loadId = mapped(row.loadId)!;
  });
  copy.evSessions.forEach((row) => {
    row.id = mapped(row.id)!;
  });
  for (const collection of collections) {
    if (copy[collection]?.length)
      (next as unknown as Record<string, unknown>)[collection] = [
        ...(next[collection] ?? []),
        ...copy[collection]!,
      ];
  }
  if (copy.equipmentFavorites?.length)
    next.equipmentFavorites = [
      ...(next.equipmentFavorites ?? []),
      ...copy.equipmentFavorites.map((id) => mapped(id)!),
    ];
  if (copy.equipmentVersions?.length)
    next.equipmentVersions = [
      ...(next.equipmentVersions ?? []),
      ...copy.equipmentVersions.map((version) => ({
        ...version,
        templateId: mapped(version.templateId)!,
        record: {
          ...version.record,
          id: mapped(version.record.id)!,
          libraryRef: version.record.libraryRef
            ? {
                ...version.record.libraryRef,
                templateId: mapped(version.record.libraryRef.templateId)!,
              }
            : undefined,
        },
      })),
    ];
  const validation = validateProjectImport(next);
  if (!validation.project) throw new Error(validation.errors.join(" "));
  return validation.project;
}

export function replaceProjectContents(
  current: Project,
  incoming: Project,
): Project {
  const next = {
    ...structuredClone(incoming),
    id: current.id,
    createdAt: current.createdAt,
    revision: current.revision,
    updatedAt: current.updatedAt,
  };
  const validation = validateProjectImport(next);
  if (!validation.project) throw new Error(validation.errors.join(" "));
  return validation.project;
}
