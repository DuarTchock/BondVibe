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
  '😊', '🎉', '🌟', '��', '🎭', '🎪', '🎬', '🎮',
  '🎯', '🎲', '🎸', '��', '🎺', '🎻', '🎤', '🎧',
  '🌈', '🌸', '🌺', '��', '🌼', '🌷', '🍕', '🍔',
  '🍰', '🎂', '🍦', '��', '☕', '🍵', '🌮', '🌯',
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
      
      {/* Modals remain the same but use dynamic colors */}
      
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
        {!editing && (
          <>
            {/* Existing profile view content */}
            <View style={styles.profileHeader}>
              <View style={[styles.avatarViewGlass, { 
                backgroundColor: colors.surfaceGlass,
                borderColor: `${colors.primary}66`
              }]}>
                <Text style={styles.avatarViewEmoji}>{profile.avatar || '😊'}</Text>
              </View>
              <Text style={[styles.profileName, { color: colors.text }]}>{profile.fullName}</Text>
              <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>
                {auth.currentUser?.email}
              </Text>
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

            {/* Rest of profile content */}
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={() => setShowLogoutModal(true)}
            >
              <View style={[styles.logoutGlass, {
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                borderColor: 'rgba(239, 68, 68, 0.3)'
              }]}>
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
    
    logoutButton: {
      borderRadius: 16,
      overflow: 'hidden',
    },
    logoutGlass: {
      borderWidth: 1,
      paddingVertical: 16,
      alignItems: 'center',
    },
    logoutButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#EF4444',
      letterSpacing: -0.1,
    },
  });
}
