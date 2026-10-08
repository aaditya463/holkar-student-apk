/**
 * security.service.ts — Hardened Biometric + MPIN + Android SecureStore Module
 * Holkar Science College ERP (Phase 7)
 *
 * Strict Security Principles:
 * 1. Passwords and plaintext MPINs are NEVER persisted anywhere.
 * 2. MPIN is stored exclusively as a cryptographic salted SHA-256 digest in Keystore-backed SecureStore.
 * 3. Biometric state is backed by Android BiometricPrompt (LocalAuthentication).
 * 4. Local unlock never bypasses backend JWT session validation or creates fake sessions.
 * 5. Logout clears the active session token; biometric/MPIN cannot restore a revoked session.
 * 6. 5-attempt rate limiting with 5-minute lockout and no hardcoded backdoors.
 */

import * as SecureStore from "expo-secure-store";
import * as LocalAuthentication from "expo-local-authentication";
import * as Crypto from "expo-crypto";
import { Platform } from "react-native";

const SECURE_KEYS = {
  JWT_TOKEN: "holkar_jwt_token",
  CACHED_USERNAME: "holkar_cached_username",
  CACHED_ROLL_NO: "holkar_cached_roll_no",
  BIOMETRIC_ENABLED: "holkar_biometric_enabled",
  MPIN_ENABLED: "holkar_mpin_enabled",
  MPIN_HASH: "holkar_mpin_hash",
  MPIN_SALT: "holkar_mpin_salt",
  MPIN_FAILED_ATTEMPTS: "holkar_mpin_failed_attempts",
  MPIN_LOCKOUT_UNTIL: "holkar_mpin_lockout_until",
  MPIN_USER_ID: "holkar_mpin_user_id",
} as const;

async function secureSet(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    try {
      localStorage.setItem(key, value);
      return;
    } catch (e: any) {
      throw new Error(`SECURE_STORAGE_ERROR: Failed to persist secure credential on web: ${e.message}`);
    }
  }
  await SecureStore.setItemAsync(key, value, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

async function secureGet(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    try {
      return localStorage.getItem(key);
    } catch (e: any) {
      throw new Error(`SECURE_STORAGE_ERROR: Failed to retrieve secure credential on web: ${e.message}`);
    }
  }
  return await SecureStore.getItemAsync(key);
}

async function secureDelete(key: string): Promise<void> {
  if (Platform.OS === "web") {
    try {
      localStorage.removeItem(key);
      return;
    } catch (e: any) {
      throw new Error(`SECURE_STORAGE_ERROR: Failed to delete secure credential on web: ${e.message}`);
    }
  }
  await SecureStore.deleteItemAsync(key);
}

// ==========================================
// 1. SESSION & TOKEN MANAGEMENT
// ==========================================

export async function getStoredSecureToken(): Promise<string | null> {
  return await secureGet(SECURE_KEYS.JWT_TOKEN);
}

export async function storeSecureToken(
  token: string,
  username?: string,
  rollNo?: string,
  userId?: string,
): Promise<void> {
  if (!token) return;
  const prevUser = await secureGet(SECURE_KEYS.CACHED_USERNAME);
  const prevUserId = await secureGet(SECURE_KEYS.MPIN_USER_ID);
  const resolvedUserId = userId || username;

  if (
    (prevUserId && resolvedUserId && prevUserId !== resolvedUserId) ||
    (prevUser && username && prevUser !== username)
  ) {
    await disableMpin();
    await setBiometricAuthEnabled(false);
  }

  await secureSet(SECURE_KEYS.JWT_TOKEN, token);
  if (username) await secureSet(SECURE_KEYS.CACHED_USERNAME, username);
  if (rollNo) await secureSet(SECURE_KEYS.CACHED_ROLL_NO, rollNo);
  if (resolvedUserId) await secureSet(SECURE_KEYS.MPIN_USER_ID, resolvedUserId);
}

export async function clearStoredSecureToken(): Promise<void> {
  await secureDelete(SECURE_KEYS.JWT_TOKEN);
}

export async function getCachedSessionUser(): Promise<{
  username: string | null;
  rollNo: string | null;
  userId: string | null;
}> {
  const username = await secureGet(SECURE_KEYS.CACHED_USERNAME);
  const rollNo = await secureGet(SECURE_KEYS.CACHED_ROLL_NO);
  const userId = await secureGet(SECURE_KEYS.MPIN_USER_ID);
  return { username, rollNo, userId };
}

// ==========================================
// 2. BIOMETRIC AUTHENTICATION
// ==========================================

export interface BiometricCapability {
  hasHardware: boolean;
  isEnrolled: boolean;
  supportedTypes: LocalAuthentication.AuthenticationType[];
  primaryTypeName: string;
}

export async function checkBiometricCapability(): Promise<BiometricCapability> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = hasHardware
      ? await LocalAuthentication.isEnrolledAsync()
      : false;
    const supportedTypes = hasHardware
      ? await LocalAuthentication.supportedAuthenticationTypesAsync()
      : [];

    let primaryTypeName = "Biometrics";
    if (
      supportedTypes.includes(
        LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
      )
    ) {
      primaryTypeName = "Face Recognition";
    } else if (
      supportedTypes.includes(
        LocalAuthentication.AuthenticationType.FINGERPRINT,
      )
    ) {
      primaryTypeName = "Fingerprint";
    } else if (
      supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)
    ) {
      primaryTypeName = "Iris Recognition";
    }

    return { hasHardware, isEnrolled, supportedTypes, primaryTypeName };
  } catch {
    return {
      hasHardware: false,
      isEnrolled: false,
      supportedTypes: [],
      primaryTypeName: "Biometrics",
    };
  }
}

export async function isBiometricAuthEnabled(): Promise<boolean> {
  const val = await secureGet(SECURE_KEYS.BIOMETRIC_ENABLED);
  return val === "true";
}

export async function setBiometricAuthEnabled(enabled: boolean): Promise<void> {
  await secureSet(SECURE_KEYS.BIOMETRIC_ENABLED, enabled ? "true" : "false");
}

export interface BiometricPromptResult {
  success: boolean;
  error?: string;
  cancelled?: boolean;
}

export async function promptBiometricAuth(
  promptMessage: string = "Verify identity to sign in to Holkar ERP",
): Promise<BiometricPromptResult> {
  const capability = await checkBiometricCapability();
  if (!capability.hasHardware) {
    return {
      success: false,
      error: "Device does not support biometric authentication hardware.",
    };
  }
  if (!capability.isEnrolled) {
    return {
      success: false,
      error:
        "No biometrics enrolled. Please set up fingerprint/face unlock in device settings.",
    };
  }

  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel: "Use Password",
      fallbackLabel: "Use Password",
      disableDeviceFallback: false,
    });

    if (result.success) {
      return { success: true };
    }

    if (
      result.error === "user_cancel" ||
      result.error === "system_cancel" ||
      result.error === "app_cancel"
    ) {
      return {
        success: false,
        cancelled: true,
        error: "Biometric authentication cancelled by user.",
      };
    }

    if (result.error === "lockout") {
      return {
        success: false,
        error:
          "Biometric sensor temporarily locked. Please unlock device or use password.",
      };
    }

    return {
      success: false,
      error: result.warning || result.error || "Biometric verification failed.",
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Biometric authentication error.",
    };
  }
}

// ==========================================
// 3. MPIN MANAGEMENT (6-DIGIT SECURE PIN)
// ==========================================

const MAX_MPIN_FAILED_ATTEMPTS = 5;
const MPIN_LOCKOUT_MS = 5 * 60 * 1000; // 5 minutes

export interface MpinStatus {
  isEnabled: boolean;
  isLockedOut: boolean;
  remainingSeconds: number;
  failedAttempts: number;
}

export async function getMpinStatus(): Promise<MpinStatus> {
  const enabledVal = await secureGet(SECURE_KEYS.MPIN_ENABLED);
  const isEnabled = enabledVal === "true";

  const lockoutRaw = await secureGet(SECURE_KEYS.MPIN_LOCKOUT_UNTIL);
  const lockoutUntil = lockoutRaw ? Number(lockoutRaw) : 0;
  const now = Date.now();

  const isLockedOut = lockoutUntil > now;
  const remainingSeconds = isLockedOut
    ? Math.ceil((lockoutUntil - now) / 1000)
    : 0;

  const failedAttemptsRaw = await secureGet(SECURE_KEYS.MPIN_FAILED_ATTEMPTS);
  const failedAttempts = failedAttemptsRaw ? Number(failedAttemptsRaw) : 0;

  return {
    isEnabled,
    isLockedOut,
    remainingSeconds,
    failedAttempts,
  };
}

/**
 * Validates MPIN strength.
 * Rejects:
 * - Non 6-digit inputs
 * - Trivial repeats: 000000, 111111, 222222, ...
 * - Sequential patterns: 123456, 654321, 012345, 543210
 * - Common patterns: 121212, 112233
 */
export function validateMpinStrength(pin: string): {
  valid: boolean;
  reason?: string;
} {
  if (!/^\d{6}$/.test(pin)) {
    return { valid: false, reason: "MPIN must be exactly 6 numeric digits." };
  }

  // Trivial repeats (e.g. 000000, 111111)
  if (/^(\d)\1{5}$/.test(pin)) {
    return {
      valid: false,
      reason:
        "MPIN cannot consist of all identical digits (e.g. 000000, 111111).",
    };
  }

  // Sequential forwards and backwards
  const forwardSeq = "0123456789";
  const backwardSeq = "9876543210";
  if (forwardSeq.includes(pin) || backwardSeq.includes(pin)) {
    return {
      valid: false,
      reason: "MPIN cannot be a sequential series (e.g. 123456, 654321).",
    };
  }

  // Simple patterns
  if (
    pin === "121212" ||
    pin === "112233" ||
    pin === "123123" ||
    pin === "135791"
  ) {
    return {
      valid: false,
      reason: "MPIN is too simple. Please choose an unpredictable combination.",
    };
  }

  return { valid: true };
}

async function computeMpinHash(pin: string, salt: string): Promise<string> {
  // Key stretching: 10,000 iterative SHA-256 rounds to prevent brute-force attacks on 6-digit PINs
  let current = `holkar_mpin:${salt}:${pin}`;
  for (let i = 0; i < 10000; i++) {
    current = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `${current}:${salt}:${i}`,
    );
  }
  return current;
}

export async function setupMpin(
  newPin: string,
  confirmPin: string,
  userId?: string,
): Promise<{ success: boolean; error?: string }> {
  if (newPin !== confirmPin) {
    return { success: false, error: "MPIN and Confirm MPIN do not match." };
  }

  const check = validateMpinStrength(newPin);
  if (!check.valid) {
    return { success: false, error: check.reason };
  }

  try {
    const activeUserId = userId || (await secureGet(SECURE_KEYS.MPIN_USER_ID));
    if (!activeUserId) return { success: false, error: "A current authenticated user is required to bind MPIN." };
    const saltBytes = await Crypto.getRandomBytesAsync(16);
    const salt = Array.from(saltBytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const hash = await computeMpinHash(newPin, salt);

    await secureSet(SECURE_KEYS.MPIN_SALT, salt);
    await secureSet(SECURE_KEYS.MPIN_HASH, hash);
    await secureSet(SECURE_KEYS.MPIN_ENABLED, "true");
    await secureSet(SECURE_KEYS.MPIN_FAILED_ATTEMPTS, "0");
    await secureDelete(SECURE_KEYS.MPIN_LOCKOUT_UNTIL);
    await secureSet(SECURE_KEYS.MPIN_USER_ID, activeUserId);

    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to configure MPIN.",
    };
  }
}

export async function changeMpin(
  currentPin: string,
  newPin: string,
  confirmPin: string,
): Promise<{ success: boolean; error?: string }> {
  const verifyRes = await verifyMpin(currentPin);
  if (!verifyRes.success) {
    return {
      success: false,
      error: verifyRes.error || "Current MPIN is incorrect.",
    };
  }

  return await setupMpin(newPin, confirmPin);
}

export interface MpinVerificationResult {
  success: boolean;
  error?: string;
  lockedOut?: boolean;
  remainingSeconds?: number;
  remainingAttempts?: number;
}

export async function verifyMpin(
  inputPin: string,
  expectedUserId?: string,
): Promise<MpinVerificationResult> {
  const status = await getMpinStatus();
  if (!status.isEnabled) {
    return { success: false, error: "MPIN is not enabled on this device." };
  }

  const targetUserId =
    expectedUserId ||
    (await secureGet(SECURE_KEYS.CACHED_USERNAME)) ||
    (await secureGet(SECURE_KEYS.CACHED_ROLL_NO));
  const boundUserId = await secureGet(SECURE_KEYS.MPIN_USER_ID);

  if (!expectedUserId || !targetUserId || !boundUserId || targetUserId !== boundUserId || expectedUserId !== boundUserId) {
    return {
      success: false,
      error: "MPIN requires the currently authenticated matching account. Please sign in with your password.",
    };
  }

  if (status.isLockedOut) {
    const mins = Math.floor(status.remainingSeconds / 60);
    const secs = status.remainingSeconds % 60;
    const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    return {
      success: false,
      lockedOut: true,
      remainingSeconds: status.remainingSeconds,
      error: `Too many failed attempts. MPIN locked for ${timeStr}. Please sign in with your password.`,
    };
  }

  const salt = await secureGet(SECURE_KEYS.MPIN_SALT);
  const storedHash = await secureGet(SECURE_KEYS.MPIN_HASH);

  if (!salt || !storedHash) {
    return {
      success: false,
      error: "MPIN security data corrupted. Please re-setup MPIN.",
    };
  }

  const computed = await computeMpinHash(inputPin, salt);
  if (computed === storedHash) {
    // Reset failed counter
    await secureSet(SECURE_KEYS.MPIN_FAILED_ATTEMPTS, "0");
    await secureDelete(SECURE_KEYS.MPIN_LOCKOUT_UNTIL);
    return { success: true };
  }

  // Failed attempt
  const nextAttempts = status.failedAttempts + 1;
  await secureSet(SECURE_KEYS.MPIN_FAILED_ATTEMPTS, String(nextAttempts));

  if (nextAttempts >= MAX_MPIN_FAILED_ATTEMPTS) {
    const lockoutUntil = Date.now() + MPIN_LOCKOUT_MS;
    await secureSet(SECURE_KEYS.MPIN_LOCKOUT_UNTIL, String(lockoutUntil));
    return {
      success: false,
      lockedOut: true,
      remainingSeconds: Math.ceil(MPIN_LOCKOUT_MS / 1000),
      error:
        "Maximum attempts exceeded. MPIN is locked for 5 minutes. Please use your password to sign in.",
    };
  }

  const remaining = MAX_MPIN_FAILED_ATTEMPTS - nextAttempts;
  return {
    success: false,
    remainingAttempts: remaining,
    error: `Incorrect MPIN. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining before temporary lockout.`,
  };
}

export async function disableMpin(): Promise<void> {
  await secureDelete(SECURE_KEYS.MPIN_ENABLED);
  await secureDelete(SECURE_KEYS.MPIN_HASH);
  await secureDelete(SECURE_KEYS.MPIN_SALT);
  await secureDelete(SECURE_KEYS.MPIN_FAILED_ATTEMPTS);
  await secureDelete(SECURE_KEYS.MPIN_LOCKOUT_UNTIL);
  await secureDelete(SECURE_KEYS.MPIN_USER_ID);
}

/**
 * Resets MPIN lockout counter upon successful full password login
 */
export async function resetMpinLockout(): Promise<void> {
  await secureSet(SECURE_KEYS.MPIN_FAILED_ATTEMPTS, "0");
  await secureDelete(SECURE_KEYS.MPIN_LOCKOUT_UNTIL);
}

export const securityService = {
  getStoredSecureToken,
  storeSecureToken,
  clearStoredSecureToken,
  getCachedSessionUser,
  checkBiometricCapability,
  isBiometricAuthEnabled,
  setBiometricAuthEnabled,
  promptBiometricAuth,
  getMpinStatus,
  validateMpinStrength,
  setupMpin,
  changeMpin,
  verifyMpin,
  disableMpin,
  resetMpinLockout,
};
