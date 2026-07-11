/**
 * MembershipCard — the digital membership / loyalty card (dashboard handoff
 * §paper-stack). Replaces a plastic punch card: a real gradient card with the
 * check-in QR, membership status + credits, and loyalty stamps that auto-fill on
 * attendance (member.visitsTotal). Shared by the host card screen and the
 * attendee's own "my memberships" view.
 *
 * HONESTY: membership status is the pass's real state (getMembershipState of the
 * active package), NOT the CRM engagement label. There is no auto-renew, so the
 * date is shown as "Expires", never "Renews".
 */
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import QRCode from "react-native-qrcode-svg";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../contexts/ThemeContext";
import { buildBusinessPassPayload } from "../../services/businessPassService";
import { loyaltyProgress } from "../../services/businessAttendanceService";
import { getMembershipState, getMembershipExpiryDate } from "../../utils/membershipUtils";
import { FONTS } from "../../constants/theme-tokens";

const CARD_GRADIENT = ["#2A1E3D", "#4A2A6E"]; // membership card (135°)
const CARD_BORDER = "#ECE8F2";

export default function MembershipCard({ pass }) {
  const { colors, isDark } = useTheme();
  const { t, i18n } = useTranslation();
  if (!pass?.bizId || !pass?.memberId) return null;

  const pkg = pass.activePackage || null;
  const credits = pass.creditBalance || 0;
  const state = pkg ? getMembershipState(pkg) : "none";
  const expiry = pkg ? getMembershipExpiryDate(pkg) : null;
  const { size, filledInCycle, rewardsEarned } = loyaltyProgress(pass.visitsTotal);
  const remaining = size - filledInCycle;

  const styles = createStyles(colors);
  const cardBorder = isDark ? colors.border : CARD_BORDER;

  return (
    <View>
      {/* Two flat top sub-cards */}
      <View style={styles.topRow}>
        <View style={[styles.subCard, { backgroundColor: colors.surface, borderColor: cardBorder }]}>
          <Text style={[styles.subLabel, { color: colors.textTertiary }]}>{t("business.card.classCredits")}</Text>
          <Text style={[styles.subValue, { color: colors.text }]}>
            {credits}
            {pkg?.creditsTotal ? <Text style={[styles.subDen, { color: colors.textTertiary }]}> / {pkg.creditsTotal}</Text> : null}
          </Text>
        </View>
        <View style={[styles.subCard, { backgroundColor: colors.surface, borderColor: cardBorder }]}>
          <Text style={[styles.subLabel, { color: colors.textTertiary }]}>{t("business.card.membership")}</Text>
          <Text style={[styles.subState, { color: state === "active" ? colors.success : state === "none" ? colors.textTertiary : "#C2410C" }]}>
            {t(`business.card.state.${state}`)}
          </Text>
          {expiry && state !== "none" && (
            <Text style={[styles.subSub, { color: colors.textTertiary }]}>
              {t("business.card.expires", { date: expiry.toLocaleDateString(i18n.language, { day: "numeric", month: "short" }) })}
            </Text>
          )}
        </View>
      </View>

      {/* Gradient membership card with QR */}
      <View style={styles.cardShadow}>
        <LinearGradient colors={CARD_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
          <Text style={styles.biz} numberOfLines={1}>{pass.businessName || t("business.pass.defaultBusiness")}</Text>
          {!!pass.memberName && <Text style={styles.member} numberOfLines={1}>{pass.memberName}</Text>}
          <View style={styles.qrWrap}>
            <QRCode value={buildBusinessPassPayload(pass.bizId, pass.memberId)} size={168} />
          </View>
          <Text style={styles.hint}>{t("business.card.showHint")}</Text>
        </LinearGradient>
      </View>

      {/* Loyalty stamps */}
      <View style={[styles.loyaltyCard, { backgroundColor: colors.surface, borderColor: cardBorder }]}>
        <View style={styles.loyaltyHead}>
          <Text style={[styles.loyaltyTitle, { color: colors.text }]}>{t("business.card.loyalty")}</Text>
          <Text style={[styles.loyaltyProgress, { color: colors.textSecondary }]}>
            {filledInCycle === size - 1 ? t("business.card.rewardReady") : t("business.card.toReward", { count: remaining })}
          </Text>
        </View>
        <View style={styles.stampGrid}>
          {Array.from({ length: size }, (_, i) => {
            const isReward = i === size - 1;
            if (isReward) {
              const lit = filledInCycle === size - 1;
              return (
                <View key={i} style={[styles.stamp, lit ? styles.rewardLit : styles.rewardEmpty]}>
                  <Text style={styles.stampEmoji}>🎁</Text>
                </View>
              );
            }
            const filled = i < filledInCycle;
            return (
              <View key={i} style={[styles.stamp, filled ? styles.stampFilled : styles.stampEmpty]}>
                {filled && <Text style={styles.stampCheck}>✓</Text>}
              </View>
            );
          })}
        </View>
        {rewardsEarned > 0 && (
          <Text style={[styles.rewardsEarned, { color: colors.textTertiary }]}>{t("business.card.rewardsEarned", { count: rewardsEarned })}</Text>
        )}
      </View>
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    topRow: { flexDirection: "row", gap: 12, marginBottom: 14 },
    subCard: { flex: 1, borderWidth: 1, borderRadius: 16, padding: 14 },
    subLabel: { fontFamily: FONTS.bodyBold, fontSize: 10.5, letterSpacing: 0.6, textTransform: "uppercase" },
    subValue: { fontFamily: FONTS.display, fontSize: 26, letterSpacing: -0.5, marginTop: 6 },
    subDen: { fontFamily: FONTS.display, fontSize: 15 },
    subState: { fontFamily: FONTS.bodyExtra, fontSize: 17, marginTop: 6 },
    subSub: { fontFamily: FONTS.bodyMedium, fontSize: 11.5, marginTop: 3 },
    cardShadow: {
      borderRadius: 20,
      shadowColor: "rgba(42,30,61,1)",
      shadowOpacity: 0.35,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 12 },
      elevation: 8,
    },
    card: { borderRadius: 20, padding: 20, alignItems: "center" },
    biz: { fontFamily: FONTS.display, fontSize: 19, color: "#fff", letterSpacing: -0.3 },
    member: { fontFamily: FONTS.bodyMedium, fontSize: 13, color: "rgba(255,255,255,0.75)", marginTop: 3 },
    qrWrap: { backgroundColor: "#fff", padding: 16, borderRadius: 16, marginTop: 16, marginBottom: 14 },
    hint: { fontFamily: FONTS.bodyMedium, fontSize: 12, color: "rgba(255,255,255,0.7)", textAlign: "center" },
    loyaltyCard: { borderWidth: 1, borderRadius: 16, padding: 15, marginTop: 14 },
    loyaltyHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
    loyaltyTitle: { fontFamily: FONTS.bodyExtra, fontSize: 14.5 },
    loyaltyProgress: { fontFamily: FONTS.bodySemibold, fontSize: 12 },
    stampGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    stamp: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
    stampFilled: { backgroundColor: "#7C3AED" },
    stampEmpty: { backgroundColor: "#F1ECF8", borderWidth: 1.5, borderStyle: "dashed", borderColor: "#C9B0F2" },
    stampCheck: { color: "#fff", fontSize: 18, fontWeight: "800" },
    rewardEmpty: { backgroundColor: "#FDE8D6", borderWidth: 1.5, borderStyle: "dashed", borderColor: "#E8A33D" },
    rewardLit: { backgroundColor: "#E8A33D" },
    stampEmoji: { fontSize: 20 },
    rewardsEarned: { fontFamily: FONTS.bodyMedium, fontSize: 11.5, marginTop: 12 },
  });
}
