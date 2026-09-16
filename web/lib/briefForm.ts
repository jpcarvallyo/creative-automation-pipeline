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
  generator: "fal.ai" | "mock";
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

export const LOGO_OPTIONS = [
  { label: "Default brand logo", value: "examples/assets/logo.png" },
  { label: "None", value: "" },
] as const;

export const COLOR_PRESETS = [
  { label: "Brand green", value: "#0B6E4F" },
  { label: "Ocean blue", value: "#0B4F6C" },
  { label: "Berry", value: "#6B2D5C" },
  { label: "Citrus", value: "#C45C26" },
  { label: "Near black", value: "#1C1B19" },
] as const;

export const ASSET_OPTIONS = [
  { label: "Generate with selected model", value: "" },
  { label: "Reuse brand logo as hero", value: "examples/assets/logo.png" },
] as const;

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
