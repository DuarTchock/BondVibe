import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { signOut } from 'firebase/auth';

const EMOJI_AVATARS = [
  '😊', '🎉', '🌟', '🎨', '🎭', '🎪', '��', '🎮',
  '🎯', '🎲', '🎸', '🎹', '🎺', '🎻', '��', '🎧',
  '🌈', '🌸', '🌺', '🌻', '🌼', '🌷', '��', '🍔',
  '🍰', '🎂', '🍦', '🍩', '☕', '🍵', '🌮', '🌯',
  '🦄', '🐶', '🐱', '🐼', '🦊', '🦁', '🐯', '🐨',
  '🚀', '✨', '🔥', '💫', '⭐', '🌙', '☀️', '🌊',
];

export default function ProfileScreen({ navigation }) {
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

  if (!profile) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Logout Modal */}
      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalGlass}>
              <Text style={styles.modalEmoji}>👋</Text>
              <Text style={styles.modalTitle}>Logout</Text>
              <Text style={styles.modalText}>
                Are you sure you want to logout?
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setShowLogoutModal(false)}
                >
                  <View style={styles.modalCancelGlass}>
                    <Text style={styles.modalCancelText}>Cancel</Text>
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
            <View style={styles.avatarPickerGlass}>
              <Text style={styles.avatarPickerTitle}>Choose Avatar</Text>
              <ScrollView contentContainerStyle={styles.avatarGrid}>
                {EMOJI_AVATARS.map((emoji) => (
                  <TouchableOpacity
                    key={emoji}
                    style={[
                      styles.avatarOption,
                      editForm.avatar === emoji && styles.avatarOptionSelected
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
                <View style={styles.avatarPickerCloseGlass}>
                  <Text style={styles.avatarPickerCloseText}>Close</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        {!editing ? (
          <TouchableOpacity onPress={() => setEditing(true)}>
            <Text style={styles.editButton}>Edit</Text>
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
              <View style={styles.avatarEditGlass}>
                <Text style={styles.avatarEditEmoji}>{editForm.avatar}</Text>
              </View>
              <Text style={styles.avatarEditText}>Tap to change</Text>
            </TouchableOpacity>

            <View style={styles.formSection}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={editForm.fullName}
                    onChangeText={(text) => setEditForm({ ...editForm, fullName: text })}
                    placeholder="Your name"
                    placeholderTextColor="#64748B"
                    maxLength={50}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Bio</Text>
                <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={editForm.bio}
                    onChangeText={(text) => setEditForm({ ...editForm, bio: text })}
                    placeholder="Tell us about yourself..."
                    placeholderTextColor="#64748B"
                    multiline
                    maxLength={200}
                  />
                </View>
                <Text style={styles.charCount}>{editForm.bio.length}/200</Text>
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Age</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      value={editForm.age}
                      onChangeText={(text) => setEditForm({ ...editForm, age: text.replace(/[^0-9]/g, '') })}
                      placeholder="25"
                      placeholderTextColor="#64748B"
                      keyboardType="numeric"
                      maxLength={2}
                    />
                  </View>
                </View>

                <View style={[styles.inputGroup, { flex: 2, marginLeft: 12 }]}>
                  <Text style={styles.inputLabel}>Location</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      value={editForm.location}
                      onChangeText={(text) => setEditForm({ ...editForm, location: text })}
                      placeholder="City, Country"
                      placeholderTextColor="#64748B"
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
                <View style={styles.cancelGlass}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
                disabled={saving}
              >
                <View style={styles.saveGlass}>
                  <Text style={styles.saveButtonText}>
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
              <View style={styles.avatarViewGlass}>
                <Text style={styles.avatarViewEmoji}>{profile.avatar || '😊'}</Text>
              </View>
              <Text style={styles.profileName}>{profile.fullName}</Text>
              <Text style={styles.profileEmail}>{auth.currentUser?.email}</Text>
              
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
                <View style={styles.bioGlass}>
                  <Text style={styles.bioText}>{profile.bio}</Text>
                </View>
              </View>
            )}

            <View style={styles.infoSection}>
              <View style={styles.infoCard}>
                <View style={styles.infoGlass}>
                  <Text style={styles.infoIcon}>🎂</Text>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Age</Text>
                    <Text style={styles.infoValue}>{profile.age || 'Not set'}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.infoCard}>
                <View style={styles.infoGlass}>
                  <Text style={styles.infoIcon}>📍</Text>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Location</Text>
                    <Text style={styles.infoValue}>{profile.location || 'Not set'}</Text>
                  </View>
                </View>
              </View>
            </View>

            {profile.personality && Object.keys(profile.personality).length > 0 && (
              <View style={styles.personalitySection}>
                <View style={styles.personalityGlass}>
                  <Text style={styles.sectionTitle}>Personality</Text>
                  {Object.entries(profile.personality).map(([trait, score]) => (
                    <View key={trait} style={styles.traitRow}>
                      <Text style={styles.traitName}>
                        {trait.charAt(0).toUpperCase() + trait.slice(1)}
                      </Text>
                      <View style={styles.traitBarContainer}>
                        <View style={styles.traitBar}>
                          <View style={[styles.traitFill, { width: `${score}%` }]} />
                        </View>
                        <Text style={styles.traitScore}>{score}%</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F1A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0B0F1A',
  },
  loadingText: {
    fontSize: 15,
    color: '#94A3B8',
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
    color: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F1F5F9',
    letterSpacing: -0.3,
  },
  editButton: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF3EA5',
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
    backgroundColor: 'rgba(17, 24, 39, 0.6)',
    borderWidth: 2,
    borderColor: 'rgba(255, 62, 165, 0.4)',
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
    color: '#F1F5F9',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  profileEmail: {
    fontSize: 13,
    color: '#94A3B8',
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
    backgroundColor: 'rgba(17, 24, 39, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 18,
  },
  bioText: {
    fontSize: 14,
    color: '#F1F5F9',
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
    backgroundColor: 'rgba(17, 24, 39, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
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
    color: '#94A3B8',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F1F5F9',
    letterSpacing: -0.2,
  },
  personalitySection: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  personalityGlass: {
    backgroundColor: 'rgba(17, 24, 39, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F1F5F9',
    marginBottom: 16,
    letterSpacing: -0.2,
  },
  traitRow: {
    marginBottom: 14,
  },
  traitName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F1F5F9',
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
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  traitFill: {
    height: '100%',
    backgroundColor: '#FF3EA5',
    borderRadius: 4,
  },
  traitScore: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF3EA5',
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
    backgroundColor: 'rgba(17, 24, 39, 0.6)',
    borderWidth: 2,
    borderColor: 'rgba(255, 62, 165, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarEditEmoji: {
    fontSize: 50,
  },
  avatarEditText: {
    fontSize: 13,
    color: '#FF3EA5',
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
    color: '#F1F5F9',
    letterSpacing: -0.1,
  },
  inputWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  input: {
    backgroundColor: 'rgba(17, 24, 39, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#F1F5F9',
  },
  textAreaWrapper: {},
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 11,
    color: '#64748B',
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
    backgroundColor: 'rgba(17, 24, 39, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F1F5F9',
  },
  saveButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveGlass: {
    backgroundColor: 'rgba(255, 62, 165, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 62, 165, 0.4)',
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF3EA5',
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
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
    color: '#F1F5F9',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  modalText: {
    fontSize: 14,
    color: '#94A3B8',
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
    backgroundColor: 'rgba(17, 24, 39, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F1F5F9',
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
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 24,
  },
  avatarPickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F1F5F9',
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
    backgroundColor: 'rgba(17, 24, 39, 0.6)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarOptionSelected: {
    borderColor: 'rgba(255, 62, 165, 0.6)',
    backgroundColor: 'rgba(255, 62, 165, 0.15)',
  },
  avatarOptionEmoji: {
    fontSize: 28,
  },
  avatarPickerClose: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  avatarPickerCloseGlass: {
    backgroundColor: 'rgba(255, 62, 165, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 62, 165, 0.4)',
    paddingVertical: 14,
    alignItems: 'center',
  },
  avatarPickerCloseText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF3EA5',
  },
});
