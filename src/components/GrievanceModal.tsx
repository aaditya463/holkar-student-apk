import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import { X, MessageSquare, Send, CheckCircle2 } from "lucide-react-native";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (title: string, category: string, desc: string) => void;
}

export const GrievanceModal: React.FC<Props> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("ACADEMIC_LAB");
  const [description, setDescription] = useState("");

  const categories = [
    { label: "Academic & Lab Issues", value: "ACADEMIC_LAB" },
    { label: "Examination / Results", value: "EXAM" },
    { label: "Attendance & Medical Leave", value: "ATTENDANCE" },
    { label: "Fees & Scholarships", value: "FEES" },
  ];

  const handleSubmit = () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert(
        "Incomplete Form",
        "Please enter both subject title and description.",
      );
      return;
    }
    onSubmit(title, category, description);
    Alert.alert(
      "Ticket Submitted to HOD ✓",
      "Your grievance ticket has been routed live to the Department Head of Department (HOD) desk.",
      [{ text: "OK", onPress: onClose }],
    );
    setTitle("");
    setDescription("");
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>HOD Student Helpdesk</Text>
              <Text style={styles.headerSub}>
                Direct Live Communication to Department Head
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#1e1b24" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Category Pills */}
            <Text style={styles.label}>Select Category:</Text>
            <View style={styles.catGrid}>
              {categories.map((c) => (
                <TouchableOpacity
                  key={c.value}
                  onPress={() => setCategory(c.value)}
                  style={[
                    styles.catPill,
                    category === c.value && styles.catPillSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.catPillText,
                      category === c.value && styles.catPillTextSelected,
                    ]}
                  >
                    {c.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Subject Field */}
            <Text style={styles.label}>Subject / Issue Title:</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Lab Oscilloscope faulty / Attendance query"
              placeholderTextColor="#94a3b8"
              style={styles.input}
            />

            {/* Description Field */}
            <Text style={styles.label}>Detailed Description:</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Explain your problem with exact dates, room number, or subjects..."
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={4}
              style={[styles.input, styles.textArea]}
            />

            {/* Submit Button */}
            <TouchableOpacity onPress={handleSubmit} style={styles.submitBtn}>
              <Send size={16} color="#ffffff" />
              <Text style={styles.submitBtnText}>Submit Complaint to HOD</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
    maxHeight: "85%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1e1b24",
  },
  headerSub: {
    fontSize: 11,
    color: "#64748b",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 11,
    fontWeight: "800",
    color: "#475569",
    textTransform: "uppercase",
    marginBottom: 6,
    marginTop: 8,
  },
  catGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 6,
  },
  catPill: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  catPillSelected: {
    backgroundColor: "#5c0d38",
  },
  catPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
  },
  catPillTextSelected: {
    color: "#ffffff",
  },
  input: {
    backgroundColor: "#f8fafc",
    borderColor: "#cbd5e1",
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 12.5,
    color: "#1e1b24",
    marginBottom: 10,
  },
  textArea: {
    height: 90,
    textAlignVertical: "top",
  },
  submitBtn: {
    backgroundColor: "#5c0d38",
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 8,
    marginBottom: 16,
  },
  submitBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800",
  },
});
