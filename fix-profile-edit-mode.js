const fs = require('fs');

const profilePath = 'src/screens/ProfileScreen.js';
let content = fs.readFileSync(profilePath, 'utf8');

// Reemplazar todo el EDIT MODE con la versión corregida (sin Bio y Age)
const oldEditMode = `{editing ? (
          /* EDIT MODE */
          <>
            <TouchableOpacity
              style={styles.avatarEditContainer}
              onPress={() => setShowAvatarPicker(true)}
            >
              <View
                style={[
                  styles.avatarGlass,
                  {
                    backgroundColor: isDark
                      ? "rgba(255, 255, 255, 0.04)"
                      : "rgba(255, 255, 255, 0.85)",
                    borderColor: \`\${colors.primary}66\`,
                  },
                ]}
              >
                <AvatarDisplay avatar={editForm.avatar} size={80} />
              </View>
              <Text style={[styles.avatarEditText, { color: colors.primary }]}>
                Tap to change
              </Text>
            </TouchableOpacity>

            <View style={styles.formSection}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  Full Name
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark
                        ? "rgba(255, 255, 255, 0.04)"
                        : "rgba(255, 255, 255, 0.85)",
                      borderColor: isDark
                        ? "rgba(255, 255, 255, 0.10)"
                        : "rgba(0, 0, 0, 0.08)",
                      color: colors.text,
                    },
                  ]}
                  value={editForm.fullName}
                  onChangeText={(text) =>
                    setEditForm({ ...editForm, fullName: text })
                  }
                  placeholder="Your name"
                  placeholderTextColor={colors.textTertiary}
                  maxLength={50}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  Bio
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.textArea,
                    {
                      backgroundColor: isDark
                        ? "rgba(255, 255, 255, 0.04)"
                        : "rgba(255, 255, 255, 0.85)",
                      borderColor: isDark
                        ? "rgba(255, 255, 255, 0.10)"
                        : "rgba(0, 0, 0, 0.08)",
                      color: colors.text,
                    },
                  ]}
                  value={editForm.bio}
                  onChangeText={(text) =>
                    setEditForm({ ...editForm, bio: text })
                  }
                  placeholder="Tell us about yourself..."
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  maxLength={200}
                />
                <Text
                  style={[styles.charCount, { color: colors.textTertiary }]}
                >
                  {editForm.bio.length}/200
                </Text>
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>
                    Age
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark
                          ? "rgba(255, 255, 255, 0.04)"
                          : "rgba(255, 255, 255, 0.85)",
                        borderColor: isDark
                          ? "rgba(255, 255, 255, 0.10)"
                          : "rgba(0, 0, 0, 0.08)",
                        color: colors.text,
                      },
                    ]}
                    value={editForm.age}
                    onChangeText={(text) =>
                      setEditForm({
                        ...editForm,
                        age: text.replace(/[^0-9]/g, ""),
                      })
                    }
                    placeholder="25"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="numeric"
                    maxLength={2}
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 2, marginLeft: 12 }]}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>
                    Location
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark
                          ? "rgba(255, 255, 255, 0.04)"
                          : "rgba(255, 255, 255, 0.85)",
                        borderColor: isDark
                          ? "rgba(255, 255, 255, 0.10)"
                          : "rgba(0, 0, 0, 0.08)",
                        color: colors.text,
                      },
                    ]}
                    value={editForm.location}
                    onChangeText={(text) =>
                      setEditForm({ ...editForm, location: text })
                    }
                    placeholder="City, Country"
                    placeholderTextColor={colors.textTertiary}
                    maxLength={50}
                  />
                </View>

            <View style={styles.formActions}>`;

const newEditMode = `{editing ? (
          /* EDIT MODE */
          <>
            <TouchableOpacity
              style={styles.avatarEditContainer}
              onPress={() => setShowAvatarPicker(true)}
            >
              <View
                style={[
                  styles.avatarGlass,
                  {
                    backgroundColor: isDark
                      ? "rgba(255, 255, 255, 0.04)"
                      : "rgba(255, 255, 255, 0.85)",
                    borderColor: \`\${colors.primary}66\`,
                  },
                ]}
              >
                <AvatarDisplay avatar={editForm.avatar} size={80} />
              </View>
              <Text style={[styles.avatarEditText, { color: colors.primary }]}>
                Tap to change
              </Text>
            </TouchableOpacity>

            <View style={styles.formSection}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  Full Name
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark
                        ? "rgba(255, 255, 255, 0.04)"
                        : "rgba(255, 255, 255, 0.85)",
                      borderColor: isDark
                        ? "rgba(255, 255, 255, 0.10)"
                        : "rgba(0, 0, 0, 0.08)",
                      color: colors.text,
                    },
                  ]}
                  value={editForm.fullName}
                  onChangeText={(text) =>
                    setEditForm({ ...editForm, fullName: text })
                  }
                  placeholder="Your name"
                  placeholderTextColor={colors.textTertiary}
                  maxLength={50}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  Location
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark
                        ? "rgba(255, 255, 255, 0.04)"
                        : "rgba(255, 255, 255, 0.85)",
                      borderColor: isDark
                        ? "rgba(255, 255, 255, 0.10)"
                        : "rgba(0, 0, 0, 0.08)",
                      color: colors.text,
                    },
                  ]}
                  value={editForm.location}
                  onChangeText={(text) =>
                    setEditForm({ ...editForm, location: text })
                  }
                  placeholder="City, Country"
                  placeholderTextColor={colors.textTertiary}
                  maxLength={50}
                />
              </View>
            </View>

            <View style={styles.formActions}>`;

content = content.replace(oldEditMode, newEditMode);

fs.writeFileSync(profilePath, content);
console.log('✅ Fixed ProfileScreen edit mode - removed Bio and Age');
