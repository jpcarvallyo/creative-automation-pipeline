import assert from "node:assert/strict";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, describe, it } from "node:test";
import { resolveBriefPath } from "./resolveBriefPath.js";

describe("resolveBriefPath", () => {
  let dir = "";

  after(async () => {
    if (dir) await rm(dir, { recursive: true, force: true });
  });

  it("resolves an absolute-ish path from cwd", async () => {
    dir = await mkdtemp(path.join(tmpdir(), "cap-cli-"));
    const brief = path.join(dir, "brief.json");
    await writeFile(brief, "{}");
    const resolved = await resolveBriefPath("brief.json", {
      cwd: dir,
      repoRoot: path.join(dir, "repo"),
    });
    assert.equal(resolved, brief);
  });

  it("falls back to repo root when cwd miss", async () => {
    dir = await mkdtemp(path.join(tmpdir(), "cap-cli-"));
    const { mkdir } = await import("node:fs/promises");
    const repoRoot = path.join(dir, "repo");
    const cwd = path.join(dir, "elsewhere");
    await mkdir(cwd, { recursive: true });
    await mkdir(path.join(repoRoot, "examples"), { recursive: true });
    const brief = path.join(repoRoot, "examples", "brief.json");
    await writeFile(brief, "{}");

    const resolved = await resolveBriefPath("examples/brief.json", {
      cwd,
      repoRoot,
    });
    assert.equal(resolved, brief);
  });

  it("defaults to examples/brief.json under repo root", async () => {
    dir = await mkdtemp(path.join(tmpdir(), "cap-cli-"));
    const repoRoot = path.join(dir, "repo");
    const { mkdir } = await import("node:fs/promises");
    await mkdir(path.join(repoRoot, "examples"), { recursive: true });
    const brief = path.join(repoRoot, "examples", "brief.json");
    await writeFile(brief, "{}");

    const resolved = await resolveBriefPath(undefined, {
      cwd: path.join(dir, "cwd"),
      repoRoot,
    });
    assert.equal(resolved, brief);
  });

  it("throws when nothing matches", async () => {
    dir = await mkdtemp(path.join(tmpdir(), "cap-cli-"));
    await assert.rejects(
      () =>
        resolveBriefPath("missing.json", {
          cwd: dir,
          repoRoot: path.join(dir, "repo"),
        }),
      /Brief not found/,
    );
  });
});
