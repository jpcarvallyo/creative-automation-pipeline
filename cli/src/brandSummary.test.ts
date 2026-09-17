import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatBrandSummary, summarizeBrandReport } from "./brandSummary.js";

describe("summarizeBrandReport", () => {
  it("counts pass/fail/skip per check id", () => {
    const summary = summarizeBrandReport({
      ok: false,
      checks: [
        { id: "prohibited_words", status: "pass", detail: "ok" },
        { id: "logo_presence", status: "pass", detail: "ok" },
        { id: "logo_presence", status: "fail", detail: "mae" },
        { id: "brand_color", status: "skip", detail: "n/a" },
      ],
    });
    assert.deepEqual(summary.get("prohibited_words"), { pass: 1, fail: 0, skip: 0 });
    assert.deepEqual(summary.get("logo_presence"), { pass: 1, fail: 1, skip: 0 });
    assert.deepEqual(summary.get("brand_color"), { pass: 0, fail: 0, skip: 1 });
  });
});

describe("formatBrandSummary", () => {
  it("renders OK header and rows", () => {
    const lines = formatBrandSummary({
      ok: true,
      checks: [{ id: "prohibited_words", status: "pass", detail: "clean" }],
    });
    assert.equal(lines[0], "Brand report: OK");
    assert.ok(lines.some((l) => /prohibited_words: pass=1 fail=0 skip=0/.test(l)));
  });
});
