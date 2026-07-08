/**
 * AgendaScreen — a real day calendar per instructor (kinlo_business/06 FIX 4/5).
 * 1-hour gridlines with HH:mm labels; blocks sized by their true duration
 * (15/30/45/60/90/custom via DurationWheelModal). The day merges EVENTS +
 * CLASSES + PRIVATE SESSIONS + block-off for the chosen instructor, framed by
 * that instructor's working hours. "All" gives the director every instructor's
 * day at a glance. The booking-requests inbox stays as a banner. Reception sees
 * a read-only day (check-in only).
 */
import React, { useState, useCallback, useMemo } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator,
  Modal, TextInput,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "../../components/Icon";
import GradientBackground from "../../components/GradientBackground";
import DurationWheelModal, { formatDuration } from "../../components/DurationWheelModal";
import { useTheme } from "../../contexts/ThemeContext";
import { BRAND } from "../../constants/theme-tokens";
import { auth } from "../../services/firebase";
import { listStaff, getWorkingHours } from "../../services/businessStaffService";
import {
  getDayItems, getAllDayItems, createAgendaBlock, deleteAgendaBlock, AGENDA_ITEM_KIND,
} from "../../services/businessAgendaService";
import { listBookings, confirmBooking, declineBooking, BOOKING_STATUS } from "../../services/businessSessionsService";

const HOUR_H = 64; // px per hour
const pad2 = (n) => String(n).padStart(2, "0");
const hhmm = (d) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
const minsFromMidnight = (d) => d.getHours() * 60 + d.getMinutes();
const hourToMin = (t) => { const [h, m] = String(t || "7:0").split(":").map((n) => parseInt(n, 10) || 0); return h * 60 + m; };
const initials = (name = "") =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";

export default function AgendaScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { t, i18n } = useTranslation();

  const days = useMemo(() => {
    const base = new Date(); base.setHours(0, 0, 0, 0);
    return Array.from({ length: 14 }, (_, i) => { const d = new Date(base); d.setDate(base.getDate() + i); return d; });
  }, []);

  const [date, setDate] = useState(days[0]);
  const [staff, setStaff] = useState([]);
  const [selected, setSelected] = useState("all"); // 'all' | instructorUid
  const [myRole, setMyRole] = useState("owner");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fullDay, setFullDay] = useState(false);
  const [requests, setRequests] = useState([]);
  const [showRequests, setShowRequests] = useState(false);
  const [slotModal, setSlotModal] = useState(null); // { min }
  const [blockDraft, setBlockDraft] = useState(null); // { min, label, durationMin }
  const [durationWheel, setDurationWheel] = useState(false);

  const isReception = myRole === "reception";
  const selStaff = staff.find((s) => s.id === selected);
  const wh = getWorkingHours(selStaff);
  const startMin = fullDay ? 0 : hourToMin(wh.start);
  const endMin = fullDay ? 24 * 60 : hourToMin(wh.end);
  const startHour = Math.floor(startMin / 60);
  const endHour = Math.ceil(endMin / 60);
  const hours = [];
  for (let h = startHour; h < endHour; h++) hours.push(h);

  const loadStaff = useCallback(async () => {
    const list = await listStaff();
    const withSelf = list.length ? list : [{ id: auth.currentUser?.uid, name: "", role: "owner" }];
    setStaff(withSelf);
    const meRole = withSelf.find((s) => s.id === auth.currentUser?.uid)?.role || "owner";
    setMyRole(meRole);
    // Reception can't use the director view — pin them to their own day.
    setSelected((cur) => (meRole === "reception" ? auth.currentUser?.uid : cur));
  }, []);

  const loadDay = useCallback(async () => {
    setLoading(true);
    if (selected === "all") {
      const { items: it } = await getAllDayItems(date);
      setItems(it);
    } else {
      const it = await getDayItems(selected, selStaff?.name, date);
      setItems(it);
    }
    const bk = await listBookings();
    setRequests(bk.filter((b) => b.status === BOOKING_STATUS.REQUESTED));
    setLoading(false);
  }, [selected, selStaff?.name, date]);

  useFocusEffect(useCallback(() => { loadStaff(); }, [loadStaff]));
  useFocusEffect(useCallback(() => { loadDay(); }, [loadDay]));

  const kindColor = (kind) => ({
    [AGENDA_ITEM_KIND.EVENT]: colors.warning,
    [AGENDA_ITEM_KIND.CLASS]: colors.primary,
    [AGENDA_ITEM_KIND.SESSION]: colors.success,
    [AGENDA_ITEM_KIND.BLOCKED]: colors.textTertiary,
  }[kind] || colors.primary);

  const openSlot = (min) => { if (!isReception) setSlotModal({ min }); };

  const startNewSession = () => {
    const start = new Date(date);
    start.setHours(Math.floor(slotModal.min / 60), slotModal.min % 60, 0, 0);
    const m = slotModal.min; setSlotModal(null);
    navigation.navigate("BusinessBookingForm", {
      start: start.toISOString(),
      instructorUid: selected === "all" ? auth.currentUser?.uid : selected,
      time: `${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`,
    });
  };

  const openBlockDraft = () => { setBlockDraft({ min: slotModal.min, label: "", durationMin: 60 }); setSlotModal(null); };

  const saveBlock = async () => {
    const target = selected === "all" ? auth.currentUser?.uid : selected;
    const start = new Date(date);
    start.setHours(Math.floor(blockDraft.min / 60), blockDraft.min % 60, 0, 0);
    const end = new Date(start.getTime() + blockDraft.durationMin * 60000);
    await createAgendaBlock({ staffUid: target, start, end, label: blockDraft.label, type: "blocked" });
    setBlockDraft(null);
    loadDay();
  };

  const onItemPress = (item) => {
    if (item.kind === AGENDA_ITEM_KIND.SESSION && item.bookingId) {
      navigation.navigate("BusinessSessionDetail", { bookingId: item.bookingId });
    } else if (item.kind === AGENDA_ITEM_KIND.EVENT) {
      navigation.navigate("EventDetail", { eventId: item.id.replace("event_", "") });
    } else if (item.kind === AGENDA_ITEM_KIND.CLASS) {
      navigation.navigate("BusinessClassRoster", { classId: item.id.replace("class_", "") });
    } else if (item.kind === AGENDA_ITEM_KIND.BLOCKED && !isReception) {
      deleteAgendaBlock(item.id).then(loadDay);
    }
  };

  const styles = createStyles(colors);
  const dayName = (d) => d.toLocaleDateString(i18n.language, { weekday: "short" }).toUpperCase();
  const chips = [{ id: "all", name: t("business.agenda.all") }, ...staff.filter((s) => s.role === "owner" || s.role === "instructor").map((s) => ({ id: s.id, name: s.name || t("business.agenda.you") }))];

  return (
    <GradientBackground>
      <StatusBar style={isDark ? "light" : "dark"} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Icon name="back" size={26} color={colors.text} /></TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t("business.agenda.title")}</Text>
        <TouchableOpacity onPress={() => setFullDay((v) => !v)}>
          <Icon name="clock" size={22} color={fullDay ? colors.primary : colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Day strip */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayStrip}>
        {days.map((d) => {
          const on = d.toDateString() === date.toDateString();
          return (
            <TouchableOpacity key={d.toISOString()} onPress={() => setDate(d)} style={[styles.dayCell, { backgroundColor: on ? colors.text : colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.dayName, { color: on ? colors.background : colors.textTertiary }]}>{dayName(d)}</Text>
              <Text style={[styles.dayNum, { color: on ? colors.background : colors.text }]}>{d.getDate()}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Instructor chips (All first) — hidden for reception */}
      {!isReception && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.staffStrip}>
          {chips.map((c) => {
            const on = c.id === selected;
            return (
              <TouchableOpacity key={c.id} onPress={() => setSelected(c.id)} style={[styles.staffChip, { backgroundColor: on ? colors.primary : colors.surface, borderColor: on ? colors.primary : colors.border }]}>
                {c.id !== "all" && (
                  <View style={[styles.staffAvatar, { backgroundColor: on ? "rgba(255,255,255,0.25)" : colors.brandSoft }]}>
                    <Text style={[styles.staffAvatarText, { color: on ? "#fff" : colors.primary }]}>{initials(c.name)}</Text>
                  </View>
                )}
                <Text style={[styles.staffName, { color: on ? "#fff" : colors.text }]} numberOfLines={1}>{c.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Requests inbox banner */}
      {requests.length > 0 && (
        <TouchableOpacity style={[styles.reqBanner, { backgroundColor: `${colors.warning}18`, borderColor: `${colors.warning}44` }]} onPress={() => setShowRequests(true)}>
          <Icon name="calendarCheck" size={16} color={colors.warning} />
          <Text style={[styles.reqText, { color: colors.warning }]}>{t("business.agenda.requestsPending", { count: requests.length })}</Text>
          <Icon name="forward" size={16} color={colors.warning} />
        </TouchableOpacity>
      )}

      {/* Legend */}
      <View style={styles.legend}>
        {[
          { c: colors.warning, k: t("business.agenda.legendEvent") },
          { c: colors.primary, k: t("business.agenda.class") },
          { c: colors.success, k: t("business.agenda.legendPrivate") },
          { c: colors.textTertiary, k: t("business.agenda.blocked") },
        ].map((l, i) => (
          <View key={i} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: l.c }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>{l.k}</Text>
          </View>
        ))}
      </View>

      {loading ? (
        <View style={styles.loading}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : selected === "all" ? (
        /* Director view — compact merged list grouped by time, with instructor. */
        <ScrollView contentContainerStyle={styles.allList}>
          {items.length === 0 ? (
            <Text style={[styles.emptyAll, { color: colors.textTertiary }]}>{t("business.agenda.emptyDay")}</Text>
          ) : items.map((item) => (
            <TouchableOpacity key={`${item.instructorUid}_${item.id}`} style={[styles.allRow, { borderColor: colors.border }]} onPress={() => onItemPress(item)}>
              <Text style={[styles.allTime, { color: colors.textSecondary }]}>{hhmm(item.start)}</Text>
              <View style={[styles.allBar, { backgroundColor: kindColor(item.kind) }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.allTitle, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
                <Text style={[styles.allSub, { color: colors.textTertiary }]} numberOfLines={1}>
                  {(item.instructorName || t("business.agenda.you"))}{item.subtitle ? ` · ${item.subtitle}` : ""}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        /* Single-instructor day grid */
        <ScrollView contentContainerStyle={{ height: hours.length * HOUR_H + 20 }} showsVerticalScrollIndicator={false}>
          {hours.map((h, idx) => (
            <TouchableOpacity key={h} activeOpacity={0.6} style={[styles.hourRow, { height: HOUR_H, borderTopColor: colors.border, top: idx * HOUR_H }]} onPress={() => openSlot(h * 60)}>
              <Text style={[styles.hourLabel, { color: colors.textTertiary }]}>{pad2(h)}:00</Text>
            </TouchableOpacity>
          ))}
          {items.map((item) => {
            const top = ((minsFromMidnight(item.start) - startMin) / 60) * HOUR_H;
            if (top < -HOUR_H || top > hours.length * HOUR_H) return null;
            const dur = Math.max(15, (item.end - item.start) / 60000);
            const height = Math.max(26, (dur / 60) * HOUR_H - 4);
            const range = `${hhmm(item.start)}–${hhmm(item.end)}`;
            if (item.kind === AGENDA_ITEM_KIND.BLOCKED) {
              return (
                <TouchableOpacity key={item.id} activeOpacity={0.8} onPress={() => onItemPress(item)} style={[styles.blockCard, { top: top + 2, height, borderColor: colors.border, backgroundColor: colors.surfaceGlass }]}>
                  <Icon name="lock" size={12} color={colors.textTertiary} />
                  <Text style={[styles.blockText, { color: colors.textSecondary }]} numberOfLines={1}>{t("business.agenda.unavailable")}{item.label ? ` · ${item.label}` : ""} {range}</Text>
                </TouchableOpacity>
              );
            }
            const c = kindColor(item.kind);
            return (
              <TouchableOpacity key={item.id} activeOpacity={0.85} onPress={() => onItemPress(item)} style={[styles.itemCard, { top: top + 2, height, overflow: "hidden" }]}>
                {item.kind === AGENDA_ITEM_KIND.CLASS ? (
                  <LinearGradient colors={BRAND.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                ) : (
                  <View style={[StyleSheet.absoluteFill, { backgroundColor: c }]} />
                )}
                <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                {height > 40 && <Text style={styles.itemMeta} numberOfLines={1}>{range}{item.subtitle ? ` · ${item.subtitle}` : ""}</Text>}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Empty-slot action sheet */}
      <Modal visible={!!slotModal} transparent animationType="fade" onRequestClose={() => setSlotModal(null)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setSlotModal(null)}>
          <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>{slotModal ? `${pad2(Math.floor(slotModal.min / 60))}:00` : ""}</Text>
            <TouchableOpacity style={[styles.sheetBtn, { backgroundColor: colors.primary }]} onPress={startNewSession}>
              <Icon name="calendar" size={17} color="#fff" /><Text style={styles.sheetBtnText}>{t("business.agenda.newSession")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.sheetBtnGhost, { borderColor: colors.border }]} onPress={openBlockDraft}>
              <Icon name="lock" size={16} color={colors.textSecondary} /><Text style={[styles.sheetBtnGhostText, { color: colors.textSecondary }]}>{t("business.agenda.blockOff")}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Block-off editor (duration via the wheel) */}
      <Modal visible={!!blockDraft} transparent animationType="fade" onRequestClose={() => setBlockDraft(null)}>
        <View style={styles.centerBackdrop}>
          <View style={[styles.editCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>{t("business.agenda.blockOff")}</Text>
            <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]} value={blockDraft?.label} onChangeText={(v) => setBlockDraft((b) => ({ ...b, label: v }))} placeholder={t("business.agenda.blockLabelPlaceholder")} placeholderTextColor={colors.textTertiary} />
            <TouchableOpacity style={[styles.durRow, { borderColor: colors.border }]} onPress={() => setDurationWheel(true)}>
              <Text style={[styles.durLabel, { color: colors.textTertiary }]}>{t("business.agenda.duration")}</Text>
              <Text style={[styles.durValue, { color: colors.text }]}>{formatDuration(String(blockDraft?.durationMin || 60))}</Text>
            </TouchableOpacity>
            <View style={styles.editActions}>
              <TouchableOpacity style={[styles.editBtn, { borderColor: colors.border, borderWidth: 1 }]} onPress={() => setBlockDraft(null)}><Text style={[styles.editBtnText, { color: colors.textSecondary }]}>{t("business.common.cancel")}</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.editBtn, { backgroundColor: colors.primary }]} onPress={saveBlock}><Text style={[styles.editBtnText, { color: "#fff" }]}>{t("business.agenda.save")}</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <DurationWheelModal visible={durationWheel} value={String(blockDraft?.durationMin || 60)} onSelect={(v) => setBlockDraft((b) => ({ ...b, durationMin: parseInt(v, 10) || 60 }))} onClose={() => setDurationWheel(false)} />

      {/* Requests inbox */}
      <Modal visible={showRequests} transparent animationType="slide" onRequestClose={() => setShowRequests(false)}>
        <View style={styles.backdrop}>
          <View style={[styles.reqSheet, { backgroundColor: colors.background }]}>
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>{t("business.agenda.requests")}</Text>
              <TouchableOpacity onPress={() => setShowRequests(false)}><Icon name="close" size={22} color={colors.textSecondary} /></TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 400 }}>
              {requests.map((b) => (
                <View key={b.id} style={[styles.reqRow, { borderColor: colors.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.reqName, { color: colors.text }]} numberOfLines={1}>{(b.members || []).map((m) => m.name).join(", ")}</Text>
                    <Text style={[styles.reqMeta, { color: colors.textTertiary }]}>{b.sessionTypeName} · {new Date(b.start).toLocaleString(i18n.language, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</Text>
                  </View>
                  <TouchableOpacity style={[styles.reqGhost, { borderColor: colors.border }]} onPress={async () => { await declineBooking(b.id); loadDay(); }}><Text style={[styles.reqGhostText, { color: colors.textSecondary }]}>{t("business.agenda.decline")}</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.reqConfirm, { backgroundColor: colors.primary }]} onPress={async () => { await confirmBooking(b); loadDay(); }}><Text style={styles.reqConfirmText}>{t("business.agenda.confirm")}</Text></TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </GradientBackground>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 60, paddingBottom: 8 },
    headerTitle: { fontSize: 22, fontWeight: "800" },
    dayStrip: { paddingHorizontal: 16, gap: 8, paddingVertical: 4 },
    dayCell: { width: 54, height: 62, borderRadius: 15, borderWidth: 1, alignItems: "center", justifyContent: "center", gap: 3 },
    dayName: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
    dayNum: { fontSize: 19, fontWeight: "800" },
    staffStrip: { paddingHorizontal: 16, gap: 8, paddingVertical: 8 },
    staffChip: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 20, paddingLeft: 6, paddingRight: 14, height: 40 },
    staffAvatar: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
    staffAvatarText: { fontSize: 11, fontWeight: "800" },
    staffName: { fontSize: 13.5, fontWeight: "700", maxWidth: 120 },
    reqBanner: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginTop: 4 },
    reqText: { flex: 1, fontSize: 13, fontWeight: "700" },
    legend: { flexDirection: "row", flexWrap: "wrap", gap: 12, paddingHorizontal: 20, paddingVertical: 8 },
    legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
    legendDot: { width: 9, height: 9, borderRadius: 3 },
    legendText: { fontSize: 11.5, fontWeight: "700" },
    loading: { flex: 1, justifyContent: "center", alignItems: "center" },
    hourRow: { position: "absolute", left: 0, right: 0, flexDirection: "row", borderTopWidth: StyleSheet.hairlineWidth, paddingLeft: 16, paddingTop: 2 },
    hourLabel: { width: 52, fontSize: 11.5, fontWeight: "600" },
    itemCard: { position: "absolute", left: 74, right: 14, borderRadius: 12, padding: 9, justifyContent: "center" },
    itemTitle: { color: "#fff", fontSize: 13.5, fontWeight: "800" },
    itemMeta: { color: "rgba(255,255,255,0.9)", fontSize: 11, marginTop: 2, fontWeight: "600" },
    blockCard: { position: "absolute", left: 74, right: 14, flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 12, borderWidth: 1.5, borderStyle: "dashed", paddingHorizontal: 10 },
    blockText: { fontSize: 12, fontWeight: "700", flex: 1 },
    allList: { paddingHorizontal: 16, paddingBottom: 30 },
    emptyAll: { textAlign: "center", paddingVertical: 40, fontSize: 13.5 },
    allRow: { flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 12 },
    allTime: { width: 46, fontSize: 12.5, fontWeight: "700" },
    allBar: { width: 4, alignSelf: "stretch", borderRadius: 2 },
    allTitle: { fontSize: 14.5, fontWeight: "800" },
    allSub: { fontSize: 12, marginTop: 2 },
    backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
    sheet: { borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, paddingBottom: 34, gap: 12 },
    sheetTitle: { fontSize: 18, fontWeight: "800" },
    sheetBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 52, borderRadius: 26 },
    sheetBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" },
    sheetBtnGhost: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 52, borderRadius: 26, borderWidth: 1.5 },
    sheetBtnGhostText: { fontSize: 15, fontWeight: "800" },
    centerBackdrop: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.5)", padding: 32 },
    editCard: { width: "100%", borderRadius: 20, padding: 20 },
    input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginTop: 12 },
    durRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, marginTop: 12 },
    durLabel: { fontSize: 13, fontWeight: "600" },
    durValue: { fontSize: 15, fontWeight: "800" },
    editActions: { flexDirection: "row", gap: 10, marginTop: 18 },
    editBtn: { flex: 1, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
    editBtnText: { fontSize: 14, fontWeight: "800" },
    reqSheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 34 },
    sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
    reqRow: { flexDirection: "row", alignItems: "center", gap: 8, borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 12 },
    reqName: { fontSize: 14.5, fontWeight: "700" },
    reqMeta: { fontSize: 12, marginTop: 2 },
    reqGhost: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8 },
    reqGhostText: { fontSize: 12.5, fontWeight: "700" },
    reqConfirm: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8 },
    reqConfirmText: { color: "#fff", fontSize: 12.5, fontWeight: "800" },
  });
}
