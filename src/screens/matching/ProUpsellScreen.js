/**
 * E1 — Kinlo Pro upsell (host). Shown when a non-Pro host tries to enable
 * Community Matching. Leads to the Pro checkout (E2). Price is admin-editable.
 */
import React, { useState, useEffect } from "react";
import Icon from "../../components/Icon";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { PrimaryButton, SecondaryButton } from "./matchUi";
import { getSubscriptionConfig, SUBSCRIPTION_DEFAULTS } from "../../services/configService";

const PERKS = [
  "Community Matching for your events",
  "AI listing writer & coaching",
  "QR check-in, CRM & co-hosts",
  "Priority support",
];

export default function ProUpsellScreen({ route, navigation }) {
  const { colors } = useTheme();
  const { eventId } = route.params || {};
  const [pro, setPro] = useState(SUBSCRIPTION_DEFAULTS.pro);

  useEffect(() => {
    getSubscriptionConfig().then((c) => setPro(c.pro));
  }, []);

  const styles = createStyles(colors);
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.center}>
        <View style={[styles.badge, { backgroundColor: `${colors.primary}15` }]}>
          <Icon name="pro" size={44} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>
          Activate Community Matching with Kinlo Pro
        </Text>
        <Text style={[styles.price, { color: colors.primary }]}>
          ${pro.amount} {pro.currency}
          <Text style={[styles.per, { color: colors.textSecondary }]}> / {pro.interval}</Text>
        </Text>
        <View style={styles.perks}>
          {PERKS.map((p) => (
            <View key={p} style={styles.perkRow}>
              <Icon name="check" size={18} color={colors.primary} />
              <Text style={[styles.perkText, { color: colors.text }]}>{p}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.footer}>
        <PrimaryButton
          label="Become Pro"
          onPress={() => navigation.replace("ProCheckout", { eventId })}
        />
        <SecondaryButton label="Not now" onPress={() => navigation.goBack()} />
      </View>
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28 },
    badge: {
      width: 92, height: 92, borderRadius: 46,
      alignItems: "center", justifyContent: "center", marginBottom: 20,
    },
    title: { fontSize: 23, fontWeight: "800", textAlign: "center", letterSpacing: -0.3 },
    price: { fontSize: 34, fontWeight: "800", marginTop: 18 },
    per: { fontSize: 16, fontWeight: "600" },
    perks: { marginTop: 26, alignSelf: "stretch", gap: 12, paddingHorizontal: 12 },
    perkRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    perkText: { fontSize: 15, fontWeight: "500" },
    footer: { paddingHorizontal: 24, paddingBottom: 28, gap: 6 },
  });
}
