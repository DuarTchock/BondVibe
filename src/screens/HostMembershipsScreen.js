import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useFocusEffect } from "@react-navigation/native";
import { Ticket, Infinity as InfinityIcon } from "lucide-react-native";
import { useTheme } from "../contexts/ThemeContext";
import GradientBackground from "../components/GradientBackground";
import {
  getHostMembershipPlans,
  formatPlanPrice,
  describePlan,
  MEMBERSHIP_PLAN_TYPES,
} from "../services/membershipService";

export default function HostMembershipsScreen({ route, navigation }) {
  const { colors, isDark } = useTheme();
  const { hostId, hostName } = route.params || {};
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [hostId])
  );

  const load = async () => {
    const data = await getHostMembershipPlans(hostId, { activeOnly: true });
    setPlans(data);
    setLoading(false);
  };

  const styles = createStyles(colors, isDark);

  return (
    <GradientBackground>
      <StatusBar style={isDark ? "light" : "dark"} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.back, { color: colors.text }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {hostName ? `${hostName}'s Plans` : "Membership Plans"}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : plans.length === 0 ? (
        <View style={styles.empty}>
          <Ticket size={48} color={colors.textTertiary} strokeWidth={1.6} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No plans available
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            This host isn't selling memberships right now.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={[styles.intro, { color: colors.textSecondary }]}>
            Buy a class pack or pass and use it to attend this host's events.
          </Text>
          {plans.map((plan) => {
            const isUnlimited = plan.type === MEMBERSHIP_PLAN_TYPES.UNLIMITED;
            return (
              <View key={plan.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.iconCircle}>
                    {isUnlimited ? (
                      <InfinityIcon size={20} color={colors.primary} strokeWidth={2} />
                    ) : (
                      <Ticket size={20} color={colors.primary} strokeWidth={2} />
                    )}
                  </View>
                  <Text style={[styles.planName, { color: colors.text }]} numberOfLines={1}>
                    {plan.name}
                  </Text>
                  <Text style={[styles.planPrice, { color: colors.primary }]}>
                    {formatPlanPrice(plan.priceCentavos)}
                  </Text>
                </View>
                <Text style={[styles.planMeta, { color: colors.textSecondary }]}>
                  {describePlan(plan)}
                </Text>
                {!!plan.description && (
                  <Text style={[styles.planDesc, { color: colors.textTertiary }]}>
                    {plan.description}
                  </Text>
                )}
                <TouchableOpacity
                  style={styles.buyButton}
                  onPress={() => navigation.navigate("MembershipCheckout", { plan })}
                  activeOpacity={0.85}
                >
                  <View
                    style={[
                      styles.buyGlass,
                      { backgroundColor: `${colors.primary}33`, borderColor: `${colors.primary}66` },
                    ]}
                  >
                    <Text style={[styles.buyText, { color: colors.primary }]}>Buy</Text>
                  </View>
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
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
      paddingTop: 60,
      paddingBottom: 20,
    },
    back: { fontSize: 28 },
    headerTitle: { fontSize: 20, fontWeight: "700", flex: 1, textAlign: "center" },
    loading: { flex: 1, justifyContent: "center", alignItems: "center" },
    content: { paddingHorizontal: 24, paddingBottom: 40 },
    intro: { fontSize: 14, lineHeight: 21, marginBottom: 20 },
    empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 },
    emptyTitle: { fontSize: 18, fontWeight: "700", marginTop: 16, marginBottom: 8 },
    emptyText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
    card: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)",
      backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.85)",
      padding: 16,
      marginBottom: 12,
    },
    cardHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
    iconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: `${colors.primary}1F`,
    },
    planName: { fontSize: 16, fontWeight: "700", flex: 1 },
    planPrice: { fontSize: 16, fontWeight: "700" },
    planMeta: { fontSize: 13, marginBottom: 4, marginLeft: 52 },
    planDesc: { fontSize: 13, lineHeight: 18, marginLeft: 52 },
    buyButton: { borderRadius: 12, overflow: "hidden", marginTop: 14 },
    buyGlass: {
      borderWidth: 1,
      paddingVertical: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    buyText: { fontSize: 15, fontWeight: "700" },
  });
}
