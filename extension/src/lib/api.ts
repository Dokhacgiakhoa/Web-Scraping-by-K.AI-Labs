import { getAuth } from "./storage.js";
import { AiPlan, SeoScanResult } from "./types.js";

async function authedFetch(path: string, init?: RequestInit): Promise<Response> {
  const auth = await getAuth();
  if (!auth) throw new Error("Not connected. Click Connect in the side panel first.");

  return fetch(`${auth.appBaseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${auth.token}`,
      ...(init?.headers ?? {}),
    },
  });
}

export async function requestAiPlan(
  prompt: string,
  pageUrl: string,
  pageTitle: string
): Promise<AiPlan> {
  const res = await authedFetch("/api/ai/analyze", {
    method: "POST",
    body: JSON.stringify({ prompt, pageUrl, pageTitle }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "AI request failed");
  return data.plan as AiPlan;
}

export async function saveResult(url: string, result: SeoScanResult): Promise<void> {
  const res = await authedFetch("/api/results", {
    method: "POST",
    body: JSON.stringify({ type: "seo_check", url, result }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "Could not save result");
  }
}
