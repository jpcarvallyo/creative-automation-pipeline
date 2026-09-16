import cors from "cors";
import express from "express";
import path from "node:path";
import { runsRouter } from "./routes/runs.js";

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  const storageRoot = process.env.LOCAL_STORAGE_DIR
    ? path.resolve(process.env.LOCAL_STORAGE_DIR)
    : path.resolve("data");

  // Gallery images for the web console (HTTP only — no shared imports).
  app.use("/media", express.static(storageRoot));

  app.get("/health", (_req, res) => {
    const falConfigured = Boolean(process.env.GENAI_API_KEY?.trim());
    const available = falConfigured ? (["mock", "fal.ai"] as const) : (["mock"] as const);
    const generator = falConfigured ? "fal.ai" : "mock";
    res.json({
      ok: true,
      storageRoot,
      generator,
      falConfigured,
      available,
      model: falConfigured ? "fal-ai/flux/schnell" : "sharp-placeholder",
    });
  });

  app.use("/runs", runsRouter);

  return app;
}
