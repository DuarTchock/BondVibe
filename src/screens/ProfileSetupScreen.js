import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../services/firebase";
import { useTheme } from "../contexts/ThemeContext";

const EMOJI_AVATARS = [
  "😊",
  "🎉",
  "🌟",
  "🎨",
  "🎭",
  "🎪",
  "🎬",
  "🎮",
  "🎯",
  "🎲",
  "🎸",
  "🎹",
  "🎺",
  "🎻",
  "🎤",
  "🎧",
  "🌈",
  "🌸",
  "🌺",
  "🌻",
  "🌼",
  "🌷",
  "🍕",
  "🍔",
  "🍰",
  "🎂",
  "🍦",
  "🍩",
  "☕",
  "🍵",
  "🌮",
  "🌯",
  "🦄",
  "🐶",
  "🐱",
  "🐼",
  "🦊",
  "🦁",
  "🐯",
  "🐨",
  "🚀",
  "✨",
  "🔥",
  "💫",
  "⭐",
  "🌙",
  "☀️",
  "🌊",
];

export default function ProfileSetupScreen() {
  const { colors, isDark } = useTheme();
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    avatar: "😊",
  });

  const handleSave = async () => {
    // Validate required fields
    if (!form.fullName.trim()) {
      Alert.alert("Required Field", "Please enter your name to continue.");
      return;
    }

    if (form.fullName.trim().length < 2) {
      Alert.alert("Invalid Name", "Please enter at least 2 characters.");
      return;
    }

    setSaving(true);
    try {
      console.log("📝 Saving profile setup...");

      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        fullName: form.fullName.trim(),
        avatar: form.avatar,
        profileCompleted: true,
        profileCompletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      console.log("✅ Profile setup completed!");
      // AppNavigator will automatically detect profileCompleted: true
      // and navigate to Home via the Firestore listener
    } catch (error) {
      console.error("❌ Error saving profile:", error);
      Alert.alert("Error", "Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const styles = createStyles(colors);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Avatar Picker Modal */}
      <Modal
        visible={showAvatarPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAvatarPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.avatarPickerModal}>
            <View
              style={[
                styles.avatarPickerGlass,
                {
                  backgroundColor: isDark
                    ? "rgba(17, 24, 39, 0.95)"
                    : "rgba(255, 255, 255, 0.95)",
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.avatarPickerTitle, { color: colors.text }]}>
                Choose Your Avatar
              </Text>
              <ScrollView contentContainerStyle={styles.avatarGrid}>
                {EMOJI_AVATARS.map((emoji) => (
                  <TouchableOpacity
                    key={emoji}
                    style={[
                      styles.avatarOption,
                      {
                        backgroundColor: colors.surfaceGlass,
                        borderColor:
                          form.avatar === emoji
                            ? `${colors.primary}99`
                            : colors.border,
                      },
                      form.avatar === emoji && {
                        backgroundColor: `${colors.primary}26`,
                      },
                    ]}
                    onPress={() => {
                      setForm({ ...form, avatar: emoji });
                      setShowAvatarPicker(false);
                    }}
                  >
                    <Text style={styles.avatarOptionEmoji}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity
                style={styles.avatarPickerClose}
                onPress={() => setShowAvatarPicker(false)}
              >
                <View
                  style={[
                    styles.avatarPickerCloseGlass,
                    {
                      backgroundColor: `${colors.primary}33`,
                      borderColor: `${colors.primary}66`,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.avatarPickerCloseText,
                      { color: colors.primary },
                    ]}
                  >
                    Close
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Welcome to BondVibe
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          Let's set up your profile
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar Selection */}
        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={() => setShowAvatarPicker(true)}
        >
          <View
            style={[
              styles.avatarGlass,
              {
                backgroundColor: colors.surfaceGlass,
                borderColor: `${colors.primary}66`,
              },
            ]}
          >
            <Text style={styles.avatarEmoji}>{form.avatar}</Text>
          </View>
          <Text style={[styles.avatarText, { color: colors.primary }]}>
            Tap to change avatar
          </Text>
        </TouchableOpacity>

        {/* Form Fields */}
        <View style={styles.formSection}>
          {/* Full Name - Required */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              What should we call you?
            </Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surfaceGlass,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                value={form.fullName}
                onChangeText={(text) => setForm({ ...form, fullName: text })}
                placeholder="Your name"
                placeholderTextColor={colors.textTertiary}
                maxLength={50}
                autoCapitalize="words"
                autoFocus={true}
              />
            </View>
          </View>
        </View>

        {/* Info Note */}
        <View style={styles.infoNote}>
          <View
            style={[
              styles.infoNoteGlass,
              {
                backgroundColor: `${colors.primary}15`,
                borderColor: `${colors.primary}30`,
              },
            ]}
          >
            <Text style={styles.infoNoteIcon}>💡</Text>
            <Text
              style={[styles.infoNoteText, { color: colors.textSecondary }]}
            >
              You can add more details to your profile later in Settings.
            </Text>
          </View>
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleSave}
          disabled={saving || !form.fullName.trim()}
        >
          <View
            style={[
              styles.continueGlass,
              {
                backgroundColor: colors.primary,
                opacity: saving || !form.fullName.trim() ? 0.5 : 1,
              },
            ]}
          >
            <Text style={styles.continueButtonText}>
              {saving ? "Saving..." : "Get Started"}
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      paddingHorizontal: 24,
      paddingTop: 100,
      paddingBottom: 30,
      alignItems: "center",
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: "700",
      marginBottom: 8,
      letterSpacing: -0.5,
    },
    headerSubtitle: {
      fontSize: 16,
      textAlign: "center",
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 24,
      paddingBottom: 40,
    },

    // Avatar
    avatarContainer: {
      alignItems: "center",
      marginBottom: 40,
    },
    avatarGlass: {
      width: 120,
      height: 120,
      borderRadius: 60,
      borderWidth: 3,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 12,
    },
    avatarEmoji: {
      fontSize: 60,
    },
    avatarText: {
      fontSize: 15,
      fontWeight: "600",
    },

    // Form
    formSection: {
      gap: 20,
      marginBottom: 24,
    },
    inputGroup: {
      gap: 10,
    },
    inputLabel: {
      fontSize: 16,
      fontWeight: "600",
      letterSpacing: -0.2,
      textAlign: "center",
    },
    inputWrapper: {
      borderRadius: 16,
      overflow: "hidden",
    },
    input: {
      borderWidth: 1,
      paddingHorizontal: 20,
      paddingVertical: 18,
      fontSize: 18,
      borderRadius: 16,
      textAlign: "center",
    },

    // Info Note
    infoNote: {
      marginBottom: 32,
      borderRadius: 16,
      overflow: "hidden",
    },
    infoNoteGlass: {
      borderWidth: 1,
      padding: 16,
      flexDirection: "row",
      alignItems: "center",
    },
    infoNoteIcon: {
      fontSize: 20,
      marginRight: 12,
    },
    infoNoteText: {
      flex: 1,
      fontSize: 14,
      lineHeight: 20,
    },

    // Continue Button
    continueButton: {
      borderRadius: 16,
      overflow: "hidden",
    },
    continueGlass: {
      paddingVertical: 18,
      alignItems: "center",
    },
    continueButtonText: {
      fontSize: 17,
      fontWeight: "700",
      color: "#FFFFFF",
      letterSpacing: -0.2,
    },

    // Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    avatarPickerModal: {
      width: "100%",
      maxWidth: 500,
      maxHeight: "80%",
      borderRadius: 20,
      overflow: "hidden",
    },
    avatarPickerGlass: {
      borderWidth: 1,
      padding: 24,
    },
    avatarPickerTitle: {
      fontSize: 20,
      fontWeight: "700",
      textAlign: "center",
      marginBottom: 20,
      letterSpacing: -0.3,
    },
    avatarGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: 10,
      marginBottom: 20,
    },
    avatarOption: {
      width: 56,
      height: 56,
      borderRadius: 12,
      borderWidth: 2,
      justifyContent: "center",
      alignItems: "center",
    },
    avatarOptionEmoji: {
      fontSize: 28,
    },
    avatarPickerClose: {
      borderRadius: 12,
      overflow: "hidden",
    },
    avatarPickerCloseGlass: {
      borderWidth: 1,
      paddingVertical: 14,
      alignItems: "center",
    },
    avatarPickerCloseText: {
      fontSize: 16,
      fontWeight: "600",
    },
  });
}
