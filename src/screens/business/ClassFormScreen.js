/**
 * ClassFormScreen — create / edit a class (kinlo_business/01 §5). Recurring on
 * selected weekdays (or a one-off date), instructor, time, duration, capacity,
 * location, and an optional public listing flag.
 */
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useTranslation } from "react-i18next";
import Icon from "../../components/Icon";
import GradientBackground from "../../components/GradientBackground";
import DateField from "../../components/DateField";
import { useTheme } from "../../contexts/ThemeContext";
import { getClass, createClass, updateClass, deleteClass } from "../../services/businessClassesService";

const weekdayShort = (i, lang) => new Date(2024, 0, 7 + i).toLocaleDateString(lang || "en", { weekday: "short" });

export default function ClassFormScreen({ route, navigation }) {
  const { colors, isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const classId = route.params?.classId || null;
  const editing = !!classId;

  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [instructor, setInstructor] = useState("");
  const [weekdays, setWeekdays] = useState([]);
  const [oneOff, setOneOff] = useState(null);
  const [time, setTime] = useState("18:00");
  const [duration, setDuration] = useState("60");
  const [capacity, setCapacity] = useState("12");
  const [location, setLocation] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    if (!editing) return;
    (async () => {
      const c = await getClass(classId);
      if (c) {
        setTitle(c.title || "");
        setInstructor(c.instructor || "");
        setWeekdays(Array.isArray(c.weekdays) ? c.weekdays : []);
        setOneOff(c.date ? new Date(c.date) : null);
        setTime(c.time || "18:00");
        setDuration(String(c.durationMin || 60));
        setCapacity(String(c.capacity || 12));
        setLocation(c.location || "");
        setIsPublic(c.public === true);
      }
      setLoading(false);
    })();
  }, [classId]);

  const toggleDay = (d) => setWeekdays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]));

  const onSave = async () => {
    if (!title.trim()) {
      Alert.alert(t("business.classForm.titleRequiredTitle"), t("business.classForm.titleRequiredMsg"));
      return;
    }
    if (weekdays.length === 0 && !oneOff) {
      Alert.alert(t("business.classForm.whenRequiredTitle"), t("business.classForm.whenRequiredMsg"));
      return;
    }
    setSaving(true);
    const payload = {
      title: title.trim(),
      instructor: instructor.trim(),
      weekdays,
      date: weekdays.length === 0 && oneOff ? oneOff.toISOString() : null,
      time: time.trim() || "18:00",
      durationMin: duration,
      capacity,
      location: location.trim(),
      public: isPublic,
    };
    try {
      if (editing) await updateClass(classId, payload);
      else await createClass(payload);
      navigation.goBack();
    } catch (e) {
      setSaving(false);
      Alert.alert(t("business.common.errorTitle"), t("business.common.tryAgain"));
    }
  };

  const onDelete = () =>
    Alert.alert(t("business.classForm.deleteTitle"), t("business.classForm.deleteMsg"), [
      { text: t("business.common.cancel"), style: "cancel" },
      {
        text: t("business.classForm.delete"),
        style: "destructive",
        onPress: async () => {
          await deleteClass(classId);
          navigation.goBack();
        },
      },
    ]);

  const styles = createStyles(colors);
  if (loading) {
    return (
      <GradientBackground>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </GradientBackground>
    );
  }
  const inputStyle = { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text };

  return (
    <GradientBackground>
      <StatusBar style={isDark ? "light" : "dark"} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="close" size={26} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {editing ? t("business.classForm.editTitle") : t("business.classForm.newTitle")}
          </Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textTertiary }]}>{t("business.classForm.name")}</Text>
            <TextInput style={[styles.input, inputStyle]} value={title} onChangeText={setTitle} placeholder={t("business.classForm.namePlaceholder")} placeholderTextColor={colors.textTertiary} />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textTertiary }]}>{t("business.classForm.instructor")}</Text>
            <TextInput style={[styles.input, inputStyle]} value={instructor} onChangeText={setInstructor} placeholder={t("business.classForm.instructorPlaceholder")} placeholderTextColor={colors.textTertiary} />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textTertiary }]}>{t("business.classForm.weekdays")}</Text>
            <View style={styles.dayRow}>
              {[0, 1, 2, 3, 4, 5, 6].map((d) => {
                const active = weekdays.includes(d);
                return (
                  <TouchableOpacity key={d} onPress={() => toggleDay(d)} style={[styles.dayChip, { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? `${colors.primary}18` : "transparent" }]}>
                    <Text style={[styles.dayChipText, { color: active ? colors.primary : colors.textSecondary }]}>{weekdayShort(d, i18n.language)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {weekdays.length === 0 && (
              <View style={{ marginTop: 10 }}>
                <Text style={[styles.orLabel, { color: colors.textTertiary }]}>{t("business.classForm.orOneOff")}</Text>
                <DateField label={t("business.classForm.date")} value={oneOff} onChange={setOneOff} onClear={() => setOneOff(null)} />
              </View>
            )}
          </View>

          <View style={styles.row}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.textTertiary }]}>{t("business.classForm.time")}</Text>
              <TextInput style={[styles.input, inputStyle]} value={time} onChangeText={setTime} placeholder="18:00" placeholderTextColor={colors.textTertiary} />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.textTertiary }]}>{t("business.classForm.duration")}</Text>
              <TextInput style={[styles.input, inputStyle]} value={duration} onChangeText={setDuration} placeholder="60" placeholderTextColor={colors.textTertiary} keyboardType="number-pad" />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.textTertiary }]}>{t("business.classForm.capacity")}</Text>
              <TextInput style={[styles.input, inputStyle]} value={capacity} onChangeText={setCapacity} placeholder="12" placeholderTextColor={colors.textTertiary} keyboardType="number-pad" />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textTertiary }]}>{t("business.classForm.location")}</Text>
            <TextInput style={[styles.input, inputStyle]} value={location} onChangeText={setLocation} placeholder={t("business.classForm.locationPlaceholder")} placeholderTextColor={colors.textTertiary} />
          </View>

          <View style={[styles.rowBetween, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={[styles.switchLabel, { color: colors.text }]}>{t("business.classForm.public")}</Text>
              <Text style={[styles.switchHint, { color: colors.textTertiary }]}>{t("business.classForm.publicHint")}</Text>
            </View>
            <Switch value={isPublic} onValueChange={setIsPublic} trackColor={{ true: colors.primary }} />
          </View>

          {editing && (
            <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
              <Icon name="delete" size={16} color={colors.error} />
              <Text style={[styles.deleteText, { color: colors.error }]}>{t("business.classForm.delete")}</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: saving ? 0.6 : 1 }]} onPress={onSave} disabled={saving} activeOpacity={0.85}>
            {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveText}>{t("business.classForm.save")}</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    loading: { flex: 1, justifyContent: "center", alignItems: "center" },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12 },
    headerTitle: { fontSize: 18, fontWeight: "800" },
    content: { paddingHorizontal: 24, paddingBottom: 24 },
    field: { marginBottom: 16 },
    row: { flexDirection: "row", gap: 10 },
    label: { fontSize: 11, fontWeight: "700", letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 8 },
    input: { borderWidth: 1, borderRadius: 13, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
    dayRow: { flexDirection: "row", gap: 6 },
    dayChip: { flex: 1, borderWidth: 1.5, borderRadius: 10, paddingVertical: 9, alignItems: "center" },
    dayChipText: { fontSize: 11, fontWeight: "700" },
    orLabel: { fontSize: 12, marginBottom: 8 },
    rowBetween: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 13, paddingHorizontal: 14, paddingVertical: 12 },
    switchLabel: { fontSize: 14, fontWeight: "700" },
    switchHint: { fontSize: 11.5, marginTop: 2 },
    deleteBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 18, marginTop: 6 },
    deleteText: { fontSize: 14, fontWeight: "700" },
    footer: { paddingHorizontal: 24, paddingBottom: 28, paddingTop: 6 },
    saveBtn: { height: 54, borderRadius: 27, alignItems: "center", justifyContent: "center" },
    saveText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  });
}
