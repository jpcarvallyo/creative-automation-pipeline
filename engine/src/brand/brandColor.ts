import sharp from "sharp";
import type { BrandCheckResult } from "./types.js";

/**
 * Histogram-ish gate: share of sampled pixels near the brand primary color.
 * Uses Euclidean RGB distance on a downscaled raster — cheap, explainable.
 */
export async function checkBrandColor(
  creative: Buffer,
  primaryColor: string | undefined,
): Promise<BrandCheckResult> {
  if (!primaryColor) {
    return {
      id: "brand_color",
      status: "skip",
      detail: "No brand.primaryColor configured",
    };
  }

  const target = parseHexColor(primaryColor);
  if (!target) {
    return {
      id: "brand_color",
      status: "fail",
      detail: `Could not parse primaryColor: ${primaryColor}`,
    };
  }

  const { data, info } = await sharp(creative)
    .resize(64, 64, { fit: "fill" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const channels = info.channels;
  const pixelCount = info.width * info.height;
  const maxDistance = 70; // generous — logo + partial matches
  let near = 0;

  for (let i = 0; i < pixelCount; i++) {
    const o = i * channels;
    const dr = data[o]! - target.r;
    const dg = data[o + 1]! - target.g;
    const db = data[o + 2]! - target.b;
    const dist = Math.sqrt(dr * dr + dg * dg + db * db);
    if (dist <= maxDistance) near += 1;
  }

  const ratio = near / pixelCount;
  const minRatio = 0.002; // 0.2% of downscaled pixels — logo-sized signal
  if (ratio >= minRatio) {
    return {
      id: "brand_color",
      status: "pass",
      detail: `${(ratio * 100).toFixed(2)}% pixels near ${primaryColor} (need ≥ ${(minRatio * 100).toFixed(2)}%)`,
    };
  }

  return {
    id: "brand_color",
    status: "fail",
    detail: `Only ${(ratio * 100).toFixed(2)}% pixels near ${primaryColor} (need ≥ ${(minRatio * 100).toFixed(2)}%)`,
  };
}

function parseHexColor(input: string): { r: number; g: number; b: number } | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(input.trim());
  if (!m) return null;
  const hex = m[1]!;
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
  };
}
