import { useState } from "react";
import { Plus, Save } from "lucide-react";
import type { Load, Project } from "../domain/types";
import { createLoad } from "../domain/project";
import { normalizeLoad } from "../engine/electrical";
import { Modal, Field, Notice } from "./ui";
import { useT } from "../i18n";
export function LoadEditor({
  load,
  project,
  onSave,
  onClose,
  purpose = "load",
}: {
  load?: Load;
  project: Project;
  onSave: (load: Load) => void;
  onClose: () => void;
  purpose?: "load" | "template";
}) {
  const t = useT();
  const [draft, setDraft] = useState(() =>
    load
      ? structuredClone(load)
      : createLoad({ name: "", rating: 0, voltage: project.supply.voltageLN }),
  );
  const [rating, setRating] = useState(load ? String(load.rating) : "");
  const [error, setError] = useState("");
  const set = <K extends keyof Load>(key: K, value: Load[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));
  const num = (
    key: keyof Load,
    label: string,
    unit = "",
    min = 0,
    max?: number,
    step = "any",
  ) => (
    <Field label={t(label)} unit={unit}>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={draft[key] as number}
        onChange={(e) => set(key, Number(e.target.value) as never)}
        required
      />
    </Field>
  );
  function submit(e: React.FormEvent) {
    e.preventDefault();
    const l = { ...draft, rating: Number(rating) };
    if (!rating.trim() || !draft.name.trim()) {
      setError("Enter a name and rating.");
      return;
    }
    const normalized = normalizeLoad(l);
    if (!normalized.valid) {
      setError(normalized.issues.map((i) => i.message).join(" "));
      return;
    }
    onSave(l);
  }
  return (
    <Modal
      title={t(
        purpose === "template"
          ? "Equipment template"
          : load
            ? "Edit load"
            : "Add load",
      )}
      onClose={onClose}
      wide
    >
      <form onSubmit={submit}>
        <div className="modal-body">
          <div className="form-grid">
            <Field label={t("Name")}>
              <input
                autoComplete="off"
                value={draft.name}
                onChange={(e) => set("name", e.target.value)}
                required
                maxLength={160}
                autoFocus
              />
            </Field>
            <Field label={t("Category")}>
              <select
                value={draft.category}
                onChange={(e) => set("category", e.target.value)}
              >
                {[
                  "General",
                  "Lighting",
                  "Heating",
                  "HVAC",
                  "IT & servers",
                  "Motor",
                  "Workshop",
                  "EV",
                  "Pumps",
                  "Appliances",
                ].map((c) => (
                  <option key={c} value={c}>
                    {t(c)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t("Entry mode")}>
              <select
                value={draft.entryMode}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    entryMode: e.target.value as Load["entryMode"],
                    reactiveKvar:
                      e.target.value === "complex"
                        ? (d.reactiveKvar ?? 0)
                        : d.reactiveKvar,
                  }))
                }
              >
                {[
                  ["kw", "Electrical input (kW)"],
                  ["kva", "Apparent power (kVA)"],
                  ["amps", "Nameplate current (A)"],
                  ["motor", "Motor shaft output (kW)"],
                  ["complex", "Complex P/Q"],
                ].map(([value, label]) => (
                  <option key={value} value={value}>
                    {t(label)}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label={t("Rating")}
              unit={
                draft.entryMode === "amps"
                  ? "A"
                  : draft.entryMode === "kva"
                    ? "kVA"
                    : "kW"
              }
            >
              <input
                type="number"
                step="any"
                min="0"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                required
              />
            </Field>
            {num("quantity", "Quantity", "", 1, 10000, "1")}
            <Field label={t("Connection")}>
              <select
                value={draft.connection}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    connection: e.target.value as Load["connection"],
                    phasePair:
                      e.target.value === "line-line"
                        ? d.phasePair || ["L1", "L2"]
                        : d.phasePair,
                    voltage:
                      e.target.value === "three" ||
                      e.target.value === "line-line"
                        ? project.supply.voltageLL
                        : project.supply.voltageLN,
                  }))
                }
              >
                {[
                  ["single", "Single phase"],
                  ["three", "Three phase"],
                  ["line-line", "Line to line"],
                  ["dc", "DC"],
                ].map(([v, label]) => (
                  <option key={v} value={v}>
                    {t(label)}
                  </option>
                ))}
              </select>
            </Field>
            {num("voltage", "Voltage", "V", 0.001)}
            {num("pf", "Power factor", "", 0.001, 1)}
            <Field label={t("Phase")}>
              <select
                value={draft.phase}
                onChange={(e) => set("phase", e.target.value as Load["phase"])}
              >
                {["L1", "L2", "L3"].map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </Field>
            {draft.connection === "line-line" && (
              <Field label={t("Phase pair")}>
                <select
                  value={(draft.phasePair || ["L1", "L2"]).join("-")}
                  onChange={(e) =>
                    set(
                      "phasePair",
                      e.target.value.split("-") as Load["phasePair"],
                    )
                  }
                >
                  {["L1-L2", "L2-L3", "L3-L1"].map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </Field>
            )}
            <Field label={t("Reactive power")}>
              <select
                value={draft.reactive}
                onChange={(e) =>
                  set("reactive", e.target.value as Load["reactive"])
                }
              >
                <option value="lagging">{t("Lagging")}</option>
                <option value="leading">{t("Leading")}</option>
              </select>
            </Field>
            {draft.entryMode === "complex" &&
              num("reactiveKvar", "Reactive power", "kvar", -1000000)}
            {draft.entryMode === "motor" &&
              num("efficiency", "Efficiency", "η", 0.001, 1)}
            {num("hoursPerDay", "Operating hours", "h/day", 0, 24)}
            {num("startHour", "Start hour", "h", 0, 23.999)}
            {num("duty", "Energy duty", "0–1", 0, 1)}
            {num("utilization", "Utilization", "0–1", 0, 1)}
            {num("standbyW", "Standby power", "W")}
            <Field label={t("Circuit")}>
              <select
                value={draft.circuitId || ""}
                onChange={(e) => {
                  const circuit = project.circuits.find(
                    (c) => c.id === e.target.value,
                  );
                  setDraft((d) => ({
                    ...d,
                    circuitId: circuit?.id,
                    boardId: circuit?.boardId,
                    phase: circuit?.phase || d.phase,
                  }));
                }}
              >
                <option value="">{t("Unassigned")}</option>
                {project.circuits.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t("Provenance")}>
              <select
                value={draft.source.kind}
                onChange={(e) =>
                  set("source", {
                    ...draft.source,
                    kind: e.target.value as Load["source"]["kind"],
                  })
                }
              >
                {[
                  ["user", "User assumption"],
                  ["nameplate", "Nameplate"],
                  ["measured", "Measured"],
                  ["datasheet", "Datasheet"],
                  ["estimate", "Typical estimate"],
                ].map(([v, label]) => (
                  <option key={v} value={v}>
                    {t(label)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t("Source reference")}>
              <input
                value={draft.source.reference}
                onChange={(e) =>
                  set("source", { ...draft.source, reference: e.target.value })
                }
                maxLength={1000}
              />
            </Field>
          </div>
          <div className="check-row">
            <label>
              <input
                type="checkbox"
                checked={draft.critical}
                onChange={(e) => set("critical", e.target.checked)}
              />
              {t("Critical load")}
            </label>
            <label>
              <input
                type="checkbox"
                checked={draft.locked}
                onChange={(e) => set("locked", e.target.checked)}
              />
              {t("Lock phase")}
            </label>
          </div>
          <Field label={t("Notes")}>
            <textarea
              rows={2}
              value={draft.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </Field>
          <Notice>
            {t("Energy duty")} → kWh. {t("Current")} → {t("Rating")} ×{" "}
            {t("Utilization")}. {t("All results use entered assumptions.")}
          </Notice>
          {error && (
            <p role="alert" className="error-text">
              {t(error)}
            </p>
          )}
        </div>
        <div className="modal-footer">
          <button className="button" type="button" onClick={onClose}>
            {t("Cancel")}
          </button>
          <button className="button primary" type="submit">
            {load ? <Save size={16} /> : <Plus size={16} />}{" "}
            {t(
              purpose === "template"
                ? "Save template"
                : load
                  ? "Save"
                  : "Add load",
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
