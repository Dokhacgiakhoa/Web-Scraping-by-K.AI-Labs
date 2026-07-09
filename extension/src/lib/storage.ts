import { StoredAuth } from "./types.js";

const AUTH_KEY = "kai_auth";

export async function getAuth(): Promise<StoredAuth | null> {
  const data = await chrome.storage.local.get(AUTH_KEY);
  return (data[AUTH_KEY] as StoredAuth) ?? null;
}

export async function setAuth(auth: StoredAuth): Promise<void> {
  await chrome.storage.local.set({ [AUTH_KEY]: auth });
}

export async function clearAuth(): Promise<void> {
  await chrome.storage.local.remove(AUTH_KEY);
}
