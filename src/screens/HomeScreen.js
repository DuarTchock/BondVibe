import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { auth, db } from '../services/firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import Colors from '../constants/Colors';
import Sizes from '../constants/Sizes';

export default function HomeScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);

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

  const handleMakeAdmin = async () => {
    setUpgrading(true);
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        role: 'admin',
        hostProfile: {
          verified: true,
          eventsHosted: 0,
          rating: 5,
          verifiedAt: new Date().toISOString(),
          bio: 'BondVibe Team',
        },
      });
      // Reload profile
      await loadProfile();
      console.log('✅ You are now an admin!');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setUpgrading(false);
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

  const userRole = profile?.role || 'user';
  const canCreateEvents = userRole === 'admin' || userRole === 'verified_host';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to BondVibe! 🎉</Text>

      <Text style={styles.avatar}>{profile?.avatar || '✨'}</Text>

      <Text style={styles.name}>{profile?.fullName || 'User'}</Text>
      <Text style={styles.email}>{auth.currentUser?.email}</Text>
      <Text style={styles.info}>
        {profile?.age} years old • {profile?.location}
      </Text>

      {profile?.bio && (
        <Text style={styles.bio}>{profile.bio}</Text>
      )}

      {/* Role Badge */}
      {userRole === 'admin' && (
        <View style={styles.adminBadge}>
          <Text style={styles.badgeText}>🏆 BondVibe Admin</Text>
        </View>
      )}
      {userRole === 'verified_host' && (
        <View style={styles.hostBadge}>
          <Text style={styles.badgeText}>✓ Verified Host</Text>
        </View>
      )}

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          🧠 Your personality profile will help us match you with compatible people for group events
        </Text>
      </View>

      <View style={styles.verifiedBox}>
        <Text style={styles.verifiedIcon}>✓</Text>
        <Text style={styles.verifiedText}>Email Verified</Text>
      </View>

      <View style={styles.safetyNote}>
        <Text style={styles.safetyIcon}>🛡️</Text>
        <Text style={styles.safetyText}>
          Always meet in public places and trust your instincts
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={styles.exploreButton} 
          onPress={() => navigation.navigate('EventFeed')}
        >
          <Text style={styles.exploreButtonText}>🎯 Explore Events</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.createButton} 
          onPress={() => navigation.navigate('CreateEvent')}
        >
          <Text style={styles.createButtonText}>
            {canCreateEvents ? '➕ Create Event' : '🌟 Become a Host'}
          </Text>
        </TouchableOpacity>

        {/* Temporary Admin Button - Remove in production */}
        {userRole === 'user' && (
          <TouchableOpacity 
            style={[styles.devButton, upgrading && styles.buttonDisabled]} 
            onPress={handleMakeAdmin}
            disabled={upgrading}
          >
            <Text style={styles.devButtonText}>
              {upgrading ? 'Upgrading...' : '🔧 Make Me Admin'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
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
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  adminBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  hostBadge: {
    backgroundColor: Colors.success,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  badgeText: {
    fontSize: Sizes.fontSize.small,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  infoBox: {
    backgroundColor: '#F0F0FF',
    padding: 16,
    borderRadius: Sizes.borderRadius,
    marginBottom: 16,
    maxWidth: 400,
  },
  infoText: {
    fontSize: Sizes.fontSize.small,
    color: Colors.text,
    textAlign: 'center',
  },
  verifiedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: Sizes.borderRadius,
    marginBottom: 16,
  },
  verifiedIcon: {
    fontSize: 20,
    color: Colors.success,
    marginRight: 8,
    fontWeight: 'bold',
  },
  verifiedText: {
    fontSize: Sizes.fontSize.small,
    color: Colors.success,
    fontWeight: '600',
  },
  safetyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    padding: 12,
    borderRadius: Sizes.borderRadius,
    marginBottom: 24,
    maxWidth: 400,
  },
  safetyIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  safetyText: {
    flex: 1,
    fontSize: Sizes.fontSize.small,
    color: Colors.text,
  },
  actionsContainer: {
    width: '100%',
    maxWidth: 300,
    marginBottom: 16,
  },
  exploreButton: {
    backgroundColor: Colors.primary,
    padding: Sizes.padding + 4,
    borderRadius: Sizes.borderRadius,
    alignItems: 'center',
    marginBottom: 12,
  },
  exploreButtonText: {
    color: '#FFFFFF',
    fontSize: Sizes.fontSize.large,
    fontWeight: '700',
  },
  createButton: {
    backgroundColor: Colors.secondary,
    padding: Sizes.padding + 4,
    borderRadius: Sizes.borderRadius,
    alignItems: 'center',
    marginBottom: 12,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: Sizes.fontSize.large,
    fontWeight: '700',
  },
  devButton: {
    backgroundColor: '#9E9E9E',
    padding: Sizes.padding,
    borderRadius: Sizes.borderRadius,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  devButtonText: {
    color: '#FFFFFF',
    fontSize: Sizes.fontSize.small,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: Colors.error,
    padding: Sizes.padding,
    borderRadius: Sizes.borderRadius,
    width: 200,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: Sizes.fontSize.medium,
    fontWeight: '600',
  },
});
