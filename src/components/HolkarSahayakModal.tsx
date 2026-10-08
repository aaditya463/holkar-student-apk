import React, { useState, useRef, useEffect } from "react";
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
} from "react-native";
import {
  X,
  Bot,
  Send,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Calendar,
  CreditCard,
  Award,
  FileText,
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
  Clock,
  RotateCcw,
  UserCheck,
} from "lucide-react-native";
import { useApp } from "../context/AppContext";
import { submitGrievance } from "../api/student.api";

interface Props {
  visible: boolean;
  onClose: () => void;
  onOpenGrievance?: () => void;
}

interface ActionChip {
  label: string;
  action: string;
  payload?: any;
}

interface TicketRecord {
  id: string;
  ticketNumber: string;
  category: string;
  department: string;
  title: string;
  description: string;
  status: "NEW" | "IN_PROGRESS" | "RESOLVED" | "ESCALATED";
  slaHours: number;
  slaExpiresAt: string;
  date: string;
}

interface SahayakMessage {
  id: string;
  sender: "bot" | "user";
  text: string;
  time: string;
  chips?: ActionChip[];
  cardType?:
    "attendance_card" | "fee_card" | "ticket_confirmation" | "exam_card";
  cardData?: any;
}

export const HolkarSahayakModal: React.FC<Props> = ({
  visible,
  onClose,
  onOpenGrievance,
}) => {
  const { student, attendance, fees, grievances, refreshData } = useApp();
  const [activeTab, setActiveTab] = useState<"chat" | "tickets">("chat");
  const [inputText, setInputText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Local state for tickets merged with backend grievances
  const [localTickets, setLocalTickets] = useState<TicketRecord[]>([]);

  // Initialize messages with personalized student context
  const [messages, setMessages] = useState<SahayakMessage[]>([
    {
      id: "m-init",
      sender: "bot",
      text: `Namaste ${student?.name || "Student"}! 🙏 Welcome to **Holkar Sahayak 🤖** — the Autonomous Student Helpdesk & Academic Redressal System of Government Model Autonomous Holkar Science College, Indore.\n\nYou are authenticated as an enrolled student of **${student?.programme || student?.course || "B.Sc Computer Science"}** (Semester ${student?.semester || "3"}), ${student?.department || "Department of Computer Science"}.\n\nHow may I assist you with your academics, attendance review, fee ledger, or institutional redressal today?`,
      time: "Just now",
      chips: [
        {
          label: "📊 Attendance Review & Shortage",
          action: "ATTENDANCE_CHECK",
        },
        { label: "💰 Fee Status & Reconcile", action: "FEE_CHECK" },
        { label: "📝 Examination & Results (ATKT)", action: "EXAM_CHECK" },
        {
          label: "👨‍🏫 Faculty & Classroom Grievance",
          action: "TEACHER_GRIEVANCE",
        },
        {
          label: "🏛️ Executive Escalation (Principal)",
          action: "PRINCIPAL_ESCALATE",
        },
        { label: "🎫 View My Registered Complaints", action: "VIEW_TICKETS" },
      ],
    },
  ]);

  // Sync grievances from backend into local tickets
  useEffect(() => {
    if (grievances && grievances.length > 0) {
      const mapped: TicketRecord[] = grievances.map((g: any, idx: number) => ({
        id: g.id || `g-${idx}`,
        ticketNumber:
          g.id && g.id.startsWith("HLK") ? g.id : `HLK-TKT-2026-${1000 + idx}`,
        category: g.category || "Academic Redressal",
        department: g.department || "Department HOD Office",
        title: g.title || "Student Inquiry",
        description:
          g.description || "Grievance submitted for administrative review.",
        status: (g.status as any) || "NEW",
        slaHours: 48,
        slaExpiresAt: "Within 48 Hours",
        date: g.date || "Recent",
      }));
      setLocalTickets(mapped);
    }
  }, [grievances]);

  const addBotMessage = (
    text: string,
    chips?: ActionChip[],
    cardType?: SahayakMessage["cardType"],
    cardData?: any,
  ) => {
    const botMsg: SahayakMessage = {
      id: `b-${Date.now()}-${messages.length + 1}`,
      sender: "bot",
      text,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      chips,
      cardType,
      cardData,
    };
    setMessages((prev) => [...prev, botMsg]);
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const addUserMessage = (text: string) => {
    const userMsg: SahayakMessage = {
      id: `u-${Date.now()}-${messages.length + 1}`,
      sender: "user",
      text,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // Direct Ticket Generation & Backend Sync
  const createAndRegisterTicket = async (
    category: string,
    department: string,
    title: string,
    description: string,
  ) => {
    setIsSubmitting(true);
    try {
      const res = await submitGrievance(title, description, category);
      const ticketData = res?.data || res;
      const ticketNo =
        ticketData?.ticketId ||
        ticketData?.ticket_id ||
        ticketData?.id ||
        `HLK-TKT-${Date.now()}`;

      const newTicket: TicketRecord = {
        id: ticketNo,
        ticketNumber: ticketNo,
        category: ticketData?.category || category,
        department: ticketData?.department || department,
        title,
        description,
        status: "NEW",
        slaHours: 48,
        slaExpiresAt: "Within 48 Hours (Statutory Guarantee)",
        date: "Today",
      };

      setLocalTickets((prev) => [newTicket, ...prev]);
      refreshData();
      setIsSubmitting(false);

      addBotMessage(
        `✅ **Official Grievance Ticket Registered: ${ticketNo}**\n\n• **Assigned Department:** ${department}\n• **Guaranteed SLA Resolution Window:** 48 Hours\n• **Redressal Officer:** Designated HOD / Authority\n\nYour complaint has been successfully registered with institutional records. You may monitor real-time review updates under the **'My Complaints'** tab.`,
        [
          { label: "🎫 View My Complaints", action: "VIEW_TICKETS" },
          { label: "↩️ Main Menu", action: "RESET_MENU" },
        ],
        "ticket_confirmation",
        newTicket,
      );
    } catch (e: any) {
      setIsSubmitting(false);
      addBotMessage(
        `❌ **Ticket Submission Failed**\n\n${e?.message || "Could not connect to the grievance redressal server. Please check your network connection and try again."}`,
        [{ label: "↩️ Main Menu", action: "RESET_MENU" }],
      );
    }
  };

  // Handle action chips
  const handleChipPress = (action: string, payload?: any) => {
    if (action === "VIEW_TICKETS") {
      setActiveTab("tickets");
      return;
    }

    if (action === "RESET_MENU") {
      addBotMessage(
        "How may I assist you with your academic inquiries or institutional services today? Please choose an option or type below:",
        [
          {
            label: "📊 Attendance Review & Shortage",
            action: "ATTENDANCE_CHECK",
          },
          { label: "💰 Fee Status & Reconcile", action: "FEE_CHECK" },
          { label: "📝 Examination & Results (ATKT)", action: "EXAM_CHECK" },
          {
            label: "👨‍🏫 Faculty & Classroom Grievance",
            action: "TEACHER_GRIEVANCE",
          },
          {
            label: "🏛️ Executive Escalation (Principal)",
            action: "PRINCIPAL_ESCALATE",
          },
          { label: "🎫 View My Registered Complaints", action: "VIEW_TICKETS" },
        ],
      );
      return;
    }

    if (action === "ATTENDANCE_CHECK") {
      addUserMessage("Check my verified attendance & shortage status 📊");
      const conducted = attendance?.conducted ?? 0;
      const present = attendance?.present ?? 0;
      const absent = attendance?.absent ?? 0;
      const att =
        conducted > 0
          ? (attendance?.overall ?? (present / conducted) * 100)
          : 0;
      const isShortage = conducted > 0 && att < 75;

      if (conducted === 0) {
        addBotMessage(
          `📊 **Attendance Records:**\n\n• **Status:** No Attendance Marked Yet\n• **Total Classes Conducted:** 0\n• **Lectures Attended:** 0\n• **Absences:** 0\n\nℹ️ **Academic Status:** No regular classroom attendance sessions have been logged yet for your registered courses this semester. Your verified stats will appear once subject teachers record daily lecture sessions.`,
          [
            {
              label: "📝 Raise Attendance Inquiry Ticket",
              action: "SUBMIT_ATTENDANCE_TICKET",
            },
            { label: "↩️ Main Menu", action: "RESET_MENU" },
          ],
          "attendance_card",
          { att: 0, conducted: 0, present: 0, absent: 0, isShortage: false },
        );
      } else {
        addBotMessage(
          `📊 **Autonomous Attendance Verification:**\n\n• **Verified Cumulative Attendance:** **${att.toFixed(1)}%**\n• **Total Classes Conducted:** ${conducted}\n• **Lectures Attended:** ${present}\n• **Absences:** ${absent}\n\n${
            isShortage
              ? "⚠️ **WARNING: SHORTAGE DETECTED (<75%).** Under Holkar Autonomous NEP Ordinance, you must maintain at least 75% attendance to receive your semester admit card. Would you like to file an official Attendance Review request?"
              : "✅ **ELIGIBLE FOR SEMESTER EXAMS (>75%).** Your attendance meets statutory autonomous requirements."
          }`,
          [
            {
              label: "📝 Raise Attendance Review Ticket",
              action: "SUBMIT_ATTENDANCE_TICKET",
            },
            { label: "↩️ Main Menu", action: "RESET_MENU" },
          ],
          "attendance_card",
          { att, conducted, present, absent, isShortage },
        );
      }
    } else if (action === "SUBMIT_ATTENDANCE_TICKET") {
      addUserMessage("Raise official attendance discrepancy review 📝");
      const studentIdDisplay =
        student?.rollNo || student?.enrollmentNo || "Student";
      createAndRegisterTicket(
        "Attendance Review & Correction",
        "Course Faculty & HOD Office",
        "Attendance Discrepancy & Biometric Review Request",
        `Candidate ${student?.name || "Student"} (Roll/Enr: ${studentIdDisplay}) requests verification of biometric / QR classroom attendance logs for recent lecture sessions.`,
      );
    } else if (action === "FEE_CHECK") {
      addUserMessage(
        "When is my next fee installment due & what is the status? 💰",
      );
      const total = fees?.summary?.totalCourseFee ?? 0;
      const paid = fees?.summary?.totalPaid ?? 0;
      const pending = fees?.summary?.pendingAmount ?? 0;
      const nextDue = fees?.summary?.nextDueDate || "—";

      addBotMessage(
        `💰 **Fee Clearance & Treasury Ledger Summary:**\n\n• **Total Course Fee:** ₹${total.toLocaleString("en-IN")}\n• **Amount Cleared:** ₹${paid.toLocaleString("en-IN")}\n• **Outstanding Balance:** ₹${pending.toLocaleString("en-IN")}\n• **Next Due Date:** ${nextDue}\n\nTreasury reconciliation is synced via MP Treasury & Autonomous College Gateway.`,
        [
          {
            label: "💳 Reconcile Fee Payment Ticket",
            action: "SUBMIT_FEE_TICKET",
          },
          { label: "↩️ Main Menu", action: "RESET_MENU" },
        ],
        "fee_card",
        { total, paid, pending, nextDue },
      );
    } else if (action === "SUBMIT_FEE_TICKET") {
      addUserMessage("Submit fee payment reconciliation inquiry 💳");
      const studentIdDisplay =
        student?.rollNo || student?.enrollmentNo || "Student";
      createAndRegisterTicket(
        "Accounts & Treasury Department",
        "Accounts Department (Room 12)",
        "Fee Payment Reconciliation & Receipt Synchronization",
        `Candidate ${student?.name || "Student"} (Roll/Enr: ${studentIdDisplay}) requests ledger reconciliation for fee transaction and official slip update.`,
      );
    } else if (action === "EXAM_CHECK") {
      addUserMessage("How do I apply for ATKT backlog or view exam rules? 📝");
      addBotMessage(
        `📝 **Autonomous Examination & ATKT Regulations:**\n\n• **ATKT Application Window:** Within 15 calendar days of official marksheet declaration.\n• **Examination Fee:** ₹500 per backlog theory paper.\n• **Admit Card Release:** 3 days prior to examination date.\n• **Evaluation Review / Copy Showing:** Applications open for 10 days post-results under Autonomous Regulation 14.`,
        [
          {
            label: "📝 Raise Examination Cell Ticket",
            action: "SUBMIT_EXAM_TICKET",
          },
          { label: "↩️ Main Menu", action: "RESET_MENU" },
        ],
        "exam_card",
      );
    } else if (action === "SUBMIT_EXAM_TICKET") {
      addUserMessage("Submit inquiry to Controller of Examinations 📝");
      const studentIdDisplay =
        student?.rollNo || student?.enrollmentNo || "Student";
      createAndRegisterTicket(
        "Controller of Examinations (CoE)",
        "Autonomous Examination Cell",
        "Examination Roster & Evaluation Inquiry",
        `Candidate ${student?.name || "Student"} (Roll/Enr: ${studentIdDisplay}) submits examination cell grievance regarding backlog / provisional grade verification.`,
      );
    } else if (action === "TEACHER_GRIEVANCE") {
      addUserMessage(
        "Report a grievance regarding faculty or classroom instruction 👨‍🏫",
      );
      addBotMessage(
        "Please confirm the submission of a formal statutory grievance regarding classroom instruction or departmental administration to the **Head of Department (HOD)**:",
        [
          {
            label: "📤 Confirm & Submit to HOD",
            action: "SUBMIT_TEACHER_TICKET",
          },
          { label: "↩️ Main Menu", action: "RESET_MENU" },
        ],
      );
    } else if (action === "SUBMIT_TEACHER_TICKET") {
      addUserMessage("Submitting direct complaint to Department HOD 📤");
      const studentIdDisplay =
        student?.rollNo || student?.enrollmentNo || "Student";
      createAndRegisterTicket(
        "Faculty & Classroom Instruction",
        `${student?.department || "Department"} HOD Office`,
        "Departmental Classroom Instruction & Academic Review",
        `Formal student grievance submitted by ${student?.name || "Student"} (Roll/Enr: ${studentIdDisplay}, ${student?.programme || "Undergraduate Programme"}) for statutory administrative review by Head of Department.`,
      );
    } else if (action === "PRINCIPAL_ESCALATE") {
      addUserMessage("Executive Escalation directly to Principal Office 🏛️");
      const studentIdDisplay =
        student?.rollNo || student?.enrollmentNo || "Student";
      createAndRegisterTicket(
        "Executive Escalation",
        "Executive Office of the Principal (Dr. Suresh T. Silawat)",
        "High-Priority Executive Redressal Escalation",
        `Urgent administrative redressal escalated directly to the Principal's Executive Office by ${student?.name || "Student"} (Roll/Enr: ${studentIdDisplay}).`,
      );
    }
  };

  // Freeform text NLP handling
  const handleSend = () => {
    const text = inputText.trim();
    if (!text) return;

    addUserMessage(text);
    setInputText("");

    const lower = text.toLowerCase();
    setTimeout(() => {
      if (
        lower.includes("attendance") ||
        lower.includes("shortage") ||
        lower.includes("absent") ||
        lower.includes("kam")
      ) {
        handleChipPress("ATTENDANCE_CHECK");
      } else if (
        lower.includes("fee") ||
        lower.includes("due") ||
        lower.includes("paid") ||
        lower.includes("paisa") ||
        lower.includes("installment")
      ) {
        handleChipPress("FEE_CHECK");
      } else if (
        lower.includes("exam") ||
        lower.includes("atkt") ||
        lower.includes("result") ||
        lower.includes("backlog") ||
        lower.includes("marksheet")
      ) {
        handleChipPress("EXAM_CHECK");
      } else if (
        lower.includes("teacher") ||
        lower.includes("faculty") ||
        lower.includes("professor") ||
        lower.includes("class") ||
        lower.includes("hod")
      ) {
        handleChipPress("TEACHER_GRIEVANCE");
      } else if (
        lower.includes("complaint") ||
        lower.includes("ticket") ||
        lower.includes("status") ||
        lower.includes("grievance")
      ) {
        setActiveTab("tickets");
      } else {
        addBotMessage(
          `Thank you for your inquiry: "${text}".\n\nPlease select the specific academic domain to route your request to the appropriate authority:`,
          [
            { label: "📊 Attendance Review", action: "ATTENDANCE_CHECK" },
            { label: "💰 Fees & Treasury", action: "FEE_CHECK" },
            { label: "📝 Examination & ATKT", action: "EXAM_CHECK" },
            { label: "👨‍🏫 Faculty & Classroom", action: "TEACHER_GRIEVANCE" },
            { label: "🏛️ Executive Escalation", action: "PRINCIPAL_ESCALATE" },
          ],
        );
      }
    }, 400);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <View style={styles.headerBadge}>
                <Sparkles size={11} color="#fef08a" />
                <Text style={styles.headerBadgeText}>
                  AI SMART HELPDESK &bull; 24x7
                </Text>
              </View>
              <Text style={styles.headerTitle}>Holkar Sahayak 🤖</Text>
              <Text style={styles.headerSubtitle}>
                Autonomous Student Helpdesk &bull; Verified Roll:{" "}
                {student?.rollNo || student?.enrollmentNo || "Student"}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* Dual Tab Segmented Control */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              onPress={() => setActiveTab("chat")}
              style={[
                styles.tabBtn,
                activeTab === "chat" && styles.tabBtnActive,
              ]}
            >
              <MessageSquare
                size={14}
                color={activeTab === "chat" ? "#5c0d38" : "#64748b"}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === "chat" && styles.tabBtnTextActive,
                ]}
              >
                Sahayak Helpdesk
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab("tickets")}
              style={[
                styles.tabBtn,
                activeTab === "tickets" && styles.tabBtnActive,
              ]}
            >
              <ShieldCheck
                size={14}
                color={activeTab === "tickets" ? "#5c0d38" : "#64748b"}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === "tickets" && styles.tabBtnTextActive,
                ]}
              >
                My Complaints ({localTickets.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* TAB 1: CHAT INTERFACE */}
          {activeTab === "chat" && (
            <View style={{ flex: 1 }}>
              {/* Messages Area */}
              <ScrollView
                ref={scrollViewRef}
                style={styles.chatScroll}
                contentContainerStyle={{ padding: 14, gap: 12 }}
                showsVerticalScrollIndicator={false}
              >
                {messages.map((m) => {
                  const isUser = m.sender === "user";
                  return (
                    <View key={m.id} style={{ marginBottom: 4 }}>
                      <View
                        style={[
                          styles.msgBubble,
                          isUser ? styles.userBubble : styles.botBubble,
                        ]}
                      >
                        <Text
                          style={[
                            styles.msgText,
                            isUser ? styles.userText : styles.botText,
                          ]}
                        >
                          {m.text}
                        </Text>
                        <Text
                          style={[
                            styles.msgTime,
                            isUser ? styles.userTime : styles.botTime,
                          ]}
                        >
                          {m.time}
                        </Text>
                      </View>

                      {/* Ticket Confirmation Card in Chat */}
                      {m.cardType === "ticket_confirmation" && m.cardData && (
                        <View style={styles.chatConfirmationCard}>
                          <View style={styles.confirmHeader}>
                            <CheckCircle2 size={16} color="#15803d" />
                            <Text style={styles.confirmHeaderTitle}>
                              Statutory Ticket Lodged
                            </Text>
                          </View>
                          <Text style={styles.confirmTicketNo}>
                            {m.cardData.ticketNumber}
                          </Text>
                          <Text style={styles.confirmDept}>
                            🏛️ Assigned: {m.cardData.department}
                          </Text>
                          <Text style={styles.confirmSla}>
                            ⏱️ SLA: Guaranteed 48-Hour Resolution
                          </Text>
                        </View>
                      )}

                      {/* Action Chips */}
                      {m.chips && m.chips.length > 0 && (
                        <View style={styles.chipsContainer}>
                          {m.chips.map((c, i) => (
                            <TouchableOpacity
                              key={i}
                              onPress={() =>
                                handleChipPress(c.action, c.payload)
                              }
                              style={styles.chipBtn}
                              activeOpacity={0.8}
                            >
                              <Text style={styles.chipText}>{c.label}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                  );
                })}

                {isSubmitting && (
                  <View style={styles.evaluatingBox}>
                    <ActivityIndicator size="small" color="#5c0d38" />
                    <Text style={styles.evaluatingText}>
                      Lodging official ticket with statutory SLA...
                    </Text>
                  </View>
                )}
              </ScrollView>

              {/* Freeform Input Bar */}
              <View style={styles.inputContainer}>
                <TextInput
                  value={inputText}
                  onChangeText={setInputText}
                  placeholder="Ask about attendance, fees, exams, or HOD..."
                  placeholderTextColor="#94a3b8"
                  style={styles.input}
                  onSubmitEditing={handleSend}
                  returnKeyType="send"
                />
                <TouchableOpacity
                  onPress={handleSend}
                  style={[
                    styles.sendBtn,
                    !inputText.trim() && { opacity: 0.5 },
                  ]}
                  disabled={!inputText.trim()}
                >
                  <Send size={16} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* TAB 2: MY REGISTERED TICKETS / COMPLAINTS */}
          {activeTab === "tickets" && (
            <ScrollView
              style={styles.ticketsScroll}
              contentContainerStyle={{ padding: 14, gap: 12 }}
            >
              <View style={styles.slaBanner}>
                <ShieldCheck size={18} color="#5c0d38" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.slaBannerTitle}>
                    Autonomous Redressal Charter
                  </Text>
                  <Text style={styles.slaBannerSub}>
                    Mandatory 48-Hour Resolution Guarantee across all
                    departments.
                  </Text>
                </View>
              </View>

              {localTickets.length > 0 ? (
                localTickets.map((t) => {
                  const isResolved = t.status === "RESOLVED";
                  const isProgress = t.status === "IN_PROGRESS";

                  return (
                    <View key={t.id} style={styles.ticketCard}>
                      <View style={styles.ticketCardTop}>
                        <Text style={styles.ticketIdText}>
                          #{t.ticketNumber}
                        </Text>
                        <View
                          style={[
                            styles.statusBadge,
                            isResolved && { backgroundColor: "#dcfce7" },
                            isProgress && { backgroundColor: "#e0f2fe" },
                            !isResolved &&
                              !isProgress && { backgroundColor: "#fef3c7" },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusBadgeText,
                              isResolved && { color: "#15803d" },
                              isProgress && { color: "#0369a1" },
                              !isResolved &&
                                !isProgress && { color: "#b45309" },
                            ]}
                          >
                            {isResolved
                              ? "✅ RESOLVED"
                              : isProgress
                                ? "🔄 IN PROGRESS"
                                : "⏳ PENDING REVIEW"}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.ticketTitle}>{t.title}</Text>
                      <Text style={styles.ticketDesc} numberOfLines={3}>
                        {t.description}
                      </Text>

                      <View style={styles.ticketMetaRow}>
                        <Text style={styles.ticketDeptText}>
                          🏛️ {t.department}
                        </Text>
                        <Text style={styles.ticketDateText}>{t.date}</Text>
                      </View>

                      <View style={styles.ticketSlaRow}>
                        <Clock size={12} color="#059669" />
                        <Text style={styles.ticketSlaText}>
                          SLA: 48-Hour Statutory Window
                        </Text>
                      </View>
                    </View>
                  );
                })
              ) : (
                <View style={styles.emptyTicketsBox}>
                  <ShieldCheck size={36} color="#cbd5e1" />
                  <Text style={styles.emptyTicketsTitle}>
                    No Registered Complaints
                  </Text>
                  <Text style={styles.emptyTicketsSub}>
                    You have not registered any active grievances. You can raise
                    a ticket anytime from the Sahayak Helpdesk chat!
                  </Text>
                  <TouchableOpacity
                    onPress={() => setActiveTab("chat")}
                    style={styles.backToChatBtn}
                  >
                    <Text style={styles.backToChatBtnText}>
                      Start Helpdesk Chat &rarr;
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheetContainer: {
    height: "88%",
    backgroundColor: "#f8fafc",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  header: {
    backgroundColor: "#5c0d38",
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  headerBadgeText: {
    color: "#fef08a",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
  },
  headerSubtitle: {
    color: "#fbcfe8",
    fontSize: 10.5,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabBtnActive: {
    borderBottomColor: "#5c0d38",
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
  },
  tabBtnTextActive: {
    color: "#5c0d38",
    fontWeight: "900",
  },
  chatScroll: {
    flex: 1,
  },
  msgBubble: {
    padding: 12,
    borderRadius: 14,
    maxWidth: "85%",
  },
  botBubble: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignSelf: "flex-start",
    borderBottomLeftRadius: 3,
  },
  userBubble: {
    backgroundColor: "#5c0d38",
    alignSelf: "flex-end",
    borderBottomRightRadius: 3,
  },
  msgText: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  botText: {
    color: "#1e293b",
  },
  userText: {
    color: "#ffffff",
  },
  msgTime: {
    fontSize: 9,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  botTime: {
    color: "#94a3b8",
  },
  userTime: {
    color: "#fbcfe8",
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  chipBtn: {
    backgroundColor: "#fdf2f8",
    borderWidth: 1,
    borderColor: "#fbcfe8",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  chipText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#5c0d38",
  },
  chatConfirmationCard: {
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#86efac",
    borderRadius: 10,
    padding: 10,
    marginTop: 6,
    alignSelf: "flex-start",
    width: "90%",
  },
  confirmHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  confirmHeaderTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#15803d",
  },
  confirmTicketNo: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0f172a",
  },
  confirmDept: {
    fontSize: 10.5,
    color: "#475569",
    marginTop: 2,
  },
  confirmSla: {
    fontSize: 10,
    fontWeight: "700",
    color: "#059669",
    marginTop: 2,
  },
  evaluatingBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#ffffff",
    padding: 10,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  evaluatingText: {
    fontSize: 11,
    color: "#5c0d38",
    fontWeight: "600",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  input: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 12.5,
    color: "#0f172a",
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#5c0d38",
    alignItems: "center",
    justifyContent: "center",
  },
  ticketsScroll: {
    flex: 1,
  },
  slaBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fdf2f8",
    borderWidth: 1,
    borderColor: "#fbcfe8",
    padding: 12,
    borderRadius: 12,
  },
  slaBannerTitle: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#5c0d38",
  },
  slaBannerSub: {
    fontSize: 10.5,
    color: "#64748b",
    marginTop: 1,
  },
  ticketCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 12,
  },
  ticketCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  ticketIdText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#5c0d38",
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 5,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: "800",
  },
  ticketTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 4,
  },
  ticketDesc: {
    fontSize: 11,
    color: "#475569",
    lineHeight: 16,
    marginBottom: 8,
  },
  ticketMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 6,
  },
  ticketDeptText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#334155",
  },
  ticketDateText: {
    fontSize: 10,
    color: "#94a3b8",
  },
  ticketSlaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  ticketSlaText: {
    fontSize: 9.5,
    fontWeight: "700",
    color: "#059669",
  },
  emptyTicketsBox: {
    alignItems: "center",
    padding: 30,
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginTop: 10,
  },
  emptyTicketsTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#334155",
    marginTop: 10,
  },
  emptyTicketsSub: {
    fontSize: 11,
    color: "#64748b",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 16,
  },
  backToChatBtn: {
    marginTop: 14,
    backgroundColor: "#5c0d38",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  backToChatBtnText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "800",
  },
});
