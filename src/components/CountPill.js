/**
 * CountPill — a small unread-count pill (spec 12). Renders nothing when n<=0.
 * Uses colors.error (no hardcoded colors). Caps at "9+".
 */
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../contexts/ThemeContext";

export default function CountPill({ n }) {
  const { colors } = useTheme();
  if (!n || n <= 0) return null;
  return (
    <View style={[styles.pill, { backgroundColor: colors.error }]}>
      <Text style={styles.text}>{n > 9 ? "9+" : n}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { color: "#FFFFFF", fontSize: 11, fontWeight: "800" },
});
