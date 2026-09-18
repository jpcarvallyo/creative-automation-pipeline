import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ASSET_GENERATE,
  CUSTOM_PATH_SEED,
  LOGO_NONE,
  assetPathFromHeroSourceSelect,
  briefFormToPayload,
  DEFAULT_BRIEF_FORM,
  heroSourceSelectValue,
  logoPathFromSelect,
  logoSelectValue,
  validateBriefForm,
  type BriefFormState,
} from "./briefForm.js";

const CUSTOM = "__custom__";

describe("validateBriefForm", () => {
  it("accepts the default sample form", () => {
    assert.equal(validateBriefForm(DEFAULT_BRIEF_FORM), null);
  });

  it("requires campaign fields", () => {
    assert.match(
      validateBriefForm({ ...DEFAULT_BRIEF_FORM, campaignName: "  " }) ?? "",
      /Campaign name/,
    );
    assert.match(
      validateBriefForm({ ...DEFAULT_BRIEF_FORM, region: "" }) ?? "",
      /Region/,
    );
    assert.match(
      validateBriefForm({ ...DEFAULT_BRIEF_FORM, audience: "" }) ?? "",
      /Audience/,
    );
    assert.match(
      validateBriefForm({ ...DEFAULT_BRIEF_FORM, message: "" }) ?? "",
      /Message/,
    );
  });

  it("requires at least two named products", () => {
    const form: BriefFormState = {
      ...DEFAULT_BRIEF_FORM,
      products: [{ id: "only", name: "One", description: "", assetPath: "" }],
    };
    assert.match(validateBriefForm(form) ?? "", /two products/);
  });
});

describe("hero / logo select mapping", () => {
  it("keeps Custom selected instead of collapsing to Generate", () => {
    assert.equal(heroSourceSelectValue("", CUSTOM), ASSET_GENERATE);
    assert.equal(
      heroSourceSelectValue("examples/assets/logo.png", CUSTOM),
      "examples/assets/logo.png",
    );
    assert.equal(heroSourceSelectValue(CUSTOM_PATH_SEED, CUSTOM), CUSTOM);
    assert.equal(heroSourceSelectValue("examples/assets/hero.png", CUSTOM), CUSTOM);

    assert.equal(assetPathFromHeroSourceSelect(ASSET_GENERATE, CUSTOM), "");
    assert.equal(assetPathFromHeroSourceSelect(CUSTOM, CUSTOM), CUSTOM_PATH_SEED);
    assert.equal(
      assetPathFromHeroSourceSelect("examples/assets/logo.png", CUSTOM),
      "examples/assets/logo.png",
    );
  });

  it("keeps Custom logo selected instead of collapsing to None", () => {
    assert.equal(logoSelectValue("", CUSTOM), LOGO_NONE);
    assert.equal(logoSelectValue(CUSTOM_PATH_SEED, CUSTOM), CUSTOM);
    assert.equal(logoPathFromSelect(LOGO_NONE, CUSTOM), "");
    assert.equal(logoPathFromSelect(CUSTOM, CUSTOM), CUSTOM_PATH_SEED);
  });
});

describe("briefFormToPayload", () => {
  it("maps form state into the engine brief shape", () => {
    const payload = briefFormToPayload(DEFAULT_BRIEF_FORM);
    assert.equal(payload.campaignName, "Spring Hydration Push");
    assert.equal(payload.generator, "fal.ai");
    assert.equal(payload.products.length, 2);
    assert.deepEqual(payload.brand.prohibitedWords, [
      "guaranteed",
      "miracle",
      "cure",
    ]);
    assert.equal(payload.brand.logoPath, "examples/assets/logo.png");
    assert.equal(payload.products[0]?.assetPath, undefined);
  });

  it("omits blank optional product fields", () => {
    const payload = briefFormToPayload({
      ...DEFAULT_BRIEF_FORM,
      products: [
        {
          id: " a ",
          name: " A ",
          description: "  ",
          assetPath: " examples/assets/logo.png ",
        },
        { id: "b", name: "B", description: "desc", assetPath: "" },
      ],
      primaryColor: "  ",
      prohibitedWords: " , , ",
      logoPath: "",
    });
    assert.equal(payload.products[0]?.description, undefined);
    assert.equal(payload.products[0]?.assetPath, "examples/assets/logo.png");
    assert.equal(payload.products[1]?.description, "desc");
    assert.equal(payload.brand.primaryColor, undefined);
    assert.equal(payload.brand.prohibitedWords, undefined);
    assert.equal(payload.brand.logoPath, undefined);
  });

  it("drops incomplete product rows", () => {
    const payload = briefFormToPayload({
      ...DEFAULT_BRIEF_FORM,
      products: [
        { id: "ok", name: "Ok", description: "", assetPath: "" },
        { id: "", name: "NoId", description: "", assetPath: "" },
        { id: "no-name", name: "  ", description: "", assetPath: "" },
        { id: "ok2", name: "Ok2", description: "", assetPath: "" },
      ],
    });
    assert.equal(payload.products.length, 2);
    assert.deepEqual(
      payload.products.map((p) => p.id),
      ["ok", "ok2"],
    );
  });
});
