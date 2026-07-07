/**
 * PackageFormScreen — create / edit a package (kinlo_business/01 §3).
 * Class or session pack (credits) · unlimited · price · validity/expiration.
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
import { useTheme } from "../../contexts/ThemeContext";
import {
  getPackage,
  createPackage,
  updatePackage,
  deletePackage,
  PACKAGE_KIND,
} from "../../services/businessPackagesService";

export default function PackageFormScreen({ route, navigation }) {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const packageId = route.params?.packageId || null;
  const editing = !!packageId;

  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [kind, setKind] = useState(PACKAGE_KIND.CLASS);
  const [unlimited, setUnlimited] = useState(false);
  const [credits, setCredits] = useState("");
  const [price, setPrice] = useState("");
  const [validityDays, setValidityDays] = useState("");

  useEffect(() => {
    if (!editing) return;
    (async () => {
      const p = await getPackage(packageId);
      if (p) {
        setName(p.name || "");
        setKind(p.kind || PACKAGE_KIND.CLASS);
        setUnlimited(!!p.unlimited);
        setCredits(p.credits != null ? String(p.credits) : "");
        setPrice(p.priceCents ? String(p.priceCents / 100) : "");
        setValidityDays(p.validityDays != null ? String(p.validityDays) : "");
      }
      setLoading(false);
    })();
  }, [packageId]);

  const onSave = async () => {
    if (!name.trim()) {
      Alert.alert(t("business.packageForm.nameRequiredTitle"), t("business.packageForm.nameRequiredMsg"));
      return;
    }
    setSaving(true);
    const payload = { name: name.trim(), kind, unlimited, credits, price, validityDays };
    try {
      if (editing) await updatePackage(packageId, payload);
      else await createPackage(payload);
      navigation.goBack();
    } catch (e) {
      setSaving(false);
      Alert.alert(t("business.common.errorTitle"), t("business.common.tryAgain"));
    }
  };

  const onDelete = () =>
    Alert.alert(t("business.packageForm.deleteTitle"), t("business.packageForm.deleteMsg"), [
      { text: t("business.common.cancel"), style: "cancel" },
      {
        text: t("business.packageForm.delete"),
        style: "destructive",
        onPress: async () => {
          await deletePackage(packageId);
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
            {editing ? t("business.packageForm.editTitle") : t("business.packageForm.newTitle")}
          </Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textTertiary }]}>{t("business.packageForm.name")}</Text>
            <TextInput
              style={[styles.input, inputStyle]}
              value={name}
              onChangeText={setName}
              placeholder={t("business.packageForm.namePlaceholder")}
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textTertiary }]}>{t("business.packageForm.kind")}</Text>
            <View style={styles.segRow}>
              {[PACKAGE_KIND.CLASS, PACKAGE_KIND.SESSION].map((k) => {
                const active = kind === k;
                return (
                  <TouchableOpacity
                    key={k}
                    onPress={() => setKind(k)}
                    style={[
                      styles.seg,
                      { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? `${colors.primary}14` : "transparent" },
                    ]}
                  >
                    <Text style={[styles.segText, { color: active ? colors.primary : colors.textSecondary }]}>
                      {k === PACKAGE_KIND.SESSION ? t("business.packages.kindSession") : t("business.packages.kindClass")}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={[styles.rowBetween, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.switchLabel, { color: colors.text }]}>{t("business.packageForm.unlimited")}</Text>
            <Switch value={unlimited} onValueChange={setUnlimited} trackColor={{ true: colors.primary }} />
          </View>

          {!unlimited && (
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.textTertiary }]}>{t("business.packageForm.credits")}</Text>
              <TextInput
                style={[styles.input, inputStyle]}
                value={credits}
                onChangeText={setCredits}
                placeholder="10"
                placeholderTextColor={colors.textTertiary}
                keyboardType="number-pad"
              />
            </View>
          )}

          <View style={styles.row}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.textTertiary }]}>{t("business.packageForm.price")}</Text>
              <TextInput
                style={[styles.input, inputStyle]}
                value={price}
                onChangeText={setPrice}
                placeholder="0"
                placeholderTextColor={colors.textTertiary}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.textTertiary }]}>{t("business.packageForm.validity")}</Text>
              <TextInput
                style={[styles.input, inputStyle]}
                value={validityDays}
                onChangeText={setValidityDays}
                placeholder={t("business.packageForm.validityPlaceholder")}
                placeholderTextColor={colors.textTertiary}
                keyboardType="number-pad"
              />
            </View>
          </View>

          {editing && (
            <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
              <Icon name="delete" size={16} color={colors.error} />
              <Text style={[styles.deleteText, { color: colors.error }]}>{t("business.packageForm.delete")}</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: saving ? 0.6 : 1 }]}
            onPress={onSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveText}>{t("business.packageForm.save")}</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    loading: { flex: 1, justifyContent: "center", alignItems: "center" },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingTop: 60,
      paddingBottom: 12,
    },
    headerTitle: { fontSize: 18, fontWeight: "800" },
    content: { paddingHorizontal: 24, paddingBottom: 24 },
    field: { marginBottom: 16 },
    row: { flexDirection: "row", gap: 12 },
    label: { fontSize: 11, fontWeight: "700", letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 8 },
    input: { borderWidth: 1, borderRadius: 13, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
    segRow: { flexDirection: "row", gap: 8 },
    seg: { flex: 1, borderWidth: 1.5, borderRadius: 12, paddingVertical: 11, alignItems: "center" },
    segText: { fontSize: 14, fontWeight: "700" },
    rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderRadius: 13, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 16 },
    switchLabel: { fontSize: 14, fontWeight: "700" },
    deleteBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 18, marginTop: 6 },
    deleteText: { fontSize: 14, fontWeight: "700" },
    footer: { paddingHorizontal: 24, paddingBottom: 28, paddingTop: 6 },
    saveBtn: { height: 54, borderRadius: 27, alignItems: "center", justifyContent: "center" },
    saveText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  });
}
