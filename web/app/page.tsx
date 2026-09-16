"use client";

import { useEffect, useMemo, useState } from "react";
import { BriefForm } from "@/components/BriefForm";
import {
  briefFormToPayload,
  DEFAULT_BRIEF_FORM,
  validateBriefForm,
  type BriefFormState,
} from "@/lib/briefForm";
import {
  createRun,
  getEngineHealth,
  getOutputs,
  getRun,
  type EngineHealth,
  type RunOutput,
  type RunStatus,
} from "@/lib/engine";
import styles from "./page.module.css";

export default function HomePage() {
  const [form, setForm] = useState<BriefFormState>(DEFAULT_BRIEF_FORM);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [run, setRun] = useState<RunStatus | null>(null);
  const [outputs, setOutputs] = useState<RunOutput[]>([]);
  const [health, setHealth] = useState<EngineHealth | null>(null);

  useEffect(() => {
    void getEngineHealth()
      .then(setHealth)
      .catch(() => setHealth(null));
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, RunOutput[]>();
    for (const o of outputs) {
      const list = map.get(o.productId) ?? [];
      list.push(o);
      map.set(o.productId, list);
    }
    return [...map.entries()];
  }, [outputs]);

  async function onRun() {
    setError(null);
    setBusy(true);
    setOutputs([]);
    setRun(null);

    try {
      const validationError = validateBriefForm(form);
      if (validationError) throw new Error(validationError);

      const brief = briefFormToPayload(form);
      const { id } = await createRun(brief);
      let status: RunStatus["status"] = "queued";
      let latest: RunStatus | null = null;

      while (status === "queued" || status === "running") {
        await sleep(500);
        latest = await getRun(id);
        setRun(latest);
        status = latest.status;
      }

      if (status === "failed") {
        throw new Error(latest?.error ?? "Run failed");
      }

      const out = await getOutputs(id);
      setOutputs(out.outputs);
      if (latest) setRun({ ...latest, brandReport: out.brandReport ?? latest.brandReport });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <p className={styles.kicker}>Operator console</p>
            <h1>Creative Automation</h1>
          </div>
          <div className={styles.generatorBadge} data-mode={health?.generator ?? "unknown"}>
            {health?.generator === "fal.ai"
              ? `GenAI: fal.ai (${health.model})`
              : health?.generator === "mock"
                ? "GenAI: mock (sharp placeholders)"
                : "Engine offline"}
          </div>
        </div>
        <p className={styles.sub}>
          Build a campaign brief, run the engine over HTTP, review creatives and brand gates.
          Set <code>GENAI_API_KEY</code> in the repo <code>.env</code> to use fal.ai; leave empty for mock.
        </p>
      </header>

      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <h2>Campaign brief</h2>
          <button type="button" className={styles.runBtn} onClick={onRun} disabled={busy}>
            {busy ? "Running…" : "Run"}
          </button>
        </div>
        <BriefForm value={form} onChange={setForm} disabled={busy} />
        {error ? <p className={styles.error}>{error}</p> : null}
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <h2>Run log</h2>
          {run ? (
            <span className={styles.badge} data-status={run.status}>
              {run.status}
              {run.brandReport ? ` · brand ${run.brandReport.ok ? "OK" : "ISSUES"}` : ""}
            </span>
          ) : null}
        </div>
        <pre className={styles.log}>
          {run?.log?.length ? run.log.join("\n") : "No run yet."}
        </pre>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <h2>Gallery</h2>
          <span className={styles.muted}>{outputs.length} creatives</span>
        </div>
        {grouped.length === 0 ? (
          <p className={styles.muted}>Outputs appear here when a run completes.</p>
        ) : (
          grouped.map(([productId, items]) => (
            <div key={productId} className={styles.productBlock}>
              <h3>{productId}</h3>
              <div className={styles.grid}>
                {items.map((item) => (
                  <figure key={`${item.productId}-${item.aspectRatio}`} className={styles.card}>
                    <div className={styles.frame} data-ratio={item.aspectRatio}>
                      {item.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.url} alt={`${item.productId} ${item.aspectRatio}`} />
                      ) : (
                        <span className={styles.muted}>No URL</span>
                      )}
                    </div>
                    <figcaption>
                      <strong>{item.aspectRatio}</strong>
                      {item.brandChecks?.length ? (
                        <span className={styles.muted}>
                          {" "}
                          ·{" "}
                          {item.brandChecks
                            .map((c) => `${c.id}:${c.status}`)
                            .join(" ")}
                        </span>
                      ) : null}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          ))
        )}
      </section>
    </main>
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
