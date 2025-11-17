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
    } catch (error) {
      console.error('Error loading pending requests:', error);
    }
  };

  const canCreateEvents = userRole === 'admin' || userRole === 'verified_host';
  const isAdmin = userRole === 'admin';

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF3EA5" />
      </View>
    );
  }

  const ActionButton = ({ icon, title, gradient, onPress, badge }) => (
    <TouchableOpacity
      style={styles.actionButton}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.buttonContent, gradient && styles[gradient]]}>
        <Text style={styles.buttonIcon}>{icon}</Text>
        <Text style={styles.buttonTitle}>{title}</Text>
        {badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{profile?.fullName || 'User'}</Text>
        </View>
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.profileEmoji}>{profile?.avatar || '😊'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Admin Badge */}
        {isAdmin && (
          <View style={styles.adminBadge}>
            <Text style={styles.adminBadgeIcon}>👑</Text>
            <Text style={styles.adminBadgeText}>You're an admin</Text>
          </View>
        )}

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🎯</Text>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Events</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>👥</Text>
            <Text style={styles.statValue}>45</Text>
            <Text style={styles.statLabel}>Friends</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>⭐</Text>
            <Text style={styles.statValue}>8.5</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>

        {/* Main Actions */}
        <View style={styles.actionsGrid}>
          <ActionButton
            icon="🎯"
            title="Explore Events"
            gradient="primaryGradient"
            onPress={() => navigation.navigate('EventFeed')}
          />
          
          <ActionButton
            icon="🔍"
            title="Search"
            gradient="cyanGradient"
            onPress={() => navigation.navigate('SearchEvents')}
          />
          
          <ActionButton
            icon="📅"
            title="My Events"
            gradient="purpleGradient"
            onPress={() => navigation.navigate('MyEvents')}
          />
          
          <ActionButton
            icon="🔔"
            title="Notifications"
            gradient="orangeGradient"
            badge={5}
            onPress={() => navigation.navigate('Notifications')}
          />
          
          <ActionButton
            icon={canCreateEvents ? "➕" : "✨"}
            title={canCreateEvents ? "Create Event" : "Become Host"}
            gradient="pinkGradient"
            onPress={() => canCreateEvents ? navigation.navigate('CreateEvent') : navigation.navigate('RequestHost')}
          />
          
          {isAdmin && (
            <ActionButton
              icon="👑"
              title="Admin Panel"
              gradient="goldGradient"
              badge={pendingHostRequests}
              onPress={() => navigation.navigate('AdminDashboard')}
            />
          )}
        </View>

        {/* Safety Card */}
        <View style={styles.safetyCard}>
          <Text style={styles.safetyIcon}>🛡️</Text>
          <View style={styles.safetyContent}>
            <Text style={styles.safetyTitle}>Stay Safe</Text>
            <Text style={styles.safetyText}>
              Always meet in public places and trust your instincts
            </Text>
          </View>
        </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F1F5F9',
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF3EA5',
  },
  profileEmoji: {
    fontSize: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  adminBadgeIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  adminBadgeText: {
    fontSize: 14,
    color: '#FFD700',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1A1F3A',
  },
  statIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF3EA5',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  actionsGrid: {
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1A1F3A',
    position: 'relative',
  },
  primaryGradient: {
    backgroundColor: '#FF3EA5',
    borderColor: '#FF3EA5',
  },
  cyanGradient: {
    backgroundColor: '#00F2FE',
    borderColor: '#00F2FE',
  },
  purpleGradient: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  orangeGradient: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  pinkGradient: {
    backgroundColor: '#EC4899',
    borderColor: '#EC4899',
  },
  goldGradient: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
  },
  buttonIcon: {
    fontSize: 28,
    marginRight: 16,
  },
  buttonTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F1F5F9',
    flex: 1,
  },
  badge: {
    backgroundColor: '#EF4444',
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
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  safetyIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  safetyContent: {
    flex: 1,
  },
  safetyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F59E0B',
    marginBottom: 4,
  },
  safetyText: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
  },
});
