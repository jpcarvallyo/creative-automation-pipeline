import type { HeroModelId } from "./models";

export type ProductForm = {
  id: string;
  name: string;
  description: string;
  assetPath: string;
};

export type BriefFormState = {
  campaignName: string;
  region: string;
  audience: string;
  message: string;
  products: ProductForm[];
  primaryColor: string;
  prohibitedWords: string;
  logoPath: string;
  generator: HeroModelId;
};

export const REGION_OPTIONS = [
  "US-West",
  "US-East",
  "US-Central",
  "UK",
  "EU-DE",
  "EU-FR",
  "APAC-JP",
  "APAC-AU",
  "LATAM-BR",
  "CA",
] as const;

export const AUDIENCE_OPTIONS = [
  "Health-conscious millennials, 25-40",
  "Gen Z social natives, 18-24",
  "Parents of young children, 28-45",
  "Fitness enthusiasts, 22-40",
  "Value-seeking families",
  "Premium urban professionals",
] as const;

/** Select-only sentinels — never sent to the engine as paths. */
export const ASSET_GENERATE = "__generate__";
export const LOGO_NONE = "__none__";
/** Seed path so "Custom path…" stays selected until the user edits it. */
export const CUSTOM_PATH_SEED = "examples/assets/";

export const LOGO_OPTIONS = [
  { label: "Default brand logo", value: "examples/assets/logo.png" },
  { label: "Vitality Harvest logo", value: "examples/assets/vitality-harvest-logo.jpg" },
  { label: "None", value: LOGO_NONE },
] as const;

export const COLOR_PRESETS = [
  { label: "Brand green", value: "#0B6E4F" },
  { label: "Ocean blue", value: "#0B4F6C" },
  { label: "Berry", value: "#6B2D5C" },
  { label: "Citrus", value: "#C45C26" },
  { label: "Near black", value: "#1C1B19" },
] as const;

export const ASSET_OPTIONS = [
  { label: "Generate with selected model", value: ASSET_GENERATE },
  { label: "Reuse brand logo as hero", value: "examples/assets/logo.png" },
  { label: "Reuse Vitality Harvest logo", value: "examples/assets/vitality-harvest-logo.jpg" },
] as const;

/** Map stored assetPath → <select> value (generate | preset | custom sentinel). */
export function heroSourceSelectValue(
  assetPath: string,
  customSentinel: string,
): string {
  if (assetPath === "") return ASSET_GENERATE;
  if (ASSET_OPTIONS.some((o) => o.value === assetPath)) return assetPath;
  return customSentinel;
}

/** Map <select> choice → stored assetPath ("" means generate). */
export function assetPathFromHeroSourceSelect(selectValue: string, customSentinel: string): string {
  if (selectValue === ASSET_GENERATE) return "";
  if (selectValue === customSentinel) return CUSTOM_PATH_SEED;
  return selectValue;
}

export function logoSelectValue(logoPath: string, customSentinel: string): string {
  if (logoPath === "") return LOGO_NONE;
  if (LOGO_OPTIONS.some((o) => o.value === logoPath)) return logoPath;
  return customSentinel;
}

export function logoPathFromSelect(selectValue: string, customSentinel: string): string {
  if (selectValue === LOGO_NONE) return "";
  if (selectValue === customSentinel) return CUSTOM_PATH_SEED;
  return selectValue;
}

export const DEFAULT_BRIEF_FORM: BriefFormState = {
  campaignName: "Spring Hydration Push",
  region: "US-West",
  audience: "Health-conscious millennials, 25-40",
  message: "Stay fresh. Stay you.",
  products: [
    {
      id: "aqua-spark",
      name: "AquaSpark Lemon",
      description: "Sparkling lemon water with electrolytes",
      assetPath: "",
    },
    {
      id: "berry-burst",
      name: "BerryBurst Zero",
      description: "Zero-sugar mixed berry sparkling water",
      assetPath: "",
    },
  ],
  primaryColor: "#0B6E4F",
  prohibitedWords: "guaranteed, miracle, cure",
  logoPath: "examples/assets/logo.png",
  generator: "fal.ai",
};

/** Build the JSON brief the engine expects. */
export function briefFormToPayload(form: BriefFormState) {
  const products = form.products
    .map((p) => ({
      id: p.id.trim(),
      name: p.name.trim(),
      description: p.description.trim() || undefined,
      assetPath: p.assetPath.trim() || undefined,
    }))
    .filter((p) => p.id && p.name);

  const prohibitedWords = form.prohibitedWords
    .split(",")
    .map((w) => w.trim())
    .filter(Boolean);

  return {
    campaignName: form.campaignName.trim(),
    region: form.region.trim(),
    audience: form.audience.trim(),
    message: form.message.trim(),
    products,
    generator: form.generator,
    brand: {
      primaryColor: form.primaryColor.trim() || undefined,
      prohibitedWords: prohibitedWords.length ? prohibitedWords : undefined,
      logoPath: form.logoPath.trim() || undefined,
    },
  };
}

export function validateBriefForm(form: BriefFormState): string | null {
  if (!form.campaignName.trim()) return "Campaign name is required";
  if (!form.region.trim()) return "Region is required";
  if (!form.audience.trim()) return "Audience is required";
  if (!form.message.trim()) return "Message is required";
  const products = form.products.filter((p) => p.id.trim() && p.name.trim());
  if (products.length < 2) return "Add at least two products (id + name)";
  return null;
}
