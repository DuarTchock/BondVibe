import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useTranslation } from "react-i18next";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../services/firebase";
import { useTheme } from "../contexts/ThemeContext";
import { useMode } from "../contexts/ModeContext";
import { LinearGradient } from "expo-linear-gradient";
import { BRAND, ELEVATION } from "../constants/theme-tokens";
import { useFocusEffect } from "@react-navigation/native";
import EventsRow from "../components/EventsRow";
import MarketplaceRow from "../components/MarketplaceRow";
import Icon from "../components/Icon";
import GradientBackground from "../components/GradientBackground";

// Home is intentionally a lean discovery surface: greeting + search, then two
// independent carousels — Events near you, Services near you. Each carousel owns
// its own loading/empty/error state (no cross-leaking). Admin Dashboard moved to
// Profile; the old featured/zero-state/ratings/browse sections were retired.
export default function HomeScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const { isHosting } = useMode();
  const [user, setUser] = useState(null);

  const loadUser = useCallback(async () => {
    if (!auth.currentUser) return;
    try {
      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
      if (userDoc.exists()) setUser(userDoc.data());
    } catch (error) {
      console.error("Error loading user:", error);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);
  useFocusEffect(
    useCallback(() => {
      loadUser();
    }, [loadUser]),
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t("home.greetingMorning");
    if (hour < 18) return t("home.greetingAfternoon");
    return t("home.greetingEvening");
  };
  const getUserDisplayName = () => {
    if (!user) return t("home.defaultName");
    return user.fullName || user.name || t("home.defaultName");
  };

  const isAdmin = user?.role === "admin";
  const isHost = user?.role === "host";
  const canCreateEvents = isAdmin || isHost;

  const styles = createStyles(colors, isDark);

  return (
    <GradientBackground>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Tab root — AppHeader (toggle/✉/🔔) is provided by the tab navigator. */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>
            {getGreeting()}
          </Text>
          <Text style={[styles.name, { color: colors.text }]}>
            {getUserDisplayName()}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Weekly Digest banner (§2.2 / ai_features/14) */}
        <TouchableOpacity
          style={styles.digestBanner}
          onPress={() => navigation.navigate("YourWeek")}
          activeOpacity={0.85}
          testID="home-digest"
        >
          <Icon name="ai" size={16} color="#C792EA" />
          <Text style={styles.digestText} numberOfLines={1}>
            {t("home.digestBanner")}
          </Text>
          <Icon name="forward" size={16} color="#C792EA" />
        </TouchableOpacity>

        {/* Search entry (§2.2) */}
        <TouchableOpacity
          style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => navigation.navigate("SearchEvents")}
          activeOpacity={0.8}
          testID="home-search"
        >
          <Icon name="search" size={18} color={colors.textTertiary} />
          <Text style={[styles.searchPlaceholder, { color: colors.textTertiary }]}>
            {t("home.searchPlaceholder")}
          </Text>
        </TouchableOpacity>

        {/* Events near you (M0) — own loading/empty/error state */}
        <EventsRow navigation={navigation} />

        {/* Services near you (M0) — own loading/empty/error state */}
        <MarketplaceRow navigation={navigation} />
      </ScrollView>

      {/* Contextual Create — Host Mode only (§Fix 2): the single allowed
          shortcut; attendees don't create events. */}
      {isHosting && canCreateEvents && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate("CreateEvent")}
          activeOpacity={0.85}
          testID="home-create-fab"
        >
          <LinearGradient
            colors={BRAND.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.fabInner, ELEVATION.floatingBrand]}
          >
            <Icon name="add" size={26} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      )}
    </GradientBackground>
  );
}

function createStyles(colors, isDark) {
  return StyleSheet.create({
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 24,
      paddingTop: 4,
      paddingBottom: 20,
    },
    greeting: { fontSize: 14, marginBottom: 4 },
    name: { fontSize: 28, fontWeight: "700", letterSpacing: -0.5 },
    scrollView: { flex: 1 },
    scrollContent: { paddingBottom: 40 },
    digestBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: "#2A1E3D",
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginHorizontal: 24,
      marginBottom: 12,
    },
    digestText: { flex: 1, color: "#e6ddf2", fontSize: 14, fontWeight: "600" },
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderRadius: 14,
      borderWidth: 1,
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginHorizontal: 24,
      marginBottom: 20,
    },
    searchPlaceholder: { fontSize: 14.5 },
    fab: { position: "absolute", right: 20, bottom: 24 },
    fabInner: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: "center",
      justifyContent: "center",
    },
  });
}
