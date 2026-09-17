import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createRun } from "./engine.js";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("createRun", () => {
  it("posts the brief to the engine and returns the id", async () => {
    const original = globalThis.fetch;
    globalThis.fetch = async (input, init) => {
      assert.equal(String(input), "http://localhost:3001/runs");
      assert.equal(init?.method, "POST");
      const body = JSON.parse(String(init?.body));
      assert.equal(body.campaignName, "Test");
      return jsonResponse(202, { id: "abc" });
    };

    try {
      const result = await createRun({ campaignName: "Test" });
      assert.deepEqual(result, { id: "abc" });
    } finally {
      globalThis.fetch = original;
    }
  });

  it("surfaces API errors", async () => {
    const original = globalThis.fetch;
    globalThis.fetch = async () =>
      jsonResponse(400, {
        error: "Invalid campaign brief",
        details: { fieldErrors: { products: ["Required"] } },
      });

    try {
      await assert.rejects(
        () => createRun({}),
        /Invalid campaign brief/,
      );
    } finally {
      globalThis.fetch = original;
    }
  });
});
