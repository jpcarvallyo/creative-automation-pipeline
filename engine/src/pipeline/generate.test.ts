import assert from "node:assert/strict";
import { describe, it } from "node:test";
import sharp from "sharp";
import {
  createImageGenerator,
  MockImageGenerator,
  resolveGeneratorMode,
} from "./generate.js";

describe("resolveGeneratorMode", () => {
  it("uses preferred mode when provided", () => {
    assert.equal(resolveGeneratorMode("mock", { GENAI_API_KEY: "secret" }), "mock");
    assert.equal(resolveGeneratorMode("fal.ai", {}), "fal.ai");
  });

  it("defaults from env when preferred is omitted", () => {
    assert.equal(resolveGeneratorMode(undefined, { GENAI_API_KEY: "secret" }), "fal.ai");
    assert.equal(resolveGeneratorMode(undefined, { GENAI_API_KEY: "  " }), "mock");
    assert.equal(resolveGeneratorMode(undefined, {}), "mock");
  });
});

describe("createImageGenerator", () => {
  it("returns mock when preferred is mock", () => {
    const gen = createImageGenerator({ GENAI_API_KEY: "secret" }, "mock");
    assert.ok(gen instanceof MockImageGenerator);
  });

  it("returns mock when no key and no preference", () => {
    const gen = createImageGenerator({});
    assert.ok(gen instanceof MockImageGenerator);
  });

  it("throws when fal.ai is preferred without a key", () => {
    assert.throws(
      () => createImageGenerator({}, "fal.ai"),
      /GENAI_API_KEY is not set/,
    );
  });
});

describe("MockImageGenerator", () => {
  it("produces a PNG hero buffer", async () => {
    const gen = new MockImageGenerator();
    const buf = await gen.generateHero({
      product: { id: "aqua-spark", name: "AquaSpark Lemon" },
      region: "US-West",
      audience: "millennials",
      message: "Stay fresh.",
    });
    const meta = await sharp(buf).metadata();
    assert.equal(meta.format, "png");
    assert.equal(meta.width, 1920);
    assert.equal(meta.height, 1920);
  });
});
