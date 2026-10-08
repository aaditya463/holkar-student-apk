import React, { useState, useEffect } from "react";
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
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  X,
  Lock,
  Save,
  Phone,
  Mail,
  MapPin,
  Droplets,
  Shield,
  Ruler,
  Weight,
  UserCheck,
  AlertCircle,
} from "lucide-react-native";
import {
  ApiStudentProfile,
  updateStudentProfile,
  requestEmailChange,
} from "../api/student.api";

interface Props {
  visible: boolean;
  onClose: () => void;
  student: ApiStudentProfile | null;
  onProfileUpdated: () => void;
}

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export const EditProfileModal: React.FC<Props> = ({
  visible,
  onClose,
  student,
  onProfileUpdated,
}) => {
  // Editable Personal Fields
  const [bloodGroup, setBloodGroup] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [currentAddress, setCurrentAddress] = useState("");
  const [permanentAddress, setPermanentAddress] = useState("");
  const [savingPersonal, setSavingPersonal] = useState(false);

  // Verified Email Change Fields
  const [newEmail, setNewEmail] = useState("");
  const [requestingEmailChange, setRequestingEmailChange] = useState(false);

  useEffect(() => {
    if (student) {
      setBloodGroup(student.bloodGroup || "");
      setHeightCm(student.heightCm ? String(student.heightCm) : "");
      setWeightKg(student.weightKg ? String(student.weightKg) : "");
      setCurrentAddress(student.currentAddress || student.address || "");
      setPermanentAddress(student.permanentAddress || student.address || "");
      setNewEmail("");
    }
  }, [student, visible]);

  const handleSavePersonal = async () => {
    // Client-side Validations
    if (heightCm.trim()) {
      const h = Number(heightCm.trim());
      if (isNaN(h) || h < 50 || h > 250) {
        Alert.alert(
          "Validation Error",
          "Height must be a valid number between 50 cm and 250 cm.",
        );
        return;
      }
    }

    if (weightKg.trim()) {
      const w = Number(weightKg.trim());
      if (isNaN(w) || w < 20 || w > 250) {
        Alert.alert(
          "Validation Error",
          "Weight must be a valid number between 20 kg and 250 kg.",
        );
        return;
      }
    }

    if (
      bloodGroup.trim() &&
      !BLOOD_GROUPS.includes(bloodGroup.trim().toUpperCase())
    ) {
      Alert.alert(
        "Validation Error",
        "Please select a valid standard blood group.",
      );
      return;
    }

    try {
      setSavingPersonal(true);
      await updateStudentProfile({
        bloodGroup: bloodGroup.trim().toUpperCase() || undefined,
        heightCm: heightCm.trim() ? Number(heightCm.trim()) : null,
        weightKg: weightKg.trim() ? Number(weightKg.trim()) : null,
        currentAddress: currentAddress.trim() || undefined,
        permanentAddress: permanentAddress.trim() || undefined,
      });

      Alert.alert(
        "Personal Profile Updated ✓",
        "Your personal details (Blood Group, Height, Weight, and Addresses) have been saved to the Holkar ERP database.",
      );
      onProfileUpdated();
      onClose();
    } catch (err: any) {
      Alert.alert(
        "Update Failed",
        err?.message ||
          "Unable to update profile on the college server. Please try again.",
      );
    } finally {
      setSavingPersonal(false);
    }
  };

  const handleRequestEmailVerification = async () => {
    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed) {
      Alert.alert(
        "Validation Error",
        "Please enter the new Gmail / Email address you wish to link.",
      );
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      Alert.alert(
        "Validation Error",
        "Please enter a valid email format (e.g. yourname@gmail.com).",
      );
      return;
    }
    if (trimmed === (student?.email || "").trim().toLowerCase()) {
      Alert.alert(
        "Notice",
        "The entered email is already your current registered email.",
      );
      return;
    }

    try {
      setRequestingEmailChange(true);
      const res = await requestEmailChange(trimmed);
      Alert.alert(
        "Verification Code Sent",
        res?.message ||
          "A verification code has been dispatched to your new email address.",
      );
    } catch (err: any) {
      // Correctly surfaces 503 or error message from the backend
      Alert.alert(
        "Verification Unavailable",
        err?.message ||
          "Email verification service is currently unavailable. Please contact college administrative desk.",
      );
    } finally {
      setRequestingEmailChange(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Student Profile & Security</Text>
              <Text style={styles.headerSubtitle}>
                Autonomous Master Record & Account Details
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              disabled={savingPersonal || requestingEmailChange}
            >
              <X size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.body}
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            {/* ─── SECTION 1: READ-ONLY STATUTORY IDENTITY & ACADEMIC ─── */}
            <View style={styles.readOnlyNotice}>
              <Shield size={18} color="#0369a1" />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.noticeTitle}>
                  Section 1: Academic & Institutional Identity (Locked)
                </Text>
                <Text style={styles.noticeSub}>
                  Statutory academic and identity records are governed by the
                  Autonomous Examination Cell and Registrar Office. These fields
                  cannot be modified online to maintain institutional audit
                  integrity.
                </Text>
              </View>
            </View>

            <View style={styles.lockedCard}>
              <View style={styles.lockedRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.lockedLabel}>
                    STUDENT FULL LEGAL NAME
                  </Text>
                  <Text style={styles.lockedValue}>
                    {student?.name || "Not Provided"}
                  </Text>
                </View>
                <Lock size={14} color="#94a3b8" />
              </View>
              <View style={styles.divider} />

              <View style={styles.lockedRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.lockedLabel}>ROLL NUMBER</Text>
                  <Text style={styles.lockedValue}>
                    {student?.rollNo || "Not Provided"}
                  </Text>
                </View>
                <Lock size={14} color="#94a3b8" />
              </View>
              <View style={styles.divider} />

              <View style={styles.lockedRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.lockedLabel}>ENROLLMENT NUMBER</Text>
                  <Text style={styles.lockedValue}>
                    {student?.enrollmentNo || student?.id || "Not Provided"}
                  </Text>
                </View>
                <Lock size={14} color="#94a3b8" />
              </View>
              <View style={styles.divider} />

              <View style={styles.lockedRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.lockedLabel}>
                    STUDENT ID (ERP UUID / SYSTEM KEY)
                  </Text>
                  <Text style={styles.lockedValue}>
                    {student?.id || "Not Provided"}
                  </Text>
                </View>
                <Lock size={14} color="#94a3b8" />
              </View>
              <View style={styles.divider} />

              <View style={styles.lockedRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.lockedLabel}>PROGRAMME & BATCH</Text>
                  <Text style={styles.lockedValue}>
                    {student?.programme ||
                      student?.course ||
                      "Undergraduate Programme"}{" "}
                    {student?.academicYear || student?.batch
                      ? `(${student?.academicYear || student?.batch})`
                      : ""}
                  </Text>
                </View>
                <Lock size={14} color="#94a3b8" />
              </View>
              <View style={styles.divider} />

              <View style={styles.lockedRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.lockedLabel}>SEMESTER & SECTION</Text>
                  <Text style={styles.lockedValue}>
                    Semester {student?.semester || "1"} • Section{" "}
                    {student?.section || "A"}
                  </Text>
                </View>
                <Lock size={14} color="#94a3b8" />
              </View>
              <View style={styles.divider} />

              <View style={styles.lockedRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.lockedLabel}>ACADEMIC STATUS</Text>
                  <Text style={[styles.lockedValue, { color: "#15803d" }]}>
                    {student?.academicStatus || student?.status || "ACTIVE"}
                  </Text>
                </View>
                <Lock size={14} color="#94a3b8" />
              </View>
              <View style={styles.divider} />

              <View style={styles.lockedRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.lockedLabel}>MAJOR SUBJECT</Text>
                  <Text style={styles.lockedValue}>
                    {student?.majorSubject || "Not Assigned"}
                  </Text>
                </View>
                <Lock size={14} color="#94a3b8" />
              </View>
              <View style={styles.divider} />

              <View style={styles.lockedRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.lockedLabel}>MINOR SUBJECT</Text>
                  <Text style={styles.lockedValue}>
                    {student?.minorSubject || "Not Assigned"}
                  </Text>
                </View>
                <Lock size={14} color="#94a3b8" />
              </View>
              <View style={styles.divider} />

              <View style={styles.lockedRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.lockedLabel}>VOCATIONAL / ELECTIVE</Text>
                  <Text style={styles.lockedValue}>
                    {student?.vocationalSubject ||
                      student?.openElective ||
                      "Not Assigned"}
                  </Text>
                </View>
                <Lock size={14} color="#94a3b8" />
              </View>
              <View style={styles.divider} />

              <View style={styles.lockedRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.lockedLabel}>FATHER'S NAME</Text>
                  <Text style={styles.lockedValue}>
                    {student?.fatherName ||
                      student?.parentName ||
                      "Not Provided"}
                  </Text>
                </View>
                <Lock size={14} color="#94a3b8" />
              </View>
              <View style={styles.divider} />

              <View style={styles.lockedRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.lockedLabel}>MOTHER'S NAME</Text>
                  <Text style={styles.lockedValue}>
                    {student?.motherName || "Not Provided"}
                  </Text>
                </View>
                <Lock size={14} color="#94a3b8" />
              </View>
              <View style={styles.divider} />

              <View style={styles.lockedRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.lockedLabel}>DATE OF BIRTH & GENDER</Text>
                  <Text style={styles.lockedValue}>
                    {student?.dob || "Not Provided"}{" "}
                    {student?.gender ? `• Gender: ${student.gender}` : ""}
                  </Text>
                </View>
                <Lock size={14} color="#94a3b8" />
              </View>
            </View>

            {/* ─── SECTION 2: EDITABLE PERSONAL & PHYSICAL DETAILS ─── */}
            <View style={styles.sectionHeaderWrap}>
              <UserCheck size={18} color="#5c0d38" />
              <Text style={styles.sectionHeader}>
                Section 2: Editable Personal & Physical Details
              </Text>
            </View>
            <Text style={styles.sectionHelp}>
              You can directly update your physical metrics and residential
              addresses below.
            </Text>

            {/* Blood Group Picker */}
            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>
                <Droplets size={13} color="#dc2626" /> Blood Group
              </Text>
              <View style={styles.bloodGroupRow}>
                {BLOOD_GROUPS.map((bg) => (
                  <TouchableOpacity
                    key={bg}
                    style={[
                      styles.bloodGroupBtn,
                      bloodGroup === bg && styles.bloodGroupBtnActive,
                    ]}
                    onPress={() => setBloodGroup(bg)}
                    disabled={savingPersonal}
                  >
                    <Text
                      style={[
                        styles.bloodGroupText,
                        bloodGroup === bg && styles.bloodGroupTextActive,
                      ]}
                    >
                      {bg}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Height & Weight Row */}
            <View style={styles.rowTwoCols}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>
                  <Ruler size={13} color="#475569" /> Height (cm)
                </Text>
                <TextInput
                  style={styles.textInput}
                  value={heightCm}
                  onChangeText={setHeightCm}
                  placeholder="e.g. 175"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  editable={!savingPersonal}
                  maxLength={5}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>
                  <Weight size={13} color="#475569" /> Weight (kg)
                </Text>
                <TextInput
                  style={styles.textInput}
                  value={weightKg}
                  onChangeText={setWeightKg}
                  placeholder="e.g. 68.5"
                  placeholderTextColor="#94a3b8"
                  keyboardType="decimal-pad"
                  editable={!savingPersonal}
                  maxLength={5}
                />
              </View>
            </View>

            {/* Current Address */}
            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>
                <MapPin size={13} color="#475569" /> Current / Local Address
              </Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={currentAddress}
                onChangeText={setCurrentAddress}
                placeholder="Enter current residential address in Indore"
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={3}
                editable={!savingPersonal}
              />
            </View>

            {/* Permanent Address */}
            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>
                <MapPin size={13} color="#475569" /> Permanent Address
              </Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={permanentAddress}
                onChangeText={setPermanentAddress}
                placeholder="Enter permanent home address"
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={3}
                editable={!savingPersonal}
              />
            </View>

            {/* Save Personal Details Button */}
            <TouchableOpacity
              style={[styles.saveBtn, savingPersonal && styles.saveBtnDisabled]}
              onPress={handleSavePersonal}
              disabled={savingPersonal}
              activeOpacity={0.85}
            >
              {savingPersonal ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Save size={18} color="#ffffff" style={{ marginRight: 8 }} />
                  <Text style={styles.saveBtnText}>
                    Save Personal Information
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* ─── SECTION 3: VERIFIED CONTACT / GMAIL UPDATE ─── */}
            <View style={[styles.sectionHeaderWrap, { marginTop: 24 }]}>
              <Mail size={18} color="#5c0d38" />
              <Text style={styles.sectionHeader}>
                Section 3: Verified Contact / Gmail
              </Text>
            </View>
            <Text style={styles.sectionHelp}>
              Primary email address is tied to institutional security. Any
              modification requires verified dispatch to protect against
              unauthorized account takeovers.
            </Text>

            <View style={styles.verifiedEmailCard}>
              <View style={styles.emailRow}>
                <Text style={styles.emailLabel}>CURRENT GMAIL / EMAIL:</Text>
                <Text style={styles.emailValue}>
                  {student?.email || "Not Provided"}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.inputGroup}>
                <Text style={styles.fieldLabel}>New Gmail / Email Address</Text>
                <TextInput
                  style={styles.textInput}
                  value={newEmail}
                  onChangeText={setNewEmail}
                  placeholder="e.g. new.student@gmail.com"
                  placeholderTextColor="#94a3b8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!requestingEmailChange}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.verifyEmailBtn,
                  requestingEmailChange && styles.saveBtnDisabled,
                ]}
                onPress={handleRequestEmailVerification}
                disabled={requestingEmailChange}
                activeOpacity={0.85}
              >
                {requestingEmailChange ? (
                  <ActivityIndicator size="small" color="#5c0d38" />
                ) : (
                  <Text style={styles.verifyEmailBtnText}>
                    Request Email Verification Code
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "flex-end",
  },
  sheetContainer: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "92%",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#5c0d38",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#ffffff",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#fbcfe8",
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  body: {
    padding: 20,
  },
  readOnlyNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#f0f9ff",
    borderWidth: 1,
    borderColor: "#bae6fd",
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  noticeTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0369a1",
  },
  noticeSub: {
    fontSize: 11,
    color: "#0c4a6e",
    marginTop: 2,
    lineHeight: 15,
  },
  lockedCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 14,
    marginBottom: 16,
  },
  lockedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  lockedLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748b",
    letterSpacing: 0.5,
  },
  lockedValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1e293b",
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: 4,
  },
  sectionHeaderWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
    marginBottom: 4,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0f172a",
  },
  sectionHelp: {
    fontSize: 11,
    color: "#64748b",
    marginBottom: 12,
  },
  rowTwoCols: {
    flexDirection: "row",
    gap: 12,
  },
  inputGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: "#0f172a",
  },
  textArea: {
    minHeight: 65,
    textAlignVertical: "top",
  },
  bloodGroupRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  bloodGroupBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#ffffff",
  },
  bloodGroupBtnActive: {
    backgroundColor: "#5c0d38",
    borderColor: "#5c0d38",
  },
  bloodGroupText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
  },
  bloodGroupTextActive: {
    color: "#ffffff",
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#15803d",
    paddingVertical: 13,
    borderRadius: 10,
    marginTop: 4,
    marginBottom: 10,
    elevation: 2,
  },
  saveBtnDisabled: {
    backgroundColor: "#94a3b8",
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#ffffff",
  },
  verifiedEmailCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 14,
  },
  emailRow: {
    paddingVertical: 4,
  },
  emailLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748b",
  },
  emailValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a",
    marginTop: 2,
  },
  verifyEmailBtn: {
    borderWidth: 1.5,
    borderColor: "#5c0d38",
    backgroundColor: "#fdf2f8",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  verifyEmailBtnText: {
    color: "#5c0d38",
    fontSize: 13,
    fontWeight: "800",
  },
});
