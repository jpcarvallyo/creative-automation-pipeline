import { Router } from "express";
import { randomUUID } from "node:crypto";
import { CampaignBriefSchema } from "../types.js";
import { enqueueRun } from "../jobs/runner.js";
import { getJob, putJob } from "../jobs/store.js";
import { toMediaUrl } from "../mediaUrl.js";
import type { RunJob } from "../types.js";

export const runsRouter = Router();

runsRouter.post("/", (req, res) => {
  const parsed = CampaignBriefSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid campaign brief",
      details: parsed.error.flatten(),
    });
    return;
  }

  const now = new Date().toISOString();
  const job: RunJob = {
    id: randomUUID(),
    status: "queued",
    brief: parsed.data,
    createdAt: now,
    updatedAt: now,
    log: [`[${now}] Job queued`],
    outputs: [],
  };

  putJob(job);
  enqueueRun(job.id);

  res.status(202).json({ id: job.id });
});

runsRouter.get("/:id", (req, res) => {
  const job = getJob(req.params.id);
  if (!job) {
    res.status(404).json({ error: "Run not found" });
    return;
  }

  res.json({
    id: job.id,
    status: job.status,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    log: job.log,
    error: job.error,
    campaignName: job.brief.campaignName,
    brandReport: job.brandReport,
  });
});

runsRouter.get("/:id/outputs", (req, res) => {
  const job = getJob(req.params.id);
  if (!job) {
    res.status(404).json({ error: "Run not found" });
    return;
  }

  res.json({
    id: job.id,
    status: job.status,
    brandReport: job.brandReport,
    outputs: job.outputs.map((o) => ({
      ...o,
      url: toMediaUrl(o.path),
    })),
  });
});
