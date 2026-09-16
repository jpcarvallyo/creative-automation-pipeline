import { readFile } from "node:fs/promises";
import sharp from "sharp";
import { resolveRepoPath } from "../paths.js";
import { ASPECT_SIZES, type AspectRatio } from "./sizes.js";

export type DeriveOptions = {
  hero: Buffer;
  message: string;
  aspectRatio: AspectRatio;
  /** Optional brand logo composited bottom-right. */
  logo?: Buffer;
};

/**
 * Deterministic crop/resize + SVG message overlay (+ optional logo).
 * Localization = swap `message` text; do not regenerate the hero.
 */
export async function deriveCreative(options: DeriveOptions): Promise<Buffer> {
  const { width, height } = ASPECT_SIZES[options.aspectRatio];
  const base = sharp(options.hero).resize(width, height, {
    fit: "cover",
    position: "centre",
  });

  const overlaySvg = messageOverlaySvg(options.message, width, height);
  const composites: sharp.OverlayOptions[] = [
    { input: Buffer.from(overlaySvg), top: 0, left: 0 },
  ];

  if (options.logo) {
    const logoHeight = Math.round(height * 0.08);
    const logoBuf = await sharp(options.logo)
      .resize({ height: logoHeight, withoutEnlargement: true })
      .png()
      .toBuffer();
    const meta = await sharp(logoBuf).metadata();
    const logoWidth = meta.width ?? logoHeight;
    composites.push({
      input: logoBuf,
      top: height - logoHeight - Math.round(height * 0.04),
      left: width - logoWidth - Math.round(width * 0.04),
    });
  }

  return base.composite(composites).png().toBuffer();
}

export async function loadOptionalLogo(logoPath: string | undefined): Promise<Buffer | undefined> {
  if (!logoPath) return undefined;
  const resolved = resolveRepoPath(logoPath);
  try {
    return await readFile(resolved);
  } catch {
    return undefined;
  }
}

function messageOverlaySvg(message: string, width: number, height: number): string {
  const fontSize = Math.max(28, Math.round(width * 0.045));
  const barHeight = Math.round(fontSize * 2.4);
  const y = height - Math.round(height * 0.06) - barHeight;
  const escaped = message
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="${y}" width="${width}" height="${barHeight}" fill="rgba(0,0,0,0.55)"/>
      <text x="50%" y="${y + barHeight / 2}" dy="0.35em" text-anchor="middle"
            font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}"
            font-weight="700" fill="#ffffff">${escaped}</text>
    </svg>`;
}
