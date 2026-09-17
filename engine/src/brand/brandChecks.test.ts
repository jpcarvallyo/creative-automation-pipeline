import assert from "node:assert/strict";
import { describe, it } from "node:test";
import sharp from "sharp";
import { checkBrandColor } from "./brandColor.js";
import { checkLogoPresence } from "./logoPresence.js";
import { runCopyChecks, summarizeBrandChecks } from "./index.js";
import { deriveCreative } from "../pipeline/derive.js";
import { HERO_SIZE } from "../pipeline/sizes.js";

async function solidPng(
  width: number,
  height: number,
  color: string,
): Promise<Buffer> {
  return sharp({
    create: { width, height, channels: 3, background: color },
  })
    .png()
    .toBuffer();
}

describe("checkBrandColor", () => {
  it("skips when primary color is missing", async () => {
    const creative = await solidPng(1080, 1080, "#000000");
    const result = await checkBrandColor(creative, undefined);
    assert.equal(result.status, "skip");
  });

  it("fails unparsable hex", async () => {
    const creative = await solidPng(1080, 1080, "#0B6E4F");
    const result = await checkBrandColor(creative, "not-a-color");
    assert.equal(result.status, "fail");
  });

  it("passes when the creative is dominated by the brand color", async () => {
    const creative = await solidPng(1080, 1080, "#0B6E4F");
    const result = await checkBrandColor(creative, "#0B6E4F");
    assert.equal(result.status, "pass");
  });
});

describe("checkLogoPresence", () => {
  it("skips when no logo is provided", async () => {
    const creative = await solidPng(1080, 1080, "#333333");
    const result = await checkLogoPresence(creative, undefined, "1:1");
    assert.equal(result.status, "skip");
  });

  it("passes when the logo was composited by deriveCreative", async () => {
    const hero = await solidPng(HERO_SIZE.width, HERO_SIZE.height, "#224466");
    const logo = await solidPng(240, 96, "#ffffff");
    const creative = await deriveCreative({
      hero,
      message: "Stay fresh.",
      aspectRatio: "1:1",
      logo,
    });
    const result = await checkLogoPresence(creative, logo, "1:1");
    assert.equal(result.status, "pass", result.detail);
  });
});

describe("brand report helpers", () => {
  it("runCopyChecks returns prohibited-word result", () => {
    const [check] = runCopyChecks({
      message: "This is guaranteed",
      prohibitedWords: ["guaranteed"],
    });
    assert.equal(check?.status, "fail");
  });

  it("summarizeBrandChecks is ok only without fails", () => {
    assert.equal(
      summarizeBrandChecks([
        { id: "prohibited_words", status: "pass", detail: "ok" },
        { id: "logo_presence", status: "skip", detail: "n/a" },
      ]).ok,
      true,
    );
    assert.equal(
      summarizeBrandChecks([
        { id: "prohibited_words", status: "fail", detail: "hit" },
      ]).ok,
      false,
    );
  });
});
