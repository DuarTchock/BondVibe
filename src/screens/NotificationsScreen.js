import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useTheme } from "../contexts/ThemeContext";
import { auth, db } from "../services/firebase";
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
} from "../utils/notificationService";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";

export default function NotificationsScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ============================================
  // VERSIÓN CON HISTORIAL (Real-time)
  // ✅ Muestra TODAS las notificaciones de mensajes (leídas y no leídas)
  // ============================================
  useEffect(() => {
    if (!auth.currentUser) return;

    console.log(
      "🔔 Setting up real-time notifications listener in NotificationsScreen"
    );

    // Query para TODAS las notificaciones agrupadas de mensajes (leídas y no leídas)
    const groupedNotificationsQuery = query(
      collection(db, "notifications"),
      where("userId", "==", auth.currentUser.uid),
      where("type", "==", "event_messages")
    );

    const unsubscribe = onSnapshot(
      groupedNotificationsQuery,
      async (snapshot) => {
        try {
          // Cargar notificaciones regulares (otras notificaciones)
          const userNotifications = await getUserNotifications(
            auth.currentUser.uid
          );

          // Procesar notificaciones agrupadas de mensajes
          const messageNotifications = [];

          for (const notifDoc of snapshot.docs) {
            const data = notifDoc.data();

            // ✅ CAMBIO: Mostrar TODAS las notificaciones de mensajes, no solo las no leídas
            // Crear notificación incluso si está leída (para historial)
            messageNotifications.push({
              id: notifDoc.id,
              type: "event_messages",
              title:
                data.unreadCount > 0
                  ? `${data.unreadCount} new message${
                      data.unreadCount > 1 ? "s" : ""
                    }`
                  : "Messages", // Si está leída, solo dice "Messages"
              message: `${data.lastSender}: ${data.lastMessage}`,
              time: getTimeAgo(data.updatedAt),
              read: data.read || false,
              icon: "💬",
              createdAt: data.updatedAt,
              unreadCount: data.unreadCount,
              metadata: {
                eventId: data.eventId.replace("event_", ""),
                eventTitle: data.eventTitle,
                conversationId: data.eventId,
              },
            });
          }

          // Combinar y DEDUPLICAR por ID antes de ordenar
          const allNotifications = [
            ...userNotifications,
            ...messageNotifications,
          ];

          // Deduplicar: Mantener solo la primera ocurrencia de cada ID
          const uniqueNotifications = Array.from(
            new Map(allNotifications.map((notif) => [notif.id, notif])).values()
          ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

          console.log(
            `📬 Loaded ${
              uniqueNotifications.length
            } unique notifications (removed ${
              allNotifications.length - uniqueNotifications.length
            } duplicates)`
          );

          if (uniqueNotifications.length === 0) {
            const demoNotifications = [
              {
                id: "demo1",
                type: "welcome",
                title: "Welcome to BondVibe! 👋",
                message: "Start exploring events and connect with people",
                time: "Just now",
                read: false,
                icon: "🎉",
                action: () => navigation.navigate("SearchEvents"),
                isDemo: true,
              },
            ];
            setNotifications(demoNotifications);
          } else {
            const mappedNotifications = uniqueNotifications.map((notif) => ({
              ...notif,
              time: notif.time || getTimeAgo(notif.createdAt),
              action: () => handleNotificationAction(notif),
            }));
            setNotifications(mappedNotifications);
          }

          setLoading(false);
        } catch (error) {
          console.error("Error loading notifications:", error);
          setLoading(false);
        }
      },
      (error) => {
        console.error("❌ Error in notifications listener:", error);
        setLoading(false);
      }
    );

    return () => {
      console.log("🔕 Cleaning up notifications listener");
      unsubscribe();
    };
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  const getTimeAgo = (isoDate) => {
    if (!isoDate) return "";
    const date = new Date(isoDate);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  const handleNotificationAction = async (notification) => {
    // ✅ IMPORTANTE: NO marcar como leída aquí
    // Solo navegamos al chat, y el chat se encarga de marcar como leída cuando el usuario scrollea

    switch (notification.type) {
      case "event_joined":
        if (notification.metadata?.eventId) {
          navigation.navigate("EventDetail", {
            eventId: notification.metadata.eventId,
          });
        }
        break;
      case "event_messages":
        // Navegar al chat del evento
        if (
          notification.metadata?.eventId &&
          notification.metadata?.eventTitle
        ) {
          navigation.navigate("EventChat", {
            eventId: notification.metadata.eventId,
            eventTitle: notification.metadata.eventTitle,
          });
        }
        break;
      case "host_request":
        navigation.navigate("AdminDashboard");
        break;
      default:
        // Para otras notificaciones, marcar como leída al hacer clic
        if (!notification.isDemo && !notification.read && notification.id) {
          await markAsRead(notification.id);
        }
        if (notification.action) {
          notification.action();
        }
    }
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead(auth.currentUser.uid);
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const styles = createStyles(colors);

  const NotificationCard = ({ notification }) => (
    <TouchableOpacity
      style={styles.notificationCard}
      onPress={() => handleNotificationAction(notification)}
      activeOpacity={0.8}
    >
      <View
        style={[
          styles.notificationGlass,
          {
            backgroundColor: notification.read
              ? colors.surfaceGlass
              : `${colors.primary}0D`,
            borderColor: notification.read
              ? colors.border
              : `${colors.primary}4D`,
          },
        ]}
      >
        <View
          style={[
            styles.notificationIcon,
            {
              backgroundColor: `${colors.primary}26`,
            },
          ]}
        >
          <Text style={styles.iconEmoji}>{notification.icon}</Text>
          {/* Badge para contador de mensajes NO LEÍDOS */}
          {notification.unreadCount && notification.unreadCount > 0 && (
            <View
              style={[styles.unreadBadge, { backgroundColor: colors.accent }]}
            >
              <Text style={styles.unreadBadgeText}>
                {notification.unreadCount}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text style={[styles.notificationTitle, { color: colors.text }]}>
              {notification.title}
            </Text>
            {!notification.read && (
              <View
                style={[styles.unreadDot, { backgroundColor: colors.primary }]}
              />
            )}
          </View>

          {/* Título del evento si es notificación de mensajes */}
          {notification.type === "event_messages" &&
            notification.metadata?.eventTitle && (
              <Text
                style={[styles.eventTitle, { color: colors.primary }]}
                numberOfLines={1}
              >
                {notification.metadata.eventTitle}
              </Text>
            )}

          <Text
            style={[
              styles.notificationMessage,
              { color: colors.textSecondary },
            ]}
            numberOfLines={2}
          >
            {notification.message}
          </Text>
          <Text
            style={[styles.notificationTime, { color: colors.textTertiary }]}
          >
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Notifications
        </Text>
        <TouchableOpacity onPress={handleMarkAllRead}>
          <Text style={[styles.markAllRead, { color: colors.primary }]}>
            Mark all read
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🔔</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No notifications
          </Text>
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
            <NotificationCard
              key={notification.id}
              notification={notification}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 24,
      paddingTop: 60,
      paddingBottom: 20,
    },
    backButton: { fontSize: 28 },
    headerTitle: { fontSize: 20, fontWeight: "700", letterSpacing: -0.3 },
    markAllRead: { fontSize: 13, fontWeight: "600" },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    scrollView: { flex: 1 },
    scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
    notificationCard: {
      marginBottom: 12,
      borderRadius: 16,
      overflow: "hidden",
    },
    notificationGlass: { borderWidth: 1, padding: 16, flexDirection: "row" },
    notificationIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 14,
      position: "relative",
    },
    iconEmoji: { fontSize: 22 },
    unreadBadge: {
      position: "absolute",
      top: -4,
      right: -4,
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 6,
    },
    unreadBadgeText: {
      color: "#FFFFFF",
      fontSize: 11,
      fontWeight: "700",
    },
    notificationContent: { flex: 1 },
    notificationHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 6,
    },
    notificationTitle: {
      fontSize: 15,
      fontWeight: "700",
      flex: 1,
      letterSpacing: -0.2,
    },
    eventTitle: {
      fontSize: 13,
      fontWeight: "600",
      marginBottom: 4,
      letterSpacing: -0.1,
    },
    unreadDot: { width: 8, height: 8, borderRadius: 4, marginLeft: 8 },
    notificationMessage: { fontSize: 14, lineHeight: 20, marginBottom: 6 },
    notificationTime: { fontSize: 12 },
    emptyState: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 40,
    },
    emptyEmoji: { fontSize: 64, marginBottom: 20 },
    emptyTitle: {
      fontSize: 20,
      fontWeight: "700",
      marginBottom: 10,
      letterSpacing: -0.3,
    },
    emptyText: { fontSize: 14, textAlign: "center" },
  });
}
