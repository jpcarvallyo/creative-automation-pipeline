import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { checkProhibitedWords } from "./prohibitedWords.js";

describe("checkProhibitedWords", () => {
  it("skips when no list is configured", () => {
    const result = checkProhibitedWords("Stay fresh.", undefined);
    assert.equal(result.status, "skip");
  });

  it("passes clean copy", () => {
    const result = checkProhibitedWords("Stay fresh. Stay you.", ["guaranteed", "miracle"]);
    assert.equal(result.status, "pass");
  });

  it("fails on a whole-word hit", () => {
    const result = checkProhibitedWords("Results are guaranteed daily", ["guaranteed"]);
    assert.equal(result.status, "fail");
    assert.match(result.detail, /guaranteed/i);
  });

  it("does not match inside longer tokens", () => {
    const result = checkProhibitedWords("Our curette kit is soft", ["cure"]);
    assert.equal(result.status, "pass");
  });
});
