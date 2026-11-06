import { useContext, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Download } from "lucide-react";
import type { Project, SourceEquipment } from "../domain/types";
import { newId, validateProjectImport } from "../domain/project";
import { assessSourceEquipment } from "../engine/sources";
import { LanguageContext, numberFormat, useT } from "../i18n";
import { LocaleNumberInput } from "../i18n/LocaleNumberInput";
import { downloadFile, safeName } from "../import-export/files";
import { Field, Modal, Notice } from "./ui";
type Change = (mutator: (project: Project) => void) => boolean | void;

export function SourceRegistry({
  project,
  change,
  onSelect,
}: {
  project: Project;
  change: Change;
  onSelect?: (id: string) => void;
}) {
  const t = useT(),
    locale = useContext(LanguageContext);
  const [draft, setDraft] = useState<SourceEquipment>();
  const [selected, setSelected] = useState("");
  const [scenario, setScenario] = useState<"running" | "starting">("running");
  const [at, setAt] = useState("");
  const [error, setError] = useState("");
  const source = project.sources?.find((row) => row.id === selected);
  const assessment = useMemo(() => {
    if (!source) return undefined;
    try {
      return {
        result: assessSourceEquipment(project, source.id, {
          scenario,
          ...(at ? { at } : {}),
        }),
      };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }, [project, source, scenario, at]);
  function add() {
    setError("");
    setDraft({
      id: newId("source"),
      name: "",
      type: "grid",
      connection: "three",
      phase: "L1",
      voltageV: project.supply.voltageLL,
      continuousKW: 0,
      continuousKVA: 0,
      derating: 1,
      islandCapable: false,
      gridForming: false,
      transferIsolationVerified: false,
      blackStart: false,
      restartSeconds: 0,
      source: { kind: "user", reference: "" },
      notes: "",
    });
  }
  function save() {
    if (!draft) return;
    const candidate = structuredClone(project);
    candidate.sources = [
      ...(candidate.sources ?? []).filter((row) => row.id !== draft.id),
      draft,
    ];
    const validation = validateProjectImport(candidate);
    if (!validation.valid) {
      setError(validation.errors.join(" "));
      return;
    }
    if (
      change((p) => {
        p.sources = candidate.sources;
      }) !== false
    ) {
      setSelected(draft.id);
      onSelect?.(draft.id);
      setDraft(undefined);
      setError("");
    }
  }
  const numeric = (
    key:
      | "voltageV"
      | "continuousKW"
      | "continuousKVA"
      | "derating"
      | "restartSeconds",
    label: string,
    unit: string,
    min = 0,
    max?: number,
  ) =>
    draft && (
      <Field label={t(label)} unit={unit}>
        <LocaleNumberInput
          value={draft[key]}
          min={min}
          max={max}
          onValueChange={(value) => setDraft({ ...draft, [key]: value })}
          required
        />
      </Field>
    );
  return (
    <section className="panel panel-pad">
      <div className="section-title">
        <div>
          <span className="eyebrow">{t("Supply equipment")}</span>
          <h3>{t("Source register and capacity checks")}</h3>
        </div>
        <button className="button primary" onClick={add}>
          <Plus size={16} />
          {t("Add source")}
        </button>
      </div>
      <Notice>
        {t(
          "Enter actual nameplate ratings and applicable conditions. Source records describe equipment and served boundaries; they do not switch physical supplies.",
        )}
      </Notice>
      {!project.sources?.length && (
        <p className="muted">{t("No source equipment entered.")}</p>
      )}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t("Name")}</th>
              <th>{t("Type")}</th>
              <th>{t("Served board")}</th>
              <th>kW / kVA</th>
              <th>{t("Actions")}</th>
            </tr>
          </thead>
          <tbody>
            {project.sources?.map((row) => (
              <tr key={row.id}>
                <td>
                  <button
                    className="text-button"
                    onClick={() => {
                      setSelected(row.id);
                      onSelect?.(row.id);
                    }}
                  >
                    {row.name}
                  </button>
                </td>
                <td>{t(row.type)}</td>
                <td>
                  {project.boards.find((board) => board.id === row.boardId)
                    ?.name ?? t("Whole project")}
                </td>
                <td>
                  {numberFormat(row.continuousKW, 3, locale)} /{" "}
                  {numberFormat(row.continuousKVA, 3, locale)}
                </td>
                <td>
                  <div className="button-row">
                    <button
                      className="icon-button"
                      aria-label={`${t("Edit")} ${row.name}`}
                      onClick={() => {
                        setDraft(structuredClone(row));
                        setError("");
                      }}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      className="icon-button"
                      aria-label={`${t("Delete")} ${row.name}`}
                      onClick={() =>
                        change((p) => {
                          p.sources = p.sources?.filter(
                            (item) => item.id !== row.id,
                          );
                          if (p.energy.backup?.sourceId === row.id)
                            delete p.energy.backup.sourceId;
                        })
                      }
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {source && (
        <>
          <div className="form-grid three">
            <Field label={t("Assessment source")}>
              <select
                value={selected}
                onChange={(e) => {
                  setSelected(e.target.value);
                  onSelect?.(e.target.value);
                }}
              >
                {project.sources?.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t("Operating scenario")}>
              <select
                value={scenario}
                onChange={(e) => setScenario(e.target.value as typeof scenario)}
              >
                <option value="running">{t("Running loads")}</option>
                <option value="starting">{t("Starting events")}</option>
              </select>
            </Field>
            <Field
              label={t("Assessment instant")}
              hint={t(
                "Optional ISO timestamp with UTC offset; blank uses entered on-state loads.",
              )}
            >
              <input
                value={at}
                placeholder="2026-01-01T08:00:00+01:00"
                onChange={(e) => setAt(e.target.value)}
              />
            </Field>
          </div>
          {assessment?.error && (
            <Notice tone="error">{assessment.error}</Notice>
          )}
          {assessment?.result && (
            <>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>{t("Check")}</th>
                      <th>{t("Status")}</th>
                      <th>{t("Result")}</th>
                      <th>{t("Limit")}</th>
                      <th>{t("Evidence")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assessment.result.checks.map((check) => (
                      <tr key={check.id}>
                        <td>{t(check.label)}</td>
                        <td>
                          <span className="tag">{t(check.assessment)}</span>
                        </td>
                        <td>
                          {check.value === undefined
                            ? "—"
                            : numberFormat(check.value, 3, locale)}{" "}
                          {check.unit}
                        </td>
                        <td>
                          {check.limit === undefined
                            ? "—"
                            : numberFormat(check.limit, 3, locale)}{" "}
                          {check.unit}
                        </td>
                        <td>
                          <details>
                            <summary>{t("Show details")}</summary>
                            <p>{t(check.detail)}</p>
                            <p>{check.source}</p>
                          </details>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="small muted">{t(assessment.result.method)}</p>
              <button
                className="button"
                onClick={() =>
                  downloadFile(
                    safeName(source.name) + "-assessment.json",
                    JSON.stringify(
                      {
                        projectId: project.id,
                        revision: project.revision,
                        source,
                        options: { scenario, at },
                        result: assessment.result,
                      },
                      null,
                      2,
                    ),
                    "application/json",
                  )
                }
              >
                <Download size={16} />
                {t("Export assessment")}
              </button>
            </>
          )}
        </>
      )}
      {draft && (
        <Modal
          title={t("Source equipment")}
          onClose={() => setDraft(undefined)}
          wide
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              save();
            }}
          >
            <div className="modal-body">
              <div className="form-grid three">
                <Field label={t("Name")}>
                  <input
                    required
                    maxLength={200}
                    value={draft.name}
                    onChange={(e) =>
                      setDraft({ ...draft, name: e.target.value })
                    }
                  />
                </Field>
                <Field label={t("Type")}>
                  <select
                    value={draft.type}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        type: e.target.value as SourceEquipment["type"],
                      })
                    }
                  >
                    {[
                      "grid",
                      "transformer",
                      "generator",
                      "inverter",
                      "ups",
                    ].map((type) => (
                      <option key={type} value={type}>
                        {t(type)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={t("Served board")}>
                  <select
                    value={draft.boardId ?? ""}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        boardId: e.target.value || undefined,
                      })
                    }
                  >
                    <option value="">{t("Whole project")}</option>
                    {project.boards.map((board) => (
                      <option key={board.id} value={board.id}>
                        {board.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={t("Connection")}>
                  <select
                    value={draft.connection}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        connection: e.target
                          .value as SourceEquipment["connection"],
                      })
                    }
                  >
                    {["single", "three", "dc"].map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                </Field>
                {draft.connection === "single" && (
                  <Field label={t("Phase")}>
                    <select
                      value={draft.phase ?? "L1"}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          phase: e.target.value as SourceEquipment["phase"],
                        })
                      }
                    >
                      {["L1", "L2", "L3"].map((value) => (
                        <option key={value}>{value}</option>
                      ))}
                    </select>
                  </Field>
                )}
                {numeric("voltageV", "Rated voltage", "V", 0.01)}
                {numeric(
                  "continuousKW",
                  "Continuous real-power rating",
                  "kW",
                  0.000001,
                )}
                {numeric(
                  "continuousKVA",
                  "Continuous apparent-power rating",
                  "kVA",
                  0.000001,
                )}
                {numeric("derating", "Derating factor", "0–1", 0.000001, 1)}
                {numeric("restartSeconds", "Restart delay", "s")}
                <Field label={t("Evidence type")}>
                  <select
                    value={draft.source.kind}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        source: {
                          ...draft.source,
                          kind: e.target
                            .value as SourceEquipment["source"]["kind"],
                        },
                      })
                    }
                  >
                    {[
                      "nameplate",
                      "datasheet",
                      "measured",
                      "user",
                      "estimate",
                    ].map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                </Field>
                <Field label={t("Evidence reference")}>
                  <input
                    value={draft.source.reference}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        source: { ...draft.source, reference: e.target.value },
                      })
                    }
                  />
                </Field>
              </div>
              <div className="button-row">
                {(
                  [
                    "islandCapable",
                    "gridForming",
                    "transferIsolationVerified",
                    "blackStart",
                  ] as const
                ).map((key, index) => (
                  <label key={key} className="checkbox">
                    <input
                      type="checkbox"
                      checked={draft[key]}
                      onChange={(e) =>
                        setDraft({ ...draft, [key]: e.target.checked })
                      }
                    />
                    {t(
                      [
                        "Island-capable",
                        "Grid-forming",
                        "Transfer isolation verified",
                        "Black-start capable",
                      ][index],
                    )}
                  </label>
                ))}
              </div>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={Boolean(draft.overload)}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      overload: e.target.checked
                        ? {
                            kw: draft.continuousKW,
                            kva: draft.continuousKVA,
                            durationSeconds: 0,
                            source: "",
                          }
                        : undefined,
                    })
                  }
                />
                {t("Enter documented overload envelope")}
              </label>
              {draft.overload && (
                <div className="form-grid four">
                  {(["kw", "kva", "durationSeconds"] as const).map((key) => (
                    <Field
                      key={key}
                      label={key === "durationSeconds" ? t("Duration") : key}
                      unit={key === "durationSeconds" ? "s" : key}
                    >
                      <LocaleNumberInput
                        min={0}
                        value={draft.overload![key]}
                        onValueChange={(value) =>
                          setDraft({
                            ...draft,
                            overload: { ...draft.overload!, [key]: value },
                          })
                        }
                        required
                      />
                    </Field>
                  ))}
                  <Field label={t("Envelope reference")}>
                    <input
                      value={draft.overload.source}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          overload: {
                            ...draft.overload!,
                            source: e.target.value,
                          },
                        })
                      }
                    />
                  </Field>
                </div>
              )}
              <Field label={t("Notes")}>
                <textarea
                  value={draft.notes}
                  onChange={(e) =>
                    setDraft({ ...draft, notes: e.target.value })
                  }
                />
              </Field>
              {error && <Notice tone="error">{error}</Notice>}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="button"
                onClick={() => setDraft(undefined)}
              >
                {t("Cancel")}
              </button>
              <button className="button primary" type="submit">
                {t("Save source")}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}

export function ProjectOrganization({
  project,
  change,
}: {
  project: Project;
  change: Change;
}) {
  const t = useT();
  const [name, setName] = useState(""),
    [kind, setKind] = useState<"building" | "zone">("building"),
    [parentId, setParentId] = useState(""),
    [error, setError] = useState("");
  function apply(mutator: (draft: Project) => void) {
    const draft = structuredClone(project);
    mutator(draft);
    const validation = validateProjectImport(draft);
    if (!validation.valid) {
      setError(validation.errors.join(" "));
      return false;
    }
    const saved = change((p) => {
      p.zones = draft.zones;
      p.boards = draft.boards;
    });
    setError("");
    return saved !== false;
  }
  return (
    <section className="panel panel-pad">
      <h3>{t("Site, buildings and zones")}</h3>
      <p className="muted">
        {project.name} ·{" "}
        {t("Organization groups do not create electrical connections.")}
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (
            apply((p) => {
              (p.zones ??= []).push({
                id: newId("zone"),
                name: name.trim(),
                kind,
                parentId: parentId || undefined,
              });
            })
          )
            setName("");
        }}
      >
        <div className="form-grid four">
          <Field label={t("Group name")}>
            <input
              required
              maxLength={200}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field label={t("Group type")}>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as typeof kind)}
            >
              <option value="building">{t("Building")}</option>
              <option value="zone">{t("Zone")}</option>
            </select>
          </Field>
          <Field label={t("Parent group")}>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
            >
              <option value="">{t("Site")}</option>
              {project.zones?.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name}
                </option>
              ))}
            </select>
          </Field>
          <button type="submit" className="button">
            {t("Add group")}
          </button>
        </div>
      </form>
      {project.zones?.map((zone) => (
        <div className="trash-row" key={zone.id}>
          <input
            aria-label={`${t("Rename group")} ${zone.name}`}
            key={zone.id + zone.name}
            defaultValue={zone.name}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
            }}
            onBlur={(e) => {
              const value = e.currentTarget.value.trim();
              if (
                value !== zone.name &&
                !apply((p) => {
                  p.zones!.find((row) => row.id === zone.id)!.name = value;
                })
              )
                e.currentTarget.value = zone.name;
            }}
          />
          <span>
            {t(zone.kind)} ·{" "}
            {project.zones?.find((p) => p.id === zone.parentId)?.name ??
              t("Site")}
          </span>
          <Field label={t("Parent group")}>
            <select
              value={zone.parentId ?? ""}
              onChange={(e) =>
                apply((p) => {
                  p.zones!.find((row) => row.id === zone.id)!.parentId =
                    e.target.value || undefined;
                })
              }
            >
              <option value="">{t("Site")}</option>
              {project.zones
                ?.filter((parent) => parent.id !== zone.id)
                .map((parent) => (
                  <option key={parent.id} value={parent.id}>
                    {parent.name}
                  </option>
                ))}
            </select>
          </Field>
          <button
            className="button"
            onClick={() =>
              apply((p) => {
                p.zones = p.zones
                  ?.filter((row) => row.id !== zone.id)
                  .map((row) =>
                    row.parentId === zone.id
                      ? { ...row, parentId: zone.parentId }
                      : row,
                  );
                p.boards = p.boards.map((board) =>
                  board.zoneId === zone.id
                    ? { ...board, zoneId: undefined }
                    : board,
                );
              })
            }
          >
            {t("Remove group")}
          </button>
        </div>
      ))}
      {project.boards.map((board) => (
        <Field key={board.id} label={board.name}>
          <select
            value={board.zoneId ?? ""}
            onChange={(e) =>
              apply((p) => {
                p.boards.find((row) => row.id === board.id)!.zoneId =
                  e.target.value || undefined;
              })
            }
          >
            <option value="">{t("Site")}</option>
            {project.zones?.map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.name}
              </option>
            ))}
          </select>
        </Field>
      ))}
      {error && <Notice tone="error">{error}</Notice>}
    </section>
  );
}
