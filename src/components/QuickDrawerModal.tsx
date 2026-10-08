import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import {
  X,
  User,
  Calendar,
  Award,
  CreditCard,
  FileText,
  MessageSquare,
  ShieldAlert,
  Phone,
  LogOut,
  MapPin,
  ExternalLink,
  ChevronRight,
  GraduationCap,
  QrCode,
  Users,
  Briefcase,
  Sparkles,
  HeartHandshake,
  HelpCircle,
  FolderLock,
  BookOpen,
} from "lucide-react-native";
import { StudentProfile } from "../types";

interface Props {
  visible: boolean;
  onClose: () => void;
  student: StudentProfile;
  onNavigateTab: (tab: "home" | "academics" | "fees" | "profile") => void;
  onOpenMarksheet: () => void;
  onOpenWarningNotice: () => void;
  onOpenGrievance: () => void;
  onOpenQRScanner: () => void;
  onOpenDigitalID: () => void;
  onOpenDeptNavigator: () => void;
  onOpenPYQModal: () => void;
  onOpenEventsCalendar?: () => void;
}

export const QuickDrawerModal: React.FC<Props> = ({
  visible,
  onClose,
  student,
  onNavigateTab,
  onOpenMarksheet,
  onOpenWarningNotice,
  onOpenGrievance,
  onOpenQRScanner,
  onOpenDigitalID,
  onOpenDeptNavigator,
  onOpenPYQModal,
  onOpenEventsCalendar,
}) => {
  const handleFeatureNotice = (title: string) => {
    onClose();
    Alert.alert(
      title,
      `Opening ${title} portal module for Govt. Holkar Science College.`,
    );
  };

  const handleLogout = () => {
    Alert.alert("Holkar Student Portal", "Signed out from student session.");
    onClose();
  };

  const renderDarkItem = (
    icon: React.ReactNode,
    title: string,
    action: () => void,
  ) => (
    <TouchableOpacity
      key={title}
      onPress={() => {
        onClose();
        action();
      }}
      style={styles.darkMenuItem}
    >
      <View style={styles.darkIconWrap}>{icon}</View>
      <Text style={styles.darkItemTitle}>{title}</Text>
      <ChevronRight size={16} color="#64748b" />
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.darkContainer}>
          {/* Top Profile Header (Matching Screenshot 5) */}
          <View style={styles.topProfileHeader}>
            <Image
              source={{ uri: student.avatarUrl }}
              style={styles.avatarImg}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.studentNameText}>{student.name}</Text>
              <Text style={styles.studentSubText}>
                {student.id} • Part II (2nd Year)
              </Text>
            </View>
            <View style={styles.signedInPill}>
              <Text style={styles.signedInPillText}>Signed in ›</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={16} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
            {/* SECTION 1: STUDENT & ACADEMICS */}
            <Text style={styles.darkSectionHeader}>STUDENT & ACADEMICS</Text>
            <View style={styles.darkGroup}>
              {renderDarkItem(
                <GraduationCap size={18} color="#f43f5e" />,
                "Fresh Admission & Registration",
                () => handleFeatureNotice("Fresh Admission & Registration"),
              )}
              {renderDarkItem(
                <Award size={18} color="#10b981" />,
                "Exam Results & Marksheets",
                onOpenMarksheet,
              )}
              {renderDarkItem(
                <QrCode size={18} color="#eab308" />,
                "Scan Lecture Attendance QR",
                onOpenQRScanner,
              )}
              {renderDarkItem(
                <MapPin size={18} color="#06b6d4" />,
                "Campus Map & Dept Locator",
                onOpenDeptNavigator,
              )}
              {renderDarkItem(
                <BookOpen size={18} color="#a855f7" />,
                "Previous Year Papers & Syllabus",
                onOpenPYQModal,
              )}
            </View>

            {/* SECTION 2: FEES & SERVICES */}
            <Text style={styles.darkSectionHeader}>FEES & SERVICES</Text>
            <View style={styles.darkGroup}>
              {renderDarkItem(
                <CreditCard size={18} color="#8b5cf6" />,
                "Online Fees & Receipts",
                () => onNavigateTab("fees"),
              )}
              {renderDarkItem(
                <QrCode size={18} color="#38bdf8" />,
                "Digital ID & Library QR",
                onOpenDigitalID,
              )}
              {renderDarkItem(
                <Users size={18} color="#34d399" />,
                "Faculty Directory & Doubts",
                () => handleFeatureNotice("Faculty Directory & Doubts"),
              )}
              {renderDarkItem(
                <HelpCircle size={18} color="#f59e0b" />,
                "Help Tickets & Grievance",
                onOpenGrievance,
              )}
            </View>

            {/* SECTION 3: CAREER & EXTRAS */}
            <Text style={styles.darkSectionHeader}>CAREER & EXTRAS</Text>
            <View style={styles.darkGroup}>
              {renderDarkItem(
                <Award size={18} color="#f97316" />,
                "Digital Degree & Transcripts",
                () => handleFeatureNotice("Digital Degree & Transcripts"),
              )}
              {renderDarkItem(
                <Calendar size={18} color="#ec4899" />,
                "Events & Tech Fests (INNOVA)",
                () => {
                  onClose();
                  if (onOpenEventsCalendar) {
                    onOpenEventsCalendar();
                  }
                },
              )}
              {renderDarkItem(
                <Briefcase size={18} color="#0284c7" />,
                "TPO Placement Cell",
                () => handleFeatureNotice("TPO Placement Cell"),
              )}
              {renderDarkItem(
                <HeartHandshake size={18} color="#f43f5e" />,
                "Anonymous Feedback",
                () => handleFeatureNotice("Anonymous Feedback Desk"),
              )}
              {renderDarkItem(
                <Users size={18} color="#818cf8" />,
                "Parent & Guardian Portal",
                () => handleFeatureNotice("Parent & Guardian Portal"),
              )}
            </View>

            {/* LOGOUT BUTTON (MATCHING SCREENSHOT 5) */}
            <TouchableOpacity
              onPress={handleLogout}
              style={styles.darkLogoutBtn}
            >
              <LogOut size={16} color="#ef4444" />
              <Text style={styles.darkLogoutBtnText}>Sign Out / Logout</Text>
              <ChevronRight size={16} color="#ef4444" />
            </TouchableOpacity>

            <View style={{ height: 30 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  darkContainer: {
    backgroundColor: "#18181b",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: "92%",
    padding: 16,
  },
  topProfileHeader: {
    backgroundColor: "#27272a",
    borderRadius: 18,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#3f3f46",
  },
  avatarImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: "#8b5cf6",
  },
  studentNameText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },
  studentSubText: {
    color: "#a1a1aa",
    fontSize: 10.5,
    marginTop: 1,
  },
  signedInPill: {
    backgroundColor: "#5c0d38",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  signedInPillText: {
    color: "#ffffff",
    fontSize: 9.5,
    fontWeight: "800",
  },
  closeBtn: {
    padding: 4,
    marginLeft: 4,
  },
  darkSectionHeader: {
    color: "#71717a",
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 6,
  },
  darkGroup: {
    backgroundColor: "#27272a",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#3f3f46",
  },
  darkMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
    gap: 12,
    borderBottomWidth: 0.5,
    borderColor: "#3f3f46",
  },
  darkIconWrap: {
    width: 24,
    alignItems: "center",
  },
  darkItemTitle: {
    color: "#e4e4e7",
    fontSize: 12.5,
    fontWeight: "700",
    flex: 1,
  },
  darkLogoutBtn: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderColor: "#dc2626",
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  darkLogoutBtnText: {
    color: "#ef4444",
    fontSize: 13,
    fontWeight: "800",
    flex: 1,
    marginLeft: 10,
  },
});
