/**
 * Shared UI kit for the Community Matching screens. Reuses ThemeContext tokens
 * (no new palette beyond the match-type accents in matchingService) so every
 * screen stays lean and on-brand (§7).
 */
import React from "react";
import Icon from "../../components/Icon";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "../../contexts/ThemeContext";

export function MatchHeader({ title, onBack, right }) {
  const { colors } = useTheme();
  return (
    <View style={styles.header}>
      {onBack ? (
        <TouchableOpacity onPress={onBack} style={styles.headerBtn} hitSlop={hit}>
          <Icon name="back" size={26} color={colors.text} />
        </TouchableOpacity>
      ) : (
        <View style={styles.headerBtn} />
      )}
      <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.headerBtn}>{right}</View>
    </View>
  );
}

export function PrimaryButton({ label, onPress, disabled, loading }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[
        styles.primaryBtn,
        { backgroundColor: colors.primary, opacity: disabled ? 0.5 : 1 },
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.primaryText}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

export function SecondaryButton({ label, onPress }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity style={styles.secondaryBtn} onPress={onPress} activeOpacity={0.7}>
      <Text style={[styles.secondaryText, { color: colors.textSecondary }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export function Chip({ label, selected, onPress, fg, bg }) {
  const { colors } = useTheme();
  const active = selected;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.chip,
        {
          backgroundColor: active ? bg || `${colors.primary}18` : colors.surfaceGlass,
          borderColor: active ? fg || colors.primary : colors.border,
        },
      ]}
    >
      <Text
        style={[
          styles.chipText,
          { color: active ? fg || colors.primary : colors.textSecondary },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const hit = { top: 10, bottom: 10, left: 10, right: 10 };

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 56,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  headerBtn: { width: 40, minHeight: 40, justifyContent: "center" },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 17, fontWeight: "700" },
  primaryBtn: {
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  secondaryBtn: { height: 48, alignItems: "center", justifyContent: "center" },
  secondaryText: { fontSize: 15, fontWeight: "600" },
  chip: {
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: { fontSize: 13.5, fontWeight: "600" },
});
