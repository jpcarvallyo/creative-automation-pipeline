"use client";

import { useMemo, useState } from "react";
import {
  createRun,
  getOutputs,
  getRun,
  type RunOutput,
  type RunStatus,
} from "@/lib/engine";
import { defaultBrief } from "@/lib/defaultBrief";

export function OperatorConsole() {
  const [briefText, setBriefText] = useState(() =>
    JSON.stringify(defaultBrief, null, 2),
  );
  const [run, setRun] = useState<RunStatus | null>(null);
  const [outputs, setOutputs] = useState<RunOutput[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      let brief: unknown;
      try {
        brief = JSON.parse(briefText);
      } catch {
        throw new Error("Brief must be valid JSON");
      }

      const { id } = await createRun(brief);
      let status: RunStatus["status"] = "queued";
      let latest: RunStatus | null = null;

      while (status === "queued" || status === "running") {
        await sleep(500);
        latest = await getRun(id);
        setRun({ ...latest });
        status = latest.status;
      }

      if (status === "failed") {
        setError(latest?.error ?? "Run failed");
        return;
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
    <main className="page">
      <header className="header">
        <div>
          <p className="eyebrow">Creative Automation</p>
          <h1>Operator console</h1>
          <p className="sub">
            Submit a campaign brief to the engine over HTTP. Gallery and logs poll the job API.
          </p>
        </div>
        <button className="run" type="button" onClick={onRun} disabled={busy}>
          {busy ? "Running…" : "Run"}
        </button>
      </header>

      {error ? <p className="error">{error}</p> : null}

      <section className="panel">
        <h2>Campaign brief (JSON)</h2>
        <textarea
          className="brief"
          value={briefText}
          onChange={(e) => setBriefText(e.target.value)}
          spellCheck={false}
          rows={22}
        />
      </section>

      <section className="panel">
        <h2>
          Run log{" "}
          {run ? (
            <span className={`pill status-${run.status}`}>{run.status}</span>
          ) : null}
        </h2>
        {run?.brandReport ? (
          <p className="brand">
            Brand report:{" "}
            <strong>{run.brandReport.ok ? "OK" : "ISSUES"}</strong>
          </p>
        ) : null}
        <pre className="log">{run?.log?.join("\n") || "No run yet."}</pre>
      </section>

      <section className="panel">
        <h2>Gallery</h2>
        {grouped.length === 0 ? (
          <p className="muted">Outputs appear here when a run completes.</p>
        ) : (
          grouped.map(([productId, items]) => (
            <div key={productId} className="product-block">
              <h3>{productId}</h3>
              <div className="grid">
                {items.map((item) => (
                  <figure key={`${item.productId}-${item.aspectRatio}`} className="tile">
                    {item.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.url} alt={`${item.productId} ${item.aspectRatio}`} />
                    ) : (
                      <div className="missing">No URL</div>
                    )}
                    <figcaption>{item.aspectRatio}</figcaption>
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
