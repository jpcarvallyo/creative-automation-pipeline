import path from "node:path";
import { fileURLToPath } from "node:url";

/** Monorepo root — npm workspace scripts run with package cwd. */
export const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

export function resolveRepoPath(maybeRelative: string): string {
  if (path.isAbsolute(maybeRelative)) return maybeRelative;
  return path.resolve(REPO_ROOT, maybeRelative);
}
