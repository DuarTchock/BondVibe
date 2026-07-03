/**
 * D2 — Host controls (Kinlo Pro). Configure Community Matching for an event:
 * match types, when it opens/closes, messaging, and the match cap. Non-Pro
 * hosts are routed to the upsell (E1). Writes via the server (setMatchingConfig).
 */
import React, { useState, useEffect } from "react";
import Icon from "../../components/Icon";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  Alert,
} from "react-native";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../services/firebase";
import { useTheme } from "../../contexts/ThemeContext";
import { usePremium } from "../../hooks/usePremium";
import { MatchHeader, PrimaryButton, Chip } from "./matchUi";
import {
  setMatchingConfig,
  MATCH_TYPES,
  OPENS_AT_OPTIONS,
  CLOSES_AFTER_OPTIONS,
  MAX_MATCHES_OPTIONS,
  MATCH_TYPE_COLORS,
} from "../../services/matchingService";

const OPENS_LABELS = {
  now: "Right now",
  "1h_before": "1 hour before start",
  after_checkin: "When the event starts",
  after_event: "When the event ends",
};
const CLOSES_LABELS = { "24h": "24 hours", "3d": "3 days", "1w": "1 week", forever: "Never" };
const maxLabel = (n) => (n === -1 ? "Unlimited" : String(n));

export default function HostMatchingControlsScreen({ route, navigation }) {
  const { colors } = useTheme();
  const { isPremium, loading: proLoading } = usePremium();
  const { eventId } = route.params || {};

  const [enabled, setEnabled] = useState(true);
  const [types, setTypes] = useState(["friend"]);
  const [opensAt, setOpensAt] = useState("after_event");
  const [closesAfter, setClosesAfter] = useState("1w");
  const [maxMatches, setMaxMatches] = useState(20);
  const [allowMessaging, setAllowMessaging] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const s = await getDoc(doc(db, "events", eventId));
      const m = s.exists() ? s.data().matching : null;
      if (m) {
        setEnabled(m.enabled !== false);
        setTypes(m.types?.length ? m.types : ["friend"]);
        setOpensAt(m.opensAt || "after_event");
        setClosesAfter(m.closesAfter || "1w");
        setMaxMatches(typeof m.maxMatches === "number" ? m.maxMatches : 20);
        setAllowMessaging(m.allowMessaging !== false);
      }
    })();
  }, [eventId]);

  const toggleType = (t) =>
    setTypes((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

  const onSave = async () => {
    if (enabled && types.length === 0) {
      Alert.alert("Pick a type", "Choose at least one match type.");
      return;
    }
    setSaving(true);
    try {
      await setMatchingConfig(eventId, {
        enabled,
        types,
        opensAt,
        closesAfter,
        maxMatches,
        allowMessaging,
      });
      Alert.alert("Saved", "Community Matching is set up for this event.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      const msg = e?.message?.includes("pro_required")
        ? "Community Matching is a Kinlo Pro feature."
        : "Couldn't save. Please try again.";
      Alert.alert("Oops", msg);
    } finally {
      setSaving(false);
    }
  };

  const styles = createStyles(colors);

  if (!proLoading && !isPremium) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <MatchHeader title="Community Matching" onBack={() => navigation.goBack()} />
        <View style={styles.upsell}>
          <Icon name="pro" size={44} color={colors.primary} />
          <Text style={[styles.upsellTitle, { color: colors.text }]}>
            Activate Community Matching with Kinlo Pro
          </Text>
          <Text style={[styles.upsellSub, { color: colors.textSecondary }]}>
            Let attendees connect after your events. Included in Kinlo Pro.
          </Text>
          <View style={{ height: 20 }} />
          <PrimaryButton
            label="Get Kinlo Pro"
            onPress={() => navigation.replace("ProUpsell", { eventId })}
          />
        </View>
      </View>
    );
  }

  const Section = ({ title, children }) => (
    <View style={styles.section}>
      <Text style={[styles.label, { color: colors.text }]}>{title}</Text>
      <View style={styles.chips}>{children}</View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <MatchHeader
        title="Community Matching"
        onBack={() => navigation.goBack()}
        right={
          <View style={[styles.proBadge, { backgroundColor: colors.primary }]}>
            <Icon name="pro" size={11} color="#fff" />
            <Text style={styles.proText}>PRO</Text>
          </View>
        }
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.rowBetween}>
          <Text style={[styles.label, { color: colors.text }]}>Enable for this event</Text>
          <Switch value={enabled} onValueChange={setEnabled} trackColor={{ true: colors.primary }} />
        </View>

        <Section title="Match types">
          {MATCH_TYPES.map((t) => {
            const c = MATCH_TYPE_COLORS[t] || {};
            return (
              <Chip
                key={t}
                label={t[0].toUpperCase() + t.slice(1)}
                selected={types.includes(t)}
                onPress={() => toggleType(t)}
                fg={c.fg}
                bg={c.bg}
              />
            );
          })}
        </Section>

        <Section title="Opens">
          {OPENS_AT_OPTIONS.map((o) => (
            <Chip key={o} label={OPENS_LABELS[o]} selected={opensAt === o} onPress={() => setOpensAt(o)} />
          ))}
        </Section>

        <Section title="Closes after">
          {CLOSES_AFTER_OPTIONS.map((o) => (
            <Chip key={o} label={CLOSES_LABELS[o]} selected={closesAfter === o} onPress={() => setClosesAfter(o)} />
          ))}
        </Section>

        <Section title="Max matches per attendee">
          {MAX_MATCHES_OPTIONS.map((n) => (
            <Chip key={n} label={maxLabel(n)} selected={maxMatches === n} onPress={() => setMaxMatches(n)} />
          ))}
        </Section>
        <Text style={[styles.hint, { color: colors.textTertiary }]}>
          Past the cap, attendees can upgrade to Kinlo Plus to keep matching.
        </Text>

        <View style={styles.rowBetween}>
          <Text style={[styles.label, { color: colors.text }]}>Allow messaging on match</Text>
          <Switch value={allowMessaging} onValueChange={setAllowMessaging} trackColor={{ true: colors.primary }} />
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <PrimaryButton label="Save" onPress={onSave} loading={saving} />
      </View>
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: { flex: 1 },
    content: { paddingHorizontal: 24, paddingBottom: 20 },
    section: { marginBottom: 20 },
    label: { fontSize: 15, fontWeight: "700", marginBottom: 10 },
    chips: { flexDirection: "row", flexWrap: "wrap" },
    rowBetween: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 20,
    },
    hint: { fontSize: 12.5, lineHeight: 18, marginTop: -8, marginBottom: 20 },
    footer: { paddingHorizontal: 24, paddingBottom: 28, paddingTop: 6 },
    proBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      borderRadius: 10,
      paddingHorizontal: 7,
      paddingVertical: 3,
    },
    proText: { color: "#fff", fontSize: 11, fontWeight: "800" },
    upsell: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
    upsellTitle: { fontSize: 22, fontWeight: "800", textAlign: "center", marginTop: 16 },
    upsellSub: { fontSize: 15, textAlign: "center", lineHeight: 22, marginTop: 10 },
  });
}
