import { apiRequest, getBaseUrl } from "../api/apiClient";
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
  Linking,
} from "react-native";
import {
  X,
  Download,
  FileText,
  Search,
  BookOpen,
  Layers,
  CheckCircle2,
} from "lucide-react-native";

interface PaperItem {
  id: string;
  title: string;
  subject: string;
  session: string;
  type: "PYQ" | "SYLLABUS";
  size: string;
  fileUrl?: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const PYQAndSyllabusModal: React.FC<Props> = ({ visible, onClose }) => {
  const [filterType, setFilterType] = useState<"ALL" | "PYQ" | "SYLLABUS">(
    "ALL",
  );
  const [search, setSearch] = useState("");
  const [papers, setPapers] = useState<PaperItem[]>([]);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (visible) {
      setLoading(true);
      Promise.allSettled([
        apiRequest<any>("/academics/pyq"),
        apiRequest<any>("/syllabus/my"),
      ])
        .then(([pyqRes, sylRes]) => {
          const loadedPapers: PaperItem[] = [];

          if (pyqRes.status === "fulfilled") {
            const list = pyqRes.value?.data || pyqRes.value || [];
            if (Array.isArray(list)) {
              list.forEach((item: any) => {
                loadedPapers.push({
                  id: String(item.id),
                  title: item.title,
                  subject:
                    `${item.subject_name || item.subject || ""} ${item.subject_code ? "(" + item.subject_code + ")" : ""}`.trim(),
                  session:
                    item.exam_session ||
                    item.academic_year ||
                    "Academic Session",
                  type: "PYQ",
                  size: item.file_size || "1.2 MB",
                  fileUrl: item.file_url || item.fileUrl || item.download_url,
                });
              });
            }
          }

          if (sylRes.status === "fulfilled") {
            const list = sylRes.value?.subjects || sylRes.value?.data || [];
            if (Array.isArray(list)) {
              list.forEach((item: any) => {
                loadedPapers.push({
                  id: String(item.id),
                  title:
                    item.title || `${item.className || "Semester"} Syllabus`,
                  subject: `${item.className || "Department of Science"} • Sem ${item.semesterNumber || 3}`,
                  session: "Current Academic Session",
                  type: "SYLLABUS",
                  size: item.fileSize
                    ? `${Math.round(item.fileSize / 1024)} KB`
                    : "1.5 MB",
                  fileUrl: item.fileUrl || item.file_url,
                });
              });
            }
          }

          setPapers(loadedPapers);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [visible]);

  const filtered = papers.filter((p) => {
    const matchesType = filterType === "ALL" || p.type === filterType;
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.subject.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleDownload = async (paper: PaperItem) => {
    if (!paper.fileUrl) {
      Alert.alert(
        "Document Unavailable",
        "This official document asset is not currently available for download.",
      );
      return;
    }

    try {
      const url = paper.fileUrl.startsWith("http")
        ? paper.fileUrl
        : `${getBaseUrl()}${paper.fileUrl.startsWith("/") ? "" : "/"}${paper.fileUrl}`;
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          "Document Unavailable",
          "Cannot open document URL on this device.",
        );
      }
    } catch {
      Alert.alert(
        "Document Unavailable",
        "Failed to retrieve published document from server.",
      );
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
              <Text style={styles.headerTitle}>
                PYQ Papers & Syllabus Vault
              </Text>
              <Text style={styles.headerSub}>
                Govt. Holkar Autonomous Question Bank & Schemes
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color="#1e1b24" />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchBar}>
            <Search size={16} color="#64748b" />
            <TextInput
              placeholder="Search PYQ papers, subjects, syllabus..."
              value={search}
              onChangeText={setSearch}
              style={styles.searchInput}
              placeholderTextColor="#94a3b8"
            />
          </View>

          {/* Filter Pills */}
          <View style={styles.filterRow}>
            {[
              { label: "All Resources", val: "ALL" },
              { label: "📄 Previous Year Papers (PYQ)", val: "PYQ" },
              { label: "📖 Course Syllabus", val: "SYLLABUS" },
            ].map((f) => (
              <TouchableOpacity
                key={f.val}
                onPress={() => setFilterType(f.val as any)}
                style={[
                  styles.filterPill,
                  filterType === f.val && styles.filterPillActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    filterType === f.val && styles.filterPillTextActive,
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
            {filtered.length === 0 ? (
              <View style={styles.emptyWrap}>
                <BookOpen
                  size={42}
                  color="#cbd5e1"
                  style={{ marginBottom: 12 }}
                />
                <Text style={styles.emptyTitle}>
                  {filterType === "SYLLABUS"
                    ? "Previous year syllabus is not available."
                    : filterType === "PYQ"
                      ? "No previous year question papers available."
                      : "No syllabus or question papers available."}
                </Text>
                <Text style={styles.emptySub}>
                  Official autonomous syllabus and curriculum schemes will be
                  available here once approved by the Board of Studies.
                </Text>
              </View>
            ) : (
              <View style={styles.list}>
                {filtered.map((item) => (
                  <View key={item.id} style={styles.card}>
                    <View
                      style={[
                        styles.iconWrap,
                        item.type === "PYQ"
                          ? { backgroundColor: "#fdf2f8" }
                          : { backgroundColor: "#f0fdf4" },
                      ]}
                    >
                      {item.type === "PYQ" ? (
                        <FileText size={20} color="#5c0d38" />
                      ) : (
                        <BookOpen size={20} color="#15803d" />
                      )}
                    </View>

                    <View style={{ flex: 1 }}>
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <View
                          style={[
                            styles.typeBadge,
                            item.type === "PYQ"
                              ? { backgroundColor: "#fee2e2" }
                              : { backgroundColor: "#dcfce7" },
                          ]}
                        >
                          <Text
                            style={[
                              styles.typeBadgeText,
                              item.type === "PYQ"
                                ? { color: "#dc2626" }
                                : { color: "#166534" },
                            ]}
                          >
                            {item.type}
                          </Text>
                        </View>
                        <Text style={styles.sizeText}>{item.size}</Text>
                      </View>

                      <Text style={styles.cardTitle}>{item.title}</Text>
                      <Text style={styles.cardMeta}>
                        {item.subject} • {item.session}
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => handleDownload(item)}
                      style={styles.downloadBtn}
                    >
                      <Download size={16} color="#5c0d38" />
                    </TouchableOpacity>
                  </View>
                ))}
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
    marginBottom: 10,
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
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 10,
    marginBottom: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 12,
    color: "#1e1b24",
  },
  filterRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  filterPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
  },
  filterPillActive: {
    backgroundColor: "#5c0d38",
  },
  filterPillText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#64748b",
  },
  filterPillTextActive: {
    color: "#ffffff",
  },
  list: {
    gap: 10,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: "900",
  },
  sizeText: {
    fontSize: 10,
    color: "#94a3b8",
    fontWeight: "600",
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1e1b24",
    marginTop: 3,
  },
  cardMeta: {
    fontSize: 10,
    color: "#64748b",
    marginTop: 2,
  },
  downloadBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fdf2f8",
    borderColor: "#fbcfe8",
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 6,
    textAlign: "center",
  },
  emptySub: {
    fontSize: 12,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 18,
  },
});
