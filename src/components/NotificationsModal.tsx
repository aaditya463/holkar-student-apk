import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Share,
  Alert,
  Platform,
} from "react-native";
import {
  X,
  Check,
  Building2,
  GraduationCap,
  Layers,
  Sparkles,
  FileText,
  Download,
  Share2,
  ShieldCheck,
  Calendar,
  UserCheck,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  Bell,
} from "lucide-react-native";
import { NotificationItem } from "../types";
import { BASE_URL, getBaseUrl } from "../api/apiClient";
import { useApp } from "../context/AppContext";

interface Props {
  visible: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onOpenWarningNotice: () => void;
  onMarkAllRead?: () => void;
  onMarkNoticeRead?: (id: string) => void;
  onRefresh?: () => Promise<void> | void;
}

export const NotificationsModal: React.FC<Props> = ({
  visible,
  onClose,
  notifications,
  onOpenWarningNotice,
  onMarkAllRead,
  onMarkNoticeRead,
  onRefresh,
}) => {
  const { warningNotice } = useApp();
  const [activeTab, setActiveTab] = useState<"ALL" | "EXAM" | "GENERAL">("ALL");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [allRead, setAllRead] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<any | null>(null);

  const hasUnread = (notifications || []).some((n) => !n.read);
  const isEverythingRead = allRead || !hasUnread;

  // Map real backend notifications only - safe fallbacks for null fields
  const baseNotices =
    notifications && notifications.length > 0
      ? notifications.map((n, idx) => {
          const rawDate = n.date ? new Date(n.date) : new Date();
          const monthNames = [
            "JAN",
            "FEB",
            "MAR",
            "APR",
            "MAY",
            "JUN",
            "JUL",
            "AUG",
            "SEP",
            "OCT",
            "NOV",
            "DEC",
          ];
          const m = monthNames[rawDate.getMonth()] || "OCT";
          const d = String(rawDate.getDate()).padStart(2, "0");
          const y = String(rawDate.getFullYear());
          const rawTitle = n.title || "College Circular";

          return {
            id: n.id || `notif-${idx}`,
            title: rawTitle,
            message: n.message || "",
            category:
              n.category === "EXAM" ||
              rawTitle.toLowerCase().includes("exam") ||
              rawTitle.toLowerCase().includes("schedule")
                ? ("EXAM" as const)
                : ("GENERAL" as const),
            month: m,
            day: d,
            year: y,
            isNew: !isEverythingRead && !n.read,
            authorName: n.authorName || "Office of the Principal",
            attachmentUrl:
              n.attachmentUrl ||
              (n as any).attachment_url ||
              n.pdfUrl ||
              (n as any).pdf_url ||
              null,
            pdfUrl:
              n.pdfUrl ||
              (n as any).pdf_url ||
              n.attachmentUrl ||
              (n as any).attachment_url ||
              null,
            refNo: `HSC/NOTIF/2026/${String(100 + idx).padStart(3, "0")}`,
            priority: n.priority || "NORMAL",
          };
        })
      : [];

  const hasWarningNotice = Boolean(warningNotice?.hasActiveWarning);
  const mappedNotices =
    hasWarningNotice &&
    !baseNotices.some((n) => (n.title || "").toLowerCase().includes("warning"))
      ? [
          {
            id: "active-attendance-warning",
            title: `🚨 Attendance Shortage Notice (Stage #${warningNotice?.warningNoticeCount || 1})`,
            message: `Official Disciplinary Warning from Principal & HOD: Total attendance is below statutory CBCS limit. Consecutive absences: ${warningNotice?.consecutiveDays || 5} days. Tap to inspect official warning document.`,
            category: "GENERAL" as const,
            month: "OCT",
            day: String(new Date().getDate()).padStart(2, "0"),
            year: String(new Date().getFullYear()),
            isNew: true,
            authorName: "Office of the Principal & HOD",
            attachmentUrl: null,
            pdfUrl: null,
            refNo: `HSC/ABS-WARN/2026/${warningNotice?.warningNoticeCount || 1}`,
            priority: "URGENT",
          },
          ...baseNotices,
        ]
      : baseNotices;

  // Filter by active tab
  const totalCount = mappedNotices.length;
  const examCount = mappedNotices.filter((n) => n.category === "EXAM").length;
  const generalCount = mappedNotices.filter(
    (n) => n.category === "GENERAL",
  ).length;
  const filteredNotices =
    activeTab === "ALL"
      ? mappedNotices
      : mappedNotices.filter((n) => n.category === activeTab);

  const handleOpenPdf = async (url: string | null) => {
    if (!url) {
      Alert.alert(
        "Notice Document",
        "This circular was published as text broadcast.",
      );
      return;
    }

    let fullUrl = url;
    if (url.startsWith("/")) {
      const host = getBaseUrl().replace("/api/v1", "");
      fullUrl = `${host}${url}`;
    }

    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.open(fullUrl, "_blank");
      return;
    }

    try {
      const supported = await Linking.canOpenURL(fullUrl);
      if (supported) {
        await Linking.openURL(fullUrl);
      } else {
        await Linking.openURL(fullUrl).catch(() => {
          Alert.alert("Notice Document", `Opening PDF link:\n${fullUrl}`);
        });
      }
    } catch (e: any) {
      Alert.alert("Notice Link", `Link: ${fullUrl}`);
    }
  };

  const handleShareNotice = async (notice: any) => {
    try {
      await Share.share({
        title: notice.title,
        message: `GOVT. HOLKAR SCIENCE COLLEGE (AUTONOMOUS)\nOFFICIAL NOTICE: ${notice.title}\n\n${notice.message}\n\nIssued by: ${notice.authorName || "College Administration"}`,
      });
    } catch {}
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
          {/* Header Banner - Deep Royal Maroon */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconWrap}>
                <Building2 size={20} color="#f59e0b" />
              </View>
              <View style={styles.titleWrap}>
                <View style={styles.titleRow}>
                  <Text style={styles.headerTitle}>
                    Notice Board & Circulars
                  </Text>
                  {!isEverythingRead && <View style={styles.redDot} />}
                </View>
                <Text style={styles.headerSub}>
                  Govt. Model Autonomous Holkar Science College, Indore
                </Text>
              </View>
            </View>

            <View style={styles.headerRight}>
              {onRefresh && (
                <TouchableOpacity
                  onPress={async () => {
                    setIsRefreshing(true);
                    try {
                      await onRefresh();
                    } finally {
                      setIsRefreshing(false);
                    }
                  }}
                  disabled={isRefreshing}
                  style={styles.refreshBtn}
                  activeOpacity={0.8}
                >
                  <RefreshCw size={12} color="#ffffff" strokeWidth={2.5} />
                  <Text style={styles.refreshText}>
                    {isRefreshing ? "..." : "Refresh"}
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => {
                  setAllRead(true);
                  if (onMarkAllRead) {
                    onMarkAllRead();
                  }
                }}
                disabled={isEverythingRead}
                style={[
                  styles.markReadBtn,
                  isEverythingRead && {
                    opacity: 0.7,
                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                  },
                ]}
                activeOpacity={0.8}
              >
                <Check
                  size={13}
                  color={isEverythingRead ? "#86efac" : "#ffffff"}
                  strokeWidth={2.5}
                />
                <Text
                  style={[
                    styles.markReadText,
                    isEverythingRead && { color: "#86efac" },
                  ]}
                >
                  {isEverythingRead ? "All read ✓" : "Mark read"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onClose}
                style={styles.closeBtn}
                activeOpacity={0.8}
              >
                <X size={16} color="#ffffff" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Filter Tabs Bar */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              onPress={() => setActiveTab("ALL")}
              style={[
                styles.tabBtn,
                activeTab === "ALL" && styles.tabBtnActive,
              ]}
              activeOpacity={0.85}
            >
              <Bell
                size={14}
                color={activeTab === "ALL" ? "#f59e0b" : "#64748b"}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === "ALL" && styles.tabTextActive,
                ]}
              >
                All Circulars
              </Text>
              <View
                style={[
                  styles.tabBadge,
                  activeTab === "ALL" && styles.tabBadgeActive,
                ]}
              >
                <Text
                  style={[
                    styles.tabBadgeText,
                    activeTab === "ALL" && styles.tabBadgeTextActive,
                  ]}
                >
                  {totalCount}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab("EXAM")}
              style={[
                styles.tabBtn,
                activeTab === "EXAM" && styles.tabBtnActive,
              ]}
              activeOpacity={0.85}
            >
              <GraduationCap
                size={14}
                color={activeTab === "EXAM" ? "#f59e0b" : "#64748b"}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === "EXAM" && styles.tabTextActive,
                ]}
              >
                Examination
              </Text>
              <View
                style={[
                  styles.tabBadge,
                  activeTab === "EXAM" && styles.tabBadgeActive,
                ]}
              >
                <Text
                  style={[
                    styles.tabBadgeText,
                    activeTab === "EXAM" && styles.tabBadgeTextActive,
                  ]}
                >
                  {examCount}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab("GENERAL")}
              style={[
                styles.tabBtn,
                activeTab === "GENERAL" && styles.tabBtnActive,
              ]}
              activeOpacity={0.85}
            >
              <Layers
                size={14}
                color={activeTab === "GENERAL" ? "#f59e0b" : "#64748b"}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === "GENERAL" && styles.tabTextActive,
                ]}
              >
                General
              </Text>
              <View
                style={[
                  styles.tabBadge,
                  activeTab === "GENERAL" && styles.tabBadgeActive,
                ]}
              >
                <Text
                  style={[
                    styles.tabBadgeText,
                    activeTab === "GENERAL" && styles.tabBadgeTextActive,
                  ]}
                >
                  {generalCount}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Notice Cards List */}
          <ScrollView
            style={styles.scrollList}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {filteredNotices.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Bell size={42} color="#cbd5e1" style={{ marginBottom: 12 }} />
                <Text style={styles.emptyTitle}>No new notifications</Text>
                <Text style={styles.emptySub}>
                  Official circulars and notifications issued by the college
                  administration will appear here.
                </Text>
              </View>
            ) : (
              filteredNotices.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => {
                    setSelectedNotice(item);
                    if (onMarkNoticeRead && item.id) {
                      onMarkNoticeRead(item.id);
                    }
                  }}
                  style={styles.card}
                  activeOpacity={0.8}
                >
                  {/* Left Date Block */}
                  <View style={styles.dateBlock}>
                    <Text style={styles.dateMonth}>{item.month}</Text>
                    <Text style={styles.dateDay}>{item.day}</Text>
                    <Text style={styles.dateYear}>{item.year}</Text>
                  </View>

                  {/* Right Content */}
                  <View style={styles.cardContent}>
                    <View style={styles.cardTopRow}>
                      <Text style={styles.cardTitle}>{item.title}</Text>
                      {item.isNew && !isEverythingRead && (
                        <View style={styles.newBadge}>
                          <Sparkles size={10} color="#ffffff" />
                          <Text style={styles.newBadgeText}>New</Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.cardMessage} numberOfLines={2}>
                      {item.message}
                    </Text>

                    <View style={styles.cardFooter}>
                      <Text style={styles.cardAuthor}>
                        {item.authorName || "Holkar Autonomous Authority"}
                      </Text>

                      {item.attachmentUrl || item.pdfUrl ? (
                        <View style={styles.pdfChip}>
                          <FileText size={11} color="#059669" />
                          <Text style={styles.pdfChipText}>PDF Attached</Text>
                        </View>
                      ) : (
                        <View style={styles.viewDetailsRow}>
                          <Text style={styles.viewDetailsText}>
                            Tap to view
                          </Text>
                          <ChevronRight size={13} color="#0284c7" />
                        </View>
                      )}
                    </View>

                    {/* Warning letter shortcut if notice is attendance warning */}
                    {(item.title || "").toLowerCase().includes("warning") && (
                      <TouchableOpacity
                        onPress={() => {
                          onClose();
                          onOpenWarningNotice();
                        }}
                        style={styles.warningBtn}
                      >
                        <Text style={styles.warningBtnText}>
                          View Official Warning Letter (PDF) &rarr;
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </View>

      {/* ─── NOTICE DETAIL & PDF VIEWER MODAL ─── */}
      {selectedNotice && (
        <Modal
          visible={!!selectedNotice}
          animationType="fade"
          transparent
          onRequestClose={() => setSelectedNotice(null)}
        >
          <View style={styles.detailOverlay}>
            <View style={styles.detailContainer}>
              {/* College Official Header */}
              <View style={styles.detailHeader}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    flex: 1,
                  }}
                >
                  <Building2 size={22} color="#f59e0b" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailCollegeTitle}>
                      Govt. Holkar Science College
                    </Text>
                    <Text style={styles.detailCollegeSub}>
                      Model Autonomous Institution • Indore (M.P.)
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedNotice(null)}
                  style={styles.detailCloseBtn}
                >
                  <X size={18} color="#ffffff" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.detailBody}
                showsVerticalScrollIndicator={false}
              >
                {/* Reference & Date Meta Bar */}
                <View style={styles.detailMetaBar}>
                  <View>
                    <Text style={styles.metaLabel}>REF NUMBER</Text>
                    <Text style={styles.metaVal}>
                      {selectedNotice.refNo || "HSC/NOTIF/2026/091"}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.metaLabel}>ISSUE DATE</Text>
                    <Text style={styles.metaVal}>
                      {selectedNotice.day} {selectedNotice.month}{" "}
                      {selectedNotice.year}
                    </Text>
                  </View>
                </View>

                {/* Notice Title */}
                <Text style={styles.detailTitle}>{selectedNotice.title}</Text>

                {/* Notice Message Content */}
                <View style={styles.detailMessageCard}>
                  <Text style={styles.detailMessageText}>
                    {selectedNotice.message}
                  </Text>
                </View>

                {/* Authority Signature Block */}
                <View style={styles.authorityCard}>
                  <ShieldCheck size={18} color="#0284c7" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.authorityTitle}>
                      Issued By Official Authority
                    </Text>
                    <Text style={styles.authoritySub}>
                      {selectedNotice.authorName ||
                        "Office of the Principal & Central Administration"}
                    </Text>
                  </View>
                </View>

                {/* PDF Document Section */}
                {(selectedNotice.attachmentUrl || selectedNotice.pdfUrl) && (
                  <View style={styles.pdfSectionCard}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 10,
                      }}
                    >
                      <FileText size={20} color="#059669" />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.pdfSectionTitle}>
                          Official PDF Circular Attached
                        </Text>
                        <Text style={styles.pdfSectionSub}>
                          Signed institutional letterhead document
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() =>
                        handleOpenPdf(
                          selectedNotice.attachmentUrl || selectedNotice.pdfUrl,
                        )
                      }
                      style={styles.openPdfBtn}
                      activeOpacity={0.85}
                    >
                      <ExternalLink size={16} color="#ffffff" />
                      <Text style={styles.openPdfBtnText}>
                        Open & View Official PDF Notice
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Action Buttons */}
                <View style={styles.detailActionRow}>
                  <TouchableOpacity
                    onPress={() => handleShareNotice(selectedNotice)}
                    style={styles.shareNoticeBtn}
                    activeOpacity={0.8}
                  >
                    <Share2 size={15} color="#334155" />
                    <Text style={styles.shareNoticeBtnText}>Share Notice</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setSelectedNotice(null)}
                    style={styles.backBtn}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.backBtnText}>Back to Notices</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.72)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#f8fafc",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "88%",
    overflow: "hidden",
  },
  header: {
    backgroundColor: "#5c0d38",
    paddingTop: 18,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1.5,
    borderColor: "#f59e0b",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  titleWrap: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: 0.2,
  },
  redDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ef4444",
  },
  headerSub: {
    fontSize: 10.5,
    color: "rgba(255, 255, 255, 0.78)",
    marginTop: 2,
    fontWeight: "600",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  refreshBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  refreshText: {
    fontSize: 11,
    color: "#ffffff",
    fontWeight: "800",
  },
  markReadBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  markReadText: {
    fontSize: 11,
    color: "#ffffff",
    fontWeight: "700",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    gap: 10,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
    gap: 6,
  },
  tabBtnActive: {
    backgroundColor: "#5c0d38",
  },
  tabText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#64748b",
  },
  tabTextActive: {
    color: "#ffffff",
  },
  tabBadge: {
    backgroundColor: "#e2e8f0",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tabBadgeActive: {
    backgroundColor: "#f59e0b",
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#475569",
  },
  tabBadgeTextActive: {
    color: "#ffffff",
  },
  scrollList: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  dateBlock: {
    width: 50,
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    marginRight: 12,
  },
  dateMonth: {
    fontSize: 9,
    fontWeight: "900",
    color: "#5c0d38",
  },
  dateDay: {
    fontSize: 17,
    fontWeight: "900",
    color: "#0f172a",
    marginVertical: 1,
  },
  dateYear: {
    fontSize: 8.5,
    fontWeight: "700",
    color: "#94a3b8",
  },
  cardContent: {
    flex: 1,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 6,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0f172a",
    flex: 1,
    lineHeight: 17,
  },
  newBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#dc2626",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  newBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#ffffff",
  },
  cardMessage: {
    fontSize: 11.5,
    color: "#475569",
    lineHeight: 16,
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardAuthor: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748b",
  },
  pdfChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },
  pdfChipText: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "#059669",
  },
  viewDetailsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  viewDetailsText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#0284c7",
  },
  warningBtn: {
    marginTop: 8,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  warningBtnText: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#dc2626",
  },

  /* ─── Detail Modal Styles ─── */
  detailOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  detailContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    width: "100%",
    maxHeight: "85%",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  detailHeader: {
    backgroundColor: "#5c0d38",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  detailCollegeTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: 0.2,
  },
  detailCollegeSub: {
    fontSize: 9.5,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "600",
  },
  detailCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  detailBody: {
    padding: 18,
  },
  detailMetaBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f8fafc",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 14,
  },
  metaLabel: {
    fontSize: 8.5,
    fontWeight: "800",
    color: "#94a3b8",
    letterSpacing: 0.5,
  },
  metaVal: {
    fontSize: 11,
    fontWeight: "800",
    color: "#0f172a",
    marginTop: 2,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0f172a",
    lineHeight: 22,
    marginBottom: 12,
  },
  detailMessageCard: {
    backgroundColor: "#f8fafc",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 14,
  },
  detailMessageText: {
    fontSize: 13,
    color: "#334155",
    lineHeight: 20,
  },
  authorityCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#eff6ff",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    marginBottom: 14,
  },
  authorityTitle: {
    fontSize: 10,
    fontWeight: "800",
    color: "#1e40af",
    letterSpacing: 0.3,
  },
  authoritySub: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "#0f172a",
    marginTop: 1,
  },
  pdfSectionCard: {
    backgroundColor: "#ecfdf5",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#a7f3d0",
    marginBottom: 14,
  },
  pdfSectionTitle: {
    fontSize: 12.5,
    fontWeight: "900",
    color: "#065f46",
  },
  pdfSectionSub: {
    fontSize: 10,
    color: "#047857",
    marginTop: 1,
  },
  openPdfBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#059669",
    paddingVertical: 11,
    borderRadius: 10,
  },
  openPdfBtnText: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#ffffff",
  },
  detailActionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
    marginBottom: 20,
  },
  shareNoticeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#f1f5f9",
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  shareNoticeBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#334155",
  },
  backBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#5c0d38",
    paddingVertical: 11,
    borderRadius: 12,
  },
  backBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#ffffff",
  },
  emptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 19,
  },
});
