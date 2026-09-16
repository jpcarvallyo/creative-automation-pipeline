export const ASPECT_RATIOS = ["1:1", "9:16", "16:9"] as const;
export type AspectRatio = (typeof ASPECT_RATIOS)[number];

export const ASPECT_SIZES: Record<AspectRatio, { width: number; height: number }> = {
  "1:1": { width: 1080, height: 1080 },
  "9:16": { width: 1080, height: 1920 },
  "16:9": { width: 1920, height: 1080 },
};

/** Hero canvas before ratio crops — square, large enough to cover all targets. */
export const HERO_SIZE = { width: 1920, height: 1920 };
