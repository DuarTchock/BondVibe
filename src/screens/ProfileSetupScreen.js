import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../services/firebase";
import { useTheme } from "../contexts/ThemeContext";
import AvatarPicker, { AvatarDisplay } from "../components/AvatarPicker";

export default function ProfileSetupScreen() {
  const { colors, isDark } = useTheme();
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    bio: "",
    avatar: { type: "emoji", value: "😊" },
    age: "",
    location: "",
  });

  const handleAvatarChange = (newAvatar) => {
    setForm({ ...form, avatar: newAvatar });
  };

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

      {/* New Avatar Picker */}
      <AvatarPicker
        visible={showAvatarPicker}
        onClose={() => setShowAvatarPicker(false)}
        currentAvatar={form.avatar}
        onAvatarChange={handleAvatarChange}
      />

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
            <AvatarDisplay avatar={form.avatar} size={80} />
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
      overflow: "hidden",
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
  });
}
