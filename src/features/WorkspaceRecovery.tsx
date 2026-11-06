import { useEffect, useRef, useState } from "react";
import { Download, FolderOpen, ShieldCheck } from "lucide-react";
import type { Project } from "../domain/types";
import { useT } from "../i18n";
import { downloadFile } from "../import-export/files";
import {
  workspaceBackupBlob,
  type ArchivePreview,
} from "../import-export/archive";
import {
  collectWorkspaceBackup,
  previewWorkspaceBackup,
  restoreWorkspaceBackup,
} from "../storage/archive";
import { listProjects } from "../storage/projects";
import type { ProjectSession } from "../storage/projectSession";
import { Field } from "./ui";

export function WorkspaceRecovery({
  activeProject,
  activeSession,
  onRestored,
}: {
  activeProject: Project;
  activeSession?: ProjectSession;
  onRestored?: (result: {
    idMap: Record<string, string>;
    restoredIds: string[];
    activeIds: string[];
  }) => void | Promise<void>;
}) {
  const t = useT(),
    input = useRef<HTMLInputElement>(null),
    operation = useRef(0);
  const [scope, setScope] = useState<"all" | "current">("all"),
    [history, setHistory] = useState(true),
    [preview, setPreview] = useState<ArchivePreview | null>(null),
    [filename, setFilename] = useState(""),
    [mode, setMode] = useState<"copies" | "preserve-if-absent">("copies"),
    [drafts, setDrafts] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    let live = true;
    void listProjects(true)
      .then((rows) => {
        if (live) setCount(rows.length);
      })
      .catch(() => {
        if (live) setCount(null);
      });
    return () => {
      live = false;
      operation.current++;
    };
  }, [activeProject.id]);
  async function backup() {
    const ticket = ++operation.current;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const archive = await collectWorkspaceBackup({
        activeProject: structuredClone(activeProject),
        activeSession: activeSession
          ? structuredClone(activeSession)
          : undefined,
        projectIds: scope === "current" ? [activeProject.id] : undefined,
        includeHistory: history,
      });
      if (ticket !== operation.current) return;
      downloadFile(
        `AdigunPowerLab-workspace-${archive.exportedAt.slice(0, 10)}.powerlab-backup.json`,
        workspaceBackupBlob(archive),
      );
      setMessage(
        t(
          "Workspace backup generated. Keep this file outside browser storage.",
        ),
      );
    } catch (cause) {
      if (ticket === operation.current) setError(t((cause as Error).message));
    } finally {
      if (ticket === operation.current) setBusy(false);
    }
  }
  async function inspect(file: File) {
    const ticket = ++operation.current;
    setBusy(true);
    setError("");
    setMessage("");
    setPreview(null);
    setFilename(file.name);
    try {
      const result = await previewWorkspaceBackup(file);
      if (ticket === operation.current) {
        setPreview(result);
        setMode("copies");
      }
    } catch (cause) {
      if (ticket === operation.current) setError(t((cause as Error).message));
    } finally {
      if (ticket === operation.current) setBusy(false);
    }
  }
  async function restore() {
    if (!preview?.valid) return;
    const ticket = ++operation.current;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await restoreWorkspaceBackup(preview, {
        mode,
        useWorkingDrafts: drafts,
      });
      if (ticket !== operation.current) return;
      setPreview(null);
      setCount((await listProjects(true)).length);
      setMessage(t("Workspace restored. Existing projects were preserved."));
      await onRestored?.(result);
    } catch (cause) {
      if (ticket === operation.current) setError(t((cause as Error).message));
    } finally {
      if (ticket === operation.current) setBusy(false);
    }
  }
  return (
    <section
      className="panel panel-pad workspace-recovery"
      aria-labelledby="workspace-backup-title"
    >
      <div className="panel-head">
        <div>
          <span className="eyebrow">{t("Portable recovery")}</span>
          <h2 id="workspace-backup-title">{t("Workspace backup & restore")}</h2>
        </div>
        <ShieldCheck aria-hidden="true" size={24} />
      </div>
      <p className="muted">
        {t(
          "One file preserves projects, scenarios, saved revisions, customer bills and measured datasets. Local browser storage is not a remote backup.",
        )}
      </p>
      <div className="form-grid">
        <Field label={t("Backup scope")}>
          <select
            value={scope}
            onChange={(event) => setScope(event.target.value as typeof scope)}
            disabled={busy}
          >
            <option value="all">
              {t("All local projects")}
              {count !== null ? ` (${count})` : ""}
            </option>
            <option value="current">
              {t("Current project and linked baselines")}
            </option>
          </select>
        </Field>
        <label className="check-row">
          <input
            type="checkbox"
            checked={history}
            onChange={(event) => setHistory(event.target.checked)}
            disabled={busy}
          />
          {t("Include saved revision history")}
        </label>
      </div>
      <p className="small muted">
        {t(
          "Includes the current engineering draft and open billing drafts. Preview and save measured-data drafts before making the backup.",
        )}
      </p>
      <div className="button-row">
        <button
          className="button primary"
          onClick={() => void backup()}
          disabled={busy}
        >
          <Download size={16} />
          {t("Export workspace backup")}
        </button>
        <button
          className="button"
          onClick={() => input.current?.click()}
          disabled={busy}
        >
          <FolderOpen size={16} />
          {t("Inspect workspace backup")}
        </button>
        <input
          ref={input}
          type="file"
          accept=".json"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) void inspect(file);
          }}
        />
      </div>
      {busy && <p role="status">{t("Processing workspace backup…")}</p>}
      {message && <p role="status">{message}</p>}
      {error && (
        <p className="error-text" role="alert">
          {error}
        </p>
      )}
      {preview && (
        <section
          className="archive-review"
          aria-label={t("Backup restore preview")}
        >
          <h3>
            {t("Backup restore preview")}: {filename}
          </h3>
          {!preview.valid ? (
            <ul role="alert">
              {preview.errors.map((item, index) => (
                <li key={index}>{t(item)}</li>
              ))}
            </ul>
          ) : (
            <>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>{t("Project")}</th>
                      <th>{t("Revision")}</th>
                      <th>{t("History")}</th>
                      <th>{t("Customer bill")}</th>
                      <th>{t("Measured intervals")}</th>
                      <th>{t("Status")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.archive!.projects.map((row) => (
                      <tr key={row.project.id}>
                        <td>{row.project.name}</td>
                        <td>{row.project.revision}</td>
                        <td>{row.history.length}</td>
                        <td>{t(row.bill ? "Included" : "Not included")}</td>
                        <td>
                          {row.measurements?.filename ?? t("Not included")}
                        </td>
                        <td>
                          {t(
                            row.deleted
                              ? "In trash"
                              : row.workingDraft
                                ? "Working draft included"
                                : "Saved project",
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {preview.warnings.length > 0 && (
                <ul>
                  {preview.warnings.map((item, index) => (
                    <li key={index}>{t(item)}</li>
                  ))}
                </ul>
              )}
              <Field label={t("Restore mode")}>
                <select
                  value={mode}
                  onChange={(event) =>
                    setMode(event.target.value as typeof mode)
                  }
                  disabled={busy}
                >
                  <option value="copies">
                    {t("Restore as independent copies")}
                  </option>
                  <option
                    value="preserve-if-absent"
                    disabled={preview.collisions.length > 0}
                  >
                    {t("Preserve project IDs when absent")}
                  </option>
                </select>
              </Field>
              {preview.counts.workingDrafts > 0 && (
                <label className="check-row">
                  <input
                    type="checkbox"
                    checked={drafts}
                    onChange={(event) => setDrafts(event.target.checked)}
                    disabled={busy}
                  />
                  {t("Restore included working drafts as the latest revision")}
                </label>
              )}
              <p className="muted">
                {t(
                  "Restore creates new records in one transaction. Existing IDs, trash records and other tabs are never silently overwritten.",
                )}
              </p>
              <div className="button-row">
                <button
                  className="button primary"
                  disabled={
                    busy ||
                    (!preview.counts.projects &&
                      !preview.counts.recoveryRecords)
                  }
                  onClick={() => void restore()}
                >
                  {t("Restore reviewed backup")}
                </button>
                <button
                  className="button"
                  disabled={busy}
                  onClick={() => setPreview(null)}
                >
                  {t("Cancel")}
                </button>
              </div>
            </>
          )}
        </section>
      )}
    </section>
  );
}
