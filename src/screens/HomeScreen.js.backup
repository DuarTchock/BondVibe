import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { auth, db } from '../services/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useUnreadNotifications } from '../hooks/useUnreadNotifications';
import Colors from '../constants/Colors';
import Sizes from '../constants/Sizes';

export default function HomeScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const unreadNotifications = useUnreadNotifications();

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
      await loadProfile();
      console.log('✅ You are now an admin!');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setUpgrading(false);
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
  const isAdmin = userRole === 'admin';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* HEADER WITH PROFILE BUTTON */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>BondVibe 🎉</Text>
          <Text style={styles.headerSubtitle}>Connect through experiences</Text>
        </View>
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.profileAvatar}>{profile?.avatar || '😊'}</Text>
        </TouchableOpacity>
      </View>

      {/* USER INFO CARD */}
      <View style={styles.userCard}>
        <Text style={styles.avatar}>{profile?.avatar || '😊'}</Text>
        <Text style={styles.name}>{profile?.fullName || 'User'}</Text>
        <Text style={styles.email}>{auth.currentUser?.email}</Text>
        
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
      </View>

      {/* MAIN ACTIONS */}
      <View style={styles.actionsSection}>
        <TouchableOpacity 
          style={styles.primaryButton} 
          onPress={() => navigation.navigate('EventFeed')}
        >
          <Text style={styles.buttonIcon}>🎯</Text>
          <Text style={styles.primaryButtonText}>Explore Events</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.searchButton} 
          onPress={() => navigation.navigate('SearchEvents')}
        >
          <Text style={styles.buttonIcon}>🔍</Text>
          <Text style={styles.searchButtonText}>Search Events</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.myEventsButton} 
          onPress={() => navigation.navigate('MyEvents')}
        >
          <Text style={styles.buttonIcon}>📅</Text>
          <Text style={styles.myEventsButtonText}>My Events</Text>
        </TouchableOpacity>

        <View style={styles.buttonWithBadge}>
          <TouchableOpacity 
            style={styles.notificationsButton} 
            onPress={() => navigation.navigate('Notifications')}
          >
            <Text style={styles.buttonIcon}>🔔</Text>
            <Text style={styles.notificationsButtonText}>Notifications</Text>
          </TouchableOpacity>
          {unreadNotifications > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeNumber}>
                {unreadNotifications > 99 ? '99+' : unreadNotifications}
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity 
          style={styles.createButton} 
          onPress={() => navigation.navigate('CreateEvent')}
        >
          <Text style={styles.buttonIcon}>➕</Text>
          <Text style={styles.createButtonText}>
            {canCreateEvents ? 'Create Event' : 'Become a Host'}
          </Text>
        </TouchableOpacity>

        {isAdmin && (
          <TouchableOpacity 
            style={styles.adminButton} 
            onPress={() => navigation.navigate('AdminDashboard')}
          >
            <Text style={styles.buttonIcon}>🔧</Text>
            <Text style={styles.adminButtonText}>Admin Dashboard</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* SAFETY NOTE */}
      <View style={styles.safetyNote}>
        <Text style={styles.safetyIcon}>🛡️</Text>
        <Text style={styles.safetyText}>
          Always meet in public places and trust your instincts
        </Text>
      </View>

      {/* DEV BUTTON */}
      {userRole === 'user' && (
        <TouchableOpacity 
          style={[styles.devButton, upgrading && styles.buttonDisabled]} 
          onPress={handleMakeAdmin}
          disabled={upgrading}
        >
          <Text style={styles.devButtonText}>
            {upgrading ? 'Upgrading...' : '🔧 Make Me Admin (Dev)'}
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  contentContainer: {
    padding: Sizes.padding * 2,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  headerSubtitle: {
    fontSize: Sizes.fontSize.small,
    color: Colors.textLight,
    marginTop: 4,
  },
  profileButton: {
    backgroundColor: Colors.background,
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileAvatar: {
    fontSize: 28,
  },
  userCard: {
    backgroundColor: Colors.background,
    borderRadius: Sizes.borderRadius,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    fontSize: 60,
    marginBottom: 12,
  },
  name: {
    fontSize: Sizes.fontSize.large,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  email: {
    fontSize: Sizes.fontSize.small,
    color: Colors.textLight,
    marginBottom: 12,
  },
  adminBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },
  hostBadge: {
    backgroundColor: Colors.success,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },
  badgeText: {
    fontSize: Sizes.fontSize.small,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  actionsSection: {
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    padding: 18,
    borderRadius: Sizes.borderRadius,
    alignItems: 'center',
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  searchButton: {
    backgroundColor: '#2196F3',
    padding: 18,
    borderRadius: Sizes.borderRadius,
    alignItems: 'center',
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  myEventsButton: {
    backgroundColor: '#9C27B0',
    padding: 18,
    borderRadius: Sizes.borderRadius,
    alignItems: 'center',
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonWithBadge: {
    position: 'relative',
    marginBottom: 12,
  },
  notificationsButton: {
    backgroundColor: '#FF9800',
    padding: 18,
    borderRadius: Sizes.borderRadius,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  createButton: {
    backgroundColor: Colors.secondary,
    padding: 18,
    borderRadius: Sizes.borderRadius,
    alignItems: 'center',
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  adminButton: {
    backgroundColor: '#FFD700',
    padding: 18,
    borderRadius: Sizes.borderRadius,
    alignItems: 'center',
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: Sizes.fontSize.large,
    fontWeight: '700',
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: Sizes.fontSize.large,
    fontWeight: '700',
  },
  myEventsButtonText: {
    color: '#FFFFFF',
    fontSize: Sizes.fontSize.large,
    fontWeight: '700',
  },
  notificationsButtonText: {
    color: '#FFFFFF',
    fontSize: Sizes.fontSize.large,
    fontWeight: '700',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: Sizes.fontSize.large,
    fontWeight: '700',
  },
  adminButtonText: {
    color: '#000',
    fontSize: Sizes.fontSize.large,
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: Colors.error,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F5F5F5',
    zIndex: 10,
  },
  badgeNumber: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 6,
  },
  safetyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    padding: 16,
    borderRadius: Sizes.borderRadius,
    marginBottom: 16,
  },
  safetyIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  safetyText: {
    flex: 1,
    fontSize: Sizes.fontSize.small,
    color: Colors.text,
    lineHeight: 20,
  },
  devButton: {
    backgroundColor: '#9E9E9E',
    padding: 12,
    borderRadius: Sizes.borderRadius,
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  devButtonText: {
    color: '#FFFFFF',
    fontSize: Sizes.fontSize.small,
    fontWeight: '600',
  },
});
