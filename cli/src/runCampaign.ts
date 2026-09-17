export type FetchLike = typeof fetch;

export type RunClientOptions = {
  engineUrl: string;
  fetch: FetchLike;
  sleep?: (ms: number) => Promise<void>;
  log?: (line: string) => void;
};

export type RunOutput = {
  productId: string;
  aspectRatio: string;
  path: string;
};

export type RunResult = {
  id: string;
  outputs: RunOutput[];
  brandReport?: {
    ok: boolean;
    checks: { id: string; status: string; detail: string }[];
  };
};

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Submit brief, poll to completion, return outputs. HTTP-only. */
export async function runCampaign(
  brief: unknown,
  options: RunClientOptions,
): Promise<RunResult> {
  const engineUrl = options.engineUrl.replace(/\/$/, "");
  const fetchFn = options.fetch;
  const sleep = options.sleep ?? defaultSleep;
  const log = options.log ?? (() => undefined);

  log(`Submitting brief → ${engineUrl}/runs`);
  const createRes = await fetchFn(`${engineUrl}/runs`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(brief),
  });
  const createBody = (await createRes.json()) as { id?: string; error?: string };
  if (!createRes.ok || !createBody.id) {
    throw new Error(`Failed to create run: ${JSON.stringify(createBody)}`);
  }

  const id = createBody.id;
  log(`Run id: ${id}`);

  let status = "queued";
  let lastLogLen = 0;
  while (status === "queued" || status === "running") {
    await sleep(400);
    const pollRes = await fetchFn(`${engineUrl}/runs/${id}`);
    const poll = (await pollRes.json()) as {
      status: string;
      log: string[];
      error?: string;
    };
    status = poll.status;
    for (const line of poll.log.slice(lastLogLen)) log(line);
    lastLogLen = poll.log.length;
    if (status === "failed") {
      throw new Error(poll.error ?? (poll.log.join("\n") || "Run failed"));
    }
  }

  const outRes = await fetchFn(`${engineUrl}/runs/${id}/outputs`);
  const outBody = (await outRes.json()) as {
    outputs: RunOutput[];
    brandReport?: RunResult["brandReport"];
  };

  return {
    id,
    outputs: outBody.outputs ?? [],
    brandReport: outBody.brandReport,
  };
}
