import type { RunJob } from "../types.js";

/** In-memory job store — POC only; lost on process restart. */
const jobs = new Map<string, RunJob>();

export function putJob(job: RunJob): void {
  jobs.set(job.id, job);
}

export function getJob(id: string): RunJob | undefined {
  return jobs.get(id);
}

export function updateJob(
  id: string,
  patch: Partial<Omit<RunJob, "id" | "brief" | "createdAt">>,
): RunJob | undefined {
  const existing = jobs.get(id);
  if (!existing) return undefined;
  const next: RunJob = {
    ...existing,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  jobs.set(id, next);
  return next;
}

export function appendLog(id: string, line: string): void {
  const job = jobs.get(id);
  if (!job) return;
  job.log.push(`[${new Date().toISOString()}] ${line}`);
  job.updatedAt = new Date().toISOString();
}
