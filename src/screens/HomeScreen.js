import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import { auth, db } from "../services/firebase";
import { useTheme } from "../contexts/ThemeContext";
import { useFocusEffect } from "@react-navigation/native";
import { EVENT_CATEGORIES } from "../utils/eventCategories";
import { getCategoryIcon } from "../components/Icon";
import {
  Bell,
  Search,
  Calendar,
  Sparkles,
  Crown,
  ChevronRight,
  Tent,
  Star,
} from "lucide-react-native";
import RatingModal from "../components/RatingModal";
import { getPendingRatings } from "../services/ratingService";
import { AvatarDisplay } from "../components/AvatarPicker";

export default function HomeScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const [user, setUser] = useState(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [pendingHostRequests, setPendingHostRequests] = useState(0);

  // Rating state
  const [pendingRatingEvents, setPendingRatingEvents] = useState([]);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (!auth.currentUser) return;

    const notifQuery = query(
      collection(db, "notifications"),
      where("userId", "==", auth.currentUser.uid),
      where("read", "==", false)
    );

    const unsubscribe = onSnapshot(
      notifQuery,
      (snapshot) => {
        let totalCount = 0;
        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.type === "event_messages" && data.unreadCount) {
            totalCount += data.unreadCount;
          } else {
            totalCount += 1;
          }
        });
        setUnreadNotifications(totalCount);
      },
      (error) => {
        console.error("Error in notifications listener:", error);
      }
    );

    return () => unsubscribe();
  }, [auth.currentUser?.uid]);

  useFocusEffect(
    useCallback(() => {
      if (user?.role === "admin") {
        loadPendingHostRequests();
      }
      loadPendingRatings();
      // Reload user to get updated avatar
      loadUser();
    }, [user?.role])
  );

  const loadUser = async () => {
    try {
      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUser(userData);
        if (userData.role === "admin") {
          loadPendingHostRequests();
        }
      }
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const loadPendingHostRequests = async () => {
    try {
      const requestsQuery = query(
        collection(db, "hostRequests"),
        where("status", "==", "pending")
      );
      const snapshot = await getDocs(requestsQuery);
      setPendingHostRequests(snapshot.size);
    } catch (error) {
      console.error("Error loading host requests:", error);
    }
  };

  const loadPendingRatings = async () => {
    try {
      const events = await getPendingRatings();
      setPendingRatingEvents(events);
    } catch (error) {
      console.error("Error loading pending ratings:", error);
    }
  };

  const handleRateEvent = (event) => {
    setSelectedEvent(event);
    setShowRatingModal(true);
  };

  const handleRatingSuccess = () => {
    setPendingRatingEvents((prev) =>
      prev.filter((e) => e.id !== selectedEvent.id)
    );
    setShowRatingModal(false);
    setSelectedEvent(null);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const getUserDisplayName = () => {
    if (!user) return "Friend";
    return user.fullName || user.name || "Friend";
  };

  const getUserAvatar = () => {
    if (!user) return { type: "emoji", value: "😊" };

    // Handle new format (object)
    if (user.avatar && typeof user.avatar === "object") {
      return user.avatar;
    }

    // Handle legacy format (string emoji)
    if (user.avatar && typeof user.avatar === "string") {
      return { type: "emoji", value: user.avatar };
    }

    // Fallback to emoji field or default
    return { type: "emoji", value: user.emoji || "😊" };
  };

  const isAdmin = user?.role === "admin";
  const isHost = user?.role === "host";
  const canCreateEvents = isAdmin || isHost;

  const styles = createStyles(colors);

  const quickActions = [
    {
      id: "explore",
      label: "Explore",
      icon: Search,
      screen: "SearchEvents",
      badge: 0,
    },
    {
      id: "myevents",
      label: "My Events",
      icon: Calendar,
      screen: "MyEvents",
      badge: 0,
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: Bell,
      screen: "Notifications",
      badge: unreadNotifications,
    },
    canCreateEvents
      ? {
          id: "create",
          label: "Create",
          icon: Sparkles,
          screen: "CreateEvent",
          badge: 0,
        }
      : {
          id: "behost",
          label: "Be a Host",
          icon: Tent,
          screen: "RequestHost",
          badge: 0,
        },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>
            {getGreeting()}
          </Text>
          <Text style={[styles.name, { color: colors.text }]}>
            {getUserDisplayName()}
          </Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: `${colors.primary}26`,
                borderColor: `${colors.primary}66`,
              },
            ]}
          >
            <AvatarDisplay avatar={getUserAvatar()} size={44} />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Pending Ratings Section */}
        {pendingRatingEvents.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Rate Your Experiences
            </Text>
            {pendingRatingEvents.map((event) => {
              const eventDate = event.date ? new Date(event.date) : null;
              const dateStr = eventDate
                ? eventDate.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })
                : "Date unknown";
              return (
                <TouchableOpacity
                  key={event.id}
                  style={styles.ratingCard}
                  onPress={() => handleRateEvent(event)}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.ratingGlass,
                      {
                        backgroundColor: "rgba(255, 215, 0, 0.08)",
                        borderColor: "rgba(255, 215, 0, 0.20)",
                      },
                    ]}
                  >
                    <View style={styles.ratingIconCircle}>
                      <Star
                        size={22}
                        color="#FFD700"
                        fill="#FFD700"
                        strokeWidth={1.5}
                      />
                    </View>
                    <View style={styles.ratingContent}>
                      <Text
                        style={[
                          styles.ratingEventTitle,
                          { color: colors.text },
                        ]}
                        numberOfLines={1}
                      >
                        {event.title}
                      </Text>
                      <Text
                        style={[
                          styles.ratingEventDate,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {dateStr}
                      </Text>
                    </View>
                    <ChevronRight size={18} color="#FFD700" strokeWidth={2} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Quick Actions
          </Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => {
              const ActionIcon = action.icon;
              return (
                <TouchableOpacity
                  key={action.id}
                  style={styles.quickAction}
                  onPress={() => navigation.navigate(action.screen)}
                >
                  <View
                    style={[
                      styles.quickActionGlass,
                      {
                        backgroundColor: colors.surfaceGlass,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <View style={styles.quickActionIconContainer}>
                      <View
                        style={[
                          styles.iconCircle,
                          { backgroundColor: `${colors.primary}15` },
                        ]}
                      >
                        <ActionIcon
                          size={28}
                          color={colors.primary}
                          strokeWidth={1.8}
                        />
                      </View>
                      {action.badge > 0 && (
                        <View
                          style={[
                            styles.badge,
                            { backgroundColor: colors.accent },
                          ]}
                        >
                          <Text style={styles.badgeText}>
                            {action.badge > 99 ? "99+" : action.badge}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text
                      style={[styles.quickActionText, { color: colors.text }]}
                    >
                      {action.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Admin Dashboard Card */}
        {isAdmin && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.adminCard}
              onPress={() => navigation.navigate("AdminDashboard")}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.adminGlass,
                  {
                    backgroundColor: "rgba(255, 215, 0, 0.15)",
                    borderColor: "rgba(255, 215, 0, 0.3)",
                  },
                ]}
              >
                <View style={styles.adminContent}>
                  <View style={styles.adminIconContainer}>
                    <Crown size={36} color="#FFD700" strokeWidth={1.8} />
                    {pendingHostRequests > 0 && (
                      <View
                        style={[
                          styles.adminBadge,
                          { backgroundColor: colors.accent },
                        ]}
                      >
                        <Text style={styles.badgeText}>
                          {pendingHostRequests}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.adminText}>
                    <Text style={styles.adminTitle}>Admin Dashboard</Text>
                    <Text
                      style={[
                        styles.adminSubtitle,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {pendingHostRequests > 0
                        ? `${pendingHostRequests} pending request${
                            pendingHostRequests > 1 ? "s" : ""
                          }`
                        : "Manage host requests and events"}
                    </Text>
                  </View>
                </View>
                <ChevronRight size={24} color="#FFD700" strokeWidth={2} />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Browse by Category */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitleInline, { color: colors.text }]}>
              Browse by Category
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("SearchEvents")}
            >
              <Text style={[styles.seeAll, { color: colors.primary }]}>
                See all
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}
          >
            {EVENT_CATEGORIES.map((category) => {
              const CategoryIcon = getCategoryIcon(category.id);
              return (
                <TouchableOpacity
                  key={category.id}
                  style={styles.categoryCard}
                  onPress={() =>
                    navigation.navigate("SearchEvents", {
                      category: category.label,
                    })
                  }
                >
                  <View
                    style={[
                      styles.categoryGlass,
                      {
                        backgroundColor: colors.surfaceGlass,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.categoryIconCircle,
                        { backgroundColor: `${colors.primary}15` },
                      ]}
                    >
                      <CategoryIcon
                        size={28}
                        color={colors.primary}
                        strokeWidth={1.8}
                      />
                    </View>
                    <Text style={[styles.categoryName, { color: colors.text }]}>
                      {category.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </ScrollView>

      {/* Rating Modal */}
      <RatingModal
        visible={showRatingModal}
        onClose={() => {
          setShowRatingModal(false);
          setSelectedEvent(null);
        }}
        onSuccess={handleRatingSuccess}
        event={selectedEvent}
      />
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
    greeting: { fontSize: 14, marginBottom: 4 },
    name: { fontSize: 28, fontWeight: "700", letterSpacing: -0.5 },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      borderWidth: 2,
      justifyContent: "center",
      alignItems: "center",
      overflow: "hidden",
    },
    scrollView: { flex: 1 },
    scrollContent: { paddingBottom: 40 },
    section: { marginBottom: 28 },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 24,
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: "700",
      paddingHorizontal: 24,
      marginBottom: 16,
      letterSpacing: -0.3,
    },
    sectionTitleInline: {
      fontSize: 20,
      fontWeight: "700",
      letterSpacing: -0.3,
    },
    seeAll: { fontSize: 14, fontWeight: "600" },
    ratingCard: {
      marginHorizontal: 24,
      marginBottom: 10,
      borderRadius: 14,
      overflow: "hidden",
    },
    ratingGlass: {
      borderWidth: 1,
      padding: 14,
      flexDirection: "row",
      alignItems: "center",
    },
    ratingIconCircle: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: "rgba(255, 215, 0, 0.15)",
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    ratingContent: { flex: 1 },
    ratingEventTitle: {
      fontSize: 15,
      fontWeight: "600",
      marginBottom: 2,
      letterSpacing: -0.2,
    },
    ratingEventDate: { fontSize: 13 },
    quickActionsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      paddingHorizontal: 24,
      gap: 12,
    },
    quickAction: { width: "48%", borderRadius: 16, overflow: "hidden" },
    quickActionGlass: {
      borderWidth: 1,
      paddingVertical: 24,
      alignItems: "center",
    },
    quickActionIconContainer: { position: "relative", marginBottom: 12 },
    iconCircle: {
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: "center",
      alignItems: "center",
    },
    badge: {
      position: "absolute",
      top: -4,
      right: -8,
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 6,
    },
    badgeText: { color: "#FFFFFF", fontSize: 11, fontWeight: "700" },
    quickActionText: { fontSize: 14, fontWeight: "600", letterSpacing: -0.1 },
    adminCard: { marginHorizontal: 24, borderRadius: 20, overflow: "hidden" },
    adminGlass: {
      borderWidth: 1,
      padding: 20,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    adminContent: { flexDirection: "row", alignItems: "center", flex: 1 },
    adminIconContainer: { position: "relative", marginRight: 16 },
    adminBadge: {
      position: "absolute",
      top: -4,
      right: -4,
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 6,
    },
    adminText: { flex: 1 },
    adminTitle: {
      fontSize: 18,
      fontWeight: "700",
      marginBottom: 4,
      color: "#FFD700",
      letterSpacing: -0.3,
    },
    adminSubtitle: { fontSize: 13, lineHeight: 18 },
    categoriesScroll: { paddingHorizontal: 24, gap: 12 },
    categoryCard: { width: 100, borderRadius: 16, overflow: "hidden" },
    categoryGlass: { borderWidth: 1, padding: 16, alignItems: "center" },
    categoryIconCircle: {
      width: 52,
      height: 52,
      borderRadius: 26,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 10,
    },
    categoryName: {
      fontSize: 12,
      fontWeight: "600",
      letterSpacing: -0.1,
      textAlign: "center",
    },
  });
}
