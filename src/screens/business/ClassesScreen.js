/**
 * ClassesScreen — the weekly schedule (kinlo_business/01 §5). Weekday tabs show
 * the classes on that day with instructor, time, location and a capacity bar.
 */
import React, { useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Icon from "../../components/Icon";
import GradientBackground from "../../components/GradientBackground";
import { useTheme } from "../../contexts/ThemeContext";
import { listClasses, classesOnWeekday } from "../../services/businessClassesService";

// Jan 7 2024 is a Sunday → localized short weekday names 0=Sun..6=Sat.
const weekdayShort = (i, lang) =>
  new Date(2024, 0, 7 + i).toLocaleDateString(lang || "en", { weekday: "short" });

export default function ClassesScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [day, setDay] = useState(new Date().getDay());

  const load = useCallback(async () => {
    setClasses(await listClasses());
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const dayClasses = classesOnWeekday(classes, day);
  const styles = createStyles(colors);

  return (
    <GradientBackground>
      <StatusBar style={isDark ? "light" : "dark"} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t("business.classes.title")}</Text>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={() => navigation.navigate("BusinessClassForm", {})}>
          <Icon name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.dayRow}>
        {[0, 1, 2, 3, 4, 5, 6].map((d) => {
          const active = day === d;
          return (
            <TouchableOpacity key={d} onPress={() => setDay(d)} style={[styles.dayTab, { backgroundColor: active ? colors.text : colors.surfaceGlass }]}>
              <Text style={[styles.dayText, { color: active ? colors.background : colors.textSecondary }]}>{weekdayShort(d, i18n.language)}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : classes.length === 0 ? (
        <View style={styles.empty}>
          <View style={[styles.emptyArt, { backgroundColor: colors.brandSoft }]}>
            <Icon name="calendar" size={32} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>{t("business.classes.emptyTitle")}</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t("business.classes.emptyText")}</Text>
          <TouchableOpacity style={[styles.cta, { backgroundColor: colors.primary }]} onPress={() => navigation.navigate("BusinessClassForm", {})}>
            <Text style={styles.ctaText}>{t("business.classes.addFirst")}</Text>
          </TouchableOpacity>
        </View>
      ) : dayClasses.length === 0 ? (
        <View style={styles.dayEmpty}>
          <Text style={[styles.dayEmptyText, { color: colors.textTertiary }]}>{t("business.classes.noneToday")}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {dayClasses.map((c) => {
            const rosterN = (c.roster || []).length;
            const waitN = (c.waitlist || []).length;
            const pct = Math.min(1, rosterN / (c.capacity || 1));
            const full = rosterN >= (c.capacity || 1);
            return (
              <TouchableOpacity
                key={c.id}
                style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderLeftColor: colors.primary }]}
                onPress={() => navigation.navigate("BusinessClassRoster", { classId: c.id })}
                activeOpacity={0.85}
              >
                <View style={styles.cardTop}>
                  <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>{c.title}</Text>
                  <Text style={[styles.cardTime, { color: colors.primary }]}>{c.time}</Text>
                </View>
                {!!(c.instructor || c.location) && (
                  <Text style={[styles.cardMeta, { color: colors.textTertiary }]} numberOfLines={1}>
                    {[c.instructor, c.location].filter(Boolean).join(" · ")}
                  </Text>
                )}
                <View style={styles.capRow}>
                  <View style={[styles.capTrack, { backgroundColor: colors.border }]}>
                    <View style={[styles.capFill, { width: `${pct * 100}%`, backgroundColor: full ? colors.warning : colors.primary }]} />
                  </View>
                  <Text style={[styles.capText, { color: full ? colors.warning : colors.textSecondary }]}>
                    {rosterN}/{c.capacity}{waitN > 0 ? ` · +${waitN}` : ""}
                  </Text>
                </View>
                {c.public && (
                  <View style={[styles.publicTag, { backgroundColor: `${colors.success}18` }]}>
                    <Text style={[styles.publicText, { color: colors.success }]}>{t("business.classes.public")}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </GradientBackground>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 60, paddingBottom: 10 },
    headerTitle: { fontSize: 20, fontWeight: "800" },
    addBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
    dayRow: { flexDirection: "row", paddingHorizontal: 16, gap: 6, paddingBottom: 10 },
    dayTab: { flex: 1, paddingVertical: 9, borderRadius: 12, alignItems: "center" },
    dayText: { fontSize: 11.5, fontWeight: "700" },
    loading: { flex: 1, justifyContent: "center", alignItems: "center" },
    content: { paddingHorizontal: 20, paddingBottom: 40 },
    card: { borderWidth: 1, borderLeftWidth: 3, borderRadius: 14, padding: 14, marginBottom: 12 },
    cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
    cardTitle: { fontSize: 15.5, fontWeight: "800", flex: 1 },
    cardTime: { fontSize: 13, fontWeight: "800" },
    cardMeta: { fontSize: 12.5, marginTop: 3 },
    capRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 12 },
    capTrack: { flex: 1, height: 6, borderRadius: 3, overflow: "hidden" },
    capFill: { height: 6, borderRadius: 3 },
    capText: { fontSize: 11.5, fontWeight: "700" },
    publicTag: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 10 },
    publicText: { fontSize: 10.5, fontWeight: "700" },
    dayEmpty: { flex: 1, alignItems: "center", justifyContent: "center" },
    dayEmptyText: { fontSize: 14 },
    empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 36 },
    emptyArt: { width: 64, height: 64, borderRadius: 18, alignItems: "center", justifyContent: "center", marginBottom: 16 },
    emptyTitle: { fontSize: 18, fontWeight: "800", marginBottom: 8, textAlign: "center" },
    emptyText: { fontSize: 14, textAlign: "center", lineHeight: 20, marginBottom: 20 },
    cta: { borderRadius: 24, paddingVertical: 13, paddingHorizontal: 28 },
    ctaText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  });
}
