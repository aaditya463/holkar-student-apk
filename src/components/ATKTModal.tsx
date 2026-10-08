import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import {
  X,
  FileText,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Send,
} from "lucide-react-native";
import { useApp } from "../context/AppContext";
import { applyATKT } from "../api/student.api";

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const ATKTModal: React.FC<Props> = ({ visible, onClose }) => {
  const { student } = useApp();
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const backlogSubjects = [
    {
      code: "PHY-201",
      name: "Optics & Thermal Physics",
      fee: 500,
      semester: 2,
    },
    { code: "MATH-201", name: "Differential Equations", fee: 500, semester: 2 },
  ];

  const toggleSubject = (code: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  };

  const totalFee = selectedSubjects.length * 500;

  const handleSubmit = async () => {
    if (selectedSubjects.length === 0) {
      Alert.alert(
        "Selection Required",
        "Please select at least one backlog subject.",
      );
      return;
    }

    setSubmitting(true);
    try {
      await applyATKT({
        studentId: student?.id || "",
        enrollmentNo: student?.enrollmentNo || "",
        backlogSubjects: selectedSubjects,
        totalFee,
        transactionId: `TXN-ATKT-${Date.now()}`,
      });
      setSubmitting(false);
      setSubmitted(true);
    } catch (e: any) {
      setSubmitting(false);
      Alert.alert(
        "Submission Failed",
        e?.message ||
          "Could not submit ATKT form to the examination server. Please check your connection and try again.",
      );
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setSelectedSubjects([]);
    onClose();
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
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>
                ATKT / Backlog Examination Form
              </Text>
              <Text style={styles.headerSubtitle}>
                Autonomous CBCS Backlog Clearance Registration
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
            {submitted ? (
              <View style={styles.successBox}>
                <CheckCircle2 size={48} color="#15803d" />
                <Text style={styles.successTitle}>
                  ATKT Application Submitted! 🎓
                </Text>
                <Text style={styles.successMsg}>
                  Your exam application for {selectedSubjects.length} subjects
                  has been registered. Hall ticket will be generated 3 days
                  before exam session.
                </Text>
                <TouchableOpacity
                  onPress={handleReset}
                  style={styles.primaryBtn}
                >
                  <Text style={styles.primaryBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <View style={styles.infoBox}>
                  <Text style={styles.infoText}>
                    📌 Autonomous Examination Fee is strictly ₹500 per
                    theoretical paper. Verification is instant via ERP.
                  </Text>
                </View>

                <Text style={styles.sectionHeading}>
                  Identified Backlog Courses
                </Text>
                {backlogSubjects.map((sub) => {
                  const isChecked = selectedSubjects.includes(sub.code);
                  return (
                    <TouchableOpacity
                      key={sub.code}
                      onPress={() => toggleSubject(sub.code)}
                      style={[
                        styles.subjectCard,
                        isChecked && styles.subjectCardSelected,
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.subCode}>
                          {sub.code} &bull; Sem {sub.semester}
                        </Text>
                        <Text style={styles.subName}>{sub.name}</Text>
                        <Text style={styles.subFee}>Fee: ₹{sub.fee}</Text>
                      </View>
                      <View
                        style={[
                          styles.checkbox,
                          isChecked && styles.checkboxActive,
                        ]}
                      >
                        {isChecked && (
                          <CheckCircle2 size={16} color="#ffffff" />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}

                <View style={styles.totalBox}>
                  <Text style={styles.totalLabel}>
                    Total Examination Fee Payable:
                  </Text>
                  <Text style={styles.totalVal}>₹{totalFee}</Text>
                </View>

                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={submitting || selectedSubjects.length === 0}
                  style={[
                    styles.submitBtn,
                    selectedSubjects.length === 0 && { opacity: 0.5 },
                  ]}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <CreditCard size={16} color="#ffffff" />
                      <Text style={styles.submitBtnText}>
                        Confirm &amp; Register (₹{totalFee})
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
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
    maxHeight: "85%",
  },
  header: {
    backgroundColor: "#5c0d38",
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { fontSize: 16, fontWeight: "800", color: "#ffffff" },
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
  body: { padding: 16 },
  infoBox: {
    backgroundColor: "#fdf2f7",
    borderWidth: 1,
    borderColor: "#fbcfe8",
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  infoText: { fontSize: 11, color: "#5c0d38", lineHeight: 15 },
  sectionHeading: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "#475569",
    textTransform: "uppercase",
    marginBottom: 10,
  },
  subjectCard: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    backgroundColor: "#ffffff",
  },
  subjectCardSelected: { borderColor: "#5c0d38", backgroundColor: "#fdf2f7" },
  subCode: { fontSize: 10, fontWeight: "800", color: "#5c0d38" },
  subName: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#1e293b",
    marginTop: 1,
  },
  subFee: { fontSize: 11, fontWeight: "800", color: "#15803d", marginTop: 2 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: { backgroundColor: "#5c0d38", borderColor: "#5c0d38" },
  totalBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 10,
    marginVertical: 14,
  },
  totalLabel: { fontSize: 12, fontWeight: "700", color: "#475569" },
  totalVal: { fontSize: 16, fontWeight: "900", color: "#5c0d38" },
  submitBtn: {
    backgroundColor: "#5c0d38",
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  submitBtnText: { color: "#ffffff", fontSize: 13, fontWeight: "800" },
  successBox: { alignItems: "center", paddingVertical: 20, gap: 10 },
  successTitle: { fontSize: 17, fontWeight: "900", color: "#15803d" },
  successMsg: {
    fontSize: 12,
    color: "#475569",
    textAlign: "center",
    paddingHorizontal: 20,
    lineHeight: 16,
  },
  primaryBtn: {
    backgroundColor: "#5c0d38",
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  primaryBtnText: { color: "#ffffff", fontSize: 13, fontWeight: "800" },
});
