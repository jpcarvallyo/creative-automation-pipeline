import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, it, after } from "node:test";
import { LocalDiskStorage } from "./local.js";

describe("LocalDiskStorage", () => {
  let root = "";
  const storagePromise = (async () => {
    root = await mkdtemp(path.join(tmpdir(), "cap-storage-"));
    return new LocalDiskStorage(root);
  })();

  after(async () => {
    if (root) await rm(root, { recursive: true, force: true });
  });

  it("writes and reads under the root", async () => {
    const storage = await storagePromise;
    const key = "outputs/run-1/aqua/1x1.png";
    const pathWritten = await storage.put(key, Buffer.from("png-bytes"));
    assert.ok(pathWritten.startsWith(path.resolve(root)));
    assert.equal((await storage.get(key)).toString(), "png-bytes");
  });

  it("rejects path traversal via .. segments", async () => {
    const storage = await storagePromise;
    await assert.rejects(
      () => storage.put("../escape.png", Buffer.from("x")),
      /Invalid storage key/,
    );
  });

  it("rejects traversal that would pass a naive startsWith check", async () => {
    const storage = await storagePromise;
    // If root is /tmp/cap-storage-XYZ, sibling /tmp/cap-storage-XYZ-evil must fail.
    const evil = `${path.basename(root)}-evil/secret.png`;
    await assert.rejects(
      () => storage.put(path.join("..", evil), Buffer.from("x")),
      /Invalid storage key/,
    );
  });
});
