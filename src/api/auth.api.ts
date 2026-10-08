/**
 * auth.api.ts — Authentication API calls
 * Login with username+password, get JWT token from backend
 * Backend response: { success, data: { token, user } }
 */
import { apiRequest, storeToken, clearToken } from "./apiClient";

export interface AuthUser {
  id: string;
  username: string;
  role: string;
  name: string;
  email: string;
  department: string;
  entityId: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

import { resetMpinLockout } from "../services/security.service";

export async function loginApi(
  username: string,
  password: string,
): Promise<LoginResponse> {
  // Backend returns: { success, data: { token, user } }
  const resp = await apiRequest<{ success: boolean; data: LoginResponse }>(
    "/auth/login",
    {
      method: "POST",
      body: { username, password },
      skipAuth: true,
    },
  );
  const result = resp?.data || (resp as any);
  const resolvedUserId = result.user?.id || result.user?.entityId || result.user?.username || username;
  await storeToken(result.token, username, result.user?.username || username, resolvedUserId);
  // Lifting any previous local MPIN lockout since user successfully verified account password
  await resetMpinLockout().catch(() => {});
  return result;
}

export async function logoutApi(): Promise<{ serverRevoked: boolean }> {
  let serverRevoked = false;
  try {
    const resp = await apiRequest<{ success: boolean; data: any }>(
      "/auth/logout",
      {
        method: "POST",
      },
    );
    if (resp?.success) {
      serverRevoked = true;
    }
  } catch (err) {
    // If backend logout cannot be reached (offline/network failure),
    // clear local credential immediately, but server revocation could not be confirmed.
    serverRevoked = false;
  } finally {
    await clearToken();
  }
  return { serverRevoked };
}

export async function getAuthenticatedSession(): Promise<AuthUser> {
  const response = await apiRequest<{ success: boolean; data: AuthUser }>("/auth/me");
  if (response?.success !== true || !response.data?.id) throw new Error("Server session validation failed.");
  return response.data;
}
