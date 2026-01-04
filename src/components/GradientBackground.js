import React from "react";
import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../contexts/ThemeContext";

/**
 * GradientBackground - Wrapper component for consistent app background
 * Uses accent gradient: subtle brand color hint in the middle
 *
 * Usage:
 * <GradientBackground>
 *   <YourContent />
 * </GradientBackground>
 */
export default function GradientBackground({ children, style }) {
  const { isDark } = useTheme();

  // Accent gradient colors
  const gradientColors = isDark
    ? ["#0B0F1A", "#150D18", "#0B0F1A"] // Dark: subtle magenta hint in middle
    : ["#FAFAFC", "#FFF9E6", "#FAFAFC"]; // Light: subtle yellow hint in middle

  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={gradientColors}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
