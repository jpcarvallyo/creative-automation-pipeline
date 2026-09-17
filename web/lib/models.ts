export type HeroModelId = "fal.ai" | "mock";

export type HeroModel = {
  id: HeroModelId;
  name: string;
  description: string;
  tags: string[];
  /** Needs GENAI_API_KEY on the engine. */
  requiresKey?: boolean;
};

/**
 * Catalog for the operator console. Add entries here as the engine gains
 * more generators — the picker is search + scroll, not a fixed toggle.
 */
export const HERO_MODELS: HeroModel[] = [
  {
    id: "fal.ai",
    name: "fal.ai FLUX schnell",
    description: "GenAI hero images via fal.ai — fast FLUX, best when a key is configured.",
    tags: ["GenAI", "Fast"],
    requiresKey: true,
  },
  {
    id: "mock",
    name: "Local mock",
    description: "Sharp SVG placeholders — zero API cost, always available for demos.",
    tags: ["Local", "Free"],
  },
];

export function getHeroModel(id: HeroModelId): HeroModel {
  return HERO_MODELS.find((m) => m.id === id) ?? HERO_MODELS[HERO_MODELS.length - 1]!;
}

export function filterHeroModels(query: string): HeroModel[] {
  const q = query.trim().toLowerCase();
  if (!q) return HERO_MODELS;
  return HERO_MODELS.filter((m) => {
    const hay = `${m.name} ${m.description} ${m.tags.join(" ")}`.toLowerCase();
    return hay.includes(q);
  });
}
