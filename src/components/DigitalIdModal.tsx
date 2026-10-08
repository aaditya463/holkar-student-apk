import React, { useState } from "react";
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
  QrCode,
  BookOpen,
  CheckCircle2,
  RefreshCw,
} from "lucide-react-native";
import { StudentProfile } from "../types";

interface Props {
  visible: boolean;
  onClose: () => void;
  student: StudentProfile;
}

export const DigitalIdModal: React.FC<Props> = ({
  visible,
  onClose,
  student,
}) => {
  const [activeTab, setActiveTab] = useState<"id" | "library">("id");
  const [libraryScanned, setLibraryScanned] = useState(false);

  const handleSimulateScan = () => {
    setLibraryScanned(true);
    Alert.alert(
      "Library QR Verified ✓",
      "Student Identity Authenticated. Central Library Gate Turnstile #2 Unlocked. Valid for Yashwant Central Library & Reading Hall.",
    );
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
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Digital Student Identity</Text>
              <Text style={styles.headerSub}>
                Govt. Holkar Science College • Unique ID {student.id}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color="#1e1b24" />
            </TouchableOpacity>
          </View>

          {/* Tab Switcher */}
          <View style={styles.tabSwitcher}>
            <TouchableOpacity
              onPress={() => setActiveTab("id")}
              style={[styles.tabBtn, activeTab === "id" && styles.tabBtnActive]}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === "id" && styles.tabBtnTextActive,
                ]}
              >
                Digital ID Card
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab("library")}
              style={[
                styles.tabBtn,
                activeTab === "library" && styles.tabBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === "library" && styles.tabBtnTextActive,
                ]}
              >
                Library QR Reader
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
            {activeTab === "id" ? (
              <View>
                {/* OFFICIAL DEEP MAROON ID CARD */}
                <View style={styles.idCardFrame}>
                  {/* Top College Header */}
                  <View style={styles.idTopRow}>
                    <Image
                      source={require("../../assets/holkar_logo.png")}
                      style={styles.idLogo}
                      resizeMode="contain"
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.idCollegeName}>
                        GOVT. HOLKAR (MODEL AUTONOMOUS) SCIENCE COLLEGE
                      </Text>
                      <Text style={styles.idCollegeCity}>
                        INDORE (M.P.) • ESTD. 1891
                      </Text>
                    </View>
                    <View style={styles.studentIdBadge}>
                      <Text style={styles.studentIdBadgeText}>
                        STUDENT{"\n"}ID
                      </Text>
                    </View>
                  </View>

                  {/* Student Details Row */}
                  <View style={styles.studentRow}>
                    <Image
                      source={{ uri: student.avatarUrl }}
                      style={styles.studentPhoto}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.studentName}>{student.name}</Text>
                      <Text style={styles.studentCourse}>{student.course}</Text>
                      <Text style={styles.studentMeta}>
                        Roll:{" "}
                        <Text style={{ fontWeight: "800" }}>
                          {student.rollNo}
                        </Text>{" "}
                        • Sem: 4
                      </Text>
                      <View style={styles.idCodeBadge}>
                        <Text style={styles.idCodeText}>ID: {student.id}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Bottom Barcode & QR Box */}
                  <View style={styles.bottomBarcodeBox}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.barcodeLines}>
                        ||||||||||||||||||||||||||||||||
                      </Text>
                      <Text style={styles.barcodeSub}>*{student.id}*</Text>
                    </View>

                    <View style={styles.qrSide}>
                      <View style={styles.qrPlaceholder}>
                        <QrCode size={30} color="#5c0d38" />
                      </View>
                      <Text style={styles.qrDigitalText}>DIGITAL VALID</Text>
                    </View>
                  </View>
                </View>

                {/* Simulate Button */}
                <TouchableOpacity
                  onPress={handleSimulateScan}
                  style={styles.simulateBtn}
                >
                  <BookOpen size={16} color="#ffffff" />
                  <Text style={styles.simulateBtnText}>
                    📖 Simulate Library QR Scan
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* Library QR Scanner Tab */
              <View style={styles.libraryTab}>
                <View style={styles.libQrBox}>
                  <QrCode size={120} color="#5c0d38" />
                  <Text style={styles.libQrTitle}>
                    Yashwant Central Library Turnstile Access
                  </Text>
                  <Text style={styles.libQrSub}>
                    Scan this dynamic QR at Central Library Entrance Turnstile
                    or Book Lending Kiosk
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={handleSimulateScan}
                  style={styles.simulateBtn}
                >
                  <CheckCircle2 size={16} color="#ffffff" />
                  <Text style={styles.simulateBtnText}>
                    Simulate Entrance Gate Scan
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={{ height: 25 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "92%",
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
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
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  tabSwitcher: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  tabBtnActive: {
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabBtnText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#64748b",
  },
  tabBtnTextActive: {
    color: "#5c0d38",
    fontWeight: "800",
  },
  idCardFrame: {
    backgroundColor: "#5c0d38",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#5c0d38",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 16,
  },
  idTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  idLogo: {
    width: 38,
    height: 38,
  },
  idCollegeName: {
    color: "#ffffff",
    fontSize: 10.5,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  idCollegeCity: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 9,
    fontWeight: "700",
    marginTop: 1,
  },
  studentIdBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    alignItems: "center",
  },
  studentIdBadgeText: {
    color: "#ffffff",
    fontSize: 8.5,
    fontWeight: "900",
    textAlign: "center",
  },
  studentRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  studentPhoto: {
    width: 66,
    height: 76,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#ffffff",
    backgroundColor: "#e2e8f0",
  },
  studentName: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
  },
  studentCourse: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 11.5,
    fontWeight: "600",
    marginTop: 1,
  },
  studentMeta: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 10.5,
    marginTop: 2,
  },
  idCodeBadge: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginTop: 6,
  },
  idCodeText: {
    color: "#5c0d38",
    fontSize: 10,
    fontWeight: "900",
  },
  bottomBarcodeBox: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  barcodeLines: {
    fontFamily: "monospace",
    fontSize: 14,
    letterSpacing: 2,
    color: "#1e1b24",
  },
  barcodeSub: {
    fontSize: 8.5,
    color: "#64748b",
    fontWeight: "700",
    marginTop: 2,
  },
  qrSide: {
    alignItems: "center",
  },
  qrPlaceholder: {
    padding: 2,
  },
  qrDigitalText: {
    fontSize: 7.5,
    fontWeight: "900",
    color: "#15803d",
    marginTop: 2,
  },
  simulateBtn: {
    backgroundColor: "#0284c7",
    borderRadius: 14,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  simulateBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800",
  },
  libraryTab: {
    alignItems: "center",
    paddingVertical: 10,
  },
  libQrBox: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
  },
  libQrTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1e1b24",
    marginTop: 12,
    textAlign: "center",
  },
  libQrSub: {
    fontSize: 11,
    color: "#64748b",
    textAlign: "center",
    marginTop: 4,
    lineHeight: 15,
  },
});
