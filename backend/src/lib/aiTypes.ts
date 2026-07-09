export interface PageContext {
  url: string;
  title?: string;
  isLoggedIn?: boolean; // whether the user appears authenticated on the target site
}

export interface AiPlan {
  action: "seo_check";
  checks: string[]; // e.g. ["on_page_basics", "structured_data", "link_analysis", "core_web_vitals"]
  notes: string; // short human-readable explanation of what will run, shown in the side panel
}

export interface AiProviderClient {
  classify(prompt: string, pageContext: PageContext): Promise<AiPlan>;
}

export const ALL_SEO_CHECKS = [
  "on_page_basics",
  "structured_data",
  "link_analysis",
  "core_web_vitals",
] as const;

export const SYSTEM_PROMPT = `You are the request router for "Web Scraping by K.AI Labs", a browser extension.
The current phase only supports SEO checks (data scraping is not implemented yet). Given the
user's natural-language request and basic context about the page they're on, respond with ONLY a
JSON object of this exact shape, no prose, no markdown fences:

{
  "action": "seo_check",
  "checks": ["on_page_basics" | "structured_data" | "link_analysis" | "core_web_vitals", ...],
  "notes": "one short sentence describing what you will check, in the user's language"
}

Include only the checks relevant to what the user asked; if unclear or if they ask for something
general like "check SEO", include all four checks.`;

export function parsePlan(raw: string): AiPlan {
  const cleaned = raw.trim().replace(/^```(json)?/i, "").replace(/```$/, "").trim();
  const parsed = JSON.parse(cleaned);
  if (parsed.action !== "seo_check" || !Array.isArray(parsed.checks)) {
    throw new Error("AI response did not match expected plan shape");
  }
  const checks = parsed.checks.filter((c: unknown) => ALL_SEO_CHECKS.includes(c as any));
  return {
    action: "seo_check",
    checks: checks.length > 0 ? checks : [...ALL_SEO_CHECKS],
    notes: typeof parsed.notes === "string" ? parsed.notes : "Running SEO check.",
  };
}
