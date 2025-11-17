import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Shadows, Radius, Spacing } from '../../constants/DesignSystem';

export const GlassCard = ({ children, style, elevated = false }) => {
  return (
    <View style={[
      styles.card,
      elevated && styles.elevated,
      style
    ]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.dark.surfaceGlass,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    padding: Spacing.lg,
    ...Shadows.md,
  },
  elevated: {
    ...Shadows.xl,
  },
});
