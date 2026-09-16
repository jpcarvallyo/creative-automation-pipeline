export const ENGINE_URL =
  process.env.NEXT_PUBLIC_ENGINE_URL?.replace(/\/$/, "") ?? "http://localhost:3001";

export type BrandCheck = {
  id: string;
  status: "pass" | "fail" | "skip";
  detail: string;
};

export type RunStatus = {
  id: string;
  status: "queued" | "running" | "done" | "failed";
  log: string[];
  error?: string;
  campaignName?: string;
  brandReport?: { ok: boolean; checks: BrandCheck[] };
};

export type RunOutput = {
  productId: string;
  aspectRatio: string;
  path: string;
  url?: string;
  brandChecks?: BrandCheck[];
};

export type EngineHealth = {
  ok: boolean;
  generator: "fal.ai" | "mock";
  falConfigured?: boolean;
  available?: Array<"fal.ai" | "mock">;
  model?: string;
  storageRoot?: string;
};

export async function getEngineHealth(): Promise<EngineHealth> {
  const res = await fetch("/api/health", { cache: "no-store" });
  if (!res.ok) throw new Error("Engine health check failed");
  return res.json();
}

export async function createRun(brief: unknown): Promise<{ id: string }> {
  const res = await fetch(`${ENGINE_URL}/runs`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(brief),
  });
  const body = await res.json();
  if (!res.ok) {
    const detail =
      typeof body.details === "object" ? JSON.stringify(body.details) : body.details;
    throw new Error([body.error ?? "Failed to create run", detail].filter(Boolean).join(": "));
  }
  return body;
}

export async function getRun(id: string): Promise<RunStatus> {
  const res = await fetch(`${ENGINE_URL}/runs/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Run not found");
  return res.json();
}

export async function getOutputs(id: string): Promise<{
  status: string;
  brandReport?: RunStatus["brandReport"];
  outputs: RunOutput[];
}> {
  const res = await fetch(`${ENGINE_URL}/runs/${id}/outputs`, { cache: "no-store" });
  if (!res.ok) throw new Error("Outputs not found");
  return res.json();
}
