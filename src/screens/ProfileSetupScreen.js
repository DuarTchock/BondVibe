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
    bio: "",
    avatar: "😊",
    age: "",
    location: "",
  });

  const handleSave = async () => {
    // Validate required fields
    if (!form.fullName.trim()) {
      Alert.alert("Required Field", "Please enter your name to continue.");
      return;
    }

    if (!form.age.trim()) {
      Alert.alert("Required Field", "Please enter your age to continue.");
      return;
    }

    const ageNum = parseInt(form.age);
    if (isNaN(ageNum) || ageNum < 18 || ageNum > 99) {
      Alert.alert("Invalid Age", "You must be 18 or older to use BondVibe.");
      return;
    }

    if (!form.location.trim()) {
      Alert.alert("Required Field", "Please enter your location to continue.");
      return;
    }

    setSaving(true);
    try {
      console.log("📝 Saving profile setup...");

      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        fullName: form.fullName.trim(),
        bio: form.bio.trim(),
        avatar: form.avatar,
        age: ageNum,
        location: form.location.trim(),
        profileCompleted: true,
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
          Complete Your Profile
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          Tell us a bit about yourself
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
              Full Name <Text style={{ color: colors.accent }}>*</Text>
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
              />
            </View>
          </View>

          {/* Age and Location Row - Required */}
          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Age <Text style={{ color: colors.accent }}>*</Text>
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
                  value={form.age}
                  onChangeText={(text) =>
                    setForm({
                      ...form,
                      age: text.replace(/[^0-9]/g, ""),
                    })
                  }
                  placeholder="25"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                  maxLength={2}
                />
              </View>
            </View>

            <View style={[styles.inputGroup, { flex: 2, marginLeft: 12 }]}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Location <Text style={{ color: colors.accent }}>*</Text>
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
                  value={form.location}
                  onChangeText={(text) => setForm({ ...form, location: text })}
                  placeholder="City, Country"
                  placeholderTextColor={colors.textTertiary}
                  maxLength={50}
                />
              </View>
            </View>
          </View>

          {/* Bio - Optional */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Bio{" "}
              <Text style={{ color: colors.textTertiary, fontWeight: "400" }}>
                (optional)
              </Text>
            </Text>
            <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    backgroundColor: colors.surfaceGlass,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                value={form.bio}
                onChangeText={(text) => setForm({ ...form, bio: text })}
                placeholder="Tell us about yourself, your interests, what kind of events you enjoy..."
                placeholderTextColor={colors.textTertiary}
                multiline
                maxLength={200}
              />
            </View>
            <Text style={[styles.charCount, { color: colors.textTertiary }]}>
              {form.bio.length}/200
            </Text>
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
              Your profile helps us match you with compatible groups and events.
              You can always edit this later.
            </Text>
          </View>
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleSave}
          disabled={saving}
        >
          <View
            style={[
              styles.continueGlass,
              {
                backgroundColor: colors.primary,
                opacity: saving ? 0.7 : 1,
              },
            ]}
          >
            <Text style={styles.continueButtonText}>
              {saving ? "Saving..." : "Continue"}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Required Fields Note */}
        <Text style={[styles.requiredNote, { color: colors.textTertiary }]}>
          <Text style={{ color: colors.accent }}>*</Text> Required fields
        </Text>
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
      paddingTop: 70,
      paddingBottom: 20,
      alignItems: "center",
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: "700",
      marginBottom: 8,
      letterSpacing: -0.5,
    },
    headerSubtitle: {
      fontSize: 15,
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
      marginBottom: 28,
    },
    avatarGlass: {
      width: 100,
      height: 100,
      borderRadius: 50,
      borderWidth: 2,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 12,
    },
    avatarEmoji: {
      fontSize: 50,
    },
    avatarText: {
      fontSize: 14,
      fontWeight: "600",
    },

    // Form
    formSection: {
      gap: 20,
      marginBottom: 24,
    },
    inputGroup: {
      gap: 8,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: "600",
      letterSpacing: -0.1,
    },
    inputWrapper: {
      borderRadius: 12,
      overflow: "hidden",
    },
    input: {
      borderWidth: 1,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      borderRadius: 12,
    },
    textAreaWrapper: {},
    textArea: {
      minHeight: 100,
      textAlignVertical: "top",
      paddingTop: 14,
    },
    charCount: {
      fontSize: 12,
      textAlign: "right",
      marginTop: 4,
    },
    inputRow: {
      flexDirection: "row",
    },

    // Info Note
    infoNote: {
      marginBottom: 24,
      borderRadius: 16,
      overflow: "hidden",
    },
    infoNoteGlass: {
      borderWidth: 1,
      padding: 16,
      flexDirection: "row",
      alignItems: "flex-start",
    },
    infoNoteIcon: {
      fontSize: 20,
      marginRight: 12,
    },
    infoNoteText: {
      flex: 1,
      fontSize: 13,
      lineHeight: 20,
    },

    // Continue Button
    continueButton: {
      borderRadius: 16,
      overflow: "hidden",
      marginBottom: 16,
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

    // Required Note
    requiredNote: {
      fontSize: 12,
      textAlign: "center",
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
