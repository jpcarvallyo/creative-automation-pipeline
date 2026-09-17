export type BrandCheck = { id: string; status: string; detail: string };

export type BrandReport = {
  ok: boolean;
  checks: BrandCheck[];
};

export type CheckCounts = { pass: number; fail: number; skip: number };

/** Aggregate brand checks by id for CLI printing. */
export function summarizeBrandReport(
  report: BrandReport,
): Map<string, CheckCounts> {
  const summary = new Map<string, CheckCounts>();
  for (const c of report.checks) {
    const row = summary.get(c.id) ?? { pass: 0, fail: 0, skip: 0 };
    if (c.status === "pass" || c.status === "fail" || c.status === "skip") {
      row[c.status] += 1;
    }
    summary.set(c.id, row);
  }
  return summary;
}

export function formatBrandSummary(report: BrandReport): string[] {
  const lines = [`Brand report: ${report.ok ? "OK" : "ISSUES"}`];
  for (const [id, row] of summarizeBrandReport(report)) {
    lines.push(`  ${id}: pass=${row.pass} fail=${row.fail} skip=${row.skip}`);
  }
  return lines;
}
