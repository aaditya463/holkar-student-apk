/**
 * offlineAttendanceQueue.ts — Holkar Student Mobile App
 *
 * SECURITY ARCHITECTURE (PHASE 8B-2F):
 * Student self-service offline QR attendance is strictly DISABLED.
 * A student-controlled device cannot prove a QR credential was scanned during its
 * ephemeral 20-second validity window while completely offline.
 *
 * No presentation tokens or credentials are stored in plaintext AsyncStorage.
 * Legacy offline queue records are safely cleaned up on app initialization.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface OfflineQueueItem {
  clientEventId: string;
  sessionId?: string;
  status: "PENDING" | "SYNCED" | "REJECTED";
  statusMessage?: string;
  subjectName?: string;
}

const STORAGE_KEY = "@holkar_offline_attendance_queue_v1";

/**
 * Safely purge legacy offline queue records from on-device storage.
 * Ensures no unverified credentials or raw presentation tokens linger in AsyncStorage.
 */
export async function cleanupLegacyOfflineQueue(): Promise<{
  cleaned: number;
}> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const count = Array.isArray(parsed) ? parsed.length : 0;
      await AsyncStorage.removeItem(STORAGE_KEY);
      return { cleaned: count };
    }
  } catch (err) {
    console.warn("Failed to clean up legacy offline queue:", err);
  }
  return { cleaned: 0 };
}

/**
 * Disabled: Student offline QR attendance is not supported for security integrity.
 * Always returns empty array.
 */
export async function getOfflineQueue(): Promise<OfflineQueueItem[]> {
  return [];
}

/**
 * Disabled: Throws an error to prevent storing attendance credentials in device storage.
 */
export async function enqueueOfflineAttendance(_params: {
  sessionId?: string;
  token?: string;
  location?: { latitude: number; longitude: number; accuracy?: number };
  subjectName?: string;
}): Promise<never> {
  throw new Error(
    "Student self-service offline QR attendance is disabled for security. A live network connection is required to verify attendance.",
  );
}

/**
 * Synchronize offline queue — Cleans legacy records and returns zero count.
 */
export async function syncOfflineQueue(): Promise<{
  synced: number;
  rejected: number;
  pending: number;
}> {
  await cleanupLegacyOfflineQueue();
  return { synced: 0, rejected: 0, pending: 0 };
}

/**
 * Clear any residual queue entries from storage.
 */
export async function clearConfirmedSyncedQueue(): Promise<void> {
  await cleanupLegacyOfflineQueue();
}
