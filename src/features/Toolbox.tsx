import { useMemo, useState, useContext, useRef, useEffect } from "react";
import {
  Search,
  ArrowRight,
  Calculator,
  Copy,
  RotateCcw,
  BookOpen,
  Download,
} from "lucide-react";
import { tools } from "../tools";
import type { EngineeringTool } from "../tools";
import { Field, Notice } from "./ui";
import { useT, LanguageContext, numberFormat } from "../i18n";
import { parseLocaleNumber, formatEditableNumber } from "../i18n/numbers";
import type { Project } from "../domain/types";
import { ToolboxApply } from "./ToolboxApply";
import { downloadFile, safeName } from "../import-export/files";
export function Toolbox({
  category,
  initialTool,
  project,
  change,
  selectedId,
}: {
  category?: string;
  initialTool?: string;
  project: Project;
  change: (mutator: (draft: Project) => void) => boolean | void;
  selectedId?: string;
}) {
  const t = useT();
  const locale = useContext(LanguageContext);
  const previousLocale = useRef(locale);
  const [calculatedInputs, setCalculatedInputs] = useState<
    Record<string, number | string>
  >({});
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(initialTool || "");
  const [values, setValues] = useState<Record<string, number | string>>({});
  const [result, setResult] = useState<ReturnType<
    EngineeringTool["calculate"]
  > | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const filtered = useMemo(
    () =>
      tools.filter(
        (tool) =>
          (!category ||
            new RegExp(category, "i").test(tool.category + " " + tool.title)) &&
          (!query ||
            [tool.title, tool.id, tool.category, tool.description]
              .join(" ")
              .toLowerCase()
              .includes(query.toLowerCase())),
      ),
    [query, category],
  );
  const tool = tools.find((tool) => tool.id === selected);
  useEffect(() => {
    if (previousLocale.current === locale) return;
    const before = previousLocale.current;
    previousLocale.current = locale;
    setValues((current) => {
      const next = { ...current };
      for (const input of tool?.inputs || []) {
        if (
          input.options ||
          input.type === "text" ||
          next[input.key] === undefined ||
          next[input.key] === ""
        )
          continue;
        const value = next[input.key];
        if (typeof value === "number") continue;
        const parsed = parseLocaleNumber(value, before, {
          min: input.min,
          max: input.max,
        });
        if (parsed.ok) next[input.key] = parsed.value;
      }
      return next;
    });
  }, [locale, tool]);
  function choose(id: string) {
    setSelected(id);
    setValues({});
    setResult(null);
    setError("");
  }
  function calc(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (!tool) return;
      const normalized = { ...values };
      for (const input of tool.inputs) {
        if (input.options || input.type === "text") continue;
        const value = values[input.key];
        if (value === undefined || value === "") continue;
        if (typeof value === "number") {
          normalized[input.key] = value;
          continue;
        }
        const parsed = parseLocaleNumber(value, locale, {
          min: input.min,
          max: input.max,
        });
        if (!parsed.ok)
          throw new Error(t(input.label) + ": " + t(parsed.message));
        normalized[input.key] = parsed.value;
      }
      setResult(tool.calculate(normalized));
      setCalculatedInputs(normalized);
      setError("");
    } catch (e) {
      setResult(null);
      setError((e as Error).message);
    }
  }
  return (
    <div className="tool-layout">
      <div className="tool-catalog panel">
        <div className="search-field">
          <Search size={17} />
          <input
            aria-label={t("Search tools")}
            placeholder={t("Search tools")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <span>{filtered.length}</span>
        </div>
        <div className="tool-list">
          {filtered.map((tool) => (
            <button
              key={tool.id}
              className={"tool-item " + (selected === tool.id ? "active" : "")}
              onClick={() => choose(tool.id)}
            >
              <span className="tool-id">{tool.id}</span>
              <span>
                <strong>{t(tool.title)}</strong>
                <small>{t(tool.category)}</small>
              </span>
              <ArrowRight size={14} />
            </button>
          ))}
        </div>
      </div>
      <div className="tool-workspace">
        {tool ? (
          <>
            <div className="section-title">
              <div>
                <span className="eyebrow">
                  {tool.id} / {t(tool.category)}
                </span>
                <h2>{t(tool.title)}</h2>
                <p>{t(tool.description)}</p>
              </div>
              <div className="tool-symbol">
                <Calculator size={26} />
              </div>
            </div>
            <form className="panel panel-pad" onSubmit={calc}>
              <div className="form-grid">
                {tool.inputs.map((input) => (
                  <Field
                    key={input.key}
                    label={t(input.label)}
                    unit={input.unit}
                    hint={input.hint ? t(input.hint) : undefined}
                  >
                    {input.options ? (
                      <select
                        value={values[input.key] ?? ""}
                        onChange={(e) => {
                          setValues({ ...values, [input.key]: e.target.value });
                          setResult(null);
                        }}
                        required={input.required !== false}
                      >
                        <option value="">—</option>
                        {input.options.map((o) => (
                          <option key={o.value} value={o.value}>
                            {t(o.label)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        inputMode={
                          input.type === "text" ? undefined : "decimal"
                        }
                        min={input.min}
                        max={input.max}
                        step={input.step ?? "any"}
                        value={
                          typeof values[input.key] === "number"
                            ? formatEditableNumber(
                                values[input.key] as number,
                                locale,
                              )
                            : (values[input.key] ?? "")
                        }
                        onChange={(e) => {
                          setValues({ ...values, [input.key]: e.target.value });
                          setResult(null);
                        }}
                        required={input.required !== false}
                      />
                    )}
                  </Field>
                ))}
              </div>
              <div className="button-row">
                <button className="button primary" type="submit">
                  <Calculator size={16} />
                  {t("Calculate")}
                </button>
                <button
                  className="button"
                  type="button"
                  onClick={() => {
                    setValues({ ...tool.exampleInputs });
                    setResult(null);
                    setError("");
                  }}
                >
                  <BookOpen size={15} />
                  {t("Load worked example")}
                </button>
                <button
                  className="icon-button"
                  type="button"
                  title={t("Reset")}
                  onClick={() => {
                    setValues({});
                    setResult(null);
                    setError("");
                  }}
                >
                  <RotateCcw size={16} />
                </button>
              </div>
              {error && (
                <p role="alert" className="error-text">
                  {t(error)}
                </p>
              )}
            </form>
            {result && (
              <ToolboxApply
                project={project}
                change={change}
                toolId={tool.id}
                values={calculatedInputs}
                result={result}
                selectedId={selectedId}
              />
            )}
            {result && (
              <section className="panel panel-pad tool-result">
                <div className="panel-title">
                  <h3>{t("Result")}</h3>
                  <span
                    className={
                      "tag " +
                      (result.status === "calculated" ? "cyan" : "amber")
                    }
                  >
                    {t(result.status)}
                  </span>
                </div>
                <div className="result-grid">
                  {result.values.map((r, i) => (
                    <div key={i}>
                      <span>{t(r.label)}</span>
                      <strong>
                        {typeof r.value === "number"
                          ? numberFormat(r.value, 6, locale)
                          : t(r.value)}{" "}
                        <small>{r.unit}</small>
                      </strong>
                    </div>
                  ))}
                </div>
                <div className="formula">{t(result.formula)}</div>
                {result.warnings?.map((w, i) => (
                  <Notice key={i} tone="warning">
                    {t(w)}
                  </Notice>
                ))}
                {result.notes?.map((n, i) => (
                  <p className="muted small" key={i}>
                    {t(n)}
                  </p>
                ))}
                {result.sources?.length > 0 && (
                  <details>
                    <summary>{t("Sources")}</summary>
                    {result.sources.map((s, i) => (
                      <p key={i}>
                        {/^https:\/\//.test(s) ? (
                          <a href={s} target="_blank" rel="noreferrer">
                            {s}
                          </a>
                        ) : (
                          s
                        )}
                      </p>
                    ))}
                  </details>
                )}
                <div className="button-row">
                  <button
                    className="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(
                          JSON.stringify(
                            { tool: tool.id, inputs: calculatedInputs, result },
                            null,
                            2,
                          ),
                        );
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      } catch {
                        setError("Clipboard unavailable; use Export.");
                      }
                    }}
                  >
                    <Copy size={15} />
                    {copied ? "✓" : t("Copy result")}
                  </button>
                  <button
                    className="button"
                    onClick={() =>
                      downloadFile(
                        safeName(tool.title) + ".json",
                        JSON.stringify(
                          { tool: tool.id, inputs: calculatedInputs, result },
                          null,
                          2,
                        ),
                        "application/json",
                      )
                    }
                  >
                    <Download size={15} />
                    {t("Export")}
                  </button>
                </div>
              </section>
            )}
          </>
        ) : (
          <div className="panel tool-intro">
            <div className="large-icon">
              <Calculator size={38} />
            </div>
            <span className="eyebrow">
              ADIGUNPOWERLAB / {tools.length} METHODS
            </span>
            <h2>{t("Engineering Toolbox")}</h2>
            <p>{t("Configure source and evidence")}</p>
            <div className="category-chips">
              {[...new Set(filtered.map((x) => x.category))].map((c) => (
                <button key={c} className="chip" onClick={() => setQuery(c)}>
                  {t(c)}
                </button>
              ))}
            </div>
            <p className="small muted">
              {t("Engineering estimate, not installation approval.")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
