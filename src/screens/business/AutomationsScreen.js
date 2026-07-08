/**
 * AutomationsScreen — lifecycle automation rules (kinlo_business/04). List +
 * activate/deactivate + quick send-now; entry to the delivery log. The engine
 * auto-routes each message to the best channel per member (server-side).
 */
import React, { useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, ActivityIndicator, Alert } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Icon from "../../components/Icon";
import GradientBackground from "../../components/GradientBackground";
import ListRow from "../../components/ListRow";
import { useTheme } from "../../contexts/ThemeContext";
import { listRules, updateRule, sendNow, SCHEDULED_TRIGGERS } from "../../services/businessAutomationsService";

export default function AutomationsScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setRules(await listRules());
    setLoading(false);
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const toggle = async (r) => {
    setRules((cur) => cur.map((x) => (x.id === r.id ? { ...x, active: !x.active } : x)));
    await updateRule(r.id, { active: !r.active });
  };

  const send = (r) =>
    Alert.alert(t("business.automations.sendNowTitle"), t("business.automations.sendNowMsg"), [
      { text: t("business.common.cancel"), style: "cancel" },
      {
        text: t("business.automations.send"),
        onPress: async () => {
          const res = await sendNow({ message: r.message, audience: r.audience, channels: r.channels, ruleId: r.id });
          Alert.alert(t("business.automations.sentTitle"), t("business.automations.sentMsg", { sent: res.sent, skipped: res.skipped }));
        },
      },
    ]);

  const styles = createStyles(colors);
  return (
    <GradientBackground>
      <StatusBar style={isDark ? "light" : "dark"} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Icon name="back" size={26} color={colors.text} /></TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t("business.automations.title")}</Text>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={() => navigation.navigate("BusinessAutomationForm", {})}><Icon name="plus" size={20} color="#fff" /></TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loading}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ListRow icon="broadcast" title={t("business.automations.log")} onPress={() => navigation.navigate("BusinessMessageLog")} divider={false} />
          </View>

          {rules.length === 0 ? (
            <View style={styles.empty}>
              <View style={[styles.emptyArt, { backgroundColor: colors.brandSoft }]}><Icon name="broadcast" size={30} color={colors.primary} /></View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>{t("business.automations.emptyTitle")}</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t("business.automations.emptyText")}</Text>
              <TouchableOpacity style={[styles.cta, { backgroundColor: colors.primary }]} onPress={() => navigation.navigate("BusinessAutomationForm", {})}><Text style={styles.ctaText}>{t("business.automations.addFirst")}</Text></TouchableOpacity>
            </View>
          ) : (
            rules.map((r) => (
              <View key={r.id} style={[styles.ruleCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <TouchableOpacity style={{ flex: 1 }} onPress={() => navigation.navigate("BusinessAutomationForm", { ruleId: r.id })}>
                  <View style={styles.ruleTop}>
                    <Text style={[styles.ruleTrigger, { color: colors.text }]}>{t(`business.automations.trigger.${r.trigger}`)}</Text>
                    {SCHEDULED_TRIGGERS.includes(r.trigger) && <View style={[styles.autoTag, { backgroundColor: `${colors.success}18` }]}><Text style={[styles.autoText, { color: colors.success }]}>{t("business.automations.auto")}</Text></View>}
                  </View>
                  <Text style={[styles.ruleMeta, { color: colors.textTertiary }]} numberOfLines={1}>
                    {t(`business.automations.audience.${r.audience?.type || "all"}`)} · {(r.channels || []).map((c) => t(`business.automations.channel.${c}`)).join(", ")}
                  </Text>
                  {!!r.message && <Text style={[styles.ruleMsg, { color: colors.textSecondary }]} numberOfLines={2}>{r.message}</Text>}
                </TouchableOpacity>
                <View style={styles.ruleActions}>
                  <Switch value={r.active !== false} onValueChange={() => toggle(r)} trackColor={{ true: colors.primary }} />
                  <TouchableOpacity style={[styles.sendBtn, { borderColor: colors.border }]} onPress={() => send(r)}><Text style={[styles.sendText, { color: colors.primary }]}>{t("business.automations.sendNow")}</Text></TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </GradientBackground>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12 },
    headerTitle: { fontSize: 20, fontWeight: "800" },
    addBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
    loading: { flex: 1, justifyContent: "center", alignItems: "center" },
    content: { paddingHorizontal: 20, paddingBottom: 40 },
    card: { borderWidth: 1, borderRadius: 14, overflow: "hidden", marginBottom: 12 },
    ruleCard: { flexDirection: "row", gap: 12, borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 10 },
    ruleTop: { flexDirection: "row", alignItems: "center", gap: 8 },
    ruleTrigger: { fontSize: 15, fontWeight: "800" },
    autoTag: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 7 },
    autoText: { fontSize: 9.5, fontWeight: "800" },
    ruleMeta: { fontSize: 12, marginTop: 3 },
    ruleMsg: { fontSize: 12.5, marginTop: 6, lineHeight: 17 },
    ruleActions: { alignItems: "flex-end", gap: 8 },
    sendBtn: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6 },
    sendText: { fontSize: 12, fontWeight: "700" },
    empty: { alignItems: "center", justifyContent: "center", paddingHorizontal: 36, paddingTop: 40 },
    emptyArt: { width: 60, height: 60, borderRadius: 18, alignItems: "center", justifyContent: "center", marginBottom: 16 },
    emptyTitle: { fontSize: 18, fontWeight: "800", marginBottom: 8, textAlign: "center" },
    emptyText: { fontSize: 14, textAlign: "center", lineHeight: 20, marginBottom: 20 },
    cta: { borderRadius: 24, paddingVertical: 13, paddingHorizontal: 28 },
    ctaText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  });
}
