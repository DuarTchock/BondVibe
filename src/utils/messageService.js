import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  doc,
  setDoc,
  getDoc,
  getDocs,
  where,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../services/firebase";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

// ============================================
// FUNCIONES DE CONVERSACIÓN
// ============================================

/**
 * Asegurar que existe una conversación para un evento
 */
export const ensureEventConversation = async (conversationId) => {
  try {
    const conversationRef = doc(db, "conversations", conversationId);
    const conversationDoc = await getDoc(conversationRef);

    if (!conversationDoc.exists()) {
      await setDoc(conversationRef, {
        type: "event",
        eventId: conversationId,
        createdAt: new Date().toISOString(),
        lastMessageAt: new Date().toISOString(),
      });
      console.log("✅ Conversation created:", conversationId);
    }
  } catch (error) {
    console.error("❌ Error ensuring conversation:", error);
    throw error;
  }
};

// ============================================
// ENVÍO DE MENSAJES
// ============================================

/**
 * Enviar mensaje de texto
 * ✅ Push notifications are now handled by Cloud Function
 */
export const sendMessage = async (conversationId, senderId, text) => {
  try {
    const messagesRef = collection(
      db,
      "conversations",
      conversationId,
      "messages"
    );

    const messageData = {
      senderId,
      text,
      type: "text",
      createdAt: new Date().toISOString(),
      delivered: false,
      read: false,
    };

    const docRef = await addDoc(messagesRef, messageData);

    // Actualizar lastMessageAt en la conversación
    const conversationRef = doc(db, "conversations", conversationId);
    await updateDoc(conversationRef, {
      lastMessageAt: new Date().toISOString(),
      lastMessage: text,
      lastSenderId: senderId,
    });

    console.log("✅ Message sent:", docRef.id);

    // ✅ Push notifications are now triggered automatically by Cloud Function
    // when the message is created in Firestore

    return docRef.id;
  } catch (error) {
    console.error("❌ Error sending message:", error);
    throw error;
  }
};

/**
 * Enviar mensaje de ubicación
 * ✅ Push notifications are now handled by Cloud Function
 */
export const sendLocationMessage = async (
  conversationId,
  senderId,
  latitude,
  longitude,
  address = null
) => {
  try {
    const messagesRef = collection(
      db,
      "conversations",
      conversationId,
      "messages"
    );

    const messageData = {
      senderId,
      type: "location",
      location: {
        latitude,
        longitude,
        address: address || `${latitude}, ${longitude}`,
      },
      createdAt: new Date().toISOString(),
      delivered: false,
      read: false,
    };

    const docRef = await addDoc(messagesRef, messageData);

    // Actualizar lastMessageAt
    const conversationRef = doc(db, "conversations", conversationId);
    await updateDoc(conversationRef, {
      lastMessageAt: new Date().toISOString(),
      lastMessage: "📍 Location",
      lastSenderId: senderId,
    });

    console.log("✅ Location message sent:", docRef.id);

    // ✅ Push notifications are now triggered automatically by Cloud Function

    return docRef.id;
  } catch (error) {
    console.error("❌ Error sending location:", error);
    throw error;
  }
};

// ============================================
// SUSCRIPCIONES REAL-TIME
// ============================================

/**
 * Suscribirse a mensajes de una conversación (real-time)
 */
export const subscribeToMessages = (conversationId, callback) => {
  const messagesRef = collection(
    db,
    "conversations",
    conversationId,
    "messages"
  );
  const q = query(messagesRef, orderBy("createdAt", "asc"));

  const unsubscribe = onSnapshot(
    q,
    { includeMetadataChanges: true },
    (snapshot) => {
      const messages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(messages);
    },
    (error) => {
      console.error("❌ Error in messages subscription:", error);
    }
  );

  return unsubscribe;
};

/**
 * Suscribirse a indicadores de "escribiendo" (real-time)
 */
export const subscribeToTypingStatus = (conversationId, callback) => {
  const typingRef = doc(
    db,
    "conversations",
    conversationId,
    "metadata",
    "typing"
  );

  const unsubscribe = onSnapshot(
    typingRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const typingData = snapshot.data();
        const now = Date.now();

        const activeTypers = Object.entries(typingData)
          .filter(([userId, timestamp]) => {
            if (!timestamp) return false;
            const timeSince = now - timestamp;
            return timeSince < 10000;
          })
          .map(([userId]) => userId);

        callback(activeTypers);
      } else {
        callback([]);
      }
    },
    (error) => {
      console.error("❌ Error in typing subscription:", error);
    }
  );

  return unsubscribe;
};

// ============================================
// INDICADORES DE ESTADO
// ============================================

/**
 * Establecer estado de "escribiendo"
 */
export const setTypingStatus = async (conversationId, userId, isTyping) => {
  try {
    const typingRef = doc(
      db,
      "conversations",
      conversationId,
      "metadata",
      "typing"
    );

    await setDoc(
      typingRef,
      { [userId]: isTyping ? Date.now() : null },
      { merge: true }
    );
  } catch (error) {
    console.error("❌ Error setting typing status:", error);
  }
};

/**
 * Marcar mensajes como entregados
 */
export const markMessagesAsDelivered = async (
  conversationId,
  currentUserId
) => {
  try {
    const messagesRef = collection(
      db,
      "conversations",
      conversationId,
      "messages"
    );

    const q = query(
      messagesRef,
      where("senderId", "!=", currentUserId),
      where("delivered", "==", false)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return;
    }

    const batch = writeBatch(db);

    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { delivered: true });
    });

    await batch.commit();
    console.log(`✅ Marked ${snapshot.size} messages as delivered`);
  } catch (error) {
    console.error("❌ Error marking as delivered:", error);
  }
};

/**
 * Marcar mensajes como leídos
 */
export const markMessagesAsRead = async (conversationId, currentUserId) => {
  try {
    const messagesRef = collection(
      db,
      "conversations",
      conversationId,
      "messages"
    );

    const q = query(
      messagesRef,
      where("senderId", "!=", currentUserId),
      where("read", "==", false)
    );

    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const batch = writeBatch(db);

      snapshot.docs.forEach((doc) => {
        batch.update(doc.ref, {
          read: true,
          delivered: true,
        });
      });

      await batch.commit();
      console.log(`✅ Marked ${snapshot.size} messages as read`);
    }

    // Limpiar notificaciones
    await clearEventMessageNotifications(conversationId, currentUserId);
  } catch (error) {
    console.error("❌ Error marking as read:", error);
  }
};

// ============================================
// NOTIFICACIONES IN-APP
// ============================================

/**
 * Limpiar notificaciones de mensajes de un evento cuando se leen
 */
export const clearEventMessageNotifications = async (
  conversationId,
  userId
) => {
  try {
    const cleanEventId = conversationId.replace("event_", "");
    const notificationId = `event_msg_${cleanEventId}_${userId}`;
    const notificationRef = doc(db, "notifications", notificationId);
    const notifDoc = await getDoc(notificationRef);

    if (notifDoc.exists()) {
      await updateDoc(notificationRef, {
        read: true,
        unreadCount: 0,
      });
      console.log("✅ Cleared event message notifications");
    }
  } catch (error) {
    console.error("❌ Error clearing notifications:", error);
  }
};

// ============================================
// PUSH TOKEN REGISTRATION
// ============================================

/**
 * Registrar token de push del dispositivo
 */
export const registerPushToken = async (userId) => {
  try {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("⚠️ Push notification permission not granted");
      return null;
    }

    // Get the project ID from app.json
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;

    if (!projectId) {
      console.error("❌ EAS Project ID not found in app.json");
      return null;
    }

    // Get the Expo push token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: projectId,
    });

    const token = tokenData.data;
    console.log("🔔 Expo Push Token:", token);

    // Guardar token en el documento del usuario
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      pushToken: token,
      pushTokenUpdatedAt: new Date().toISOString(),
    });

    console.log("✅ Push token registered for user:", userId);
    return token;
  } catch (error) {
    console.error("❌ Error registering push token:", error);
    return null;
  }
};

// ============================================
// CONTADORES PARA BADGES
// ============================================

/**
 * Obtener contador de mensajes no leídos para un usuario
 */
export const getUnreadMessagesCount = async (userId) => {
  try {
    let totalUnread = 0;

    const eventsSnapshot = await getDocs(collection(db, "events"));

    for (const eventDoc of eventsSnapshot.docs) {
      const eventData = eventDoc.data();

      let isParticipant = eventData.creatorId === userId;

      if (!isParticipant && Array.isArray(eventData.attendees)) {
        isParticipant = eventData.attendees.some((attendee) => {
          if (
            typeof attendee === "object" &&
            attendee !== null &&
            attendee.userId
          ) {
            return attendee.userId === userId;
          }
          if (typeof attendee === "string") {
            return attendee === userId;
          }
          return false;
        });
      }

      if (!isParticipant) continue;

      const conversationId = `event_${eventDoc.id}`;

      try {
        const messagesRef = collection(
          db,
          "conversations",
          conversationId,
          "messages"
        );
        const unreadQuery = query(
          messagesRef,
          where("senderId", "!=", userId),
          where("read", "==", false)
        );

        const unreadSnapshot = await getDocs(unreadQuery);
        totalUnread += unreadSnapshot.size;
      } catch (err) {
        continue;
      }
    }

    return totalUnread;
  } catch (error) {
    console.error("❌ Error getting unread count:", error);
    return 0;
  }
};

/**
 * Suscribirse a cambios en mensajes no leídos (real-time)
 */
export const subscribeToUnreadCount = (userId, callback) => {
  const interval = setInterval(async () => {
    const count = await getUnreadMessagesCount(userId);
    callback(count);
  }, 10000);

  return () => clearInterval(interval);
};
