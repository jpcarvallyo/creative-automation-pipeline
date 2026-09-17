#!/usr/bin/env node
/**
 * Thin HTTP client — never imports engine code.
 *
 * Usage: npm run cli -- [path/to/brief.json]
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { formatBrandSummary } from "./brandSummary.js";
import { resolveBriefPath } from "./resolveBriefPath.js";
import { runCampaign } from "./runCampaign.js";

const ENGINE_URL = (process.env.ENGINE_URL ?? "http://localhost:3001").replace(/\/$/, "");
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

async function main(): Promise<void> {
  const briefPath = await resolveBriefPath(process.argv[2], {
    cwd: process.cwd(),
    repoRoot: REPO_ROOT,
  });
  const brief = JSON.parse(await readFile(briefPath, "utf8"));

  const result = await runCampaign(brief, {
    engineUrl: ENGINE_URL,
    fetch,
    log: (line) => console.log(line),
  });

  console.log("\nOutputs:");
  for (const o of result.outputs) {
    console.log(`  ${o.productId}  ${o.aspectRatio}  →  ${o.path}`);
  }

  if (result.brandReport) {
    console.log("");
    for (const line of formatBrandSummary(result.brandReport)) {
      console.log(line);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
