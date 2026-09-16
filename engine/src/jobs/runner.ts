import { createAssetStorage } from "storage";
import { appendLog, getJob, updateJob } from "./store.js";
import { runPipeline } from "../pipeline/index.js";

export function enqueueRun(jobId: string): void {
  setImmediate(() => {
    void runJob(jobId);
  });
}

async function runJob(jobId: string): Promise<void> {
  const job = getJob(jobId);
  if (!job) return;

  updateJob(jobId, { status: "running" });
  appendLog(jobId, "Job started");

  try {
    const storage = createAssetStorage();
    const outputs = await runPipeline(jobId, job.brief, {
      storage,
      log: (line) => appendLog(jobId, line),
    });

    appendLog(jobId, "Brand checks deferred to stage 3");
    updateJob(jobId, { status: "done", outputs });
    appendLog(jobId, "Job done");
  } catch (err) {
    const message = formatError(err);
    updateJob(jobId, { status: "failed", error: message });
    appendLog(jobId, `Job failed: ${message}`);
  }
}

function formatError(err: unknown): string {
  if (!(err instanceof Error)) return String(err);
  const anyErr = err as Error & { status?: number; body?: unknown };
  const parts = [err.message || err.name || "Error"];
  if (anyErr.status) parts.push(`status=${anyErr.status}`);
  if (anyErr.body !== undefined) {
    parts.push(
      typeof anyErr.body === "string" ? anyErr.body : JSON.stringify(anyErr.body),
    );
  }
  return parts.filter(Boolean).join(" — ");
}
