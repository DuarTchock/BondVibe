/**
 * WhyPill — "Why you're seeing this" (Smart Wall §10): a small sparkle pill
 * with the grounded one-line reason Claude produced for this item.
 */
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Icon from "./Icon";
import { useTheme } from "../contexts/ThemeContext";
import { TYPE, SPACING, RADII } from "../constants/theme-tokens";

export default function WhyPill({ reason, style }) {
  const { colors } = useTheme();
  if (!reason) return null;
  return (
    <View style={[styles.pill, { backgroundColor: colors.brandSoft }, style]}>
      <Icon name="ai" size={12} color={colors.primary} />
      <Text
        style={[TYPE.caption, styles.text, { color: colors.primary }]}
        numberOfLines={2}
      >
        {reason}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    borderRadius: RADII.pill,
    paddingHorizontal: SPACING.md,
    paddingVertical: 5,
  },
  text: { flexShrink: 1 },
});
