import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Share,
  Alert,
} from "react-native";
import {
  X,
  Download,
  ShieldCheck,
  ChevronRight,
  ArrowLeft,
  Award,
  Calendar,
  CheckCircle2,
  FileText,
} from "lucide-react-native";
import { useApp } from "../context/AppContext";
import { ApiSemesterResult, ApiSubjectGrade } from "../api/student.api";
import { generateAndShareMarksheetPDF } from "../utils/pdfGenerator";

interface Props {
  visible: boolean;
  onClose: () => void;
  onApplyATKT?: (result: ApiSemesterResult) => void;
  onApplyRevaluation?: (
    result: ApiSemesterResult,
    subject: ApiSubjectGrade,
  ) => void;
}

export const MarksheetModal: React.FC<Props> = ({
  visible,
  onClose,
  onApplyATKT,
  onApplyRevaluation,
}) => {
  const { student, results, dataLoading } = useApp();
  const [selectedSem, setSelectedSem] = useState<ApiSemesterResult | null>(
    null,
  );

  const activeResults = results || [];

  const handleDownloadMarksheetPDF = async (result: ApiSemesterResult) => {
    if (!result || !result.subjects || result.subjects.length === 0) {
      Alert.alert(
        "No Result Data",
        "No verified subjects found for this marksheet.",
      );
      return;
    }
    await generateAndShareMarksheetPDF(
      result.semesterName,
      student?.rollNo || result.rollNo || "—",
      student?.name || "Student",
      result.sgpa.toFixed(2),
      result.cgpa.toFixed(2),
      result.subjects,
      student,
    );
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
                <Award size={12} color="#ffffff" />
                <Text style={styles.headerBadgeText}>
                  CBCS AUTONOMOUS EXAMINATION
                </Text>
              </View>
              <Text style={styles.headerTitle}>
                Academic Marksheets &amp; Results
              </Text>
              <Text style={styles.headerSubtitle}>
                {student?.name || "Student"} &bull; {student?.rollNo || ""}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {dataLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#5c0d38" />
              <Text style={styles.loadingText}>
                Loading verified grade sheets...
              </Text>
            </View>
          ) : selectedSem ? (
            /* Detailed Grade Sheet View */
            <ScrollView
              style={styles.body}
              contentContainerStyle={{ paddingBottom: 30 }}
            >
              <TouchableOpacity
                onPress={() => setSelectedSem(null)}
                style={styles.backRow}
              >
                <ArrowLeft size={16} color="#5c0d38" />
                <Text style={styles.backRowText}>Back to All Semesters</Text>
              </TouchableOpacity>

              {/* Institutional Letterhead Card */}
              <View style={styles.marksheetCard}>
                <View style={styles.institutionHeader}>
                  <Text style={styles.instName}>
                    GOVT. MODEL AUTONOMOUS HOLKAR SCIENCE COLLEGE, INDORE
                  </Text>
                  <Text style={styles.instSub}>
                    An Autonomous Institution Affiliated to Devi Ahilya
                    Vishwavidyalaya
                  </Text>
                  <Text style={styles.instAccredited}>
                    NAAC Accredited 'A++' Grade &bull; Center of Excellence
                  </Text>
                </View>

                <View style={styles.marksheetDivider} />

                {/* Student Meta */}
                <View style={styles.studentMetaGrid}>
                  <View style={styles.metaCol}>
                    <Text style={styles.metaLabel}>Student Name:</Text>
                    <Text style={styles.metaVal}>{student?.name}</Text>
                  </View>
                  <View style={styles.metaCol}>
                    <Text style={styles.metaLabel}>Roll Number:</Text>
                    <Text style={styles.metaVal}>{student?.rollNo}</Text>
                  </View>
                  <View style={styles.metaCol}>
                    <Text style={styles.metaLabel}>Enrollment No:</Text>
                    <Text style={styles.metaVal}>{student?.enrollmentNo}</Text>
                  </View>
                  <View style={styles.metaCol}>
                    <Text style={styles.metaLabel}>Course &amp; Semester:</Text>
                    <Text style={styles.metaVal}>
                      {selectedSem.semesterName}
                    </Text>
                  </View>
                  <View style={styles.metaCol}>
                    <Text style={styles.metaLabel}>Exam Session:</Text>
                    <Text style={styles.metaVal}>
                      {selectedSem.examSession}
                    </Text>
                  </View>
                  <View style={styles.metaCol}>
                    <Text style={styles.metaLabel}>Marksheet No:</Text>
                    <Text style={styles.metaVal}>
                      {selectedSem.marksheetNo}
                    </Text>
                  </View>
                </View>

                {/* GPA Hero Box */}
                <View style={styles.gpaHeroRow}>
                  <View style={styles.gpaBox}>
                    <Text style={styles.gpaLabel}>SGPA</Text>
                    <Text style={styles.gpaValue}>
                      {selectedSem.sgpa.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.gpaBox}>
                    <Text style={styles.gpaLabel}>CGPA</Text>
                    <Text style={styles.gpaValue}>
                      {selectedSem.cgpa.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.gpaBox}>
                    <Text style={styles.gpaLabel}>CREDITS</Text>
                    <Text style={styles.gpaValue}>
                      {selectedSem.securedCredits}/{selectedSem.totalCredits}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.gpaBox,
                      {
                        backgroundColor:
                          selectedSem.result === "PASS" ? "#dcfce7" : "#fee2e2",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.gpaLabel,
                        {
                          color:
                            selectedSem.result === "PASS"
                              ? "#15803d"
                              : "#b91c1c",
                        },
                      ]}
                    >
                      STATUS
                    </Text>
                    <Text
                      style={[
                        styles.gpaValue,
                        {
                          color:
                            selectedSem.result === "PASS"
                              ? "#15803d"
                              : "#b91c1c",
                        },
                      ]}
                    >
                      {selectedSem.result}
                    </Text>
                  </View>
                </View>

                {/* Subject Wise Table */}
                <View style={styles.tableCard}>
                  <Text style={styles.tableHeaderTitle}>
                    Course Evaluation &amp; Grade Breakdown
                  </Text>
                  <View style={styles.tableHeaderRow}>
                    <Text style={[styles.th, { flex: 2 }]}>Subject</Text>
                    <Text
                      style={[styles.th, { width: 45, textAlign: "center" }]}
                    >
                      Credits
                    </Text>
                    <Text
                      style={[styles.th, { width: 50, textAlign: "center" }]}
                    >
                      Marks
                    </Text>
                    <Text
                      style={[styles.th, { width: 45, textAlign: "center" }]}
                    >
                      Grade
                    </Text>
                    <Text
                      style={[styles.th, { width: 40, textAlign: "center" }]}
                    >
                      GP
                    </Text>
                  </View>

                  {selectedSem.subjects.map((sub, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.tableRow,
                        idx % 2 === 1 && { backgroundColor: "#f8fafc" },
                      ]}
                    >
                      <View style={{ flex: 2 }}>
                        <Text style={styles.subName}>{sub.name}</Text>
                        <Text style={styles.subMeta}>
                          {sub.group} &bull; {sub.type}
                        </Text>
                      </View>
                      <Text
                        style={[styles.td, { width: 45, textAlign: "center" }]}
                      >
                        {sub.credits}
                      </Text>
                      <Text
                        style={[
                          styles.td,
                          { width: 50, textAlign: "center", fontWeight: "800" },
                        ]}
                      >
                        {sub.secured}
                      </Text>
                      <View
                        style={[
                          styles.gradeBadge,
                          {
                            backgroundColor:
                              sub.grade === "O" || sub.grade === "A+"
                                ? "#dcfce7"
                                : "#e0f2fe",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.gradeText,
                            {
                              color:
                                sub.grade === "O" || sub.grade === "A+"
                                  ? "#15803d"
                                  : "#0369a1",
                            },
                          ]}
                        >
                          {sub.grade}
                        </Text>
                      </View>
                      <Text
                        style={[styles.td, { width: 40, textAlign: "center" }]}
                      >
                        {sub.gp}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Footer Seal & Actions */}
                <View style={styles.footerNoteRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.securitySeal}>
                      🔒 Autonomous Examination Control Seal
                    </Text>
                    <Text style={styles.securitySub}>
                      Digital verification code: AUTH-CBCS-
                      {selectedSem.marksheetNo}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDownloadMarksheetPDF(selectedSem)}
                    style={styles.shareBtn}
                  >
                    <Download size={14} color="#ffffff" />
                    <Text style={styles.shareBtnText}>Download PDF</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          ) : (
            /* Semester List View */
            <ScrollView
              style={styles.body}
              contentContainerStyle={{ paddingBottom: 24 }}
            >
              <Text style={styles.sectionHeading}>
                Published Examination Semesters
              </Text>

              {activeResults.length === 0 ? (
                <View style={styles.emptyBox}>
                  <FileText size={40} color="#cbd5e1" />
                  <Text style={styles.emptyTitle}>
                    No examination grade sheets published yet.
                  </Text>
                  <Text style={styles.emptySubtitle}>
                    Official grades will be posted here upon result declaration
                    by the Examination Cell.
                  </Text>
                </View>
              ) : (
                activeResults.map((sem) => (
                  <TouchableOpacity
                    key={sem.id}
                    style={styles.semCard}
                    onPress={() => setSelectedSem(sem)}
                  >
                    <View style={styles.semLeft}>
                      <View style={styles.semIconBox}>
                        <Award size={20} color="#5c0d38" />
                      </View>
                      <View>
                        <Text style={styles.semName}>{sem.semesterName}</Text>
                        <Text style={styles.semSession}>{sem.examSession}</Text>
                        <View style={styles.semStatsRow}>
                          <Text style={styles.semStatText}>
                            SGPA:{" "}
                            <Text
                              style={{ fontWeight: "800", color: "#1e293b" }}
                            >
                              {sem.sgpa.toFixed(2)}
                            </Text>
                          </Text>
                          <Text style={styles.semStatDot}>&bull;</Text>
                          <Text style={styles.semStatText}>
                            CGPA:{" "}
                            <Text
                              style={{ fontWeight: "800", color: "#1e293b" }}
                            >
                              {sem.cgpa.toFixed(2)}
                            </Text>
                          </Text>
                          <Text style={styles.semStatDot}>&bull;</Text>
                          <Text style={styles.semStatText}>
                            Credits: {sem.securedCredits}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.semRight}>
                      <View
                        style={[
                          styles.resultBadge,
                          {
                            backgroundColor:
                              sem.result === "PASS" ? "#dcfce7" : "#fee2e2",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.resultBadgeText,
                            {
                              color:
                                sem.result === "PASS" ? "#15803d" : "#b91c1c",
                            },
                          ]}
                        >
                          {sem.result}
                        </Text>
                      </View>
                      <ChevronRight size={18} color="#94a3b8" />
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          )}
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
    minHeight: "65%",
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
  loadingBox: {
    padding: 50,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "600",
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: "800",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  semCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  semLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  semIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#fdf2f7",
    alignItems: "center",
    justifyContent: "center",
  },
  semName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1e293b",
  },
  semSession: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 1,
  },
  semStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  semStatText: {
    fontSize: 11,
    color: "#475569",
  },
  semStatDot: {
    color: "#cbd5e1",
    fontSize: 10,
  },
  semRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  resultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  resultBadgeText: {
    fontSize: 10,
    fontWeight: "800",
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
    alignSelf: "flex-start",
  },
  backRowText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#5c0d38",
  },
  marksheetCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 16,
    padding: 16,
  },
  institutionHeader: {
    alignItems: "center",
    textAlign: "center",
  },
  instName: {
    fontSize: 12,
    fontWeight: "900",
    color: "#5c0d38",
    textAlign: "center",
    letterSpacing: 0.3,
  },
  instSub: {
    fontSize: 10,
    color: "#475569",
    textAlign: "center",
    marginTop: 2,
  },
  instAccredited: {
    fontSize: 9.5,
    fontWeight: "700",
    color: "#15803d",
    textAlign: "center",
    marginTop: 2,
  },
  marksheetDivider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: 12,
  },
  studentMetaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    backgroundColor: "#f8fafc",
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  metaCol: {
    width: "48%",
  },
  metaLabel: {
    fontSize: 9.5,
    color: "#64748b",
    fontWeight: "600",
  },
  metaVal: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "#1e293b",
    marginTop: 1,
  },
  gpaHeroRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  gpaBox: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    borderRadius: 10,
    padding: 8,
    alignItems: "center",
  },
  gpaLabel: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "#475569",
  },
  gpaValue: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0f172a",
    marginTop: 2,
  },
  tableCard: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 14,
  },
  tableHeaderTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#334155",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
  },
  th: {
    fontSize: 10,
    fontWeight: "800",
    color: "#475569",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
  },
  subName: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0f172a",
  },
  subMeta: {
    fontSize: 9,
    color: "#64748b",
    marginTop: 1,
  },
  td: {
    fontSize: 11,
    color: "#334155",
  },
  gradeBadge: {
    width: 40,
    paddingVertical: 2,
    borderRadius: 4,
    alignItems: "center",
  },
  gradeText: {
    fontSize: 11,
    fontWeight: "800",
  },
  footerNoteRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
  },
  securitySeal: {
    fontSize: 10,
    fontWeight: "800",
    color: "#5c0d38",
  },
  securitySub: {
    fontSize: 8.5,
    color: "#94a3b8",
    marginTop: 1,
  },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#5c0d38",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  shareBtnText: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "#ffffff",
  },
  emptyBox: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#475569",
  },
  emptySubtitle: {
    fontSize: 12,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 16,
  },
});
