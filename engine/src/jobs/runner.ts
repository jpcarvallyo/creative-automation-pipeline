import { appendLog, getJob, updateJob } from "./store.js";
import type { RunOutput } from "../types.js";

/**
 * Stage 1 stub: advances job status and writes placeholder log/outputs.
 * Real pipeline (gen → sharp → brand → storage) lands in stage 2–3.
 */
export function enqueueRun(jobId: string): void {
  setImmediate(() => {
    void runStub(jobId);
  });
}

async function runStub(jobId: string): Promise<void> {
  const job = getJob(jobId);
  if (!job) return;

  updateJob(jobId, { status: "running" });
  appendLog(jobId, "Job started (stub pipeline)");

  try {
    const outputs: RunOutput[] = [];
    const ratios = ["1:1", "9:16", "16:9"] as const;

    for (const product of job.brief.products) {
      appendLog(jobId, `Product ${product.id}: resolve/generate hero (stub)`);
      await sleep(50);

      for (const aspectRatio of ratios) {
        const path = `stub://${jobId}/${product.id}/${aspectRatio.replace(":", "x")}.png`;
        outputs.push({ productId: product.id, aspectRatio, path });
        appendLog(jobId, `Derived ${aspectRatio} for ${product.id} → ${path}`);
        await sleep(20);
      }
    }

    appendLog(jobId, "Brand checks skipped in stage 1 stub");
    updateJob(jobId, { status: "done", outputs });
    appendLog(jobId, "Job done");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    updateJob(jobId, { status: "failed", error: message });
    appendLog(jobId, `Job failed: ${message}`);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
