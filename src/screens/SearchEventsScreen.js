import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";
import { useTheme } from "../contexts/ThemeContext";
import { formatISODate, formatEventTime } from "../utils/dateUtils";
import { EVENT_CATEGORIES, normalizeCategory } from "../utils/eventCategories";
import { filterUpcomingEvents, isEventPast } from "../utils/eventFilters";

export default function SearchEventsScreen({ navigation, route }) {
  const { colors, isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(
    route.params?.category || "All"
  );
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create categories array with "All" as an object to match the structure
  const categories = [{ id: "all", label: "All" }, ...EVENT_CATEGORIES];

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [searchQuery, selectedCategory, events]);

  const loadEvents = async () => {
    try {
      const eventsSnapshot = await getDocs(collection(db, "events"));
      const realEvents = eventsSnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((event) => event.status !== "cancelled"); // Filter out cancelled events

      // ✅ Only use real events from Firestore
      const allEvents = [...realEvents];

      // ✅ Filter only upcoming events or from today
      const upcomingEvents = filterUpcomingEvents(allEvents);

      console.log("📊 Total events:", allEvents.length);
      console.log("📅 Upcoming events:", upcomingEvents.length);
      console.log(
        "📦 Past events filtered out:",
        allEvents.length - upcomingEvents.length
      );

      setEvents(upcomingEvents);
      setFilteredEvents(upcomingEvents);
    } catch (error) {
      console.error("Error loading events:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterEvents = () => {
    let filtered = events;

    if (selectedCategory !== "All") {
      filtered = filtered.filter((event) => {
        // Normalize BOTH the event's category AND the selected category
        const normalizedEventCategory = normalizeCategory(event.category);
        const normalizedSelectedCategory = normalizeCategory(selectedCategory);
        return normalizedEventCategory === normalizedSelectedCategory;
      });
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(query) ||
          event.location.toLowerCase().includes(query) ||
          (event.category?.toLowerCase() || "").includes(query)
      );
    }

    setFilteredEvents(filtered);
  };

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
              backgroundColor: colors.surfaceGlass,
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
              {event.attendees?.length || 0}/
              {event.maxAttendees || event.maxPeople || 0} people
            </Text>
            <View style={styles.badgesRow}>
              {event.price === 0 && (
                <View style={styles.freeBadge}>
                  <Text style={styles.freeBadgeText}>FREE</Text>
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
          Explore Events
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: colors.surfaceGlass,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search events..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Category Filter */}
        <View style={styles.categorySection}>
          <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>
            Categories
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryChip}
                onPress={() => setSelectedCategory(category.label)}
              >
                <View
                  style={[
                    styles.categoryChipGlass,
                    {
                      backgroundColor:
                        selectedCategory === category.label
                          ? `${colors.primary}33`
                          : colors.surfaceGlass,
                      borderColor:
                        selectedCategory === category.label
                          ? `${colors.primary}66`
                          : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      {
                        color:
                          selectedCategory === category.label
                            ? colors.primary
                            : colors.text,
                      },
                    ]}
                  >
                    {category.emoji ? `${category.emoji} ` : ""}
                    {category.label}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Results Header */}
        <View style={styles.resultsHeader}>
          <Text style={[styles.resultsTitle, { color: colors.text }]}>
            {filteredEvents.length} Events Found
          </Text>
          <Text
            style={[styles.resultsSubtitle, { color: colors.textTertiary }]}
          >
            Upcoming events only
          </Text>
        </View>

        {/* Events List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : filteredEvents.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No upcoming events found
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Try adjusting your filters or search terms
            </Text>
          </View>
        ) : (
          filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))
        )}
      </ScrollView>
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
    scrollView: { flex: 1 },
    scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 14,
      marginBottom: 24,
    },
    searchIcon: { fontSize: 20, marginRight: 10 },
    searchInput: { flex: 1, fontSize: 15 },
    categorySection: { marginBottom: 24 },
    filterLabel: {
      fontSize: 13,
      fontWeight: "600",
      marginBottom: 12,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    categoriesScroll: { gap: 10 },
    categoryChip: { borderRadius: 12, overflow: "hidden" },
    categoryChipGlass: {
      borderWidth: 1,
      paddingVertical: 8,
      paddingHorizontal: 16,
    },
    categoryChipText: { fontSize: 14, fontWeight: "600" },
    resultsHeader: { marginBottom: 20 },
    resultsTitle: {
      fontSize: 18,
      fontWeight: "700",
      letterSpacing: -0.3,
      marginBottom: 4,
    },
    resultsSubtitle: {
      fontSize: 12,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    loadingContainer: { paddingVertical: 60, alignItems: "center" },
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
    freeBadge: {
      backgroundColor: "rgba(166, 255, 150, 0.15)",
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: "rgba(166, 255, 150, 0.3)",
    },
    freeBadgeText: { fontSize: 11, fontWeight: "600", color: "#A6FF96" },
    endedBadge: {
      backgroundColor: "rgba(255, 159, 10, 0.15)",
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: "rgba(255, 159, 10, 0.3)",
    },
    endedBadgeText: { fontSize: 11, fontWeight: "600", color: "#FF9F0A" },
    emptyState: { paddingVertical: 60, alignItems: "center" },
    emptyEmoji: { fontSize: 64, marginBottom: 20 },
    emptyTitle: {
      fontSize: 20,
      fontWeight: "700",
      marginBottom: 10,
      letterSpacing: -0.3,
    },
    emptyText: { fontSize: 14, textAlign: "center" },
  });
}
