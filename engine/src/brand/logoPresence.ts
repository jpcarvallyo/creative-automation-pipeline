import sharp from "sharp";
import { ASPECT_SIZES, type AspectRatio } from "../pipeline/sizes.js";
import type { BrandCheckResult } from "./types.js";

/**
 * Verify the bottom-right logo ROI roughly matches the composited logo.
 * Cheap pixel MAE — a first gate, not a computer-vision verdict.
 */
export async function checkLogoPresence(
  creative: Buffer,
  logo: Buffer | undefined,
  aspectRatio: AspectRatio,
): Promise<BrandCheckResult> {
  if (!logo) {
    return {
      id: "logo_presence",
      status: "skip",
      detail: "No logo buffer available to verify",
    };
  }

  const { width, height } = ASPECT_SIZES[aspectRatio];
  const logoHeight = Math.round(height * 0.08);
  const marginY = Math.round(height * 0.04);
  const marginX = Math.round(width * 0.04);

  const logoBuf = await sharp(logo)
    .resize({ height: logoHeight, withoutEnlargement: true })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const logoWidth = logoBuf.info.width;
  const top = height - logoHeight - marginY;
  const left = width - logoWidth - marginX;

  const region = await sharp(creative)
    .extract({ left, top, width: logoWidth, height: logoBuf.info.height })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const mae = meanAbsoluteError(region.data, logoBuf.data);
  // Soft threshold: logo composite should be close; gen noise / jpeg heroes still ok
  const threshold = 48;
  if (mae <= threshold) {
    return {
      id: "logo_presence",
      status: "pass",
      detail: `Logo ROI MAE=${mae.toFixed(1)} ≤ ${threshold} (${aspectRatio})`,
    };
  }

  return {
    id: "logo_presence",
    status: "fail",
    detail: `Logo ROI MAE=${mae.toFixed(1)} > ${threshold} (${aspectRatio})`,
  };
}

function meanAbsoluteError(a: Buffer, b: Buffer): number {
  const n = Math.min(a.length, b.length);
  if (n === 0) return Number.POSITIVE_INFINITY;
  let sum = 0;
  for (let i = 0; i < n; i++) sum += Math.abs(a[i]! - b[i]!);
  return sum / n;
}
