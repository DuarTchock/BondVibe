import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useTranslation } from "react-i18next";
import Icon from "../components/Icon";
import { useTheme } from "../contexts/ThemeContext";
import GradientBackground from "../components/GradientBackground";
import { usePremium, waitForPremium } from "../hooks/usePremium";
import { startProCheckout, openProPortal } from "../services/proService";

export default function BondVibeProScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const { isPremium, loading } = usePremium();
  const [working, setWorking] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const styles = createStyles(colors, isDark);

  const PRO_PRICE_LABEL = t("bondvibePro.priceLabel");

  const PRO_FEATURES = [
    { icon: "ai", title: t("bondvibePro.features.aiCoaching.title"), desc: t("bondvibePro.features.aiCoaching.desc") },
    { icon: "chart", title: t("bondvibePro.features.advancedInsights.title"), desc: t("bondvibePro.features.advancedInsights.desc") },
    { icon: "qr", title: t("bondvibePro.features.qrCheckin.title"), desc: t("bondvibePro.features.qrCheckin.desc") },
    { icon: "users", title: t("bondvibePro.features.attendeeCrm.title"), desc: t("bondvibePro.features.attendeeCrm.desc") },
    { icon: "chat", title: t("bondvibePro.features.messaging.title"), desc: t("bondvibePro.features.messaging.desc") },
  ];

  const openCheckout = async () => {
    setWorking(true);
    try {
      const { completed, cancelled } = await startProCheckout();
      if (cancelled || !completed) return; // nothing bought — stay put, silently

      // Paying isn't being Pro: the webhook grants the entitlement and lands a
      // beat later. Leaving the user here meanwhile is the bug — a paywall still
      // offering to sell what they just bought. Wait for it, then move them on.
      setConfirming(true);
      const entitled = await waitForPremium();
      if (entitled) {
        // The destination of value, not the shop they already bought from.
        navigation.replace("BusinessHub");
      } else {
        // Honest: the payment may well be fine, we just can't confirm yet. Don't
        // claim failure, and don't fake success by navigating anyway.
        Alert.alert(
          t("bondvibePro.processingTitle"),
          t("bondvibePro.processingMessage")
        );
      }
    } catch (e) {
      Alert.alert(t("bondvibePro.alertTitle"), e.message || t("bondvibePro.checkoutError"));
    } finally {
      setConfirming(false);
      setWorking(false);
    }
  };

  const openPortal = async () => {
    setWorking(true);
    try {
      await openProPortal();
    } catch (e) {
      Alert.alert(t("bondvibePro.alertTitle"), e.message || t("bondvibePro.portalError"));
    } finally {
      setWorking(false);
    }
  };

  return (
    <GradientBackground>
      <StatusBar style={isDark ? "light" : "dark"} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t("bondvibePro.headerTitle")}</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { borderColor: `${colors.primary}55`, backgroundColor: `${colors.primary}12` }]}>
          <Icon name="pro" size={40} color={colors.primary} />
          <Text style={[styles.heroTitle, { color: colors.text }]}>
            {isPremium ? t("bondvibePro.heroTitlePro") : t("bondvibePro.heroTitleFree")}
          </Text>
          <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
            {isPremium
              ? t("bondvibePro.heroSubtitlePro")
              : t("bondvibePro.heroSubtitleFree")}
          </Text>
        </View>

        <View style={styles.features}>
          {PRO_FEATURES.map(({ icon, title, desc }) => (
            <View key={title} style={styles.featureRow}>
              <View style={[styles.featureIcon, { backgroundColor: colors.brandSoft }]}>
                <Icon name={icon} size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.featureTitle, { color: colors.text }]}>{title}</Text>
                <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>{desc}</Text>
              </View>
              {isPremium && <Icon name="check" size={18} color={colors.primary} />}
            </View>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
        ) : isPremium ? (
          <TouchableOpacity
            style={[styles.secondaryBtn, { borderColor: colors.border, opacity: working ? 0.6 : 1 }]}
            onPress={openPortal}
            disabled={working}
          >
            {working ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <Text style={[styles.secondaryText, { color: colors.text }]}>{t("bondvibePro.manageSubscription")}</Text>
            )}
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.cta, { backgroundColor: colors.primary, opacity: working ? 0.7 : 1 }]}
              onPress={openCheckout}
              activeOpacity={0.9}
              disabled={working}
            >
              {working ? (
                <View style={styles.ctaBusy}>
                  <ActivityIndicator color="#fff" />
                  {/* Say what we're waiting for. A bare spinner over "Go Pro"
                      is what made people wonder whether the payment went
                      through at all. */}
                  {confirming && (
                    <Text style={styles.ctaText}>{t("bondvibePro.confirming")}</Text>
                  )}
                </View>
              ) : (
                <>
                  <Icon name="pro" size={18} color="#fff" />
                  <Text style={styles.ctaText}>{t("bondvibePro.ctaGoPro", { price: PRO_PRICE_LABEL })}</Text>
                </>
              )}
            </TouchableOpacity>
            <Text style={[styles.finePrint, { color: colors.textTertiary }]}>
              {t("bondvibePro.finePrint")}
            </Text>
          </>
        )}
      </ScrollView>
    </GradientBackground>
  );
}

function createStyles(colors, isDark) {
  const cardBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.85)";
  const cardBorder = isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)";
  return StyleSheet.create({
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 24,
      paddingTop: 60,
      paddingBottom: 20,
    },
    headerTitle: { fontSize: 20, fontWeight: "700" },
    content: { paddingHorizontal: 24, paddingBottom: 40 },
    hero: {
      alignItems: "center",
      borderWidth: 1,
      borderRadius: 20,
      padding: 24,
      gap: 10,
      marginBottom: 24,
    },
    heroTitle: { fontSize: 22, fontWeight: "800", textAlign: "center", letterSpacing: -0.3 },
    heroSubtitle: { fontSize: 14, textAlign: "center", lineHeight: 20 },
    features: { gap: 12 },
    featureRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: cardBorder,
      backgroundColor: cardBg,
      padding: 14,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 1,
    },
    featureIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    featureTitle: { fontSize: 15, fontWeight: "700" },
    featureDesc: { fontSize: 13, marginTop: 2, lineHeight: 18 },
    cta: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      borderRadius: 16,
      paddingVertical: 16,
      marginTop: 24,
    },
    ctaText: { color: "#fff", fontSize: 16, fontWeight: "800" },
    ctaBusy: { flexDirection: "row", alignItems: "center", gap: 10 },
    finePrint: { fontSize: 12, textAlign: "center", marginTop: 12, lineHeight: 17 },
    secondaryBtn: {
      borderWidth: 1,
      borderRadius: 16,
      paddingVertical: 16,
      alignItems: "center",
      marginTop: 24,
    },
    secondaryText: { fontSize: 15, fontWeight: "700" },
  });
}
