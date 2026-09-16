import { readFile } from "node:fs/promises";
import type { AssetStorage } from "storage";
import {
  runCopyChecks,
  runCreativeChecks,
  summarizeBrandChecks,
  type BrandCheckResult,
  type BrandReport,
} from "../brand/index.js";
import { resolveRepoPath } from "../paths.js";
import type { CampaignBrief, RunOutput } from "../types.js";
import { deriveCreative, loadOptionalLogo } from "./derive.js";
import { createImageGenerator, type ImageGenerator } from "./generate.js";
import { ASPECT_RATIOS } from "./sizes.js";

export type PipelineDeps = {
  storage: AssetStorage;
  generator?: ImageGenerator;
  log: (line: string) => void;
};

export type PipelineResult = {
  outputs: RunOutput[];
  brandReport: BrandReport;
};

/**
 * One hero per product → sharp derives all ratios → brand heuristics → storage.put.
 * Never calls the image model per aspect ratio.
 */
export async function runPipeline(
  runId: string,
  brief: CampaignBrief,
  deps: PipelineDeps,
): Promise<PipelineResult> {
  const generator = deps.generator ?? createImageGenerator();
  const logo = await loadOptionalLogo(brief.brand?.logoPath);
  if (brief.brand?.logoPath && !logo) {
    deps.log(`Logo not found at ${brief.brand.logoPath}; continuing without logo`);
  }

  const brandCtx = {
    message: brief.message,
    prohibitedWords: brief.brand?.prohibitedWords,
    primaryColor: brief.brand?.primaryColor,
    logo,
  };

  const allChecks: BrandCheckResult[] = [];
  const copyChecks = runCopyChecks(brandCtx);
  allChecks.push(...copyChecks);
  for (const check of copyChecks) {
    deps.log(`Brand[${check.id}] ${check.status}: ${check.detail}`);
  }

  const outputs: RunOutput[] = [];

  for (const product of brief.products) {
    deps.log(`Product ${product.id}: resolving hero`);
    const hero = await resolveHero(
      product.assetPath,
      () =>
        generator.generateHero({
          product,
          region: brief.region,
          audience: brief.audience,
          message: brief.message,
        }),
      deps.log,
      product.id,
    );

    const heroKey = `outputs/${runId}/${product.id}/hero.png`;
    const heroPath = await deps.storage.put(heroKey, hero, "image/png");
    deps.log(`Hero saved → ${heroPath}`);

    for (const aspectRatio of ASPECT_RATIOS) {
      deps.log(`Deriving ${aspectRatio} for ${product.id}`);
      const creative = await deriveCreative({
        hero,
        message: brief.message,
        aspectRatio,
        logo,
      });

      const creativeChecks = await runCreativeChecks(creative, aspectRatio, brandCtx);
      allChecks.push(...creativeChecks);
      for (const check of creativeChecks) {
        deps.log(
          `Brand[${check.id}] ${product.id}/${aspectRatio} ${check.status}: ${check.detail}`,
        );
      }

      const ratioKey = aspectRatio.replace(":", "x");
      const key = `outputs/${runId}/${product.id}/${ratioKey}.png`;
      const storedPath = await deps.storage.put(key, creative, "image/png");
      outputs.push({
        productId: product.id,
        aspectRatio,
        path: storedPath,
        brandChecks: creativeChecks,
      });
      deps.log(`Saved ${aspectRatio} → ${storedPath}`);
    }
  }

  const brandReport = summarizeBrandChecks(allChecks);
  deps.log(
    `Brand report: ${brandReport.ok ? "OK" : "ISSUES"} (${allChecks.filter((c) => c.status === "fail").length} fail / ${allChecks.length} checks)`,
  );

  return { outputs, brandReport };
}

async function resolveHero(
  assetPath: string | undefined,
  generate: () => Promise<Buffer>,
  log: (line: string) => void,
  productId: string,
): Promise<Buffer> {
  if (assetPath) {
    const resolved = resolveRepoPath(assetPath);
    try {
      const buf = await readFile(resolved);
      log(`Reusing input asset for ${productId}: ${resolved}`);
      return buf;
    } catch {
      log(`Input asset missing for ${productId} (${assetPath}); generating`);
    }
  } else {
    log(`No input asset for ${productId}; generating hero`);
  }
  return generate();
}
