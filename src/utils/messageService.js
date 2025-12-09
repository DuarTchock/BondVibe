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
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "../services/firebase";
import * as Notifications from "expo-notifications";

// ============================================
// CONFIGURACIÓN DE NOTIFICACIONES PUSH
// ============================================

// Configurar cómo se muestran las notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

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

    // Enviar notificación push a otros participantes
    await sendPushNotificationToParticipants(conversationId, senderId, text);

    return docRef.id;
  } catch (error) {
    console.error("❌ Error sending message:", error);
    throw error;
  }
};

/**
 * Enviar mensaje de ubicación
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

    // Enviar notificación push
    await sendPushNotificationToParticipants(
      conversationId,
      senderId,
      "📍 Shared location"
    );

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
 * ✅ BUG #6 FIX: includeMetadataChanges captura cambios en 'read' y 'delivered'
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
    { includeMetadataChanges: true }, // ✅ Esto captura cambios en campos sin esperar nuevos docs
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

        // Filtrar usuarios que están escribiendo (últimos 10 segundos)
        const activeTypers = Object.entries(typingData)
          .filter(([userId, timestamp]) => {
            if (!timestamp) return false;
            const timeSince = now - timestamp;
            return timeSince < 10000; // 10 segundos
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
 * ⚠️ IMPORTANTE: Solo marcar como DELIVERED cuando el usuario abre el chat
 * NO marcar automáticamente al recibir
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

    // Solo mensajes que NO son del usuario actual y NO están marcados como delivered
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
 * Marcar mensajes como leídos (solo cuando el usuario ESTÁ EN el chat)
 * ✅ SIEMPRE limpia las notificaciones, incluso si no hay mensajes nuevos
 */
export const markMessagesAsRead = async (conversationId, currentUserId) => {
  try {
    const messagesRef = collection(
      db,
      "conversations",
      conversationId,
      "messages"
    );

    // Solo mensajes que NO son del usuario actual y NO están marcados como read
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
    } else {
      console.log("ℹ️ No unread messages to mark");
    }

    // ✅ CRÍTICO: Limpiar notificaciones SIEMPRE
    await clearEventMessageNotifications(conversationId, currentUserId);
  } catch (error) {
    console.error("❌ Error marking as read:", error);
  }
};

// ============================================
// NOTIFICACIONES
// ============================================

/**
 * Crear/actualizar notificación agrupada por evento
 * ✅ CRÍTICO: Limpia el prefijo "event_" del eventId SIEMPRE
 */
export const createOrUpdateEventNotification = async (
  eventId,
  eventTitle,
  senderId,
  senderName,
  messageText,
  userId
) => {
  try {
    if (!userId) {
      console.error("❌ Cannot create notification: userId is undefined");
      return;
    }

    // ✅ CRÍTICO: Asegurar que eventId NO tenga el prefijo "event_"
    const cleanEventId = eventId.replace("event_", "");

    // Construir ID del documento usando el ID limpio
    const notificationId = `event_msg_${cleanEventId}_${userId}`;
    const notificationRef = doc(db, "notifications", notificationId);

    console.log("📝 Creating/updating notification:");
    console.log("  - Original eventId:", eventId);
    console.log("  - Clean eventId:", cleanEventId);
    console.log("  - Notification ID:", notificationId);

    // Ver si ya existe
    const existingNotif = await getDoc(notificationRef);

    if (existingNotif.exists()) {
      // Actualizar contador
      const currentCount = existingNotif.data().unreadCount ?? 0;
      await updateDoc(notificationRef, {
        unreadCount: currentCount + 1,
        lastMessage: messageText,
        lastSender: senderName,
        updatedAt: new Date().toISOString(),
        read: false,
      });
      console.log("✅ Notification updated, new count:", currentCount + 1);
    } else {
      // Crear nueva notificación agrupada
      await setDoc(notificationRef, {
        userId,
        type: "event_messages",
        eventId: `event_${cleanEventId}`, // ✅ Guardar CON prefijo en el campo
        eventTitle,
        unreadCount: 1,
        lastMessage: messageText,
        lastSender: senderName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        read: false,
      });
      console.log("✅ New notification created");
    }

    console.log("✅ Event notification created/updated for user:", userId);
  } catch (error) {
    console.error("❌ Error creating event notification:", error);
  }
};

/**
 * Limpiar notificaciones de mensajes de un evento cuando se leen
 * ✅ CRÍTICO: Limpia el prefijo "event_" SIEMPRE antes de construir el ID
 */
export const clearEventMessageNotifications = async (
  conversationId,
  userId
) => {
  try {
    console.log("🧹 Attempting to clear notifications...");
    console.log("  - conversationId:", conversationId);
    console.log("  - userId:", userId);

    // ✅ CRÍTICO: Limpiar el prefijo "event_" del conversationId
    const cleanEventId = conversationId.replace("event_", "");
    const notificationId = `event_msg_${cleanEventId}_${userId}`;

    console.log("  - Clean eventId:", cleanEventId);
    console.log("  - Constructed notificationId:", notificationId);

    const notificationRef = doc(db, "notifications", notificationId);
    const notifDoc = await getDoc(notificationRef);

    console.log("  - Document exists:", notifDoc.exists());

    if (notifDoc.exists()) {
      const currentData = notifDoc.data();
      console.log("  - Current data:", {
        read: currentData.read,
        unreadCount: currentData.unreadCount,
        eventTitle: currentData.eventTitle,
      });

      await updateDoc(notificationRef, {
        read: true,
        unreadCount: 0,
      });

      console.log("✅ Cleared event message notifications");
    } else {
      console.log("⚠️ Notification document not found");
      console.log("  Expected ID:", notificationId);
    }
  } catch (error) {
    console.error("❌ Error clearing notifications:", error);
    console.error("  - Error details:", error.message);
  }
};

/**
 * Enviar notificación push a participantes del evento
 * ✅ CORREGIDO: Pasar solo eventId sin prefijo "event_"
 */
const sendPushNotificationToParticipants = async (
  conversationId,
  senderId,
  messageText
) => {
  try {
    const eventId = conversationId.replace("event_", ""); // ✅ FIX: Extraer solo el ID
    const eventDoc = await getDoc(doc(db, "events", eventId));

    if (!eventDoc.exists()) {
      console.log("⚠️ Event not found:", eventId);
      return;
    }

    const eventData = eventDoc.data();
    const eventTitle = eventData.title;

    // Obtener info del remitente
    const senderDoc = await getDoc(doc(db, "users", senderId));
    const senderName = senderDoc.exists()
      ? senderDoc.data().fullName?.split(" ")[0] || "Someone"
      : "Someone";

    // ✅ FIX: Extraer IDs de usuarios correctamente
    let attendeeIds = [];

    if (Array.isArray(eventData.attendees)) {
      attendeeIds = eventData.attendees
        .map((attendee) => {
          // Si es objeto con userId
          if (
            typeof attendee === "object" &&
            attendee !== null &&
            attendee.userId
          ) {
            return attendee.userId;
          }
          // Si es string directo
          if (typeof attendee === "string") {
            return attendee;
          }
          return null;
        })
        .filter(Boolean); // Eliminar nulls
    }

    // Agregar creatorId y filtrar al remitente
    const participants = [...attendeeIds, eventData.creatorId].filter(
      (id) => id && id !== senderId
    );

    console.log("📧 Sending notifications to:", participants.length, "users");

    // Crear/actualizar notificación agrupada para cada participante
    for (const userId of participants) {
      if (!userId) continue;

      try {
        // ✅ FIX: Pasar eventId sin el prefijo "event_"
        await createOrUpdateEventNotification(
          eventId, // ← Ya no tiene el prefijo "event_"
          eventTitle,
          senderId,
          senderName,
          messageText,
          userId
        );
      } catch (notifError) {
        console.error(
          `❌ Error creating notification for user ${userId}:`,
          notifError
        );
      }
    }

    // Enviar push notifications
    for (const userId of participants) {
      if (!userId) continue;

      try {
        const userDoc = await getDoc(doc(db, "users", userId));

        if (userDoc.exists()) {
          const pushToken = userDoc.data().pushToken;

          if (pushToken) {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: `${senderName} in ${eventTitle}`,
                body:
                  messageText.length > 100
                    ? messageText.substring(0, 100) + "..."
                    : messageText,
                data: {
                  type: "event_message",
                  eventId: eventId,
                  conversationId,
                  eventTitle,
                },
                sound: true,
                badge: 1,
              },
              trigger: null,
            });
          }
        }
      } catch (pushError) {
        console.error(`❌ Error sending push to user ${userId}:`, pushError);
      }
    }

    console.log(
      `✅ Push notifications sent to ${participants.length} participants`
    );
  } catch (error) {
    console.error("❌ Error sending push notifications:", error);
  }
};

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
      return;
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data;

    // Guardar token en el documento del usuario
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      pushToken: token,
      pushTokenUpdatedAt: new Date().toISOString(),
    });

    console.log("✅ Push token registered:", token);
    return token;
  } catch (error) {
    console.error("❌ Error registering push token:", error);
  }
};

// ============================================
// CONTADORES PARA BADGES
// ============================================

/**
 * Obtener contador de mensajes no leídos para un usuario
 * ✅ CORREGIDO: Maneja attendees como objetos o strings
 */
export const getUnreadMessagesCount = async (userId) => {
  try {
    let totalUnread = 0;

    // Obtener todas las conversaciones de eventos donde el usuario participa
    const eventsSnapshot = await getDocs(collection(db, "events"));

    for (const eventDoc of eventsSnapshot.docs) {
      const eventData = eventDoc.data();

      // ✅ FIX: Verificar participación correctamente
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
        // Conversación no existe todavía
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
  // Esta es una implementación simplificada
  // Para una solución más robusta, considera usar Cloud Functions

  const interval = setInterval(async () => {
    const count = await getUnreadMessagesCount(userId);
    callback(count);
  }, 10000); // Actualizar cada 10 segundos

  return () => clearInterval(interval);
};
