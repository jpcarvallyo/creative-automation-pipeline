import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { AssetStorage } from "storage";
import { MockImageGenerator } from "./generate.js";
import { runPipeline } from "./index.js";
import { ASPECT_RATIOS } from "./sizes.js";
import type { CampaignBrief } from "../types.js";

class MemoryStorage implements AssetStorage {
  readonly files = new Map<string, Buffer>();

  async put(key: string, data: Buffer): Promise<string> {
    this.files.set(key, data);
    return `memory://${key}`;
  }

  async get(key: string): Promise<Buffer> {
    const data = this.files.get(key);
    if (!data) throw new Error(`missing ${key}`);
    return data;
  }
}

describe("runPipeline", () => {
  it("generates hero + three ratios per product with mock generator", async () => {
    const storage = new MemoryStorage();
    const log: string[] = [];
    const brief: CampaignBrief = {
      campaignName: "Test Push",
      region: "US-West",
      audience: "testers",
      message: "Stay fresh.",
      generator: "mock",
      products: [
        { id: "aqua-spark", name: "AquaSpark Lemon", description: "lemon water" },
        { id: "berry-burst", name: "BerryBurst Zero" },
      ],
      brand: {
        primaryColor: "#0B6E4F",
        prohibitedWords: ["guaranteed"],
      },
    };

    const { outputs, brandReport } = await runPipeline("test-run", brief, {
      storage,
      generator: new MockImageGenerator(),
      log: (line) => log.push(line),
    });

    assert.equal(outputs.length, 2 * ASPECT_RATIOS.length);
    for (const productId of ["aqua-spark", "berry-burst"]) {
      assert.ok(storage.files.has(`outputs/test-run/${productId}/hero.png`));
      for (const ratio of ASPECT_RATIOS) {
        const file = ratio.replace(":", "x");
        assert.ok(storage.files.has(`outputs/test-run/${productId}/${file}.png`));
      }
    }

    assert.ok(brandReport.checks.some((c) => c.id === "prohibited_words"));
    assert.ok(log.some((line) => /Hero generator: mock/.test(line)));
    assert.ok(log.some((line) => /Generating hero via mock/.test(line)));
  });
});
