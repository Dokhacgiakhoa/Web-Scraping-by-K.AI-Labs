import { clearAuth, getAuth, setAuth } from "../lib/storage.js";
import { requestAiPlan, saveResult } from "../lib/api.js";
import { seoScanInPage } from "./seoScan.js";
import { AnalyzeResponse, AuthStatusResponse, ExtensionMessage } from "../lib/types.js";

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
});

async function handleAnalyze(prompt: string): Promise<AnalyzeResponse> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url) throw new Error("No active tab found");

  const plan = await requestAiPlan(prompt, tab.url, tab.title ?? "");

  const [injection] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: seoScanInPage,
    args: [plan.checks],
  });

  const result = injection.result;
  if (!result) throw new Error("Scan produced no result");

  await saveResult(tab.url, result);

  return { plan, result, pageUrl: tab.url };
}

chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  (async () => {
    switch (message.type) {
      case "AUTH_TOKEN": {
        await setAuth({ token: message.token, email: message.email, appBaseUrl: message.appBaseUrl });
        sendResponse({ ok: true });
        break;
      }
      case "GET_AUTH_STATUS": {
        const auth = await getAuth();
        const response: AuthStatusResponse = { loggedIn: !!auth, email: auth?.email };
        sendResponse(response);
        break;
      }
      case "LOGOUT": {
        await clearAuth();
        sendResponse({ ok: true });
        break;
      }
      case "ANALYZE": {
        try {
          const result = await handleAnalyze(message.prompt);
          sendResponse({ ok: true, ...result });
        } catch (err) {
          sendResponse({ ok: false, error: err instanceof Error ? err.message : String(err) });
        }
        break;
      }
    }
  })();
  return true; // keep the message channel open for the async response
});
