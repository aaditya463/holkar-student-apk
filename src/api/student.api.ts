/**
 * student.api.ts — Complete Student Data API Layer
 * All methods communicate directly with the shared Holkar ERP backend.
 * Uses authenticated apiClient with Bearer JWT token.
 */
import { apiRequest } from "./apiClient";

// ─── Student Profile ──────────────────────────────────────────────────────────
export interface ApiStudentProfile {
  id: string;
  name: string;
  rollNo: string;
  enrollmentNo: string;
  course: string;
  programme: string;
  semester: string;
  branch: string;
  department: string;
  section: string;
  majorSubject: string;
  minorSubject: string;
  openElective: string;
  vocationalSubject?: string;
  admissionYear: string;
  currentYear: string;
  batch: string;
  academicYear?: string;
  academicStatus?: string;
  email: string;
  phone: string;
  dob: string;
  gender?: string;
  bloodGroup: string;
  heightCm?: number | null;
  weightKg?: number | null;
  parentName: string;
  fatherName?: string;
  motherName?: string;
  parentPhone: string;
  parentEmail: string;
  address: string;
  currentAddress?: string;
  permanentAddress?: string;
  avatarUrl: string;
  attendancePercentage: number;
  cgpa: number;
  status: string;
  feesSummary: {
    totalFee: number;
    paidFee: number;
    pendingFee: number;
    status: "PAID" | "PARTIAL" | "DUE";
    receiptNo?: string;
  };
}

export async function getStudentProfile(): Promise<ApiStudentProfile> {
  const resp = await apiRequest<any>("/student/profile");
  const s = resp?.data || resp;
  const enr = s.activeEnrollment || {};
  const perm = s.permanentIdentity || {};

  return {
    id: s.id || enr.enrollmentNo || "",
    name: s.name || perm.name || "Student",
    rollNo: s.rollNumber || enr.rollNumber || "",
    enrollmentNo: enr.enrollmentNo || s.enrollmentNo || s.id || "",
    course: s.course || enr.courseName || "",
    programme: s.programme || enr.courseName || s.course || "",
    semester: String(enr.currentSemester || s.semester || ""),
    branch: s.branch || enr.department || "",
    department: enr.department || s.department || s.branch || "",
    section: s.section || enr.section || "A",
    majorSubject: s.majorSubject || enr.majorSubject || "",
    minorSubject: s.minorSubject || enr.minorSubject || "",
    openElective: s.openElective || enr.openElective || "",
    vocationalSubject:
      s.vocationalSubject || enr.vocationalSubject || undefined,
    admissionYear: String(enr.admissionYear || s.admissionYear || ""),
    currentYear: enr.currentYear || s.year || "",
    batch: s.batch || "",
    academicYear: s.academicYear || s.batch || "",
    academicStatus:
      s.academicStatus || enr.academicStatus || s.status || "ACTIVE",
    email: s.email || perm.email || "",
    phone: s.phone || perm.phone || "",
    dob: s.dob || perm.dob || "",
    gender: s.gender || perm.gender || "",
    bloodGroup: s.bloodGroup || perm.bloodGroup || "",
    heightCm:
      s.heightCm !== undefined
        ? s.heightCm
        : perm.heightCm !== undefined
          ? perm.heightCm
          : null,
    weightKg:
      s.weightKg !== undefined
        ? s.weightKg
        : perm.weightKg !== undefined
          ? perm.weightKg
          : null,
    parentName: s.parentName || perm.parentName || "",
    fatherName:
      s.fatherName || perm.fatherName || s.parentName || perm.parentName || "",
    motherName: s.motherName || perm.motherName || "",
    parentPhone: s.parentPhone || perm.parentPhone || "",
    parentEmail: s.parentEmail || perm.parentEmail || "",
    address: s.currentAddress || s.address || perm.address || "",
    currentAddress: s.currentAddress || perm.currentAddress || s.address || "",
    permanentAddress:
      s.permanentAddress || perm.permanentAddress || s.address || "",
    avatarUrl: s.avatarUrl || perm.avatarUrl || "",
    attendancePercentage: Number(s.attendancePercentage || 0),
    cgpa: Number(s.cgpa || 0),
    status: s.status || "ACTIVE",
    feesSummary: s.feesSummary || {
      totalFee: 0,
      paidFee: 0,
      pendingFee: 0,
      status: "UNAVAILABLE",
      receiptNo: "—",
    },
  };
}

export async function updateStudentProfile(fields: {
  bloodGroup?: string;
  height?: number | string | null;
  heightCm?: number | string | null;
  weight?: number | string | null;
  weightKg?: number | string | null;
  currentAddress?: string;
  permanentAddress?: string;
}): Promise<ApiStudentProfile> {
  await apiRequest<any>("/student/profile", {
    method: "PUT",
    body: JSON.stringify(fields),
  });
  return getStudentProfile();
}

export async function requestEmailChange(newEmail: string): Promise<any> {
  return apiRequest<any>("/student/request-email-change", {
    method: "POST",
    body: JSON.stringify({ newEmail }),
  });
}

// ─── Attendance ───────────────────────────────────────────────────────────────
export interface ApiSubjectAttendance {
  code: string;
  name: string;
  teacher: string;
  attended: number;
  total: number;
  percentage: number;
  status: "SAFE" | "WARNING" | "DANGER";
  category?:
    | "MAJOR"
    | "MINOR"
    | "OPEN_ELECTIVE"
    | "VOCATIONAL"
    | "MULTI_DISCIPLINARY"
    | "PRACTICAL";
}

export interface ApiAbsentDate {
  date: string;
  rawDate: string;
  subject: string;
  subjectCode: string;
  teacher: string;
  room: string;
}

export interface ApiAttendanceSummary {
  overall: number;
  conducted: number;
  present: number;
  absent: number;
  excluded: number;
  status: "ELIGIBLE" | "SHORTAGE_WARNING" | "NO_RECORD";
  subjects: ApiSubjectAttendance[];
  absentDates: ApiAbsentDate[];
  monthlySummary: Array<{
    month: string;
    workingDays: number;
    present: number;
    absent: number;
    percentage: number;
  }>;
  dailyAttendance: Array<{
    id: string;
    date: string;
    day: string;
    subject: string;
    subjectCode: string;
    teacher: string;
    room: string;
    status: "PRESENT" | "ABSENT";
  }>;
}

export async function getAttendance(): Promise<ApiAttendanceSummary> {
  try {
    const resp = await apiRequest<any>("/student/attendance/history");
    const raw = resp?.data || resp;

    const overallObj = raw?.overall || {};
    const conducted = Number(overallObj.totalWorkingDays || 0);
    const overallPct =
      conducted > 0 ? Number(overallObj.attendancePercentage || 0) : 0;

    const subjects: ApiSubjectAttendance[] = (
      raw?.subjectWiseSummary || []
    ).map((s: any) => ({
      code: s.code || "",
      name: s.name || "Subject",
      teacher: s.teacher || "Not available",
      category:
        s.category ||
        (s.code?.startsWith("CS")
          ? "MAJOR"
          : s.code?.startsWith("MA")
            ? "MINOR"
            : s.code?.startsWith("PH")
              ? "OPEN_ELECTIVE"
              : "VOCATIONAL"),
      attended: Number(s.present || 0),
      total: Number(s.total || 0),
      percentage: Number(s.percentage || 0),
      status:
        Number(s.percentage || 0) >= 75
          ? "SAFE"
          : Number(s.percentage || 0) >= 65
            ? "WARNING"
            : "DANGER",
    }));

    return {
      overall: overallPct,
      conducted,
      present: Number(overallObj.presentDays || 0),
      absent: Number(overallObj.absentDays || 0),
      excluded: Number(overallObj.excludedHolidayDays || 0),
      status:
        conducted === 0
          ? "NO_RECORD"
          : overallObj.attendanceStatus ||
            (overallPct >= 75 ? "ELIGIBLE" : "SHORTAGE_WARNING"),
      subjects,
      absentDates: raw?.absentDates || [],
      monthlySummary: raw?.monthlySummary || [],
      dailyAttendance: raw?.dailyAttendance || [],
    };
  } catch {
    return {
      overall: 0,
      conducted: 0,
      present: 0,
      absent: 0,
      excluded: 0,
      status: "NO_RECORD",
      subjects: [],
      absentDates: [],
      monthlySummary: [],
      dailyAttendance: [],
    };
  }
}

// ─── Timetable ────────────────────────────────────────────────────────────────
export interface ApiTimetableSlot {
  id: string;
  time: string;
  subject: string;
  code: string;
  teacher: string;
  room: string;
  status: "COMPLETED" | "LIVE" | "UPCOMING";
}

export interface ApiWeeklyTimetable {
  [day: string]: ApiTimetableSlot[];
}

export async function getTimetable(): Promise<ApiWeeklyTimetable> {
  try {
    const resp = await apiRequest<any>("/student/timetable");
    return resp?.data || resp || {};
  } catch {
    return {};
  }
}

// ─── Fees ─────────────────────────────────────────────────────────────────────
export interface ApiFeeInstallment {
  id: string;
  demandId?: string;
  title: string;
  installmentNumber: number;
  amount: number;
  lateFine: number;
  totalPayable: number;
  dueDate: string;
  status: "PAID" | "PENDING" | "OVERDUE" | "PARTIAL";
  paidAmount: number;
  pendingAmount: number;
  receiptNo?: string;
  paidOn?: string;
}

export interface ApiFeeLedgerItem {
  id: string;
  receiptNo: string;
  transactionId: string;
  particulars: string;
  semesterName: string;
  totalAmount: number;
  paidAmount: number;
  paymentMode: string;
  paidOn: string;
  status: "PAID" | "PARTIAL" | "PENDING";
}

export async function getFees(): Promise<{
  summary: {
    totalCourseFee: number;
    totalPaid: number;
    pendingAmount: number;
    status: string;
    nextDueDate: string;
  };
  installments: ApiFeeInstallment[];
  ledger: ApiFeeLedgerItem[];
  error?: string;
}> {
  try {
    const resp = await apiRequest<any>("/fees/my-installments");
    const data = resp?.data || resp;
    const installments: ApiFeeInstallment[] = (data?.installments || []).map(
      (f: any) => ({
        id: f.id,
        demandId: f.demandId || f.demand_id,
        title: f.installmentName || `Installment ${f.installmentNumber}`,
        installmentNumber: f.installmentNumber || 1,
        amount: Number(f.amount || 0),
        lateFine: Number(f.lateFine || 0),
        totalPayable: Number(f.totalPayable || f.amount || 0),
        dueDate: f.dueDate || "",
        status: (f.status || "PENDING").toUpperCase() as any,
        paidAmount: Number(f.paidAmount || 0),
        pendingAmount: Number(f.pendingAmount || 0),
        receiptNo: f.receiptNo,
        paidOn: f.paidOn,
      }),
    );

    const ledger: ApiFeeLedgerItem[] = (data?.ledger || []).map((l: any) => ({
      id: l.id,
      receiptNo: l.receiptNo,
      transactionId: l.transactionId,
      particulars: l.particulars,
      semesterName: l.semesterName,
      totalAmount: Number(l.totalAmount || 0),
      paidAmount: Number(l.paidAmount || 0),
      paymentMode: l.paymentMode,
      paidOn: l.paidOn,
      status: l.status,
    }));

    const hasPending = installments.some((i) => i.status !== "PAID");
    const hasPaid = installments.some((i) => i.status === "PAID");
    let computedStatus = "NO_RECORD";
    if (installments.length > 0) {
      if (!hasPending && hasPaid) computedStatus = "CLEARED";
      else if (hasPaid && hasPending) computedStatus = "PARTIAL";
      else if (hasPending) computedStatus = "DUE";
    }

    return {
      summary: data?.summary || {
        totalCourseFee: installments.reduce((a, b) => a + b.totalPayable, 0),
        totalPaid: installments
          .filter((i) => i.status === "PAID")
          .reduce((a, b) => a + b.paidAmount, 0),
        pendingAmount: installments
          .filter((i) => i.status !== "PAID")
          .reduce((a, b) => a + b.pendingAmount, 0),
        status: computedStatus,
        nextDueDate:
          installments.find((i) => i.status !== "PAID")?.dueDate || "—",
      },
      installments,
      ledger,
    };
  } catch (err: any) {
    // Fail-Closed: Never convert fee API failure into CLEARED or zero dues
    return {
      summary: {
        totalCourseFee: 0,
        totalPaid: 0,
        pendingAmount: 0,
        status: "UNAVAILABLE",
        nextDueDate: "—",
      },
      installments: [],
      ledger: [],
      error: err?.message || "FEE_SERVICE_UNAVAILABLE",
    };
  }
}

export async function payFee(data: {
  demandId: string;
  installmentId: string;
  installmentNumber: number;
  paymentMode: string;
}) {
  return apiRequest<any>("/fees/payments/initiate", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function collectFeeApi(
  demandId: string,
  installmentId: string,
  installmentNumber: number,
  paymentMode: string,
) {
  return payFee({
    demandId,
    installmentId,
    installmentNumber,
    paymentMode,
  });
}

// ─── Results / Grade Sheets ───────────────────────────────────────────────────
export interface ApiSubjectGrade {
  group: string;
  type: string;
  name: string;
  credits: number;
  secured: number;
  grade: string;
  gp: number;
  cp: number;
  hasATKT: boolean;
}

export interface ApiSemesterResult {
  id: string;
  semester: number;
  semesterName: string;
  examSession: string;
  sgpa: number;
  cgpa: number;
  result: "PASS" | "ATKT" | "FAIL";
  marksheetNo: string;
  totalCredits: number;
  securedCredits: number;
  totalPoints: number;
  rollNo: string;
  subjects: ApiSubjectGrade[];
}

export async function getResults(): Promise<ApiSemesterResult[]> {
  try {
    const resp = await apiRequest<any>("/student/results");
    const list = resp?.data || resp || [];
    return (Array.isArray(list) ? list : []).map((r: any) => ({
      id: r.id,
      semester: Number(r.semester || 1),
      semesterName: r.semesterName || `B.Sc. Semester ${r.semester}`,
      examSession: r.examSession || "",
      sgpa: parseFloat(r.sgpa || 0),
      cgpa: parseFloat(r.cgpa || 0),
      result: r.result || "PASS",
      marksheetNo: r.marksheetNo || "",
      totalCredits: Number(r.totalCredits || 0),
      securedCredits: Number(r.securedCredits || 0),
      totalPoints: Number(r.totalPoints || 0),
      rollNo: r.rollNo || "",
      subjects: r.subjects || [],
    }));
  } catch {
    return [];
  }
}

// ─── Disciplinary Warning Notice ──────────────────────────────────────────────
export interface ApiWarningNotice {
  hasActiveWarning: boolean;
  letterNumber?: string;
  issueDate?: string;
  studentName?: string;
  enrollmentNo?: string;
  rollNo?: string;
  courseAndSemester?: string;
  consecutiveDays?: number;
  attendancePercentage?: number;
  warningNoticeCount?: number;
  studentEmail?: string;
  parentPhone?: string;
  parentEmail?: string;
  hodName?: string;
  principalName?: string;
  status: "WARNING_ACTIVE" | "CLEAN";
}

export async function getWarningNotice(): Promise<ApiWarningNotice> {
  try {
    const resp = await apiRequest<any>("/student/warning-notice");
    return resp?.data || resp || { hasActiveWarning: false, status: "CLEAN" };
  } catch {
    return { hasActiveWarning: false, status: "CLEAN" };
  }
}

// ─── Admit Card ───────────────────────────────────────────────────────────────
export interface ApiAdmitCard {
  studentId?: string;
  enrollmentNo?: string;
  rollNo?: string;
  studentName?: string;
  fatherName?: string;
  course?: string;
  semester?: string;
  examCenter?: string;
  examSession?: string;
  session?: string;
  message?: string;
  status?: "ELIGIBLE" | "SHORTAGE_WARNING" | "HOLD";
  isWithheld?: boolean;
  qrCode?: string;
  schedule?: Array<{
    date: string;
    time: string;
    subjectCode: string;
    subjectName: string;
    room: string;
  }>;
}

export async function getAdmitCard(): Promise<ApiAdmitCard | null> {
  try {
    const resp = await apiRequest<any>("/student/admit-card");
    return resp?.data || resp || null;
  } catch {
    return null;
  }
}

// ─── Notifications ────────────────────────────────────────────────────────────
export interface ApiNotification {
  id: string;
  title: string;
  message: string;
  timeAgo: string;
  category: "ACADEMIC" | "WARNING" | "FEE" | "EXAM" | "GENERAL";
  read: boolean;
  priority?: "HIGH" | "NORMAL" | "URGENT";
  attachmentUrl?: string | null;
  pdfUrl?: string | null;
  authorName?: string | null;
  date?: string | null;
}

export async function getNotifications(): Promise<ApiNotification[]> {
  try {
    const resp = await apiRequest<any>("/notifications/my-notifications");
    const data = resp?.data || resp;
    const items =
      data?.items || data?.notifications || (Array.isArray(data) ? data : []);
    return items.map((n: any) => ({
      id: n.id,
      title: n.title,
      message: n.message || n.body || "",
      timeAgo:
        n.timeAgo ||
        (n.createdAt ? new Date(n.createdAt).toLocaleDateString() : "Recent"),
      category: (
        n.category ||
        (n.title.toLowerCase().includes("exam") ? "EXAM" : "GENERAL")
      ).toUpperCase(),
      read: Boolean(
        n.read || n.isRead || n.readAt || n.deliveryStatus === "READ",
      ),
      priority: n.priority || "NORMAL",
      attachmentUrl: n.attachmentUrl || n.attachment_url || n.pdfUrl || null,
      pdfUrl: n.pdfUrl || n.attachmentUrl || n.attachment_url || null,
      authorName: n.authorName || n.author_name || null,
      date: n.createdAt || n.created_at || null,
    }));
  } catch {
    return [];
  }
}

export async function markNotificationRead(id: string) {
  return apiRequest<any>(`/notifications/mark-read/${id}`, { method: "POST" });
}

export async function markAllNotificationsRead() {
  return apiRequest<any>("/notifications/mark-all-read", { method: "POST" });
}

// ─── QR Attendance Scan ───────────────────────────────────────────────────────
export async function getActiveAttendanceSession() {
  return apiRequest<{
    success: boolean;
    data: {
      sessionId: string;
      subjectName: string;
      subjectCode: string;
      room: string;
      teacherName: string;
      department: string;
      semester: number;
      section: string;
      expiresInSeconds: number;
      isMarked?: boolean;
    } | null;
  }>("/student/attendance/active-session");
}

export interface ScanAttendancePayload {
  token: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  requestId?: string;
  clientEventId?: string;
  deviceTime?: string;
}

export async function scanLectureQR(payload: string | ScanAttendancePayload) {
  const body =
    typeof payload === "string"
      ? { token: payload, qrToken: payload }
      : { ...payload, qrToken: payload.token };

  return apiRequest<{
    success: boolean;
    message: string;
    code?: string;
    data?: {
      sessionId?: string;
      subject?: string;
      room?: string;
      markedAt?: string;
      qrVerified?: boolean;
      proximityVerified?: boolean;
      distanceMeters?: number;
      zoneLabel?: string;
    };
  }>("/student/attendance/scan", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function syncOfflineAttendanceApi(records: any[]) {
  return apiRequest<{
    success: boolean;
    message: string;
    syncedCount: number;
    duplicateCount: number;
    failedCount: number;
    results: Array<{
      clientEventId: string;
      status: "SYNCED" | "REJECTED" | "VERIFIED";
      message: string;
    }>;
  }>("/student/attendance/offline-sync", {
    method: "POST",
    body: JSON.stringify({ records }),
  });
}

// ─── Grievances / Support ─────────────────────────────────────────────────────
export interface ApiGrievanceTicket {
  id: string;
  title: string;
  description?: string;
  category: string;
  department: string;
  status: "NEW" | "IN_PROGRESS" | "RESOLVED" | "ESCALATED";
  date: string;
}

export async function getMyGrievances(): Promise<ApiGrievanceTicket[]> {
  try {
    const resp = await apiRequest<any>("/student/grievances");
    const list = resp?.data || resp || [];
    return (Array.isArray(list) ? list : []).map((t: any) => ({
      id: t.ticketId || t.id,
      title: t.title,
      description: t.description,
      category: t.category || "Academic",
      department: t.department || "Computer Science",
      status: t.status || "NEW",
      date: t.created_at
        ? new Date(t.created_at).toLocaleDateString("en-GB")
        : "Recent",
    }));
  } catch {
    return [];
  }
}

export async function submitGrievance(
  title: string,
  description: string,
  category: string,
) {
  return apiRequest<any>("/student/grievances", {
    method: "POST",
    body: JSON.stringify({ title, description, category }),
  });
}

// ─── Academic Calendar & Holidays ─────────────────────────────────────────────
export interface ApiHolidayEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  eventType:
    | "GOVT_HOLIDAY"
    | "ACADEMIC_BREAK"
    | "EXAM_WINDOW"
    | "COLLEGE_HOLIDAY"
    | "EXAMINATION"
    | "ACADEMIC_EVENT"
    | "OFFICIAL_MEETING"
    | string;
  description: string;
}

export async function getAcademicHolidays(): Promise<ApiHolidayEvent[]> {
  try {
    const resp = await apiRequest<any>("/calendar-events");
    const list = resp?.data || resp || [];
    return (Array.isArray(list) ? list : []).map((e: any) => ({
      id: String(e.id),
      title: e.title || e.event_name || "College Event",
      startDate: e.start_date || e.startDate,
      endDate: e.end_date || e.endDate || e.start_date || e.startDate,
      eventType: e.event_type || e.eventType || "GOVT_HOLIDAY",
      description: e.description || "",
    }));
  } catch (err: any) {
    console.warn("Academic calendar fetch notice:", err?.message || err);
    throw err;
  }
}

// ─── ATKT & Revaluation ───────────────────────────────────────────────────────
export async function applyATKT(data: {
  studentId: string;
  enrollmentNo: string;
  backlogSubjects: any[];
  totalFee: number;
  transactionId: string;
}) {
  return apiRequest<any>("/exam/atkt/apply", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function applyCopyShowing(data: {
  studentId: string;
  enrollmentNo: string;
  subjectCode: string;
  subjectName: string;
  semester: number;
  reason: string;
  feePaid: number;
  transactionId: string;
}) {
  return apiRequest<any>("/exam/revaluation/apply", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ─── Campus GIS Navigation Engine ───────────────────────────────────────────
export interface CampusRouteStep {
  stepNumber: number;
  instruction: string;
  pathName: string;
  pathType: string;
  distanceMeters: number;
  fromNode: string;
  toNode: string;
}

export interface CampusRouteResponse {
  totalDistanceMeters: number;
  estimatedWalkMinutes: number;
  wheelchairAccessible: boolean;
  startNode: {
    id: string;
    nodeCode: string;
    name: string;
    latitude: number;
    longitude: number;
  };
  destinationNode: {
    id: string;
    nodeCode: string;
    name: string;
    latitude: number;
    longitude: number;
  };
  steps: CampusRouteStep[];
}

export async function getCampusDestinationsApi(): Promise<any[]> {
  try {
    const res = await apiRequest<any>("/campus/destinations");
    return res?.data || (Array.isArray(res) ? res : []);
  } catch {
    return [];
  }
}

export async function calculateCampusRouteApi(
  startNodeId: string,
  destinationNodeId: string,
): Promise<CampusRouteResponse | null> {
  try {
    const res = await apiRequest<any>("/campus/route", {
      method: "POST",
      body: { startNodeId, destinationNodeId },
    });
    return res?.data || res || null;
  } catch (err) {
    console.warn("Campus route calculation failed:", err);
    return null;
  }
}

export async function getCampusTopologyApi(): Promise<any | null> {
  try {
    const res = await apiRequest<any>("/campus/topology");
    return res?.data || null;
  } catch {
    return null;
  }
}
