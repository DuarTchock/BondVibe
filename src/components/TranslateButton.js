/**
 * TranslateButton — Layer 2 AI content translation (kinlo_build/04_I18N_SPEC.md).
 * Shows the original by default; tapping "Translate to {lang}" calls callClaude
 * ("content_translation") and renders the result with a "Translated by Kinlo AI"
 * tag + a "See original" toggle. Result is cached per (contentId, targetLang).
 *
 * Gating is server-enforced: Plus members + Pro hosts unlimited; everyone else
 * gets 1 free translation / month, then we route to the paywall (Pro if host).
 */
import React, { useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "../contexts/ThemeContext";
import { useSubscriptions } from "../hooks/useEntitlement";
import Icon from "./Icon";
import { callClaude } from "../services/claudeService";
import { LANGUAGE_BY_CODE, nativeName } from "../i18n/languages";

const YEAR_MS = 365 * 24 * 60 * 60 * 1000;

export default function TranslateButton({ text, contentId, navigation, style }) {
  const { colors } = useTheme();
  const { t, i18n } = useTranslation();
  const { isPro, isPlus } = useSubscriptions();
  const [busy, setBusy] = useState(false);
  const [translated, setTranslated] = useState(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [failed, setFailed] = useState(false);

  const targetLang = i18n.language;
  const targetName = (LANGUAGE_BY_CODE[targetLang] || {}).english || "English";
  const body = (text || "").trim();
  if (!body) return null;

  const styles = createStyles(colors);

  const run = async () => {
    if (busy) return;
    setBusy(true);
    setFailed(false);
    const res = await callClaude(
      "content_translation",
      { text: body, targetLang, targetName },
      { cacheKey: `translate:${contentId}:${targetLang}`, ttlMs: YEAR_MS }
    );
    setBusy(false);
    if (res.ok && res.data && res.data.translation) {
      setTranslated(res.data.translation);
      setShowOriginal(false);
    } else if (res.needsPlus || res.needsPro || res.error === "taste_limit") {
      // Pro hosts are unlimited, so a gated user here is non-Pro → Plus paywall
      // (or Pro upsell if they happen to be a host on Pro trial state).
      const route = isPro ? "ProUpsell" : "PlusPaywall";
      navigation && navigation.navigate(route, { from: "content_translation" });
    } else {
      setFailed(true);
    }
  };

  if (!translated) {
    return (
      <View style={style}>
        <TouchableOpacity
          style={[styles.cta, { backgroundColor: colors.sunken, borderColor: colors.border }]}
          onPress={run}
          disabled={busy}
          activeOpacity={0.85}
        >
          {busy ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Icon name="languages" size={16} color={colors.primary} type="ui" />
          )}
          <View style={{ flex: 1 }}>
            <Text style={[styles.ctaText, { color: colors.primary }]}>
              {busy
                ? t("translate.translating")
                : t("translate.action", { lang: nativeName(targetLang) })}
            </Text>
            {!isPlus && !isPro && (
              <Text style={[styles.note, { color: colors.textTertiary }]}>
                {t("translate.freeTasteNote")}
              </Text>
            )}
          </View>
        </TouchableOpacity>
        {failed && (
          <Text style={[styles.failed, { color: colors.textTertiary }]}>
            {t("translate.failed")}
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={style}>
      <View style={styles.tagRow}>
        <Icon name="ai" size={14} color={colors.primary} />
        <Text style={[styles.tag, { color: colors.primary }]}>
          {t("translate.translatedBy")}
        </Text>
      </View>
      <Text style={[styles.body, { color: colors.textSecondary }]}>
        {showOriginal ? body : translated}
      </Text>
      <TouchableOpacity onPress={() => setShowOriginal((v) => !v)} activeOpacity={0.7}>
        <Text style={[styles.toggle, { color: colors.primary }]}>
          {showOriginal ? t("translate.seeTranslation") : t("translate.seeOriginal")}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    cta: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderWidth: 1,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    ctaText: { fontSize: 14, fontWeight: "700" },
    note: { fontSize: 11, marginTop: 1 },
    failed: { fontSize: 12, marginTop: 6 },
    tagRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
    tag: { fontSize: 11, fontWeight: "800", letterSpacing: 0.4, textTransform: "uppercase" },
    body: { fontSize: 15, lineHeight: 24 },
    toggle: { fontSize: 13, fontWeight: "700", marginTop: 8 },
  });
}
