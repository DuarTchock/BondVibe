/**
 * PricingTierToggle — a segmented Local / General control (kinlo_business/05 §A).
 * The active segment uses the brand gradient (matches the mockup); writes the
 * member's pricingTier. Reused by the plan-audience picker (Local/General/Both)
 * via the `options` prop.
 */
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "../Icon";
import { useTheme } from "../../contexts/ThemeContext";
import { BRAND } from "../../constants/theme-tokens";

const DEFAULT_OPTIONS = [
  { value: "local", labelKey: "business.pricingTier.local", icon: "location" },
  { value: "general", labelKey: "business.pricingTier.general", icon: "globe" },
];

export default function PricingTierToggle({ value, onChange, options = DEFAULT_OPTIONS, t }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <View style={[styles.track, { backgroundColor: colors.surfaceGlass, borderColor: colors.border }]}>
      {options.map((opt) => {
        const active = value === opt.value;
        const label = t ? t(opt.labelKey) : opt.label || opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={styles.segment}
            activeOpacity={0.85}
            onPress={() => onChange(opt.value)}
          >
            {active && (
              <LinearGradient
                colors={BRAND.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[StyleSheet.absoluteFill, styles.activeFill]}
              />
            )}
            <Icon name={opt.icon} size={16} color={active ? "#fff" : colors.textSecondary} />
            <Text style={[styles.label, { color: active ? "#fff" : colors.textSecondary }]} numberOfLines={1}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    track: { flexDirection: "row", borderWidth: 1, borderRadius: 14, padding: 4, gap: 4 },
    segment: {
      flex: 1,
      height: 44,
      borderRadius: 11,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      overflow: "hidden",
    },
    activeFill: { borderRadius: 11 },
    label: { fontSize: 14.5, fontWeight: "800" },
  });
}
