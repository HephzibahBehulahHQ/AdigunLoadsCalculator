import { useRef, useState } from "react";
import { Plus, Download, Upload, Edit3, Trash2, Copy } from "lucide-react";
import type { Load, Project } from "../domain/types";
import { createProject, newId, validateProjectImport } from "../domain/project";
import { equipmentTemplate, instantiateEquipment } from "../domain/workspace";
import { downloadFile, safeName } from "../import-export/files";
import { LoadEditor } from "./LoadEditor";
import { Field, Modal, Notice } from "./ui";
import { useT } from "../i18n";

export function EquipmentLibrary({
  project,
  change,
  onAdd,
}: {
  project: Project;
  change: (mutator: (draft: Project) => void) => boolean | void;
  onAdd: (load: Load) => void;
}) {
  const t = useT();
  const file = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [error, setError] = useState("");
  const [editor, setEditor] = useState<{
    load?: Load;
    projectId: string;
    revision: number;
  } | null>(null);
  const [preview, setPreview] = useState<{
    templates: Load[];
    projectId: string;
    revision: number;
  } | null>(null);
  const templates = project.equipmentLibrary || [];
  const visible = templates.filter((item) =>
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
      const validated = validateProjectImport(candidate);
      if (!validated.project || validated.errors.length)
        throw new Error(validated.errors.join(" "));
      setPreview({
        templates: validated.project.loads,
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
    try {
      const template = equipmentTemplate(load);
      const result = change((draft) => {
        if (draft.id !== editor.projectId || draft.revision !== editor.revision)
          throw new Error("Project changed. Reopen the template editor.");
        draft.equipmentLibrary ??= [];
        const index = editor.load
          ? draft.equipmentLibrary.findIndex(
              (item) => item.id === editor.load!.id,
            )
          : -1;
        if (index >= 0)
          draft.equipmentLibrary[index] = { ...template, id: editor.load!.id };
        else draft.equipmentLibrary.push(template);
      });
      if (result !== false) setEditor(null);
    } catch (e) {
      setError((e as Error).message);
    }
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
                <td>{item.name}</td>
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
      {editor && (
        <LoadEditor
          project={project}
          load={editor.load}
          purpose="template"
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
                  draft.equipmentLibrary.push(
                    ...preview.templates.map((template) => ({
                      ...structuredClone(template),
                      id: newId("equipment"),
                    })),
                  );
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
