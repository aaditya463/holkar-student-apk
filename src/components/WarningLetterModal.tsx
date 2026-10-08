import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
} from "react-native";
import {
  X,
  AlertTriangle,
  Download,
  ShieldAlert,
  Calendar,
  User,
  Phone,
  Mail,
} from "lucide-react-native";
import { useApp } from "../context/AppContext";
import { generateAndShareWarningNoticePDF } from "../utils/pdfGenerator";

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const WarningLetterModal: React.FC<Props> = ({ visible, onClose }) => {
  const { student, warningNotice } = useApp();

  const hasActiveWarning = Boolean(warningNotice?.hasActiveWarning);
  const letter = hasActiveWarning ? warningNotice! : null;

  const handleDownloadNoticePDF = async () => {
    if (!hasActiveWarning || !letter) return;
    await generateAndShareWarningNoticePDF(letter, student);
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
          <View
            style={[
              styles.header,
              { backgroundColor: hasActiveWarning ? "#991b1b" : "#15803d" },
            ]}
          >
            <View style={{ flex: 1 }}>
              <View style={styles.headerBadge}>
                <AlertTriangle size={11} color="#ffffff" />
                <Text style={styles.headerBadgeText}>
                  {hasActiveWarning
                    ? "OFFICIAL DISCIPLINARY NOTICE"
                    : "ACADEMIC STANDING STATUS"}
                </Text>
              </View>
              <Text style={styles.headerTitle}>
                Attendance Standing &amp; Notices
              </Text>
              <Text style={styles.headerSubtitle}>
                {hasActiveWarning && letter
                  ? `Ref: ${letter.letterNumber}`
                  : "Status: No Disciplinary Actions Active"}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.body}
            contentContainerStyle={{ paddingBottom: 24 }}
          >
            {hasActiveWarning && letter ? (
              <>
                {/* Warning Alert Bar */}
                <View style={styles.alertBanner}>
                  <ShieldAlert size={24} color="#991b1b" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.alertBannerTitle}>
                      Mandatory 75% Attendance Shortfall (
                      {letter.attendancePercentage}%)
                    </Text>
                    <Text style={styles.alertBannerText}>
                      {letter.consecutiveDays || 0} consecutive days unexcused
                      absence detected. Hall ticket eligibility is at risk.
                    </Text>
                  </View>
                </View>

                {/* Letterhead Container */}
                <View style={styles.letterhead}>
                  <Text style={styles.collegeName}>
                    GOVT. MODEL AUTONOMOUS HOLKAR SCIENCE COLLEGE
                  </Text>
                  <Text style={styles.collegeAddress}>
                    A.B. Road, Bhawarkua, Indore (M.P.) - 452001
                  </Text>
                  <Text style={styles.collegeAffiliation}>
                    Affiliated to Devi Ahilya Vishwavidyalaya &bull; NAAC
                    Accredited 'A++'
                  </Text>

                  <View style={styles.letterDivider} />

                  <View style={styles.letterMetaRow}>
                    <Text style={styles.metaItem}>
                      Date:{" "}
                      <Text style={{ fontWeight: "800" }}>
                        {letter.issueDate}
                      </Text>
                    </Text>
                    <Text style={styles.metaItem}>
                      Notice:{" "}
                      <Text style={{ fontWeight: "800" }}>
                        Stage #{letter.warningNoticeCount || 1}
                      </Text>
                    </Text>
                  </View>

                  <Text style={styles.letterRecipient}>
                    To:{" "}
                    <Text style={{ fontWeight: "800" }}>
                      {student?.name || "Student"}
                    </Text>
                  </Text>
                  <Text style={styles.letterRecipientSub}>
                    Roll No: {student?.rollNo || "—"} | Enrollment:{" "}
                    {student?.enrollmentNo || "—"}
                  </Text>
                  <Text style={styles.letterRecipientSub}>
                    Course: {letter.courseAndSemester}
                  </Text>

                  <Text style={styles.letterSubject}>
                    SUBJECT: Formal Warning Regarding Low Attendance Shortfall
                    &amp; Continuous Absence
                  </Text>

                  <Text style={styles.letterParagraph}>
                    This official notice is issued under the authority of the
                    Proctorial Board and Autonomous Academic Council. Your
                    current attendance stands at{" "}
                    <Text style={{ fontWeight: "800", color: "#991b1b" }}>
                      {letter.attendancePercentage}%
                    </Text>
                    , which is strictly below the mandatory 75% NEP attendance
                    ordinance.
                  </Text>

                  <Text style={styles.letterParagraph}>
                    You are directed to report to{" "}
                    <Text style={{ fontWeight: "800" }}>{letter.hodName}</Text>{" "}
                    (Head of Department) along with an explanation letter signed
                    by your parent/guardian within 48 hours to prevent admit
                    card withholding.
                  </Text>

                  <View style={styles.signaturesRow}>
                    <View style={styles.sigBox}>
                      <Text style={styles.sigRole}>Head of Department</Text>
                      <Text style={styles.sigName}>{letter.hodName}</Text>
                    </View>
                    <View style={styles.sigBox}>
                      <Text style={styles.sigRole}>Principal</Text>
                      <Text style={styles.sigName}>{letter.principalName}</Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleDownloadNoticePDF}
                  style={styles.shareBtn}
                >
                  <Download size={15} color="#ffffff" />
                  <Text style={styles.shareBtnText}>
                    Download Official Warning Notice (PDF)
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <View
                style={{
                  paddingVertical: 48,
                  paddingHorizontal: 24,
                  alignItems: "center",
                  backgroundColor: "#f8fafc",
                  borderRadius: 16,
                  marginVertical: 16,
                  borderWidth: 1,
                  borderColor: "#e2e8f0",
                }}
              >
                <ShieldAlert size={44} color="#15803d" />
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "700",
                    color: "#1e293b",
                    marginTop: 14,
                  }}
                >
                  No Disciplinary Notices Active
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: "#64748b",
                    textAlign: "center",
                    marginTop: 8,
                    lineHeight: 18,
                    maxWidth: 320,
                  }}
                >
                  No attendance shortfall or proctorial disciplinary warning
                  notices have been issued for your student account. Keep up
                  your regular classroom attendance.
                </Text>
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
    maxHeight: "92%",
    overflow: "hidden",
  },
  header: {
    backgroundColor: "#991b1b",
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
  body: {
    padding: 16,
  },
  alertBanner: {
    backgroundColor: "#fee2e2",
    borderWidth: 1,
    borderColor: "#fca5a5",
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  alertBannerTitle: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#991b1b",
  },
  alertBannerText: {
    fontSize: 11,
    color: "#7f1d1d",
    marginTop: 2,
    lineHeight: 15,
  },
  letterhead: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  collegeName: {
    fontSize: 12,
    fontWeight: "900",
    color: "#5c0d38",
    textAlign: "center",
  },
  collegeAddress: {
    fontSize: 10,
    color: "#475569",
    textAlign: "center",
    marginTop: 2,
  },
  collegeAffiliation: {
    fontSize: 9,
    fontWeight: "700",
    color: "#15803d",
    textAlign: "center",
    marginTop: 2,
  },
  letterDivider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: 12,
  },
  letterMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  metaItem: {
    fontSize: 11,
    color: "#475569",
  },
  letterRecipient: {
    fontSize: 12.5,
    color: "#1e293b",
    marginTop: 4,
  },
  letterRecipientSub: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
  },
  letterSubject: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "#991b1b",
    marginVertical: 12,
    lineHeight: 16,
  },
  letterParagraph: {
    fontSize: 11.5,
    color: "#334155",
    lineHeight: 17,
    marginBottom: 10,
  },
  signaturesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: "#f1f5f9",
  },
  sigBox: {
    alignItems: "center",
  },
  sigRole: {
    fontSize: 9.5,
    color: "#64748b",
    fontWeight: "600",
  },
  sigName: {
    fontSize: 11,
    fontWeight: "800",
    color: "#1e293b",
    marginTop: 2,
  },
  shareBtn: {
    backgroundColor: "#5c0d38",
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  shareBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800",
  },
});
