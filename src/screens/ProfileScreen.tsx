import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Droplets,
  BookOpen,
  Award,
  Receipt,
  FileText,
  Download,
  GraduationCap,
  Layers,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  LogOut,
  CalendarDays,
  ChevronRight,
  Edit3,
} from "lucide-react-native";
import { useApp } from "../context/AppContext";
import { EditProfileModal } from "../components/EditProfileModal";
import { SecuritySettingsCard } from "../components/SecuritySettingsCard";

interface Props {
  onOpenWarningNotice: () => void;
  onOpenMarksheet: () => void;
  onOpenPaymentSlip: () => void;
  onOpenHolidays?: () => void;
  onOpenDigitalID?: () => void;
  onLogout?: () => void;
}

export const ProfileScreen: React.FC<Props> = ({
  onOpenWarningNotice,
  onOpenMarksheet,
  onOpenPaymentSlip,
  onOpenHolidays,
  onOpenDigitalID,
  onLogout,
}) => {
  const { student, warningNotice, refreshData } = useApp();
  const [editModalVisible, setEditModalVisible] = useState(false);

  const handleDownloadVaultDoc = (docName: string) => {
    Alert.alert(
      "Document Downloaded 📥",
      `${docName} has been downloaded to your device with digital verification hash.`,
    );
  };

  const hasActiveWarning =
    warningNotice?.status === "WARNING_ACTIVE" ||
    (warningNotice?.consecutiveDays ?? 0) >= 3;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Student Identity & Vault</Text>
          <Text style={styles.headerSub}>
            Official Government Autonomous Record
          </Text>
        </View>
        <TouchableOpacity
          style={styles.headerEditBtn}
          onPress={() => setEditModalVisible(true)}
          activeOpacity={0.8}
        >
          <Edit3 size={14} color="#ffffff" style={{ marginRight: 5 }} />
          <Text style={styles.headerEditBtnText}>Edit</Text>
        </TouchableOpacity>
      </View>

      {/* Official College ID Card Frame */}
      <TouchableOpacity
        style={styles.idCard}
        onPress={onOpenDigitalID}
        activeOpacity={0.9}
      >
        <View style={styles.idHeader}>
          <Text style={styles.idCollege}>
            GOVT. HOLKAR SCIENCE COLLEGE, INDORE
          </Text>
          <Text style={styles.idType}>
            STUDENT IDENTITY CARD • CBCS AUTONOMOUS
          </Text>
        </View>

        <View style={styles.idBody}>
          {student?.avatarUrl ? (
            <Image
              source={{ uri: student.avatarUrl }}
              style={styles.idAvatar}
            />
          ) : (
            <View
              style={[
                styles.idAvatar,
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
          <View style={styles.idDetails}>
            <Text style={styles.idName}>{student?.name || "Student"}</Text>
            <Text style={styles.idCourse}>
              {student?.programme ||
                student?.course ||
                "Undergraduate Programme"}{" "}
              {student?.semester ? `Sem ${student.semester}` : ""}
            </Text>
            <Text style={styles.idMeta}>
              Roll No:{" "}
              <Text style={{ fontWeight: "800" }}>
                {student?.rollNo || "—"}
              </Text>
            </Text>
            <Text style={styles.idMeta}>
              Enrollment:{" "}
              <Text style={{ fontWeight: "800" }}>
                {student?.enrollmentNo || student?.id || "—"}
              </Text>
            </Text>
            <Text style={styles.idMeta}>
              Blood Group:{" "}
              <Text style={{ fontWeight: "800", color: "#dc2626" }}>
                {student?.bloodGroup || "—"}
              </Text>
            </Text>
          </View>
        </View>

        <View style={styles.barcodeWrap}>
          <Text style={styles.barcodeText}>
            ||| | ||||| || |||||| | |||| ||| ||||||| |||
          </Text>
          <Text style={styles.validityText}>
            VALID ACADEMIC YEAR{" "}
            {student?.batch || student?.currentYear || "2024-2027"}
          </Text>
        </View>
      </TouchableOpacity>

      {/* WARNING NOTICE BANNER IF ACTIVE */}
      {hasActiveWarning && (
        <TouchableOpacity
          onPress={onOpenWarningNotice}
          style={styles.warningAlertBanner}
          activeOpacity={0.85}
        >
          <AlertTriangle size={20} color="#dc2626" />
          <View style={{ flex: 1 }}>
            <Text style={styles.warningAlertTitle}>
              Official Absence Warning Notice
            </Text>
            <Text style={styles.warningAlertSub}>
              Issued by Principal & HOD: {warningNotice?.consecutiveDays || 5}{" "}
              consecutive days absent. Tap to view 48hr response letterhead.
            </Text>
          </View>
        </TouchableOpacity>
      )}

      {/* CBCS ACADEMIC & INSTITUTIONAL MASTER PROFILE */}
      <Text style={styles.sectionTitle}>
        Institutional Academic Master Record
      </Text>
      <View style={styles.subjectAllocCard}>
        {/* Programme & Department */}
        <View style={styles.allocRow}>
          <View style={[styles.allocBadge, { backgroundColor: "#fdf2f8" }]}>
            <Text style={[styles.allocBadgeText, { color: "#5c0d38" }]}>
              PROGRAMME
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.allocSubjectTitle}>
              {student?.programme || student?.course || "Not Provided"}
            </Text>
            <Text style={styles.allocSubjectSub}>
              {student?.department ||
                student?.branch ||
                "Govt. Holkar Science College"}
            </Text>
          </View>
        </View>

        <View style={styles.allocDivider} />

        {/* Academic Details Grid (Year, Semester, Section, Academic Status) */}
        <View style={styles.detailGrid}>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>ACADEMIC YEAR</Text>
            <Text style={styles.gridVal}>
              {student?.academicYear ||
                student?.batch ||
                student?.currentYear ||
                "Not Provided"}
            </Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>SEMESTER</Text>
            <Text style={styles.gridVal}>
              {student?.semester
                ? `Semester ${student.semester}`
                : "Not Provided"}
            </Text>
          </View>
        </View>

        <View style={styles.detailGrid}>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>SECTION</Text>
            <Text style={styles.gridVal}>
              {student?.section || "Not Assigned"}
            </Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>ACADEMIC STATUS</Text>
            <Text
              style={[styles.gridVal, { color: "#16a34a", fontWeight: "800" }]}
            >
              {student?.academicStatus || "Regular"}
            </Text>
          </View>
        </View>

        <View style={styles.allocDivider} />

        {/* Major Subject */}
        <View style={styles.allocRow}>
          <View style={[styles.allocBadge, { backgroundColor: "#eef2ff" }]}>
            <Text style={[styles.allocBadgeText, { color: "#4338ca" }]}>
              MAJOR
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.allocSubjectTitle}>
              {student?.majorSubject || "Not Assigned"}
            </Text>
            <Text style={styles.allocSubjectSub}>
              Core Theory + Lab Practical (6 Credits)
            </Text>
          </View>
        </View>

        <View style={styles.allocDivider} />

        {/* Minor Subject */}
        <View style={styles.allocRow}>
          <View style={[styles.allocBadge, { backgroundColor: "#f0fdf4" }]}>
            <Text style={[styles.allocBadgeText, { color: "#15803d" }]}>
              MINOR
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.allocSubjectTitle}>
              {student?.minorSubject || "Not Assigned"}
            </Text>
            <Text style={styles.allocSubjectSub}>
              Allied Discipline Matrix (4 Credits)
            </Text>
          </View>
        </View>

        <View style={styles.allocDivider} />

        {/* Open Elective / Vocational */}
        <View style={styles.allocRow}>
          <View style={[styles.allocBadge, { backgroundColor: "#fffbeb" }]}>
            <Text style={[styles.allocBadgeText, { color: "#b45309" }]}>
              GENERIC / OE
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.allocSubjectTitle}>
              {student?.openElective || "Not Assigned"}
            </Text>
            <Text style={styles.allocSubjectSub}>
              Interdisciplinary Elective & Practical (4 Credits)
            </Text>
          </View>
        </View>

        <View style={styles.allocDivider} />

        <View style={styles.allocRow}>
          <View style={[styles.allocBadge, { backgroundColor: "#fae8ff" }]}>
            <Text style={[styles.allocBadgeText, { color: "#86198f" }]}>
              VOCATIONAL
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.allocSubjectTitle}>
              {student?.vocationalSubject || "Not Assigned"}
            </Text>
            <Text style={styles.allocSubjectSub}>
              Skill & Practical Development (3 Credits)
            </Text>
          </View>
        </View>
      </View>

      {/* PERSONAL, BIOMETRIC & GUARDIAN RECORD */}
      <View style={styles.sectionHeaderWithAction}>
        <Text style={styles.sectionTitle}>Personal & Guardian Profile</Text>
        <TouchableOpacity
          onPress={() => setEditModalVisible(true)}
          style={styles.editActionLink}
          activeOpacity={0.8}
        >
          <Edit3 size={13} color="#5c0d38" />
          <Text style={styles.editActionLinkText}>Edit Personal Info</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.personalCard}>
        {/* Parentage */}
        <View style={styles.infoRow}>
          <User size={16} color="#64748b" />
          <Text style={styles.infoLabel}>Father Name:</Text>
          <Text style={styles.infoValue}>
            {student?.fatherName || student?.parentName || "Not Provided"}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <User size={16} color="#64748b" />
          <Text style={styles.infoLabel}>Mother Name:</Text>
          <Text style={styles.infoValue}>
            {student?.motherName || "Not Provided"}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Phone size={16} color="#64748b" />
          <Text style={styles.infoLabel}>Parents Contact:</Text>
          <Text style={styles.infoValue}>
            {student?.parentPhone || "Not Provided"}
          </Text>
        </View>

        <View style={styles.allocDivider} />

        {/* Demographics & Physical */}
        <View style={styles.infoRow}>
          <Calendar size={16} color="#64748b" />
          <Text style={styles.infoLabel}>Date of Birth:</Text>
          <Text style={styles.infoValue}>{student?.dob || "Not Provided"}</Text>
        </View>

        <View style={styles.infoRow}>
          <User size={16} color="#64748b" />
          <Text style={styles.infoLabel}>Gender:</Text>
          <Text style={styles.infoValue}>
            {student?.gender || "Not Provided"}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Droplets size={16} color="#dc2626" />
          <Text style={styles.infoLabel}>Blood Group:</Text>
          <Text
            style={[
              styles.infoValue,
              {
                color: student?.bloodGroup ? "#dc2626" : "#64748b",
                fontWeight: "800",
              },
            ]}
          >
            {student?.bloodGroup || "Not Provided"}
          </Text>
        </View>

        <View style={styles.detailGrid}>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>HEIGHT</Text>
            <Text style={styles.gridVal}>
              {student?.heightCm ? `${student.heightCm} cm` : "Not Provided"}
            </Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>WEIGHT</Text>
            <Text style={styles.gridVal}>
              {student?.weightKg ? `${student.weightKg} kg` : "Not Provided"}
            </Text>
          </View>
        </View>

        <View style={styles.allocDivider} />

        {/* Addresses */}
        <View style={styles.infoRow}>
          <MapPin size={16} color="#64748b" />
          <Text style={styles.infoLabel}>Current Address:</Text>
          <Text style={[styles.infoValue, { flex: 1 }]} numberOfLines={2}>
            {student?.currentAddress || student?.address || "Not Provided"}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <MapPin size={16} color="#64748b" />
          <Text style={styles.infoLabel}>Permanent Address:</Text>
          <Text style={[styles.infoValue, { flex: 1 }]} numberOfLines={2}>
            {student?.permanentAddress || "Not Provided"}
          </Text>
        </View>
      </View>

      {/* VERIFIED CONTACT & LOGIN IDENTIFIERS */}
      <Text style={styles.sectionTitle}>
        Contact & Institutional Credentials
      </Text>
      <View style={styles.personalCard}>
        <View style={styles.infoRow}>
          <Mail size={16} color="#0369a1" />
          <Text style={styles.infoLabel}>Gmail Account:</Text>
          <Text
            style={[styles.infoValue, { color: "#0369a1", fontWeight: "700" }]}
          >
            {student?.email || "Not Provided"}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Phone size={16} color="#64748b" />
          <Text style={styles.infoLabel}>Student Mobile:</Text>
          <Text style={styles.infoValue}>
            {student?.phone || "Not Provided"}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <ShieldCheck size={16} color="#15803d" />
          <Text style={styles.infoLabel}>Student ID:</Text>
          <Text style={[styles.infoValue, { fontWeight: "700" }]}>
            {student?.id || "Not Provided"}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <FileText size={16} color="#64748b" />
          <Text style={styles.infoLabel}>Enrollment No:</Text>
          <Text style={[styles.infoValue, { fontWeight: "700" }]}>
            {student?.enrollmentNo || "Not Provided"}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Layers size={16} color="#64748b" />
          <Text style={styles.infoLabel}>Roll Number:</Text>
          <Text style={[styles.infoValue, { fontWeight: "700" }]}>
            {student?.rollNo || "Not Provided"}
          </Text>
        </View>
      </View>

      {/* DOCUMENT & ACADEMIC VAULT */}
      <Text style={styles.sectionTitle}>Digital Record & Document Vault</Text>
      <View style={styles.vaultCard}>
        {/* CBCS Marksheet */}
        <TouchableOpacity onPress={onOpenMarksheet} style={styles.vaultRow}>
          <View style={[styles.vaultIconWrap, { backgroundColor: "#fdf2f8" }]}>
            <Award size={18} color="#5c0d38" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.vaultTitle}>CBCS Semester Grade Sheet</Text>
            <Text style={styles.vaultSub}>
              Autonomous Examination Portal Record
            </Text>
          </View>
          <Download size={16} color="#5c0d38" />
        </TouchableOpacity>

        <View style={styles.allocDivider} />

        {/* Fee Payment Slip */}
        <TouchableOpacity onPress={onOpenPaymentSlip} style={styles.vaultRow}>
          <View style={[styles.vaultIconWrap, { backgroundColor: "#f0fdf4" }]}>
            <Receipt size={18} color="#15803d" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.vaultTitle}>Fee Treasury Receipt</Text>
            <Text style={styles.vaultSub}>
              Official Installment & Fee Clearance Slip
            </Text>
          </View>
          <Download size={16} color="#15803d" />
        </TouchableOpacity>

        <View style={styles.allocDivider} />

        {/* College Events & Academic Calendar */}
        <TouchableOpacity
          onPress={onOpenHolidays}
          style={styles.vaultRow}
          activeOpacity={0.85}
        >
          <View style={[styles.vaultIconWrap, { backgroundColor: "#eef2ff" }]}>
            <CalendarDays size={18} color="#4338ca" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.vaultTitle}>
              College Events & Academic Calendar
            </Text>
            <Text style={styles.vaultSub}>
              Holidays, Exam Windows, Tech Fests & Recesses
            </Text>
          </View>
          <ChevronRight size={18} color="#4338ca" />
        </TouchableOpacity>

        <View style={styles.allocDivider} />

        {/* Bonafide Certificate */}
        <TouchableOpacity
          onPress={() => handleDownloadVaultDoc("Bonafide Student Certificate")}
          style={styles.vaultRow}
        >
          <View style={[styles.vaultIconWrap, { backgroundColor: "#fffbeb" }]}>
            <FileText size={18} color="#b45309" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.vaultTitle}>Bonafide Certificate</Text>
            <Text style={styles.vaultSub}>
              For Scholarship, Bus Pass & Bank Accounts
            </Text>
          </View>
          <Download size={16} color="#b45309" />
        </TouchableOpacity>
      </View>

      {/* SECURITY & QUICK AUTHENTICATION */}
      <Text style={styles.sectionTitle}>Security & Fast Unlock</Text>
      <SecuritySettingsCard />

      {/* LOGOUT BUTTON */}
      {onLogout && (
        <TouchableOpacity
          onPress={onLogout}
          style={styles.logoutBtn}
          activeOpacity={0.85}
        >
          <LogOut size={18} color="#dc2626" />
          <Text style={styles.logoutBtnText}>
            Log Out from Holkar Student ERP
          </Text>
        </TouchableOpacity>
      )}

      <EditProfileModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        student={student}
        onProfileUpdated={refreshData}
      />

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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  headerEditBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#5c0d38",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  headerEditBtnText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  sectionHeaderWithAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 20,
    marginBottom: 8,
  },
  editActionLink: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#fdf2f8",
    borderRadius: 6,
    gap: 4,
  },
  editActionLinkText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#5c0d38",
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
  idCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#5c0d38",
    overflow: "hidden",
    marginBottom: 16,
    shadowColor: "#5c0d38",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  idHeader: {
    backgroundColor: "#5c0d38",
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: "center",
  },
  idCollege: {
    color: "#fed7aa",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  idType: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 2,
  },
  idBody: {
    flexDirection: "row",
    padding: 14,
    gap: 14,
    alignItems: "center",
  },
  idAvatar: {
    width: 80,
    height: 96,
    borderRadius: 8,
    backgroundColor: "#e2e8f0",
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  idDetails: {
    flex: 1,
    gap: 3,
  },
  idName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1e1b24",
  },
  idCourse: {
    fontSize: 12,
    fontWeight: "600",
    color: "#5c0d38",
    marginBottom: 2,
  },
  idMeta: {
    fontSize: 11,
    color: "#475569",
  },
  barcodeWrap: {
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingVertical: 8,
    alignItems: "center",
    backgroundColor: "#fafafa",
  },
  barcodeText: {
    fontFamily: "monospace",
    letterSpacing: 2,
    color: "#1e1b24",
    fontSize: 12,
  },
  validityText: {
    fontSize: 9,
    color: "#64748b",
    fontWeight: "700",
    marginTop: 2,
  },
  warningAlertBanner: {
    backgroundColor: "#fef2f2",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fca5a5",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  warningAlertTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#dc2626",
  },
  warningAlertSub: {
    fontSize: 11,
    color: "#b91c1c",
    marginTop: 2,
    lineHeight: 15,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1e1b24",
    marginBottom: 8,
    marginTop: 6,
  },
  subjectAllocCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 16,
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
  allocSubjectTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1e1b24",
  },
  allocSubjectSub: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 1,
  },
  detailGrid: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
    gap: 8,
  },
  gridItem: {
    flex: 1,
    backgroundColor: "#f8fafc",
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  gridLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#64748b",
    letterSpacing: 0.5,
  },
  gridVal: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1e293b",
    marginTop: 2,
  },
  allocDivider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginVertical: 4,
  },
  personalCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 8,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
    width: 100,
  },
  infoValue: {
    fontSize: 12,
    color: "#1e1b24",
    fontWeight: "600",
  },
  vaultCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 16,
  },
  vaultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  vaultIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  vaultTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1e1b24",
  },
  vaultSub: {
    fontSize: 10,
    color: "#64748b",
    marginTop: 1,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 10,
  },
  logoutBtnText: {
    color: "#dc2626",
    fontSize: 13,
    fontWeight: "700",
  },
});
