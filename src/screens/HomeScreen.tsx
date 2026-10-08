import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import {
  QrCode,
  Bell,
  Calendar,
  AlertTriangle,
  FileText,
  CreditCard,
  MessageSquare,
  ChevronRight,
  ShieldAlert,
  Clock,
  MapPin,
  CheckCircle2,
  Award,
  Menu,
  Sparkles,
  Bot,
  UserCheck,
  Compass,
  FileCheck2,
  GraduationCap,
  BookOpen,
} from "lucide-react-native";
import { useApp } from "../context/AppContext";
import { CollegeAddressFooter } from "../components/CollegeAddressFooter";

interface Props {
  onOpenQRScanner: () => void;
  onOpenWarningNotice: () => void;
  onOpenNotifications: () => void;
  onOpenGrievance: () => void;
  onOpenMarksheet: () => void;
  onOpenDrawer: () => void;
  onOpenDeptNavigator: () => void;
  onOpenPYQModal: () => void;
  onOpenDigitalID: () => void;
  onOpenAdmitCard: () => void;
  onOpenAttendanceHistory: () => void;
  onOpenHolidays: () => void;
  onOpenSahayak: () => void;
  onOpenATKT?: () => void;
  onOpenCopyShowing?: () => void;
  onNavigateTab: (tab: "home" | "academics" | "fees" | "profile") => void;
}

export const HomeScreen: React.FC<Props> = ({
  onOpenQRScanner,
  onOpenWarningNotice,
  onOpenNotifications,
  onOpenGrievance,
  onOpenMarksheet,
  onOpenDrawer,
  onOpenDeptNavigator,
  onOpenPYQModal,
  onOpenDigitalID,
  onOpenAdmitCard,
  onOpenAttendanceHistory,
  onOpenHolidays,
  onOpenSahayak,
  onOpenATKT,
  onOpenCopyShowing,
  onNavigateTab,
}) => {
  const { student, attendance, timetable, fees, notifications, warningNotice } =
    useApp();

  const unreadNotifs =
    notifications.filter((n) => !n.read).length +
    (warningNotice?.hasActiveWarning &&
    !notifications.some((n) =>
      (n.title || "").toLowerCase().includes("warning"),
    )
      ? 1
      : 0);
  const hasAttendance = Boolean(attendance && attendance.conducted > 0);
  const overallAtt = hasAttendance ? attendance!.overall : 0;
  const hasWarning = Boolean(warningNotice?.hasActiveWarning);

  // Resolve today's schedule dynamically from backend timetable
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
    subject: item.subject || item.subjectName || "Course Unit",
    code: item.code || "",
    teacher: item.teacher || item.teacherName || "Not available",
    room: item.room || "Room TBA",
    status: (item.status === "LIVE"
      ? "LIVE"
      : item.status === "COMPLETED"
        ? "COMPLETED"
        : "SCHEDULED") as "LIVE" | "SCHEDULED" | "COMPLETED",
  }));

  const liveClass = todayClasses.find((t: any) => t.status === "LIVE");
  const upcomingClass = todayClasses.find((t: any) => t.status === "SCHEDULED");
  const nextTargetClass = liveClass || upcomingClass || todayClasses[0];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.contentPadding}>
        {/* 1. COMPACT STUDENT PROFILE HERO GREETING */}
        <View style={styles.profileHeroCard}>
          <View style={styles.profileHeroTop}>
            {student?.avatarUrl ? (
              <Image
                source={{ uri: student.avatarUrl }}
                style={styles.studentAvatar}
              />
            ) : (
              <View
                style={[
                  styles.studentAvatar,
                  {
                    backgroundColor: "#5c0d38",
                    alignItems: "center",
                    justifyContent: "center",
                  },
                ]}
              >
                <Text
                  style={{ color: "#ffffff", fontWeight: "800", fontSize: 16 }}
                >
                  {(student?.name || "S").slice(0, 2).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <View style={styles.nameRow}>
                <Text style={styles.studentName}>
                  {student?.name || "Student"}
                </Text>
                <View style={styles.verifiedBadge}>
                  <CheckCircle2 size={12} color="#15803d" />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              </View>
              <Text style={styles.studentCourse}>
                {student?.programme || student?.course || "—"}
              </Text>
              <View style={styles.studentMetaChipsRow}>
                <Text style={styles.metaChipText}>
                  Roll: {student?.rollNo || "—"}
                </Text>
                <Text style={styles.metaDot}>•</Text>
                <Text style={styles.metaChipText}>
                  Enr: {student?.enrollmentNo || "—"}
                </Text>
                <Text style={styles.metaDot}>•</Text>
                <Text style={styles.metaChipText}>
                  Sem {student?.semester || "—"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 2. DISCIPLINARY WARNING ALERT BAR (ONLY IF ACTIVE) */}
        {hasWarning && (
          <TouchableOpacity
            onPress={onOpenWarningNotice}
            style={styles.warningAlertBar}
            activeOpacity={0.88}
          >
            <View style={styles.warningAlertLeft}>
              <View style={styles.warningAlertBadge}>
                <Text style={styles.warningAlertBadgeText}>
                  🚨 NOTICE #{warningNotice?.warningNoticeCount || 2}
                </Text>
              </View>
              <Text style={styles.warningAlertText} numberOfLines={1}>
                Absence Warning ({overallAtt.toFixed(1)}%)
              </Text>
            </View>
            <View style={styles.warningPdfBtn}>
              <Text style={styles.warningPdfBtnText}>View PDF &rarr;</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* 3. ONLINE ADMISSIONS STRIP */}
        <View style={styles.admissionsStrip}>
          <View style={styles.admissionsLeft}>
            <View style={styles.admissionsBadge}>
              <Text style={styles.admissionsBadgeText}>ADMISSIONS 2026-27</Text>
            </View>
            <Text style={styles.admissionsText} numberOfLines={1}>
              Autonomous Programs Open (B.Sc / M.Sc)
            </Text>
          </View>
          <TouchableOpacity onPress={() => onNavigateTab("academics")}>
            <Text style={styles.admissionsApplyText}>Explore &rarr;</Text>
          </TouchableOpacity>
        </View>

        {/* 4. HOLKAR SAHAYAK - SMART HELPDESK BANNER */}
        <TouchableOpacity
          onPress={onOpenSahayak}
          style={styles.sahayakBanner}
          activeOpacity={0.9}
        >
          <View style={styles.sahayakLeft}>
            <View style={styles.sahayakIconBox}>
              <Bot size={22} color="#fbcfe8" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.sahayakTitleRow}>
                <Text style={styles.sahayakTitle}>Holkar Sahayak 🤖</Text>
                <Sparkles size={13} color="#fef08a" />
                <View style={styles.smartHelpdeskBadge}>
                  <Text style={styles.smartHelpdeskBadgeText}>
                    SMART HELPDESK
                  </Text>
                </View>
              </View>
              <Text style={styles.sahayakSub}>
                Autonomous Helpdesk • Attendance, Results &amp; Fees
              </Text>
            </View>
          </View>
          <View style={styles.openHelpdeskBtn}>
            <Text style={styles.openHelpdeskText}>Ask &rarr;</Text>
          </View>
        </TouchableOpacity>

        {/* 5. CONDUCTED ATTENDANCE OVERVIEW WIDGET */}
        <View style={styles.widgetCard}>
          <View style={styles.widgetHeader}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Calendar size={15} color="#5c0d38" />
              <Text style={styles.widgetHeaderTitle}>
                Conducted Attendance Overview
              </Text>
            </View>
            {hasAttendance ? (
              <TouchableOpacity onPress={onOpenAttendanceHistory}>
                <Text style={styles.widgetHeaderLink}>Full History &rarr;</Text>
              </TouchableOpacity>
            ) : (
              <View
                style={{
                  backgroundColor: "#f1f5f9",
                  paddingHorizontal: 7,
                  paddingVertical: 2,
                  borderRadius: 10,
                }}
              >
                <Text
                  style={{ fontSize: 10, fontWeight: "700", color: "#64748b" }}
                >
                  No Record Yet
                </Text>
              </View>
            )}
          </View>

          {hasAttendance ? (
            <>
              <View style={styles.attendanceBody}>
                <View style={styles.attCircleBox}>
                  <Text
                    style={[
                      styles.attPercentageText,
                      { color: overallAtt >= 75 ? "#15803d" : "#b91c1c" },
                    ]}
                  >
                    {overallAtt.toFixed(1)}%
                  </Text>
                  <Text style={styles.attSubText}>Total Presence</Text>
                </View>

                <View style={styles.attStatsGrid}>
                  <View style={styles.attStatItem}>
                    <Text style={styles.attStatLabel}>Conducted</Text>
                    <Text style={styles.attStatVal}>
                      {attendance?.conducted || 0}
                    </Text>
                  </View>
                  <View style={styles.attStatItem}>
                    <Text style={styles.attStatLabel}>Present</Text>
                    <Text style={[styles.attStatVal, { color: "#15803d" }]}>
                      {attendance?.present || 0}
                    </Text>
                  </View>
                  <View style={styles.attStatItem}>
                    <Text style={styles.attStatLabel}>Absent</Text>
                    <Text style={[styles.attStatVal, { color: "#b91c1c" }]}>
                      {attendance?.absent || 0}
                    </Text>
                  </View>
                  <View style={styles.attStatItem}>
                    <Text style={styles.attStatLabel}>Excluded</Text>
                    <Text style={styles.attStatVal}>
                      {attendance?.excluded || 0}
                    </Text>
                  </View>
                </View>
              </View>

              <View
                style={[
                  styles.statusTagRow,
                  { backgroundColor: overallAtt >= 75 ? "#f0fdf4" : "#fef2f2" },
                ]}
              >
                <Text
                  style={[
                    styles.statusTagText,
                    { color: overallAtt >= 75 ? "#15803d" : "#991b1b" },
                  ]}
                >
                  {overallAtt >= 75
                    ? "✅ Eligible for Semester Exam under Autonomous NEP Ordinance"
                    : "⚠️ Attendance Shortfall: Below mandatory 75% threshold"}
                </Text>
              </View>
            </>
          ) : (
            <View
              style={{
                paddingVertical: 18,
                alignItems: "center",
                backgroundColor: "#f8fafc",
                borderRadius: 12,
                marginVertical: 6,
                borderStyle: "dashed",
                borderWidth: 1,
                borderColor: "#cbd5e1",
              }}
            >
              <Calendar size={22} color="#94a3b8" />
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "700",
                  color: "#1e293b",
                  marginTop: 6,
                }}
              >
                No Attendance Marked Yet
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: "#64748b",
                  textAlign: "center",
                  marginTop: 2,
                  paddingHorizontal: 16,
                }}
              >
                Daily lecture attendance and percentage will appear here once
                classroom sessions begin.
              </Text>
            </View>
          )}
        </View>

        {/* 6. FEES STATUS WIDGET */}
        <View style={styles.widgetCard}>
          <View style={styles.widgetHeader}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <CreditCard size={15} color="#5c0d38" />
              <Text style={styles.widgetHeaderTitle}>
                Fee Clearance &amp; Ledger
              </Text>
            </View>
            <TouchableOpacity onPress={() => onNavigateTab("fees")}>
              <Text style={styles.widgetHeaderLink}>Manage Fees &rarr;</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.feeStatsRow}>
            <View style={styles.feeStatBox}>
              <Text style={styles.feeLabel}>Total Course Fee</Text>
              <Text style={styles.feeVal}>
                ₹{fees?.summary?.totalCourseFee ?? 0}
              </Text>
            </View>
            <View style={styles.feeStatBox}>
              <Text style={styles.feeLabel}>Paid Fee</Text>
              <Text style={[styles.feeVal, { color: "#15803d" }]}>
                ₹{fees?.summary?.totalPaid ?? 0}
              </Text>
            </View>
            <View style={styles.feeStatBox}>
              <Text style={styles.feeLabel}>Pending Due</Text>
              <Text style={[styles.feeVal, { color: "#ea580c" }]}>
                ₹{fees?.summary?.pendingAmount ?? 0}
              </Text>
            </View>
          </View>

          <View style={styles.feeActionRow}>
            <View
              style={[
                styles.feePill,
                {
                  backgroundColor:
                    (fees?.summary?.pendingAmount || 0) === 0
                      ? "#dcfce7"
                      : "#fef3c7",
                },
              ]}
            >
              <Text
                style={[
                  styles.feePillText,
                  {
                    color:
                      (fees?.summary?.pendingAmount || 0) === 0
                        ? "#15803d"
                        : "#b45309",
                  },
                ]}
              >
                {(fees?.summary?.pendingAmount || 0) === 0
                  ? "STATUS: FULLY PAID"
                  : "STATUS: PARTIAL CLEARANCE"}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => onNavigateTab("fees")}
              style={styles.feePayBtn}
            >
              <Text style={styles.feePayBtnText}>Pay Online &rarr;</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 7. TODAY'S SCHEDULE & UPCOMING CLASS SPOTLIGHT + HORIZONTAL SLIDER */}
        <View style={styles.widgetCard}>
          <View style={styles.widgetHeader}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Clock size={15} color="#5c0d38" />
              <Text style={styles.widgetHeaderTitle}>
                Upcoming Class &amp; Schedule
              </Text>
              <View style={styles.dayBadgePill}>
                <Text style={styles.dayBadgePillText}>{todayDayName}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => onNavigateTab("academics")}>
              <Text style={styles.widgetHeaderLink}>Full Timetable &rarr;</Text>
            </TouchableOpacity>
          </View>

          {todayClasses.length > 0 ? (
            <>
              {/* 7A. NEXT CLASS SPOTLIGHT BANNER */}
              {nextTargetClass && (
                <View
                  style={[
                    styles.spotlightCard,
                    nextTargetClass.status === "LIVE"
                      ? styles.spotlightLive
                      : styles.spotlightUpcoming,
                  ]}
                >
                  <View style={styles.spotlightTopRow}>
                    <View
                      style={
                        nextTargetClass.status === "LIVE"
                          ? styles.badgeLive
                          : styles.badgeUpcoming
                      }
                    >
                      <Text
                        style={
                          nextTargetClass.status === "LIVE"
                            ? styles.badgeLiveText
                            : styles.badgeUpcomingText
                        }
                      >
                        {nextTargetClass.status === "LIVE"
                          ? "● LIVE CLASS IN PROGRESS"
                          : "⚡ NEXT SCHEDULED CLASS"}
                      </Text>
                    </View>
                    <Text style={styles.spotlightTimeText}>
                      {nextTargetClass.time}
                    </Text>
                  </View>

                  <Text style={styles.spotlightSubject}>
                    {nextTargetClass.subject}
                  </Text>
                  <Text style={styles.spotlightMeta}>
                    Course:{" "}
                    <Text style={{ fontWeight: "800" }}>
                      {nextTargetClass.code}
                    </Text>{" "}
                    &bull; Faculty:{" "}
                    <Text style={{ fontWeight: "800" }}>
                      {nextTargetClass.teacher}
                    </Text>
                  </Text>

                  <View style={styles.spotlightBottomRow}>
                    <View style={styles.spotlightRoomBox}>
                      <MapPin size={13} color="#0284c7" />
                      <Text style={styles.spotlightRoomText}>
                        ROOM: {nextTargetClass.room.toUpperCase()}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={onOpenQRScanner}
                      style={styles.spotlightScanBtn}
                      activeOpacity={0.85}
                    >
                      <QrCode size={13} color="#ffffff" />
                      <Text style={styles.spotlightScanText}>
                        Scan Attendance
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* 7B. LEFT-TO-RIGHT HORIZONTAL CLASS SLIDER */}
              <View style={styles.sliderHeaderRow}>
                <Text style={styles.sliderTitle}>
                  Today's Lectures ({todayClasses.length} Scheduled)
                </Text>
                <Text style={styles.sliderHint}>Swipe left to view &rarr;</Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.classSliderScroll}
              >
                {todayClasses.map((item: any, idx: number) => {
                  const isLive = item.status === "LIVE";
                  const isCompleted = item.status === "COMPLETED";
                  const isNext =
                    !isLive &&
                    !isCompleted &&
                    idx ===
                      todayClasses.findIndex(
                        (c: any) => c.status === "SCHEDULED",
                      );

                  return (
                    <View
                      key={item.id || idx}
                      style={[
                        styles.sliderCard,
                        isLive && styles.sliderCardLive,
                        isNext && styles.sliderCardNext,
                        isCompleted && styles.sliderCardCompleted,
                      ]}
                    >
                      <View style={styles.sliderCardTop}>
                        <View
                          style={[
                            styles.cardStatusPill,
                            isLive && { backgroundColor: "#dcfce7" },
                            isNext && { backgroundColor: "#fef3c7" },
                            isCompleted && { backgroundColor: "#f1f5f9" },
                          ]}
                        >
                          <Text
                            style={[
                              styles.cardStatusPillText,
                              isLive && { color: "#15803d" },
                              isNext && { color: "#b45309" },
                              isCompleted && { color: "#64748b" },
                            ]}
                          >
                            {isLive
                              ? "● LIVE"
                              : isNext
                                ? "⚡ NEXT UP"
                                : isCompleted
                                  ? "✓ COMPLETED"
                                  : "SCHEDULED"}
                          </Text>
                        </View>
                        <Text style={styles.sliderCardTime}>{item.time}</Text>
                      </View>

                      <Text style={styles.sliderCardSubject} numberOfLines={2}>
                        {item.subject}
                      </Text>
                      <Text style={styles.sliderCardCode} numberOfLines={1}>
                        {item.code} &bull; {item.teacher}
                      </Text>

                      <View style={styles.sliderRoomContainer}>
                        <MapPin size={12} color="#0284c7" />
                        <Text style={styles.sliderRoomText} numberOfLines={1}>
                          {item.room}
                        </Text>
                      </View>

                      {isLive || isNext ? (
                        <TouchableOpacity
                          onPress={onOpenQRScanner}
                          style={styles.sliderScanBtn}
                          activeOpacity={0.85}
                        >
                          <Text style={styles.sliderScanBtnText}>
                            ⚡ Scan QR
                          </Text>
                        </TouchableOpacity>
                      ) : isCompleted ? (
                        <View style={styles.sliderConcludedPill}>
                          <Text style={styles.sliderConcludedText}>
                            Lecture Concluded
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.sliderUpcomingPill}>
                          <Text style={styles.sliderUpcomingText}>
                            Scheduled
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </ScrollView>
            </>
          ) : (
            <View
              style={{
                paddingVertical: 18,
                alignItems: "center",
                backgroundColor: "#f8fafc",
                borderRadius: 12,
                marginVertical: 6,
                borderStyle: "dashed",
                borderWidth: 1,
                borderColor: "#cbd5e1",
              }}
            >
              <Clock size={22} color="#94a3b8" />
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "700",
                  color: "#1e293b",
                  marginTop: 6,
                }}
              >
                No Lectures Scheduled Today
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: "#64748b",
                  textAlign: "center",
                  marginTop: 2,
                  paddingHorizontal: 16,
                }}
              >
                Please check the academic calendar or view full timetable for
                other days.
              </Text>
            </View>
          )}
        </View>

        {/* 8. DIGITAL PASS BANNER */}
        <TouchableOpacity
          onPress={onOpenDigitalID}
          style={styles.digitalPassBanner}
          activeOpacity={0.9}
        >
          <View style={styles.digitalPassLeft}>
            <View style={styles.digitalPassIconBox}>
              <UserCheck size={18} color="#ffffff" />
            </View>
            <View>
              <Text style={styles.digitalPassTitle}>
                Digital Student ID &amp; Library Pass
              </Text>
              <Text style={styles.digitalPassSub}>
                Official Holkar Barcode &bull; Verified Active Student
              </Text>
            </View>
          </View>
          <View style={styles.viewIdBtn}>
            <Text style={styles.viewIdBtnText}>View ID &rarr;</Text>
          </View>
        </TouchableOpacity>

        {/* 9. ACADEMIC QUICK LINKS GRID (8 ACTIONS) */}
        <Text style={styles.quickLinksHeading}>Academic Quick Links</Text>
        <View style={styles.quickGrid}>
          <TouchableOpacity onPress={onOpenMarksheet} style={styles.quickCard}>
            <View
              style={[styles.quickIconCircle, { backgroundColor: "#ecfdf5" }]}
            >
              <Award size={20} color="#10b981" />
            </View>
            <Text style={styles.quickTitle}>Exam Results</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onOpenQRScanner} style={styles.quickCard}>
            <View
              style={[styles.quickIconCircle, { backgroundColor: "#fdf2f7" }]}
            >
              <QrCode size={20} color="#5c0d38" />
            </View>
            <Text style={styles.quickTitle}>Scan Lecture</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onOpenDeptNavigator}
            style={styles.quickCard}
          >
            <View
              style={[styles.quickIconCircle, { backgroundColor: "#f0f9ff" }]}
            >
              <Compass size={20} color="#0284c7" />
            </View>
            <Text style={styles.quickTitle}>Campus Map</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onOpenAdmitCard} style={styles.quickCard}>
            <View
              style={[styles.quickIconCircle, { backgroundColor: "#eff6ff" }]}
            >
              <FileCheck2 size={20} color="#2563eb" />
            </View>
            <Text style={styles.quickTitle}>Admit Card</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onOpenPYQModal} style={styles.quickCard}>
            <View
              style={[styles.quickIconCircle, { backgroundColor: "#f5f3ff" }]}
            >
              <BookOpen size={20} color="#7c3aed" />
            </View>
            <Text style={styles.quickTitle}>BoS Syllabus</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onOpenAttendanceHistory}
            style={styles.quickCard}
          >
            <View
              style={[styles.quickIconCircle, { backgroundColor: "#fffbeb" }]}
            >
              <Calendar size={20} color="#d97706" />
            </View>
            <Text style={styles.quickTitle}>Attendance</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onOpenHolidays} style={styles.quickCard}>
            <View
              style={[styles.quickIconCircle, { backgroundColor: "#fdf4ff" }]}
            >
              <Sparkles size={20} color="#c026d3" />
            </View>
            <Text style={styles.quickTitle}>Holidays</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onOpenGrievance} style={styles.quickCard}>
            <View
              style={[styles.quickIconCircle, { backgroundColor: "#fef2f2" }]}
            >
              <MessageSquare size={20} color="#dc2626" />
            </View>
            <Text style={styles.quickTitle}>Grievance</Text>
          </TouchableOpacity>
        </View>

        {/* 10. LIVE NOTIFICATIONS FEED */}
        <View style={styles.widgetCard}>
          <View style={styles.widgetHeader}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Bell size={15} color="#5c0d38" />
              <Text style={styles.widgetHeaderTitle}>
                Official College Notices
              </Text>
            </View>
            <TouchableOpacity onPress={onOpenNotifications}>
              <Text style={styles.widgetHeaderLink}>
                View All ({notifications.length}) &rarr;
              </Text>
            </TouchableOpacity>
          </View>

          {notifications.length === 0 ? (
            <View
              style={{
                paddingVertical: 18,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Bell size={24} color="#cbd5e1" style={{ marginBottom: 6 }} />
              <Text
                style={{ fontSize: 13, color: "#64748b", fontWeight: "600" }}
              >
                No new notifications
              </Text>
              <Text style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                All official circulars will be displayed here
              </Text>
            </View>
          ) : (
            notifications.slice(0, 3).map((notif) => (
              <TouchableOpacity
                key={notif.id}
                onPress={onOpenNotifications}
                style={styles.notifItem}
              >
                <View style={styles.notifDot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.notifTitle}>{notif.title}</Text>
                  <Text style={styles.notifDesc} numberOfLines={2}>
                    {notif.message}
                  </Text>
                  <Text style={styles.notifTime}>{notif.timeAgo}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* 11. COLLEGE OFFICIAL FOOTER */}
        <CollegeAddressFooter />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  dayBadgePill: {
    backgroundColor: "#fdf2f8",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#fbcfe8",
  },
  dayBadgePillText: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "#5c0d38",
  },
  spotlightCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1.5,
  },
  spotlightLive: {
    backgroundColor: "#f0fdf4",
    borderColor: "#86efac",
  },
  spotlightUpcoming: {
    backgroundColor: "#eff6ff",
    borderColor: "#93c5fd",
  },
  spotlightTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  badgeLive: {
    backgroundColor: "#15803d",
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 4,
  },
  badgeLiveText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#ffffff",
  },
  badgeUpcoming: {
    backgroundColor: "#1d4ed8",
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 4,
  },
  badgeUpcomingText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#ffffff",
  },
  spotlightTimeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1e293b",
  },
  spotlightSubject: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0f172a",
  },
  spotlightMeta: {
    fontSize: 11,
    color: "#475569",
    marginTop: 2,
  },
  spotlightBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  spotlightRoomBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#e0f2fe",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flex: 1,
    marginRight: 8,
  },
  spotlightRoomText: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#0369a1",
  },
  spotlightScanBtn: {
    backgroundColor: "#5c0d38",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  spotlightScanText: {
    color: "#ffffff",
    fontSize: 10.5,
    fontWeight: "800",
  },
  sliderHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sliderTitle: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "#334155",
  },
  sliderHint: {
    fontSize: 10,
    fontWeight: "600",
    color: "#94a3b8",
  },
  classSliderScroll: {
    paddingVertical: 4,
    gap: 10,
  },
  sliderCard: {
    width: 220,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 10,
    justifyContent: "space-between",
  },
  sliderCardLive: {
    borderColor: "#22c55e",
    backgroundColor: "#f0fdf4",
  },
  sliderCardNext: {
    borderColor: "#f59e0b",
    backgroundColor: "#fffbeb",
  },
  sliderCardCompleted: {
    borderColor: "#cbd5e1",
    backgroundColor: "#f8fafc",
    opacity: 0.85,
  },
  sliderCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  cardStatusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: "#e2e8f0",
  },
  cardStatusPillText: {
    fontSize: 8.5,
    fontWeight: "900",
    color: "#475569",
  },
  sliderCardTime: {
    fontSize: 9.5,
    fontWeight: "700",
    color: "#64748b",
  },
  sliderCardSubject: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#0f172a",
    minHeight: 34,
  },
  sliderCardCode: {
    fontSize: 10,
    color: "#64748b",
    marginTop: 2,
  },
  sliderRoomContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
    marginTop: 6,
    marginBottom: 8,
  },
  sliderRoomText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#0284c7",
  },
  sliderScanBtn: {
    backgroundColor: "#5c0d38",
    paddingVertical: 5,
    borderRadius: 6,
    alignItems: "center",
  },
  sliderScanBtnText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "800",
  },
  sliderConcludedPill: {
    backgroundColor: "#e2e8f0",
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: "center",
  },
  sliderConcludedText: {
    color: "#64748b",
    fontSize: 9.5,
    fontWeight: "700",
  },
  sliderUpcomingPill: {
    backgroundColor: "#e0f2fe",
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: "center",
  },
  sliderUpcomingText: {
    color: "#0369a1",
    fontSize: 9.5,
    fontWeight: "700",
  },

  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
  },
  logoTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  headerLogo: {
    width: 38,
    height: 38,
  },
  collegeName: {
    fontSize: 12.5,
    fontWeight: "900",
    color: "#5c0d38",
  },
  collegeSub: {
    fontSize: 8.5,
    fontWeight: "700",
    color: "#64748b",
    letterSpacing: 0.4,
  },
  headerRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  rolePill: {
    backgroundColor: "#fdf2f7",
    borderWidth: 1,
    borderColor: "#fbcfe8",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  rolePillText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#5c0d38",
  },
  iconCircleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  menuBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  bellBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#dc2626",
    borderRadius: 8,
    width: 15,
    height: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  bellBadgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800",
  },
  contentPadding: {
    padding: 14,
  },
  profileHeroCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  profileHeroTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  studentAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: "#5c0d38",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  studentName: {
    fontSize: 15,
    fontWeight: "900",
    color: "#1e1b24",
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "#dcfce7",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  verifiedText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#15803d",
  },
  studentCourse: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 1,
  },
  studentMetaChipsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },
  metaChipText: {
    fontSize: 10,
    color: "#475569",
  },
  metaDot: {
    color: "#cbd5e1",
    fontSize: 8,
  },
  warningAlertBar: {
    backgroundColor: "#7f1d1d",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: "#f87171",
    shadowColor: "#991b1b",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  warningAlertLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  warningAlertBadge: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  warningAlertBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#991b1b",
  },
  warningAlertText: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "#ffffff",
    flex: 1,
  },
  warningPdfBtn: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  warningPdfBtnText: {
    fontSize: 10.5,
    fontWeight: "900",
    color: "#991b1b",
  },
  admissionsStrip: {
    backgroundColor: "#fdf2f7",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fbcfe8",
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  admissionsLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  admissionsBadge: {
    backgroundColor: "#5c0d38",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  admissionsBadgeText: {
    fontSize: 8.5,
    fontWeight: "900",
    color: "#ffffff",
  },
  admissionsText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1e1b24",
    flex: 1,
  },
  admissionsApplyText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#5c0d38",
  },
  sahayakBanner: {
    backgroundColor: "#2e1065",
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  sahayakLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  sahayakIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  sahayakTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  sahayakTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#ffffff",
  },
  smartHelpdeskBadge: {
    backgroundColor: "#10b981",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  smartHelpdeskBadgeText: {
    fontSize: 8.5,
    fontWeight: "800",
    color: "#ffffff",
  },
  sahayakSub: {
    fontSize: 10.5,
    color: "#cbd5e1",
    marginTop: 1,
  },
  openHelpdeskBtn: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  openHelpdeskText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#5c0d38",
  },
  widgetCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 12,
  },
  widgetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  widgetHeaderTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1e293b",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  widgetHeaderLink: {
    fontSize: 11,
    fontWeight: "800",
    color: "#5c0d38",
  },
  attendanceBody: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  attCircleBox: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#f8fafc",
    borderWidth: 3,
    borderColor: "#5c0d38",
    alignItems: "center",
    justifyContent: "center",
  },
  attPercentageText: {
    fontSize: 17,
    fontWeight: "900",
  },
  attSubText: {
    fontSize: 9,
    color: "#64748b",
    fontWeight: "700",
  },
  attStatsGrid: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  attStatItem: {
    width: "45%",
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    padding: 8,
  },
  attStatLabel: {
    fontSize: 9.5,
    color: "#64748b",
    fontWeight: "600",
  },
  attStatVal: {
    fontSize: 13.5,
    fontWeight: "800",
    color: "#1e293b",
    marginTop: 2,
  },
  statusTagRow: {
    marginTop: 10,
    padding: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  statusTagText: {
    fontSize: 10.5,
    fontWeight: "700",
    textAlign: "center",
  },
  feeStatsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  feeStatBox: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    padding: 8,
  },
  feeLabel: {
    fontSize: 9,
    color: "#64748b",
    fontWeight: "600",
  },
  feeVal: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1e293b",
    marginTop: 2,
  },
  feeActionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 4,
  },
  feePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  feePillText: {
    fontSize: 9.5,
    fontWeight: "800",
  },
  feePayBtn: {
    backgroundColor: "#5c0d38",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  feePayBtnText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "800",
  },
  liveClassCard: {
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 12,
    padding: 12,
  },
  liveClassTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  liveBadge: {
    backgroundColor: "#15803d",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  liveBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#ffffff",
  },
  liveClassTime: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#166534",
  },
  liveClassName: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0f172a",
  },
  liveClassMeta: {
    fontSize: 11,
    color: "#475569",
    marginTop: 2,
  },
  liveRoomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  liveRoomText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0284c7",
  },
  digitalPassBanner: {
    backgroundColor: "#5c0d38",
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  digitalPassLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  digitalPassIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  digitalPassTitle: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#ffffff",
  },
  digitalPassSub: {
    fontSize: 10,
    color: "rgba(255,255,255,0.85)",
    marginTop: 1,
  },
  viewIdBtn: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  viewIdBtnText: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#5c0d38",
  },
  quickLinksHeading: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  quickCard: {
    width: "23%",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  quickIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  quickTitle: {
    fontSize: 10,
    fontWeight: "700",
    color: "#1e293b",
    textAlign: "center",
  },
  notifItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
  },
  notifDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#5c0d38",
    marginTop: 4,
  },
  notifTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1e293b",
  },
  notifDesc: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 1,
    lineHeight: 15,
  },
  notifTime: {
    fontSize: 9.5,
    color: "#94a3b8",
    marginTop: 2,
  },
});
