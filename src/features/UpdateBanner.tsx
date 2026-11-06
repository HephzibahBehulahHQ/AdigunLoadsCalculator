import { useContext, useEffect, useRef, useState } from "react";
import { LanguageContext, useT, type Locale } from "../i18n";
import { liveDrafts } from "../storage/billing";
import {
  activateWaitingWorker,
  observeUpdates,
  registerUpdateGuard,
  updateBlockers,
} from "../pwa/updates";
import { useReloadProtection } from "../pwa/useUpdateGuard";

const messages: Record<
  Locale,
  { finish: string; retry: string; changed: string; saving: string }
> = {
  en: {
    finish: "Save or finish these entries before updating:",
    retry:
      "The update could not finish. Your saved project is safe; retry when the update is available.",
    changed:
      "The project changed while saving. Review your changes and retry the update.",
    saving: "Saving before update…",
  },
  de: {
    finish: "Diese Eingaben vor der Aktualisierung speichern oder abschließen:",
    retry:
      "Die Aktualisierung konnte nicht abgeschlossen werden. Das gespeicherte Projekt bleibt erhalten; bei verfügbarer Aktualisierung erneut versuchen.",
    changed:
      "Das Projekt wurde während des Speicherns geändert. Änderungen prüfen und die Aktualisierung erneut versuchen.",
    saving: "Speichern vor der Aktualisierung…",
  },
  yo: {
    finish: "Fi àwọn àkọsílẹ̀ wọ̀nyí pamọ́ tàbí parí wọn kí o tó ṣe àtúnṣe:",
    retry:
      "Àtúnṣe kò parí. Iṣẹ́ tí o fi pamọ́ wà láìléwu; tún gbìyànjú nígbà tí àtúnṣe bá wà.",
    changed:
      "Iṣẹ́ náà yí padà nígbà fífi pamọ́. Ṣàyẹ̀wò àyípadà rẹ kí o tún gbìyànjú.",
    saving: "Ń fi pamọ́ ṣáájú àtúnṣe…",
  },
  pcm: {
    finish: "Save or finish these entries before you update:",
    retry:
      "Update no finish. Your saved project still dey safe; try again when update dey available.",
    changed:
      "Project change as e dey save. Check your changes and try update again.",
    saving: "E dey save before update…",
  },
};

export function UpdateBanner({
  save,
  version,
}: {
  save: () => Promise<void>;
  version: string;
}) {
  const t = useT(),
    locale = useContext(LanguageContext),
    u = messages[locale];
  const [registration, setRegistration] = useState<ServiceWorkerRegistration>();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const current = useRef(version);
  current.current = version;
  useReloadProtection();
  useEffect(
    () =>
      registerUpdateGuard(() =>
        [...liveDrafts.values()].some((draft) => draft.dirty)
          ? t("Customer bill")
          : undefined,
      ),
    [t],
  );
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    let alive = true,
      cleanup = () => {};
    navigator.serviceWorker.ready
      .then((ready) => {
        if (alive)
          cleanup = observeUpdates(ready, (next) => setRegistration(next));
      })
      .catch(() => {});
    return () => {
      alive = false;
      cleanup();
    };
  }, []);
  if (!registration) return null;
  async function update() {
    const blockers = updateBlockers();
    if (document.querySelector('[role="dialog"][aria-modal="true"]'))
      blockers.push(t("Close"));
    if (blockers.length) {
      setError(`${u.finish} ${blockers.join(", ")}`);
      return;
    }
    setBusy(true);
    setError("");
    const beforeSave = current.current;
    try {
      await save();
      const pending = updateBlockers();
      if (pending.length) {
        setError(`${u.finish} ${pending.join(", ")}`);
        return;
      }
      if (current.current !== beforeSave) {
        setError(u.changed);
        return;
      }
      await activateWaitingWorker(registration!, navigator.serviceWorker);
      location.reload();
    } catch {
      setError(u.retry);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="update-banner">
      <span>{t("Update available")}</span>
      <button className="button" disabled={busy} onClick={() => void update()}>
        {busy ? u.saving : t("Save and reload")}
      </button>
      {error && <span role="alert">{error}</span>}
    </div>
  );
}
