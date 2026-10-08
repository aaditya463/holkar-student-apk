import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import {
  X,
  CreditCard,
  QrCode,
  Smartphone,
  Building2,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react-native";
import { FeeInstallment } from "../types";
import { collectFeeApi } from "../api/student.api";
import { useApp } from "../context/AppContext";

interface Props {
  visible: boolean;
  onClose: () => void;
  installment: FeeInstallment | null;
  onPaymentComplete: (feeId: string, receiptNo: string) => void;
}

export const FeePayModal: React.FC<Props> = ({
  visible,
  onClose,
  installment,
  onPaymentComplete,
}) => {
  const { student } = useApp();
  const [paymentMode, setPaymentMode] = useState<
    "UPI" | "QR" | "CARD" | "NET_BANKING"
  >("UPI");
  const [upiId, setUpiId] = useState("student@okaxis");
  const [processing, setProcessing] = useState(false);

  if (!installment) return null;

  const amountStr = installment.amount.toLocaleString("en-IN");

  const handlePay = async () => {
    setProcessing(true);
    try {
      const mode =
        paymentMode === "CARD"
          ? "CARD"
          : paymentMode === "NET_BANKING"
            ? "NETBANKING"
            : "UPI";

      if (!installment.demandId) {
        throw new Error(
          "Authoritative fee demand reference is missing. Please refresh fee schedule.",
        );
      }

      const res = await collectFeeApi(
        installment.demandId,
        installment.id,
        installment.installmentNumber || 1,
        mode,
      );

      const realReceipt = res?.data?.receiptNo || res?.receiptNo;
      const serverStatus = res?.data?.status || res?.status;
      const isSettled =
        (serverStatus === "PAID" || serverStatus === "SETTLED") &&
        Boolean(realReceipt);

      if (isSettled) {
        onPaymentComplete(installment.id, realReceipt);
        onClose();
        Alert.alert(
          "Payment Verified! 💰",
          `₹${amountStr} received by Govt. Holkar Science College Treasury.\nReceipt No: ${realReceipt}`,
        );
        return;
      }

      const isPendingOrder =
        serverStatus === "PENDING_VERIFICATION" ||
        serverStatus === "PENDING" ||
        Boolean(res?.data?.orderId || res?.orderId);

      if (isPendingOrder) {
        const orderId = res?.data?.orderId || res?.orderId || "ORDER-PENDING";
        onClose();
        Alert.alert(
          "Payment Order Initiated ⏳",
          `Order ID: ${orderId}\nAmount: ₹${amountStr}\nYour payment order has been registered with the College Treasury Gateway. Please complete authorization in your bank/UPI gateway app. Your fee ledger and receipt will update upon confirmation.`,
        );
        return;
      }

      throw new Error(
        res?.message ||
          "Payment processing could not be verified by College Treasury.",
      );
    } catch (err: any) {
      const errMsg = err?.message || "";
      if (
        errMsg.includes("ONLINE_PAYMENT_UNAVAILABLE") ||
        errMsg.includes("EXTERNAL_PROVIDER_REQUIRED")
      ) {
        Alert.alert(
          "Online Payment Unavailable",
          "Online checkout gateway is currently not configured or requires external provider verification. Please pay at the Holkar College Fee Counter.",
        );
      } else {
        Alert.alert(
          "Payment Transaction Failed",
          errMsg ||
            "Transaction could not be completed by college treasury gateway. Please try again.",
        );
      }
    } finally {
      setProcessing(false);
    }
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
              <Text style={styles.headerTitle}>Pay College Fees Online</Text>
              <Text style={styles.headerSub}>
                {installment.title} • Academic Year 2024-25
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color="#1e1b24" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
            {/* BIG MAROON PAYABLE AMOUNT BANNER */}
            <View style={styles.payableCard}>
              <View style={styles.payableTop}>
                <Text style={styles.payableLabel}>PAYABLE AMOUNT</Text>
                <View style={styles.zeroFeeChip}>
                  <Text style={styles.zeroFeeText}>Zero Convenience Fee</Text>
                </View>
              </View>
              <Text style={styles.payableAmount}>₹{amountStr}</Text>
            </View>

            {/* SELECT PAYMENT MODE */}
            <Text style={styles.sectionLabel}>SELECT PAYMENT MODE</Text>
            <View style={styles.modeGrid}>
              <TouchableOpacity
                onPress={() => setPaymentMode("UPI")}
                style={[
                  styles.modeCard,
                  paymentMode === "UPI" && styles.modeCardActive,
                ]}
              >
                <Smartphone
                  size={18}
                  color={paymentMode === "UPI" ? "#5c0d38" : "#64748b"}
                />
                <Text
                  style={[
                    styles.modeTitle,
                    paymentMode === "UPI" && styles.modeTitleActive,
                  ]}
                >
                  UPI Apps
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setPaymentMode("QR")}
                style={[
                  styles.modeCard,
                  paymentMode === "QR" && styles.modeCardActive,
                ]}
              >
                <QrCode
                  size={18}
                  color={paymentMode === "QR" ? "#5c0d38" : "#64748b"}
                />
                <Text
                  style={[
                    styles.modeTitle,
                    paymentMode === "QR" && styles.modeTitleActive,
                  ]}
                >
                  Scan QR Code
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setPaymentMode("CARD")}
                style={[
                  styles.modeCard,
                  paymentMode === "CARD" && styles.modeCardActive,
                ]}
              >
                <CreditCard
                  size={18}
                  color={paymentMode === "CARD" ? "#5c0d38" : "#64748b"}
                />
                <Text
                  style={[
                    styles.modeTitle,
                    paymentMode === "CARD" && styles.modeTitleActive,
                  ]}
                >
                  Debit/Credit Card
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setPaymentMode("NET_BANKING")}
                style={[
                  styles.modeCard,
                  paymentMode === "NET_BANKING" && styles.modeCardActive,
                ]}
              >
                <Building2
                  size={18}
                  color={paymentMode === "NET_BANKING" ? "#5c0d38" : "#64748b"}
                />
                <Text
                  style={[
                    styles.modeTitle,
                    paymentMode === "NET_BANKING" && styles.modeTitleActive,
                  ]}
                >
                  Net Banking
                </Text>
              </TouchableOpacity>
            </View>

            {/* UPI ID INPUT BOX WITH CHIPS */}
            {paymentMode === "UPI" && (
              <View style={styles.upiInputSection}>
                <Text style={styles.inputFieldLabel}>Enter VPA / UPI ID</Text>
                <TextInput
                  value={upiId}
                  onChangeText={setUpiId}
                  style={styles.upiInput}
                  placeholder="student@okaxis"
                />

                <View style={styles.chipsRow}>
                  {["@okaxis", "@okhdfcbank", "@paytm", "@ybl"].map((chip) => (
                    <TouchableOpacity
                      key={chip}
                      onPress={() => setUpiId(`student${chip}`)}
                      style={styles.chip}
                    >
                      <Text style={styles.chipText}>{chip}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {paymentMode === "QR" && (
              <View style={styles.qrDisplayBox}>
                <QrCode size={130} color="#5c0d38" />
                <Text style={styles.qrPayAmount}>Scan & Pay ₹{amountStr}</Text>
                <Text style={styles.qrPaySub}>
                  Accepts GPay, PhonePe, Paytm, BHIM UPI
                </Text>
              </View>
            )}

            {paymentMode === "CARD" && (
              <View style={styles.cardInputSection}>
                <Text style={styles.inputFieldLabel}>Card Number</Text>
                <TextInput
                  placeholder="4532 •••• •••• 8921"
                  style={styles.upiInput}
                />
              </View>
            )}

            {paymentMode === "NET_BANKING" && (
              <View style={styles.cardInputSection}>
                <Text style={styles.inputFieldLabel}>Select Bank</Text>
                <View style={styles.bankPills}>
                  {["SBI", "HDFC Bank", "ICICI Bank", "Axis Bank", "PNB"].map(
                    (b) => (
                      <View key={b} style={styles.bankPill}>
                        <Text style={styles.bankPillText}>{b}</Text>
                      </View>
                    ),
                  )}
                </View>
              </View>
            )}

            {/* SECURITY BADGE */}
            <View style={styles.securityRow}>
              <ShieldCheck size={16} color="#15803d" />
              <Text style={styles.securityText}>
                Authoritative Fee Counter • Bank Challan / Treasury Integration
              </Text>
            </View>

            {/* BIG ACTION PAY BUTTON */}
            <TouchableOpacity
              onPress={handlePay}
              disabled={processing}
              style={[styles.paySubmitBtn, processing && { opacity: 0.7 }]}
            >
              <Text style={styles.paySubmitBtnText}>
                {processing
                  ? "Processing Payment..."
                  : `Pay ₹${amountStr} & Generate Receipt`}
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
  payableCard: {
    backgroundColor: "#5c0d38",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  payableTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  payableLabel: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "rgba(255,255,255,0.85)",
    letterSpacing: 0.5,
  },
  zeroFeeChip: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  zeroFeeText: {
    color: "#ffffff",
    fontSize: 9.5,
    fontWeight: "700",
  },
  payableAmount: {
    fontSize: 28,
    fontWeight: "900",
    color: "#ffffff",
    marginTop: 6,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748b",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  modeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  modeCard: {
    width: "48.5%",
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modeCardActive: {
    borderColor: "#5c0d38",
    backgroundColor: "#fdf2f8",
  },
  modeTitle: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#475569",
  },
  modeTitleActive: {
    color: "#5c0d38",
    fontWeight: "800",
  },
  upiInputSection: {
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 14,
  },
  inputFieldLabel: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#64748b",
    marginBottom: 6,
  },
  upiInput: {
    backgroundColor: "#ffffff",
    borderColor: "#cbd5e1",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    fontWeight: "700",
    color: "#1e1b24",
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  chip: {
    backgroundColor: "#ffffff",
    borderColor: "#cbd5e1",
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  chipText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#475569",
  },
  qrDisplayBox: {
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
    alignItems: "center",
    marginBottom: 14,
  },
  qrPayAmount: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1e1b24",
    marginTop: 8,
  },
  qrPaySub: {
    fontSize: 10.5,
    color: "#64748b",
    marginTop: 2,
  },
  cardInputSection: {
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 14,
  },
  bankPills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  bankPill: {
    backgroundColor: "#ffffff",
    borderColor: "#cbd5e1",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  bankPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#334155",
  },
  securityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 14,
  },
  securityText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#15803d",
  },
  paySubmitBtn: {
    backgroundColor: "#5c0d38",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  paySubmitBtnText: {
    color: "#ffffff",
    fontSize: 13.5,
    fontWeight: "900",
  },
});
