export type CheckStatus = "pass" | "fail" | "skip";

export type BrandCheckResult = {
  id: "prohibited_words" | "logo_presence" | "brand_color";
  status: CheckStatus;
  detail: string;
};

export type BrandReport = {
  /** True when no check failed (skips are allowed). Heuristic gates, not verdicts. */
  ok: boolean;
  checks: BrandCheckResult[];
};
