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
import { useTheme } from '../contexts/ThemeContext';

export default function HomeScreen({ navigation }) {
  const { colors, isDark } = useTheme();
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

  const styles = createStyles(colors);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
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
        <Text style={[styles.buttonTitle, { color: colors.text }]}>{title}</Text>
        {badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>Welcome back</Text>
          <Text style={[styles.userName, { color: colors.text }]}>
            {profile?.fullName || 'Usuario 1'}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <View style={[styles.profileGlass, {
            backgroundColor: colors.surfaceGlass,
            borderColor: `${colors.primary}66`
          }]}>
            <Text style={styles.profileEmoji}>{profile?.avatar || '🎸'}</Text>
          </View>
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
            <View style={styles.adminGlass}>
              <Text style={styles.adminIcon}>👑</Text>
              <Text style={styles.adminText}>Admin</Text>
            </View>
          </View>
        )}

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statGlass, {
              backgroundColor: colors.surfaceGlass,
              borderColor: colors.border
            }]}>
              <Text style={[styles.statValue, { color: colors.primary }]}>12</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Events</Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statGlass, {
              backgroundColor: colors.surfaceGlass,
              borderColor: colors.border
            }]}>
              <Text style={[styles.statValue, { color: colors.primary }]}>45</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Friends</Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statGlass, {
              backgroundColor: colors.surfaceGlass,
              borderColor: colors.border
            }]}>
              <Text style={[styles.statValue, { color: colors.primary }]}>8.5</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Rating</Text>
            </View>
          </View>
        </View>

        {/* Main Actions */}
        <View style={styles.actionsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
          
          <TouchableOpacity
            style={styles.primaryAction}
            onPress={() => navigation.navigate('EventFeed')}
            activeOpacity={0.8}
          >
            <View style={[styles.primaryGlass, {
              backgroundColor: `${colors.primary}26`,
              borderColor: `${colors.primary}66`
            }]}>
              <View style={styles.actionLeft}>
                <View style={[styles.iconCircle, {
                  backgroundColor: `${colors.primary}33`
                }]}>
                  <Text style={styles.actionIcon}>🎯</Text>
                </View>
                <Text style={[styles.actionTitle, { color: colors.text }]}>Explore Events</Text>
              </View>
              <Text style={[styles.actionArrow, { color: colors.primary }]}>→</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.secondaryActions}>
            <TouchableOpacity
              style={styles.secondaryAction}
              onPress={() => navigation.navigate('SearchEvents')}
              activeOpacity={0.8}
            >
              <View style={[styles.secondaryGlass, {
                backgroundColor: colors.surfaceGlass,
                borderColor: colors.border
              }]}>
                <Text style={styles.secondaryIcon}>🔍</Text>
                <Text style={[styles.secondaryTitle, { color: colors.text }]}>Search</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryAction}
              onPress={() => navigation.navigate('MyEvents')}
              activeOpacity={0.8}
            >
              <View style={[styles.secondaryGlass, {
                backgroundColor: colors.surfaceGlass,
                borderColor: colors.border
              }]}>
                <Text style={styles.secondaryIcon}>📅</Text>
                <Text style={[styles.secondaryTitle, { color: colors.text }]}>My Events</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.secondaryActions}>
            <TouchableOpacity
              style={styles.secondaryAction}
              onPress={() => navigation.navigate('Notifications')}
              activeOpacity={0.8}
            >
              <View style={[styles.secondaryGlass, {
                backgroundColor: colors.surfaceGlass,
                borderColor: colors.border
              }]}>
                <Text style={styles.secondaryIcon}>🔔</Text>
                <Text style={[styles.secondaryTitle, { color: colors.text }]}>Notifications</Text>
                {5 > 0 && (
                  <View style={[styles.notificationBadge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.badgeText}>5</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryAction}
              onPress={() => canCreateEvents ? navigation.navigate('CreateEvent') : navigation.navigate('RequestHost')}
              activeOpacity={0.8}
            >
              <View style={[styles.secondaryGlass, {
                backgroundColor: colors.surfaceGlass,
                borderColor: colors.border
              }]}>
                <Text style={styles.secondaryIcon}>{canCreateEvents ? '➕' : '✨'}</Text>
                <Text style={[styles.secondaryTitle, { color: colors.text }]}>
                  {canCreateEvents ? 'Create' : 'Host'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {isAdmin && (
            <TouchableOpacity
              style={styles.adminAction}
              onPress={() => navigation.navigate('AdminDashboard')}
              activeOpacity={0.8}
            >
              <View style={styles.adminActionGlass}>
                <View style={styles.actionLeft}>
                  <View style={styles.iconCircleGold}>
                    <Text style={styles.actionIcon}>👑</Text>
                  </View>
                  <Text style={[styles.actionTitle, { color: colors.text }]}>Admin Dashboard</Text>
                </View>
                {pendingHostRequests > 0 && (
                  <View style={styles.adminBadgeCount}>
                    <Text style={styles.badgeText}>{pendingHostRequests}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Safety Notice */}
        <View style={styles.safetyCard}>
          <View style={[styles.safetyGlass, {
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            borderColor: 'rgba(245, 158, 11, 0.2)'
          }]}>
            <Text style={styles.safetyIcon}>🛡️</Text>
            <View style={styles.safetyContent}>
              <Text style={styles.safetyTitle}>Stay Safe</Text>
              <Text style={[styles.safetyText, { color: colors.textSecondary }]}>
                Always meet in public places
              </Text>
            </View>
          </View>
        </View>
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
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingTop: 60,
      paddingBottom: 24,
    },
    greeting: {
      fontSize: 13,
      marginBottom: 4,
      letterSpacing: 0.3,
    },
    userName: {
      fontSize: 26,
      fontWeight: '700',
      letterSpacing: -0.5,
    },
    profileButton: {
      borderRadius: 20,
      overflow: 'hidden',
    },
    profileGlass: {
      width: 56,
      height: 56,
      borderWidth: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    profileEmoji: {
      fontSize: 28,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 24,
      paddingBottom: 40,
    },
    adminBadge: {
      marginBottom: 20,
      borderRadius: 16,
      overflow: 'hidden',
    },
    adminGlass: {
      backgroundColor: 'rgba(255, 215, 0, 0.1)',
      borderWidth: 1,
      borderColor: 'rgba(255, 215, 0, 0.2)',
      paddingVertical: 10,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    adminIcon: {
      fontSize: 16,
      marginRight: 8,
    },
    adminText: {
      fontSize: 13,
      fontWeight: '600',
      color: '#FFD700',
      letterSpacing: 0.5,
    },
    statsContainer: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 28,
    },
    statCard: {
      flex: 1,
      borderRadius: 16,
      overflow: 'hidden',
    },
    statGlass: {
      borderWidth: 1,
      paddingVertical: 14,
      alignItems: 'center',
    },
    statValue: {
      fontSize: 22,
      fontWeight: '700',
      marginBottom: 2,
      letterSpacing: -0.5,
    },
    statLabel: {
      fontSize: 11,
      letterSpacing: 0.3,
    },
    actionsSection: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 16,
      letterSpacing: -0.3,
    },
    primaryAction: {
      marginBottom: 12,
      borderRadius: 20,
      overflow: 'hidden',
    },
    primaryGlass: {
      borderWidth: 1,
      padding: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    actionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 14,
    },
    iconCircleGold: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(255, 215, 0, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 14,
    },
    actionIcon: {
      fontSize: 22,
    },
    actionTitle: {
      fontSize: 17,
      fontWeight: '600',
      letterSpacing: -0.2,
    },
    actionArrow: {
      fontSize: 24,
      fontWeight: '300',
    },
    secondaryActions: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 12,
    },
    secondaryAction: {
      flex: 1,
      borderRadius: 16,
      overflow: 'hidden',
    },
    secondaryGlass: {
      borderWidth: 1,
      padding: 18,
      alignItems: 'center',
      position: 'relative',
    },
    secondaryIcon: {
      fontSize: 28,
      marginBottom: 8,
    },
    secondaryTitle: {
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: -0.1,
    },
    notificationBadge: {
      position: 'absolute',
      top: 12,
      right: 12,
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 6,
    },
    badgeText: {
      fontSize: 11,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    adminAction: {
      marginBottom: 12,
      borderRadius: 20,
      overflow: 'hidden',
    },
    adminActionGlass: {
      backgroundColor: 'rgba(255, 215, 0, 0.12)',
      borderWidth: 1,
      borderColor: 'rgba(255, 215, 0, 0.25)',
      padding: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    adminBadgeCount: {
      backgroundColor: '#EF4444',
      borderRadius: 12,
      minWidth: 24,
      height: 24,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 8,
    },
    safetyCard: {
      borderRadius: 16,
      overflow: 'hidden',
    },
    safetyGlass: {
      borderWidth: 1,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
    },
    safetyIcon: {
      fontSize: 24,
      marginRight: 12,
    },
    safetyContent: {
      flex: 1,
    },
    safetyTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: '#F59E0B',
      marginBottom: 2,
      letterSpacing: -0.1,
    },
    safetyText: {
      fontSize: 12,
      lineHeight: 16,
    },
  });
}
