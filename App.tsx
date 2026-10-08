import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
  ActivityIndicator,
  Image,
} from "react-native";
import {
  Home,
  BookOpen,
  CreditCard,
  User,
  QrCode,
  Bell,
  Menu,
} from "lucide-react-native";

import { AppProvider, useApp } from "./src/context/AppContext";
import { LoginScreen } from "./src/screens/LoginScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { AcademicsScreen } from "./src/screens/AcademicsScreen";
import { FeesScreen } from "./src/screens/FeesScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";

import { QRScanModal } from "./src/components/QRScanModal";
import { WarningLetterModal } from "./src/components/WarningLetterModal";
import { NotificationsModal } from "./src/components/NotificationsModal";
import { GrievanceModal } from "./src/components/GrievanceModal";
import { FeePayModal } from "./src/components/FeePayModal";
import { FeeReceiptSlipModal } from "./src/components/FeeReceiptSlipModal";
import { MarksheetModal } from "./src/components/MarksheetModal";
import { QuickDrawerModal } from "./src/components/QuickDrawerModal";
import { CampusMapModal } from "./src/components/CampusMapModal";
import { DigitalIdModal } from "./src/components/DigitalIdModal";
import { PYQAndSyllabusModal } from "./src/components/PYQAndSyllabusModal";
import { AdmitCardModal } from "./src/components/AdmitCardModal";
import { AttendanceHistoryModal } from "./src/components/AttendanceHistoryModal";
import { AcademicHolidaysModal } from "./src/components/AcademicHolidaysModal";
import { HolkarSahayakModal } from "./src/components/HolkarSahayakModal";
import { ATKTModal } from "./src/components/ATKTModal";
import { CopyShowingModal } from "./src/components/CopyShowingModal";

import type { FeeInstallment, StudentProfile } from "./src/types";

function MainApp() {
  const {
    isLoading,
    isLoggedIn,
    student,
    fees,
    notifications,
    warningNotice,
    dataError,
    refreshData,
    refreshNotifications,
    markAllNotificationsAsRead,
    markNotificationAsRead,
    logout,
  } = useApp();

  const [activeTab, setActiveTab] = useState<
    "home" | "academics" | "fees" | "profile"
  >("home");
  const unreadNotifs =
    (notifications || []).filter((n) => !n.read).length +
    (warningNotice?.hasActiveWarning &&
    !(notifications || []).some((n) =>
      (n.title || "").toLowerCase().includes("warning"),
    )
      ? 1
      : 0);

  // Modals state
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [warningModalVisible, setWarningModalVisible] = useState(false);
  const [notificationsModalVisible, setNotificationsModalVisible] =
    useState(false);
  const [grievanceModalVisible, setGrievanceModalVisible] = useState(false);
  const [marksheetModalVisible, setMarksheetModalVisible] = useState(false);
  const [drawerModalVisible, setDrawerModalVisible] = useState(false);
  const [campusMapModalVisible, setCampusMapModalVisible] = useState(false);
  const [digitalIdModalVisible, setDigitalIdModalVisible] = useState(false);
  const [pyqModalVisible, setPyqModalVisible] = useState(false);
  const [admitCardModalVisible, setAdmitCardModalVisible] = useState(false);
  const [attendanceHistoryModalVisible, setAttendanceHistoryModalVisible] =
    useState(false);
  const [holidaysModalVisible, setHolidaysModalVisible] = useState(false);
  const [sahayakModalVisible, setSahayakModalVisible] = useState(false);
  const [atktModalVisible, setAtktModalVisible] = useState(false);
  const [copyShowingModalVisible, setCopyShowingModalVisible] = useState(false);

  const [selectedFeeForPay, setSelectedFeeForPay] =
    useState<FeeInstallment | null>(null);
  const [selectedFeeForSlip, setSelectedFeeForSlip] =
    useState<FeeInstallment | null>(null);
  const [localFees, setLocalFees] = useState<FeeInstallment[] | null>(null);

  if (isLoading) {
    return (
      <View style={styles.splashContainer}>
        <ActivityIndicator size="large" color="#5c0d38" />
        <Text style={styles.splashText}>Govt. Holkar ERP Loading...</Text>
      </View>
    );
  }

  if (!isLoggedIn) {
    return <LoginScreen />;
  }

  // Unified StudentProfile model for modals expecting legacy props
  const studentProfileForModals: StudentProfile = {
    id: student?.enrollmentNo || student?.id || "",
    name: student?.name || "Student",
    rollNo: student?.rollNo || "",
    course: student?.programme || student?.course || "",
    semester: student?.semester || "",
    branch: student?.department || student?.branch || "",
    avatarUrl: student?.avatarUrl || "",
    email: student?.email || "",
    phone: student?.phone || "",
    dob: student?.dob || "",
    bloodGroup: student?.bloodGroup || "",
    parentName: student?.parentName || "",
    parentPhone: student?.parentPhone || "",
    parentEmail: student?.parentEmail || "",
    address: student?.address || "",
    academicYear: student?.batch || "",
  };

  // Map fee installments from real context
  const feeInstallments: FeeInstallment[] =
    localFees ||
    (fees?.installments || []).map((f) => ({
      id: f.id,
      demandId: f.demandId,
      installmentNumber: f.installmentNumber,
      title: f.title,
      dueDate: f.dueDate,
      amount: f.amount,
      status: f.status as any,
      receiptNo: f.receiptNo,
      paidOn: f.paidOn,
    }));

  const handleFeePaymentComplete = async (
    _feeId: string,
    _receiptNo: string,
  ) => {
    // Authoritative re-fetch: fee state is reloaded directly from backend treasury ledger
    await refreshData();
  };

  const handleGrievanceSubmit = () => {
    refreshData();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {dataError && (
        <View style={styles.dataBanner}>
          <Text style={styles.dataBannerText}>⚠️ {dataError}</Text>
          <TouchableOpacity onPress={refreshData} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Fixed Persistent App Header for All Tabs ── */}
      <View style={styles.topFixedHeader}>
        <TouchableOpacity
          onPress={() => setActiveTab("home")}
          style={styles.headerLogoTitleRow}
          activeOpacity={0.8}
        >
          <Image
            source={require("./assets/holkar_logo.png")}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerCollegeName} numberOfLines={1}>
              Govt. Holkar Science College
            </Text>
            <Text style={styles.headerCollegeSub} numberOfLines={1}>
              MODEL AUTONOMOUS • INDORE
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerRightActions}>
          <TouchableOpacity
            onPress={() => setQrModalVisible(true)}
            style={styles.iconCircleBtn}
            hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
            activeOpacity={0.7}
          >
            <QrCode size={17} color="#5c0d38" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setNotificationsModalVisible(true)}
            style={styles.iconCircleBtn}
            hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
            activeOpacity={0.7}
          >
            <Bell size={17} color="#1e1b24" />
            {unreadNotifs > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{unreadNotifs}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setDrawerModalVisible(true)}
            style={styles.menuBtn}
            hitSlop={{ top: 10, bottom: 10, left: 6, right: 10 }}
            activeOpacity={0.7}
          >
            <Menu size={18} color="#1e1b24" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {activeTab === "home" && (
          <HomeScreen
            onOpenQRScanner={() => setQrModalVisible(true)}
            onOpenWarningNotice={() => setWarningModalVisible(true)}
            onOpenNotifications={() => setNotificationsModalVisible(true)}
            onOpenGrievance={() => setGrievanceModalVisible(true)}
            onOpenMarksheet={() => setMarksheetModalVisible(true)}
            onOpenDrawer={() => setDrawerModalVisible(true)}
            onOpenDeptNavigator={() => setCampusMapModalVisible(true)}
            onOpenPYQModal={() => setPyqModalVisible(true)}
            onOpenDigitalID={() => setDigitalIdModalVisible(true)}
            onOpenAdmitCard={() => setAdmitCardModalVisible(true)}
            onOpenAttendanceHistory={() =>
              setAttendanceHistoryModalVisible(true)
            }
            onOpenHolidays={() => setHolidaysModalVisible(true)}
            onOpenSahayak={() => setSahayakModalVisible(true)}
            onOpenATKT={() => setAtktModalVisible(true)}
            onOpenCopyShowing={() => setCopyShowingModalVisible(true)}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === "academics" && (
          <AcademicsScreen
            onOpenQRScanner={() => setQrModalVisible(true)}
            onOpenMarksheet={() => setMarksheetModalVisible(true)}
            onOpenPYQModal={() => setPyqModalVisible(true)}
            onOpenAdmitCard={() => setAdmitCardModalVisible(true)}
            onOpenATKT={() => setAtktModalVisible(true)}
            onOpenCopyShowing={() => setCopyShowingModalVisible(true)}
          />
        )}

        {activeTab === "fees" && (
          <FeesScreen
            fees={feeInstallments}
            onOpenPayModal={(f) => setSelectedFeeForPay(f)}
            onViewReceipt={(f) => setSelectedFeeForSlip(f)}
          />
        )}

        {activeTab === "profile" && (
          <ProfileScreen
            onOpenWarningNotice={() => setWarningModalVisible(true)}
            onOpenMarksheet={() => setMarksheetModalVisible(true)}
            onOpenPaymentSlip={() => {
              const paid =
                feeInstallments.find((f) => f.status === "PAID") ||
                feeInstallments[0];
              if (paid) setSelectedFeeForSlip(paid);
            }}
            onOpenHolidays={() => setHolidaysModalVisible(true)}
            onOpenDigitalID={() => setDigitalIdModalVisible(true)}
            onLogout={logout}
          />
        )}
      </View>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          onPress={() => setActiveTab("home")}
          style={styles.navTab}
        >
          <Home
            size={22}
            color={activeTab === "home" ? "#5c0d38" : "#94a3b8"}
          />
          <Text
            style={[
              styles.navText,
              activeTab === "home" && styles.navTextActive,
            ]}
          >
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab("academics")}
          style={styles.navTab}
        >
          <BookOpen
            size={22}
            color={activeTab === "academics" ? "#5c0d38" : "#94a3b8"}
          />
          <Text
            style={[
              styles.navText,
              activeTab === "academics" && styles.navTextActive,
            ]}
          >
            Academics
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setQrModalVisible(true)}
          style={styles.centerQrBtn}
        >
          <QrCode size={26} color="#ffffff" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab("fees")}
          style={styles.navTab}
        >
          <CreditCard
            size={22}
            color={activeTab === "fees" ? "#5c0d38" : "#94a3b8"}
          />
          <Text
            style={[
              styles.navText,
              activeTab === "fees" && styles.navTextActive,
            ]}
          >
            Fees
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab("profile")}
          style={styles.navTab}
        >
          <User
            size={22}
            color={activeTab === "profile" ? "#5c0d38" : "#94a3b8"}
          />
          <Text
            style={[
              styles.navText,
              activeTab === "profile" && styles.navTextActive,
            ]}
          >
            Profile
          </Text>
        </TouchableOpacity>
      </View>

      {/* Modals */}
      <QRScanModal
        visible={qrModalVisible}
        onClose={() => setQrModalVisible(false)}
        onSuccess={() => {
          refreshData();
        }}
      />

      <WarningLetterModal
        visible={warningModalVisible}
        onClose={() => setWarningModalVisible(false)}
      />

      <NotificationsModal
        visible={notificationsModalVisible}
        onClose={() => setNotificationsModalVisible(false)}
        notifications={notifications || []}
        onOpenWarningNotice={() => setWarningModalVisible(true)}
        onMarkAllRead={markAllNotificationsAsRead}
        onMarkNoticeRead={markNotificationAsRead}
        onRefresh={refreshNotifications}
      />

      <GrievanceModal
        visible={grievanceModalVisible}
        onClose={() => setGrievanceModalVisible(false)}
        onSubmit={handleGrievanceSubmit}
      />

      <MarksheetModal
        visible={marksheetModalVisible}
        onClose={() => setMarksheetModalVisible(false)}
      />

      <QuickDrawerModal
        visible={drawerModalVisible}
        onClose={() => setDrawerModalVisible(false)}
        student={studentProfileForModals}
        onNavigateTab={(tab: "home" | "academics" | "fees" | "profile") => {
          setDrawerModalVisible(false);
          setActiveTab(tab);
        }}
        onOpenMarksheet={() => {
          setDrawerModalVisible(false);
          setMarksheetModalVisible(true);
        }}
        onOpenWarningNotice={() => {
          setDrawerModalVisible(false);
          setWarningModalVisible(true);
        }}
        onOpenGrievance={() => {
          setDrawerModalVisible(false);
          setGrievanceModalVisible(true);
        }}
        onOpenQRScanner={() => {
          setDrawerModalVisible(false);
          setQrModalVisible(true);
        }}
        onOpenDigitalID={() => {
          setDrawerModalVisible(false);
          setDigitalIdModalVisible(true);
        }}
        onOpenDeptNavigator={() => {
          setDrawerModalVisible(false);
          setCampusMapModalVisible(true);
        }}
        onOpenPYQModal={() => {
          setDrawerModalVisible(false);
          setPyqModalVisible(true);
        }}
        onOpenEventsCalendar={() => {
          setDrawerModalVisible(false);
          setHolidaysModalVisible(true);
        }}
      />

      <CampusMapModal
        visible={campusMapModalVisible}
        onClose={() => setCampusMapModalVisible(false)}
      />

      <DigitalIdModal
        visible={digitalIdModalVisible}
        onClose={() => setDigitalIdModalVisible(false)}
        student={studentProfileForModals}
      />

      <PYQAndSyllabusModal
        visible={pyqModalVisible}
        onClose={() => setPyqModalVisible(false)}
      />

      <AdmitCardModal
        visible={admitCardModalVisible}
        onClose={() => setAdmitCardModalVisible(false)}
      />

      <AttendanceHistoryModal
        visible={attendanceHistoryModalVisible}
        onClose={() => setAttendanceHistoryModalVisible(false)}
      />

      <AcademicHolidaysModal
        visible={holidaysModalVisible}
        onClose={() => setHolidaysModalVisible(false)}
      />

      <HolkarSahayakModal
        visible={sahayakModalVisible}
        onClose={() => setSahayakModalVisible(false)}
      />

      <ATKTModal
        visible={atktModalVisible}
        onClose={() => setAtktModalVisible(false)}
      />

      <CopyShowingModal
        visible={copyShowingModalVisible}
        onClose={() => setCopyShowingModalVisible(false)}
      />

      <FeePayModal
        visible={selectedFeeForPay !== null}
        onClose={() => setSelectedFeeForPay(null)}
        installment={selectedFeeForPay}
        onPaymentComplete={handleFeePaymentComplete}
      />

      <FeeReceiptSlipModal
        visible={selectedFeeForSlip !== null}
        onClose={() => setSelectedFeeForSlip(null)}
        installment={selectedFeeForSlip}
        studentName={student?.name}
        rollNo={student?.rollNo}
        enrollmentNo={student?.enrollmentNo}
      />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  splashContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  splashText: {
    marginTop: 14,
    fontSize: 14,
    fontWeight: "600",
    color: "#5c0d38",
  },
  dataBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fef2f2",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#fecaca",
  },
  dataBannerText: {
    fontSize: 12,
    color: "#dc2626",
    fontWeight: "500",
  },
  retryBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#dc2626",
    borderRadius: 6,
  },
  retryText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
  },
  topFixedHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
    zIndex: 10,
  },
  headerLogoTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  headerLogo: {
    width: 34,
    height: 34,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerCollegeName: {
    fontSize: 12.5,
    fontWeight: "900",
    color: "#5c0d38",
  },
  headerCollegeSub: {
    fontSize: 8.5,
    fontWeight: "700",
    color: "#64748b",
    letterSpacing: 0.3,
  },
  headerRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
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
    minWidth: 15,
    height: 15,
    paddingHorizontal: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  bellBadgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800",
  },
  content: {
    flex: 1,
  },
  bottomNav: {
    flexDirection: "row",
    height: 62,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "space-around",
    paddingBottom: 4,
  },
  navTab: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  navText: {
    fontSize: 10,
    color: "#94a3b8",
    marginTop: 3,
    fontWeight: "600",
  },
  navTextActive: {
    color: "#5c0d38",
    fontWeight: "800",
  },
  centerQrBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#5c0d38",
    alignItems: "center",
    justifyContent: "center",
    marginTop: -20,
    shadowColor: "#5c0d38",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
  },
});
