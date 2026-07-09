// Runs only on {appBaseUrl}/extension/connect (see manifest.json content_scripts.matches).
// Self-contained on purpose: content scripts declared in the manifest cannot import other
// modules, so this file has no imports and duplicates the tiny message shape it needs.
(function relayAuthToken() {
  const el = document.getElementById("kai-connect-token");
  const token = el?.getAttribute("data-token");
  if (!token) return;

  chrome.runtime.sendMessage({
    type: "AUTH_TOKEN",
    token,
    email: document.querySelector("strong")?.textContent ?? "",
    appBaseUrl: window.location.origin,
  });
})();
