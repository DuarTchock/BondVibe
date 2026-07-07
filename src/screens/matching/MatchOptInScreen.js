/**
 * A1 — Opt-in. Shown after ticket checkout (or from the event) to invite the
 * attendee into Community Matching. Opt-in only; opens after the event.
 */
import React from "react";
import Icon from "../../components/Icon";
import { View, Text, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../contexts/ThemeContext";
import { PrimaryButton, SecondaryButton } from "./matchUi";

export default function MatchOptInScreen({ route, navigation }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { eventId, eventTitle } = route.params || {};

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.hero}>
        <View style={[styles.badge, { backgroundColor: `${colors.primary}15` }]}>
          <Icon name="ai" size={40} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>
          {t("matchOptIn.title")}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {eventTitle
            ? t("matchOptIn.subtitleWithTitle", { eventTitle })
            : t("matchOptIn.subtitleDefault")}
        </Text>
      </View>

      <View style={styles.actions}>
        <PrimaryButton
          label={t("matchOptIn.joinButton")}
          onPress={() =>
            navigation.replace("MatchConsent", { eventId, eventTitle })
          }
        />
        <SecondaryButton label={t("matchOptIn.declineButton")} onPress={() => navigation.goBack()} />
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
