import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { auth, db } from '../services/firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import Colors from '../constants/Colors';
import Sizes from '../constants/Sizes';

export default function HomeScreen() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        setProfile(userDoc.data());
      }
    } catch (error) {
      console.error('Load profile error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to BondVibe! ��</Text>

      <Text style={styles.avatar}>{profile?.avatar || '✨'}</Text>

      <Text style={styles.name}>{profile?.fullName || 'User'}</Text>
      <Text style={styles.email}>{auth.currentUser?.email}</Text>
      <Text style={styles.info}>
        {profile?.age} years old • {profile?.location}
      </Text>

      {profile?.bio && (
        <Text style={styles.bio}>{profile.bio}</Text>
      )}

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          🧠 Your personality profile will help us match you with compatible people for group events
        </Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Sizes.padding * 2,
  },
  title: {
    fontSize: Sizes.fontSize.xlarge,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 24,
    textAlign: 'center',
  },
  avatar: {
    fontSize: 80,
    marginBottom: 16,
  },
  name: {
    fontSize: Sizes.fontSize.large,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  email: {
    fontSize: Sizes.fontSize.medium,
    color: Colors.textLight,
    marginBottom: 8,
  },
  info: {
    fontSize: Sizes.fontSize.medium,
    color: Colors.text,
    marginBottom: 12,
  },
  bio: {
    fontSize: Sizes.fontSize.medium,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  infoBox: {
    backgroundColor: '#F0F0FF',
    padding: 16,
    borderRadius: Sizes.borderRadius,
    marginBottom: 24,
    maxWidth: 400,
  },
  infoText: {
    fontSize: Sizes.fontSize.small,
    color: Colors.text,
    textAlign: 'center',
  },
  button: {
    backgroundColor: Colors.error,
    padding: Sizes.padding,
    borderRadius: Sizes.borderRadius,
    width: 200,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: Sizes.fontSize.medium,
    fontWeight: '600',
  },
});
