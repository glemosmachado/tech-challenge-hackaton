import { setAuthToken } from "../lib/api";

const KEY = "postech_token";

export function getToken() {
  return localStorage.getItem(KEY);
}

export function saveToken(token: string) {
  localStorage.setItem(KEY, token);
  setAuthToken(token);
}

export function clearToken() {
  localStorage.removeItem(KEY);
  setAuthToken(null);
}

export function initAuth() {
  const token = getToken();
  if (token) setAuthToken(token);
}