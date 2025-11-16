import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { signOut } from 'firebase/auth';
import Colors from '../constants/Colors';
import Sizes from '../constants/Sizes';

const EMOJI_AVATARS = [
  '😊', '🎉', '🌟', '🎨', '🎭', '🎪', '🎬', '🎮',
  '🎯', '🎲', '🎸', '🎹', '🎺', '🎻', '🎤', '🎧',
  '🌈', '🌸', '🌺', '🌻', '🌼', '🌷', '🍕', '🍔',
  '🍰', '🎂', '🍦', '🍩', '☕', '��', '🌮', '🌯',
  '🦄', '🐶', '🐱', '🐼', '🦊', '��', '🐯', '🐨',
  '🚀', '✨', '🔥', '💫', '⭐', '🌙', '☀️', '🌊',
];

export default function ProfileScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  
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
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editForm.fullName.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

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
      Alert.alert('Success', 'Profile updated successfully');
      console.log('✅ Profile updated');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: performLogout,
        },
      ]
    );
  };

  const performLogout = async () => {
    try {
      console.log('Logging out...');
      await signOut(auth);
      console.log('✅ Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        {!editing && (
          <TouchableOpacity onPress={() => setEditing(true)}>
            <Text style={styles.editButton}>Edit</Text>
          </TouchableOpacity>
        )}
        {editing && <View style={{ width: 50 }} />}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {editing ? (
          // EDIT MODE
          <>
            <TouchableOpacity
              style={styles.avatarPickerButton}
              onPress={() => setShowAvatarPicker(!showAvatarPicker)}
            >
              <Text style={styles.avatarLarge}>{editForm.avatar}</Text>
              <Text style={styles.changeAvatarText}>Tap to change avatar</Text>
            </TouchableOpacity>

            {showAvatarPicker && (
              <View style={styles.emojiGrid}>
                {EMOJI_AVATARS.map((emoji) => (
                  <TouchableOpacity
                    key={emoji}
                    style={[
                      styles.emojiOption,
                      editForm.avatar === emoji && styles.selectedEmoji
                    ]}
                    onPress={() => {
                      setEditForm({ ...editForm, avatar: emoji });
                      setShowAvatarPicker(false);
                    }}
                  >
                    <Text style={styles.emojiOptionText}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={styles.formGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                value={editForm.fullName}
                onChangeText={(text) => setEditForm({ ...editForm, fullName: text })}
                placeholder="Your name"
                maxLength={50}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Bio</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editForm.bio}
                onChangeText={(text) => setEditForm({ ...editForm, bio: text })}
                placeholder="Tell us about yourself..."
                multiline
                maxLength={200}
              />
              <Text style={styles.charCount}>{editForm.bio.length}/200</Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Age</Text>
              <TextInput
                style={styles.input}
                value={editForm.age}
                onChangeText={(text) => setEditForm({ ...editForm, age: text.replace(/[^0-9]/g, '') })}
                placeholder="Your age"
                keyboardType="numeric"
                maxLength={2}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Location</Text>
              <TextInput
                style={styles.input}
                value={editForm.location}
                onChangeText={(text) => setEditForm({ ...editForm, location: text })}
                placeholder="City, Country"
                maxLength={50}
              />
            </View>

            <View style={styles.formActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setEditing(false);
                  setShowAvatarPicker(false);
                  loadProfile();
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveButton, saving && styles.buttonDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        ) : (
          // VIEW MODE
          <>
            <Text style={styles.avatarLarge}>{profile?.avatar || '😊'}</Text>
            
            <Text style={styles.name}>{profile?.fullName}</Text>
            <Text style={styles.email}>{auth.currentUser?.email}</Text>

            {profile?.bio && (
              <View style={styles.bioCard}>
                <Text style={styles.bioText}>{profile.bio}</Text>
              </View>
            )}

            <View style={styles.infoSection}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Age:</Text>
                <Text style={styles.infoValue}>{profile?.age || 'Not set'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Location:</Text>
                <Text style={styles.infoValue}>{profile?.location || 'Not set'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Role:</Text>
                <Text style={styles.infoValue}>
                  {profile?.role === 'admin' ? '🏆 Admin' :
                   profile?.role === 'verified_host' ? '✓ Verified Host' :
                   '👤 Member'}
                </Text>
              </View>
            </View>

            {profile?.personality && Object.keys(profile.personality).length > 0 && (
              <View style={styles.personalitySection}>
                <Text style={styles.sectionTitle}>Personality Profile</Text>
                {Object.entries(profile.personality).map(([trait, score]) => (
                  <View key={trait} style={styles.traitRow}>
                    <Text style={styles.traitName}>
                      {trait.charAt(0).toUpperCase() + trait.slice(1)}
                    </Text>
                    <View style={styles.traitBar}>
                      <View style={[styles.traitFill, { width: `${score}%` }]} />
                    </View>
                    <Text style={styles.traitScore}>{score}%</Text>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutButtonText}>Logout</Text>
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
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: Sizes.padding * 2,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    fontSize: Sizes.fontSize.medium,
    color: Colors.primary,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: Sizes.fontSize.large,
    fontWeight: 'bold',
    color: Colors.text,
  },
  editButton: {
    fontSize: Sizes.fontSize.medium,
    color: Colors.primary,
    fontWeight: '600',
  },
  content: {
    padding: Sizes.padding * 2,
    alignItems: 'center',
  },
  avatarLarge: {
    fontSize: 100,
    marginBottom: 16,
  },
  name: {
    fontSize: Sizes.fontSize.xlarge,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  email: {
    fontSize: Sizes.fontSize.medium,
    color: Colors.textLight,
    marginBottom: 24,
  },
  bioCard: {
    backgroundColor: Colors.background,
    padding: 16,
    borderRadius: Sizes.borderRadius,
    width: '100%',
    marginBottom: 24,
  },
  bioText: {
    fontSize: Sizes.fontSize.medium,
    color: Colors.text,
    lineHeight: 22,
    textAlign: 'center',
  },
  infoSection: {
    backgroundColor: Colors.background,
    padding: 16,
    borderRadius: Sizes.borderRadius,
    width: '100%',
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoLabel: {
    fontSize: Sizes.fontSize.medium,
    color: Colors.textLight,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: Sizes.fontSize.medium,
    color: Colors.text,
  },
  personalitySection: {
    backgroundColor: Colors.background,
    padding: 16,
    borderRadius: Sizes.borderRadius,
    width: '100%',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: Sizes.fontSize.large,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  traitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  traitName: {
    fontSize: Sizes.fontSize.small,
    color: Colors.text,
    width: 100,
  },
  traitBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  traitFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  traitScore: {
    fontSize: Sizes.fontSize.small,
    color: Colors.text,
    width: 40,
    textAlign: 'right',
  },
  avatarPickerButton: {
    alignItems: 'center',
    marginBottom: 24,
  },
  changeAvatarText: {
    fontSize: Sizes.fontSize.small,
    color: Colors.primary,
    marginTop: 8,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    padding: 16,
    borderRadius: Sizes.borderRadius,
    marginBottom: 24,
  },
  emojiOption: {
    padding: 8,
    margin: 4,
    borderRadius: 8,
  },
  selectedEmoji: {
    backgroundColor: Colors.primary + '20',
  },
  emojiOptionText: {
    fontSize: 32,
  },
  formGroup: {
    width: '100%',
    marginBottom: 20,
  },
  label: {
    fontSize: Sizes.fontSize.medium,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Sizes.borderRadius,
    padding: 12,
    fontSize: Sizes.fontSize.medium,
    color: Colors.text,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: Sizes.fontSize.small,
    color: Colors.textLight,
    textAlign: 'right',
    marginTop: 4,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.border,
    padding: Sizes.padding + 4,
    borderRadius: Sizes.borderRadius,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    color: Colors.text,
    fontSize: Sizes.fontSize.medium,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    padding: Sizes.padding + 4,
    borderRadius: Sizes.borderRadius,
    alignItems: 'center',
    marginLeft: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: Sizes.fontSize.medium,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: Colors.error,
    padding: Sizes.padding + 4,
    borderRadius: Sizes.borderRadius,
    width: '100%',
    alignItems: 'center',
    marginTop: 24,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: Sizes.fontSize.medium,
    fontWeight: '600',
  },
});
