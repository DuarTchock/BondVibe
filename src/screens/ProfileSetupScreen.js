import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { useTheme } from '../contexts/ThemeContext';

const EMOJI_OPTIONS = ['😊', '🎨', '🎮', '📚', '🎵', '⚽', '🍕', '✈️', '🌟', '🎭', '🏃', '💻'];

export default function ProfileSetupScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const [name, setName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('😊');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    console.log('🎯 Complete Profile clicked');
    console.log('👤 Name:', name);
    console.log('🎨 Emoji:', selectedEmoji);

    if (!name.trim()) {
      console.log('❌ Name is empty');
      Alert.alert('Name Required', 'Please enter your name to continue.');
      return;
    }

    setLoading(true);
    console.log('⏳ Updating profile...');

    try {
      const user = auth.currentUser;
      if (!user) {
        console.log('❌ No user found');
        Alert.alert('Error', 'No user found. Please log in again.');
        setLoading(false);
        return;
      }

      console.log('💾 Saving profile data for user:', user.uid);

      await updateDoc(doc(db, 'users', user.uid), {
        name: name.trim(),
        emoji: selectedEmoji,
        profileCompleted: true,
        profileCompletedAt: new Date().toISOString(),
      });

      console.log('✅ Profile completed successfully');
      console.log('🔄 Forcing page reload to trigger navigation...');
      
      // Force full page reload - this will trigger AppNavigator to detect profileCompleted
      window.location.reload();
      
    } catch (error) {
      console.error('❌ Profile creation error:', error);
      Alert.alert('Error', 'Failed to save your profile. Please try again.');
      setLoading(false);
    }
  };

  const styles = createStyles(colors);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.selectedEmoji}>{selectedEmoji}</Text>
          <Text style={[styles.title, { color: colors.text }]}>Create Your Profile</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Let's get to know you
          </Text>
        </View>

        {/* Name Input */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Your Name</Text>
          <View style={[styles.inputWrapper, {
            backgroundColor: colors.surfaceGlass,
            borderColor: colors.border
          }]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Enter your name"
              placeholderTextColor={colors.textTertiary}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>
        </View>

        {/* Emoji Picker */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Choose Your Avatar</Text>
          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            Pick an emoji that represents you
          </Text>
          <View style={styles.emojiGrid}>
            {EMOJI_OPTIONS.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={[styles.emojiButton, {
                  backgroundColor: selectedEmoji === emoji ? `${colors.primary}33` : colors.surfaceGlass,
                  borderColor: selectedEmoji === emoji ? colors.primary : colors.border,
                  borderWidth: selectedEmoji === emoji ? 2 : 1,
                }]}
                onPress={() => {
                  console.log('🎨 Emoji selected:', emoji);
                  setSelectedEmoji(emoji);
                }}
              >
                <Text style={styles.emoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, {
            opacity: name.trim() ? 1 : 0.5,
          }]}
          onPress={handleSubmit}
          disabled={!name.trim() || loading}
        >
          <View style={[styles.submitGlass, {
            backgroundColor: `${colors.primary}33`,
            borderColor: `${colors.primary}66`,
          }]}>
            {loading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={[styles.submitText, { color: colors.primary }]}>
                Complete Profile
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: { flex: 1 },
    scrollView: { flex: 1 },
    content: { padding: 24, paddingTop: 60 },
    header: { alignItems: 'center', marginBottom: 48 },
    selectedEmoji: { fontSize: 80, marginBottom: 16 },
    title: { fontSize: 28, fontWeight: '700', marginBottom: 8, letterSpacing: -0.4 },
    subtitle: { fontSize: 15, textAlign: 'center' },
    section: { marginBottom: 32 },
    label: { fontSize: 16, fontWeight: '700', marginBottom: 12, letterSpacing: -0.2 },
    helperText: { fontSize: 14, marginBottom: 16 },
    inputWrapper: { 
      borderWidth: 1, 
      borderRadius: 16, 
      paddingHorizontal: 16,
    },
    input: { 
      fontSize: 16, 
      paddingVertical: 16,
    },
    emojiGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    emojiButton: {
      width: 60,
      height: 60,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emoji: { fontSize: 28 },
    submitButton: { 
      borderRadius: 16, 
      overflow: 'hidden', 
      marginTop: 16,
    },
    submitGlass: { 
      borderWidth: 1, 
      paddingVertical: 18, 
      alignItems: 'center',
    },
    submitText: { 
      fontSize: 18, 
      fontWeight: '700', 
      letterSpacing: -0.2,
    },
  });
}
