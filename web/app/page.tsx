"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  const [logOpen, setLogOpen] = useState(false);
  const runGeneration = useRef(0);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;

    async function loadHealth() {
      try {
        const h = await getEngineHealth();
        if (!cancelled) setHealth(h);
      } catch {
        attempts += 1;
        if (!cancelled && attempts < 5) {
          window.setTimeout(() => {
            void loadHealth();
          }, 600 * attempts);
        } else if (!cancelled) {
          setHealth(null);
        }
      }
    }

    void loadHealth();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (busy) setLogOpen(true);
  }, [busy]);

  const grouped = useMemo(() => {
    const map = new Map<string, RunOutput[]>();
    for (const o of outputs) {
      const list = map.get(o.productId) ?? [];
      list.push(o);
      map.set(o.productId, list);
    }
    return [...map.entries()];
  }, [outputs]);

  const generatorLabel =
    health?.generator === "fal.ai"
      ? `fal.ai · ${health.model ?? "flux"}`
      : health?.generator === "mock"
        ? "mock · sharp"
        : "engine offline";

  async function onRun() {
    const generation = ++runGeneration.current;
    setError(null);
    setBusy(true);
    setOutputs([]);
    setRun(null);

    try {
      const validationError = validateBriefForm(form);
      if (validationError) throw new Error(validationError);

      const brief = briefFormToPayload(form);
      const { id } = await createRun(brief);
      if (generation !== runGeneration.current) return;

      let status: RunStatus["status"] = "queued";
      let latest: RunStatus | null = null;

      while (status === "queued" || status === "running") {
        await sleep(500);
        if (generation !== runGeneration.current) return;
        latest = await getRun(id);
        if (generation !== runGeneration.current) return;
        setRun(latest);
        status = latest.status;
      }

      if (status === "failed") {
        throw new Error(latest?.error ?? "Run failed");
      }

      const out = await getOutputs(id);
      if (generation !== runGeneration.current) return;
      setOutputs(out.outputs);
      if (latest) {
        setRun({ ...latest, brandReport: out.brandReport ?? latest.brandReport });
      }
    } catch (err) {
      if (generation !== runGeneration.current) return;
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      if (generation === runGeneration.current) setBusy(false);
    }
  }

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.brandBlock}>
          <h1 className={styles.brand}>Creative Automation</h1>
          <p className={styles.tagline}>
            Brief in. Localized social creatives out — with brand gates you can actually explain.
          </p>
        </div>
        <div className={styles.statusCluster}>
          <p className={styles.statusLabel}>Generator</p>
          <p
            className={styles.statusValue}
            data-mode={busy ? "running" : (health?.generator ?? "unknown")}
          >
            {busy ? "running pipeline…" : generatorLabel}
          </p>
        </div>
      </header>

      <div className={styles.workspace}>
        <aside className={styles.rail}>
          <div className={styles.railHead}>
            <h2>Campaign brief</h2>
            <p>Shape the run. One hero per product, three ratios, brand checks on the way out.</p>
          </div>

          <BriefForm value={form} onChange={setForm} disabled={busy} />

          <div className={styles.railActions}>
            {error ? <p className={styles.error}>{error}</p> : null}
            <button type="button" className={styles.runBtn} onClick={onRun} disabled={busy}>
              {busy ? "Generating…" : "Run pipeline"}
            </button>
          </div>
        </aside>

        <section className={styles.stage}>
          <div className={styles.stageHead}>
            <h2>Creative stage</h2>
            <span className={styles.meta}>
              {outputs.length
                ? `${outputs.length} creatives · ${grouped.length} products`
                : "No outputs yet"}
              {run?.brandReport
                ? ` · brand ${run.brandReport.ok ? "clear" : "flagged"}`
                : ""}
            </span>
          </div>

          <details
            className={styles.logPanel}
            open={logOpen}
            onToggle={(e) => setLogOpen((e.target as HTMLDetailsElement).open)}
          >
            <summary>
              <span>Run log</span>
              <span className={styles.logBadge} data-status={run?.status ?? "idle"}>
                {run
                  ? `${run.status}${run.brandReport ? ` · brand ${run.brandReport.ok ? "OK" : "ISSUES"}` : ""}`
                  : "idle"}
              </span>
            </summary>
            <pre className={styles.log}>
              {run?.log?.length ? run.log.join("\n") : "Start a run to stream engine events here."}
            </pre>
          </details>

          <div className={styles.gallery}>
            {grouped.length === 0 ? (
              <div className={styles.empty}>
                <p className={styles.emptyTitle}>Awaiting a run</p>
                <p className={styles.emptyCopy}>
                  Hit Run pipeline and this stage fills with 1:1, 9:16, and 16:9 creatives —
                  fal.ai when your key is live, sharp mock when it isn’t.
                </p>
              </div>
            ) : (
              grouped.map(([productId, items]) => (
                <div key={productId} className={styles.productBlock}>
                  <h3>{productId}</h3>
                  <div className={styles.grid}>
                    {items.map((item) => (
                      <figure
                        key={`${item.productId}-${item.aspectRatio}`}
                        className={styles.card}
                        data-ratio={item.aspectRatio}
                      >
                        <div className={styles.frame}>
                          {item.url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.url} alt={`${item.productId} ${item.aspectRatio}`} />
                          ) : (
                            <span className={styles.meta}>No URL</span>
                          )}
                        </div>
                        <figcaption>
                          <strong>{item.aspectRatio}</strong>
                          {item.brandChecks?.length ? (
                            <span className={styles.checks}>
                              {item.brandChecks.map((c) => `${c.id}:${c.status}`).join(" · ")}
                            </span>
                          ) : null}
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
