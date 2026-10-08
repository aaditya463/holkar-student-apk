import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Lock, X, Check, ShieldCheck, AlertCircle } from "lucide-react-native";
import * as SecureStore from "expo-secure-store";
import {
  setupMpin,
  changeMpin,
  validateMpinStrength,
} from "../services/security.service";

interface Props {
  visible: boolean;
  onClose: () => void;
  mode: "setup" | "change";
  onSuccess: () => void;
}

export const MpinModal: React.FC<Props> = ({
  visible,
  onClose,
  mode,
  onSuccess,
}) => {
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetForm = () => {
    setCurrentPin("");
    setNewPin("");
    setConfirmPin("");
    setErrorMessage(null);
    setLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    setErrorMessage(null);

    if (mode === "change") {
      if (!currentPin || currentPin.length !== 6) {
        setErrorMessage("Current 6-digit MPIN is required.");
        return;
      }
    }

    if (!newPin || newPin.length !== 6) {
      setErrorMessage("New MPIN must be exactly 6 digits.");
      return;
    }

    const strength = validateMpinStrength(newPin);
    if (!strength.valid) {
      setErrorMessage(strength.reason || "Invalid MPIN strength.");
      return;
    }

    if (newPin !== confirmPin) {
      setErrorMessage("New MPIN and confirmation MPIN do not match.");
      return;
    }

    if (mode === "change" && currentPin === newPin) {
      setErrorMessage("New MPIN must be different from your current MPIN.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "setup") {
        const res = await setupMpin(newPin, confirmPin);
        if (!res.success) {
          setErrorMessage(res.error || "Failed to setup MPIN.");
          return;
        }
        Alert.alert(
          "MPIN Configured",
          "Your 6-digit MPIN has been securely saved in Android Keystore.",
        );
      } else {
        const res = await changeMpin(currentPin, newPin, confirmPin);
        if (!res.success) {
          setErrorMessage(res.error || "Failed to change MPIN.");
          return;
        }
        Alert.alert(
          "MPIN Changed",
          "Your 6-digit MPIN has been updated successfully.",
        );
      }

      resetForm();
      onSuccess();
      onClose();
    } catch (e: any) {
      setErrorMessage(e.message || "Error configuring MPIN.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <ShieldCheck size={20} color="#5c0d38" />
              <Text style={styles.sheetTitle}>
                {mode === "setup" ? "Set 6-Digit MPIN" : "Change 6-Digit MPIN"}
              </Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <X size={18} color="#64748b" />
            </TouchableOpacity>
          </View>

          <Text style={styles.sheetSubtitle}>
            {mode === "setup"
              ? "Configure a 6-digit numeric PIN for fast local unlock. Stored cryptographically in Android Keystore."
              : "Enter your existing MPIN followed by your new 6-digit security PIN."}
          </Text>

          {errorMessage && (
            <View style={styles.errorBox}>
              <AlertCircle size={16} color="#dc2626" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {mode === "change" && (
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Current 6-Digit MPIN</Text>
              <TextInput
                style={styles.input}
                value={currentPin}
                onChangeText={(val) =>
                  setCurrentPin(val.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="Enter current 6 digits"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                secureTextEntry
                maxLength={6}
              />
            </View>
          )}

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>New 6-Digit MPIN</Text>
            <TextInput
              style={styles.input}
              value={newPin}
              onChangeText={(val) =>
                setNewPin(val.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="e.g. 582914 (avoid 123456 or repeats)"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
              secureTextEntry
              maxLength={6}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Confirm New 6-Digit MPIN</Text>
            <TextInput
              style={styles.input}
              value={confirmPin}
              onChangeText={(val) =>
                setConfirmPin(val.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="Re-enter 6 digits"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
              secureTextEntry
              maxLength={6}
            />
          </View>

          <View style={styles.noticeBox}>
            <Text style={styles.noticeText}>
              • 5 maximum attempts before a 5-minute lockout{"\n"}• MPIN is only
              a local unlock device mechanism{"\n"}• Never use sequential or
              repeated digits
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>
                {mode === "setup" ? "Save Secure MPIN" : "Update MPIN"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    justifyContent: "flex-end",
  },
  sheetContainer: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1e1b24",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  sheetSubtitle: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 16,
    lineHeight: 17,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
  },
  errorText: {
    fontSize: 12,
    color: "#dc2626",
    fontWeight: "600",
    flex: 1,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderWidth: 1.5,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    backgroundColor: "#f8fafc",
    paddingHorizontal: 14,
    fontSize: 16,
    letterSpacing: 4,
    fontWeight: "700",
    color: "#0f172a",
  },
  noticeBox: {
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  noticeText: {
    fontSize: 11,
    color: "#166534",
    lineHeight: 16,
  },
  submitBtn: {
    height: 48,
    backgroundColor: "#5c0d38",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },
});
