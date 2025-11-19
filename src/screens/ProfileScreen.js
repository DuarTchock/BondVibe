import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Modal,
  Switch,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { signOut } from 'firebase/auth';
import { useTheme } from '../contexts/ThemeContext';

const EMOJI_AVATARS = [
  '😊', '🎉', '🌟', '🎨', '🎭', '🎪', '🎬', '🎮',
  '🎯', '🎲', '🎸', '🎹', '🎺', '🎻', '🎤', '🎧',
  '🌈', '🌸', '🌺', '🌻', '🌼', '🌷', '🍕', '🍔',
  '🍰', '🎂', '🍦', '🍩', '☕', '🍵', '🌮', '🌯',
  '🦄', '🐶', '🐱', '🐼', '🦊', '🦁', '🐯', '🐨',
  '🚀', '✨', '🔥', '💫', '⭐', '🌙', '☀️', '🌊',
];

export default function ProfileScreen({ navigation }) {
  const { colors, isDark, toggleTheme } = useTheme();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [editForm, setEditForm] = useState({
    fullName: '',
    bio: '',
    avatar: '',
    age: '',
    location: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setProfile(data);
        setEditForm({
          fullName: data.fullName || '',
          bio: data.bio || '',
          avatar: data.avatar || '😊',
          age: data.age?.toString() || '',
          location: data.location || '',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        fullName: editForm.fullName.trim(),
        bio: editForm.bio.trim(),
        avatar: editForm.avatar,
        age: parseInt(editForm.age) || 0,
        location: editForm.location.trim(),
        updatedAt: new Date().toISOString(),
      });
      await loadProfile();
      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const performLogout = async () => {
    setShowLogoutModal(false);
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const styles = createStyles(colors);

  if (!profile) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      
      {/* Logout Modal */}
      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.modalGlass, {
              backgroundColor: isDark ? 'rgba(17, 24, 39, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              borderColor: colors.border
            }]}>
              <Text style={styles.modalEmoji}>👋</Text>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Logout</Text>
              <Text style={[styles.modalText, { color: colors.textSecondary }]}>
                Are you sure you want to logout?
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setShowLogoutModal(false)}
                >
                  <View style={[styles.modalCancelGlass, {
                    backgroundColor: colors.surfaceGlass,
                    borderColor: colors.border
                  }]}>
                    <Text style={[styles.modalCancelText, { color: colors.text }]}>Cancel</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalLogoutButton}
                  onPress={performLogout}
                >
                  <View style={styles.modalLogoutGlass}>
                    <Text style={styles.modalLogoutText}>Logout</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Avatar Picker Modal */}
      <Modal
        visible={showAvatarPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAvatarPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.avatarPickerModal}>
            <View style={[styles.avatarPickerGlass, {
              backgroundColor: isDark ? 'rgba(17, 24, 39, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              borderColor: colors.border
            }]}>
              <Text style={[styles.avatarPickerTitle, { color: colors.text }]}>
                Choose Avatar
              </Text>
              <ScrollView contentContainerStyle={styles.avatarGrid}>
                {EMOJI_AVATARS.map((emoji) => (
                  <TouchableOpacity
                    key={emoji}
                    style={[
                      styles.avatarOption,
                      {
                        backgroundColor: colors.surfaceGlass,
                        borderColor: editForm.avatar === emoji ? `${colors.primary}99` : colors.border
                      },
                      editForm.avatar === emoji && { backgroundColor: `${colors.primary}26` }
                    ]}
                    onPress={() => {
                      setEditForm({ ...editForm, avatar: emoji });
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
                <View style={[styles.avatarPickerCloseGlass, {
                  backgroundColor: `${colors.primary}33`,
                  borderColor: `${colors.primary}66`
                }]}>
                  <Text style={[styles.avatarPickerCloseText, { color: colors.primary }]}>
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
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backButton, { color: colors.text }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
        {!editing ? (
          <TouchableOpacity onPress={() => setEditing(true)}>
            <Text style={[styles.editButton, { color: colors.primary }]}>Edit</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 50 }} />
        )}
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {editing ? (
          /* EDIT MODE */
          <>
            <TouchableOpacity
              style={styles.avatarEditContainer}
              onPress={() => setShowAvatarPicker(true)}
            >
              <View style={[styles.avatarEditGlass, {
                backgroundColor: colors.surfaceGlass,
                borderColor: `${colors.primary}66`
              }]}>
                <Text style={styles.avatarEditEmoji}>{editForm.avatar}</Text>
              </View>
              <Text style={[styles.avatarEditText, { color: colors.primary }]}>
                Tap to change
              </Text>
            </TouchableOpacity>

            <View style={styles.formSection}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Full Name</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={[styles.input, {
                      backgroundColor: colors.surfaceGlass,
                      borderColor: colors.border,
                      color: colors.text
                    }]}
                    value={editForm.fullName}
                    onChangeText={(text) => setEditForm({ ...editForm, fullName: text })}
                    placeholder="Your name"
                    placeholderTextColor={colors.textTertiary}
                    maxLength={50}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Bio</Text>
                <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                  <TextInput
                    style={[styles.input, styles.textArea, {
                      backgroundColor: colors.surfaceGlass,
                      borderColor: colors.border,
                      color: colors.text
                    }]}
                    value={editForm.bio}
                    onChangeText={(text) => setEditForm({ ...editForm, bio: text })}
                    placeholder="Tell us about yourself..."
                    placeholderTextColor={colors.textTertiary}
                    multiline
                    maxLength={200}
                  />
                </View>
                <Text style={[styles.charCount, { color: colors.textTertiary }]}>
                  {editForm.bio.length}/200
                </Text>
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Age</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={[styles.input, {
                        backgroundColor: colors.surfaceGlass,
                        borderColor: colors.border,
                        color: colors.text
                      }]}
                      value={editForm.age}
                      onChangeText={(text) => setEditForm({ ...editForm, age: text.replace(/[^0-9]/g, '') })}
                      placeholder="25"
                      placeholderTextColor={colors.textTertiary}
                      keyboardType="numeric"
                      maxLength={2}
                    />
                  </View>
                </View>

                <View style={[styles.inputGroup, { flex: 2, marginLeft: 12 }]}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Location</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={[styles.input, {
                        backgroundColor: colors.surfaceGlass,
                        borderColor: colors.border,
                        color: colors.text
                      }]}
                      value={editForm.location}
                      onChangeText={(text) => setEditForm({ ...editForm, location: text })}
                      placeholder="City, Country"
                      placeholderTextColor={colors.textTertiary}
                      maxLength={50}
                    />
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.formActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setEditing(false);
                  loadProfile();
                }}
              >
                <View style={[styles.cancelGlass, {
                  backgroundColor: colors.surfaceGlass,
                  borderColor: colors.border
                }]}>
                  <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
                disabled={saving}
              >
                <View style={[styles.saveGlass, {
                  backgroundColor: `${colors.primary}33`,
                  borderColor: `${colors.primary}66`
                }]}>
                  <Text style={[styles.saveButtonText, { color: colors.primary }]}>
                    {saving ? 'Saving...' : 'Save'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          /* VIEW MODE */
          <>
            <View style={styles.profileHeader}>
              <View style={[styles.avatarViewGlass, {
                backgroundColor: colors.surfaceGlass,
                borderColor: `${colors.primary}66`
              }]}>
                <Text style={styles.avatarViewEmoji}>{profile.avatar || '😊'}</Text>
              </View>
              <Text style={[styles.profileName, { color: colors.text }]}>
                {profile.fullName}
              </Text>
              <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>
                {auth.currentUser?.email}
              </Text>
              
              {profile.role === 'admin' && (
                <View style={styles.roleBadge}>
                  <View style={styles.roleBadgeGlass}>
                    <Text style={styles.roleBadgeText}>👑 Admin</Text>
                  </View>
                </View>
              )}
              {profile.role === 'verified_host' && (
                <View style={styles.roleBadge}>
                  <View style={styles.roleBadgeGlass}>
                    <Text style={styles.roleBadgeText}>✓ Verified Host</Text>
                  </View>
                </View>
              )}
            </View>

            {profile.bio && (
              <View style={styles.bioCard}>
                <View style={[styles.bioGlass, {
                  backgroundColor: colors.surfaceGlass,
                  borderColor: colors.border
                }]}>
                  <Text style={[styles.bioText, { color: colors.text }]}>
                    {profile.bio}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.infoSection}>
              <View style={styles.infoCard}>
                <View style={[styles.infoGlass, {
                  backgroundColor: colors.surfaceGlass,
                  borderColor: colors.border
                }]}>
                  <Text style={styles.infoIcon}>🎂</Text>
                  <View style={styles.infoContent}>
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Age</Text>
                    <Text style={[styles.infoValue, { color: colors.text }]}>
                      {profile.age || 'Not set'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.infoCard}>
                <View style={[styles.infoGlass, {
                  backgroundColor: colors.surfaceGlass,
                  borderColor: colors.border
                }]}>
                  <Text style={styles.infoIcon}>📍</Text>
                  <View style={styles.infoContent}>
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Location</Text>
                    <Text style={[styles.infoValue, { color: colors.text }]}>
                      {profile.location || 'Not set'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* THEME TOGGLE SECTION */}
            <View style={styles.themeSection}>
              <View style={[styles.themeCard, {
                backgroundColor: colors.surfaceGlass,
                borderColor: colors.border
              }]}>
                <View style={styles.themeContent}>
                  <Text style={styles.themeIcon}>{isDark ? '🌙' : '☀️'}</Text>
                  <View style={styles.themeInfo}>
                    <Text style={[styles.themeTitle, { color: colors.text }]}>
                      {isDark ? 'Dark Mode' : 'Light Mode'}
                    </Text>
                    <Text style={[styles.themeSubtitle, { color: colors.textSecondary }]}>
                      {isDark ? 'Easier on the eyes' : 'Bright and clear'}
                    </Text>
                  </View>
                  <Switch
                    value={isDark}
                    onValueChange={toggleTheme}
                    trackColor={{ false: '#E5E7EB', true: colors.primary }}
                    thumbColor={isDark ? '#FFFFFF' : '#F3F4F6'}
                  />
                </View>
              </View>
            </View>

            {profile.personality && Object.keys(profile.personality).length > 0 && (
              <View style={styles.personalitySection}>
                <View style={[styles.personalityGlass, {
                  backgroundColor: colors.surfaceGlass,
                  borderColor: colors.border
                }]}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Personality</Text>
                  {Object.entries(profile.personality).map(([trait, score]) => (
                    <View key={trait} style={styles.traitRow}>
                      <Text style={[styles.traitName, { color: colors.text }]}>
                        {trait.charAt(0).toUpperCase() + trait.slice(1)}
                      </Text>
                      <View style={styles.traitBarContainer}>
                        <View style={[styles.traitBar, { backgroundColor: `${colors.border}` }]}>
                          <View style={[styles.traitFill, { 
                            width: `${score}%`,
                            backgroundColor: colors.primary
                          }]} />
                        </View>
                        <Text style={[styles.traitScore, { color: colors.primary }]}>
                          {score}%
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={() => setShowLogoutModal(true)}
            >
              <View style={styles.logoutGlass}>
                <Text style={styles.logoutButtonText}>Logout</Text>
              </View>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 15,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingTop: 60,
      paddingBottom: 20,
    },
    backButton: {
      fontSize: 28,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      letterSpacing: -0.3,
    },
    editButton: {
      fontSize: 15,
      fontWeight: '600',
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 24,
      paddingBottom: 40,
    },
    
    // View Mode
    profileHeader: {
      alignItems: 'center',
      marginBottom: 24,
    },
    avatarViewGlass: {
      width: 100,
      height: 100,
      borderRadius: 50,
      borderWidth: 2,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    avatarViewEmoji: {
      fontSize: 50,
    },
    profileName: {
      fontSize: 24,
      fontWeight: '700',
      marginBottom: 6,
      letterSpacing: -0.5,
    },
    profileEmail: {
      fontSize: 13,
      marginBottom: 12,
    },
    roleBadge: {
      borderRadius: 10,
      overflow: 'hidden',
    },
    roleBadgeGlass: {
      backgroundColor: 'rgba(255, 215, 0, 0.15)',
      borderWidth: 1,
      borderColor: 'rgba(255, 215, 0, 0.3)',
      paddingVertical: 6,
      paddingHorizontal: 14,
    },
    roleBadgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#FFD700',
      letterSpacing: 0.3,
    },
    bioCard: {
      marginBottom: 20,
      borderRadius: 16,
      overflow: 'hidden',
    },
    bioGlass: {
      borderWidth: 1,
      padding: 18,
    },
    bioText: {
      fontSize: 14,
      lineHeight: 22,
      textAlign: 'center',
    },
    infoSection: {
      gap: 12,
      marginBottom: 20,
    },
    infoCard: {
      borderRadius: 16,
      overflow: 'hidden',
    },
    infoGlass: {
      borderWidth: 1,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
    },
    infoIcon: {
      fontSize: 28,
      marginRight: 14,
    },
    infoContent: {
      flex: 1,
    },
    infoLabel: {
      fontSize: 12,
      marginBottom: 4,
    },
    infoValue: {
      fontSize: 16,
      fontWeight: '600',
      letterSpacing: -0.2,
    },
    
    // Theme Section
    themeSection: {
      marginBottom: 20,
    },
    themeCard: {
      borderRadius: 16,
      borderWidth: 1,
      overflow: 'hidden',
    },
    themeContent: {
      padding: 18,
      flexDirection: 'row',
      alignItems: 'center',
    },
    themeIcon: {
      fontSize: 28,
      marginRight: 14,
    },
    themeInfo: {
      flex: 1,
    },
    themeTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 4,
      letterSpacing: -0.2,
    },
    themeSubtitle: {
      fontSize: 13,
    },
    
    personalitySection: {
      marginBottom: 20,
      borderRadius: 16,
      overflow: 'hidden',
    },
    personalityGlass: {
      borderWidth: 1,
      padding: 18,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 16,
      letterSpacing: -0.2,
    },
    traitRow: {
      marginBottom: 14,
    },
    traitName: {
      fontSize: 13,
      fontWeight: '600',
      marginBottom: 8,
      letterSpacing: -0.1,
    },
    traitBarContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    traitBar: {
      flex: 1,
      height: 8,
      borderRadius: 4,
      overflow: 'hidden',
    },
    traitFill: {
      height: '100%',
      borderRadius: 4,
    },
    traitScore: {
      fontSize: 13,
      fontWeight: '600',
      width: 40,
      textAlign: 'right',
    },
    logoutButton: {
      borderRadius: 16,
      overflow: 'hidden',
    },
    logoutGlass: {
      backgroundColor: 'rgba(239, 68, 68, 0.15)',
      borderWidth: 1,
      borderColor: 'rgba(239, 68, 68, 0.3)',
      paddingVertical: 16,
      alignItems: 'center',
    },
    logoutButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#EF4444',
      letterSpacing: -0.1,
    },
    
    // Edit Mode
    avatarEditContainer: {
      alignItems: 'center',
      marginBottom: 28,
    },
    avatarEditGlass: {
      width: 100,
      height: 100,
      borderRadius: 50,
      borderWidth: 2,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    avatarEditEmoji: {
      fontSize: 50,
    },
    avatarEditText: {
      fontSize: 13,
      fontWeight: '600',
    },
    formSection: {
      gap: 16,
      marginBottom: 24,
    },
    inputGroup: {
      gap: 8,
    },
    inputLabel: {
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: -0.1,
    },
    inputWrapper: {
      borderRadius: 12,
      overflow: 'hidden',
    },
    input: {
      borderWidth: 1,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 15,
    },
    textAreaWrapper: {},
    textArea: {
      minHeight: 100,
      textAlignVertical: 'top',
    },
    charCount: {
      fontSize: 11,
      textAlign: 'right',
    },
    inputRow: {
      flexDirection: 'row',
    },
    formActions: {
      flexDirection: 'row',
      gap: 12,
    },
    cancelButton: {
      flex: 1,
      borderRadius: 12,
      overflow: 'hidden',
    },
    cancelGlass: {
      borderWidth: 1,
      paddingVertical: 14,
      alignItems: 'center',
    },
    cancelButtonText: {
      fontSize: 15,
      fontWeight: '600',
    },
    saveButton: {
      flex: 1,
      borderRadius: 12,
      overflow: 'hidden',
    },
    saveGlass: {
      borderWidth: 1,
      paddingVertical: 14,
      alignItems: 'center',
    },
    saveButtonText: {
      fontSize: 15,
      fontWeight: '600',
    },
    
    // Modals
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    modalContent: {
      width: '100%',
      maxWidth: 400,
      borderRadius: 20,
      overflow: 'hidden',
    },
    modalGlass: {
      borderWidth: 1,
      padding: 28,
      alignItems: 'center',
    },
    modalEmoji: {
      fontSize: 56,
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      marginBottom: 8,
      letterSpacing: -0.3,
    },
    modalText: {
      fontSize: 14,
      textAlign: 'center',
      marginBottom: 24,
    },
    modalButtons: {
      flexDirection: 'row',
      gap: 12,
      width: '100%',
    },
    modalCancelButton: {
      flex: 1,
      borderRadius: 12,
      overflow: 'hidden',
    },
    modalCancelGlass: {
      borderWidth: 1,
      paddingVertical: 12,
      alignItems: 'center',
    },
    modalCancelText: {
      fontSize: 15,
      fontWeight: '600',
    },
    modalLogoutButton: {
      flex: 1,
      borderRadius: 12,
      overflow: 'hidden',
    },
    modalLogoutGlass: {
      backgroundColor: 'rgba(239, 68, 68, 0.2)',
      borderWidth: 1,
      borderColor: 'rgba(239, 68, 68, 0.4)',
      paddingVertical: 12,
      alignItems: 'center',
    },
    modalLogoutText: {
      fontSize: 15,
      fontWeight: '600',
      color: '#EF4444',
    },
    
    // Avatar Picker
    avatarPickerModal: {
      width: '100%',
      maxWidth: 500,
      maxHeight: '80%',
      borderRadius: 20,
      overflow: 'hidden',
    },
    avatarPickerGlass: {
      borderWidth: 1,
      padding: 24,
    },
    avatarPickerTitle: {
      fontSize: 18,
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: 20,
      letterSpacing: -0.3,
    },
    avatarGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 10,
      marginBottom: 20,
    },
    avatarOption: {
      width: 56,
      height: 56,
      borderRadius: 12,
      borderWidth: 2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarOptionEmoji: {
      fontSize: 28,
    },
    avatarPickerClose: {
      borderRadius: 12,
      overflow: 'hidden',
    },
    avatarPickerCloseGlass: {
      borderWidth: 1,
      paddingVertical: 14,
      alignItems: 'center',
    },
    avatarPickerCloseText: {
      fontSize: 15,
      fontWeight: '600',
    },
  });
}
