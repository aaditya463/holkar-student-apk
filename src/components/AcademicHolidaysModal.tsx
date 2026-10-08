import React, { useState, useMemo, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from "react-native";
import {
  X,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  BookOpen,
  GraduationCap,
  Clock,
  ShieldCheck,
  Search,
  RefreshCw,
  Info,
  Layers,
  AlertCircle,
} from "lucide-react-native";
import { useApp } from "../context/AppContext";
import { getAcademicHolidays, ApiHolidayEvent } from "../api/student.api";

interface Props {
  visible: boolean;
  onClose: () => void;
}

// ─── Robust IST / Local Date Parser ──────────────────────────────────────────
export function parseEventDate(dateStr?: string | null): Date | null {
  if (!dateStr || typeof dateStr !== "string") return null;
  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  // Format 'DD-MMM-YYYY' like '02-Oct-2026'
  if (/^\d{2}-[A-Za-z]{3}-\d{4}$/.test(trimmed)) {
    const parts = trimmed.split("-");
    const day = parseInt(parts[0], 10);
    const months: Record<string, number> = {
      jan: 0,
      feb: 1,
      mar: 2,
      apr: 3,
      may: 4,
      jun: 5,
      jul: 6,
      aug: 7,
      sep: 8,
      oct: 9,
      nov: 10,
      dec: 11,
    };
    const monthKey = parts[1].toLowerCase();
    if (!(monthKey in months)) return null;
    const month = months[monthKey];
    const year = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    return isNaN(d.getTime()) ? null : d;
  }

  // Format 'YYYY-MM-DD'
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [y, m, d] = trimmed.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    return isNaN(dt.getTime()) ? null : dt;
  }

  // ISO string or timestamp
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    // If it has UTC offset near 18:30 (midnight IST), adjust +5.5 hours to align with IST date
    const istTime = d.getTime() + 5.5 * 60 * 60 * 1000;
    const istDate = new Date(istTime);
    return new Date(
      istDate.getUTCFullYear(),
      istDate.getUTCMonth(),
      istDate.getUTCDate(),
    );
  }

  return null;
}

function formatSyncTime(isoStr?: string | null): string {
  if (!isoStr) return "Previously synced";
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return "Cached";
    const day = String(d.getDate()).padStart(2, "0");
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const month = months[d.getMonth()];
    const hours = String(d.getHours()).padStart(2, "0");
    const mins = String(d.getMinutes()).padStart(2, "0");
    return `${day} ${month}, ${hours}:${mins}`;
  } catch {
    return "Cached";
  }
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function formatDateDisplay(d: Date): string {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const day = String(d.getDate()).padStart(2, "0");
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

function formatFullDate(d: Date): string {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${days[d.getDay()]}, ${String(d.getDate()).padStart(2, "0")} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

type EventCategory = "ALL" | "GOVT_HOLIDAY" | "BREAK" | "EXAM" | "EVENT";

export const AcademicHolidaysModal: React.FC<Props> = ({
  visible,
  onClose,
}) => {
  const {
    holidays: contextHolidays,
    lastSyncedAt,
    student,
    timetable,
  } = useApp();

  const [liveHolidays, setLiveHolidays] = useState<ApiHolidayEvent[]>([]);
  const [isLiveSuccess, setIsLiveSuccess] = useState(false);
  const [lastLiveFetchAt, setLastLiveFetchAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"calendar" | "agenda">(
    "calendar",
  );
  const [selectedCategory, setSelectedCategory] =
    useState<EventCategory>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Default viewed month & selected date (Defaults to current local date)
  const today = useMemo(() => new Date(), []);
  const [viewDate, setViewDate] = useState<Date>(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState<Date>(
    () => new Date(today.getFullYear(), today.getMonth(), today.getDate()),
  );

  // Fetch live from server on modal open
  const fetchLiveEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAcademicHolidays();
      if (Array.isArray(data)) {
        setLiveHolidays(data);
        setIsLiveSuccess(true);
        setLastLiveFetchAt(new Date().toISOString());
      }
    } catch (err: any) {
      console.warn("Academic calendar fetch notice:", err?.message || err);
      setIsLiveSuccess(false);
      setError(
        "Unable to load latest calendar events from college server. Tap retry.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchLiveEvents();
    }
  }, [visible]);

  const isUsingCache =
    !isLiveSuccess && liveHolidays.length === 0 && contextHolidays.length > 0;

  // Combined holiday list from live server API or cached context (single source of truth)
  const allEvents = useMemo(() => {
    if (isLiveSuccess && liveHolidays && liveHolidays.length > 0)
      return liveHolidays;
    if (contextHolidays && contextHolidays.length > 0) return contextHolidays;
    return liveHolidays.length > 0 ? liveHolidays : [];
  }, [isLiveSuccess, liveHolidays, contextHolidays]);

  // Normalize event category helper
  const categorizeEvent = (
    eventType: string,
  ): "GOVT_HOLIDAY" | "BREAK" | "EXAM" | "EVENT" => {
    const t = (eventType || "").toUpperCase();
    if (t === "GOVT_HOLIDAY" || t.includes("GAZETTED")) return "GOVT_HOLIDAY";
    if (
      t === "ACADEMIC_BREAK" ||
      t === "COLLEGE_HOLIDAY" ||
      t.includes("BREAK") ||
      t.includes("VACATION")
    )
      return "BREAK";
    if (t === "EXAMINATION" || t === "EXAM_WINDOW" || t.includes("EXAM"))
      return "EXAM";
    return "EVENT";
  };

  // Category Theme Meta
  const getCategoryMeta = (type: string) => {
    const cat = categorizeEvent(type);
    switch (cat) {
      case "GOVT_HOLIDAY":
        return {
          label: "GOVT GAZETTED",
          icon: "🏛️",
          bg: "#fff1f2",
          border: "#fecdd3",
          text: "#be123c",
          dot: "#e11d48",
        };
      case "BREAK":
        return {
          label: "COLLEGE RECESS",
          icon: "🎉",
          bg: "#f5f3ff",
          border: "#ddd6fe",
          text: "#6d28d9",
          dot: "#8b5cf6",
        };
      case "EXAM":
        return {
          label: "EXAMINATION",
          icon: "📝",
          bg: "#fffbeb",
          border: "#fde68a",
          text: "#b45309",
          dot: "#f59e0b",
        };
      case "EVENT":
      default:
        return {
          label: "COLLEGE EVENT",
          icon: "🎓",
          bg: "#f0f9ff",
          border: "#bae6fd",
          text: "#0369a1",
          dot: "#0284c7",
        };
    }
  };

  interface EnrichedHolidayEvent extends ApiHolidayEvent {
    start: Date;
    end: Date;
    meta: ReturnType<typeof getCategoryMeta>;
    category: "GOVT_HOLIDAY" | "BREAK" | "EXAM" | "EVENT";
  }

  // Enriched events with parsed dates (skips records with invalid start dates)
  const parsedEvents = useMemo(() => {
    const list: EnrichedHolidayEvent[] = [];
    for (const e of allEvents) {
      const start = parseEventDate(e.startDate);
      if (!start) {
        // Skip invalid event date — never substitute today's date
        continue;
      }
      const end = parseEventDate(e.endDate) || start;
      const meta = getCategoryMeta(e.eventType);
      list.push({
        ...e,
        start,
        end,
        meta,
        category: categorizeEvent(e.eventType),
      });
    }
    return list;
  }, [allEvents]);

  // Events filtered by user search and category
  const filteredEvents = useMemo(() => {
    return parsedEvents.filter((ev) => {
      const matchesCat =
        selectedCategory === "ALL" || ev.category === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        ev.title.toLowerCase().includes(q) ||
        (ev.description && ev.description.toLowerCase().includes(q));
      return matchesCat && matchesSearch;
    });
  }, [parsedEvents, selectedCategory, searchQuery]);

  // ─── Month Matrix Generation ──────────────────────────────────────────────
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const monthName = useMemo(() => {
    const names = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return names[month];
  }, [month]);

  // Calendar cells calculation
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: Array<{
      date: Date;
      isCurrentMonth: boolean;
      dayNumber: number;
      events: typeof parsedEvents;
    }> = [];

    // Previous month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, daysInPrevMonth - i);
      const evs = parsedEvents.filter((ev) => d >= ev.start && d <= ev.end);
      days.push({
        date: d,
        isCurrentMonth: false,
        dayNumber: daysInPrevMonth - i,
        events: evs,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const evs = parsedEvents.filter((ev) => d >= ev.start && d <= ev.end);
      days.push({
        date: d,
        isCurrentMonth: true,
        dayNumber: i,
        events: evs,
      });
    }

    // Next month padding to complete 35 or 42 grid cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      const evs = parsedEvents.filter((ev) => d >= ev.start && d <= ev.end);
      days.push({
        date: d,
        isCurrentMonth: false,
        dayNumber: i,
        events: evs,
      });
    }

    return days;
  }, [year, month, parsedEvents]);

  // Events on the currently selected date
  const selectedDateEvents = useMemo(() => {
    return parsedEvents.filter(
      (ev) => selectedDate >= ev.start && selectedDate <= ev.end,
    );
  }, [selectedDate, parsedEvents]);

  // Month Statistics Summary
  const monthStats = useMemo(() => {
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);

    const monthEvents = parsedEvents.filter(
      (ev) => ev.end >= startOfMonth && ev.start <= endOfMonth,
    );

    const holidays = monthEvents.filter(
      (e) => e.category === "GOVT_HOLIDAY",
    ).length;
    const recesses = monthEvents.filter((e) => e.category === "BREAK").length;
    const exams = monthEvents.filter((e) => e.category === "EXAM").length;

    return {
      totalEvents: monthEvents.length,
      holidays,
      recesses,
      exams,
    };
  }, [year, month, parsedEvents]);

  const sessionLabel = student?.academicYear
    ? `Session ${student.academicYear}`
    : student?.batch
      ? `Batch ${student.batch}`
      : "Academic Calendar";

  const statusLedgerLabel = isLiveSuccess
    ? "Live Academic Ledger"
    : isUsingCache
      ? `Cached (${formatSyncTime(lastSyncedAt || lastLiveFetchAt)})`
      : error
        ? "Calendar Service Unavailable"
        : "Official Academic Calendar";

  const hasTimetable = Boolean(timetable && Object.keys(timetable).length > 0);
  const timetableStatusText = hasTimetable ? "Available" : "Unavailable";
  const timetableStatusColor = hasTimetable ? "#059669" : "#64748b";

  const dayNames = useMemo(
    () => [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ],
    [],
  );
  const selectedDayName = dayNames[selectedDate.getDay()];

  const selectedDayClasses = useMemo(() => {
    if (!timetable) return [];
    const keys = Object.keys(timetable);
    const matchedKey = keys.find(
      (k) => k.toLowerCase() === selectedDayName.toLowerCase(),
    );
    return matchedKey ? (timetable as any)[matchedKey] || [] : [];
  }, [timetable, selectedDayName]);

  // Handlers for month navigation
  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const handleJumpToToday = () => {
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(
      new Date(today.getFullYear(), today.getMonth(), today.getDate()),
    );
  };

  // Status badge calculation for events
  const getEventTimeStatus = (start: Date, end: Date) => {
    const now = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const e = new Date(end.getFullYear(), end.getMonth(), end.getDate());

    if (now >= s && now <= e) {
      return { text: "Active Today", color: "#16a34a", bg: "#dcfce7" };
    }
    if (s > now) {
      const diffDays = Math.ceil(
        (s.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (diffDays === 1)
        return { text: "Tomorrow", color: "#0284c7", bg: "#e0f2fe" };
      return { text: `In ${diffDays} days`, color: "#6366f1", bg: "#e0e7ff" };
    }
    return { text: "Concluded", color: "#64748b", bg: "#f1f5f9" };
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
                <Calendar size={11} color="#ffffff" />
                <Text style={styles.headerBadgeText}>
                  GOVT. MODEL SCIENCE COLLEGE (AUTONOMOUS)
                </Text>
              </View>
              <Text style={styles.headerTitle}>
                Academic Calendar &amp; Schedule
              </Text>
              <Text style={styles.headerSubtitle}>
                {sessionLabel} &bull; {statusLedgerLabel}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              activeOpacity={0.8}
            >
              <X size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* View Switcher Bar & Refresh */}
          <View style={styles.viewSwitcherBar}>
            <View style={styles.switchPillGroup}>
              <TouchableOpacity
                onPress={() => setActiveView("calendar")}
                style={[
                  styles.switchPill,
                  activeView === "calendar" && styles.switchPillActive,
                ]}
                activeOpacity={0.8}
              >
                <Calendar
                  size={13}
                  color={activeView === "calendar" ? "#ffffff" : "#475569"}
                />
                <Text
                  style={[
                    styles.switchPillText,
                    activeView === "calendar" && styles.switchPillTextActive,
                  ]}
                >
                  Month Matrix
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveView("agenda")}
                style={[
                  styles.switchPill,
                  activeView === "agenda" && styles.switchPillActive,
                ]}
                activeOpacity={0.8}
              >
                <Layers
                  size={13}
                  color={activeView === "agenda" ? "#ffffff" : "#475569"}
                />
                <Text
                  style={[
                    styles.switchPillText,
                    activeView === "agenda" && styles.switchPillTextActive,
                  ]}
                >
                  Agenda Feed ({allEvents.length})
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={fetchLiveEvents}
              style={styles.refreshBtn}
              activeOpacity={0.8}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#5c0d38" />
              ) : (
                <RefreshCw size={14} color="#5c0d38" />
              )}
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={{ paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Error & Retry Banner if API failed */}
            {error && (
              <View style={styles.errorBanner}>
                <AlertCircle size={18} color="#dc2626" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.errorBannerTitle}>Server Notice</Text>
                  <Text style={styles.errorBannerSub}>{error}</Text>
                </View>
                <TouchableOpacity
                  onPress={fetchLiveEvents}
                  style={styles.retryBtn}
                  activeOpacity={0.8}
                >
                  <Text style={styles.retryBtnText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Empty State Banner if no events scheduled */}
            {!loading && !error && allEvents.length === 0 && (
              <View style={styles.globalEmptyState}>
                <Calendar size={42} color="#94a3b8" />
                <Text style={styles.globalEmptyTitle}>
                  No Academic Events Scheduled
                </Text>
                <Text style={styles.globalEmptySub}>
                  No official holidays, exam windows, or college events are
                  published yet for this session.
                </Text>
                <TouchableOpacity
                  onPress={fetchLiveEvents}
                  style={styles.refreshEmptyBtn}
                  activeOpacity={0.8}
                >
                  <RefreshCw size={14} color="#5c0d38" />
                  <Text style={styles.refreshEmptyBtnText}>
                    Refresh Calendar
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                VIEW 1: INTERACTIVE CALENDAR MONTH MATRIX
            ══════════════════════════════════════════════════════════════════ */}
            {activeView === "calendar" && (
              <View style={styles.calendarContainer}>
                {/* Month Navigator */}
                <View style={styles.monthNavigator}>
                  <TouchableOpacity
                    onPress={handlePrevMonth}
                    style={styles.navArrowBtn}
                    activeOpacity={0.7}
                  >
                    <ChevronLeft size={18} color="#1e293b" />
                  </TouchableOpacity>

                  <View style={styles.monthTitleBox}>
                    <Text style={styles.monthTitleText}>
                      {monthName} {year}
                    </Text>
                    {monthStats.totalEvents > 0 && (
                      <View style={styles.monthEventCountBadge}>
                        <Text style={styles.monthEventCountText}>
                          {monthStats.totalEvents}{" "}
                          {monthStats.totalEvents === 1 ? "Event" : "Events"}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <TouchableOpacity
                      onPress={handleJumpToToday}
                      style={styles.todayBtn}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.todayBtnText}>Today</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleNextMonth}
                      style={styles.navArrowBtn}
                      activeOpacity={0.7}
                    >
                      <ChevronRight size={18} color="#1e293b" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Month Statistics Ribbon */}
                <View style={styles.statsRibbon}>
                  <View style={styles.statBox}>
                    <Text style={styles.statVal}>{monthStats.holidays}</Text>
                    <Text style={styles.statLabel}>Holidays</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statBox}>
                    <Text style={styles.statVal}>{monthStats.recesses}</Text>
                    <Text style={styles.statLabel}>Recesses</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statBox}>
                    <Text style={styles.statVal}>{monthStats.exams}</Text>
                    <Text style={styles.statLabel}>Exams</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statBox}>
                    <Text
                      style={[
                        styles.statVal,
                        { color: timetableStatusColor, fontSize: 13 },
                      ]}
                    >
                      {timetableStatusText}
                    </Text>
                    <Text style={styles.statLabel}>Timetable</Text>
                  </View>
                </View>

                {/* Weekday Row */}
                <View style={styles.weekdaysRow}>
                  {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map(
                    (w, idx) => (
                      <Text
                        key={idx}
                        style={[
                          styles.weekdayText,
                          idx === 0 && styles.weekdaySunday,
                        ]}
                      >
                        {w}
                      </Text>
                    ),
                  )}
                </View>

                {/* 7-Column Grid Matrix */}
                <View style={styles.daysGrid}>
                  {calendarDays.map((cell, idx) => {
                    const isSelected = isSameDay(cell.date, selectedDate);
                    const isCurrentDay = isSameDay(cell.date, today);
                    const isSunday = cell.date.getDay() === 0;

                    return (
                      <TouchableOpacity
                        key={idx}
                        onPress={() => setSelectedDate(cell.date)}
                        style={[
                          styles.dayCell,
                          isSelected && styles.dayCellSelected,
                          !cell.isCurrentMonth && styles.dayCellOutside,
                          isCurrentDay &&
                            !isSelected &&
                            styles.dayCellTodayRing,
                        ]}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.dayNumberText,
                            isSelected && styles.dayNumberSelected,
                            !cell.isCurrentMonth && styles.dayNumberOutside,
                            isSunday &&
                              cell.isCurrentMonth &&
                              !isSelected &&
                              styles.dayNumberSunday,
                          ]}
                        >
                          {cell.dayNumber}
                        </Text>

                        {/* Event Indicator Dots */}
                        <View style={styles.dotsRow}>
                          {cell.events.slice(0, 3).map((ev, dIdx) => (
                            <View
                              key={dIdx}
                              style={[
                                styles.eventDot,
                                {
                                  backgroundColor: isSelected
                                    ? "#ffffff"
                                    : ev.meta.dot,
                                },
                              ]}
                            />
                          ))}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Legend Chips */}
                <View style={styles.legendRow}>
                  <View style={styles.legendItem}>
                    <View
                      style={[styles.legendDot, { backgroundColor: "#e11d48" }]}
                    />
                    <Text style={styles.legendText}>Govt Holiday</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View
                      style={[styles.legendDot, { backgroundColor: "#8b5cf6" }]}
                    />
                    <Text style={styles.legendText}>College Recess</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View
                      style={[styles.legendDot, { backgroundColor: "#f59e0b" }]}
                    />
                    <Text style={styles.legendText}>Examination</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View
                      style={[styles.legendDot, { backgroundColor: "#0284c7" }]}
                    />
                    <Text style={styles.legendText}>College Event</Text>
                  </View>
                </View>

                {/* Selected Day Schedule Card */}
                <View style={styles.selectedDayScheduleContainer}>
                  <View style={styles.selectedDayHeader}>
                    <View>
                      <Text style={styles.selectedDayLabel}>
                        SCHEDULE FOR SELECTED DATE
                      </Text>
                      <Text style={styles.selectedDayFullDate}>
                        {formatFullDate(selectedDate)}
                      </Text>
                    </View>
                    {isSameDay(selectedDate, today) && (
                      <View style={styles.todayChip}>
                        <Sparkles size={11} color="#059669" />
                        <Text style={styles.todayChipText}>TODAY</Text>
                      </View>
                    )}
                  </View>

                  {selectedDateEvents.length > 0 ? (
                    selectedDateEvents.map((ev, idx) => {
                      const timeStatus = getEventTimeStatus(ev.start, ev.end);
                      return (
                        <View
                          key={idx}
                          style={[
                            styles.eventScheduleCard,
                            {
                              borderColor: ev.meta.border,
                              backgroundColor: "#ffffff",
                            },
                          ]}
                        >
                          <View style={styles.cardHeaderRow}>
                            <View
                              style={[
                                styles.categoryBadge,
                                { backgroundColor: ev.meta.bg },
                              ]}
                            >
                              <Text style={styles.categoryBadgeIcon}>
                                {ev.meta.icon}
                              </Text>
                              <Text
                                style={[
                                  styles.categoryBadgeText,
                                  { color: ev.meta.text },
                                ]}
                              >
                                {ev.meta.label}
                              </Text>
                            </View>
                            <View
                              style={[
                                styles.timeStatusTag,
                                { backgroundColor: timeStatus.bg },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.timeStatusText,
                                  { color: timeStatus.color },
                                ]}
                              >
                                {timeStatus.text}
                              </Text>
                            </View>
                          </View>

                          <Text style={styles.eventTitle}>{ev.title}</Text>

                          <View style={styles.dateDurationRow}>
                            <Clock size={12} color="#64748b" />
                            <Text style={styles.dateDurationText}>
                              {isSameDay(ev.start, ev.end)
                                ? formatDateDisplay(ev.start)
                                : `${formatDateDisplay(ev.start)} – ${formatDateDisplay(ev.end)}`}
                            </Text>
                          </View>

                          {ev.description ? (
                            <Text style={styles.eventDesc}>
                              {ev.description}
                            </Text>
                          ) : null}
                        </View>
                      );
                    })
                  ) : (
                    <View style={{ gap: 8 }}>
                      <View style={styles.noEventDayCard}>
                        <View style={styles.noEventIconCircle}>
                          <Info size={18} color="#0369a1" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.noEventTitle}>
                            No Special Calendar Event
                          </Text>
                          <Text style={styles.noEventDesc}>
                            No institutional holiday or declared academic event
                            is published for this date.
                          </Text>
                        </View>
                      </View>

                      {/* Authoritative Scheduled Timetable Classes for this day if available */}
                      {selectedDayClasses.length > 0 ? (
                        <View style={styles.timetableSection}>
                          <Text style={styles.timetableSectionTitle}>
                            SCHEDULED TIMETABLE SESSIONS (
                            {selectedDayClasses.length})
                          </Text>
                          {selectedDayClasses.map((item: any, idx: number) => (
                            <View
                              key={item.id || idx}
                              style={styles.classItemCard}
                            >
                              <View style={styles.classTimeBadge}>
                                <Clock size={11} color="#5c0d38" />
                                <Text style={styles.classTimeText}>
                                  {item.time ||
                                    (item.startTime && item.endTime
                                      ? `${item.startTime} - ${item.endTime}`
                                      : "Time TBA")}
                                </Text>
                              </View>
                              <Text style={styles.classSubjectText}>
                                {item.subject ||
                                  item.subjectName ||
                                  "Scheduled Class"}
                              </Text>
                              <View style={styles.classMetaRow}>
                                <Text style={styles.classMetaText}>
                                  📍 {item.room || "Room TBA"}
                                </Text>
                                {item.teacher ? (
                                  <Text style={styles.classMetaText}>
                                    👨‍🏫 {item.teacher}
                                  </Text>
                                ) : null}
                              </View>
                            </View>
                          ))}
                        </View>
                      ) : (
                        <View style={styles.noClassesCard}>
                          <Text style={styles.noClassesText}>
                            No departmental lecture sessions scheduled in
                            timetable for this weekday. Attendance depends on
                            conducted class records.
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                VIEW 2: CHRONOLOGICAL AGENDA FEED
            ══════════════════════════════════════════════════════════════════ */}
            {activeView === "agenda" && (
              <View style={styles.agendaContainer}>
                {/* Search Bar */}
                <View style={styles.searchBar}>
                  <Search size={15} color="#64748b" />
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search holiday, exam, Diwali, Gandhi Jayanti..."
                    placeholderTextColor="#94a3b8"
                    style={styles.searchInput}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setSearchQuery("")}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <X size={14} color="#64748b" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Filter Pills */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.filterPillsRow}
                >
                  {[
                    {
                      id: "ALL" as EventCategory,
                      label: `All (${allEvents.length})`,
                    },
                    {
                      id: "GOVT_HOLIDAY" as EventCategory,
                      label: "🏛️ Gazetted",
                    },
                    { id: "BREAK" as EventCategory, label: "🎉 Recesses" },
                    { id: "EXAM" as EventCategory, label: "📝 Exams" },
                    { id: "EVENT" as EventCategory, label: "🎓 Events" },
                  ].map((tab) => (
                    <TouchableOpacity
                      key={tab.id}
                      onPress={() => setSelectedCategory(tab.id)}
                      style={[
                        styles.filterChip,
                        selectedCategory === tab.id && styles.filterChipActive,
                      ]}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          selectedCategory === tab.id &&
                            styles.filterChipTextActive,
                        ]}
                      >
                        {tab.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Agenda List */}
                {filteredEvents.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Calendar size={36} color="#94a3b8" />
                    <Text style={styles.emptyStateTitle}>No Events Found</Text>
                    <Text style={styles.emptyStateSub}>
                      No scheduled calendar entries match your criteria.
                    </Text>
                  </View>
                ) : (
                  filteredEvents.map((ev, idx) => {
                    const timeStatus = getEventTimeStatus(ev.start, ev.end);
                    const months = [
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
                    const days = [
                      "SUN",
                      "MON",
                      "TUE",
                      "WED",
                      "THU",
                      "FRI",
                      "SAT",
                    ];

                    return (
                      <View key={idx} style={styles.agendaCard}>
                        {/* Left Date Column */}
                        <View
                          style={[
                            styles.agendaDateTile,
                            { backgroundColor: ev.meta.bg },
                          ]}
                        >
                          <Text
                            style={[
                              styles.agendaDateDay,
                              { color: ev.meta.text },
                            ]}
                          >
                            {String(ev.start.getDate()).padStart(2, "0")}
                          </Text>
                          <Text
                            style={[
                              styles.agendaDateMonth,
                              { color: ev.meta.text },
                            ]}
                          >
                            {months[ev.start.getMonth()]}
                          </Text>
                          <Text style={styles.agendaDateWeekday}>
                            {days[ev.start.getDay()]}
                          </Text>
                        </View>

                        {/* Right Content */}
                        <View style={{ flex: 1 }}>
                          <View style={styles.cardHeaderRow}>
                            <View
                              style={[
                                styles.categoryBadge,
                                { backgroundColor: ev.meta.bg },
                              ]}
                            >
                              <Text style={styles.categoryBadgeIcon}>
                                {ev.meta.icon}
                              </Text>
                              <Text
                                style={[
                                  styles.categoryBadgeText,
                                  { color: ev.meta.text },
                                ]}
                              >
                                {ev.meta.label}
                              </Text>
                            </View>
                            <View
                              style={[
                                styles.timeStatusTag,
                                { backgroundColor: timeStatus.bg },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.timeStatusText,
                                  { color: timeStatus.color },
                                ]}
                              >
                                {timeStatus.text}
                              </Text>
                            </View>
                          </View>

                          <Text style={styles.eventTitle}>{ev.title}</Text>

                          <Text style={styles.agendaDurationText}>
                            {isSameDay(ev.start, ev.end)
                              ? formatDateDisplay(ev.start)
                              : `${formatDateDisplay(ev.start)} – ${formatDateDisplay(ev.end)}`}
                          </Text>

                          {ev.description ? (
                            <Text style={styles.agendaDescText}>
                              {ev.description}
                            </Text>
                          ) : null}
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            )}

            {/* Official Institutional Policy Notice Banner */}
            <View style={styles.policyBanner}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 4,
                }}
              >
                <ShieldCheck size={14} color="#5c0d38" />
                <Text style={styles.policyTitle}>
                  Institutional Policy Notice (Informational)
                </Text>
              </View>
              <Text style={styles.policyDesc}>
                Official gazetted holidays and declared autonomous breaks are
                strictly exempted from mandatory working days computation.
                Attendance eligibility for semester examinations is governed by
                statutory autonomous college ordinances.
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },
  sheetContainer: {
    backgroundColor: "#f8fafc",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "92%",
    overflow: "hidden",
  },
  header: {
    backgroundColor: "#5c0d38",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  headerBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#ffffff",
  },
  headerSubtitle: {
    fontSize: 11,
    color: "rgba(255,255,255,0.85)",
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
  viewSwitcherBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
  },
  switchPillGroup: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    padding: 3,
    gap: 4,
  },
  switchPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  switchPillActive: {
    backgroundColor: "#5c0d38",
  },
  switchPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
  },
  switchPillTextActive: {
    color: "#ffffff",
  },
  refreshBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: "#fdf2f7",
    borderWidth: 1,
    borderColor: "#fbcfe8",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollBody: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  /* Calendar Matrix Styles */
  calendarContainer: {},
  monthNavigator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 10,
  },
  monthTitleBox: {
    alignItems: "center",
  },
  monthTitleText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0f172a",
  },
  monthEventCountBadge: {
    backgroundColor: "#fdf2f7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  monthEventCountText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#5c0d38",
  },
  navArrowBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  todayBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  todayBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#0f172a",
  },
  statsRibbon: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginBottom: 12,
    justifyContent: "space-around",
    alignItems: "center",
  },
  statBox: {
    alignItems: "center",
    flex: 1,
  },
  statVal: {
    fontSize: 15,
    fontWeight: "900",
    color: "#5c0d38",
  },
  statLabel: {
    fontSize: 9.5,
    fontWeight: "700",
    color: "#64748b",
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: "#e2e8f0",
  },
  weekdaysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    marginBottom: 6,
  },
  weekdayText: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "800",
    color: "#64748b",
  },
  weekdaySunday: {
    color: "#dc2626",
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 6,
    marginBottom: 10,
  },
  dayCell: {
    width: "14.28%",
    aspectRatio: 1.05,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    paddingVertical: 3,
  },
  dayCellSelected: {
    backgroundColor: "#5c0d38",
  },
  dayCellOutside: {
    opacity: 0.35,
  },
  dayCellTodayRing: {
    borderWidth: 1.5,
    borderColor: "#5c0d38",
    backgroundColor: "#fdf2f7",
  },
  dayNumberText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1e293b",
  },
  dayNumberSelected: {
    color: "#ffffff",
    fontWeight: "900",
  },
  dayNumberOutside: {
    color: "#94a3b8",
  },
  dayNumberSunday: {
    color: "#dc2626",
  },
  dotsRow: {
    flexDirection: "row",
    gap: 3,
    marginTop: 2,
    height: 5,
    alignItems: "center",
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  legendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    backgroundColor: "#ffffff",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 12,
    justifyContent: "center",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#475569",
  },
  selectedDayScheduleContainer: {
    marginBottom: 12,
  },
  selectedDayHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  selectedDayLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: "#64748b",
    letterSpacing: 0.5,
  },
  selectedDayFullDate: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0f172a",
    marginTop: 1,
  },
  todayChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },
  todayChipText: {
    fontSize: 9.5,
    fontWeight: "900",
    color: "#059669",
  },
  eventScheduleCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  categoryBadgeIcon: {
    fontSize: 11,
  },
  categoryBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  timeStatusTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  timeStatusText: {
    fontSize: 9.5,
    fontWeight: "800",
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 4,
  },
  dateDurationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 6,
  },
  dateDurationText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748b",
  },
  eventDesc: {
    fontSize: 11.5,
    color: "#475569",
    lineHeight: 16,
  },
  noEventDayCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 14,
  },
  noEventIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#f0f9ff",
    alignItems: "center",
    justifyContent: "center",
  },
  noEventTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0369a1",
  },
  noEventDesc: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
    lineHeight: 15,
  },
  timetableSection: {
    marginTop: 4,
    gap: 6,
  },
  timetableSectionTitle: {
    fontSize: 10,
    fontWeight: "900",
    color: "#64748b",
    letterSpacing: 0.5,
    marginBottom: 2,
    paddingHorizontal: 2,
  },
  classItemCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 12,
  },
  classTimeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#fdf2f7",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 6,
  },
  classTimeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#5c0d38",
  },
  classSubjectText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 4,
  },
  classMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  classMetaText: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "600",
  },
  noClassesCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 12,
    marginTop: 2,
  },
  noClassesText: {
    fontSize: 11,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 15,
  },

  /* Agenda Feed Styles */
  agendaContainer: {},
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 12.5,
    color: "#0f172a",
    padding: 0,
  },
  filterPillsRow: {
    gap: 6,
    paddingBottom: 10,
  },
  filterChip: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  filterChipActive: {
    backgroundColor: "#5c0d38",
    borderColor: "#5c0d38",
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
  },
  filterChipTextActive: {
    color: "#ffffff",
  },
  agendaCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  agendaDateTile: {
    width: 52,
    height: 58,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  agendaDateDay: {
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 18,
  },
  agendaDateMonth: {
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  agendaDateWeekday: {
    fontSize: 8.5,
    fontWeight: "700",
    color: "#64748b",
    marginTop: 1,
  },
  agendaDurationText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0284c7",
    marginBottom: 3,
  },
  agendaDescText: {
    fontSize: 11,
    color: "#64748b",
    lineHeight: 15,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#475569",
    marginTop: 10,
  },
  emptyStateSub: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 2,
  },
  policyBanner: {
    backgroundColor: "#fdf2f7",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fbcfe8",
    padding: 12,
    marginTop: 6,
  },
  policyTitle: {
    fontSize: 11.5,
    fontWeight: "900",
    color: "#5c0d38",
  },
  policyDesc: {
    fontSize: 10.5,
    color: "#701a75",
    lineHeight: 15,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 10,
  },
  errorBannerTitle: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#dc2626",
  },
  errorBannerSub: {
    fontSize: 11,
    color: "#b91c1c",
    marginTop: 2,
    lineHeight: 14,
  },
  retryBtn: {
    backgroundColor: "#dc2626",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  retryBtnText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "800",
  },
  globalEmptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 20,
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 20,
  },
  globalEmptyTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1e293b",
    marginTop: 12,
  },
  globalEmptySub: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
    marginTop: 4,
    lineHeight: 16,
    maxWidth: 280,
  },
  refreshEmptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fdf2f8",
    borderWidth: 1,
    borderColor: "#fbcfe8",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 16,
  },
  refreshEmptyBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#5c0d38",
  },
});
