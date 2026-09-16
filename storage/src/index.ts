import { LocalDiskStorage } from "./local.js";
import { R2Storage } from "./r2.js";
import type { AssetStorage } from "./types.js";

export type { AssetStorage } from "./types.js";
export { LocalDiskStorage } from "./local.js";
export { R2Storage } from "./r2.js";

/** Factory driven by env — local disk is the default. */
export function createAssetStorage(env: NodeJS.ProcessEnv = process.env): AssetStorage {
  const backend = (env.STORAGE_BACKEND ?? "local").toLowerCase();

  if (backend === "r2") {
    const accountId = required(env, "R2_ACCOUNT_ID");
    const accessKeyId = required(env, "R2_ACCESS_KEY_ID");
    const secretAccessKey = required(env, "R2_SECRET_ACCESS_KEY");
    const bucket = required(env, "R2_BUCKET");
    return new R2Storage({
      accountId,
      accessKeyId,
      secretAccessKey,
      bucket,
      endpoint: env.R2_ENDPOINT,
    });
  }

  const rootDir = env.LOCAL_STORAGE_DIR ?? "./data";
  return new LocalDiskStorage(rootDir);
}

function required(env: NodeJS.ProcessEnv, key: string): string {
  const value = env[key];
  if (!value) throw new Error(`Missing required env var: ${key}`);
  return value;
}
