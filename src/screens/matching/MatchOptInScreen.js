/**
 * A1 — Opt-in. Shown after ticket checkout (or from the event) to invite the
 * attendee into Community Matching. Opt-in only; opens after the event.
 */
import React from "react";
import Icon from "../../components/Icon";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { PrimaryButton, SecondaryButton } from "./matchUi";

export default function MatchOptInScreen({ route, navigation }) {
  const { colors } = useTheme();
  const { eventId, eventTitle } = route.params || {};

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.hero}>
        <View style={[styles.badge, { backgroundColor: `${colors.primary}15` }]}>
          <Icon name="ai" size={40} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>
          This event includes Community Matching
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Meet people from{eventTitle ? ` “${eventTitle}”` : " this event"} with a
          shared purpose — friends, professional or romantic. It opens when the
          event ends, so you enjoy it in person first.
        </Text>
      </View>

      <View style={styles.actions}>
        <PrimaryButton
          label="Yes, I want to join"
          onPress={() =>
            navigation.replace("MatchConsent", { eventId, eventTitle })
          }
        />
        <SecondaryButton label="No, thanks" onPress={() => navigation.goBack()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, justifyContent: "center" },
  hero: { alignItems: "center", marginBottom: 40 },
  badge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  subtitle: { fontSize: 15, textAlign: "center", lineHeight: 22 },
  actions: { gap: 6 },
});
