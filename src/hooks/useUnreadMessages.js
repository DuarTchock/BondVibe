import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

export const useUnreadMessages = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadByEvent, setUnreadByEvent] = useState({});

  useEffect(() => {
    if (!auth.currentUser) return;

    const loadUnreadMessages = async () => {
      try {
        // Get all events where user is attendee or host
        const eventsSnapshot = await getDocs(collection(db, 'events'));
        const userEvents = [];
        
        eventsSnapshot.forEach((doc) => {
          const eventData = doc.data();
          const isHost = eventData.hostId === auth.currentUser.uid;
          const isAttendee = eventData.attendees?.some(
            a => a.userId === auth.currentUser.uid
          );
          
          if (isHost || isAttendee) {
            userEvents.push(doc.id);
          }
        });

        if (userEvents.length === 0) {
          setUnreadCount(0);
          return;
        }

        // Subscribe to unread messages count
        const unreadMessagesQuery = query(
          collection(db, 'eventChats'),
          where('eventId', 'in', userEvents.slice(0, 10)) // Firestore limit
        );

        const unsubscribe = onSnapshot(unreadMessagesQuery, (snapshot) => {
          const readMessages = JSON.parse(
            localStorage.getItem('readMessages') || '{}'
          );
          
          let totalUnread = 0;
          const unreadByEventTemp = {};

          snapshot.forEach((doc) => {
            const message = doc.data();
            const eventId = message.eventId;
            const messageId = doc.id;
            
            // Don't count own messages
            if (message.userId === auth.currentUser.uid) return;
            
            // Check if message is read
            const eventReadMessages = readMessages[eventId] || [];
            if (!eventReadMessages.includes(messageId)) {
              totalUnread++;
              unreadByEventTemp[eventId] = (unreadByEventTemp[eventId] || 0) + 1;
            }
          });

          setUnreadCount(totalUnread);
          setUnreadByEvent(unreadByEventTemp);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error loading unread messages:', error);
      }
    };

    loadUnreadMessages();
  }, []);

  return { unreadCount, unreadByEvent };
};
