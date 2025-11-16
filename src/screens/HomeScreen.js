import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { auth, db } from '../services/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import Colors from '../constants/Colors';
import Sizes from '../constants/Sizes';

export default function HomeScreen({ navigation }) {
  const [userRole, setUserRole] = useState('user');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingHostRequests, setPendingHostRequests] = useState(0);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setProfile(data);
        setUserRole(data.role || 'user');
        
        // If admin, load pending requests count
        if (data.role === 'admin') {
          await loadPendingRequests();
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingRequests = async () => {
    try {
      const hostRequestsQuery = query(
        collection(db, 'hostRequests'),
        where('status', '==', 'pending')
      );
      const snapshot = await getDocs(hostRequestsQuery);
      setPendingHostRequests(snapshot.size);
      console.log(`📊 Found ${snapshot.size} pending host requests`);
    } catch (error) {
      console.error('Error loading pending requests:', error);
    }
  };

  const canCreateEvents = userRole === 'admin' || userRole === 'verified_host';
  const isAdmin = userRole === 'admin';

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
        <View>
          <Text style={styles.logo}>BondVibe 🎉</Text>
          <Text style={styles.tagline}>Connect through experiences</Text>
        </View>
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.profileEmoji}>{profile?.avatar || '🎸'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeEmoji}>{profile?.avatar || '🎸'}</Text>
          <Text style={styles.welcomeTitle}>{profile?.fullName || 'Usuario 1'}</Text>
          <Text style={styles.welcomeEmail}>{auth.currentUser?.email}</Text>
        </View>

        {/* Yellow Admin Badge */}
        {isAdmin && (
          <View style={styles.adminBadge}>
            <Text style={styles.adminBadgeIcon}>👑</Text>
            <Text style={styles.adminBadgeText}>You're an admin</Text>
          </View>
        )}

        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.navigate('EventFeed')}
        >
          <Text style={styles.buttonIcon}>🎯</Text>
          <Text style={styles.buttonText}>Explore Events</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.searchButton]}
          onPress={() => navigation.navigate('SearchEvents')}
        >
          <Text style={styles.buttonIcon}>🔍</Text>
          <Text style={styles.buttonText}>Search Events</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.myEventsButton]}
          onPress={() => navigation.navigate('MyEvents')}
        >
          <Text style={styles.buttonIcon}>📅</Text>
          <Text style={styles.buttonText}>My Events</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.notificationsButton]}
          onPress={() => navigation.navigate('Notifications')}
        >
          <Text style={styles.buttonIcon}>��</Text>
          <Text style={styles.buttonText}>Notifications</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.createEventButton]}
          onPress={() => canCreateEvents ? navigation.navigate('CreateEvent') : navigation.navigate('RequestHost')}
        >
          <Text style={styles.buttonIcon}>{canCreateEvents ? '➕' : '✨'}</Text>
          <Text style={styles.buttonText}>
            {canCreateEvents ? 'Create Event' : 'Become a Host'}
          </Text>
        </TouchableOpacity>

        {isAdmin && (
          <TouchableOpacity 
            style={styles.adminButton} 
            onPress={() => navigation.navigate('AdminDashboard')}
          >
            <View style={styles.adminButtonContent}>
              <Text style={styles.buttonIcon}>🔧</Text>
              <Text style={styles.adminButtonText}>Admin Dashboard</Text>
              {pendingHostRequests > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{pendingHostRequests}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}

        <View style={styles.safetyCard}>
          <Text style={styles.safetyIcon}>🛡️</Text>
          <Text style={styles.safetyText}>Always meet in public places and trust your instincts</Text>
        </View>
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
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  tagline: {
    fontSize: Sizes.fontSize.small,
    color: Colors.textLight,
    marginTop: 4,
  },
  profileButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileEmoji: {
    fontSize: 28,
  },
  content: {
    padding: Sizes.padding * 2,
  },
  welcomeCard: {
    backgroundColor: Colors.background,
    padding: 24,
    borderRadius: Sizes.borderRadius,
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeEmoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  welcomeTitle: {
    fontSize: Sizes.fontSize.xlarge,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  welcomeEmail: {
    fontSize: Sizes.fontSize.small,
    color: Colors.textLight,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    padding: 12,
    borderRadius: Sizes.borderRadius,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
  },
  adminBadgeIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  adminBadgeText: {
    fontSize: Sizes.fontSize.medium,
    color: Colors.text,
    fontWeight: '600',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    padding: Sizes.padding * 2,
    borderRadius: Sizes.borderRadius,
    marginBottom: 16,
  },
  buttonIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  buttonText: {
    fontSize: Sizes.fontSize.large,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  searchButton: {
    backgroundColor: '#00BCD4',
  },
  myEventsButton: {
    backgroundColor: '#9C27B0',
  },
  notificationsButton: {
    backgroundColor: '#FF9800',
  },
  createEventButton: {
    backgroundColor: '#FF5252',
  },
  adminButton: {
    backgroundColor: '#FFD700',
    padding: Sizes.padding * 2,
    borderRadius: Sizes.borderRadius,
    marginBottom: 16,
  },
  adminButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  adminButtonText: {
    fontSize: Sizes.fontSize.large,
    color: Colors.text,
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    right: 0,
    backgroundColor: Colors.error,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  safetyCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderRadius: Sizes.borderRadius,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
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
});
