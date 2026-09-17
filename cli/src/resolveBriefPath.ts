import { access } from "node:fs/promises";
import path from "node:path";

/**
 * Resolve a brief path from CLI arg or default example.
 * Tries cwd first, then repo root — npm -w runs with package cwd.
 */
export async function resolveBriefPath(
  arg: string | undefined,
  options: { cwd: string; repoRoot: string },
): Promise<string> {
  const candidates = arg
    ? [path.resolve(options.cwd, arg), path.resolve(options.repoRoot, arg)]
    : [path.resolve(options.repoRoot, "examples/brief.json")];

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
