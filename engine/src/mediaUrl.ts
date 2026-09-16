import path from "node:path";

/** Turn a stored absolute path into an engine /media URL for the browser. */
export function toMediaUrl(absolutePath: string): string | undefined {
  const root = process.env.LOCAL_STORAGE_DIR
    ? path.resolve(process.env.LOCAL_STORAGE_DIR)
    : path.resolve("data");
  const resolved = path.resolve(absolutePath);
  if (!resolved.startsWith(root)) return undefined;
  const rel = path.relative(root, resolved).split(path.sep).join("/");
  const base = (process.env.ENGINE_PUBLIC_URL ?? "http://localhost:3001").replace(/\/$/, "");
  return `${base}/media/${rel}`;
}
