/**
 * AILoadingCard — the shared AI loading state (§03 integration map):
 * dark AICard with "Kinlo AI is reading your community…" + pulsing shimmer
 * bars. Never a blank screen while AI thinks.
 */
import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";
import AICard, { AIText } from "./AICard";
import { SPACING, RADII } from "../constants/theme-tokens";

export default function AILoadingCard({ eyebrow = "Kinlo AI", lines = 2, style }) {
  const pulse = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.9, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.35, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <AICard eyebrow={eyebrow} style={style}>
      <AIText>Kinlo AI is reading your community…</AIText>
      <View style={styles.bars}>
        {Array.from({ length: lines }).map((_, i) => (
          <Animated.View
            key={i}
            style={[styles.bar, { opacity: pulse, width: `${88 - i * 18}%` }]}
          />
        ))}
      </View>
    </AICard>
  );
}

const styles = StyleSheet.create({
  bars: { gap: SPACING.sm, marginTop: SPACING.xs },
  bar: {
    height: 10,
    borderRadius: RADII.pill,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
});
