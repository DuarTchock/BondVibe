import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../contexts/ThemeContext';
import { auth, db } from '../services/firebase';
import { getUserNotifications, markAsRead, markAllAsRead } from '../utils/notificationService';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function NotificationsScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      // Cargar notificaciones regulares
      const userNotifications = await getUserNotifications(auth.currentUser.uid);
      
      // Cargar mensajes de eventos (solo no leídos)
      const messageNotifications = [];
      
      // Obtener eventos donde el usuario participa
      const eventsSnapshot = await getDocs(collection(db, 'events'));
      const userEvents = eventsSnapshot.docs.filter(doc => {
        const data = doc.data();
        return data.attendees?.includes(auth.currentUser.uid) || data.creatorId === auth.currentUser.uid;
      });

      // Para cada evento, verificar mensajes no leídos
      for (const eventDoc of userEvents) {
        const conversationId = `event_${eventDoc.id}`;
        
        try {
          const messagesSnapshot = await getDocs(
            collection(db, 'conversations', conversationId, 'messages')
          );
          
          // Filtrar solo mensajes NO LEÍDOS que no son del usuario
          const unreadMessages = messagesSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(msg => msg.senderId !== auth.currentUser.uid && msg.read === false);
          
          if (unreadMessages.length > 0) {
            const lastMessage = unreadMessages[unreadMessages.length - 1];
            
            // Obtener info del remitente
            const senderDoc = await getDocs(query(collection(db, 'users'), where('__name__', '==', lastMessage.senderId)));
            const senderName = senderDoc.docs[0]?.data()?.fullName || 'Someone';
            
            messageNotifications.push({
              id: `msg_${conversationId}`,
              type: 'event_message',
              title: `${senderName} sent a message`,
              message: `New message in "${eventDoc.data().title}"`,
              time: getTimeAgo(lastMessage.createdAt),
              read: false,
              icon: '💬',
              createdAt: lastMessage.createdAt,
              metadata: { eventId: eventDoc.id, eventTitle: eventDoc.data().title, conversationId }
            });
          }
        } catch (err) {
          console.log('Conversation not found for event:', eventDoc.id);
        }
      }
      
      // Combinar y ordenar
      const allNotifications = [...userNotifications, ...messageNotifications]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      if (allNotifications.length === 0) {
        const demoNotifications = [
          {
            id: 'demo1',
            type: 'welcome',
            title: 'Welcome to BondVibe! 👋',
            message: 'Start exploring events and connect with people',
            time: 'Just now',
            read: false,
            icon: '🎉',
            action: () => navigation.navigate('SearchEvents'),
            isDemo: true,
          },
        ];
        setNotifications(demoNotifications);
      } else {
        const mappedNotifications = allNotifications.map(notif => ({
          ...notif,
          time: notif.time || getTimeAgo(notif.createdAt),
          action: () => handleNotificationAction(notif),
        }));
        setNotifications(mappedNotifications);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const getTimeAgo = (isoDate) => {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  const handleNotificationAction = (notification) => {
    if (!notification.isDemo && !notification.read && notification.id && !notification.id.startsWith('msg_')) {
      markAsRead(notification.id);
    }

    switch (notification.type) {
      case 'event_joined':
        if (notification.metadata?.eventId) {
          navigation.navigate('EventDetail', { eventId: notification.metadata.eventId });
        }
        break;
      case 'event_message':
        if (notification.metadata?.conversationId && notification.metadata?.eventId) {
          navigation.navigate('EventChat', { 
            eventId: notification.metadata.eventId,
            eventTitle: notification.metadata.eventTitle 
          });
        }
        break;
      case 'host_request':
        navigation.navigate('AdminDashboard');
        break;
      default:
        if (notification.action) {
          notification.action();
        }
    }

    setTimeout(() => loadNotifications(), 500);
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead(auth.currentUser.uid);
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const styles = createStyles(colors);

  const NotificationCard = ({ notification }) => (
    <TouchableOpacity
      style={styles.notificationCard}
      onPress={() => handleNotificationAction(notification)}
      activeOpacity={0.8}
    >
      <View style={[
        styles.notificationGlass,
        {
          backgroundColor: notification.read 
            ? colors.surfaceGlass 
            : `${colors.primary}0D`,
          borderColor: notification.read 
            ? colors.border 
            : `${colors.primary}4D`
        }
      ]}>
        <View style={[styles.notificationIcon, {
          backgroundColor: `${colors.primary}26`
        }]}>
          <Text style={styles.iconEmoji}>{notification.icon}</Text>
        </View>
        
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text style={[styles.notificationTitle, { color: colors.text }]}>
              {notification.title}
            </Text>
            {!notification.read && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
          </View>
          <Text style={[styles.notificationMessage, { color: colors.textSecondary }]} numberOfLines={2}>
            {notification.message}
          </Text>
          <Text style={[styles.notificationTime, { color: colors.textTertiary }]}>
            {notification.time}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backButton, { color: colors.text }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Notifications</Text>
        <TouchableOpacity onPress={handleMarkAllRead}>
          <Text style={[styles.markAllRead, { color: colors.primary }]}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>��</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No notifications</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            You're all caught up!
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        >
          {notifications.map((notification) => (
            <NotificationCard key={notification.id} notification={notification} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20 },
    backButton: { fontSize: 28 },
    headerTitle: { fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
    markAllRead: { fontSize: 13, fontWeight: '600' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollView: { flex: 1 },
    scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
    notificationCard: { marginBottom: 12, borderRadius: 16, overflow: 'hidden' },
    notificationGlass: { borderWidth: 1, padding: 16, flexDirection: 'row' },
    notificationIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    iconEmoji: { fontSize: 22 },
    notificationContent: { flex: 1 },
    notificationHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    notificationTitle: { fontSize: 15, fontWeight: '700', flex: 1, letterSpacing: -0.2 },
    unreadDot: { width: 8, height: 8, borderRadius: 4, marginLeft: 8 },
    notificationMessage: { fontSize: 14, lineHeight: 20, marginBottom: 6 },
    notificationTime: { fontSize: 12 },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
    emptyEmoji: { fontSize: 64, marginBottom: 20 },
    emptyTitle: { fontSize: 20, fontWeight: '700', marginBottom: 10, letterSpacing: -0.3 },
    emptyText: { fontSize: 14, textAlign: 'center' },
  });
}
