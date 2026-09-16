import { z } from "zod";
import type { BrandCheckResult, BrandReport } from "./brand/types.js";

export const ProductSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  /** Optional path/URL to an existing hero asset to reuse. */
  assetPath: z.string().optional(),
});

export const BrandSchema = z
  .object({
    primaryColor: z.string().optional(),
    prohibitedWords: z.array(z.string()).optional(),
    logoPath: z.string().optional(),
  })
  .optional();

export const CampaignBriefSchema = z.object({
  campaignName: z.string().min(1),
  region: z.string().min(1),
  audience: z.string().min(1),
  message: z.string().min(1),
  products: z.array(ProductSchema).min(2),
  brand: BrandSchema,
  /** Preferred hero generator for this run. Defaults from env when omitted. */
  generator: z.enum(["fal.ai", "mock"]).optional(),
});

export type CampaignBrief = z.infer<typeof CampaignBriefSchema>;
export type Product = z.infer<typeof ProductSchema>;

export type JobStatus = "queued" | "running" | "done" | "failed";

export type RunOutput = {
  productId: string;
  aspectRatio: "1:1" | "9:16" | "16:9";
  path: string;
  brandChecks?: BrandCheckResult[];
};

export type RunJob = {
  id: string;
  status: JobStatus;
  brief: CampaignBrief;
  createdAt: string;
  updatedAt: string;
  log: string[];
  error?: string;
  outputs: RunOutput[];
  brandReport?: BrandReport;
};

export type { BrandCheckResult, BrandReport };
