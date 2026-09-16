import cors from "cors";
import express from "express";
import { runsRouter } from "./routes/runs.js";

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/runs", runsRouter);

  return app;
}
