import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { X, FileSearch, CheckCircle2, CreditCard } from "lucide-react-native";
import { useApp } from "../context/AppContext";
import { applyCopyShowing } from "../api/student.api";

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const CopyShowingModal: React.FC<Props> = ({ visible, onClose }) => {
  const { student } = useApp();
  const [selectedSubject, setSelectedSubject] = useState("CS-301");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const subjects = [
    { code: "CS-301", name: "Database Management Systems" },
    { code: "CS-201", name: "Data Structures & Algorithms" },
    { code: "PHY-301", name: "Quantum Mechanics & Modern Physics" },
    { code: "OE-301", name: "Web Technologies & Cloud Computing" },
  ];

  const handleSubmit = async () => {
    if (!reason.trim()) {
      Alert.alert(
        "Reason Required",
        "Please provide a justification for answer copy showing.",
      );
      return;
    }

    setSubmitting(true);
    try {
      const match = subjects.find((s) => s.code === selectedSubject);
      await applyCopyShowing({
        studentId: student?.id || "",
        enrollmentNo: student?.enrollmentNo || "",
        subjectCode: selectedSubject,
        subjectName: match?.name || selectedSubject,
        semester: Number(student?.semester || 3),
        reason,
        feePaid: 350,
        transactionId: `TXN-REV-${Date.now()}`,
      });
      setSubmitting(false);
      setSubmitted(true);
    } catch (e: any) {
      setSubmitting(false);
      Alert.alert(
        "Submission Failed",
        e?.message ||
          "Could not submit copy showing request to the server. Please check your connection and try again.",
      );
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setReason("");
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
                Copy Showing &amp; Retotaling Form
              </Text>
              <Text style={styles.headerSubtitle}>
                Autonomous Evaluation Answer Sheet Inspection
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
                  Application Registered! 📑
                </Text>
                <Text style={styles.successMsg}>
                  Your copy inspection request for {selectedSubject} has been
                  scheduled. The Examination Cell will notify you via SMS/Email
                  regarding physical viewing window in Room 102.
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
                    🔍 In accordance with Autonomous Examination Ordinance,
                    students can inspect evaluated answer books under CCTV
                    supervision upon payment of ₹350 challenge fee.
                  </Text>
                </View>

                <Text style={styles.label}>
                  Select Course / Subject for Inspection:
                </Text>
                <View style={styles.subjectList}>
                  {subjects.map((s) => {
                    const isSelected = selectedSubject === s.code;
                    return (
                      <TouchableOpacity
                        key={s.code}
                        onPress={() => setSelectedSubject(s.code)}
                        style={[
                          styles.subjectBtn,
                          isSelected && styles.subjectBtnActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.subjectCode,
                            isSelected && { color: "#5c0d38" },
                          ]}
                        >
                          {s.code}
                        </Text>
                        <Text
                          style={[
                            styles.subjectName,
                            isSelected && {
                              color: "#5c0d38",
                              fontWeight: "800",
                            },
                          ]}
                        >
                          {s.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.label}>
                  Specific Reason / Grievance for Retotaling:
                </Text>
                <TextInput
                  value={reason}
                  onChangeText={setReason}
                  placeholder="e.g. Question 4(b) unchecked or totaling error in Part A..."
                  placeholderTextColor="#94a3b8"
                  multiline
                  numberOfLines={4}
                  style={styles.textArea}
                />

                <View style={styles.totalBox}>
                  <Text style={styles.totalLabel}>
                    Copy Showing Challan Fee:
                  </Text>
                  <Text style={styles.totalVal}>₹350</Text>
                </View>

                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={submitting}
                  style={styles.submitBtn}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <CreditCard size={16} color="#ffffff" />
                      <Text style={styles.submitBtnText}>
                        Pay ₹350 &amp; Submit Challenge
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
    backgroundColor: "#f0f9ff",
    borderWidth: 1,
    borderColor: "#bae6fd",
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  infoText: { fontSize: 11, color: "#0369a1", lineHeight: 15 },
  label: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "#475569",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  subjectList: { gap: 8, marginBottom: 14 },
  subjectBtn: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#f8fafc",
  },
  subjectBtnActive: { borderColor: "#5c0d38", backgroundColor: "#fdf2f7" },
  subjectCode: { fontSize: 10, fontWeight: "800", color: "#64748b" },
  subjectName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1e293b",
    marginTop: 1,
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    padding: 10,
    fontSize: 12,
    color: "#1e293b",
    textAlignVertical: "top",
    minHeight: 80,
    backgroundColor: "#ffffff",
    marginBottom: 14,
  },
  totalBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
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
