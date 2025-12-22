import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "../services/firebase";
import { useTheme } from "../contexts/ThemeContext";
import { useFocusEffect } from "@react-navigation/native";
import * as WebBrowser from "expo-web-browser";
import {
  createConnectAccount,
  getAccountLink,
  checkAccountStatus,
} from "../services/stripeConnectService";

export default function StripeConnectScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [userData, setUserData] = useState(null);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshStatus = async () => {
    setRefreshing(true);
    try {
      const result = await checkAccountStatus(auth.currentUser.uid);
      if (result.success) {
        await loadData();
        Alert.alert(
          "Status Updated",
          "Your Stripe account status has been refreshed."
        );
      } else {
        Alert.alert("Error", result.error || "Could not refresh status.");
      }
    } catch (error) {
      console.error("Error refreshing status:", error);
      Alert.alert("Error", "Could not refresh status. Please try again.");
    } finally {
      setRefreshing(false);
    }
  };

  const handleConnectStripe = async () => {
    setConnecting(true);
    try {
      // ✅ NUEVO: Si no hay cuenta de Stripe, crearla primero
      if (!userData.stripeConnect?.accountId) {
        console.log("📤 No Stripe account found, creating one...");
        const accountResult = await createConnectAccount(
          auth.currentUser.uid,
          userData.email || auth.currentUser.email,
          userData.fullName || "Host"
        );

        if (!accountResult.success) {
          throw new Error(accountResult.error);
        }

        console.log("✅ Stripe account created:", accountResult.accountId);

        // Recargar userData para obtener la nueva cuenta
        await loadData();
      }

      // Ahora obtener el onboarding link
      console.log("📤 Getting onboarding link...");
      const linkResult = await getAccountLink(auth.currentUser.uid);

      if (!linkResult.success) {
        throw new Error(linkResult.error);
      }

      console.log("🌐 Opening Stripe onboarding...");
      const result = await WebBrowser.openBrowserAsync(linkResult.url);

      if (result.type === "cancel") {
        Alert.alert(
          "Verification Incomplete",
          "You can complete your Stripe verification anytime to start accepting payments."
        );
      } else {
        Alert.alert(
          "Verification in Progress",
          "Please allow 1-2 days for Stripe to verify your account. Check back soon!",
          [
            {
              text: "Refresh Status",
              onPress: handleRefreshStatus,
            },
          ]
        );
      }
    } catch (error) {
      console.error("❌ Error connecting Stripe:", error);
      Alert.alert(
        "Connection Error",
        error.message || "Could not connect to Stripe. Please try again."
      );
    } finally {
      setConnecting(false);
    }
  };

  const styles = createStyles(colors);

  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const stripeConnect = userData?.stripeConnect;
  const hostConfig = userData?.hostConfig;
  const isActive = stripeConnect?.status === "active";
  const isPending = stripeConnect?.status === "pending";
  const canCreatePaidEvents = hostConfig?.canCreatePaidEvents;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backButton, { color: colors.text }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Stripe Connect
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefreshStatus}
            tintColor={colors.primary}
          />
        }
      >
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View
            style={[
              styles.statusGlass,
              {
                backgroundColor: isActive
                  ? "rgba(52, 199, 89, 0.1)"
                  : isPending
                  ? "rgba(255, 159, 10, 0.1)"
                  : colors.surfaceGlass,
                borderColor: isActive
                  ? "rgba(52, 199, 89, 0.3)"
                  : isPending
                  ? "rgba(255, 159, 10, 0.3)"
                  : colors.border,
              },
            ]}
          >
            <Text style={styles.statusEmoji}>
              {isActive ? "✅" : isPending ? "⏳" : "🔗"}
            </Text>
            <Text style={[styles.statusTitle, { color: colors.text }]}>
              {isActive
                ? "Account Active"
                : isPending
                ? "Verification Pending"
                : "Not Connected"}
            </Text>
            <Text style={[styles.statusText, { color: colors.textSecondary }]}>
              {isActive
                ? "You can create paid events and receive payments"
                : isPending
                ? "Your account is being verified by Stripe (1-2 days)"
                : "Connect your Stripe account to create paid events"}
            </Text>

            {canCreatePaidEvents && (
              <View
                style={[
                  styles.featureBadge,
                  { backgroundColor: "rgba(52, 199, 89, 0.15)" },
                ]}
              >
                <Text style={styles.featureBadgeText}>
                  ✓ Paid Events Enabled
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Current Host Type Info */}
        <View style={styles.hostTypeCard}>
          <View
            style={[
              styles.hostTypeGlass,
              {
                backgroundColor: colors.surfaceGlass,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={styles.hostTypeEmoji}>
              {hostConfig?.type === "paid" ? "💰" : "🆓"}
            </Text>
            <Text style={[styles.hostTypeTitle, { color: colors.text }]}>
              Current: {hostConfig?.type === "paid" ? "Paid Host" : "Free Host"}
            </Text>
            <Text
              style={[styles.hostTypeText, { color: colors.textSecondary }]}
            >
              {hostConfig?.type === "paid"
                ? "You can create both free and paid events"
                : "You can create free events. Connect Stripe to upgrade to paid events."}
            </Text>
          </View>
        </View>

        {/* Details Card */}
        {stripeConnect?.accountId && (
          <View style={styles.detailsCard}>
            <View
              style={[
                styles.detailsGlass,
                {
                  backgroundColor: colors.surfaceGlass,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.detailsTitle, { color: colors.text }]}>
                Account Details
              </Text>

              <View style={styles.detailRow}>
                <Text
                  style={[styles.detailLabel, { color: colors.textSecondary }]}
                >
                  Account ID
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {stripeConnect.accountId.substring(0, 12)}...
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text
                  style={[styles.detailLabel, { color: colors.textSecondary }]}
                >
                  Charges Enabled
                </Text>
                <Text
                  style={[
                    styles.detailValue,
                    {
                      color: stripeConnect.chargesEnabled
                        ? "#34C759"
                        : colors.textTertiary,
                    },
                  ]}
                >
                  {stripeConnect.chargesEnabled ? "Yes" : "No"}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text
                  style={[styles.detailLabel, { color: colors.textSecondary }]}
                >
                  Payouts Enabled
                </Text>
                <Text
                  style={[
                    styles.detailValue,
                    {
                      color: stripeConnect.payoutsEnabled
                        ? "#34C759"
                        : colors.textTertiary,
                    },
                  ]}
                >
                  {stripeConnect.payoutsEnabled ? "Yes" : "No"}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text
                  style={[styles.detailLabel, { color: colors.textSecondary }]}
                >
                  Details Submitted
                </Text>
                <Text
                  style={[
                    styles.detailValue,
                    {
                      color: stripeConnect.detailsSubmitted
                        ? "#34C759"
                        : colors.textTertiary,
                    },
                  ]}
                >
                  {stripeConnect.detailsSubmitted ? "Yes" : "No"}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Info Card */}
        <View style={styles.infoCard}>
          <View
            style={[
              styles.infoGlass,
              {
                backgroundColor: `${colors.primary}15`,
                borderColor: `${colors.primary}40`,
              },
            ]}
          >
            <Text style={styles.infoEmoji}>💰</Text>
            <Text style={[styles.infoTitle, { color: colors.text }]}>
              How Payments Work
            </Text>
            <View style={styles.infoList}>
              <Text style={[styles.infoItem, { color: colors.textSecondary }]}>
                • You receive 95% of each ticket sale
              </Text>
              <Text style={[styles.infoItem, { color: colors.textSecondary }]}>
                • BondVibe takes 5% platform fee
              </Text>
              <Text style={[styles.infoItem, { color: colors.textSecondary }]}>
                • Payments go directly to your account
              </Text>
              <Text style={[styles.infoItem, { color: colors.textSecondary }]}>
                • You handle your own refunds
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        {!isActive && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleConnectStripe}
            disabled={connecting}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.actionGlass,
                {
                  backgroundColor: `${colors.primary}33`,
                  borderColor: `${colors.primary}66`,
                  opacity: connecting ? 0.5 : 1,
                },
              ]}
            >
              {connecting ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text
                    style={[
                      styles.actionText,
                      { color: colors.primary, marginLeft: 12 },
                    ]}
                  >
                    {stripeConnect?.accountId
                      ? "Connecting..."
                      : "Setting up..."}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.actionText, { color: colors.primary }]}>
                  {isPending
                    ? "Complete Verification"
                    : stripeConnect?.accountId
                    ? "Continue Stripe Setup"
                    : "Connect Stripe Account"}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefreshStatus}
          disabled={refreshing}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.refreshGlass,
              {
                backgroundColor: colors.surfaceGlass,
                borderColor: colors.border,
                opacity: refreshing ? 0.5 : 1,
              },
            ]}
          >
            <Text style={[styles.refreshText, { color: colors.text }]}>
              🔄 Refresh Status
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.noteSection}>
          <Text style={[styles.noteText, { color: colors.textTertiary }]}>
            💡 Stripe verification typically takes 1-2 business days. You'll be
            notified when your account is ready.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
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
    statusCard: {
      borderRadius: 20,
      overflow: "hidden",
      marginBottom: 20,
    },
    statusGlass: {
      borderWidth: 2,
      padding: 24,
      alignItems: "center",
    },
    statusEmoji: { fontSize: 56, marginBottom: 16 },
    statusTitle: {
      fontSize: 24,
      fontWeight: "700",
      marginBottom: 8,
      letterSpacing: -0.4,
    },
    statusText: {
      fontSize: 14,
      textAlign: "center",
      lineHeight: 21,
      marginBottom: 16,
    },
    featureBadge: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 10,
      marginTop: 8,
    },
    featureBadgeText: {
      fontSize: 13,
      fontWeight: "600",
      color: "#34C759",
    },
    hostTypeCard: {
      borderRadius: 16,
      overflow: "hidden",
      marginBottom: 20,
    },
    hostTypeGlass: {
      borderWidth: 1,
      padding: 18,
      alignItems: "center",
    },
    hostTypeEmoji: { fontSize: 36, marginBottom: 12 },
    hostTypeTitle: {
      fontSize: 18,
      fontWeight: "700",
      marginBottom: 8,
      letterSpacing: -0.3,
    },
    hostTypeText: {
      fontSize: 13,
      textAlign: "center",
      lineHeight: 19,
    },
    detailsCard: {
      borderRadius: 16,
      overflow: "hidden",
      marginBottom: 20,
    },
    detailsGlass: {
      borderWidth: 1,
      padding: 18,
    },
    detailsTitle: {
      fontSize: 18,
      fontWeight: "700",
      marginBottom: 16,
      letterSpacing: -0.3,
    },
    detailRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: "rgba(0, 0, 0, 0.05)",
    },
    detailLabel: { fontSize: 14 },
    detailValue: { fontSize: 14, fontWeight: "600" },
    infoCard: {
      borderRadius: 16,
      overflow: "hidden",
      marginBottom: 20,
    },
    infoGlass: {
      borderWidth: 1,
      padding: 20,
    },
    infoEmoji: { fontSize: 36, marginBottom: 12 },
    infoTitle: {
      fontSize: 18,
      fontWeight: "700",
      marginBottom: 14,
      letterSpacing: -0.3,
    },
    infoList: { gap: 8 },
    infoItem: { fontSize: 14, lineHeight: 21 },
    actionButton: {
      borderRadius: 16,
      overflow: "hidden",
      marginBottom: 12,
    },
    actionGlass: {
      borderWidth: 1,
      paddingVertical: 18,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 58,
    },
    loadingRow: { flexDirection: "row", alignItems: "center" },
    actionText: { fontSize: 17, fontWeight: "700", letterSpacing: -0.3 },
    refreshButton: {
      borderRadius: 16,
      overflow: "hidden",
      marginBottom: 20,
    },
    refreshGlass: {
      borderWidth: 1,
      paddingVertical: 14,
      alignItems: "center",
    },
    refreshText: { fontSize: 15, fontWeight: "600" },
    noteSection: { padding: 16, alignItems: "center" },
    noteText: { fontSize: 13, textAlign: "center", lineHeight: 20 },
  });
}
