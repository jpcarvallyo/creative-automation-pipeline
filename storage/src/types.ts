/**
 * Storage port — engine depends on this abstraction, not on disk/R2 details (DIP).
 */
export interface AssetStorage {
  /** Persist bytes at a logical key. Returns a retrieval path/URL for clients. */
  put(key: string, data: Buffer, contentType?: string): Promise<string>;
  /** Read bytes previously stored under key. */
  get(key: string): Promise<Buffer>;
}
