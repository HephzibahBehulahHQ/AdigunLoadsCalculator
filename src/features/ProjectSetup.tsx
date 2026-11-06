import { useContext, useId, useState } from "react";
import type { Project } from "../domain/types";
import { validateProjectImport } from "../domain/project";
import { LanguageContext, languages, type Locale } from "../i18n";
import { formatEditableNumber, parseLocaleNumber } from "../i18n/numbers";
import { registerUpdateGuard } from "../pwa/updates";
import { setupText } from "./projectSetupMessages";
import "./projectSetup.css";

type SupplyKey = keyof Project["supply"];
type TextKey = "name" | "context" | "timezone" | "currency" | "jurisdiction";
type SetupKey = TextKey | SupplyKey;
type Draft = {
  fields: Partial<Record<SetupKey, string>>;
  numberLocales: Partial<Record<SupplyKey, Locale>>;
  complete: boolean;
};
const supplyFields: [SupplyKey, string][] = [
  ["voltageLN", "Line-to-neutral voltage (V)"],
  ["voltageLL", "Line-to-line voltage (V)"],
  ["frequency", "Frequency (Hz)"],
  ["limitA", "Supply limit (A)"],
];
const textFields: TextKey[] = [
  "name",
  "context",
  "timezone",
  "currency",
  "jurisdiction",
];
const keys: SetupKey[] = [...textFields, ...supplyFields.map(([key]) => key)];
const drafts = new Map<string, Draft>();
const storageKey = (id: string) => `adigunpowerlab.project-setup.v1:${id}`;
const hasPendingFields = (draft: Draft) =>
  !draft.complete && Object.keys(draft.fields).length > 0;

// Drafts outlive Overview, including the memory fallback when storage fails.
registerUpdateGuard(() => {
  if (![...drafts.values()].some(hasPendingFields)) return undefined;
  const language = typeof document === "undefined" ? "en" : document.documentElement.lang;
  const locale = Object.hasOwn(languages, language) ? language as Locale : "en";
  return setupText("Project setup", locale);
});

function readDraft(id: string): Draft {
  const cached = drafts.get(id);
  if (cached) return cached;
  let draft: Draft = { fields: {}, numberLocales: {}, complete: false };
  try {
    const stored = JSON.parse(sessionStorage.getItem(storageKey(id)) ?? "null");
    if (
      stored &&
      typeof stored.complete === "boolean" &&
      stored.fields &&
      typeof stored.fields === "object" &&
      Object.entries(stored.fields).every(
        ([key, value]) =>
          keys.includes(key as SetupKey) &&
          typeof value === "string" &&
          value.length <= 1000,
      ) &&
      stored.numberLocales &&
      typeof stored.numberLocales === "object" &&
      Object.entries(stored.numberLocales).every(
        ([key, value]) =>
          supplyFields.some(([field]) => field === key) &&
          Object.keys(languages).includes(String(value)),
      )
    )
      draft = stored;
  } catch {
    /* The in-memory draft remains available when browser storage is blocked. */
  }
  drafts.set(id, draft);
  return draft;
}

export interface ProjectSetupProps {
  project: Project;
  change: (mutator: (draft: Project) => void) => boolean | void;
  onLocale: (locale: Locale) => void;
  onAdd: () => void;
}

export function ProjectSetup({
  project,
  change,
  onLocale,
  onAdd,
}: ProjectSetupProps) {
  const locale = useContext(LanguageContext);
  const l = (key: string) => setupText(key, locale);
  const id = useId();
  const [draft, setDraft] = useState(() => readDraft(project.id));
  const [errors, setErrors] = useState<
    Partial<Record<SetupKey | "project", string>>
  >({});
  const pending = hasPendingFields(draft);

  const remember = (next: Draft) => {
    drafts.set(project.id, next);
    try {
      sessionStorage.setItem(storageKey(project.id), JSON.stringify(next));
    } catch {
      /* Keep the working draft in memory. */
    }
    setDraft(next);
  };
  const edit = (key: SetupKey, value: string) => {
    const fields = { ...draft.fields };
    const numberLocales = { ...draft.numberLocales };
    const numeric = supplyFields.some(([field]) => field === key);
    const savedValue = numeric
      ? formatEditableNumber(project.supply[key as SupplyKey], locale)
      : project[key as TextKey];
    if (value === savedValue) {
      delete fields[key];
      if (numeric) delete numberLocales[key as SupplyKey];
    } else {
      fields[key] = value;
      if (numeric) numberLocales[key as SupplyKey] = locale;
    }
    remember({
      ...draft,
      fields,
      numberLocales,
    });
    setErrors({});
  };
  const discard = () => {
    const clean: Draft = { fields: {}, numberLocales: {}, complete: false };
    drafts.set(project.id, clean);
    setDraft(clean);
    setErrors({});
    try { sessionStorage.removeItem(storageKey(project.id)); }
    catch { /* Discard still clears the in-memory draft when storage is blocked. */ }
  };
  const value = (key: SetupKey) =>
    draft.fields[key] ??
    (key in project.supply
      ? formatEditableNumber(project.supply[key as SupplyKey], locale)
      : project[key as TextKey]);

  if (
    draft.complete ||
    (!pending && (project.loads.length > 0 || project.revision !== 1))
  )
    return null;

  const save = () => {
    const issues: typeof errors = {};
    const candidate = structuredClone(project);
    for (const key of textFields) candidate[key] = value(key).trim();
    if (!candidate.name || candidate.name.length > 160)
      issues.name = "Enter a project name (up to 160 characters).";
    try {
      new Intl.DateTimeFormat("en", { timeZone: candidate.timezone });
    } catch {
      issues.timezone =
        "Enter a valid timezone, for example Africa/Lagos or Europe/Berlin.";
    }
    for (const [key] of supplyFields) {
      const parsed = parseLocaleNumber(
        value(key),
        draft.numberLocales[key] ?? locale,
      );
      if (!parsed.ok || parsed.value <= 0)
        issues[key] =
          "Enter a positive number using this field's decimal separator.";
      else candidate.supply[key] = parsed.value;
    }
    if (Object.keys(issues).length) {
      setErrors(issues);
      return;
    }
    if (!validateProjectImport(candidate).valid) {
      setErrors({ project: "Review the project settings before saving." });
      return;
    }
    if (pending) {
      const accepted = change((current) => {
        for (const key of textFields)
          if (draft.fields[key] !== undefined) current[key] = candidate[key];
        for (const [key] of supplyFields)
          if (draft.fields[key] !== undefined)
            current.supply[key] = candidate.supply[key];
        if (!validateProjectImport(current).valid)
          throw new Error(l("Review the project settings before saving."));
      });
      if (accepted === false) {
        setErrors({ project: "Review the project settings before saving." });
        return;
      }
    }
    remember({ fields: {}, numberLocales: {}, complete: true });
  };

  const error = (key: SetupKey) =>
    errors[key] && (
      <span className="error-text" id={`${id}-${key}-error`} role="alert">
        {l(errors[key]!)}
      </span>
    );
  const attributes = (key: SetupKey) => ({
    id: `${id}-${key}`,
    "aria-invalid": errors[key] ? (true as const) : undefined,
    "aria-describedby": errors[key] ? `${id}-${key}-error` : undefined,
  });
  const contexts = Array.from(
    new Set([
      project.context,
      "Residential",
      "Commercial",
      "Workshop",
      "Industrial",
      "Agricultural",
      "Community",
    ]),
  );
  const currencies = Array.from(
    new Set([project.currency, "EUR", "NGN", "USD", "GBP", "JPY", "KWD"]),
  );

  return (
    <section className="panel project-setup" aria-labelledby={`${id}-title`}>
      <div className="project-setup-heading">
        <div>
          <h3 id={`${id}-title`}>{l("Project setup")}</h3>
          <p className="muted">
            {l("Set the project basics, or enter your first load now.")}
          </p>
        </div>
        <button className="button" onClick={onAdd}>
          {l("Add first load")}
        </button>
      </div>
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        <div className="project-setup-grid">
          <div className="project-setup-field">
            <label htmlFor={`${id}-name`}>{l("Project name")}</label>
            <input
              {...attributes("name")}
              value={value("name")}
              maxLength={160}
              onChange={(event) => edit("name", event.target.value)}
            />
            {error("name")}
          </div>
          <div className="project-setup-field">
            <label htmlFor={`${id}-context`}>{l("Application context")}</label>
            <select
              {...attributes("context")}
              value={value("context")}
              onChange={(event) => edit("context", event.target.value)}
            >
              {contexts.map((context) => (
                <option key={context} value={context}>
                  {l(context)}
                </option>
              ))}
            </select>
          </div>
          <div className="project-setup-field">
            <label htmlFor={`${id}-locale`}>{l("Interface language")}</label>
            <select
              id={`${id}-locale`}
              value={locale}
              onChange={(event) => onLocale(event.target.value as Locale)}
            >
              {Object.entries(languages).map(([code, name]) => (
                <option value={code} key={code}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div className="project-setup-field">
            <label htmlFor={`${id}-timezone`}>{l("Timezone")}</label>
            <input
              {...attributes("timezone")}
              value={value("timezone")}
              maxLength={100}
              onChange={(event) => edit("timezone", event.target.value)}
            />
            {error("timezone")}
          </div>
          <div className="project-setup-field">
            <label htmlFor={`${id}-currency`}>{l("Currency")}</label>
            <select
              {...attributes("currency")}
              value={value("currency")}
              onChange={(event) => edit("currency", event.target.value)}
            >
              {currencies.map((currency) => (
                <option key={currency}>{currency}</option>
              ))}
            </select>
          </div>
          <div className="project-setup-field">
            <label htmlFor={`${id}-jurisdiction`}>
              {l("Jurisdiction (optional)")}
            </label>
            <input
              {...attributes("jurisdiction")}
              value={value("jurisdiction")}
              maxLength={500}
              onChange={(event) => edit("jurisdiction", event.target.value)}
            />
          </div>
        </div>
        <fieldset className="project-setup-supply">
          <legend>{l("Supply assumptions")}</legend>
          <div className="project-setup-supply-grid">
            {supplyFields.map(([key, label]) => (
              <div className="project-setup-field" key={key}>
                <label htmlFor={`${id}-${key}`}>{l(label)}</label>
                <input
                  {...attributes(key)}
                  inputMode="decimal"
                  value={value(key)}
                  maxLength={100}
                  onChange={(event) => edit(key, event.target.value)}
                />
                {error(key)}
              </div>
            ))}
          </div>
        </fieldset>
        <p className="muted small">
          {l(
            "Language, currency and jurisdiction are independent. Check the supply values against your project.",
          )}
        </p>
        {errors.project && (
          <p className="error-text" role="alert">
            {l(errors.project)}
          </p>
        )}
        <div className="project-setup-footer">
          <button className="button primary" type="submit">
            {l("Save project setup")}
          </button>
          <button className="button secondary" type="button" onClick={discard} disabled={!pending && !Object.keys(errors).length}>
            {l("Discard setup draft")}
          </button>
          <span className="muted small">
            {l(
              "Your unfinished setup stays here while you add loads or change views.",
            )}
          </span>
        </div>
      </form>
    </section>
  );
}
