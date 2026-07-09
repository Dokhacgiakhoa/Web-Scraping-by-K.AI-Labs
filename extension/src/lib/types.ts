export interface AiPlan {
  action: "seo_check";
  checks: string[];
  notes: string;
}

export interface CheckFinding {
  status: "pass" | "warn" | "fail";
  details: string;
}

export interface SeoScanResult {
  onPageBasics?: CheckFinding & { data: Record<string, unknown> };
  structuredData?: CheckFinding & { data: Record<string, unknown> };
  linkAnalysis?: CheckFinding & { data: Record<string, unknown> };
  coreWebVitals?: CheckFinding & { data: Record<string, unknown> };
}

export interface StoredAuth {
  token: string;
  email: string;
  appBaseUrl: string;
}

// Messages exchanged between sidepanel <-> background <-> content scripts.
export type ExtensionMessage =
  | { type: "AUTH_TOKEN"; token: string; email: string; appBaseUrl: string }
  | { type: "GET_AUTH_STATUS" }
  | { type: "LOGOUT" }
  | { type: "ANALYZE"; prompt: string };

export interface AuthStatusResponse {
  loggedIn: boolean;
  email?: string;
}

export interface AnalyzeResponse {
  plan: AiPlan;
  result: SeoScanResult;
  pageUrl: string;
}
