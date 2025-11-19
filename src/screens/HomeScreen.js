import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { useTheme } from '../contexts/ThemeContext';

export default function HomeScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        setUser(userDoc.data());
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const styles = createStyles(colors);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>
            {getGreeting()}
          </Text>
          <Text style={[styles.name, { color: colors.text }]}>
            {user?.fullName || 'Friend'}
          </Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <View style={[styles.avatar, {
            backgroundColor: `${colors.primary}26`,
            borderColor: `${colors.primary}66`
          }]}>
            <Text style={styles.avatarEmoji}>{user?.avatar || '😊'}</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate('Notifications')}
            >
              <View style={[styles.quickActionGlass, {
                backgroundColor: colors.surfaceGlass,
                borderColor: colors.border
              }]}>
                <Text style={styles.quickActionIcon}>🔔</Text>
                <Text style={[styles.quickActionText, { color: colors.text }]}>Notifications</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate('EventFeed')}
            >
              <View style={[styles.quickActionGlass, {
                backgroundColor: colors.surfaceGlass,
                borderColor: colors.border
              }]}>
                <Text style={styles.quickActionIcon}>🔍</Text>
                <Text style={[styles.quickActionText, { color: colors.text }]}>Explore</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate('MyEvents')}
            >
              <View style={[styles.quickActionGlass, {
                backgroundColor: colors.surfaceGlass,
                borderColor: colors.border
              }]}>
                <Text style={styles.quickActionIcon}>📅</Text>
                <Text style={[styles.quickActionText, { color: colors.text }]}>My Events</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate('SearchEvents')}
            >
              <View style={[styles.quickActionGlass, {
                backgroundColor: colors.surfaceGlass,
                borderColor: colors.border
              }]}>
                <Text style={styles.quickActionIcon}>🔎</Text>
                <Text style={[styles.quickActionText, { color: colors.text }]}>Search</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Create Event Card */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.createEventCard}
            onPress={() => navigation.navigate('CreateEvent')}
            activeOpacity={0.8}
          >
            <View style={[styles.createEventGlass, {
              backgroundColor: `${colors.primary}1A`,
              borderColor: `${colors.primary}33`
            }]}>
              <View style={styles.createEventContent}>
                <Text style={styles.createEventIcon}>✨</Text>
                <View style={styles.createEventText}>
                  <Text style={[styles.createEventTitle, { color: colors.primary }]}>
                    Create an Event
                  </Text>
                  <Text style={[styles.createEventSubtitle, { color: colors.textSecondary }]}>
                    Bring people together
                  </Text>
                </View>
              </View>
              <Text style={[styles.createEventArrow, { color: colors.primary }]}>→</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Discover */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Discover</Text>
            <TouchableOpacity onPress={() => navigation.navigate('SearchEvents')}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}
          >
            {['Social', 'Sports', 'Food', 'Arts', 'Learning', 'Adventure'].map((category) => (
              <TouchableOpacity
                key={category}
                style={styles.categoryCard}
                onPress={() => navigation.navigate('EventFeed')}
              >
                <View style={[styles.categoryGlass, {
                  backgroundColor: colors.surfaceGlass,
                  borderColor: colors.border
                }]}>
                  <Text style={styles.categoryIcon}>
                    {category === 'Social' ? '👥' :
                     category === 'Sports' ? '⚽' :
                     category === 'Food' ? '🍕' :
                     category === 'Arts' ? '🎨' :
                     category === 'Learning' ? '📚' : '🏔️'}
                  </Text>
                  <Text style={[styles.categoryName, { color: colors.text }]}>
                    {category}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Host Card */}
        {user?.role === 'user' && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.hostCard}
              onPress={() => navigation.navigate('RequestHost')}
              activeOpacity={0.8}
            >
              <View style={[styles.hostGlass, {
                backgroundColor: `${colors.secondary}1A`,
                borderColor: `${colors.secondary}33`
              }]}>
                <Text style={styles.hostIcon}>🎪</Text>
                <View style={styles.hostContent}>
                  <Text style={[styles.hostTitle, { color: colors.secondary }]}>
                    Become a Host
                  </Text>
                  <Text style={[styles.hostSubtitle, { color: colors.textSecondary }]}>
                    Create unlimited events and build your community
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Admin Card */}
        {user?.role === 'admin' && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.adminCard}
              onPress={() => navigation.navigate('AdminDashboard')}
              activeOpacity={0.8}
            >
              <View style={[styles.adminGlass, {
                backgroundColor: 'rgba(255, 215, 0, 0.15)',
                borderColor: 'rgba(255, 215, 0, 0.3)'
              }]}>
                <Text style={styles.adminIcon}>👑</Text>
                <View style={styles.adminContent}>
                  <Text style={styles.adminTitle}>Admin Dashboard</Text>
                  <Text style={[styles.adminSubtitle, { color: colors.textSecondary }]}>
                    Manage host requests and events
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20 },
    greeting: { fontSize: 14, marginBottom: 4 },
    name: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
    avatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
    avatarEmoji: { fontSize: 24 },
    scrollView: { flex: 1 },
    scrollContent: { paddingBottom: 40 },
    section: { marginBottom: 28 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 16 },
    sectionTitle: { fontSize: 20, fontWeight: '700', paddingHorizontal: 24, marginBottom: 16, letterSpacing: -0.3 },
    seeAll: { fontSize: 14, fontWeight: '600' },
    quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 24, gap: 12 },
    quickAction: { width: '48%', borderRadius: 16, overflow: 'hidden' },
    quickActionGlass: { borderWidth: 1, paddingVertical: 24, alignItems: 'center' },
    quickActionIcon: { fontSize: 32, marginBottom: 8 },
    quickActionText: { fontSize: 14, fontWeight: '600', letterSpacing: -0.1 },
    createEventCard: { marginHorizontal: 24, borderRadius: 20, overflow: 'hidden' },
    createEventGlass: { borderWidth: 1, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    createEventContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    createEventIcon: { fontSize: 32, marginRight: 16 },
    createEventText: { flex: 1 },
    createEventTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4, letterSpacing: -0.3 },
    createEventSubtitle: { fontSize: 13 },
    createEventArrow: { fontSize: 24, marginLeft: 12 },
    categoriesScroll: { paddingHorizontal: 24, gap: 12 },
    categoryCard: { width: 120, borderRadius: 16, overflow: 'hidden' },
    categoryGlass: { borderWidth: 1, padding: 16, alignItems: 'center' },
    categoryIcon: { fontSize: 36, marginBottom: 10 },
    categoryName: { fontSize: 13, fontWeight: '600', letterSpacing: -0.1 },
    hostCard: { marginHorizontal: 24, borderRadius: 20, overflow: 'hidden' },
    hostGlass: { borderWidth: 1, padding: 20, flexDirection: 'row', alignItems: 'center' },
    hostIcon: { fontSize: 40, marginRight: 16 },
    hostContent: { flex: 1 },
    hostTitle: { fontSize: 18, fontWeight: '700', marginBottom: 6, letterSpacing: -0.3 },
    hostSubtitle: { fontSize: 13, lineHeight: 18 },
    adminCard: { marginHorizontal: 24, borderRadius: 20, overflow: 'hidden' },
    adminGlass: { borderWidth: 1, padding: 20, flexDirection: 'row', alignItems: 'center' },
    adminIcon: { fontSize: 40, marginRight: 16 },
    adminContent: { flex: 1 },
    adminTitle: { fontSize: 18, fontWeight: '700', marginBottom: 6, color: '#FFD700', letterSpacing: -0.3 },
    adminSubtitle: { fontSize: 13, lineHeight: 18 },
  });
}
