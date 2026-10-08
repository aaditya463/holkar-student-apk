import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Receipt,
  ShieldCheck,
} from "lucide-react-native";
import { FeeInstallment } from "../types";

interface Props {
  fees: FeeInstallment[];
  onOpenPayModal: (installment: FeeInstallment) => void;
  onViewReceipt: (installment: FeeInstallment) => void;
}

export const FeesScreen: React.FC<Props> = ({
  fees,
  onOpenPayModal,
  onViewReceipt,
}) => {
  const totalPaid = fees
    .filter((f) => f.status === "PAID")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalDue = fees
    .filter((f) => f.status === "DUE")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const earliestDueDate = fees.find((f) => f.status === "DUE")?.dueDate;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Fee Ledger & Receipts</Text>
        <Text style={styles.headerSub}>
          Govt Holkar Autonomous College Accounts Portal
        </Text>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <View
          style={[
            styles.summaryCard,
            { backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" },
          ]}
        >
          <Text style={styles.summaryLabel}>Total Paid</Text>
          <Text style={[styles.summaryVal, { color: "#15803d" }]}>
            ₹{totalPaid.toLocaleString("en-IN")}
          </Text>
          <Text style={styles.summaryMeta}>
            {totalPaid > 0 && totalDue === 0
              ? "All Installments Cleared"
              : totalPaid > 0
                ? "Partial Payment Recorded"
                : "No Payments Recorded"}
          </Text>
        </View>

        <View
          style={[
            styles.summaryCard,
            { backgroundColor: "#fffbeb", borderColor: "#fde68a" },
          ]}
        >
          <Text style={styles.summaryLabel}>Outstanding</Text>
          <Text style={[styles.summaryVal, { color: "#b45309" }]}>
            ₹{totalDue.toLocaleString("en-IN")}
          </Text>
          <Text style={styles.summaryMeta}>
            {totalDue > 0
              ? earliestDueDate
                ? `Due by ${earliestDueDate}`
                : "Payment Pending"
              : "No Dues Pending"}
          </Text>
        </View>
      </View>

      {/* Installment Breakdown */}
      <Text style={styles.sectionTitle}>Fee Installments & Schedule</Text>
      <View style={styles.list}>
        {fees.length === 0 ? (
          <View style={styles.emptyCard}>
            <Receipt size={36} color="#94a3b8" />
            <Text style={styles.emptyTitle}>
              No fee demands or installments currently due.
            </Text>
            <Text style={styles.emptySub}>
              Official fee ledgers and installment notices will appear here once
              published by the Accounts Office.
            </Text>
          </View>
        ) : (
          fees.map((fee) => (
            <View key={fee.id} style={styles.feeCard}>
              <View style={styles.feeTopRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.feeTitle}>{fee.title}</Text>
                  <Text style={styles.feeDue}>Due Date: {fee.dueDate}</Text>
                </View>
                <Text style={styles.feeAmount}>
                  ₹{fee.amount.toLocaleString("en-IN")}
                </Text>
              </View>

              <View style={styles.feeDivider} />

              <View style={styles.feeFooter}>
                {fee.status === "PAID" ? (
                  <View style={styles.paidStatusRow}>
                    <CheckCircle2 size={15} color="#15803d" />
                    <Text style={styles.paidText}>
                      PAID on {fee.paidOn} ({fee.receiptNo})
                    </Text>
                  </View>
                ) : (
                  <View style={styles.dueStatusRow}>
                    <AlertCircle size={15} color="#b45309" />
                    <Text style={styles.dueText}>Payment Due</Text>
                  </View>
                )}

                {fee.status === "DUE" ? (
                  <TouchableOpacity
                    onPress={() => onOpenPayModal(fee)}
                    style={styles.payBtn}
                  >
                    <Text style={styles.payBtnText}>Pay Now &rarr;</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={() => onViewReceipt(fee)}
                    style={styles.receiptBtn}
                  >
                    <Receipt size={13} color="#5c0d38" />
                    <Text style={styles.receiptBtnText}>
                      Official Slip (PDF)
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </View>

      {/* Security Note */}
      <View style={styles.securityBox}>
        <ShieldCheck size={16} color="#15803d" />
        <Text style={styles.securityText}>
          Direct MP Treasury & Autonomous College Merchant Gateway. Official
          digital receipt generated instantly upon payment.
        </Text>
      </View>

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
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1e1b24",
  },
  headerSub: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 1,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
  },
  summaryLabel: {
    fontSize: 10.5,
    color: "#64748b",
    fontWeight: "600",
  },
  summaryVal: {
    fontSize: 18,
    fontWeight: "900",
    marginVertical: 2,
  },
  summaryMeta: {
    fontSize: 10,
    color: "#64748b",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1e1b24",
    marginBottom: 10,
  },
  list: {
    gap: 10,
    marginBottom: 16,
  },
  feeCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  feeTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  feeTitle: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#1e1b24",
  },
  feeDue: {
    fontSize: 10.5,
    color: "#64748b",
    marginTop: 2,
  },
  feeAmount: {
    fontSize: 15,
    fontWeight: "900",
    color: "#1e1b24",
    marginLeft: 8,
  },
  feeDivider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginVertical: 10,
  },
  feeFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  paidStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  paidText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#15803d",
  },
  dueStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dueText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#b45309",
  },
  payBtn: {
    backgroundColor: "#5c0d38",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  payBtnText: {
    color: "#ffffff",
    fontSize: 11.5,
    fontWeight: "800",
  },
  receiptBtn: {
    backgroundColor: "#fdf2f8",
    borderColor: "#fbcfe8",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  receiptBtnText: {
    color: "#5c0d38",
    fontSize: 10.5,
    fontWeight: "800",
  },
  securityBox: {
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  securityText: {
    fontSize: 10.5,
    color: "#166534",
    flex: 1,
    lineHeight: 14,
  },
  emptyCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#334155",
    marginTop: 12,
    textAlign: "center",
  },
  emptySub: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
    textAlign: "center",
    lineHeight: 17,
  },
});
