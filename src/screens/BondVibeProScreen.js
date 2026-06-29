import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import * as WebBrowser from "expo-web-browser";
import {
  Crown,
  Check,
  Sparkles,
  QrCode,
  Users,
  BarChart3,
  MessageSquare,
} from "lucide-react-native";
import { useTheme } from "../contexts/ThemeContext";
import GradientBackground from "../components/GradientBackground";
import { auth } from "../services/firebase";
import { usePremium } from "../hooks/usePremium";

// TODO: replace with the real hosted Stripe checkout + Customer Portal URLs
// once the Pro Product/Price and the web page exist. The uid is passed so the
// web page can tie the subscription to this user; the webhook sets isPremium.
const PRO_PRICE_LABEL = "$199 MXN / mo";
const CHECKOUT_BASE_URL = "https://bondvibe.app/pro"; // placeholder
const PORTAL_BASE_URL = "https://bondvibe.app/pro/manage"; // placeholder

const PRO_FEATURES = [
  { icon: Sparkles, title: "AI coaching", desc: "Recommendations to improve your events based on your reviews" },
  { icon: BarChart3, title: "Advanced insights", desc: "Trends, sentiment and benchmark vs your category" },
  { icon: QrCode, title: "QR check-in", desc: "Take attendance at the event door" },
  { icon: Users, title: "Attendee CRM", desc: "History, regulars and alerts on who needs attention" },
  { icon: MessageSquare, title: "Messaging + unlimited groups", desc: "Mass announcements and unlimited groups" },
];

export default function BondVibeProScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { isPremium, loading } = usePremium();
  const styles = createStyles(colors, isDark);

  const openCheckout = async () => {
    const uid = auth.currentUser?.uid || "";
    await WebBrowser.openBrowserAsync(
      `${CHECKOUT_BASE_URL}?uid=${encodeURIComponent(uid)}`
    );
  };

  const openPortal = async () => {
    const uid = auth.currentUser?.uid || "";
    await WebBrowser.openBrowserAsync(
      `${PORTAL_BASE_URL}?uid=${encodeURIComponent(uid)}`
    );
  };

  return (
    <GradientBackground>
      <StatusBar style={isDark ? "light" : "dark"} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.back, { color: colors.text }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>BondVibe Pro</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { borderColor: `${colors.primary}55`, backgroundColor: `${colors.primary}12` }]}>
          <Crown size={40} color={colors.primary} strokeWidth={1.8} />
          <Text style={[styles.heroTitle, { color: colors.text }]}>
            {isPremium ? "You're Pro ✓" : "Take your events to the next level"}
          </Text>
          <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
            {isPremium
              ? "You have access to all Pro features."
              : "Tools for hosts who want to grow and retain their community."}
          </Text>
        </View>

        <View style={styles.features}>
          {PRO_FEATURES.map(({ icon: Icon, title, desc }) => (
            <View key={title} style={styles.featureRow}>
              <View style={[styles.featureIcon, { backgroundColor: `${colors.primary}1F` }]}>
                <Icon size={20} color={colors.primary} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.featureTitle, { color: colors.text }]}>{title}</Text>
                <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>{desc}</Text>
              </View>
              {isPremium && <Check size={18} color={colors.primary} strokeWidth={2.5} />}
            </View>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
        ) : isPremium ? (
          <TouchableOpacity style={[styles.secondaryBtn, { borderColor: colors.border }]} onPress={openPortal}>
            <Text style={[styles.secondaryText, { color: colors.text }]}>Manage subscription</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity style={[styles.cta, { backgroundColor: colors.primary }]} onPress={openCheckout} activeOpacity={0.9}>
              <Crown size={18} color="#fff" strokeWidth={2} />
              <Text style={styles.ctaText}>Go Pro · {PRO_PRICE_LABEL}</Text>
            </TouchableOpacity>
            <Text style={[styles.finePrint, { color: colors.textTertiary }]}>
              Payment is processed securely in your browser. Your Pro access
              activates automatically once payment completes.
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
    back: { fontSize: 28 },
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
      borderRadius: 14,
      borderWidth: 1,
      borderColor: cardBorder,
      backgroundColor: cardBg,
      padding: 14,
    },
    featureIcon: {
      width: 38,
      height: 38,
      borderRadius: 19,
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
