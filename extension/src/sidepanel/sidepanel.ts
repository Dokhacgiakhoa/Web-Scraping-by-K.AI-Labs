import { AnalyzeResponse, AuthStatusResponse, SeoScanResult } from "../lib/types.js";

const disconnectedView = document.getElementById("disconnected-view")!;
const connectedView = document.getElementById("connected-view")!;
const baseUrlInput = document.getElementById("base-url") as HTMLInputElement;
const connectedEmail = document.getElementById("connected-email")!;
const promptInput = document.getElementById("prompt-input") as HTMLTextAreaElement;
const analyzeBtn = document.getElementById("analyze-btn") as HTMLButtonElement;
const statusEl = document.getElementById("status")!;
const resultsEl = document.getElementById("results")!;
const resultsListEl = document.getElementById("results-list")!;

let lastResult: SeoScanResult | null = null;
let lastPageUrl = "";

async function refreshAuthView() {
  const status: AuthStatusResponse = await chrome.runtime.sendMessage({ type: "GET_AUTH_STATUS" });
  if (status.loggedIn) {
    disconnectedView.classList.add("hidden");
    connectedView.classList.remove("hidden");
    connectedEmail.textContent = status.email ?? "";
  } else {
    disconnectedView.classList.remove("hidden");
    connectedView.classList.add("hidden");
  }
}

document.getElementById("open-connect-btn")!.addEventListener("click", () => {
  const baseUrl = baseUrlInput.value.replace(/\/$/, "");
  chrome.tabs.create({ url: `${baseUrl}/extension/connect` });
});

document.getElementById("logout-btn")!.addEventListener("click", async () => {
  await chrome.runtime.sendMessage({ type: "LOGOUT" });
  await refreshAuthView();
});

function renderResults(result: SeoScanResult) {
  lastResult = result;
  resultsListEl.innerHTML = "";
  for (const [key, finding] of Object.entries(result)) {
    if (!finding) continue;
    const div = document.createElement("div");
    div.className = "check";
    div.innerHTML = `<span class="badge ${finding.status}">${finding.status.toUpperCase()}</span><strong>${key}</strong><div class="muted">${finding.details}</div>`;
    resultsListEl.appendChild(div);
  }
  resultsEl.classList.remove("hidden");
}

analyzeBtn.addEventListener("click", async () => {
  const prompt = promptInput.value.trim();
  if (!prompt) {
    statusEl.textContent = "Type what you'd like checked first.";
    return;
  }
  analyzeBtn.disabled = true;
  statusEl.textContent = "Asking AI what to check, then scanning the page...";
  resultsEl.classList.add("hidden");

  const response = await chrome.runtime.sendMessage({ type: "ANALYZE", prompt });
  analyzeBtn.disabled = false;

  if (!response.ok) {
    statusEl.textContent = `Error: ${response.error}`;
    return;
  }

  const data = response as AnalyzeResponse & { ok: true };
  lastPageUrl = data.pageUrl;
  statusEl.textContent = data.plan.notes;
  renderResults(data.result);
});

function downloadBlob(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

document.getElementById("export-json-btn")!.addEventListener("click", () => {
  if (!lastResult) return;
  downloadBlob(
    "seo-check.json",
    JSON.stringify({ url: lastPageUrl, result: lastResult }, null, 2),
    "application/json"
  );
});

document.getElementById("export-csv-btn")!.addEventListener("click", () => {
  if (!lastResult) return;
  const rows = [["check", "status", "details"]];
  for (const [key, finding] of Object.entries(lastResult)) {
    if (!finding) continue;
    rows.push([key, finding.status, finding.details.replace(/"/g, '""')]);
  }
  const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
  downloadBlob("seo-check.csv", csv, "text/csv");
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && "kai_auth" in changes) refreshAuthView();
});

refreshAuthView();
