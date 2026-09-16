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
};

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
