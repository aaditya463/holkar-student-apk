import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import {
  X,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  BookOpen,
  Layers,
  AlertTriangle,
  GraduationCap,
  Sparkles,
} from "lucide-react-native";
import { useApp } from "../context/AppContext";

interface Props {
  visible: boolean;
  onClose: () => void;
}

type TabType = "subjects" | "monthly" | "absent" | "daily";
type CategoryFilterType =
  | "ALL"
  | "MAJOR"
  | "MINOR"
  | "OPEN_ELECTIVE"
  | "VOCATIONAL"
  | "MULTI_DISCIPLINARY";

export const AttendanceHistoryModal: React.FC<Props> = ({
  visible,
  onClose,
}) => {
  const { student, attendance } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>("subjects");
  const [categoryFilter, setCategoryFilter] =
    useState<CategoryFilterType>("ALL");

  const overall =
    attendance && attendance.conducted > 0 ? attendance.overall : 0;
  const isSafe = overall >= 75;

  const rawSubjects =
    attendance?.subjects && attendance.subjects.length > 0
      ? attendance.subjects
      : [];

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "MAJOR":
        return "MAJOR COURSE (CORE)";
      case "PRACTICAL":
        return "MAJOR PRACTICAL LAB";
      case "MINOR":
        return "MINOR COURSE";
      case "OPEN_ELECTIVE":
        return "GENERIC OPEN ELECTIVE (GE)";
      case "VOCATIONAL":
        return "VOCATIONAL / SKILL (SEC)";
      case "MULTI_DISCIPLINARY":
        return "MULTI-DISCIPLINARY (MD / AEC)";
      default:
        return "COLLEGE COURSE";
    }
  };

  // Directly map live backend attendance stats from PostgreSQL
  const allSubjects = rawSubjects.map((s) => {
    const cat = (s.category ||
      (s.code.startsWith("CS-201")
        ? "PRACTICAL"
        : s.code.startsWith("CS")
          ? "MAJOR"
          : s.code.startsWith("MA")
            ? "MINOR"
            : s.code.startsWith("PH")
              ? "OPEN_ELECTIVE"
              : s.code.startsWith("VOC")
                ? "VOCATIONAL"
                : "MULTI_DISCIPLINARY")) as
      | "MAJOR"
      | "MINOR"
      | "OPEN_ELECTIVE"
      | "VOCATIONAL"
      | "MULTI_DISCIPLINARY"
      | "PRACTICAL";
    const pct = Number(s.percentage || 0);
    return {
      code: s.code,
      name: s.name,
      teacher: s.teacher || "Faculty",
      category: cat,
      categoryLabel: getCategoryLabel(cat),
      credits: s.code.includes("VOC")
        ? 3
        : s.code.includes("MD") || s.code.includes("201")
          ? 2
          : 4,
      attended: s.attended,
      total: s.total,
      percentage: pct,
      status: (pct >= 75 ? "SAFE" : pct >= 65 ? "WARNING" : "DANGER") as
        "SAFE" | "WARNING" | "DANGER",
    };
  });

  const filteredSubjects =
    categoryFilter === "ALL"
      ? allSubjects
      : allSubjects.filter(
          (s) =>
            s.category === categoryFilter ||
            (categoryFilter === "MAJOR" && s.category === "PRACTICAL"),
        );

  const safeCount = allSubjects.filter((s) => s.percentage >= 75).length;
  const warningCount = allSubjects.length - safeCount;

  const monthlyList = attendance?.monthlySummary || [];

  const absentList = attendance?.absentDates || [];
  const dailyList = attendance?.dailyAttendance || [];

  const getCategoryTheme = (category: string) => {
    switch (category) {
      case "MAJOR":
        return { bg: "#fdf2f8", border: "#fbcfe8", text: "#831843" };
      case "PRACTICAL":
        return { bg: "#faf5ff", border: "#e9d5ff", text: "#6b21a8" };
      case "MINOR":
        return { bg: "#eff6ff", border: "#bfdbfe", text: "#1e40af" };
      case "OPEN_ELECTIVE":
        return { bg: "#ecfdf5", border: "#a7f3d0", text: "#065f46" };
      case "VOCATIONAL":
        return { bg: "#fffbeb", border: "#fde68a", text: "#92400e" };
      case "MULTI_DISCIPLINARY":
        return { bg: "#f0fdfa", border: "#99f6e4", text: "#115e59" };
      default:
        return { bg: "#f1f5f9", border: "#cbd5e1", text: "#334155" };
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <View style={styles.headerBadge}>
                <Calendar size={11} color="#ffffff" />
                <Text style={styles.headerBadgeText}>
                  POSTGRESQL ATTENDANCE LEDGER
                </Text>
              </View>
              <Text style={styles.headerTitle}>
                Attendance Analytics &amp; History
              </Text>
              <Text style={styles.headerSubtitle}>
                {student?.name || "Student"} &bull; Overall:{" "}
                {overall.toFixed(1)}%
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              activeOpacity={0.8}
            >
              <X size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* Metric Summary Ribbon */}
          <View style={styles.metricRibbon}>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>OVERALL</Text>
              <Text
                style={[
                  styles.metricVal,
                  { color: isSafe ? "#15803d" : "#b91c1c" },
                ]}
              >
                {overall.toFixed(1)}%
              </Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>CONDUCTED</Text>
              <Text style={styles.metricVal}>{attendance?.conducted ?? 0}</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>PRESENT</Text>
              <Text style={[styles.metricVal, { color: "#15803d" }]}>
                {attendance?.present ?? 0}
              </Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>ABSENT</Text>
              <Text style={[styles.metricVal, { color: "#b91c1c" }]}>
                {attendance?.absent ?? 0}
              </Text>
            </View>
          </View>

          {/* Scrollable Sub Tab Switcher */}
          <View style={styles.tabBarWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabScrollContent}
            >
              <TouchableOpacity
                onPress={() => setActiveTab("subjects")}
                style={[
                  styles.tabBtn,
                  activeTab === "subjects" && styles.tabBtnActive,
                ]}
                activeOpacity={0.8}
              >
                <BookOpen
                  size={13}
                  color={activeTab === "subjects" ? "#5c0d38" : "#64748b"}
                />
                <Text
                  style={[
                    styles.tabBtnText,
                    activeTab === "subjects" && styles.tabBtnTextActive,
                  ]}
                >
                  Subject Breakdown ({allSubjects.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveTab("monthly")}
                style={[
                  styles.tabBtn,
                  activeTab === "monthly" && styles.tabBtnActive,
                ]}
                activeOpacity={0.8}
              >
                <Layers
                  size={13}
                  color={activeTab === "monthly" ? "#5c0d38" : "#64748b"}
                />
                <Text
                  style={[
                    styles.tabBtnText,
                    activeTab === "monthly" && styles.tabBtnTextActive,
                  ]}
                >
                  Monthly Summary
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveTab("absent")}
                style={[
                  styles.tabBtn,
                  activeTab === "absent" && styles.tabBtnActive,
                ]}
                activeOpacity={0.8}
              >
                <AlertCircle
                  size={13}
                  color={activeTab === "absent" ? "#5c0d38" : "#64748b"}
                />
                <Text
                  style={[
                    styles.tabBtnText,
                    activeTab === "absent" && styles.tabBtnTextActive,
                  ]}
                >
                  Absent Dates ({absentList.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveTab("daily")}
                style={[
                  styles.tabBtn,
                  activeTab === "daily" && styles.tabBtnActive,
                ]}
                activeOpacity={0.8}
              >
                <Clock
                  size={13}
                  color={activeTab === "daily" ? "#5c0d38" : "#64748b"}
                />
                <Text
                  style={[
                    styles.tabBtnText,
                    activeTab === "daily" && styles.tabBtnTextActive,
                  ]}
                >
                  Recent Log
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          <ScrollView
            style={styles.body}
            contentContainerStyle={{ paddingBottom: 32 }}
          >
            {/* 1. SUBJECT BREAKDOWN TAB (NEP 2020) */}
            {activeTab === "subjects" && (
              <View>
                {/* NEP Compliance Summary Header Banner */}
                <View
                  style={[
                    styles.nepRuleBanner,
                    warningCount > 0
                      ? styles.nepRuleBannerWarn
                      : styles.nepRuleBannerSafe,
                  ]}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      marginBottom: 4,
                    }}
                  >
                    {warningCount > 0 ? (
                      <AlertTriangle size={15} color="#b45309" />
                    ) : (
                      <CheckCircle2 size={15} color="#15803d" />
                    )}
                    <Text
                      style={[
                        styles.nepRuleTitle,
                        { color: warningCount > 0 ? "#92400e" : "#166534" },
                      ]}
                    >
                      NEP-2020 Individual Course Attendance Rule
                    </Text>
                  </View>
                  <Text style={styles.nepRuleDesc}>
                    Students must maintain a minimum of 75% attendance
                    separately across all course categories (Major, Minor, Open
                    Elective, Vocational &amp; Multi-Disciplinary) to be
                    eligible for Autonomous End-Semester Examinations.
                  </Text>
                  <View style={styles.nepSummaryBadgeRow}>
                    <View style={styles.nepSafeTag}>
                      <Text style={styles.nepSafeTagText}>
                        {safeCount} Subjects Safe (&ge;75%)
                      </Text>
                    </View>
                    {warningCount > 0 && (
                      <View style={styles.nepWarnTag}>
                        <Text style={styles.nepWarnTagText}>
                          {warningCount} Attention Required
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Category Filter Pills */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.filterPillsRow}
                >
                  {[
                    { key: "ALL", label: "All Courses" },
                    { key: "MAJOR", label: "Major" },
                    { key: "MINOR", label: "Minor" },
                    { key: "OPEN_ELECTIVE", label: "Open Elective (GE)" },
                    { key: "VOCATIONAL", label: "Vocational (SEC)" },
                    {
                      key: "MULTI_DISCIPLINARY",
                      label: "Multi-Disciplinary (MD)",
                    },
                  ].map((f) => (
                    <TouchableOpacity
                      key={f.key}
                      onPress={() =>
                        setCategoryFilter(f.key as CategoryFilterType)
                      }
                      style={[
                        styles.filterPill,
                        categoryFilter === f.key && styles.filterPillActive,
                      ]}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.filterPillText,
                          categoryFilter === f.key &&
                            styles.filterPillTextActive,
                        ]}
                      >
                        {f.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Subject Cards List */}
                {filteredSubjects.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Calendar size={36} color="#94a3b8" />
                    <Text style={styles.emptyTitle}>
                      No classroom attendance sessions recorded yet.
                    </Text>
                    <Text style={styles.emptySub}>
                      Official classroom records will appear here as faculty
                      records sessions.
                    </Text>
                  </View>
                ) : (
                  filteredSubjects.map((sub, idx) => {
                    const theme = getCategoryTheme(sub.category);
                    const isSubSafe = sub.percentage >= 75;
                    const neededToPass = Math.ceil(
                      (0.75 * sub.total - sub.attended) / 0.25,
                    );
                    const safeMargin = Math.max(
                      0,
                      Math.floor((sub.attended - 0.75 * sub.total) / 0.75),
                    );

                    return (
                      <View key={idx} style={styles.subjectCard}>
                        {/* Top Row: Category Badge & Percentage */}
                        <View style={styles.subjectTopRow}>
                          <View
                            style={[
                              styles.categoryBadge,
                              {
                                backgroundColor: theme.bg,
                                borderColor: theme.border,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.categoryBadgeText,
                                { color: theme.text },
                              ]}
                            >
                              {sub.categoryLabel}
                            </Text>
                          </View>
                          <Text
                            style={[
                              styles.subjectPercentage,
                              { color: isSubSafe ? "#15803d" : "#b91c1c" },
                            ]}
                          >
                            {sub.percentage.toFixed(1)}%
                          </Text>
                        </View>

                        {/* Subject Code & Name */}
                        <View style={styles.subjectNameSection}>
                          <Text style={styles.subjectCode}>{sub.code}</Text>
                          <Text style={styles.subjectName}>{sub.name}</Text>
                        </View>

                        {/* Faculty Info */}
                        <View style={styles.facultyRow}>
                          <Text style={styles.facultyText}>
                            👨‍🏫 Faculty:{" "}
                            <Text
                              style={{ fontWeight: "700", color: "#334155" }}
                            >
                              {sub.teacher}
                            </Text>{" "}
                            &bull; {sub.credits} Credits
                          </Text>
                        </View>

                        {/* Progress Bar with 75% threshold marker */}
                        <View style={styles.progressBarWrapper}>
                          <View style={styles.progressBarBg}>
                            <View
                              style={[
                                styles.progressBarFill,
                                {
                                  width: `${Math.min(100, sub.percentage)}%`,
                                  backgroundColor: isSubSafe
                                    ? "#15803d"
                                    : "#b91c1c",
                                },
                              ]}
                            />
                          </View>
                          {/* 75% marker line */}
                          <View style={styles.thresholdMarker}>
                            <View style={styles.thresholdLine} />
                            <Text style={styles.thresholdLabel}>75%</Text>
                          </View>
                        </View>

                        {/* Stats Numbers Grid */}
                        <View style={styles.subjectStatsRow}>
                          <View style={styles.subStatBox}>
                            <Text style={styles.subStatLabel}>Conducted</Text>
                            <Text style={styles.subStatVal}>{sub.total}</Text>
                          </View>
                          <View style={styles.subStatDivider} />
                          <View style={styles.subStatBox}>
                            <Text style={styles.subStatLabel}>Attended</Text>
                            <Text
                              style={[styles.subStatVal, { color: "#15803d" }]}
                            >
                              {sub.attended}
                            </Text>
                          </View>
                          <View style={styles.subStatDivider} />
                          <View style={styles.subStatBox}>
                            <Text style={styles.subStatLabel}>Missed</Text>
                            <Text
                              style={[styles.subStatVal, { color: "#b91c1c" }]}
                            >
                              {sub.total - sub.attended}
                            </Text>
                          </View>
                        </View>

                        {/* NEP Exam Eligibility Guidance Footer */}
                        <View
                          style={[
                            styles.guidanceBox,
                            isSubSafe
                              ? styles.guidanceBoxSafe
                              : styles.guidanceBoxWarn,
                          ]}
                        >
                          {isSubSafe ? (
                            <Text style={styles.guidanceTextSafe}>
                              &bull; Eligible for End-Semester Exam &bull; Safe
                              Margin: Can miss {safeMargin} lecture
                              {safeMargin !== 1 ? "s" : ""} safely.
                            </Text>
                          ) : (
                            <Text style={styles.guidanceTextWarn}>
                              &bull; Shortage Alert! Must attend next{" "}
                              {neededToPass} lecture
                              {neededToPass !== 1 ? "s" : ""} consecutively to
                              reach 75% threshold.
                            </Text>
                          )}
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            )}

            {/* 2. MONTHLY SUMMARY TAB */}
            {activeTab === "monthly" && (
              <View>
                <Text style={styles.sectionTitle}>
                  Month-by-Month Attendance Breakdown
                </Text>
                {monthlyList.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Calendar size={36} color="#94a3b8" />
                    <Text style={styles.emptyTitle}>
                      No monthly attendance summaries available.
                    </Text>
                    <Text style={styles.emptySub}>
                      Aggregated monthly totals will display once classroom
                      sessions are recorded.
                    </Text>
                  </View>
                ) : (
                  monthlyList.map((m, idx) => (
                    <View key={idx} style={styles.monthCard}>
                      <View style={styles.monthHeaderRow}>
                        <Text style={styles.monthName}>{m.month}</Text>
                        <Text
                          style={[
                            styles.monthPct,
                            {
                              color: m.percentage >= 75 ? "#15803d" : "#b91c1c",
                            },
                          ]}
                        >
                          {m.percentage.toFixed(1)}%
                        </Text>
                      </View>
                      <View style={styles.progressBarBg}>
                        <View
                          style={[
                            styles.progressBarFill,
                            {
                              width: `${Math.min(100, m.percentage)}%`,
                              backgroundColor:
                                m.percentage >= 75 ? "#15803d" : "#b91c1c",
                            },
                          ]}
                        />
                      </View>
                      <View style={styles.monthStatRow}>
                        <Text style={styles.monthStatText}>
                          Working Lectures:{" "}
                          <Text style={{ fontWeight: "800" }}>
                            {m.workingDays}
                          </Text>
                        </Text>
                        <Text style={styles.monthStatText}>
                          Attended:{" "}
                          <Text style={{ fontWeight: "800", color: "#15803d" }}>
                            {m.present}
                          </Text>
                        </Text>
                        <Text style={styles.monthStatText}>
                          Missed:{" "}
                          <Text style={{ fontWeight: "800", color: "#b91c1c" }}>
                            {m.absent}
                          </Text>
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}

            {/* 3. ABSENT DATES TAB */}
            {activeTab === "absent" && (
              <View>
                <Text style={styles.sectionTitle}>
                  Documented Absence Register
                </Text>
                {absentList.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <CheckCircle2 size={36} color="#15803d" />
                    <Text style={styles.emptyTitle}>No Recorded Absences</Text>
                    <Text style={styles.emptySub}>
                      Perfect or updated attendance record.
                    </Text>
                  </View>
                ) : (
                  absentList.map((ab, idx) => (
                    <View key={idx} style={styles.absentCard}>
                      <View style={styles.absentDateCircle}>
                        <Clock size={16} color="#b91c1c" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.absentDateText}>{ab.date}</Text>
                        <Text style={styles.absentSubText}>
                          {ab.subjectCode}: {ab.subject}
                        </Text>
                        <Text style={styles.absentTeacherText}>
                          {ab.teacher} &bull; {ab.room}
                        </Text>
                      </View>
                      <View style={styles.absentBadge}>
                        <Text style={styles.absentBadgeText}>ABSENT</Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}

            {/* 4. RECENT LOG TAB */}
            {activeTab === "daily" && (
              <View>
                <Text style={styles.sectionTitle}>
                  Daily Verified Scans Log
                </Text>
                {dailyList.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Calendar size={36} color="#94a3b8" />
                    <Text style={styles.emptyTitle}>
                      Daily Logs Available via QR Scans
                    </Text>
                    <Text style={styles.emptySub}>
                      Scan lecture QR codes to view daily timestamps.
                    </Text>
                  </View>
                ) : (
                  dailyList.slice(0, 15).map((log, idx) => (
                    <View key={idx} style={styles.dailyRow}>
                      <View
                        style={[
                          styles.statusDot,
                          {
                            backgroundColor:
                              log.status === "PRESENT" ? "#15803d" : "#b91c1c",
                          },
                        ]}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.dailyDate}>
                          {log.date} ({log.day})
                        </Text>
                        <Text style={styles.dailySub}>
                          {log.subjectCode} - {log.subject}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.dailyStatus,
                          {
                            color:
                              log.status === "PRESENT" ? "#15803d" : "#b91c1c",
                          },
                        ]}
                      >
                        {log.status}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheetContainer: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "94%",
    overflow: "hidden",
  },
  header: {
    backgroundColor: "#5c0d38",
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  headerBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#ffffff",
  },
  headerSubtitle: {
    fontSize: 11,
    color: "rgba(255,255,255,0.85)",
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  metricRibbon: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
    paddingVertical: 12,
  },
  metricBox: {
    flex: 1,
    alignItems: "center",
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#64748b",
    letterSpacing: 0.5,
  },
  metricVal: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0f172a",
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    backgroundColor: "#e2e8f0",
  },
  tabBarWrapper: {
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
  },
  tabScrollContent: {
    paddingHorizontal: 16,
    flexDirection: "row",
  },
  tabBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginRight: 8,
    borderBottomWidth: 2.5,
    borderColor: "transparent",
  },
  tabBtnActive: {
    borderColor: "#5c0d38",
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
  },
  tabBtnTextActive: {
    color: "#5c0d38",
    fontWeight: "900",
  },
  body: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },

  // NEP Rule Banner
  nepRuleBanner: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 14,
  },
  nepRuleBannerSafe: {
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
  },
  nepRuleBannerWarn: {
    backgroundColor: "#fffbeb",
    borderColor: "#fde68a",
  },
  nepRuleTitle: {
    fontSize: 12,
    fontWeight: "900",
  },
  nepRuleDesc: {
    fontSize: 11,
    color: "#475569",
    lineHeight: 16,
    marginBottom: 10,
  },
  nepSummaryBadgeRow: {
    flexDirection: "row",
    gap: 8,
  },
  nepSafeTag: {
    backgroundColor: "#dcfce7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  nepSafeTagText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#15803d",
  },
  nepWarnTag: {
    backgroundColor: "#fee2e2",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  nepWarnTagText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#b91c1c",
  },

  // Category Filter Pills
  filterPillsRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 14,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  filterPillActive: {
    backgroundColor: "#5c0d38",
    borderColor: "#5c0d38",
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
  },
  filterPillTextActive: {
    color: "#ffffff",
    fontWeight: "800",
  },

  // Subject Card
  subjectCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    ...(Platform.OS === "web"
      ? ({ boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.04)" } as any)
      : { elevation: 2 }),
  },
  subjectTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  categoryBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  categoryBadgeText: {
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  subjectPercentage: {
    fontSize: 17,
    fontWeight: "900",
  },
  subjectNameSection: {
    marginBottom: 6,
  },
  subjectCode: {
    fontSize: 11,
    fontWeight: "900",
    color: "#64748b",
    letterSpacing: 0.5,
  },
  subjectName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0f172a",
    marginTop: 1,
  },
  facultyRow: {
    marginBottom: 10,
  },
  facultyText: {
    fontSize: 11,
    color: "#64748b",
  },
  progressBarWrapper: {
    position: "relative",
    marginBottom: 12,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: "#f1f5f9",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  thresholdMarker: {
    position: "absolute",
    left: "75%",
    top: -2,
    alignItems: "center",
  },
  thresholdLine: {
    width: 2,
    height: 12,
    backgroundColor: "#64748b",
  },
  thresholdLabel: {
    fontSize: 7.5,
    fontWeight: "800",
    color: "#64748b",
    marginTop: 1,
  },
  subjectStatsRow: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    paddingVertical: 8,
    marginBottom: 10,
  },
  subStatBox: {
    flex: 1,
    alignItems: "center",
  },
  subStatLabel: {
    fontSize: 8.5,
    fontWeight: "800",
    color: "#64748b",
    letterSpacing: 0.5,
  },
  subStatVal: {
    fontSize: 13,
    fontWeight: "900",
    color: "#0f172a",
    marginTop: 1,
  },
  subStatDivider: {
    width: 1,
    backgroundColor: "#e2e8f0",
  },
  guidanceBox: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  guidanceBoxSafe: {
    backgroundColor: "#f0fdf4",
  },
  guidanceBoxWarn: {
    backgroundColor: "#fef2f2",
  },
  guidanceTextSafe: {
    fontSize: 10.5,
    color: "#15803d",
    fontWeight: "700",
  },
  guidanceTextWarn: {
    fontSize: 10.5,
    color: "#b91c1c",
    fontWeight: "800",
  },

  // Monthly Card
  monthCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  monthHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  monthName: {
    fontSize: 13.5,
    fontWeight: "800",
    color: "#1e293b",
  },
  monthPct: {
    fontSize: 14,
    fontWeight: "900",
  },
  monthStatRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  monthStatText: {
    fontSize: 10.5,
    color: "#64748b",
  },

  // Absent Card
  absentCard: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  absentDateCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#fee2e2",
    alignItems: "center",
    justifyContent: "center",
  },
  absentDateText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#991b1b",
  },
  absentSubText: {
    fontSize: 11,
    color: "#1e293b",
    marginTop: 1,
  },
  absentTeacherText: {
    fontSize: 10,
    color: "#7f1d1d",
    marginTop: 1,
  },
  absentBadge: {
    backgroundColor: "#991b1b",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  absentBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#ffffff",
  },

  // Daily Row
  dailyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dailyDate: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#1e293b",
  },
  dailySub: {
    fontSize: 10,
    color: "#64748b",
  },
  dailyStatus: {
    fontSize: 11,
    fontWeight: "800",
  },
  emptyBox: {
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  emptyTitle: {
    fontSize: 13.5,
    fontWeight: "800",
    color: "#475569",
  },
  emptySub: {
    fontSize: 11,
    color: "#94a3b8",
  },
});
