import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy,
  doc,
  getDoc,
  onSnapshot,
  updateDoc
} from 'firebase/firestore';
import { db } from '../services/firebase';

// Crear o obtener conversación
export const getOrCreateConversation = async (userId1, userId2) => {
  try {
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', userId1)
    );
    
    const snapshot = await getDocs(q);
    const existingConversation = snapshot.docs.find(doc => {
      const data = doc.data();
      return data.participants.includes(userId2);
    });

    if (existingConversation) {
      return { id: existingConversation.id, ...existingConversation.data() };
    }

    const newConversation = await addDoc(conversationsRef, {
      participants: [userId1, userId2],
      createdAt: new Date().toISOString(),
      lastMessage: null,
      lastMessageAt: null,
    });

    return {
      id: newConversation.id,
      participants: [userId1, userId2],
      createdAt: new Date().toISOString(),
      lastMessage: null,
      lastMessageAt: null,
    };
  } catch (error) {
    console.error('Error getting/creating conversation:', error);
    throw error;
  }
};

// Enviar mensaje
export const sendMessage = async (conversationId, senderId, text) => {
  try {
    await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
      senderId,
      text: text.trim(),
      createdAt: new Date().toISOString(),
      read: false,
    });

    await updateDoc(doc(db, 'conversations', conversationId), {
      lastMessage: text.trim(),
      lastMessageAt: new Date().toISOString(),
    });

    console.log('✅ Message sent');
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

// Obtener conversaciones del usuario (simplificado sin orderBy para evitar índice)
export const getUserConversations = async (userId) => {
  try {
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', userId)
    );

    const snapshot = await getDocs(q);
    const conversations = await Promise.all(
      snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();
        const otherUserId = data.participants.find(id => id !== userId);
        
        const userDoc = await getDoc(doc(db, 'users', otherUserId));
        const userData = userDoc.exists() ? userDoc.data() : null;

        return {
          id: docSnap.id,
          ...data,
          otherUser: {
            id: otherUserId,
            ...userData,
          }
        };
      })
    );

    // Ordenar manualmente por lastMessageAt
    conversations.sort((a, b) => {
      const dateA = a.lastMessageAt ? new Date(a.lastMessageAt) : new Date(0);
      const dateB = b.lastMessageAt ? new Date(b.lastMessageAt) : new Date(0);
      return dateB - dateA;
    });

    return conversations;
  } catch (error) {
    console.error('Error getting conversations:', error);
    return [];
  }
};

// Obtener mensajes de una conversación
export const getMessages = async (conversationId) => {
  try {
    const q = query(
      collection(db, 'conversations', conversationId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting messages:', error);
    return [];
  }
};

// Suscribirse a mensajes en tiempo real
export const subscribeToMessages = (conversationId, callback) => {
  const q = query(
    collection(db, 'conversations', conversationId, 'messages'),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(messages);
  });
};
