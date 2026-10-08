export interface StudentProfile {
  id: string;
  name: string;
  rollNo: string;
  course: string;
  semester: string;
  branch: string;
  avatarUrl: string;
  email: string;
  phone: string;
  dob: string;
  bloodGroup: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  address: string;
  academicYear: string;
}

export interface SubjectAttendance {
  code: string;
  name: string;
  teacher: string;
  attended: number;
  total: number;
  percentage: number;
  status: "SAFE" | "WARNING" | "CRITICAL";
}

export interface TimetableItem {
  id: string;
  time: string;
  subject: string;
  code: string;
  teacher: string;
  room: string;
  status: "UPCOMING" | "LIVE" | "COMPLETED";
}

export interface FeeInstallment {
  id: string;
  demandId?: string;
  installmentNumber?: number;
  title: string;
  dueDate: string;
  amount: number;
  status: "PAID" | "DUE" | "OVERDUE";
  receiptNo?: string;
  paidOn?: string;
}

export interface WarningLetter {
  letterNumber: string;
  issueDate: string;
  studentName: string;
  enrollmentNo: string;
  rollNo: string;
  courseAndSemester: string;
  absentSinceDate: string;
  consecutiveDays: number;
  studentEmail: string;
  parentEmail: string;
  parentPhone: string;
  hodName: string;
  principalName: string;
  status: "ACTIVE_48HRS" | "RESOLVED";
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timeAgo: string;
  category:
    | "IMPORTANT"
    | "ACADEMIC"
    | "FEES"
    | "EXAM"
    | "GENERAL"
    | "WARNING"
    | "FEE"
    | string;
  read: boolean;
  attachmentUrl?: string | null;
  pdfUrl?: string | null;
  authorName?: string | null;
  date?: string | null;
  priority?: string | null;
}

export interface GrievanceTicket {
  id: string;
  title: string;
  category: string;
  department: string;
  status: "NEW" | "IN_PROGRESS" | "RESOLVED";
  date: string;
}
