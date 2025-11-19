import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';

// Contar conversaciones con mensajes no leídos
export const getUnreadConversationsCount = async (userId) => {
  try {
    const conversationsQuery = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', userId)
    );
    
    const snapshot = await getDocs(conversationsQuery);
    let unreadCount = 0;

    for (const docSnap of snapshot.docs) {
      const conversationId = docSnap.id;
      
      // Contar mensajes no leídos en esta conversación
      const messagesQuery = query(
        collection(db, 'conversations', conversationId, 'messages'),
        where('senderId', '!=', userId),
        where('read', '==', false)
      );
      
      const messagesSnapshot = await getDocs(messagesQuery);
      if (messagesSnapshot.size > 0) {
        unreadCount++;
      }
    }

    return unreadCount;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
};

// Suscribirse a cambios en mensajes no leídos
export const subscribeToUnreadCount = (userId, callback) => {
  const conversationsQuery = query(
    collection(db, 'conversations'),
    where('participants', 'array-contains', userId)
  );

  return onSnapshot(conversationsQuery, async (snapshot) => {
    let unreadCount = 0;

    for (const docSnap of snapshot.docs) {
      const conversationId = docSnap.id;
      
      const messagesQuery = query(
        collection(db, 'conversations', conversationId, 'messages'),
        where('senderId', '!=', userId),
        where('read', '==', false)
      );
      
      const messagesSnapshot = await getDocs(messagesQuery);
      if (messagesSnapshot.size > 0) {
        unreadCount++;
      }
    }

    callback(unreadCount);
  });
};
