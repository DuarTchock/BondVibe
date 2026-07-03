/**
 * A2 — Consent. Four plain-language points the attendee must accept before a
 * match profile is created. Accepting proceeds to the profile (A3), where the
 * consent timestamp is recorded.
 */
import React from "react";
import Icon from "../../components/Icon";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { MatchHeader, PrimaryButton, SecondaryButton } from "./matchUi";

const POINTS = [
  {
    icon: "hide",
    title: "Only this event sees you",
    body: "Your match profile is shared only with people who attended this event — never public or searchable.",
  },
  {
    icon: "lock",
    title: "Messaging needs a mutual match",
    body: "Nobody can message you until you both like each other. Your contact details stay private.",
  },
  {
    icon: "privacy",
    title: "The host never sees your likes",
    body: "Organizers only see anonymous totals. Who you like is private to you.",
  },
  {
    icon: "report",
    title: "You're in control",
    body: "Report, block or hide anyone, and delete your matching data or leave at any time.",
  },
];

export default function MatchConsentScreen({ route, navigation }) {
  const { colors } = useTheme();
  const { eventId, eventTitle } = route.params || {};

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <MatchHeader title="Before you join" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.lead, { color: colors.textSecondary }]}>
          Community Matching is opt-in and privacy-first. Here's how it works:
        </Text>
        {POINTS.map(({ icon, title, body }) => (
          <View key={title} style={styles.row}>
            <View style={[styles.iconWrap, { backgroundColor: `${colors.primary}15` }]}>
              <Icon name={icon} size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, { color: colors.text }]}>{title}</Text>
              <Text style={[styles.rowBody, { color: colors.textSecondary }]}>
                {body}
              </Text>
            </View>
          </View>
        ))}
        <Text style={[styles.legal, { color: colors.textTertiary }]}>
          By continuing you agree to the Community Matching terms. You must be 18+.
          Meeting people carries risks you accept; Kinlo is a neutral platform and
          doesn't verify identities.
        </Text>
      </ScrollView>
      <View style={styles.actions}>
        <PrimaryButton
          label="I agree — continue"
          onPress={() =>
            navigation.replace("MatchProfile", { eventId, eventTitle })
          }
        />
        <SecondaryButton label="Not now" onPress={() => navigation.goBack()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 24, paddingBottom: 24 },
  lead: { fontSize: 15, lineHeight: 21, marginBottom: 20 },
  row: { flexDirection: "row", marginBottom: 20, gap: 14 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: { fontSize: 16, fontWeight: "700", marginBottom: 3 },
  rowBody: { fontSize: 13.5, lineHeight: 19 },
  legal: { fontSize: 12, lineHeight: 17, marginTop: 4 },
  actions: { paddingHorizontal: 24, paddingBottom: 28, gap: 6 },
});
