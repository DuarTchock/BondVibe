import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { useTheme } from '../contexts/ThemeContext';

export default function HomeScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const [user, setUser] = useState(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [pendingHostRequests, setPendingHostRequests] = useState(0);

  useEffect(() => {
    loadUser();
    loadUnreadNotifications();
  }, []);

  const loadUser = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUser(userData);
        
        if (userData.role === 'admin') {
          loadPendingHostRequests();
        }
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const loadPendingHostRequests = async () => {
    try {
      const requestsQuery = query(
        collection(db, 'hostRequests'),
        where('status', '==', 'pending')
      );
      const snapshot = await getDocs(requestsQuery);
      const count = snapshot.size;
      console.log('👑 Pending host requests:', count);
      setPendingHostRequests(count);
    } catch (error) {
      console.error('Error loading host requests:', error);
    }
  };

  const loadUnreadNotifications = async () => {
    try {
      // Contar notificaciones no leídas
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', auth.currentUser.uid),
        where('read', '==', false)
      );
      const notificationsSnapshot = await getDocs(notificationsQuery);
      let count = notificationsSnapshot.size;

      // Contar TODOS los mensajes no leídos (no solo conversaciones)
      const conversationsQuery = query(
        collection(db, 'conversations'),
        where('type', '==', 'event')
      );
      const conversationsSnapshot = await getDocs(conversationsQuery);
      
      for (const convDoc of conversationsSnapshot.docs) {
        const conversationId = convDoc.id;
        const eventId = convDoc.data().eventId;
        
        const eventQuery = query(
          collection(db, 'events'),
          where('__name__', '==', eventId.replace('event_', ''))
        );
        const eventSnapshot = await getDocs(eventQuery);
        
        if (eventSnapshot.empty) continue;
        
        const eventData = eventSnapshot.docs[0].data();
        const isParticipant = eventData.attendees?.includes(auth.currentUser.uid) || 
                             eventData.creatorId === auth.currentUser.uid;
        
        if (!isParticipant) continue;
        
        // Contar CADA mensaje no leído (no solo si hay alguno)
        const messagesQuery = query(
          collection(db, 'conversations', conversationId, 'messages'),
          where('senderId', '!=', auth.currentUser.uid),
          where('read', '==', false)
        );
        const messagesSnapshot = await getDocs(messagesQuery);
        
        // Sumar el número de mensajes no leídos
        count += messagesSnapshot.size;
      }

      console.log('🔔 Total unread notifications:', count);
      setUnreadNotifications(count);
    } catch (error) {
      console.error('Error loading unread notifications:', error);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const canCreateEvents = user?.role === 'admin' || user?.role === 'host';

  const styles = createStyles(colors);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      
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
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => {
                loadUnreadNotifications();
                navigation.navigate('Notifications');
              }}
            >
              <View style={[styles.quickActionGlass, {
                backgroundColor: colors.surfaceGlass,
                borderColor: colors.border
              }]}>
                <View style={styles.quickActionIconContainer}>
                  <Text style={styles.quickActionIcon}>🔔</Text>
                  {unreadNotifications > 0 && (
                    <View style={[styles.badge, { backgroundColor: colors.accent }]}>
                      <Text style={styles.badgeText}>{unreadNotifications}</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.quickActionText, { color: colors.text }]}>Notifications</Text>
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

            {/* Create o Request Host según permisos */}
            {canCreateEvents ? (
              <TouchableOpacity
                style={styles.quickAction}
                onPress={() => navigation.navigate('CreateEvent')}
              >
                <View style={[styles.quickActionGlass, {
                  backgroundColor: colors.surfaceGlass,
                  borderColor: colors.border
                }]}>
                  <Text style={styles.quickActionIcon}>✨</Text>
                  <Text style={[styles.quickActionText, { color: colors.text }]}>Create</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.quickAction}
                onPress={() => navigation.navigate('RequestHost')}
              >
                <View style={[styles.quickActionGlass, {
                  backgroundColor: colors.surfaceGlass,
                  borderColor: colors.border
                }]}>
                  <Text style={styles.quickActionIcon}>🎪</Text>
                  <Text style={[styles.quickActionText, { color: colors.text }]}>Be a Host</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Create Event Card - Solo para admin/host */}
        {canCreateEvents && (
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
        )}

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
                onPress={() => navigation.navigate('SearchEvents')}
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

        {/* Admin Card */}
        {user?.role === 'admin' && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.adminCard}
              onPress={() => {
                loadPendingHostRequests();
                navigation.navigate('AdminDashboard');
              }}
              activeOpacity={0.8}
            >
              <View style={[styles.adminGlass, {
                backgroundColor: 'rgba(255, 215, 0, 0.15)',
                borderColor: 'rgba(255, 215, 0, 0.3)'
              }]}>
                <View style={styles.adminIconContainer}>
                  <Text style={styles.adminIcon}>👑</Text>
                  {pendingHostRequests > 0 && (
                    <View style={[styles.adminBadge, { backgroundColor: colors.accent }]}>
                      <Text style={styles.badgeText}>{pendingHostRequests}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.adminContent}>
                  <Text style={styles.adminTitle}>Admin Dashboard</Text>
                  <Text style={[styles.adminSubtitle, { color: colors.textSecondary }]}>
                    {pendingHostRequests > 0 
                      ? `${pendingHostRequests} pending request${pendingHostRequests > 1 ? 's' : ''}`
                      : 'Manage host requests and events'
                    }
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
    quickActionIconContainer: { position: 'relative' },
    quickActionIcon: { fontSize: 32, marginBottom: 8 },
    badge: { position: 'absolute', top: -4, right: -8, minWidth: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
    badgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
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
    adminCard: { marginHorizontal: 24, borderRadius: 20, overflow: 'hidden' },
    adminGlass: { borderWidth: 1, padding: 20, flexDirection: 'row', alignItems: 'center' },
    adminIconContainer: { position: 'relative', marginRight: 16 },
    adminIcon: { fontSize: 40 },
    adminBadge: { position: 'absolute', top: -4, right: -4, minWidth: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
    adminContent: { flex: 1 },
    adminTitle: { fontSize: 18, fontWeight: '700', marginBottom: 6, color: '#FFD700', letterSpacing: -0.3 },
    adminSubtitle: { fontSize: 13, lineHeight: 18 },
  });
}
