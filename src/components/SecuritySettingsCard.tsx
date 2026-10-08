import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from "react-native";
import {
  ShieldCheck,
  Fingerprint,
  KeyRound,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ChevronRight,
  Shield,
  Trash2,
} from "lucide-react-native";
import {
  checkBiometricCapability,
  isBiometricAuthEnabled,
  setBiometricAuthEnabled,
  promptBiometricAuth,
  getMpinStatus,
  disableMpin,
  BiometricCapability,
  MpinStatus,
} from "../services/security.service";
import { MpinModal } from "./MpinModal";

export const SecuritySettingsCard: React.FC = () => {
  const [capability, setCapability] = useState<BiometricCapability | null>(
    null,
  );
  const [bioEnabled, setBioEnabled] = useState(false);
  const [mpinStatus, setMpinStatus] = useState<MpinStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [togglingBio, setTogglingBio] = useState(false);

  const [mpinModalVisible, setMpinModalVisible] = useState(false);
  const [mpinModalMode, setMpinModalMode] = useState<"setup" | "change">(
    "setup",
  );

  const loadSecurityState = useCallback(async () => {
    try {
      const [cap, bio, mpin] = await Promise.all([
        checkBiometricCapability(),
        isBiometricAuthEnabled(),
        getMpinStatus(),
      ]);
      setCapability(cap);
      setBioEnabled(bio);
      setMpinStatus(mpin);
    } catch (e) {
      console.warn("Error loading security status:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSecurityState();
  }, [loadSecurityState]);

  const handleToggleBiometric = async (value: boolean) => {
    if (value) {
      if (!capability?.hasHardware) {
        Alert.alert(
          "Not Supported",
          "This device does not have biometric authentication hardware.",
        );
        return;
      }
      if (!capability?.isEnrolled) {
        Alert.alert(
          "Biometrics Not Enrolled",
          "Please register your fingerprint or face in your Android device Settings before enabling this feature.",
        );
        return;
      }

      setTogglingBio(true);
      try {
        const auth = await promptBiometricAuth(
          "Confirm your biometric identity to enable fast login",
        );
        if (auth.success) {
          await setBiometricAuthEnabled(true);
          setBioEnabled(true);
          Alert.alert(
            "Biometric Login Enabled",
            "You can now sign in using your biometric credentials.",
          );
        } else if (!auth.cancelled) {
          Alert.alert(
            "Verification Failed",
            auth.error || "Biometric authentication was not completed.",
          );
        }
      } catch (err: any) {
        Alert.alert("Error", err.message || "Unable to enable biometrics.");
      } finally {
        setTogglingBio(false);
      }
    } else {
      await setBiometricAuthEnabled(false);
      setBioEnabled(false);
      Alert.alert(
        "Biometric Login Disabled",
        "Biometric authentication has been turned off.",
      );
    }
  };

  const handleDisableMpin = () => {
    Alert.alert(
      "Disable MPIN?",
      "Are you sure you want to disable your 6-digit MPIN? You can re-enable it at any time.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disable",
          style: "destructive",
          onPress: async () => {
            await disableMpin();
            await loadSecurityState();
            Alert.alert(
              "MPIN Disabled",
              "Your MPIN has been removed from this device.",
            );
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.card}>
        <ActivityIndicator size="small" color="#5c0d38" />
      </View>
    );
  }

  const bioHardwareAvailable = capability?.hasHardware ?? false;
  const bioEnrolled = capability?.isEnrolled ?? false;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconCircle}>
          <Shield size={18} color="#5c0d38" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>Security & Fast Unlock</Text>
          <Text style={styles.cardSubtitle}>
            Hardware Keystore-Backed Authentication
          </Text>
        </View>
      </View>

      {/* ── BIOMETRIC LOGIN SECTION ── */}
      <View style={styles.sectionRow}>
        <View style={styles.sectionIconWrap}>
          <Fingerprint size={20} color="#5c0d38" />
        </View>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <View style={styles.labelRow}>
            <Text style={styles.sectionLabel}>Biometric Login</Text>
            <View
              style={[
                styles.badge,
                bioEnabled ? styles.badgeSuccess : styles.badgeMuted,
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  bioEnabled ? styles.badgeTextSuccess : styles.badgeTextMuted,
                ]}
              >
                {bioEnabled ? "Enabled" : "Disabled"}
              </Text>
            </View>
          </View>
          <Text style={styles.sectionDesc}>
            {!bioHardwareAvailable
              ? "No biometric hardware detected on this device."
              : !bioEnrolled
                ? "Hardware supported, but no credentials enrolled in Android settings."
                : `Use ${capability?.primaryTypeName || "biometrics"} for instant, secure sign-in.`}
          </Text>
        </View>

        {bioHardwareAvailable && bioEnrolled ? (
          togglingBio ? (
            <ActivityIndicator size="small" color="#5c0d38" />
          ) : (
            <Switch
              value={bioEnabled}
              onValueChange={handleToggleBiometric}
              trackColor={{ false: "#cbd5e1", true: "#fbcfe8" }}
              thumbColor={bioEnabled ? "#5c0d38" : "#f1f5f9"}
            />
          )
        ) : null}
      </View>

      <View style={styles.divider} />

      {/* ── 6-DIGIT MPIN SECTION ── */}
      <View style={styles.sectionRow}>
        <View style={styles.sectionIconWrap}>
          <KeyRound size={20} color="#5c0d38" />
        </View>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <View style={styles.labelRow}>
            <Text style={styles.sectionLabel}>6-Digit MPIN</Text>
            <View
              style={[
                styles.badge,
                mpinStatus?.isEnabled ? styles.badgeSuccess : styles.badgeMuted,
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  mpinStatus?.isEnabled
                    ? styles.badgeTextSuccess
                    : styles.badgeTextMuted,
                ]}
              >
                {mpinStatus?.isEnabled ? "Active" : "Not Set"}
              </Text>
            </View>
          </View>
          <Text style={styles.sectionDesc}>
            {mpinStatus?.isEnabled
              ? "Secure salted SHA-256 PIN configured in Android Keystore."
              : "Configure a personal 6-digit numeric PIN for quick offline-ready unlock."}
          </Text>
        </View>
      </View>

      {/* Lockout Notice if active */}
      {mpinStatus?.isLockedOut && (
        <View style={styles.lockoutBox}>
          <AlertTriangle size={15} color="#dc2626" />
          <Text style={styles.lockoutText}>
            MPIN temporarily locked due to failed attempts (
            {mpinStatus.remainingSeconds}s remaining).
          </Text>
        </View>
      )}

      {/* MPIN Action Buttons */}
      <View style={styles.btnRow}>
        {!mpinStatus?.isEnabled ? (
          <TouchableOpacity
            style={styles.actionBtnPrimary}
            onPress={() => {
              setMpinModalMode("setup");
              setMpinModalVisible(true);
            }}
            activeOpacity={0.8}
          >
            <Lock size={14} color="#ffffff" />
            <Text style={styles.actionBtnPrimaryText}>Set 6-Digit MPIN</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={styles.actionBtnSecondary}
              onPress={() => {
                setMpinModalMode("change");
                setMpinModalVisible(true);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.actionBtnSecondaryText}>Change MPIN</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtnDanger}
              onPress={handleDisableMpin}
              activeOpacity={0.8}
            >
              <Trash2 size={13} color="#dc2626" />
              <Text style={styles.actionBtnDangerText}>Disable</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <MpinModal
        visible={mpinModalVisible}
        mode={mpinModalMode}
        onClose={() => setMpinModalVisible(false)}
        onSuccess={() => loadSecurityState()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#fdf2f8",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#fbcfe8",
  },
  cardTitle: {
    fontSize: 14.5,
    fontWeight: "800",
    color: "#1e1b24",
  },
  cardSubtitle: {
    fontSize: 10.5,
    color: "#64748b",
    fontWeight: "500",
    marginTop: 1,
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
  },
  sectionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1e1b24",
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  badgeSuccess: {
    backgroundColor: "#dcfce7",
  },
  badgeTextSuccess: {
    fontSize: 10,
    fontWeight: "800",
    color: "#15803d",
  },
  badgeMuted: {
    backgroundColor: "#f1f5f9",
  },
  badgeTextMuted: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748b",
  },
  sectionDesc: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
    lineHeight: 15,
  },
  divider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginVertical: 10,
  },
  lockoutBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fca5a5",
    padding: 8,
    borderRadius: 8,
    marginTop: 6,
    marginBottom: 6,
  },
  lockoutText: {
    fontSize: 11,
    color: "#dc2626",
    fontWeight: "600",
    flex: 1,
  },
  btnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
    paddingLeft: 46,
  },
  actionBtnPrimary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#5c0d38",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionBtnPrimaryText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  actionBtnSecondary: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  actionBtnSecondaryText: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "700",
  },
  actionBtnDanger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#fef2f2",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  actionBtnDangerText: {
    color: "#dc2626",
    fontSize: 11.5,
    fontWeight: "700",
  },
});
