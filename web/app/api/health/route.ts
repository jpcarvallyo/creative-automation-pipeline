import { NextResponse } from "next/server";

const ENGINE_URL =
  process.env.NEXT_PUBLIC_ENGINE_URL?.replace(/\/$/, "") ?? "http://localhost:3001";

/** Same-origin proxy so the console can read engine health reliably. */
export async function GET() {
  try {
    const res = await fetch(`${ENGINE_URL}/health`, { cache: "no-store" });
    const body = await res.json();
    return NextResponse.json(body, { status: res.status });
  } catch {
    return NextResponse.json({ ok: false, generator: "offline" }, { status: 503 });
  }
}
