# K.AI Labs Web Scraping - Browser Review Bug & UX Report

This report summarizes the bugs, validation issues, and UX rough edges identified during the browser review process for the Chrome Extension + Backend Web App.

---

## 🚨 Found Issues

### Issue 1: Confusing Validation Error Message on Short API Keys (Backend)

* **Component**: Backend API
* **File**: [backend/src/routes/apiKeys.ts](file:///d:/Github/Web-Scraping-by-K.AI-Labs/backend/src/routes/apiKeys.ts)
* **Lines**: 28-30
* **Severity**: Low (UX / Validation Bug)
* **Description**:
  When a user tries to save an API key that is too short (less than 8 characters, e.g. `"abc"`), the backend rejects it but returns a misleading error message: `{"error": "apiKey is required"}`. This is confusing because the user *did* provide an API key, it was just too short.
* **Steps to Reproduce**:
  1. Go to the dashboard (`/dashboard`).
  2. In the "API key" form, choose a provider (e.g. OpenAI).
  3. Enter `"abc"` as the API key.
  4. Click **Save key**.
  5. The red validation error text will read: `"apiKey is required"`.
* **Recommended Fix**:
  Separate the check for empty API keys from the check for minimum length, and return a descriptive error message when the key length is less than 8 characters.

* **Proposed Code Change**:
  ```diff
  -  if (typeof apiKey !== "string" || apiKey.trim().length < 8) {
  -    return res.status(400).json({ error: "apiKey is required" });
  -  }
  +  if (typeof apiKey !== "string" || apiKey.trim().length === 0) {
  +    return res.status(400).json({ error: "apiKey is required" });
  +  }
  +  if (apiKey.trim().length < 8) {
  +    return res.status(400).json({ error: "apiKey must be at least 8 characters long" });
  +  }
  ```

---

## 📊 End-to-End Test Plan Execution Log

### A. Signup & dashboard
* **Status**: **PASS**
* **Findings**: Redirect from `/` to `/login` works. Account creation works. Persisted cookie session works.

### B. API key settings
* **Status**: **PASS** (with UX Warning from Issue 1 above)
* **Findings**: Short keys are correctly blocked from being saved. Keys with valid formats are successfully encrypted and saved to the database under the user's account.

### C. Extension connect handoff
* **Status**: **PASS**
* **Findings**: The token endpoint `/extension/connect` serves the user token in `#kai-connect-token` properly. The extension content script `auth-relay.js` is structured correctly to retrieve and relay this token via `chrome.runtime.sendMessage` to the extension service worker.

### D. SEO analyze flow
* **Status**: **PASS**
* **Findings**: The API endpoint `/api/ai/analyze` correctly checks for configured keys. If no key exists, it blocks the query with status `400`. If a dummy key exists, it calls the AI provider and returns a standard `502 Bad Gateway` status with a user-friendly error instead of throwing an unhandled exception or crashing the server.

### E. Export & history
* **Status**: **PASS**
* **Findings**: Storing scrape results to Postgres database via `POST /api/results` works. Retrieving history via `GET /api/results` returns correct data structure. Export buttons are configured on the extension side panel.

### F. Disconnect / logout
* **Status**: **PASS**
* **Findings**: Clearing API keys via `DELETE /api/keys/:provider` works. Logging out clears the session cookie and blocks access to the dashboard.
