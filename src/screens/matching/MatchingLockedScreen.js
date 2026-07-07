/**
 * B2 — Locked. Shown while now < opensAt. Builds anticipation: a lock, a live
 * countdown, a blurred teaser of who's there, and a way to set up a profile or
 * be notified. The grid stays hidden until the window opens (§3 hard rule).
 */
import React, { useState, useEffect } from "react";
import Icon from "../../components/Icon";
import { View, Text, StyleSheet, Alert } from "react-native";
import { doc, getDoc } from "firebase/firestore";
import { useTranslation } from "react-i18next";
import { db } from "../../services/firebase";
import { useTheme } from "../../contexts/ThemeContext";
import { MatchHeader, PrimaryButton, SecondaryButton } from "./matchUi";
import { useMatchingWindow } from "../../hooks/useMatchingWindow";
import { getMyMatchProfile } from "../../services/matchingService";

function countdown(ms, openingLabel) {
  if (ms <= 0) return openingLabel;
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${String(sec).padStart(2, "0")}s`;
  return `${m}m ${String(sec).padStart(2, "0")}s`;
}

export default function MatchingLockedScreen({ route, navigation }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { eventId, eventTitle } = route.params || {};
  const [event, setEvent] = useState(null);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    (async () => {
      const [eSnap, mine] = await Promise.all([
        getDoc(doc(db, "events", eventId)),
        getMyMatchProfile(eventId),
      ]);
      if (eSnap.exists()) setEvent({ id: eSnap.id, ...eSnap.data() });
      setHasProfile(!!mine);
    })();
  }, [eventId]);

  const { msUntilOpen, isOpen } = useMatchingWindow(event || {});

  useEffect(() => {
    // The moment it opens, jump straight to the grid.
    if (event && isOpen) navigation.replace("MatchGrid", { eventId, eventTitle });
  }, [isOpen, event]);

  const styles = createStyles(colors);
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <MatchHeader title={t("matching.locked.title")} onBack={() => navigation.goBack()} />
      <View style={styles.center}>
        <View style={[styles.lockWrap, { backgroundColor: `${colors.primary}15` }]}>
          <Icon name="lock" size={40} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>
          {t("matching.locked.opensWhenEnds")}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {t("matching.locked.subtitle")}
        </Text>

        <Text style={[styles.count, { color: colors.primary }]}>
          {countdown(msUntilOpen, t("matching.locked.opening"))}
        </Text>

        {/* Blurred teaser row */}
        <View style={styles.teaser}>
          {[0, 1, 2, 3, 4].map((i) => (
            <View
              key={i}
              style={[
                styles.teaserAvatar,
                {
                  backgroundColor: colors.surfaceGlass,
                  borderColor: colors.border,
                  marginLeft: i === 0 ? 0 : -12,
                  opacity: 0.5 - i * 0.06,
                },
              ]}
            />
          ))}
          <Text style={[styles.teaserText, { color: colors.textTertiary }]}>
            {t("matching.locked.peopleAreHere")}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        {hasProfile ? (
          <PrimaryButton
            label={t("matching.locked.notifyMe")}
            onPress={() =>
              Alert.alert(
                t("matching.locked.notifySetTitle"),
                t("matching.locked.notifySetMsg"),
                [{ text: t("matching.locked.ok"), onPress: () => navigation.goBack() }]
              )
            }
          />
        ) : (
          <PrimaryButton
            label={t("matching.locked.joinSetup")}
            onPress={() => navigation.replace("MatchConsent", { eventId, eventTitle })}
          />
        )}
        <SecondaryButton label={t("matching.locked.backToEvent")} onPress={() => navigation.goBack()} />
      </View>
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, alignItems: "center", paddingHorizontal: 28, justifyContent: "center" },
    lockWrap: {
      width: 88,
      height: 88,
      borderRadius: 44,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 22,
    },
    title: {
      fontSize: 23,
      fontWeight: "800",
      textAlign: "center",
      letterSpacing: -0.3,
      marginBottom: 10,
    },
    subtitle: { fontSize: 15, textAlign: "center", lineHeight: 22 },
    count: { fontSize: 34, fontWeight: "800", marginTop: 26, letterSpacing: -0.5 },
    teaser: { flexDirection: "row", alignItems: "center", marginTop: 26 },
    teaserAvatar: { width: 34, height: 34, borderRadius: 17, borderWidth: 1.5 },
    teaserText: { fontSize: 13, marginLeft: 12 },
    footer: { paddingHorizontal: 24, paddingBottom: 28, gap: 6 },
  });
}
