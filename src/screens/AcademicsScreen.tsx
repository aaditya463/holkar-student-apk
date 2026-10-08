import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import {
  Clock,
  MapPin,
  Calendar,
  Award,
  ChevronRight,
  BookOpen,
  FileText,
  RotateCcw,
  HelpCircle,
} from "lucide-react-native";
import { useApp } from "../context/AppContext";
import { ApiSubjectAttendance } from "../api/student.api";

interface Props {
  onOpenQRScanner: () => void;
  onOpenMarksheet: () => void;
  onOpenPYQModal?: () => void;
  onOpenAdmitCard?: () => void;
  onOpenATKT?: () => void;
  onOpenCopyShowing?: () => void;
}

export const AcademicsScreen: React.FC<Props> = ({
  onOpenQRScanner,
  onOpenMarksheet,
  onOpenPYQModal,
  onOpenAdmitCard,
  onOpenATKT,
  onOpenCopyShowing,
}) => {
  const { student, attendance, timetable, results } = useApp();

  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const todayDayName = dayNames[new Date().getDay()];

  const getDayClasses = (day: string) => {
    if (!timetable) return [];
    const keys = Object.keys(timetable);
    const matchedKey = keys.find((k) => k.toLowerCase() === day.toLowerCase());
    return matchedKey ? (timetable as any)[matchedKey] : [];
  };

  const rawClasses = getDayClasses(todayDayName);

  const todayClasses = (rawClasses || []).map((item: any, idx: number) => ({
    id: item.id || `tt-${idx}`,
    time:
      item.time ||
      (item.startTime && item.endTime
        ? `${item.startTime} - ${item.endTime}`
        : "Time TBA"),
    subjectName: item.subjectName || item.subject || "Course Unit",
    teacherName: item.teacherName || item.teacher || "Not available",
    room: item.room || "Room TBA",
    code: item.code || "",
    status:
      item.status === "LIVE"
        ? "LIVE"
        : item.status === "COMPLETED"
          ? "COMPLETED"
          : "SCHEDULED",
  }));

  const latestResult = results && results.length > 0 ? results[0] : null;
  const sgpaDisplay = latestResult?.sgpa
    ? latestResult.sgpa.toFixed(2)
    : student?.cgpa
      ? student.cgpa.toFixed(2)
      : "—";
  const cgpaDisplay = student?.cgpa ? student.cgpa.toFixed(2) : "—";

  const subjects: ApiSubjectAttendance[] = attendance?.subjects || [];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Top Academic Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Academics & Examination</Text>
        <Text style={styles.headerSub}>
          Govt. Holkar Autonomous Science College • CBCS
        </Text>
      </View>

      {/* Hero CBCS Marksheet / Grade Sheet Action Card */}
      <TouchableOpacity
        onPress={onOpenMarksheet}
        style={styles.marksheetHeroCard}
        activeOpacity={0.88}
      >
        <View style={styles.marksheetHeroTop}>
          <View style={styles.marksheetIconWrap}>
            <Award size={24} color="#ffffff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.marksheetHeroTag}>
              AUTONOMOUS CBCS GRADE RECORD
            </Text>
            <Text style={styles.marksheetHeroTitle}>
              Academic Marksheets & Transcripts
            </Text>
            <Text style={styles.marksheetHeroSub}>
              Latest SGPA: {sgpaDisplay} • Cumulative CGPA: {cgpaDisplay} •
              Official Verification
            </Text>
          </View>
          <ChevronRight size={20} color="#ffffff" />
        </View>
      </TouchableOpacity>

      {/* CBCS ENROLLED CURRICULUM ALLOCATION */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Enrolled Course Structure</Text>
        <Text style={styles.subMetaText}>
          {student?.programme || student?.course || "—"}{" "}
          {student?.semester ? `Sem ${student.semester}` : ""}
        </Text>
      </View>

      <View style={styles.courseAllocBox}>
        <View style={styles.allocRow}>
          <View style={[styles.allocBadge, { backgroundColor: "#fdf2f8" }]}>
            <Text style={[styles.allocBadgeText, { color: "#5c0d38" }]}>
              MAJOR
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.allocTitle}>
              {student?.majorSubject || "Not Assigned"}
            </Text>
            <Text style={styles.allocSub}>
              Theory + Autonomous Laboratory Practical (6 Credits)
            </Text>
          </View>
        </View>

        <View style={styles.allocDivider} />

        <View style={styles.allocRow}>
          <View style={[styles.allocBadge, { backgroundColor: "#eef2ff" }]}>
            <Text style={[styles.allocBadgeText, { color: "#4338ca" }]}>
              MINOR
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.allocTitle}>
              {student?.minorSubject || "Not Assigned"}
            </Text>
            <Text style={styles.allocSub}>
              Interdisciplinary Subject Unit (4 Credits)
            </Text>
          </View>
        </View>

        <View style={styles.allocDivider} />

        <View style={styles.allocRow}>
          <View style={[styles.allocBadge, { backgroundColor: "#f0fdf4" }]}>
            <Text style={[styles.allocBadgeText, { color: "#15803d" }]}>
              GENERIC / OE
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.allocTitle}>
              {student?.openElective || "Not Assigned"}
            </Text>
            <Text style={styles.allocSub}>
              Open Elective Course Unit (4 Credits)
            </Text>
          </View>
        </View>

        {student?.vocationalSubject ? (
          <>
            <View style={styles.allocDivider} />
            <View style={styles.allocRow}>
              <View style={[styles.allocBadge, { backgroundColor: "#fffbeb" }]}>
                <Text style={[styles.allocBadgeText, { color: "#b45309" }]}>
                  VOCATIONAL
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.allocTitle}>
                  {student.vocationalSubject}
                </Text>
                <Text style={styles.allocSub}>
                  Skill Enhancement & Applied Laboratory (3 Credits)
                </Text>
              </View>
            </View>
          </>
        ) : null}
      </View>

      {/* TODAY'S TIMETABLE */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Today's Lectures & Labs</Text>
        <Text style={styles.dayText}>{todayDayName}</Text>
      </View>

      {todayClasses.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.timetableScroll}
        >
          {todayClasses.map((item: any, idx: number) => {
            const isLive = item.status === "LIVE";
            return (
              <View
                key={item.id || idx}
                style={[styles.timeCard, isLive && styles.timeCardLive]}
              >
                <View style={styles.timeTopRow}>
                  <View
                    style={isLive ? styles.liveBadge : styles.upcomingBadge}
                  >
                    <Text
                      style={
                        isLive ? styles.liveBadgeText : styles.upcomingBadgeText
                      }
                    >
                      {isLive ? "● LIVE IN PROGRESS" : "SCHEDULED"}
                    </Text>
                  </View>
                  <Text style={styles.timeRange}>{item.time}</Text>
                </View>

                <Text style={styles.timeSubject}>{item.subjectName}</Text>
                <View style={styles.timeMeta}>
                  <Text style={styles.timeMetaText}>📍 {item.room}</Text>
                  <Text style={styles.timeMetaText}>👨‍🏫 {item.teacherName}</Text>
                </View>

                {isLive && (
                  <TouchableOpacity
                    onPress={onOpenQRScanner}
                    style={styles.scanLectureBtn}
                  >
                    <Text style={styles.scanLectureBtnText}>
                      ⚡ Scan Lecture QR
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </ScrollView>
      ) : (
        <View style={styles.emptyCard}>
          <Calendar size={28} color="#94a3b8" />
          <Text style={styles.emptyTitle}>No Lectures Scheduled Today</Text>
          <Text style={styles.emptySub}>
            Please check the academic calendar or autonomous circulars.
          </Text>
        </View>
      )}

      {/* SUBJECT ATTENDANCE (POSTGRESQL DATA) */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Course-wise Attendance</Text>
        <Text style={styles.subMetaText}>Minimum 75% Mandatory</Text>
      </View>

      <View style={styles.attendanceBox}>
        {subjects.length > 0 ? (
          subjects.map((sub: ApiSubjectAttendance, i: number) => {
            const isCritical = sub.percentage < 75;
            const barColor =
              sub.percentage >= 75
                ? "#10b981"
                : sub.percentage >= 60
                  ? "#f59e0b"
                  : "#dc2626";

            return (
              <View key={sub.code || i} style={styles.attItem}>
                <View style={styles.attItemTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.attSubjectName}>{sub.name}</Text>
                    <Text style={styles.attCode}>
                      {sub.code} • {sub.attended}/{sub.total} Classes
                    </Text>
                  </View>
                  <Text style={[styles.attPercent, { color: barColor }]}>
                    {sub.percentage}%
                  </Text>
                </View>
                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${Math.min(sub.percentage, 100)}%`,
                        backgroundColor: barColor,
                      },
                    ]}
                  />
                </View>
                {isCritical && (
                  <Text style={styles.attWarningText}>
                    ⚠️ Below minimum 75% threshold • Regular attendance required
                  </Text>
                )}
              </View>
            );
          })
        ) : (
          <View
            style={{
              paddingVertical: 24,
              paddingHorizontal: 16,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Calendar size={28} color="#94a3b8" />
            <Text
              style={{
                fontSize: 14,
                fontWeight: "700",
                color: "#334155",
                marginTop: 8,
                textAlign: "center",
              }}
            >
              No Attendance Records Yet
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: "#64748b",
                textAlign: "center",
                marginTop: 4,
              }}
            >
              Classroom attendance sessions and percentage will appear here once
              logged by faculty.
            </Text>
          </View>
        )}
      </View>

      {/* EXAMINATION & REVALUATION PORTAL */}
      <Text style={styles.sectionTitle}>Autonomous Examination Services</Text>
      <View style={styles.examGrid}>
        <TouchableOpacity
          style={styles.examCard}
          onPress={onOpenAdmitCard}
          activeOpacity={0.8}
        >
          <View style={[styles.examIconWrap, { backgroundColor: "#eef2ff" }]}>
            <FileText size={20} color="#4338ca" />
          </View>
          <Text style={styles.examCardTitle}>Admit Card / Hall Ticket</Text>
          <Text style={styles.examCardSub}>
            Autonomous End-Sem Exam Entry Pass
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.examCard}
          onPress={onOpenMarksheet}
          activeOpacity={0.8}
        >
          <View style={[styles.examIconWrap, { backgroundColor: "#fdf2f8" }]}>
            <Award size={20} color="#5c0d38" />
          </View>
          <Text style={styles.examCardTitle}>CBCS Grade Sheets</Text>
          <Text style={styles.examCardSub}>
            Semester Results & SGPA Transcripts
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.examCard}
          onPress={onOpenATKT}
          activeOpacity={0.8}
        >
          <View style={[styles.examIconWrap, { backgroundColor: "#fffbeb" }]}>
            <RotateCcw size={20} color="#b45309" />
          </View>
          <Text style={styles.examCardTitle}>ATKT / Backlog Form</Text>
          <Text style={styles.examCardSub}>Examination Cell Registration</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.examCard}
          onPress={onOpenCopyShowing}
          activeOpacity={0.8}
        >
          <View style={[styles.examIconWrap, { backgroundColor: "#f0fdf4" }]}>
            <HelpCircle size={20} color="#15803d" />
          </View>
          <Text style={styles.examCardTitle}>Copy Showing & Challenge</Text>
          <Text style={styles.examCardSub}>
            Answer Script Revaluation Request
          </Text>
        </TouchableOpacity>
      </View>

      {/* SYLLABUS & PREVIOUS YEAR PAPERS */}
      <TouchableOpacity
        onPress={onOpenPYQModal}
        style={styles.pyqVaultCard}
        activeOpacity={0.85}
      >
        <View style={styles.pyqLeft}>
          <View style={styles.pyqIconWrap}>
            <BookOpen size={20} color="#5c0d38" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.pyqTitle}>
              Syllabus & Previous Year Papers Vault
            </Text>
            <Text style={styles.pyqSub}>
              Download CBCS Units & 2021-2024 Exam Question Papers
            </Text>
          </View>
        </View>
        <ChevronRight size={18} color="#5c0d38" />
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    paddingHorizontal: 16,
  },
  header: {
    paddingVertical: 14,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1e1b24",
  },
  headerSub: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
    fontWeight: "500",
  },
  marksheetHeroCard: {
    backgroundColor: "#5c0d38",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  marksheetHeroTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  marksheetIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  marksheetHeroTag: {
    color: "#fed7aa",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  marksheetHeroTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 2,
  },
  marksheetHeroSub: {
    color: "#fce7f3",
    fontSize: 11,
    marginTop: 4,
    lineHeight: 16,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1e1b24",
  },
  dayText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#5c0d38",
    backgroundColor: "#fdf2f8",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  subMetaText: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
  },
  courseAllocBox: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 14,
  },
  allocRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 6,
  },
  allocBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 80,
    alignItems: "center",
  },
  allocBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  allocTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1e1b24",
  },
  allocSub: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 1,
  },
  allocDivider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginVertical: 4,
  },
  timetableScroll: {
    marginBottom: 16,
  },
  timeCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 14,
    width: 240,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  timeCardLive: {
    borderColor: "#5c0d38",
    borderWidth: 1.5,
  },
  timeTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  liveBadge: {
    backgroundColor: "#fdf2f8",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  liveBadgeText: {
    color: "#5c0d38",
    fontSize: 10,
    fontWeight: "800",
  },
  upcomingBadge: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  upcomingBadgeText: {
    color: "#64748b",
    fontSize: 10,
    fontWeight: "700",
  },
  timeRange: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "600",
  },
  timeSubject: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1e1b24",
    marginBottom: 6,
  },
  timeMeta: {
    gap: 2,
    marginBottom: 10,
  },
  timeMetaText: {
    fontSize: 11,
    color: "#64748b",
  },
  scanLectureBtn: {
    backgroundColor: "#5c0d38",
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  scanLectureBtnText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
  },
  emptyCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#475569",
    marginTop: 8,
  },
  emptySub: {
    fontSize: 12,
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 4,
  },
  attendanceBox: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 16,
  },
  attItem: {
    marginBottom: 12,
  },
  attItemTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  attSubjectName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1e1b24",
  },
  attCode: {
    fontSize: 10,
    color: "#64748b",
    marginTop: 1,
  },
  attPercent: {
    fontSize: 14,
    fontWeight: "800",
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: "#f1f5f9",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  attWarningText: {
    fontSize: 10,
    color: "#dc2626",
    marginTop: 4,
    fontWeight: "600",
  },
  examGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  examCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 14,
    width: "48%",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  examIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  examCardTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1e1b24",
    marginBottom: 2,
  },
  examCardSub: {
    fontSize: 10,
    color: "#64748b",
    lineHeight: 14,
  },
  pyqVaultCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  pyqLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  pyqIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#fdf2f8",
    alignItems: "center",
    justifyContent: "center",
  },
  pyqTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1e1b24",
  },
  pyqSub: {
    fontSize: 10,
    color: "#64748b",
    marginTop: 2,
  },
});
