import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CampaignBriefSchema } from "./types.js";

const validBrief = {
  campaignName: "Spring Hydration Push",
  region: "US-West",
  audience: "Health-conscious millennials",
  message: "Stay fresh. Stay you.",
  products: [
    { id: "aqua-spark", name: "AquaSpark Lemon" },
    { id: "berry-burst", name: "BerryBurst Zero" },
  ],
};

describe("CampaignBriefSchema", () => {
  it("accepts a valid brief", () => {
    const parsed = CampaignBriefSchema.safeParse(validBrief);
    assert.equal(parsed.success, true);
  });

  it("rejects fewer than two products", () => {
    const parsed = CampaignBriefSchema.safeParse({
      ...validBrief,
      products: [{ id: "only-one", name: "Solo" }],
    });
    assert.equal(parsed.success, false);
  });

  it("rejects missing required campaign fields", () => {
    const parsed = CampaignBriefSchema.safeParse({
      ...validBrief,
      message: "",
    });
    assert.equal(parsed.success, false);
  });

  it("accepts optional generator and brand", () => {
    const parsed = CampaignBriefSchema.safeParse({
      ...validBrief,
      generator: "mock",
      brand: {
        primaryColor: "#0B6E4F",
        prohibitedWords: ["miracle"],
        logoPath: "examples/assets/logo.png",
      },
    });
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data.generator, "mock");
      assert.equal(parsed.data.brand?.primaryColor, "#0B6E4F");
    }
  });

  it("rejects unknown generator values", () => {
    const parsed = CampaignBriefSchema.safeParse({
      ...validBrief,
      generator: "midjourney",
    });
    assert.equal(parsed.success, false);
  });
});
