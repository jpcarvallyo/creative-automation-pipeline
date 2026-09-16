import type { BrandCheckResult } from "./types.js";

/** Case-insensitive whole-word-ish scan of campaign copy against a deny list. */
export function checkProhibitedWords(
  text: string,
  prohibitedWords: string[] | undefined,
): BrandCheckResult {
  const words = (prohibitedWords ?? []).map((w) => w.trim()).filter(Boolean);
  if (words.length === 0) {
    return {
      id: "prohibited_words",
      status: "skip",
      detail: "No prohibitedWords configured on brief.brand",
    };
  }

  const haystack = text.toLowerCase();
  const hits = words.filter((w) => {
    const needle = w.toLowerCase();
    // Word-boundary-ish: avoid matching inside longer tokens when possible
    const re = new RegExp(`(^|[^a-z0-9])${escapeRegex(needle)}([^a-z0-9]|$)`, "i");
    return re.test(haystack);
  });

  if (hits.length > 0) {
    return {
      id: "prohibited_words",
      status: "fail",
      detail: `Found prohibited term(s): ${hits.join(", ")}`,
    };
  }

  return {
    id: "prohibited_words",
    status: "pass",
    detail: `Scanned ${words.length} term(s); none found in message`,
  };
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
