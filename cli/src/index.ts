#!/usr/bin/env node
/**
 * Thin HTTP client — never imports engine code.
 *
 * Usage: npm run cli -- [path/to/brief.json]
 */
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ENGINE_URL = (process.env.ENGINE_URL ?? "http://localhost:3001").replace(/\/$/, "");
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

async function main(): Promise<void> {
  const briefPath = await resolveBriefPath(process.argv[2]);
  const brief = JSON.parse(await readFile(briefPath, "utf8"));

  console.log(`Submitting brief → ${ENGINE_URL}/runs`);
  const createRes = await fetch(`${ENGINE_URL}/runs`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(brief),
  });
  const createBody = (await createRes.json()) as { id?: string; error?: string };
  if (!createRes.ok || !createBody.id) {
    console.error("Failed to create run:", createBody);
    process.exit(1);
  }

  const id = createBody.id;
  console.log(`Run id: ${id}`);

  let status = "queued";
  while (status === "queued" || status === "running") {
    await sleep(400);
    const pollRes = await fetch(`${ENGINE_URL}/runs/${id}`);
    const poll = (await pollRes.json()) as {
      status: string;
      log: string[];
      error?: string;
    };
    status = poll.status;
    const latest = poll.log[poll.log.length - 1];
    if (latest) console.log(latest);
    if (status === "failed") {
      console.error("Run failed:", poll.error ?? poll.log.join("\n"));
      process.exit(1);
    }
  }

  const outRes = await fetch(`${ENGINE_URL}/runs/${id}/outputs`);
  const outBody = (await outRes.json()) as {
    status: string;
    outputs: { productId: string; aspectRatio: string; path: string }[];
  };

  console.log("\nOutputs:");
  for (const o of outBody.outputs) {
    console.log(`  ${o.productId}  ${o.aspectRatio}  →  ${o.path}`);
  }
}

async function resolveBriefPath(arg: string | undefined): Promise<string> {
  const candidates = arg
    ? [path.resolve(process.cwd(), arg), path.resolve(REPO_ROOT, arg)]
    : [path.resolve(REPO_ROOT, "examples/brief.json")];

  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      /* try next */
    }
  }
  throw new Error(`Brief not found. Tried: ${candidates.join(", ")}`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
