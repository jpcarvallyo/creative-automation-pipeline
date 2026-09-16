import path from "node:path";
import dotenv from "dotenv";
import { REPO_ROOT } from "./paths.js";

dotenv.config({ path: path.join(REPO_ROOT, ".env") });

// Resolve storage relative to repo root (npm -w runs with package cwd).
if (!process.env.LOCAL_STORAGE_DIR) {
  process.env.LOCAL_STORAGE_DIR = path.join(REPO_ROOT, "data");
} else if (!path.isAbsolute(process.env.LOCAL_STORAGE_DIR)) {
  process.env.LOCAL_STORAGE_DIR = path.resolve(REPO_ROOT, process.env.LOCAL_STORAGE_DIR);
}

import { createApp } from "./server.js";

const port = Number(process.env.PORT ?? 3001);
const app = createApp();

app.listen(port, () => {
  const mode = process.env.GENAI_API_KEY?.trim() ? "fal.ai" : "mock";
  console.log(`engine listening on http://localhost:${port} (generator=${mode})`);
  console.log(`storage root: ${process.env.LOCAL_STORAGE_DIR}`);
});
