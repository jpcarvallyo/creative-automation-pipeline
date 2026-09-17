"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BriefForm } from "@/components/BriefForm";
import { ModelPicker } from "@/components/ModelPicker";
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
import type { HeroModelId } from "@/lib/models";
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
        if (cancelled) return;
        setHealth(h);
        setForm((prev) => {
          const falOk = h.falConfigured ?? h.generator === "fal.ai";
          if (prev.generator === "fal.ai" && !falOk) {
            return { ...prev, generator: "mock" };
          }
          if (prev.generator === "fal.ai" || prev.generator === "mock") return prev;
          return { ...prev, generator: falOk ? "fal.ai" : "mock" };
        });
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

  const grouped = useMemo(() => {
    const map = new Map<string, RunOutput[]>();
    for (const o of outputs) {
      const list = map.get(o.productId) ?? [];
      list.push(o);
      map.set(o.productId, list);
    }
    return [...map.entries()];
  }, [outputs]);

  const falAvailable = Boolean(health?.falConfigured ?? health?.generator === "fal.ai");
  const engineOnline = Boolean(health?.ok);

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
          <p className={styles.statusLabel}>Engine</p>
          <p
            className={styles.statusValue}
            data-mode={busy ? "running" : engineOnline ? "online" : "unknown"}
          >
            {busy
              ? "running pipeline…"
              : engineOnline
                ? falAvailable
                  ? "online · fal ready"
                  : "online · mock only"
                : "offline"}
          </p>
        </div>
      </header>

      <div className={styles.workspace}>
        <aside className={styles.rail}>
          <div className={styles.railHead}>
            <h2>Campaign brief</h2>
            <p>Shape the run. One hero per product, three ratios, brand checks on the way out.</p>
          </div>

          <div className={styles.railBody}>
            <BriefForm value={form} onChange={setForm} disabled={busy} />
          </div>

          <div className={styles.railActions}>
            <ModelPicker
              value={form.generator}
              falAvailable={falAvailable}
              disabled={busy}
              onChange={(id: HeroModelId) => setForm((f) => ({ ...f, generator: id }))}
            />
            {error ? <p className={styles.error}>{error}</p> : null}
            <button type="button" className={styles.runBtn} onClick={onRun} disabled={busy}>
              {busy ? "Generating…" : "Run pipeline"}
            </button>
          </div>
        </aside>

        <section className={styles.stage}>
          <div className={styles.stageHead}>
            <div className={styles.stageHeadText}>
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

            <div className={styles.logAnchor}>
              <button
                type="button"
                className={styles.logBtn}
                aria-expanded={logOpen}
                aria-controls="run-log-panel"
                title="Run log"
                onClick={() => setLogOpen((v) => !v)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M4 5h16v2H4V5zm0 6h16v2H4v-2zm0 6h10v2H4v-2z"
                  />
                </svg>
                <span
                  className={styles.logDot}
                  data-status={busy ? "running" : (run?.status ?? "idle")}
                />
                <span className={styles.srOnly}>Run log</span>
              </button>

              {logOpen ? (
                <div id="run-log-panel" className={styles.logPopover} role="dialog" aria-label="Run log">
                  <div className={styles.logPopoverHead}>
                    <strong>Run log</strong>
                    <span className={styles.logBadge} data-status={run?.status ?? "idle"}>
                      {busy
                        ? "running"
                        : run
                          ? `${run.status}${run.brandReport ? ` · brand ${run.brandReport.ok ? "OK" : "ISSUES"}` : ""}`
                          : "idle"}
                    </span>
                    <button
                      type="button"
                      className={styles.logClose}
                      onClick={() => setLogOpen(false)}
                    >
                      Close
                    </button>
                  </div>
                  <pre className={styles.log}>
                    {run?.log?.length
                      ? run.log.join("\n")
                      : "Start a run to stream engine events here."}
                  </pre>
                </div>
              ) : null}
            </div>
          </div>

          <div className={styles.gallery}>
            {grouped.length === 0 ? (
              <div className={styles.empty}>
                <p className={styles.emptyTitle}>Awaiting a run</p>
                <p className={styles.emptyCopy}>
                  Hit Run pipeline and this stage fills with 1:1, 9:16, and 16:9 creatives —
                  pick fal.ai or Local mock above the run button.
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
