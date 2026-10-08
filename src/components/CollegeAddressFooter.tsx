import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
  Alert,
} from "react-native";
import {
  MapPin,
  Calendar,
  Award,
  Phone,
  Navigation,
} from "lucide-react-native";

interface Props {
  onOpenDeptNavigator?: () => void;
}

export const CollegeAddressFooter: React.FC<Props> = ({
  onOpenDeptNavigator,
}) => {
  const handleCall = () => {
    Linking.openURL("tel:07312764027").catch(() => {
      Alert.alert("Holkar Science College", "Contact Helpline: 0731 276 4027");
    });
  };

  const handleOpenMaps = () => {
    const mapsUrl =
      "https://maps.google.com/?q=Govt.+Holkar+Science+College+Indore";
    Linking.openURL(mapsUrl).catch(() => {
      Alert.alert(
        "Holkar Campus",
        "AB Road, near Bhawarkua Square, Indore 452001",
      );
    });
  };

  return (
    <View style={styles.container}>
      {/* College Logo & Header */}
      <View style={styles.headerRow}>
        <Image
          source={require("../../assets/holkar_logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={styles.headerTextWrap}>
          <Text style={styles.collegeName}>
            Govt. Holkar (Model Autonomous) Science College
          </Text>
          <Text style={styles.sectionSubtitle}>
            OFFICIAL CAMPUS DIRECTORY & CONTACT INFORMATION
          </Text>
        </View>
      </View>

      {/* Campus Address Card */}
      <View style={styles.addressBox}>
        <MapPin size={18} color="#5c0d38" style={{ marginTop: 2 }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.addressLabel}>CAMPUS ADDRESS</Text>
          <Text style={styles.addressText}>
            AB Rd, near Bhawarkua Square, Janki Nagar, Indore, Madhya Pradesh
            452001
          </Text>
        </View>
      </View>

      {/* Founded Date & Autonomous Accreditation (Properly Sized to Prevent Overflow) */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Calendar size={16} color="#db2777" />
          <View style={{ flex: 1 }}>
            <Text style={styles.statLabel}>Founded Date</Text>
            <Text style={styles.statValue} numberOfLines={1}>
              10 June 1891
            </Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <Award size={16} color="#15803d" />
          <View style={{ flex: 1 }}>
            <Text style={styles.statLabel}>Accreditation</Text>
            <Text
              style={[styles.statValue, { color: "#15803d" }]}
              numberOfLines={1}
            >
              NAAC 'A++' Grade
            </Text>
          </View>
        </View>
      </View>

      {/* Quick Action Buttons */}
      <View style={styles.btnRow}>
        <TouchableOpacity onPress={handleCall} style={styles.callBtn}>
          <Phone size={15} color="#15803d" />
          <Text style={styles.callBtnText}>Call 0731 276 4027</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onOpenDeptNavigator} style={styles.deptBtn}>
          <Navigation size={15} color="#ffffff" />
          <Text style={styles.deptBtnText}>✈️ Dept Navigator</Text>
        </TouchableOpacity>
      </View>

      {/* Google Maps Button */}
      <TouchableOpacity onPress={handleOpenMaps} style={styles.mapsBtn}>
        <MapPin size={16} color="#0369a1" />
        <Text style={styles.mapsBtnText}>
          Open GPS Location on Google Maps 🗺️
        </Text>
      </TouchableOpacity>

      <Text style={styles.copyrightText}>
        © 2026 Govt. Holkar Science College Indore • Autonomous Higher Education
        Cell
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    marginTop: 8,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  logo: {
    width: 44,
    height: 44,
  },
  headerTextWrap: {
    flex: 1,
  },
  collegeName: {
    fontSize: 13.5,
    fontWeight: "800",
    color: "#1e1b24",
    lineHeight: 18,
  },
  sectionSubtitle: {
    fontSize: 9,
    fontWeight: "800",
    color: "#64748b",
    letterSpacing: 0.5,
    marginTop: 2,
  },
  addressBox: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  addressLabel: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "#5c0d38",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  addressText: {
    fontSize: 11,
    color: "#334155",
    lineHeight: 15,
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    overflow: "hidden",
  },
  statLabel: {
    fontSize: 9,
    color: "#64748b",
    fontWeight: "600",
  },
  statValue: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#1e1b24",
    marginTop: 1,
  },
  btnRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  callBtn: {
    flex: 1,
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  callBtnText: {
    color: "#166534",
    fontSize: 11.5,
    fontWeight: "800",
  },
  deptBtn: {
    flex: 1,
    backgroundColor: "#5c0d38",
    borderRadius: 10,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  deptBtnText: {
    color: "#ffffff",
    fontSize: 11.5,
    fontWeight: "800",
  },
  mapsBtn: {
    backgroundColor: "#f0f9ff",
    borderColor: "#bae6fd",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 8,
  },
  mapsBtnText: {
    color: "#0369a1",
    fontSize: 11.5,
    fontWeight: "800",
  },
  copyrightText: {
    fontSize: 8.5,
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 4,
  },
});
