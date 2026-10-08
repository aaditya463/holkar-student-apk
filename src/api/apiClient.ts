/**
 * Holkar Science College ERP — Mobile API Client
 * Central fetch wrapper for all backend calls.
 * Auto-attaches JWT token, handles 401 session expiry.
 *
 * In development (__DEV__ === true): Connects to local development ERP gateway over Wi-Fi.
 * In production release builds (__DEV__ === false): Strictly connects to secure production HTTPS endpoint.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

declare const __DEV__: boolean;

const PROD_API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  "https://holkar-erp-backend.onrender.com/api/v1";

export function getBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  return PROD_API_URL;
}

export const BASE_URL = getBaseUrl();
export const TOKEN_KEY = "@holkar_jwt_token";

// Pre-emptive warmup ping to wake up cloud backend immediately
export function warmupBackendServer(): void {
  try {
    const healthUrl = `${getBaseUrl()}/health`;
    fetch(healthUrl, { method: "GET" }).catch(() => {});
  } catch {}
}

// Auto-trigger warmup once at import time
warmupBackendServer();

import {
  getStoredSecureToken,
  storeSecureToken,
  clearStoredSecureToken,
} from "../services/security.service";

export async function getStoredToken(): Promise<string | null> {
  try {
    const secureToken = await getStoredSecureToken();
    if (secureToken) return secureToken;

    // Check legacy unencrypted storage for seamless one-time migration
    const legacyToken = await AsyncStorage.getItem(TOKEN_KEY);
    if (legacyToken) {
      await storeSecureToken(legacyToken);
      await AsyncStorage.removeItem(TOKEN_KEY).catch(() => {});
      return legacyToken;
    }
    return null;
  } catch {
    return null;
  }
}

export async function storeToken(
  token: string,
  username?: string,
  rollNo?: string,
  userId?: string,
): Promise<void> {
  await storeSecureToken(token, username, rollNo, userId);
  // Guarantee unencrypted plain storage is purged
  await AsyncStorage.removeItem(TOKEN_KEY).catch(() => {});
}

export async function clearToken(): Promise<void> {
  await clearStoredSecureToken();
  await AsyncStorage.removeItem(TOKEN_KEY).catch(() => {});
}

let _onSessionExpired: (() => void) | null = null;
export function setSessionExpiredHandler(cb: () => void) {
  _onSessionExpired = cb;
}

interface ApiOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: any;
  skipAuth?: boolean;
}

export async function apiRequest<T = any>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const { method = "GET", body, skipAuth = false } = options;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (!skipAuth) {
    const token = await getStoredToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const serializedBody = body
    ? typeof body === "string"
      ? body
      : JSON.stringify(body)
    : undefined;

  let response: Response;
  const currentBaseUrl = getBaseUrl();
  try {
    response = await fetch(`${currentBaseUrl}${path}`, {
      method,
      headers,
      body: serializedBody,
    });
  } catch (netErr: any) {
    throw new Error(
      "Unable to connect to Holkar ERP servers. Please check your internet connection and try again.",
    );
  }

  if (response.status === 401) {
    await clearToken();
    if (_onSessionExpired) _onSessionExpired();
    throw new Error("Session expired. Please log in again.");
  }

  if (!response.ok) {
    const errText = await response.text();
    let message = `API Error ${response.status}`;
    try {
      const parsed = JSON.parse(errText);
      message = parsed.message || parsed.error || message;
    } catch {
      if (errText) message = errText;
    }
    throw new Error(message);
  }

  return response.json();
}
