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
import { X, Download, ShieldCheck } from "lucide-react-native";
import { FeeInstallment } from "../types";
import { generateAndSharePaymentSlipPDF } from "../utils/pdfGenerator";
import { useApp } from "../context/AppContext";

interface Props {
  visible: boolean;
  onClose: () => void;
  installment: FeeInstallment | null;
  studentName?: string;
  fatherName?: string;
  motherName?: string;
  rollNo?: string;
  enrollmentNo?: string;
}

export const FeeReceiptSlipModal: React.FC<Props> = ({
  visible,
  onClose,
  installment,
  studentName,
  fatherName,
  motherName,
  rollNo,
  enrollmentNo,
}) => {
  const { student } = useApp();
  if (!installment) return null;

  const activeStudentName = studentName || student?.name || "Student";
  const activeRollNo = rollNo || student?.rollNo || "—";
  const activeEnrollmentNo = enrollmentNo || student?.enrollmentNo || "—";
  const activeFatherName = fatherName || student?.parentName || "Not Provided";
  const activeMotherName =
    motherName || (student as any)?.motherName || "Not Provided";
  const activePhone = student?.phone || "Not Provided";
  const activeProgramme =
    student?.programme || student?.course || "Undergraduate Programme";

  const handleDownload = async () => {
    if (!installment.receiptNo) {
      Alert.alert(
        "Receipt Unavailable",
        "No official receipt number has been generated for this installment.",
      );
      return;
    }
    await generateAndSharePaymentSlipPDF(installment, {
      name: activeStudentName,
      rollNo: activeRollNo,
      enrollmentNo: activeEnrollmentNo,
      fatherName: activeFatherName,
      motherName: activeMotherName,
      phone: activePhone,
      programme: activeProgramme,
    });
  };

  const amountFormatted = `${installment.amount.toFixed(2)}`;
  const payDate = installment.paidOn || "—";
  const orderNumber = installment.receiptNo || "—";
  const txnRef =
    (installment as any).transactionId || installment.receiptNo || "—";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header Bar */}
          <View style={styles.topActionsBar}>
            <View style={styles.modalTitleRow}>
              <ShieldCheck size={18} color="#15803d" />
              <Text style={styles.modalTitle}>
                Official College Payment Slip
              </Text>
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity
                onPress={handleDownload}
                style={styles.downloadHeaderBtn}
              >
                <Download size={14} color="#ffffff" />
                <Text style={styles.downloadHeaderBtnText}>Download PDF</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={18} color="#1e1b24" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={true}
            style={styles.scrollArea}
          >
            {/* EXACT OFFICIAL HOLKAR PAYMENT SLIP FRAME */}
            <View style={styles.slipFrame}>
              {/* Holkar Crest Watermark */}
              <Image
                source={require("../../assets/holkar_logo.png")}
                style={styles.watermarkLogo}
                resizeMode="contain"
              />

              {/* Top Title Bar */}
              <View style={styles.topBar}>
                <Text style={styles.clgTitle}>
                  Government Holkar (Model Autonomous) Science College, Indore
                </Text>
                <Text style={styles.pageNum}>1</Text>
              </View>
              <View style={styles.headerLine} />

              <View style={styles.subTitleRow}>
                <Text style={styles.nepBadge}>NEP</Text>
                <Text style={styles.slipForTitle}>Payment Slip For</Text>
                <View style={{ width: 25 }} />
              </View>

              <Text style={styles.examTitle}>
                {(installment.title || "COLLEGE FEE").toUpperCase()} •{" "}
                {activeProgramme.toUpperCase()}
              </Text>

              {/* Boxed Roll No & Enrollment No */}
              <View style={styles.rollEnrollRow}>
                <View style={styles.boxGroup}>
                  <Text style={styles.boxLabel}>Roll No. : -</Text>
                  <View style={styles.charBoxWrap}>
                    <Text style={styles.charBoxText}>
                      {activeRollNo.split("").join(" ")}
                    </Text>
                  </View>
                </View>

                <View style={styles.boxGroup}>
                  <Text style={styles.boxLabel}>Enrollment No. : -</Text>
                  <View style={styles.charBoxWrap}>
                    <Text style={styles.charBoxText}>
                      {activeEnrollmentNo.split("").join(" ")}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Student Details Section with Barcode */}
              <View style={styles.studentDetailsSection}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.secHeading}>Student Details</Text>
                  <View style={styles.barcodeWrap}>
                    <Text style={styles.barcodeText}>
                      ||||||||||||||||||||||||||||||||||||||||
                    </Text>
                  </View>
                </View>

                <View style={styles.detailsGrid}>
                  {/* Left Column: Student Name & Mother Name */}
                  <View style={styles.col}>
                    <View style={styles.infoField}>
                      <Text style={styles.fLabel}>Name</Text>
                      <View style={styles.fValBox}>
                        <Text style={styles.fValEng}>{activeStudentName}</Text>
                      </View>
                    </View>

                    <View style={styles.infoField}>
                      <Text style={styles.fLabel}>Mother's Name</Text>
                      <View style={styles.fValBox}>
                        <Text style={styles.fValEng}>{activeMotherName}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Right Column: Father Name & Mobile No */}
                  <View style={styles.col}>
                    <View style={styles.infoField}>
                      <Text style={styles.fLabel}>Father's Name</Text>
                      <View style={styles.fValBox}>
                        <Text style={styles.fValEng}>{activeFatherName}</Text>
                      </View>
                    </View>

                    <View style={styles.infoField}>
                      <Text style={styles.fLabel}>Mob. No.</Text>
                      <View style={styles.fValBox}>
                        <Text style={styles.fValContact}>{activePhone}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>

              {/* Payment Details Section */}
              <View style={styles.paymentSection}>
                <Text style={styles.paymentHeading}>Payment Details :</Text>

                <View style={styles.payGrid}>
                  <View style={styles.payRow}>
                    <View style={styles.payPair}>
                      <Text style={styles.pLabel}>Payment Date :</Text>
                      <Text style={styles.pVal}>{payDate}</Text>
                    </View>

                    <View style={styles.payPair}>
                      <Text style={styles.pLabel}>Payment Mode :</Text>
                      <Text style={styles.pVal}>ONLINE</Text>
                    </View>
                  </View>

                  <View style={styles.payRow}>
                    <View style={styles.payPair}>
                      <Text style={styles.pLabel}>Amount :</Text>
                      <Text style={[styles.pVal, { fontWeight: "800" }]}>
                        ₹{amountFormatted}
                      </Text>
                    </View>

                    <View style={styles.payPair}>
                      <Text style={styles.pLabel}>Order Number :</Text>
                      <Text style={styles.pVal}>{orderNumber}</Text>
                    </View>
                  </View>

                  <View style={styles.payRow}>
                    <View style={[styles.payPair, { flex: 1 }]}>
                      <Text style={styles.pLabel}>
                        Transaction Reference No. :
                      </Text>
                      <Text style={styles.pVal}>{txnRef}</Text>
                    </View>
                  </View>

                  <View style={styles.payRow}>
                    <View style={[styles.payPair, { flex: 1 }]}>
                      <Text style={styles.pLabel}>Remarks :</Text>
                      <Text style={styles.pVal}>
                        {installment.title || "Official College Fee"}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Bottom Floating PDF Download Button */}
            <TouchableOpacity
              onPress={handleDownload}
              style={styles.floatingDownloadBtn}
            >
              <Download size={18} color="#ffffff" />
              <Text style={styles.floatingDownloadBtnText}>
                Download Official Payment Slip (PDF)
              </Text>
            </TouchableOpacity>

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
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "92%",
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 6,
    flexDirection: "column",
  },
  topActionsBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 8,
  },
  modalTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#15803d",
  },
  downloadHeaderBtn: {
    backgroundColor: "#5c0d38",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  downloadHeaderBtnText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "800",
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollArea: {
    flex: 1,
  },
  slipFrame: {
    backgroundColor: "#ffffff",
    borderColor: "#0f172a",
    borderWidth: 1.5,
    padding: 12,
    marginBottom: 12,
    position: "relative",
    overflow: "hidden",
  },
  watermarkLogo: {
    position: "absolute",
    width: 200,
    height: 200,
    top: "25%",
    left: "28%",
    opacity: 0.08,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  clgTitle: {
    fontFamily: "serif",
    fontSize: 12.5,
    fontStyle: "italic",
    fontWeight: "700",
    color: "#0f172a",
    flex: 1,
    textAlign: "center",
  },
  pageNum: {
    fontFamily: "serif",
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
    paddingLeft: 4,
  },
  headerLine: {
    width: "100%",
    height: 1,
    backgroundColor: "#0f172a",
    marginTop: 4,
    marginBottom: 6,
  },
  subTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  nepBadge: {
    fontSize: 11.5,
    fontFamily: "serif",
    fontWeight: "700",
    color: "#0f172a",
  },
  slipForTitle: {
    fontSize: 12,
    fontFamily: "serif",
    fontWeight: "600",
    color: "#0f172a",
    textAlign: "center",
  },
  examTitle: {
    fontSize: 11,
    fontFamily: "serif",
    fontWeight: "700",
    color: "#0f172a",
    textAlign: "center",
    marginTop: 3,
    marginBottom: 10,
  },
  rollEnrollRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 6,
    gap: 8,
  },
  boxGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  boxLabel: {
    fontFamily: "serif",
    fontSize: 10.5,
    color: "#0f172a",
    fontWeight: "600",
  },
  charBoxWrap: {
    borderWidth: 1,
    borderColor: "#0f172a",
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: "#f8fafc",
  },
  charBoxText: {
    fontFamily: "monospace",
    fontSize: 11,
    fontWeight: "800",
    color: "#0f172a",
  },
  studentDetailsSection: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#0f172a",
    paddingVertical: 8,
    marginVertical: 8,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  secHeading: {
    fontFamily: "serif",
    fontSize: 11.5,
    fontWeight: "700",
    color: "#0f172a",
    textDecorationLine: "underline",
  },
  barcodeWrap: {
    paddingRight: 4,
  },
  barcodeText: {
    fontFamily: "monospace",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.5,
    color: "#0f172a",
  },
  detailsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  col: {
    flex: 1,
    gap: 8,
  },
  infoField: {
    gap: 2,
  },
  fLabel: {
    fontSize: 9.5,
    fontFamily: "serif",
    color: "#475569",
  },
  fValBox: {
    borderLeftWidth: 2,
    borderColor: "#0f172a",
    borderBottomWidth: 1,
    paddingLeft: 6,
    paddingBottom: 2,
  },
  fValEng: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#0f172a",
    fontFamily: "serif",
  },
  fValHindi: {
    fontSize: 10,
    fontWeight: "800",
    color: "#0f172a",
    marginTop: 1,
  },
  fValContact: {
    fontSize: 9,
    fontWeight: "700",
    color: "#0f172a",
    fontFamily: "monospace",
  },
  paymentSection: {
    paddingTop: 6,
    gap: 6,
  },
  paymentHeading: {
    fontFamily: "serif",
    fontSize: 11.5,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 4,
  },
  payGrid: {
    gap: 6,
  },
  payRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  payPair: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  pLabel: {
    fontFamily: "serif",
    fontSize: 10,
    color: "#475569",
  },
  pVal: {
    fontFamily: "monospace",
    fontSize: 10,
    fontWeight: "700",
    color: "#0f172a",
  },
  floatingDownloadBtn: {
    backgroundColor: "#5c0d38",
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
    shadowColor: "#5c0d38",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  floatingDownloadBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800",
  },
});
