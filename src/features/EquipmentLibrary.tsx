import { useRef, useState } from "react";
import {
  Plus,
  Download,
  Upload,
  Edit3,
  Trash2,
  Copy,
  Star,
} from "lucide-react";
import type { Load, Project } from "../domain/types";
import { createProject, newId, validateProjectImport } from "../domain/project";
import { equipmentTemplate, instantiateEquipment } from "../domain/workspace";
import { downloadFile, safeName } from "../import-export/files";
import { LoadEditor } from "./LoadEditor";
import type { DetailMode } from "./DetailViews";
import { Field, Modal, Notice } from "./ui";
import {
  applyProjectCommand,
  previewProjectCommand,
} from "../commands/projectCommands";
import { useT } from "../i18n";

export function EquipmentLibrary({
  project,
  change,
  onAdd,
  detailMode = "engineering",
  onDetailModeChange,
}: {
  project: Project;
  change: (mutator: (draft: Project) => void) => boolean | void;
  onAdd: (load: Load) => void;
  detailMode?: DetailMode;
  onDetailModeChange?: (value: DetailMode) => void;
}) {
  const t = useT();
  const file = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [error, setError] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [category, setCategory] = useState("");
  const [replacement, setReplacement] = useState<{
    prior: Load;
    template: Load;
    projectId: string;
    revision: number;
  }>();
  const [replaceIds, setReplaceIds] = useState<string[]>([]);
  const [editor, setEditor] = useState<{
    load?: Load;
    projectId: string;
    revision: number;
  } | null>(null);
  const [preview, setPreview] = useState<{
    templates: Load[];
    versions?: Project["equipmentVersions"];
    favorites?: string[];
    projectId: string;
    revision: number;
  } | null>(null);
  const templates = project.equipmentLibrary || [];
  const visible = templates.filter(
    (item) =>
      (!favoritesOnly || project.equipmentFavorites?.includes(item.id)) &&
      (!category || category === item.category) &&
      [item.name, item.category, item.source.reference, item.source.kind]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  async function readFile(input: File) {
    try {
      if (input.size > 2_000_000)
        throw new Error("Equipment import is limited to 2 MB.");
      const data = JSON.parse(await input.text());
      if (
        data.format !== "AdigunPowerLab.equipment" ||
        data.schemaVersion !== 1 ||
        !Array.isArray(data.templates) ||
        data.templates.length > 1000
      )
        throw new Error("This is not a supported equipment library export.");
      if (data.templates.some((load: Load) => load.boardId || load.circuitId))
        throw new Error(
          "Equipment templates must not reference project circuits or boards.",
        );
      const candidate = createProject("Equipment import");
      candidate.loads = data.templates;
      candidate.equipmentVersions = data.versions;
      candidate.equipmentFavorites = data.favorites;
      const validated = validateProjectImport(candidate);
      if (!validated.project || validated.errors.length)
        throw new Error(validated.errors.join(" "));
      setPreview({
        templates: validated.project.loads,
        versions: validated.project.equipmentVersions,
        favorites: validated.project.equipmentFavorites,
        projectId: project.id,
        revision: project.revision,
      });
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      if (file.current) file.current.value = "";
    }
  }
  function saveTemplate(load: Load) {
    if (!editor) return;
    if (project.id !== editor.projectId || project.revision !== editor.revision)
      throw new Error(t("Project changed. Reopen the template editor."));
    const template = equipmentTemplate(load),
      prior = templates.find((item) => item.id === editor.load?.id);
    if (prior) {
      template.id = prior.id;
      template.libraryRef = {
        templateId: prior.id,
        version: (prior.libraryRef?.version ?? 1) + 1,
      };
      setReplacement({
        prior: structuredClone(prior),
        template,
        projectId: project.id,
        revision: project.revision,
      });
      setReplaceIds([]);
      setEditor(null);
      return;
    }
    if (
      change((draft) => {
        (draft.equipmentLibrary ??= []).push(template);
      }) !== false
    )
      setEditor(null);
  }
  function applyReplacement() {
    if (!replacement) return;
    const accepted = change((draft) => {
      if (
        draft.id !== replacement.projectId ||
        draft.revision !== replacement.revision
      )
        throw new Error(t("Project changed. Review the replacement again."));
      let next = structuredClone(draft);
      const template = replacement.template;
      if (replaceIds.length) {
        const patch: Partial<Load> = {};
        for (const key of [
          "entryMode",
          "rating",
          "voltage",
          "connection",
          "pf",
          "pfKind",
          "phasePair",
          "reactive",
          "reactiveKvar",
          "efficiency",
          "utilization",
          "standbyW",
          "source",
          "libraryRef",
        ] as const)
          (patch as Record<string, unknown>)[key] = structuredClone(
            template[key],
          );
        next = applyProjectCommand(
          next,
          previewProjectCommand(next, {
            kind: "loads.patch",
            ids: replaceIds,
            patch,
          }),
        );
      }
      next.equipmentLibrary = next.equipmentLibrary?.map((item) =>
        item.id === template.id ? template : item,
      );
      const version = replacement.prior.libraryRef?.version ?? 1;
      if (
        !next.equipmentVersions?.some(
          (row) => row.templateId === template.id && row.version === version,
        )
      )
        (next.equipmentVersions ??= []).push({
          templateId: template.id,
          version,
          capturedAt: new Date().toISOString(),
          record: replacement.prior,
        });
      const validation = validateProjectImport(next);
      if (!validation.project) throw new Error(validation.errors.join(" "));
      Object.assign(draft, validation.project);
    });
    if (accepted !== false) {
      setReplacement(undefined);
      setError("");
    } else
      setError(
        t(
          "Replacement was not applied. Review locks, phase assignments and validation errors before trying again.",
        ),
      );
  }
  return (
    <section className="panel panel-pad equipment-workspace">
      <div className="panel-title">
        <div>
          <h3>{t("My equipment library")}</h3>
          <p className="muted">
            {t(
              "Reusable equipment with your entered source evidence. Adding a template does not change connected loads.",
            )}
          </p>
        </div>
        <span className="tag cyan">{templates.length}</span>
      </div>
      {error && <Notice tone="error">{t(error)}</Notice>}
      <div className="button-row">
        <button
          className="button primary"
          onClick={() =>
            setEditor({ projectId: project.id, revision: project.revision })
          }
        >
          <Plus size={16} />
          {t("New equipment template")}
        </button>
        <button className="button" onClick={() => file.current?.click()}>
          <Upload size={16} />
          {t("Import equipment")}
        </button>
        <button
          className="button"
          onClick={() =>
            downloadFile(
              safeName(project.name) + "-equipment.json",
              JSON.stringify(
                {
                  format: "AdigunPowerLab.equipment",
                  schemaVersion: 1,
                  templates,
                  versions: project.equipmentVersions ?? [],
                  favorites: project.equipmentFavorites ?? [],
                },
                null,
                2,
              ),
              "application/json",
            )
          }
        >
          <Download size={16} />
          {t("Export equipment")}
        </button>
        <input
          ref={file}
          type="file"
          accept=".json,application/json"
          hidden
          onChange={(e) => {
            const selected = e.target.files?.[0];
            if (selected) void readFile(selected);
          }}
        />
      </div>
      <div className="button-row">
        <label className="check-row">
          <input
            type="checkbox"
            checked={favoritesOnly}
            onChange={(e) => setFavoritesOnly(e.target.checked)}
          />
          {t("Favorites only")}
        </label>
        <Field label={t("Equipment category")}>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">{t("All categories")}</option>
            {[...new Set(templates.map((item) => item.category))].map(
              (value) => (
                <option key={value}>{value}</option>
              ),
            )}
          </select>
        </Field>
      </div>
      <div className="form-grid">
        <Field label={t("Search equipment")}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("Name, category or source")}
          />
        </Field>
        <Field label={t("Save an existing load as a template")}>
          <select
            value={sourceId}
            onChange={(e) => setSourceId(e.target.value)}
          >
            <option value="">{t("Select a load")}</option>
            {project.loads.map((load) => (
              <option key={load.id} value={load.id}>
                {load.name}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <button
        className="button"
        disabled={!project.loads.some((load) => load.id === sourceId)}
        onClick={() => {
          try {
            const source = project.loads.find((load) => load.id === sourceId);
            if (source)
              change((draft) => {
                (draft.equipmentLibrary ??= []).push(equipmentTemplate(source));
              });
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      >
        <Copy size={16} />
        {t("Save selected equipment")}
      </button>
      {!templates.length && (
        <Notice>
          {t(
            "Create a template or save a load to build your own sourced equipment library.",
          )}
        </Notice>
      )}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t("Name")}</th>
              <th>{t("Category")}</th>
              <th>{t("Rating")}</th>
              <th>{t("Source")}</th>
              <th>{t("Actions")}</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((item) => (
              <tr key={item.id}>
                <td>
                  {item.name}
                  <small className="muted">
                    {" "}
                    · v{item.libraryRef?.version ?? 1}
                  </small>
                </td>
                <td>{item.category}</td>
                <td>
                  {item.rating} {item.entryMode}
                </td>
                <td>
                  <span className="tag">{t(item.source.kind)}</span>{" "}
                  {item.source.reference}
                </td>
                <td>
                  <div className="button-row">
                    <button
                      className="icon-button"
                      aria-label={`${t("Favorite")} ${item.name}`}
                      aria-pressed={
                        project.equipmentFavorites?.includes(item.id) ?? false
                      }
                      onClick={() =>
                        change((draft) => {
                          draft.equipmentFavorites =
                            draft.equipmentFavorites?.includes(item.id)
                              ? draft.equipmentFavorites.filter(
                                  (id) => id !== item.id,
                                )
                              : [...(draft.equipmentFavorites ?? []), item.id];
                        })
                      }
                    >
                      <Star
                        size={16}
                        fill={
                          project.equipmentFavorites?.includes(item.id)
                            ? "currentColor"
                            : "none"
                        }
                      />
                    </button>
                    <button
                      className="button small-button"
                      onClick={() => onAdd(instantiateEquipment(item))}
                    >
                      {t("Add load")}
                    </button>
                    <button
                      className="icon-button"
                      aria-label={t("Edit") + " " + item.name}
                      onClick={() =>
                        setEditor({
                          load: item,
                          projectId: project.id,
                          revision: project.revision,
                        })
                      }
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      className="icon-button danger"
                      aria-label={t("Delete template") + " " + item.name}
                      onClick={() => {
                        if (
                          confirm(
                            t(
                              "Delete this template? Existing loads are preserved.",
                            ),
                          )
                        )
                          change((draft) => {
                            draft.equipmentFavorites =
                              draft.equipmentFavorites?.filter(
                                (id) => id !== item.id,
                              );
                            draft.equipmentLibrary =
                              draft.equipmentLibrary?.filter(
                                (template) => template.id !== item.id,
                              );
                          });
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <details>
        <summary>{t("Equipment version history")}</summary>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t("Name")}</th>
                <th>{t("Version")}</th>
                <th>{t("Saved")}</th>
                <th>{t("Record")}</th>
              </tr>
            </thead>
            <tbody>
              {[...(project.equipmentVersions ?? [])]
                .reverse()
                .slice(0, 100)
                .map((version) => (
                  <tr key={version.templateId + ":" + version.version}>
                    <td>{version.record.name}</td>
                    <td>{version.version}</td>
                    <td>{version.capturedAt}</td>
                    <td>
                      <details>
                        <summary>{t("Show details")}</summary>
                        <pre className="comparison-value">
                          {JSON.stringify(version.record, null, 2)}
                        </pre>
                      </details>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <p className="small muted">
          {t(
            "The latest 100 historical versions are shown. Complete version history is preserved in workspace backups.",
          )}
        </p>
      </details>
      {replacement && (
        <Modal
          title={t("Review equipment replacement")}
          onClose={() => setReplacement(undefined)}
          wide
        >
          <div className="modal-body">
            {error && <Notice tone="error">{error}</Notice>}
            <p>
              {replacement.prior.name} · v
              {replacement.prior.libraryRef?.version ?? 1} → v
              {replacement.template.libraryRef?.version}
            </p>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{t("Field")}</th>
                    <th>{t("Before")}</th>
                    <th>{t("After")}</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(replacement.template)
                    .filter(
                      (key) =>
                        JSON.stringify(
                          (
                            replacement.prior as unknown as Record<
                              string,
                              unknown
                            >
                          )[key],
                        ) !==
                        JSON.stringify(
                          (
                            replacement.template as unknown as Record<
                              string,
                              unknown
                            >
                          )[key],
                        ),
                    )
                    .map((key) => (
                      <tr key={key}>
                        <td>{key}</td>
                        <td>
                          <pre className="comparison-value">
                            {JSON.stringify(
                              (
                                replacement.prior as unknown as Record<
                                  string,
                                  unknown
                                >
                              )[key],
                            )}
                          </pre>
                        </td>
                        <td>
                          <pre className="comparison-value">
                            {JSON.stringify(
                              (
                                replacement.template as unknown as Record<
                                  string,
                                  unknown
                                >
                              )[key],
                            )}
                          </pre>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <Notice>
              {t(
                "Choose connected loads to update their electrical nameplate fields and source. Names, quantities, schedules and assignments stay as entered. Other projects retain their saved copies.",
              )}
            </Notice>
            {project.loads
              .filter(
                (load) => load.libraryRef?.templateId === replacement.prior.id,
              )
              .map((load) => (
                <label className="check-row" key={load.id}>
                  <input
                    type="checkbox"
                    checked={replaceIds.includes(load.id)}
                    onChange={(e) =>
                      setReplaceIds((ids) =>
                        e.target.checked
                          ? [...ids, load.id]
                          : ids.filter((id) => id !== load.id),
                      )
                    }
                  />
                  {load.name} · v{load.libraryRef?.version}
                </label>
              ))}
          </div>
          <div className="modal-footer">
            <button
              className="button"
              onClick={() => setReplacement(undefined)}
            >
              {t("Cancel")}
            </button>
            <button className="button primary" onClick={applyReplacement}>
              {t("Apply reviewed replacement")} ({replaceIds.length})
            </button>
          </div>
        </Modal>
      )}
      {editor && (
        <LoadEditor
          project={project}
          load={editor.load}
          purpose="template"
          detailMode={detailMode}
          onDetailModeChange={onDetailModeChange}
          onSave={saveTemplate}
          onClose={() => setEditor(null)}
        />
      )}
      {preview && (
        <Modal
          title={t("Preview equipment import")}
          onClose={() => setPreview(null)}
        >
          <div className="modal-body">
            <p>
              {preview.templates.length}{" "}
              {t(
                "templates will be added with new identifiers. Existing templates are preserved.",
              )}
            </p>
            <ul>
              {preview.templates.slice(0, 20).map((item) => (
                <li key={item.id}>
                  {item.name} · {item.rating} {item.entryMode}
                </li>
              ))}
            </ul>
          </div>
          <div className="modal-footer">
            <button className="button" onClick={() => setPreview(null)}>
              {t("Cancel")}
            </button>
            <button
              className="button primary"
              onClick={() => {
                const result = change((draft) => {
                  if (
                    draft.id !== preview.projectId ||
                    draft.revision !== preview.revision
                  )
                    throw new Error(
                      "Project changed. Preview the import again.",
                    );
                  draft.equipmentLibrary ??= [];
                  const ids = new Map<string, string>();
                  for (const id of [
                    ...preview.templates.map((row) => row.id),
                    ...(preview.versions ?? []).map((row) => row.templateId),
                  ])
                    if (!ids.has(id)) ids.set(id, newId("equipment"));
                  draft.equipmentLibrary.push(
                    ...preview.templates.map((template) => ({
                      ...structuredClone(template),
                      id: ids.get(template.id)!,
                      libraryRef: {
                        templateId: ids.get(template.id)!,
                        version: template.libraryRef?.version ?? 1,
                      },
                    })),
                  );
                  if (preview.versions?.length)
                    (draft.equipmentVersions ??= []).push(
                      ...preview.versions.map((version) => ({
                        ...structuredClone(version),
                        templateId: ids.get(version.templateId)!,
                        record: {
                          ...structuredClone(version.record),
                          id: ids.get(version.templateId)!,
                          libraryRef: version.record.libraryRef
                            ? {
                                ...version.record.libraryRef,
                                templateId: ids.get(version.templateId)!,
                              }
                            : undefined,
                        },
                      })),
                    );
                  if (preview.favorites?.length)
                    draft.equipmentFavorites = [
                      ...new Set([
                        ...(draft.equipmentFavorites ?? []),
                        ...preview.favorites
                          .map((id) => ids.get(id))
                          .filter((id): id is string => Boolean(id)),
                      ]),
                    ];
                  const validation = validateProjectImport(draft);
                  if (!validation.valid)
                    throw new Error(validation.errors.join(" "));
                });
                if (result !== false) setPreview(null);
              }}
            >
              {t("Apply import")}
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}
