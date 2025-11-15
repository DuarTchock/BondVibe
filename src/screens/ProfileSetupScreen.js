import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { auth, db } from '../services/firebase';
import { doc, setDoc } from 'firebase/firestore';
import Colors from '../constants/Colors';
import Sizes from '../constants/Sizes';

export default function ProfileSetupScreen({ onComplete }) {
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);

  const getRandomAvatar = () => {
    const emojis = ['🎭', '🎨', '🎸', '🎯', '🎪', '🎬', '🎮', '🎲', '🎵', '🎺'];
    return emojis[Math.floor(Math.random() * emojis.length)];
  };

  const handleSubmit = async () => {
    // Validaciones
    if (!fullName.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }

    if (!age || parseInt(age) < 18) {
      Alert.alert('Error', 'You must be 18 or older to use BondVibe');
      return;
    }

    if (parseInt(age) > 100) {
      Alert.alert('Error', 'Please enter a valid age');
      return;
    }

    if (!location.trim()) {
      Alert.alert('Error', 'Please enter your location');
      return;
    }

    setLoading(true);

    try {
      // Save profile to Firestore
      await setDoc(doc(db, 'users', auth.currentUser.uid), {
        fullName: fullName.trim(),
        age: parseInt(age),
        location: location.trim(),
        bio: bio.trim() || '',
        avatar: getRandomAvatar(),
        email: auth.currentUser.email,
        createdAt: new Date().toISOString(),
        profileCompleted: true,
      });

      onComplete();
    } catch (error) {
      console.error('Profile creation error:', error);
      Alert.alert('Error', 'Failed to create profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.content}>
        <Text style={styles.emoji}>✨</Text>
        <Text style={styles.title}>Complete Your Profile</Text>
        <Text style={styles.subtitle}>
          We focus on personality, not appearance
        </Text>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="John Doe"
            value={fullName}
            onChangeText={setFullName}
          />

          <Text style={styles.label}>Age *</Text>
          <TextInput
            style={styles.input}
            placeholder="25"
            value={age}
            onChangeText={setAge}
            keyboardType="number-pad"
            maxLength={2}
          />

          <Text style={styles.label}>Location *</Text>
          <TextInput
            style={styles.input}
            placeholder="Guadalajara, Mexico"
            value={location}
            onChangeText={setLocation}
          />

          <Text style={styles.label}>Bio (Optional)</Text>
          <TextInput
            style={[styles.input, styles.bioInput]}
            placeholder="Tell us about yourself..."
            value={bio}
            onChangeText={setBio}
            multiline
            maxLength={150}
          />
          <Text style={styles.charCount}>{bio.length}/150</Text>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Creating Profile...' : 'Complete Profile'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Sizes.padding * 2,
  },
  emoji: {
    fontSize: 60,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: Sizes.fontSize.xlarge,
    fontWeight: 'bold',
    color: Colors.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Sizes.fontSize.medium,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: 30,
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: Sizes.fontSize.medium,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8F9FA',
    padding: Sizes.padding,
    borderRadius: Sizes.borderRadius,
    marginBottom: 16,
    fontSize: Sizes.fontSize.medium,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bioInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: Sizes.fontSize.small,
    color: Colors.textLight,
    textAlign: 'right',
    marginTop: -12,
    marginBottom: 16,
  },
  button: {
    backgroundColor: Colors.primary,
    padding: Sizes.padding,
    borderRadius: Sizes.borderRadius,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: Sizes.fontSize.medium,
    fontWeight: '600',
  },
});
