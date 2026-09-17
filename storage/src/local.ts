import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AssetStorage } from "./types.js";

/** Default POC backend — writes under a local root directory. */
export class LocalDiskStorage implements AssetStorage {
  constructor(private readonly rootDir: string) {}

  async put(key: string, data: Buffer, _contentType?: string): Promise<string> {
    const filePath = this.resolve(key);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, data);
    return filePath;
  }

  async get(key: string): Promise<Buffer> {
    return readFile(this.resolve(key));
  }

  /**
   * Resolve a storage key under rootDir. Rejects `..` escapes
   * (product ids flow into keys — treat them as untrusted).
   */
  private resolve(key: string): string {
    const root = path.resolve(this.rootDir);
    const normalized = key.replace(/^\/+/, "");
    const full = path.resolve(root, normalized);
    const relative = path.relative(root, full);
    if (
      relative === "" ||
      relative.startsWith(`..${path.sep}`) ||
      relative === ".." ||
      path.isAbsolute(relative)
    ) {
      throw new Error(`Invalid storage key: ${key}`);
    }
    return full;
  }
}
