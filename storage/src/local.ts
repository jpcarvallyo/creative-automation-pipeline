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

  private resolve(key: string): string {
    const normalized = key.replace(/^\/+/, "");
    const full = path.resolve(this.rootDir, normalized);
    if (!full.startsWith(path.resolve(this.rootDir))) {
      throw new Error(`Invalid storage key: ${key}`);
    }
    return full;
  }
}
