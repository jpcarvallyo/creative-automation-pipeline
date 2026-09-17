import assert from "node:assert/strict";
import { describe, it } from "node:test";
import sharp from "sharp";
import { deriveCreative } from "./derive.js";
import { ASPECT_RATIOS, ASPECT_SIZES, HERO_SIZE } from "./sizes.js";

async function solidHero(color = "#0B6E4F"): Promise<Buffer> {
  return sharp({
    create: {
      width: HERO_SIZE.width,
      height: HERO_SIZE.height,
      channels: 3,
      background: color,
    },
  })
    .png()
    .toBuffer();
}

describe("deriveCreative", () => {
  it("emits the contracted size for every aspect ratio", async () => {
    const hero = await solidHero();
    for (const aspectRatio of ASPECT_RATIOS) {
      const out = await deriveCreative({
        hero,
        message: "Stay fresh. Stay you.",
        aspectRatio,
      });
      const meta = await sharp(out).metadata();
      const expected = ASPECT_SIZES[aspectRatio];
      assert.equal(meta.width, expected.width, aspectRatio);
      assert.equal(meta.height, expected.height, aspectRatio);
      assert.equal(meta.format, "png");
    }
  });

  it("escapes message text that would break SVG", async () => {
    const hero = await solidHero();
    const out = await deriveCreative({
      hero,
      message: `Fresh & "bold" <limited>`,
      aspectRatio: "1:1",
    });
    const meta = await sharp(out).metadata();
    assert.equal(meta.width, 1080);
    assert.equal(meta.height, 1080);
  });

  it("composites an optional logo without changing canvas size", async () => {
    const hero = await solidHero("#224466");
    const logo = await sharp({
      create: { width: 200, height: 80, channels: 3, background: "#ffffff" },
    })
      .png()
      .toBuffer();

    const out = await deriveCreative({
      hero,
      message: "Stay fresh.",
      aspectRatio: "16:9",
      logo,
    });
    const meta = await sharp(out).metadata();
    assert.equal(meta.width, 1920);
    assert.equal(meta.height, 1080);
  });
});
