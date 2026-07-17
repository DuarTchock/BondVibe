import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { FONTS } from "../constants/theme-tokens";

/**
 * A wrapping row of tap-to-select chips.
 *
 * Every screen that needed selectable chips was styling its own (PublishVehicle,
 * RentalHub, SessionTypes…), each drifting slightly. This is the host-onboarding
 * spec's version — selected reads as a solid brand fill, unselected as a plain
 * bordered surface — and it takes its colours from theme tokens only, so a
 * rebrand moves it without touching call sites.
 *
 * Single-select by default; pass `multi` for a toggle set. Tapping the selected
 * chip in single-select mode is a no-op rather than a deselect: these back
 * required questions, and letting a tap empty the answer only creates a state
 * the user has to fix.
 *
 * @param {object} p
 * @param {Array<{id: string, label: string}>} p.options
 * @param {string|string[]|null} p.value selected id (or ids when `multi`)
 * @param {(next: string|string[]) => void} p.onChange
 * @param {boolean} [p.multi=false]
 * @param {boolean} [p.disabled=false]
 * @param {string} [p.testID]
 */
export default function ChipGroup({
  options,
  value,
  onChange,
  multi = false,
  disabled = false,
  testID,
}) {
  const { colors } = useTheme();
  const s = createStyles(colors);

  const selectedIds = multi ? value || [] : value == null ? [] : [value];

  const press = (id) => {
    if (disabled) return;
    if (!multi) {
      if (id !== value) onChange(id);
      return;
    }
    const set = new Set(selectedIds);
    set.has(id) ? set.delete(id) : set.add(id);
    onChange([...set]);
  };

  return (
    <View style={s.row} testID={testID}>
      {options.map((opt) => {
        const active = selectedIds.includes(opt.id);
        return (
          <TouchableOpacity
            key={opt.id}
            onPress={() => press(opt.id)}
            activeOpacity={0.8}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityState={{ selected: active, disabled }}
            style={[
              s.chip,
              {
                backgroundColor: active ? colors.primary : colors.surface,
                borderColor: active ? colors.primary : colors.border,
                opacity: disabled ? 0.5 : 1,
              },
            ]}
          >
            <Text
              style={[
                s.label,
                {
                  color: active ? colors.onPrimary : colors.text,
                  // Selected chips carry the weight; unselected stay quiet so a
                  // long row doesn't read as all-equally-important.
                  fontFamily: active ? FONTS.bodyBold : FONTS.bodyMedium,
                },
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: {
      borderWidth: 1,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 9,
    },
    label: { fontSize: 14, letterSpacing: -0.1 },
  });
}
