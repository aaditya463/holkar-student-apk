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
  FileCheck2,
  Download,
  ShieldCheck,
  Calendar,
  Clock,
  MapPin,
  QrCode,
  AlertTriangle,
} from "lucide-react-native";
import { useApp } from "../context/AppContext";
import { generateAndShareAdmitCardPDF } from "../utils/pdfGenerator";

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const AdmitCardModal: React.FC<Props> = ({ visible, onClose }) => {
  const { student, admitCard, attendance } = useApp();

  const schedule = Array.isArray(admitCard?.schedule) ? admitCard.schedule : [];
  const hasSchedule = schedule.length > 0;
  const currentAtt =
    attendance && attendance.conducted > 0 ? attendance.overall : 0;
  const isEligible =
    admitCard?.status === "ELIGIBLE" ||
    (currentAtt >= 75 && admitCard?.isWithheld !== true);

  const handleDownloadAdmitCardPDF = async () => {
    if (!admitCard || !hasSchedule) {
      return;
    }
    await generateAndShareAdmitCardPDF(student, schedule, isEligible);
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
                <FileCheck2 size={11} color="#ffffff" />
                <Text style={styles.headerBadgeText}>
                  AUTONOMOUS EXAMINATION CELL
                </Text>
              </View>
              <Text style={styles.headerTitle}>
                Examination Hall Ticket (Admit Card)
              </Text>
              <Text style={styles.headerSubtitle}>
                {admitCard?.examSession ||
                  admitCard?.session ||
                  "Autonomous End-Semester Examination"}
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
            {admitCard && hasSchedule ? (
              <>
                {/* Eligibility Banner */}
                <View
                  style={[
                    styles.statusBanner,
                    {
                      backgroundColor: isEligible ? "#dcfce7" : "#fef3c7",
                      borderColor: isEligible ? "#86efac" : "#fde047",
                    },
                  ]}
                >
                  {isEligible ? (
                    <ShieldCheck size={20} color="#15803d" />
                  ) : (
                    <AlertTriangle size={20} color="#b45309" />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.statusTitle,
                        { color: isEligible ? "#15803d" : "#92400e" },
                      ]}
                    >
                      {isEligible
                        ? "Officially Issued Hall Ticket"
                        : "Examination Eligibility Warning"}
                    </Text>
                    <Text
                      style={[
                        styles.statusDesc,
                        { color: isEligible ? "#166534" : "#b45309" },
                      ]}
                    >
                      {isEligible
                        ? `Autonomous Examination Hall Ticket issued. Verified attendance: ${currentAtt.toFixed(1)}%.`
                        : `Attendance: ${currentAtt.toFixed(1)}%. Department clearance slip required before hall entry.`}
                    </Text>
                  </View>
                </View>

                {/* Admit Card Paper */}
                <View style={styles.admitCardPaper}>
                  <View style={styles.instHeader}>
                    <Text style={styles.instName}>
                      GOVT. MODEL AUTONOMOUS HOLKAR SCIENCE COLLEGE
                    </Text>
                    <Text style={styles.instCity}>INDORE (M.P.) - 452001</Text>
                    <Text style={styles.instSub}>
                      Controller of Examinations &bull; Hall Ticket 2026-27
                    </Text>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.metaGrid}>
                    <View style={styles.metaRow}>
                      <Text style={styles.metaKey}>Roll Number:</Text>
                      <Text style={styles.metaVal}>
                        {student?.rollNo || "—"}
                      </Text>
                    </View>
                    <View style={styles.metaRow}>
                      <Text style={styles.metaKey}>Enrollment No:</Text>
                      <Text style={styles.metaVal}>
                        {student?.enrollmentNo || "—"}
                      </Text>
                    </View>
                    <View style={styles.metaRow}>
                      <Text style={styles.metaKey}>Candidate Name:</Text>
                      <Text style={styles.metaVal}>{student?.name || "—"}</Text>
                    </View>
                    <View style={styles.metaRow}>
                      <Text style={styles.metaKey}>Father's Name:</Text>
                      <Text style={styles.metaVal}>
                        {student?.parentName || "—"}
                      </Text>
                    </View>
                    <View style={styles.metaRow}>
                      <Text style={styles.metaKey}>Programme:</Text>
                      <Text style={styles.metaVal}>
                        {student?.course || "—"}
                      </Text>
                    </View>
                    <View style={styles.metaRow}>
                      <Text style={styles.metaKey}>Semester:</Text>
                      <Text style={styles.metaVal}>
                        {student?.semester
                          ? `Semester ${student.semester}`
                          : "—"}
                      </Text>
                    </View>
                    <View style={styles.metaRow}>
                      <Text style={styles.metaKey}>Exam Center:</Text>
                      <Text style={styles.metaVal}>
                        Holkar Science College Main Campus (01)
                      </Text>
                    </View>
                  </View>

                  {/* Examination Schedule */}
                  <Text style={styles.scheduleTitle}>
                    EXAMINATION TIME-TABLE &amp; SEATING
                  </Text>

                  <View style={styles.scheduleTable}>
                    <View style={styles.schedHeaderRow}>
                      <Text style={[styles.schedTh, { flex: 1.2 }]}>
                        Date / Time
                      </Text>
                      <Text style={[styles.schedTh, { flex: 2 }]}>
                        Subject Code &amp; Title
                      </Text>
                      <Text
                        style={[
                          styles.schedTh,
                          { flex: 1, textAlign: "right" },
                        ]}
                      >
                        Room
                      </Text>
                    </View>

                    {schedule.map((slot, i) => (
                      <View
                        key={i}
                        style={[
                          styles.schedRow,
                          i % 2 === 1 && { backgroundColor: "#f8fafc" },
                        ]}
                      >
                        <View style={{ flex: 1.2 }}>
                          <Text style={styles.slotDate}>{slot.date}</Text>
                          <Text style={styles.slotTime}>{slot.time}</Text>
                        </View>
                        <View style={{ flex: 2 }}>
                          <Text style={styles.slotCode}>
                            {slot.subjectCode}
                          </Text>
                          <Text style={styles.slotName}>
                            {slot.subjectName}
                          </Text>
                        </View>
                        <View style={{ flex: 1, alignItems: "flex-end" }}>
                          <Text style={styles.slotRoom}>{slot.room}</Text>
                        </View>
                      </View>
                    ))}
                  </View>

                  {/* Instructions */}
                  <View style={styles.instructionsBox}>
                    <Text style={styles.instTitle}>
                      Important Candidate Instructions:
                    </Text>
                    <Text style={styles.instBullet}>
                      1. Candidate must report to the examination hall 20
                      minutes before time.
                    </Text>
                    <Text style={styles.instBullet}>
                      2. Carry official Physical Digital ID and this Admit Card.
                    </Text>
                    <Text style={styles.instBullet}>
                      3. Electronic gadgets and smartwatches strictly
                      prohibited.
                    </Text>
                  </View>

                  {/* Seal and QR */}
                  <View style={styles.sealRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.signatureText}>
                        Controller of Examinations
                      </Text>
                      <Text style={styles.officerName}>
                        Autonomous Examination Cell
                      </Text>
                      <Text style={styles.signatureNote}>
                        Digitally Authenticated CBCS Portal
                      </Text>
                    </View>
                    <View style={styles.qrPlaceholder}>
                      <QrCode size={46} color="#1e1b24" />
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleDownloadAdmitCardPDF}
                  style={styles.shareBtn}
                >
                  <Download size={16} color="#ffffff" />
                  <Text style={styles.shareBtnText}>
                    Download Official Admit Card (PDF)
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <View
                style={{
                  paddingVertical: 40,
                  paddingHorizontal: 20,
                  alignItems: "center",
                  backgroundColor: "#f8fafc",
                  borderRadius: 16,
                  marginVertical: 12,
                  borderWidth: 1,
                  borderColor: "#e2e8f0",
                }}
              >
                <FileCheck2 size={44} color="#94a3b8" />
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "700",
                    color: "#1e293b",
                    marginTop: 14,
                  }}
                >
                  Admit Card Not Issued Yet
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: "#64748b",
                    textAlign: "center",
                    marginTop: 8,
                    lineHeight: 18,
                    maxWidth: 300,
                  }}
                >
                  {admitCard?.message ||
                    "Autonomous examination hall tickets and seating rosters will appear here once officially published and verified by the Autonomous Examination Cell."}
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
  body: {
    padding: 16,
  },
  statusBanner: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  statusTitle: {
    fontSize: 12.5,
    fontWeight: "800",
  },
  statusDesc: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  admitCardPaper: {
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "#cbd5e1",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  instHeader: {
    alignItems: "center",
  },
  instName: {
    fontSize: 12,
    fontWeight: "900",
    color: "#5c0d38",
    textAlign: "center",
  },
  instCity: {
    fontSize: 10,
    color: "#475569",
    textAlign: "center",
    marginTop: 2,
  },
  instSub: {
    fontSize: 10,
    fontWeight: "700",
    color: "#15803d",
    textAlign: "center",
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: 12,
  },
  metaGrid: {
    gap: 6,
    backgroundColor: "#f8fafc",
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metaKey: {
    fontSize: 10.5,
    color: "#64748b",
    fontWeight: "600",
  },
  metaVal: {
    fontSize: 11,
    fontWeight: "800",
    color: "#1e293b",
  },
  scheduleTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#334155",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  scheduleTable: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 14,
  },
  schedHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  schedTh: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "#475569",
  },
  schedRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderColor: "#f1f5f9",
  },
  slotDate: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#1e293b",
  },
  slotTime: {
    fontSize: 9,
    color: "#64748b",
  },
  slotCode: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "#5c0d38",
  },
  slotName: {
    fontSize: 10.5,
    color: "#334155",
    lineHeight: 14,
  },
  slotRoom: {
    fontSize: 10,
    fontWeight: "700",
    color: "#0f172a",
  },
  instructionsBox: {
    backgroundColor: "#fffbeb",
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: "#fef08a",
    marginBottom: 14,
    gap: 3,
  },
  instTitle: {
    fontSize: 10,
    fontWeight: "800",
    color: "#92400e",
  },
  instBullet: {
    fontSize: 9.5,
    color: "#b45309",
    lineHeight: 14,
  },
  sealRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
  },
  signatureText: {
    fontSize: 9.5,
    color: "#64748b",
    fontWeight: "600",
  },
  officerName: {
    fontSize: 11,
    fontWeight: "800",
    color: "#1e293b",
    marginTop: 2,
  },
  signatureNote: {
    fontSize: 8.5,
    color: "#94a3b8",
    marginTop: 1,
  },
  qrPlaceholder: {
    padding: 4,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#cbd5e1",
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
