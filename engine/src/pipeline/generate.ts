import { fal } from "@fal-ai/client";
import sharp from "sharp";
import { HERO_SIZE } from "./sizes.js";
import type { Product } from "../types.js";

export type HeroRequest = {
  product: Product;
  region: string;
  audience: string;
  message: string;
};

export interface ImageGenerator {
  generateHero(request: HeroRequest): Promise<Buffer>;
}

/** Sharp-composited placeholder — full pipeline runs with zero API keys. */
export class MockImageGenerator implements ImageGenerator {
  async generateHero(request: HeroRequest): Promise<Buffer> {
    const { product } = request;
    const hue = hashHue(product.id);
    const bg = `hsl(${hue}, 55%, 42%)`;
    const svg = `
      <svg width="${HERO_SIZE.width}" height="${HERO_SIZE.height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${bg}"/>
        <rect x="80" y="80" width="${HERO_SIZE.width - 160}" height="${HERO_SIZE.height - 160}"
              fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="8" rx="32"/>
        <text x="50%" y="46%" text-anchor="middle" font-family="Arial, sans-serif"
              font-size="96" font-weight="700" fill="#ffffff">${escapeXml(product.name)}</text>
        <text x="50%" y="54%" text-anchor="middle" font-family="Arial, sans-serif"
              font-size="42" fill="rgba(255,255,255,0.85)">MOCK HERO · ${escapeXml(product.id)}</text>
      </svg>`;

    return sharp(Buffer.from(svg)).png().toBuffer();
  }
}

/** fal.ai FLUX schnell — one call per product when GENAI_API_KEY is set. */
export class FalImageGenerator implements ImageGenerator {
  constructor(apiKey: string) {
    fal.config({ credentials: apiKey });
  }

  async generateHero(request: HeroRequest): Promise<Buffer> {
    const prompt = [
      `Professional social ad hero image for consumer product "${request.product.name}".`,
      request.product.description ? `Product details: ${request.product.description}.` : "",
      `Target region: ${request.region}. Audience: ${request.audience}.`,
      `Campaign vibe matching message: "${request.message}".`,
      "Clean commercial photography, centered subject, ample margin for text overlay, no typography in the image.",
    ]
      .filter(Boolean)
      .join(" ");

    const result = await fal.subscribe("fal-ai/flux/schnell", {
      input: {
        prompt,
        image_size: "square_hd",
        num_images: 1,
        num_inference_steps: 4,
        enable_safety_checker: true,
      },
    });

    const url = (result.data as { images?: { url: string }[] })?.images?.[0]?.url;
    if (!url) throw new Error("fal.ai returned no image URL");

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download fal image: ${response.status}`);
    }
    return Buffer.from(await response.arrayBuffer());
  }
}

export function createImageGenerator(
  env: NodeJS.ProcessEnv = process.env,
  preferred?: "fal.ai" | "mock",
): ImageGenerator {
  const key = env.GENAI_API_KEY?.trim();
  const mode = preferred ?? (key ? "fal.ai" : "mock");
  if (mode === "fal.ai") {
    if (!key) {
      throw new Error("fal.ai selected but GENAI_API_KEY is not set on the engine");
    }
    return new FalImageGenerator(key);
  }
  return new MockImageGenerator();
}

export function resolveGeneratorMode(
  preferred: "fal.ai" | "mock" | undefined,
  env: NodeJS.ProcessEnv = process.env,
): "fal.ai" | "mock" {
  if (preferred) return preferred;
  return env.GENAI_API_KEY?.trim() ? "fal.ai" : "mock";
}

function hashHue(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0;
  return h % 360;
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
