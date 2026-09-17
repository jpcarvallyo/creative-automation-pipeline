import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { filterHeroModels, getHeroModel, HERO_MODELS } from "./models.js";

describe("getHeroModel", () => {
  it("returns the catalog entry for a known id", () => {
    assert.equal(getHeroModel("fal.ai").id, "fal.ai");
    assert.equal(getHeroModel("mock").name, "Local mock");
  });
});

describe("filterHeroModels", () => {
  it("returns the full catalog for an empty query", () => {
    assert.equal(filterHeroModels("").length, HERO_MODELS.length);
    assert.equal(filterHeroModels("   ").length, HERO_MODELS.length);
  });

  it("filters by name, tags, and description", () => {
    assert.ok(filterHeroModels("flux").every((m) => /flux/i.test(m.name + m.description)));
    assert.ok(filterHeroModels("local").some((m) => m.id === "mock"));
    assert.ok(filterHeroModels("GenAI").some((m) => m.id === "fal.ai"));
    assert.equal(filterHeroModels("definitely-not-a-model").length, 0);
  });
});
