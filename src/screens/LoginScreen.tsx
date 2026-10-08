/**
 * LoginScreen.tsx — Holkar Science College Student Login
 * Hardened Authentication: Normal Password Login + Native Android Biometric + 6-Digit MPIN
 * Strictly validates against backend JWT session.
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import {
  GraduationCap,
  Eye,
  EyeOff,
  Lock,
  User,
  Fingerprint,
  KeyRound,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  RefreshCw,
} from "lucide-react-native";
import { useApp } from "../context/AppContext";
import {
  checkBiometricCapability,
  isBiometricAuthEnabled,
  setBiometricAuthEnabled,
  promptBiometricAuth,
  getMpinStatus,
  BiometricCapability,
  MpinStatus,
} from "../services/security.service";

export function LoginScreen() {
  const {
    login,
    authError,
    quickAuthAvailable,
    cachedUsername,
    unlockSessionWithBiometric,
    unlockSessionWithMpin,
    switchToPasswordLogin,
  } = useApp();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Security features state
  const [capability, setCapability] = useState<BiometricCapability | null>(
    null,
  );
  const [bioEnabled, setBioEnabled] = useState(false);
  const [mpinStatus, setMpinStatus] = useState<MpinStatus | null>(null);

  // MPIN entry state
  const [inputMpin, setInputMpin] = useState("");
  const [mpinLoading, setMpinLoading] = useState(false);
  const [mpinError, setMpinError] = useState<string | null>(null);

  const loadSecurityConfig = useCallback(async () => {
    try {
      const [cap, bio, mpin] = await Promise.all([
        checkBiometricCapability(),
        isBiometricAuthEnabled(),
        getMpinStatus(),
      ]);
      setCapability(cap);
      setBioEnabled(bio);
      setMpinStatus(mpin);
    } catch {}
  }, []);

  useEffect(() => {
    loadSecurityConfig();
  }, [loadSecurityConfig]);

  // Handle standard password login
  const handleLogin = async () => {
    setLocalError(null);
    if (!username.trim()) {
      setLocalError("Roll number / enrollment number required");
      return;
    }
    if (!password.trim()) {
      setLocalError("Password required");
      return;
    }
    setLoading(true);
    try {
      await login(username.trim(), password.trim());

      // After successful normal login: check if biometric can be offered
      try {
        const [cap, bio] = await Promise.all([
          checkBiometricCapability(),
          isBiometricAuthEnabled(),
        ]);
        if (cap.hasHardware && cap.isEnrolled && !bio) {
          Alert.alert(
            "Enable Biometric Login?",
            `Would you like to enable ${cap.primaryTypeName} for faster and more secure sign-in next time?`,
            [
              { text: "Not Now", style: "cancel" },
              {
                text: "Enable",
                onPress: async () => {
                  const bioRes = await promptBiometricAuth(
                    "Verify your identity to enable biometric sign-in",
                  );
                  if (bioRes.success) {
                    await setBiometricAuthEnabled(true);
                    Alert.alert(
                      "Biometric Login Enabled",
                      "You can now sign in using your biometric credentials.",
                    );
                  }
                },
              },
            ],
          );
        }
      } catch {}
    } catch (e: any) {
      setLocalError(e.message || "Login failed. Check credentials.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Biometric Quick Unlock
  const handleBiometricUnlock = async () => {
    setLocalError(null);
    setLoading(true);
    try {
      const res = await unlockSessionWithBiometric();
      if (!res.success && res.error && res.error !== "Cancelled") {
        setLocalError(res.error);
      }
    } catch (e: any) {
      setLocalError(e.message || "Biometric unlock failed.");
    } finally {
      setLoading(false);
    }
  };

  // Handle MPIN Quick Unlock
  const handleMpinUnlock = async () => {
    setMpinError(null);
    if (!inputMpin || inputMpin.length !== 6) {
      setMpinError("Please enter all 6 digits of your MPIN.");
      return;
    }

    setMpinLoading(true);
    try {
      const res = await unlockSessionWithMpin(inputMpin);
      if (!res.success) {
        setMpinError(res.error || "Incorrect MPIN.");
        setInputMpin("");
        await loadSecurityConfig();
      }
    } catch (e: any) {
      setMpinError(e.message || "MPIN authentication failed.");
      setInputMpin("");
    } finally {
      setMpinLoading(false);
    }
  };

  const handleForgotMpin = () => {
    Alert.alert(
      "Forgot MPIN?",
      "To reset your MPIN, please log in using your official Roll Number and Password. Once authenticated, you can set a new MPIN in the Security tab.",
      [
        {
          text: "Use Password Login",
          onPress: () => {
            switchToPasswordLogin();
          },
        },
        { text: "Cancel", style: "cancel" },
      ],
    );
  };

  const error = localError || authError;
  const isQuickMode =
    quickAuthAvailable && (bioEnabled || mpinStatus?.isEnabled);

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* College Branding */}
        <View style={styles.brandSection}>
          <View style={styles.logoWrap}>
            <Image
              source={require("../../assets/holkar_logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.collegeName}>Govt. Holkar Science College</Text>
          <Text style={styles.collegeSub}>
            MODEL AUTONOMOUS • INDORE (M.P.)
          </Text>
          <View style={styles.portalBadge}>
            <GraduationCap size={12} color="#5c0d38" />
            <Text style={styles.portalBadgeText}>Student ERP Portal</Text>
          </View>
        </View>

        {/* ── QUICK AUTHENTICATION MODE (BIOMETRIC / MPIN) ── */}
        {isQuickMode ? (
          <View style={styles.card}>
            <View style={styles.quickHeader}>
              <View style={styles.quickAvatar}>
                <User size={26} color="#5c0d38" />
              </View>
              <Text style={styles.cardTitle}>Welcome Back</Text>
              <Text style={styles.quickSubtitle}>
                {cachedUsername
                  ? `Signed in as ${cachedUsername}`
                  : "Quick Unlock Session"}
              </Text>
            </View>

            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>⚠️ {error}</Text>
              </View>
            ) : null}

            {/* MPIN Input Section if MPIN is enabled */}
            {mpinStatus?.isEnabled ? (
              <View style={styles.mpinSection}>
                <Text style={styles.mpinLabel}>Enter 6-Digit MPIN</Text>

                {mpinError ? (
                  <View style={styles.mpinErrorBanner}>
                    <AlertCircle size={14} color="#dc2626" />
                    <Text style={styles.mpinErrorText}>{mpinError}</Text>
                  </View>
                ) : null}

                {mpinStatus.isLockedOut ? (
                  <View style={styles.lockoutBox}>
                    <AlertCircle size={16} color="#dc2626" />
                    <Text style={styles.lockoutText}>
                      MPIN temporarily locked ({mpinStatus.remainingSeconds}s
                      remaining). Please use password sign-in.
                    </Text>
                  </View>
                ) : (
                  <>
                    <View style={styles.mpinInputWrap}>
                      <TextInput
                        style={styles.mpinInput}
                        value={inputMpin}
                        onChangeText={(val) => {
                          const cleaned = val.replace(/\D/g, "").slice(0, 6);
                          setInputMpin(cleaned);
                        }}
                        placeholder="••••••"
                        placeholderTextColor="#cbd5e1"
                        keyboardType="numeric"
                        secureTextEntry
                        maxLength={6}
                        autoFocus={!bioEnabled}
                        onSubmitEditing={handleMpinUnlock}
                      />
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.unlockBtn,
                        mpinLoading && styles.loginBtnDisabled,
                      ]}
                      onPress={handleMpinUnlock}
                      disabled={mpinLoading}
                      activeOpacity={0.85}
                    >
                      {mpinLoading ? (
                        <ActivityIndicator color="#ffffff" size="small" />
                      ) : (
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <KeyRound size={16} color="#ffffff" />
                          <Text style={styles.unlockBtnText}>
                            Unlock with MPIN
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </>
                )}

                <TouchableOpacity
                  onPress={handleForgotMpin}
                  style={styles.forgotMpinBtn}
                >
                  <Text style={styles.forgotMpinText}>
                    Forgot MPIN? Reset via Password
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {/* Biometric Quick Button if Biometric is enabled */}
            {bioEnabled ? (
              <View style={styles.biometricSection}>
                {mpinStatus?.isEnabled && (
                  <View style={styles.orDividerRow}>
                    <View style={styles.orLine} />
                    <Text style={styles.orText}>OR</Text>
                    <View style={styles.orLine} />
                  </View>
                )}

                <TouchableOpacity
                  style={styles.biometricBtn}
                  onPress={handleBiometricUnlock}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  <View style={styles.bioIconCircle}>
                    <Fingerprint size={28} color="#5c0d38" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bioBtnTitle}>
                      Unlock with {capability?.primaryTypeName || "Biometrics"}
                    </Text>
                    <Text style={styles.bioBtnSub}>
                      Tap to scan registered fingerprint or face
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            ) : null}

            {/* Switch to standard password login */}
            <TouchableOpacity
              style={styles.switchLoginBtn}
              onPress={switchToPasswordLogin}
              activeOpacity={0.8}
            >
              <Text style={styles.switchLoginText}>
                Sign in with Password / Other Account →
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* ── NORMAL PASSWORD LOGIN MODE ── */
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Student Login</Text>
            <Text style={styles.cardSub}>
              Use your Roll No. / Enrollment No. to sign in
            </Text>

            {/* Error Banner */}
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>⚠️ {error}</Text>
              </View>
            ) : null}

            {/* Username Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Roll No. / Enrollment No.</Text>
              <View style={styles.inputWrap}>
                <User size={16} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 24DS1001 or CLG-2026-0143"
                  placeholderTextColor="#cbd5e1"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Password</Text>
              <View style={styles.inputWrap}>
                <Lock size={16} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Enter your password"
                  placeholderTextColor="#cbd5e1"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPass}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity
                  onPress={() => setShowPass(!showPass)}
                  style={styles.eyeBtn}
                >
                  {showPass ? (
                    <EyeOff size={16} color="#94a3b8" />
                  ) : (
                    <Eye size={16} color="#94a3b8" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.loginBtnText}>Sign In to Portal →</Text>
              )}
            </TouchableOpacity>

            {/* Help Text */}
            <View style={styles.helpSection}>
              <Text style={styles.helpText}>
                Forgot password? Contact your Department HOD or IT Admin.
              </Text>
            </View>
          </View>
        )}

        {/* Security & Authentication Assurance Hint */}
        <View style={styles.demoHint}>
          <Text style={styles.demoTitle}>🔒 Hardened Security</Text>
          <Text style={styles.demoLine}>
            Your credentials and biometric sessions are protected by Android
            Keystore hardware cryptography.
          </Text>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Holkar ERP v1.0 • Secured by Keystore & JWT Authentication{"\n"}
          IT Department, Govt. Holkar Science College, Indore
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f8fafc" },
  scroll: {
    flexGrow: 1,
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  brandSection: { alignItems: "center", marginBottom: 24 },
  logoWrap: {
    width: 76,
    height: 76,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fbcfe8",
    ...(Platform.OS === "web"
      ? ({ boxShadow: "0px 4px 12px rgba(92, 13, 56, 0.12)" } as any)
      : {
          shadowColor: "#5c0d38",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 12,
        }),
    elevation: 4,
    marginBottom: 10,
  },
  logo: { width: 56, height: 56 },
  collegeName: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1e1b24",
    textAlign: "center",
  },
  collegeSub: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748b",
    letterSpacing: 0.5,
    marginTop: 2,
  },
  portalBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#fdf2f8",
    borderColor: "#fbcfe8",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 8,
  },
  portalBadgeText: { fontSize: 11, fontWeight: "800", color: "#5c0d38" },
  card: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1.5,
    borderColor: "#e8ecf2",
    ...(Platform.OS === "web"
      ? ({ boxShadow: "0px 8px 16px rgba(0, 0, 0, 0.06)" } as any)
      : {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.06,
          shadowRadius: 16,
        }),
    elevation: 4,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#1e1b24",
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
    marginBottom: 16,
  },
  quickHeader: { alignItems: "center", marginBottom: 18 },
  quickAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#fdf2f8",
    borderWidth: 2,
    borderColor: "#fbcfe8",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  quickSubtitle: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "600",
    marginTop: 2,
  },
  errorBanner: {
    backgroundColor: "#fef2f2",
    borderColor: "#fca5a5",
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  errorText: { fontSize: 12, color: "#dc2626", fontWeight: "700" },
  fieldGroup: { marginBottom: 14 },
  fieldLabel: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "#475569",
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    paddingHorizontal: 12,
    height: 46,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 13.5, color: "#1e1b24", fontWeight: "600" },
  eyeBtn: { padding: 4 },
  loginBtn: {
    backgroundColor: "#5c0d38",
    borderRadius: 14,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    ...(Platform.OS === "web"
      ? ({ boxShadow: "0px 6px 10px rgba(92, 13, 56, 0.3)" } as any)
      : {
          shadowColor: "#5c0d38",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.3,
          shadowRadius: 10,
        }),
    elevation: 5,
  },
  loginBtnDisabled: { opacity: 0.7 },
  loginBtnText: { color: "#ffffff", fontSize: 15, fontWeight: "900" },
  helpSection: { marginTop: 14, alignItems: "center" },
  helpText: {
    fontSize: 11,
    color: "#94a3b8",
    textAlign: "center",
    fontWeight: "500",
  },
  demoHint: {
    width: "100%",
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  demoTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#15803d",
    marginBottom: 4,
  },
  demoLine: { fontSize: 11, color: "#374151", lineHeight: 16 },
  footer: {
    fontSize: 10,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 16,
  },

  // Quick Unlock MPIN & Biometrics Styles
  mpinSection: { marginTop: 4, marginBottom: 12 },
  mpinLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#334155",
    textAlign: "center",
    marginBottom: 8,
  },
  mpinInputWrap: { alignItems: "center", marginBottom: 12 },
  mpinInput: {
    width: 180,
    height: 50,
    borderWidth: 2,
    borderColor: "#5c0d38",
    borderRadius: 14,
    backgroundColor: "#f8fafc",
    textAlign: "center",
    fontSize: 24,
    letterSpacing: 8,
    fontWeight: "900",
    color: "#1e1b24",
  },
  mpinErrorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fef2f2",
    borderColor: "#fca5a5",
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
    justifyContent: "center",
  },
  mpinErrorText: { fontSize: 11.5, color: "#dc2626", fontWeight: "700" },
  lockoutBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fef2f2",
    borderColor: "#fca5a5",
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  lockoutText: { fontSize: 11, color: "#dc2626", fontWeight: "700", flex: 1 },
  unlockBtn: {
    backgroundColor: "#5c0d38",
    borderRadius: 12,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  unlockBtnText: { color: "#ffffff", fontSize: 14, fontWeight: "800" },
  forgotMpinBtn: { marginTop: 10, alignItems: "center" },
  forgotMpinText: { fontSize: 11.5, color: "#5c0d38", fontWeight: "700" },

  biometricSection: { marginTop: 8 },
  orDividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 14,
    gap: 10,
  },
  orLine: { flex: 1, height: 1, backgroundColor: "#e2e8f0" },
  orText: { fontSize: 11, fontWeight: "800", color: "#94a3b8" },
  biometricBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fdf2f8",
    borderWidth: 1.5,
    borderColor: "#fbcfe8",
    borderRadius: 14,
    padding: 12,
  },
  bioIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#fbcfe8",
  },
  bioBtnTitle: { fontSize: 13.5, fontWeight: "800", color: "#5c0d38" },
  bioBtnSub: { fontSize: 11, color: "#64748b", marginTop: 1 },

  switchLoginBtn: {
    marginTop: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    alignItems: "center",
  },
  switchLoginText: { fontSize: 12, color: "#475569", fontWeight: "700" },
});
