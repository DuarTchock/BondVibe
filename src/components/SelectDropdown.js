import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import Icon, { getCategoryIcon, getLocationIcon } from "./Icon";

/**
 * SelectDropdown Component
 *
 * A reusable dropdown selector for categories, locations, or any list of options
 *
 * @param {string} label - Label text above the dropdown
 * @param {string} value - Currently selected value (id)
 * @param {function} onValueChange - Callback when value changes
 * @param {array} options - Array of options: [{ id, label, emoji? }]
 * @param {string} placeholder - Placeholder text when no value selected
 * @param {string} type - "category" | "location" | "default" (affects icon rendering)
 */
export default function SelectDropdown({
  label,
  value,
  onValueChange,
  options = [],
  placeholder = "Select an option",
  type = "default",
}) {
  const { colors, isDark } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  // Find the selected option
  const selectedOption = options.find((opt) => opt.id === value);

  // Get display text
  const displayText = selectedOption?.label || placeholder;

  // Render icon based on type
  const renderIcon = (option, isSelected = false) => {
    const iconColor = isSelected ? colors.primary : colors.text;
    const iconSize = 22;

    if (type === "category") {
      const IconComponent = getCategoryIcon(option.id);
      return (
        <IconComponent size={iconSize} color={iconColor} strokeWidth={2} />
      );
    } else if (type === "location") {
      const IconComponent = getLocationIcon(option.id);
      return (
        <IconComponent size={iconSize} color={iconColor} strokeWidth={2} />
      );
    } else if (option.emoji) {
      return <Text style={styles.optionEmoji}>{option.emoji}</Text>;
    }
    return null;
  };

  const styles = createStyles(colors, isDark);

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      )}

      {/* Dropdown Button */}
      <TouchableOpacity
        style={[
          styles.dropdownButton,
          {
            backgroundColor: colors.surfaceGlass,
            borderColor: colors.border,
          },
        ]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <View style={styles.dropdownContent}>
          {selectedOption && renderIcon(selectedOption, false)}
          <Text
            style={[
              styles.dropdownText,
              { color: selectedOption ? colors.text : colors.textTertiary },
            ]}
          >
            {displayText}
          </Text>
        </View>
        <Icon name="down" size={20} color={colors.textSecondary} type="ui" />
      </TouchableOpacity>

      {/* Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <Pressable
            style={[
              styles.modalContent,
              {
                backgroundColor: isDark ? "#1a1a2e" : "#ffffff",
                borderColor: colors.border,
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {label || "Select Option"}
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Icon
                  name="close"
                  size={24}
                  color={colors.textSecondary}
                  type="ui"
                />
              </TouchableOpacity>
            </View>

            {/* Options List */}
            <ScrollView
              style={styles.optionsList}
              showsVerticalScrollIndicator={false}
            >
              {options.map((option) => {
                const isSelected = option.id === value;
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.optionItem,
                      {
                        backgroundColor: isSelected
                          ? `${colors.primary}15`
                          : "transparent",
                        borderColor: isSelected
                          ? `${colors.primary}40`
                          : "transparent",
                      },
                    ]}
                    onPress={() => {
                      onValueChange(option.id);
                      setModalVisible(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.optionContent}>
                      {renderIcon(option, isSelected)}
                      <Text
                        style={[
                          styles.optionLabel,
                          {
                            color: isSelected ? colors.primary : colors.text,
                            fontWeight: isSelected ? "600" : "500",
                          },
                        ]}
                      >
                        {option.label}
                      </Text>
                    </View>
                    {isSelected && (
                      <Icon
                        name="check"
                        size={20}
                        color={colors.primary}
                        type="ui"
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function createStyles(colors, isDark) {
  return StyleSheet.create({
    container: {
      marginBottom: 20,
    },
    label: {
      fontSize: 16,
      fontWeight: "700",
      marginBottom: 12,
      letterSpacing: -0.2,
    },
    dropdownButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderWidth: 1,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    dropdownContent: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      gap: 12,
    },
    dropdownText: {
      fontSize: 16,
      flex: 1,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    modalContent: {
      width: "100%",
      maxWidth: 400,
      maxHeight: "70%",
      borderRadius: 20,
      borderWidth: 1,
      overflow: "hidden",
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: "rgba(255, 255, 255, 0.1)",
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "700",
      letterSpacing: -0.3,
    },
    closeButton: {
      padding: 4,
    },
    optionsList: {
      paddingVertical: 8,
    },
    optionItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 14,
      marginHorizontal: 8,
      marginVertical: 2,
      borderRadius: 12,
      borderWidth: 1,
    },
    optionContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      flex: 1,
    },
    optionEmoji: {
      fontSize: 22,
    },
    optionLabel: {
      fontSize: 16,
    },
  });
}
