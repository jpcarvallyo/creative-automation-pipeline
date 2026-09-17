import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  briefFormToPayload,
  DEFAULT_BRIEF_FORM,
  validateBriefForm,
  type BriefFormState,
} from "./briefForm.js";

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
