import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { db, auth } from "../services/firebase";
import { useTheme } from "../contexts/ThemeContext";
import { formatISODate, formatEventTime } from "../utils/dateUtils";
import {
  filterUpcomingEvents,
  filterPastEvents,
  isEventPast,
} from "../utils/eventFilters";
import { useFocusEffect } from "@react-navigation/native";

export default function MyEventsScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const [allEvents, setAllEvents] = useState([]);
  const [displayedEvents, setDisplayedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("joined"); // joined | hosting
  const [timeFilter, setTimeFilter] = useState("upcoming"); // upcoming | past
  const [currentUser, setCurrentUser] = useState(null);

  // Load current user data once on mount
  useEffect(() => {
    loadCurrentUser();
  }, []);

  // ✅ Reload events every time screen comes into focus (after editing, etc.)
  useFocusEffect(
    useCallback(() => {
      if (currentUser) {
        console.log("📱 MyEventsScreen focused - reloading events...");
        loadMyEvents();
      }
    }, [activeTab, currentUser])
  );

  useEffect(() => {
    applyTimeFilter();
  }, [timeFilter, allEvents]);

  const loadCurrentUser = async () => {
    try {
      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
      if (userDoc.exists()) {
        setCurrentUser(userDoc.data());
      }
    } catch (error) {
      console.error("Error loading current user:", error);
    }
  };

  const loadMyEvents = async () => {
    setLoading(true);
    try {
      let userEvents = [];

      if (activeTab === "hosting") {
        const hostingQuery = query(
          collection(db, "events"),
          where("creatorId", "==", auth.currentUser.uid)
        );
        const snapshot = await getDocs(hostingQuery);
        userEvents = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((event) => event.status !== "cancelled");
        console.log("📅 Hosting events:", userEvents.length);
      } else {
        const allEventsSnapshot = await getDocs(collection(db, "events"));

        userEvents = allEventsSnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((event) => {
            if (event.status === "cancelled") return false;

            let isAttending = false;

            if (Array.isArray(event.attendees)) {
              isAttending = event.attendees.some((attendee) => {
                if (
                  typeof attendee === "object" &&
                  attendee !== null &&
                  attendee.userId
                ) {
                  return attendee.userId === auth.currentUser.uid;
                }
                if (typeof attendee === "string") {
                  return attendee === auth.currentUser.uid;
                }
                return false;
              });
            }

            return isAttending && event.creatorId !== auth.currentUser.uid;
          });

        console.log("🎉 Joined events:", userEvents.length);
      }

      setAllEvents(userEvents);
    } catch (error) {
      console.error("Error loading events:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyTimeFilter = () => {
    if (timeFilter === "upcoming") {
      const upcoming = filterUpcomingEvents(allEvents);
      console.log("📅 Upcoming:", upcoming.length);
      setDisplayedEvents(upcoming);
    } else {
      const past = filterPastEvents(allEvents);
      console.log("📦 Past:", past.length);
      setDisplayedEvents(past);
    }
  };

  const canHost = currentUser?.role === "host" || currentUser?.role === "admin";

  const styles = createStyles(colors);

  const EventCard = ({ event }) => {
    const isPast = isEventPast(event.date);

    return (
      <TouchableOpacity
        style={styles.eventCard}
        onPress={() =>
          navigation.navigate("EventDetail", { eventId: event.id })
        }
        activeOpacity={0.8}
      >
        <View
          style={[
            styles.eventGlass,
            {
              backgroundColor: isPast
                ? `${colors.surfaceGlass}CC`
                : colors.surfaceGlass,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.eventHeader}>
            <View
              style={[
                styles.categoryBadge,
                {
                  backgroundColor: `${colors.primary}26`,
                  borderColor: `${colors.primary}4D`,
                },
              ]}
            >
              <Text style={[styles.categoryText, { color: colors.primary }]}>
                {event.category}
              </Text>
            </View>
            <Text style={[styles.eventDate, { color: colors.textSecondary }]}>
              {formatISODate(event.date)} •{" "}
              {formatEventTime(event.date, event.time)}
            </Text>
          </View>

          <Text
            style={[styles.eventTitle, { color: colors.text }]}
            numberOfLines={2}
          >
            {event.title}
          </Text>

          <View style={styles.eventMeta}>
            <Text style={styles.metaIcon}>📍</Text>
            <Text
              style={[styles.metaText, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {event.location}
            </Text>
          </View>

          <View style={styles.attendeesRow}>
            <Text
              style={[styles.attendeesText, { color: colors.textSecondary }]}
            >
              {Array.isArray(event.attendees) ? event.attendees.length : 0}/
              {event.maxPeople} people
            </Text>
            <View style={styles.badgesRow}>
              {event.status === "published" && !isPast && (
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>Active</Text>
                </View>
              )}
              {isPast && (
                <View style={styles.endedBadge}>
                  <Text style={styles.endedBadgeText}>Ended</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backButton, { color: colors.text }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          My Events
        </Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Main Tabs (Joined/Hosting) */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, !canHost && styles.tabFullWidth]}
          onPress={() => {
            setActiveTab("joined");
            setTimeFilter("upcoming");
          }}
        >
          <View
            style={[
              styles.tabGlass,
              {
                backgroundColor:
                  activeTab === "joined"
                    ? `${colors.primary}33`
                    : colors.surfaceGlass,
                borderColor:
                  activeTab === "joined"
                    ? `${colors.primary}66`
                    : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === "joined"
                      ? colors.primary
                      : colors.textSecondary,
                },
              ]}
            >
              Joined
            </Text>
          </View>
        </TouchableOpacity>

        {canHost && (
          <TouchableOpacity
            style={styles.tab}
            onPress={() => {
              setActiveTab("hosting");
              setTimeFilter("upcoming");
            }}
          >
            <View
              style={[
                styles.tabGlass,
                {
                  backgroundColor:
                    activeTab === "hosting"
                      ? `${colors.primary}33`
                      : colors.surfaceGlass,
                  borderColor:
                    activeTab === "hosting"
                      ? `${colors.primary}66`
                      : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color:
                      activeTab === "hosting"
                        ? colors.primary
                        : colors.textSecondary,
                  },
                ]}
              >
                Hosting
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Time Filter Tabs (Upcoming/Past) */}
      <View style={styles.timeFiltersContainer}>
        <TouchableOpacity
          style={styles.timeFilterTab}
          onPress={() => setTimeFilter("upcoming")}
        >
          <View
            style={[
              styles.timeFilterGlass,
              {
                backgroundColor:
                  timeFilter === "upcoming"
                    ? `${colors.primary}1A`
                    : "transparent",
                borderBottomWidth: 2,
                borderBottomColor:
                  timeFilter === "upcoming" ? colors.primary : "transparent",
              },
            ]}
          >
            <Text
              style={[
                styles.timeFilterText,
                {
                  color:
                    timeFilter === "upcoming"
                      ? colors.primary
                      : colors.textSecondary,
                },
              ]}
            >
              Upcoming
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.timeFilterTab}
          onPress={() => setTimeFilter("past")}
        >
          <View
            style={[
              styles.timeFilterGlass,
              {
                backgroundColor:
                  timeFilter === "past" ? `${colors.primary}1A` : "transparent",
                borderBottomWidth: 2,
                borderBottomColor:
                  timeFilter === "past" ? colors.primary : "transparent",
              },
            ]}
          >
            <Text
              style={[
                styles.timeFilterText,
                {
                  color:
                    timeFilter === "past"
                      ? colors.primary
                      : colors.textSecondary,
                },
              ]}
            >
              Past
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : displayedEvents.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>
            {timeFilter === "past"
              ? "📦"
              : activeTab === "joined"
              ? "🎯"
              : "🌟"}
          </Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {timeFilter === "past"
              ? "No past events"
              : activeTab === "joined"
              ? "No upcoming events joined"
              : "No upcoming events created"}
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {timeFilter === "past"
              ? "Events you've attended will appear here"
              : activeTab === "joined"
              ? "Explore events and join your first experience"
              : "Create an event to bring people together"}
          </Text>
          {timeFilter === "upcoming" && (
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => {
                if (activeTab === "joined") {
                  navigation.navigate("SearchEvents");
                } else {
                  navigation.navigate(canHost ? "CreateEvent" : "RequestHost");
                }
              }}
            >
              <View
                style={[
                  styles.emptyButtonGlass,
                  {
                    backgroundColor: `${colors.primary}33`,
                    borderColor: `${colors.primary}66`,
                  },
                ]}
              >
                <Text
                  style={[styles.emptyButtonText, { color: colors.primary }]}
                >
                  {activeTab === "joined"
                    ? "Explore Events"
                    : canHost
                    ? "Create Event"
                    : "Request Host"}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {displayedEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 24,
      paddingTop: 60,
      paddingBottom: 20,
    },
    backButton: { fontSize: 28 },
    headerTitle: { fontSize: 20, fontWeight: "700", letterSpacing: -0.3 },
    tabsContainer: {
      flexDirection: "row",
      paddingHorizontal: 24,
      marginBottom: 16,
      gap: 12,
    },
    tab: { flex: 1, borderRadius: 12, overflow: "hidden" },
    tabFullWidth: { flex: 1 },
    tabGlass: { borderWidth: 1, paddingVertical: 12, alignItems: "center" },
    tabText: { fontSize: 15, fontWeight: "600" },
    timeFiltersContainer: {
      flexDirection: "row",
      paddingHorizontal: 24,
      marginBottom: 20,
      gap: 0,
    },
    timeFilterTab: { flex: 1 },
    timeFilterGlass: {
      paddingVertical: 10,
      alignItems: "center",
    },
    timeFilterText: { fontSize: 14, fontWeight: "600" },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    scrollView: { flex: 1 },
    scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
    eventCard: { marginBottom: 16, borderRadius: 16, overflow: "hidden" },
    eventGlass: { borderWidth: 1, padding: 16 },
    eventHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    categoryBadge: {
      paddingVertical: 4,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
    },
    categoryText: { fontSize: 11, fontWeight: "600" },
    eventDate: { fontSize: 13, fontWeight: "600" },
    eventTitle: {
      fontSize: 17,
      fontWeight: "700",
      marginBottom: 10,
      letterSpacing: -0.3,
    },
    eventMeta: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
    metaIcon: { fontSize: 14, marginRight: 6 },
    metaText: { fontSize: 13, flex: 1 },
    attendeesRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    attendeesText: { fontSize: 13, fontWeight: "600" },
    badgesRow: { flexDirection: "row", gap: 8 },
    statusBadge: {
      backgroundColor: "rgba(166, 255, 150, 0.15)",
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: "rgba(166, 255, 150, 0.3)",
    },
    statusText: { fontSize: 11, fontWeight: "600", color: "#A6FF96" },
    endedBadge: {
      backgroundColor: "rgba(255, 159, 10, 0.15)",
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: "rgba(255, 159, 10, 0.3)",
    },
    endedBadgeText: { fontSize: 11, fontWeight: "600", color: "#FF9F0A" },
    emptyState: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 40,
    },
    emptyEmoji: { fontSize: 64, marginBottom: 20 },
    emptyTitle: {
      fontSize: 20,
      fontWeight: "700",
      marginBottom: 10,
      letterSpacing: -0.3,
    },
    emptyText: {
      fontSize: 14,
      textAlign: "center",
      lineHeight: 22,
      marginBottom: 28,
    },
    emptyButton: { borderRadius: 12, overflow: "hidden" },
    emptyButtonGlass: {
      borderWidth: 1,
      paddingVertical: 14,
      paddingHorizontal: 32,
    },
    emptyButtonText: { fontSize: 15, fontWeight: "600" },
  });
}
