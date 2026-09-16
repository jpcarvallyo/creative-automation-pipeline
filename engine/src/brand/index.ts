import type { AspectRatio } from "../pipeline/sizes.js";
import { checkBrandColor } from "./brandColor.js";
import { checkLogoPresence } from "./logoPresence.js";
import { checkProhibitedWords } from "./prohibitedWords.js";
import type { BrandCheckResult, BrandReport } from "./types.js";

export type { BrandCheckResult, BrandReport } from "./types.js";

export type BrandContext = {
  message: string;
  prohibitedWords?: string[];
  primaryColor?: string;
  logo?: Buffer;
};

/** Message-level checks (once per run). */
export function runCopyChecks(ctx: BrandContext): BrandCheckResult[] {
  return [checkProhibitedWords(ctx.message, ctx.prohibitedWords)];
}

/** Per-creative visual checks. */
export async function runCreativeChecks(
  creative: Buffer,
  aspectRatio: AspectRatio,
  ctx: BrandContext,
): Promise<BrandCheckResult[]> {
  const [logo, color] = await Promise.all([
    checkLogoPresence(creative, ctx.logo, aspectRatio),
    checkBrandColor(creative, ctx.primaryColor),
  ]);
  return [logo, color];
}

export function summarizeBrandChecks(checks: BrandCheckResult[]): BrandReport {
  return {
    ok: checks.every((c) => c.status !== "fail"),
    checks,
  };
}
