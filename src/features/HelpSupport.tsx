import { Fragment, useContext, useMemo, useRef, useState } from "react";
import { BookOpen, ExternalLink, Search } from "lucide-react";
import { LanguageContext, numberFormat, useT } from "../i18n";
import { helpArticles, type HelpArticle } from "../help/guide";
import { helpText, helpTopicLabels } from "../help/labels";
import { tools, type EngineeringTool } from "../tools";
import { Modal } from "./ui";
import "./HelpSupport.css";

export { helpText } from "../help/labels";

/** Translate visible control names while honestly marking explanatory prose English. */
function GuideText({ children }: { children: string }) {
  const t = useT();
  return (
    <>
      {children
        .split(/(\[\[.*?\]\])/g)
        .map((part, index) =>
          part.startsWith("[[") && part.endsWith("]]") ? (
            <strong key={index}>{t(part.slice(2, -2))}</strong>
          ) : (
            <Fragment key={index}>{part}</Fragment>
          ),
        )}
    </>
  );
}

function TaskGuide({ article }: { article: HelpArticle }) {
  const locale = useContext(LanguageContext);
  const t = useT();
  const h = (key: Parameters<typeof helpText>[1]) => helpText(locale, key);
  return (
    <div className="help-task" lang="en">
      <p className="help-summary">
        <GuideText>{article.summary}</GuideText>
      </p>
      <h4>{h("steps")}</h4>
      <ol className="help-steps">
        {article.steps.map((step, index) => (
          <li key={index}>
            <GuideText>{step}</GuideText>
          </li>
        ))}
      </ol>
      {article.controls && (
        <>
          <h4>{h("controls")}</h4>
          <div className="help-table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">{h("control")}</th>
                  <th scope="col">{h("action")}</th>
                </tr>
              </thead>
              <tbody>
                {article.controls.map(([label, action]) => (
                  <tr key={label}>
                    <th scope="row">
                      {label.split(" / ").map((part, index) => (
                        <Fragment key={index}>
                          {index > 0 && " / "}
                          {t(part)}
                        </Fragment>
                      ))}
                    </th>
                    <td>
                      <GuideText>{action}</GuideText>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {article.example && (
        <section className="help-example">
          <h4>{h("example")}</h4>
          <p>
            <GuideText>{article.example}</GuideText>
          </p>
        </section>
      )}
      {article.notes && (
        <>
          <h4>{h("notes")}</h4>
          <ul>
            {article.notes.map((note, index) => (
              <li key={index}>
                <GuideText>{note}</GuideText>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function ToolGuide({ tool }: { tool: EngineeringTool }) {
  const locale = useContext(LanguageContext);
  const t = useT();
  const h = (key: Parameters<typeof helpText>[1]) => helpText(locale, key);
  const example = useMemo(() => {
    try {
      return { result: tool.calculate({ ...tool.exampleInputs }), error: "" };
    } catch (error) {
      return {
        result: null,
        error: error instanceof Error ? error.message : "Example unavailable.",
      };
    }
  }, [tool]);
  const result = example.result;
  return (
    <div className="help-tool-guide" lang="en">
      <p className="help-summary">{t(tool.description)}</p>
      <h4>{h("steps")}</h4>
      <ol className="help-steps">
        <li>
          Close this guide, open <strong>{t("Engineering Toolbox")}</strong>,
          enter <strong>{tool.id}</strong> in{" "}
          <strong>{t("Search tools")}</strong> and choose{" "}
          <strong>{t(tool.title)}</strong>.
        </li>
        <li>
          Enter the inputs below in their displayed units. For practice, click{" "}
          <strong>{t("Load worked example")}</strong> to fill exactly the
          example values shown here. Review them before using actual
          installation data.
        </li>
        <li>
          Click <strong>{t("Calculate")}</strong>. Read the result, formula,
          status, assumptions and warnings. Changing an input clears the old
          result. <strong>{t("Reset")}</strong> clears the form.
        </li>
        <li>
          Use <strong>{t("Copy result")}</strong> or{" "}
          <strong>{t("Export")}</strong> for a copy. To use a result in the
          current project, choose an available method/target under{" "}
          <strong>{t("Apply to project object")}</strong>, click{" "}
          <strong>{t("Preview application")}</strong>, review, then apply. No
          project changes happen merely by reading this example.
        </li>
      </ol>
      <h4>{h("inputs")}</h4>
      <div className="help-table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">{h("input")}</th>
              <th scope="col">{h("requirement")}</th>
              <th scope="col">{h("exampleValue")}</th>
            </tr>
          </thead>
          <tbody>
            {tool.inputs.map((input) => {
              const value = tool.exampleInputs[input.key];
              const option = input.options?.find(
                (entry) => entry.value === String(value),
              );
              return (
                <tr key={input.key}>
                  <th scope="row">
                    {t(input.label)}
                    {input.unit && <small>{input.unit}</small>}
                  </th>
                  <td>
                    {h(input.required === false ? "optional" : "required")}
                    {input.min !== undefined && (
                      <span> · min {numberFormat(input.min, 8, locale)}</span>
                    )}
                    {input.max !== undefined && (
                      <span> · max {numberFormat(input.max, 8, locale)}</span>
                    )}
                    {input.options && (
                      <p>
                        {input.options
                          .map((entry) => t(entry.label))
                          .join(" / ")}
                      </p>
                    )}
                    {input.hint && <p>{t(input.hint)}</p>}
                  </td>
                  <td>
                    {option
                      ? t(option.label)
                      : value === undefined || value === ""
                        ? h("notSet")
                        : typeof value === "number"
                          ? numberFormat(value, 8, locale)
                          : String(value)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {result ? (
        <>
          <h4>{h("result")}</h4>
          <p>
            <strong>{t("Status")}:</strong> {t(result.status)}. This example is
            calculated from the registry's practice inputs, not your active
            project.
          </p>
          <dl className="help-result-values">
            {result.values.map((value, index) => (
              <div key={index}>
                <dt>{t(value.label)}</dt>
                <dd>
                  {typeof value.value === "number"
                    ? numberFormat(value.value, 8, locale)
                    : t(value.value)}{" "}
                  {value.unit}
                </dd>
              </div>
            ))}
          </dl>
          <h4>{h("formula")}</h4>
          <p className="help-formula">{t(result.formula)}</p>
          {result.warnings.length > 0 && (
            <ul className="help-warnings">
              {result.warnings.map((warning, index) => (
                <li key={index}>{t(warning)}</li>
              ))}
            </ul>
          )}
          <h4>{h("sources")}</h4>
          <ul>
            {result.notes.map((note, index) => (
              <li key={index}>{t(note)}</li>
            ))}
          </ul>
          {result.sources.length > 0 && (
            <ul>
              {result.sources.map((source, index) => (
                <li key={index}>
                  {/^https?:\/\//i.test(source) ? (
                    <a href={source} target="_blank" rel="noreferrer">
                      {source} <ExternalLink size={12} aria-hidden="true" />
                    </a>
                  ) : (
                    source
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <p role="alert">{example.error}</p>
      )}
    </div>
  );
}

export function HelpSupport({ onClose }: { onClose: () => void }) {
  const locale = useContext(LanguageContext);
  const t = useT();
  const h = (key: Parameters<typeof helpText>[1]) => helpText(locale, key);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("start");
  const heading = useRef<HTMLHeadingElement>(null);
  const articleContainer = useRef<HTMLElement>(null);
  const search = query.trim().toLocaleLowerCase();
  const title = (article: HelpArticle) =>
    helpTopicLabels[article.id]
      ? h(helpTopicLabels[article.id])
      : t(article.title);
  const filteredArticles = helpArticles.filter(
    (article) =>
      !search ||
      [
        title(article),
        article.title,
        article.summary,
        ...article.steps,
        ...(article.controls?.flat() ?? []),
        article.example ?? "",
        ...(article.notes ?? []),
      ]
        .join(" ")
        .toLocaleLowerCase()
        .includes(search),
  );
  const filteredTools = tools.filter(
    (tool) =>
      !search ||
      [
        tool.id,
        tool.title,
        t(tool.title),
        tool.category,
        t(tool.category),
        tool.description,
        ...tool.inputs.map((input) => t(input.label)),
      ]
        .join(" ")
        .toLocaleLowerCase()
        .includes(search),
  );
  const article = helpArticles.find((entry) => entry.id === selected);
  const tool = tools.find((entry) => entry.id === selected);
  function select(id: string) {
    setSelected(id);
    articleContainer.current?.scrollTo({ top: 0 });
    requestAnimationFrame(() => heading.current?.focus());
  }
  return (
    <Modal title={h("title")} onClose={onClose} wide>
      <div className="help-support">
        <div className="help-intro">
          <BookOpen size={18} aria-hidden="true" />
          <p>{h("safe")}</p>
        </div>
        {locale !== "en" && (
          <p className="help-language-note">{h("language")}</p>
        )}
        <div className="help-search">
          <Search size={17} aria-hidden="true" />
          <input
            type="search"
            aria-label={h("search")}
            placeholder={h("placeholder")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {query && (
            <button
              className="text-button"
              type="button"
              onClick={() => setQuery("")}
            >
              {h("clear")}
            </button>
          )}
        </div>
        <p className="help-result-count" role="status">
          {filteredArticles.length + filteredTools.length} {h("matches")}
        </p>
        <div className="help-layout">
          <nav className="help-topics" aria-label={h("topics")}>
            <h3>{h("tasks")}</h3>
            {filteredArticles.map((entry) => (
              <button
                type="button"
                key={entry.id}
                aria-current={selected === entry.id ? "page" : undefined}
                onClick={() => select(entry.id)}
              >
                {title(entry)}
              </button>
            ))}
            <h3>
              {h("tools")} <span>{filteredTools.length}</span>
            </h3>
            {filteredTools.map((entry) => (
              <button
                type="button"
                key={entry.id}
                aria-current={selected === entry.id ? "page" : undefined}
                onClick={() => select(entry.id)}
              >
                <span className="help-tool-id">{entry.id}</span> ·{" "}
                {t(entry.title)}
              </button>
            ))}
            {!filteredArticles.length && !filteredTools.length && (
              <p className="help-empty">{h("noResults")}</p>
            )}
          </nav>
          <article
            className="help-content"
            ref={articleContainer}
            aria-labelledby="help-topic-title"
          >
            <h3 id="help-topic-title" ref={heading} tabIndex={-1}>
              {article
                ? title(article)
                : tool
                  ? `${tool.id} · ${t(tool.title)}`
                  : h("title")}
            </h3>
            {article && <TaskGuide article={article} />}
            {tool && <ToolGuide tool={tool} />}
            {selected === "toolbox" && (
              <div className="help-tool-grid">
                {tools.map((entry) => (
                  <button
                    type="button"
                    className="button"
                    key={entry.id}
                    onClick={() => select(entry.id)}
                  >
                    {entry.id} · {t(entry.title)}
                  </button>
                ))}
              </div>
            )}
          </article>
        </div>
        <div className="help-footer">
          <a
            href="https://github.com/HephzibahBehulahHQ/AdigunPowerLab/blob/main/docs/USER_GUIDE.md"
            target="_blank"
            rel="noreferrer"
          >
            {h("fullGuide")} <ExternalLink size={13} aria-hidden="true" />
          </a>
          <a
            href="https://github.com/HephzibahBehulahHQ/AdigunPowerLab/issues"
            target="_blank"
            rel="noreferrer"
          >
            {h("issue")} <ExternalLink size={13} aria-hidden="true" />
          </a>
          <button type="button" className="button primary" onClick={onClose}>
            {h("return")}
          </button>
        </div>
      </div>
    </Modal>
  );
}
