import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { runCampaign } from "./runCampaign.js";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("runCampaign", () => {
  it("submits, polls through running, and returns outputs", async () => {
    const calls: string[] = [];
    let polls = 0;

    const fetchMock: typeof fetch = async (input, init) => {
      const url = String(input);
      calls.push(`${init?.method ?? "GET"} ${url}`);
      if (url.endsWith("/runs") && init?.method === "POST") {
        return jsonResponse(202, { id: "run-1" });
      }
      if (url.endsWith("/runs/run-1")) {
        polls += 1;
        if (polls === 1) {
          return jsonResponse(200, {
            status: "running",
            log: ["started"],
          });
        }
        return jsonResponse(200, {
          status: "done",
          log: ["started", "done"],
        });
      }
      if (url.endsWith("/runs/run-1/outputs")) {
        return jsonResponse(200, {
          outputs: [
            { productId: "aqua-spark", aspectRatio: "1:1", path: "/tmp/1x1.png" },
          ],
          brandReport: { ok: true, checks: [] },
        });
      }
      return jsonResponse(404, { error: "missing" });
    };

    const logs: string[] = [];
    const result = await runCampaign(
      { campaignName: "Test" },
      {
        engineUrl: "http://engine.test",
        fetch: fetchMock,
        sleep: async () => undefined,
        log: (line) => logs.push(line),
      },
    );

    assert.equal(result.id, "run-1");
    assert.equal(result.outputs.length, 1);
    assert.equal(result.outputs[0]?.productId, "aqua-spark");
    assert.ok(calls.some((c) => c.startsWith("POST ")));
    assert.ok(logs.some((l) => /Run id: run-1/.test(l)));
    assert.ok(logs.includes("started"));
    assert.ok(logs.includes("done"));
  });

  it("throws when create fails", async () => {
    const fetchMock: typeof fetch = async () =>
      jsonResponse(400, { error: "Invalid campaign brief" });

    await assert.rejects(
      () =>
        runCampaign({}, {
          engineUrl: "http://engine.test",
          fetch: fetchMock,
          sleep: async () => undefined,
        }),
      /Failed to create run/,
    );
  });

  it("throws when run fails while polling", async () => {
    const fetchMock: typeof fetch = async (input, init) => {
      const url = String(input);
      if (url.endsWith("/runs") && init?.method === "POST") {
        return jsonResponse(202, { id: "run-x" });
      }
      return jsonResponse(200, {
        status: "failed",
        log: ["boom"],
        error: "fal locked",
      });
    };

    await assert.rejects(
      () =>
        runCampaign({}, {
          engineUrl: "http://engine.test",
          fetch: fetchMock,
          sleep: async () => undefined,
        }),
      /fal locked/,
    );
  });
});
