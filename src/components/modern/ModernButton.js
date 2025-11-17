import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { Colors, Shadows, Radius, Typography, Spacing } from '../../constants/DesignSystem';

export const ModernButton = ({ 
  title, 
  onPress, 
  variant = 'primary', 
  size = 'md',
  icon,
  disabled = false,
  style 
}) => {
  const [scaleAnim] = useState(new Animated.Value(1));

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      friction: 3,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 3,
    }).start();
  };

  const getVariantStyle = () => {
    switch (variant) {
      case 'primary':
        return styles.primary;
      case 'secondary':
        return styles.secondary;
      case 'ghost':
        return styles.ghost;
      case 'danger':
        return styles.danger;
      default:
        return styles.primary;
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'sm':
        return styles.sizeSm;
      case 'md':
        return styles.sizeMd;
      case 'lg':
        return styles.sizeLg;
      default:
        return styles.sizeMd;
    }
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={[
          styles.button,
          getVariantStyle(),
          getSizeStyle(),
          disabled && styles.disabled,
          style,
        ]}
        activeOpacity={0.8}
      >
        {icon && <Text style={styles.icon}>{icon}</Text>}
        <Text style={[
          styles.text,
          variant === 'ghost' && styles.ghostText,
        ]}>
          {title}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    ...Shadows.md,
  },
  primary: {
    backgroundColor: Colors.dark.primary,
    ...Shadows.glow,
  },
  secondary: {
    backgroundColor: Colors.dark.secondary,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  danger: {
    backgroundColor: Colors.dark.error,
  },
  sizeSm: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  sizeMd: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  sizeLg: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: Colors.dark.text,
    ...Typography.bodyBold,
  },
  ghostText: {
    color: Colors.dark.primary,
  },
  icon: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
});
