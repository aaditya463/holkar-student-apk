/**
 * AppContext.tsx — Central Auth + Comprehensive Student Data Context
 * Single source of truth for the Holkar Student Mobile App.
 * Strictly consumes authenticated endpoints from the shared backend.
 */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { loginApi, logoutApi, getAuthenticatedSession } from "../api/auth.api";
import {
  getStudentProfile,
  getAttendance,
  getTimetable,
  getFees,
  getResults,
  getNotifications,
  getWarningNotice,
  getAdmitCard,
  getMyGrievances,
  getAcademicHolidays,
  markNotificationRead,
  markAllNotificationsRead,
  ApiStudentProfile,
  ApiAttendanceSummary,
  ApiWeeklyTimetable,
  ApiFeeInstallment,
  ApiFeeLedgerItem,
  ApiSemesterResult,
  ApiNotification,
  ApiWarningNotice,
  ApiAdmitCard,
  ApiGrievanceTicket,
  ApiHolidayEvent,
} from "../api/student.api";
import {
  getStoredToken,
  clearToken,
  setSessionExpiredHandler,
} from "../api/apiClient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import {
  isBiometricAuthEnabled,
  promptBiometricAuth,
  getMpinStatus,
  verifyMpin,
  getCachedSessionUser,
  MpinVerificationResult,
} from "../services/security.service";
import { cleanupLegacyOfflineQueue } from "../utils/offlineAttendanceQueue";

/**
 * Storage Security Classification:
 * 1. SECURE_TIER (Hardware-backed expo-secure-store):
 *    - JWT Auth Token
 *    - Cached Username / Roll No
 *    - Salted MPIN digest and attempt rate-limiter state
 * 2. CACHE_TIER (Account-Namespaced AsyncStorage):
 *    - Non-secret UI offline datasets (timetable, holiday events, notices)
 *    - Strictly bound to authenticated student ID envelope
 *    - Plain auth tokens are NEVER stored in AsyncStorage
 */
const MOBILE_DATA_INTEGRITY_VERSION = 2;
const INTEGRITY_VERSION_KEY = "@holkar_integrity_version";
const LEGACY_STUDENT_DATA_CACHE_KEY = "@holkar_student_data_cache";
const getNamespacedCacheKey = (studentId: string) =>
  `@holkar_student_cache_v2:${studentId}`;

interface CacheEnvelope<T> {
  studentId: string;
  schemaVersion: number;
  lastSyncedAt: string;
  data: T;
}

interface FeeState {
  summary: {
    totalCourseFee: number;
    totalPaid: number;
    pendingAmount: number;
    status: string;
    nextDueDate: string;
  };
  installments: ApiFeeInstallment[];
  ledger: ApiFeeLedgerItem[];
}

interface AppState {
  // Auth
  isLoading: boolean;
  isLoggedIn: boolean;
  authError: string | null;
  quickAuthAvailable: boolean;
  cachedUsername: string | null;

  // Student Data (All dynamically from PostgreSQL backend)
  student: ApiStudentProfile | null;
  attendance: ApiAttendanceSummary | null;
  timetable: ApiWeeklyTimetable;
  fees: FeeState;
  results: ApiSemesterResult[];
  notifications: ApiNotification[];
  warningNotice: ApiWarningNotice | null;
  admitCard: ApiAdmitCard | null;
  grievances: ApiGrievanceTicket[];
  holidays: ApiHolidayEvent[];

  // App UI State
  dataLoading: boolean;
  dataError: string | null;
  lastSyncedAt: string | null;

  // Actions
  login: (username: string, password: string) => Promise<void>;
  unlockSessionWithBiometric: () => Promise<{
    success: boolean;
    error?: string;
  }>;
  unlockSessionWithMpin: (pin: string) => Promise<MpinVerificationResult>;
  switchToPasswordLogin: () => void;
  logout: () => Promise<void>;
  refreshData: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  refreshHolidays: () => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
}

const defaultFeeState: FeeState = {
  summary: {
    totalCourseFee: 0,
    totalPaid: 0,
    pendingAmount: 0,
    status: "UNAVAILABLE",
    nextDueDate: "—",
  },
  installments: [],
  ledger: [],
};

const AppContext = createContext<AppState | null>(null);

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [quickAuthAvailable, setQuickAuthAvailable] = useState(false);
  const [cachedUsername, setCachedUsername] = useState<string | null>(null);

  // Student state
  const [student, setStudent] = useState<ApiStudentProfile | null>(null);
  const [attendance, setAttendance] = useState<ApiAttendanceSummary | null>(
    null,
  );
  const [timetable, setTimetable] = useState<ApiWeeklyTimetable>({});
  const [fees, setFees] = useState<FeeState>(defaultFeeState);
  const [results, setResults] = useState<ApiSemesterResult[]>([]);
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [warningNotice, setWarningNotice] = useState<ApiWarningNotice | null>(
    null,
  );
  const [admitCard, setAdmitCard] = useState<ApiAdmitCard | null>(null);
  const [grievances, setGrievances] = useState<ApiGrievanceTicket[]>([]);
  const [holidays, setHolidays] = useState<ApiHolidayEvent[]>([]);

  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  // Safe purge of legacy unversioned/demo cache keys on start
  const purgeLegacyCache = useCallback(async () => {
    try {
      const currentVer = await AsyncStorage.getItem(INTEGRITY_VERSION_KEY);
      if (currentVer !== String(MOBILE_DATA_INTEGRITY_VERSION)) {
        await AsyncStorage.removeItem(LEGACY_STUDENT_DATA_CACHE_KEY);
        await AsyncStorage.setItem(
          INTEGRITY_VERSION_KEY,
          String(MOBILE_DATA_INTEGRITY_VERSION),
        );
      }
    } catch {}
  }, []);

  const resetAllStudentData = useCallback(() => {
    setIsLoggedIn(false);
    setQuickAuthAvailable(false);
    setCachedUsername(null);
    setStudent(null);
    setAttendance(null);
    setTimetable({});
    setFees(defaultFeeState);
    setResults([]);
    setNotifications([]);
    setWarningNotice(null);
    setAdmitCard(null);
    setGrievances([]);
    setHolidays([]);
    setAuthError(null);
    setLastSyncedAt(null);
  }, []);

  // Auto-logout when backend returns 401 Unauthorized
  useEffect(() => {
    setSessionExpiredHandler(() => {
      resetAllStudentData();
    });
  }, [resetAllStudentData]);

  // Account-namespaced cache hydration
  const hydrateLocalCache = useCallback(async (targetStudentId?: string) => {
    try {
      if (!targetStudentId) return;
      const cacheKey = getNamespacedCacheKey(targetStudentId);
      const rawEnvelope = await AsyncStorage.getItem(cacheKey);
      if (rawEnvelope) {
        const envelope: CacheEnvelope<any> = JSON.parse(rawEnvelope);
        if (
          envelope &&
          envelope.schemaVersion === MOBILE_DATA_INTEGRITY_VERSION &&
          envelope.studentId === targetStudentId
        ) {
          const cached = envelope.data;
          if (cached.student) setStudent(cached.student);
          if (cached.attendance) setAttendance(cached.attendance);
          if (cached.timetable) setTimetable(cached.timetable);
          if (cached.fees) setFees(cached.fees);
          if (cached.results) setResults(cached.results);
          if (cached.notifications) setNotifications(cached.notifications);
          if (cached.holidays && Array.isArray(cached.holidays))
            setHolidays(cached.holidays);
          if (envelope.lastSyncedAt) setLastSyncedAt(envelope.lastSyncedAt);
        }
      }
    } catch {}
  }, []);

  const loadAllStudentData = useCallback(async () => {
    setDataLoading(true);
    setDataError(null);
    try {
      const [
        profRes,
        attRes,
        ttRes,
        feesRes,
        resRes,
        notifRes,
        warnRes,
        admitRes,
        grievRes,
        holiRes,
      ] = await Promise.allSettled([
        getStudentProfile(),
        getAttendance(),
        getTimetable(),
        getFees(),
        getResults(),
        getNotifications(),
        getWarningNotice(),
        getAdmitCard(),
        getMyGrievances(),
        getAcademicHolidays(),
      ]);

      let loadedStudent: ApiStudentProfile | null = null;
      if (profRes.status === "fulfilled") {
        loadedStudent = profRes.value;
        setStudent(profRes.value);
      }
      if (attRes.status === "fulfilled") setAttendance(attRes.value);
      if (ttRes.status === "fulfilled") setTimetable(ttRes.value);
      if (feesRes.status === "fulfilled") setFees(feesRes.value);
      if (resRes.status === "fulfilled") setResults(resRes.value);
      if (notifRes.status === "fulfilled") setNotifications(notifRes.value);
      if (warnRes.status === "fulfilled") setWarningNotice(warnRes.value);
      if (admitRes.status === "fulfilled") setAdmitCard(admitRes.value);
      if (grievRes.status === "fulfilled") setGrievances(grievRes.value);
      if (holiRes.status === "fulfilled") setHolidays(holiRes.value);

      if (profRes.status === "rejected") {
        setDataError(
          "Could not load student profile. Check network connection.",
        );
      } else if (loadedStudent && loadedStudent.id) {
        // Persist account-namespaced cache snapshot with metadata
        const syncTimestamp = new Date().toISOString();
        setLastSyncedAt(syncTimestamp);
        const snapshot = {
          student: loadedStudent,
          attendance: attRes.status === "fulfilled" ? attRes.value : undefined,
          timetable: ttRes.status === "fulfilled" ? ttRes.value : undefined,
          fees: feesRes.status === "fulfilled" ? feesRes.value : undefined,
          results: resRes.status === "fulfilled" ? resRes.value : undefined,
          notifications:
            notifRes.status === "fulfilled" ? notifRes.value : undefined,
          holidays: holiRes.status === "fulfilled" ? holiRes.value : undefined,
        };
        const envelope: CacheEnvelope<typeof snapshot> = {
          studentId: loadedStudent.id,
          schemaVersion: MOBILE_DATA_INTEGRITY_VERSION,
          lastSyncedAt: syncTimestamp,
          data: snapshot,
        };
        const cacheKey = getNamespacedCacheKey(loadedStudent.id);
        AsyncStorage.setItem(cacheKey, JSON.stringify(envelope)).catch(
          () => {},
        );
      }
    } catch (e: any) {
      setDataError(e.message || "Failed to load student data");
    } finally {
      setDataLoading(false);
    }
  }, []);

  // ⚡ HARDENED SECURE STARTUP: Check stored Keystore JWT and MPIN/Biometric Lock
  useEffect(() => {
    (async () => {
      try {
        // Purge any legacy unversioned/demo cache on start/upgrade
        await purgeLegacyCache();

        // Clean up any legacy offline attendance queue entries safely
        await cleanupLegacyOfflineQueue().catch(() => {});

        const token = await getStoredToken();
        const [bioEnabled, mpinStatus, cachedUser] = await Promise.all([
          isBiometricAuthEnabled(),
          getMpinStatus(),
          getCachedSessionUser(),
        ]);

        if (token) {
          const session = await getAuthenticatedSession();
          if (session.role !== "STUDENT") throw new Error("Student session required.");
          const studentId = (cachedUser.username ||
            cachedUser.rollNo ||
            undefined) as string | undefined;
          // If biometric or MPIN is enabled, lock app for quick auth (do not auto-open)
          if (bioEnabled || mpinStatus.isEnabled) {
            setQuickAuthAvailable(true);
            setCachedUsername(cachedUser.username || cachedUser.rollNo);
            setIsLoggedIn(false);
            setIsLoading(false);
            return;
          }

          // Otherwise, proceed with fast path
          setIsLoggedIn(true);
          await hydrateLocalCache(studentId);
          setIsLoading(false);
          loadAllStudentData().catch(() => {});
          return;
        } else {
          setQuickAuthAvailable(false);
          setIsLoggedIn(false);
        }
      } catch {
        setIsLoggedIn(false);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [purgeLegacyCache, hydrateLocalCache, loadAllStudentData]);

  const login = useCallback(
    async (username: string, password: string) => {
      setAuthError(null);
      setIsLoading(true);
      try {
        await loginApi(username, password);
        setIsLoggedIn(true);
        setQuickAuthAvailable(false);
        await loadAllStudentData();
      } catch (e: any) {
        setAuthError(e.message || "Login failed. Please verify credentials.");
        throw e;
      } finally {
        setIsLoading(false);
      }
    },
    [loadAllStudentData],
  );

  const unlockSessionWithBiometric = useCallback(async (): Promise<{
    success: boolean;
    error?: string;
  }> => {
    setAuthError(null);
    const token = await getStoredToken();
    if (!token) {
      setQuickAuthAvailable(false);
      return {
        success: false,
        error: "No active session found. Please sign in with your password.",
      };
    }

    const authRes = await promptBiometricAuth(
      "Verify your biometric identity to unlock Holkar ERP",
    );
    if (!authRes.success) {
      if (authRes.cancelled) {
        return { success: false, error: "Cancelled" };
      }
      return {
        success: false,
        error: authRes.error || "Biometric authentication failed.",
      };
    }

    try {
      setIsLoading(true);
      const cachedUser = await getCachedSessionUser();
      const session = await getAuthenticatedSession();
      if (!cachedUser.userId || session.id !== cachedUser.userId || session.role !== "STUDENT") throw new Error("Authenticated account does not match the secure device binding.");
      const studentId = (cachedUser.username ||
        cachedUser.rollNo ||
        undefined) as string | undefined;
      await hydrateLocalCache(studentId);
      setIsLoggedIn(true);
      setQuickAuthAvailable(false);
      await loadAllStudentData();
      return { success: true };
    } catch (e: any) {
      if (
        e?.message?.includes("expired") ||
        e?.message?.includes("401") ||
        e?.message?.includes("Unauthorized")
      ) {
        await clearToken();
        resetAllStudentData();
        return {
          success: false,
          error:
            "Session expired on server. Please sign in with your password.",
        };
      }
      setIsLoggedIn(false);
      return {
        success: false,
        error: e?.message || "Failed to validate server session. Please try again.",
      };
    } finally {
      setIsLoading(false);
    }
  }, [hydrateLocalCache, loadAllStudentData, resetAllStudentData]);

  const unlockSessionWithMpin = useCallback(
    async (pin: string): Promise<MpinVerificationResult> => {
      setAuthError(null);
      const token = await getStoredToken();
      if (!token) {
        setQuickAuthAvailable(false);
        return {
          success: false,
          error: "No active session found. Please sign in with your password.",
        };
      }

      const cachedUser = await getCachedSessionUser();
      const mpinRes = await verifyMpin(pin, cachedUser.userId || undefined);
      if (!mpinRes.success) {
        return mpinRes;
      }

      try {
        setIsLoading(true);
        const session = await getAuthenticatedSession();
        if (!cachedUser.userId || session.id !== cachedUser.userId || session.role !== "STUDENT") throw new Error("Authenticated account does not match the secure device binding.");
        const studentId = (cachedUser.username ||
          cachedUser.rollNo ||
          undefined) as string | undefined;
        await hydrateLocalCache(studentId);
        setIsLoggedIn(true);
        setQuickAuthAvailable(false);
        await loadAllStudentData();
        return { success: true };
      } catch (e: any) {
        if (
          e?.message?.includes("expired") ||
          e?.message?.includes("401") ||
          e?.message?.includes("Unauthorized")
        ) {
          await clearToken();
          resetAllStudentData();
          return {
            success: false,
            error:
              "Session expired on server. Please sign in with your password.",
          };
        }
        setIsLoggedIn(false);
        return {
          success: false,
          error: e?.message || "Failed to validate server session. Please try again.",
        };
      } finally {
        setIsLoading(false);
      }
    },
    [hydrateLocalCache, loadAllStudentData, resetAllStudentData],
  );

  const switchToPasswordLogin = useCallback(() => {
    setQuickAuthAvailable(false);
  }, []);

  const logout = useCallback(async () => {
    await logoutApi();
    resetAllStudentData();
  }, [resetAllStudentData]);

  const markAllNotificationsAsRead = useCallback(async () => {
    try {
      await markAllNotificationsRead();
    } catch (e: any) {
      console.warn("markAllNotificationsRead network warning:", e.message);
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const markNotificationAsRead = useCallback(async (id: string) => {
    try {
      await markNotificationRead(id);
    } catch (e: any) {
      console.warn("markNotificationRead network warning:", e.message);
    }
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }, []);

  const refreshNotifications = useCallback(async () => {
    try {
      const notifs = await getNotifications();
      if (Array.isArray(notifs)) {
        setNotifications(notifs);
      }
    } catch (e: any) {
      console.warn("refreshNotifications network warning:", e.message);
    }
  }, []);

  const refreshHolidays = useCallback(async () => {
    try {
      const data = await getAcademicHolidays();
      if (Array.isArray(data)) {
        setHolidays(data);
      }
    } catch (e: any) {
      console.warn("refreshHolidays network notice:", e.message);
    }
  }, []);

  const refreshData = useCallback(async () => {
    await loadAllStudentData();
  }, [loadAllStudentData]);

  return (
    <AppContext.Provider
      value={{
        isLoading,
        isLoggedIn,
        authError,
        quickAuthAvailable,
        cachedUsername,
        student,
        attendance,
        timetable,
        fees,
        results,
        notifications,
        warningNotice,
        admitCard,
        grievances,
        holidays,
        dataLoading,
        dataError,
        lastSyncedAt,
        login,
        unlockSessionWithBiometric,
        unlockSessionWithMpin,
        switchToPasswordLogin,
        logout,
        refreshData,
        refreshNotifications,
        refreshHolidays,
        markAllNotificationsAsRead,
        markNotificationAsRead,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
