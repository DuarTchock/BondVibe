import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  addDoc,
  doc,
  getDoc,
} from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { notifyNewMessage } from '../services/notifications';
import Colors from '../constants/Colors';
import Sizes from '../constants/Sizes';

export default function EventChatScreen({ route, navigation }) {
  const { eventId, eventTitle } = route.params;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [isAttendee, setIsAttendee] = useState(false);
  const [eventAttendees, setEventAttendees] = useState([]);
  const [previouslyReadMessageIds, setPreviouslyReadMessageIds] = useState([]);
  const [currentlyReadMessageIds, setCurrentlyReadMessageIds] = useState([]);
  const flatListRef = useRef(null);
  const markAsReadTimeoutRef = useRef(null);

  useEffect(() => {
    loadUserProfile();
    checkIfAttendee();
    loadPreviouslyReadMessages();
    
    return () => {
      if (markAsReadTimeoutRef.current) {
        clearTimeout(markAsReadTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isAttendee) {
      const unsubscribe = subscribeToMessages();
      return () => unsubscribe();
    }
  }, [isAttendee]);

  const loadPreviouslyReadMessages = () => {
    const readMessages = JSON.parse(
      localStorage.getItem('readMessages') || '{}'
    );
    const eventReadMessages = readMessages[eventId] || [];
    setPreviouslyReadMessageIds(eventReadMessages);
    console.log(`📖 Loaded ${eventReadMessages.length} previously read messages`);
  };

  const loadUserProfile = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        setUserProfile(userDoc.data());
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const checkIfAttendee = async () => {
    try {
      const eventDoc = await getDoc(doc(db, 'events', eventId));
      if (eventDoc.exists()) {
        const eventData = eventDoc.data();
        
        const isHost = eventData.hostId === auth.currentUser.uid;
        const isInAttendees = eventData.attendees?.some(
          a => a.userId === auth.currentUser.uid
        );
        
        setIsAttendee(isHost || isInAttendees);
        
        const attendeeIds = [eventData.hostId];
        if (eventData.attendees) {
          attendeeIds.push(...eventData.attendees.map(a => a.userId));
        }
        setEventAttendees([...new Set(attendeeIds)]);
        
        if (!isHost && !isInAttendees) {
          console.log('❌ User is not an attendee of this event');
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Error checking attendee status:', error);
      setLoading(false);
    }
  };

  const markMessagesAsRead = () => {
    const readMessages = JSON.parse(
      localStorage.getItem('readMessages') || '{}'
    );
    
    const messageIds = messages.map(m => m.id);
    readMessages[eventId] = messageIds;
    localStorage.setItem('readMessages', JSON.stringify(readMessages));
    
    // Update state to trigger re-render
    setCurrentlyReadMessageIds(messageIds);
    console.log('✅ Messages marked as read');
  };

  useEffect(() => {
    if (messages.length > 0 && currentlyReadMessageIds.length === 0) {
      if (markAsReadTimeoutRef.current) {
        clearTimeout(markAsReadTimeoutRef.current);
      }
      
      console.log('⏰ Starting 3 second timer to mark messages as read...');
      
      // Mark messages as read after 3 seconds
      markAsReadTimeoutRef.current = setTimeout(() => {
        markMessagesAsRead();
      }, 3000);
    }
  }, [messages, currentlyReadMessageIds]);

  const subscribeToMessages = () => {
    const messagesQuery = query(
      collection(db, 'eventChats'),
      where('eventId', '==', eventId),
      orderBy('createdAt', 'asc')
    );

    return onSnapshot(messagesQuery, (snapshot) => {
      const msgs = [];
      snapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() });
      });
      setMessages(msgs);
      console.log(`✅ Loaded ${msgs.length} messages`);
      
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      await addDoc(collection(db, 'eventChats'), {
        eventId,
        userId: auth.currentUser.uid,
        userName: userProfile?.fullName || 'User',
        userAvatar: userProfile?.avatar || '👤',
        message: newMessage.trim(),
        createdAt: new Date().toISOString(),
      });

      const otherAttendees = eventAttendees.filter(
        id => id !== auth.currentUser.uid
      );
      
      if (otherAttendees.length > 0) {
        await notifyNewMessage(
          otherAttendees,
          eventId,
          userProfile?.fullName || 'User',
          eventTitle
        );
      }

      setNewMessage('');
      console.log('✅ Message sent');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const isMessageUnread = (messageId, messageUserId) => {
    // Own messages are never unread
    if (messageUserId === auth.currentUser.uid) return false;
    
    // If message was previously read (before entering this chat session), it's not NEW
    if (previouslyReadMessageIds.includes(messageId)) return false;
    
    // If we've marked messages as read in this session, check against that
    if (currentlyReadMessageIds.length > 0) {
      return !currentlyReadMessageIds.includes(messageId);
    }
    
    // Otherwise, it's unread (NEW)
    return true;
  };

  const renderMessage = ({ item }) => {
    const isOwnMessage = item.userId === auth.currentUser.uid;
    const isUnread = isMessageUnread(item.id, item.userId);

    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer
      ]}>
        {!isOwnMessage && (
          <Text style={styles.messageAvatar}>{item.userAvatar}</Text>
        )}
        
        <View style={[
          styles.messageBubble,
          isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble,
          isUnread && !isOwnMessage && styles.unreadMessageBubble
        ]}>
          {!isOwnMessage && (
            <View style={styles.messageSenderRow}>
              <Text style={styles.messageSender}>{item.userName}</Text>
              {isUnread && (
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>NEW</Text>
                </View>
              )}
            </View>
          )}
          <Text style={[
            styles.messageText,
            isOwnMessage ? styles.ownMessageText : styles.otherMessageText
          ]}>
            {item.message}
          </Text>
          <Text style={[
            styles.messageTime,
            isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime
          ]}>
            {formatTime(item.createdAt)}
          </Text>
        </View>

        {isOwnMessage && (
          <Text style={styles.messageAvatar}>{item.userAvatar}</Text>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading chat...</Text>
      </View>
    );
  }

  if (!isAttendee) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{eventTitle}</Text>
        </View>

        <View style={styles.restrictedContainer}>
          <Text style={styles.restrictedEmoji}>🔒</Text>
          <Text style={styles.restrictedTitle}>Chat Not Available</Text>
          <Text style={styles.restrictedText}>
            You need to join this event to access the chat
          </Text>
          <TouchableOpacity
            style={styles.restrictedButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.restrictedButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{eventTitle}</Text>
          <Text style={styles.headerSubtitle}>
            {messages.length} {messages.length === 1 ? 'message' : 'messages'}
          </Text>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>💬</Text>
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>
              Be the first to say hello!
            </Text>
          </View>
        }
        onContentSizeChange={() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor={Colors.textLight}
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!newMessage.trim() || sending) && styles.sendButtonDisabled
          ]}
          onPress={sendMessage}
          disabled={!newMessage.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.sendButtonText}>Send</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: Sizes.fontSize.medium,
    color: Colors.textLight,
  },
  header: {
    backgroundColor: Colors.background,
    padding: Sizes.padding * 2,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    fontSize: Sizes.fontSize.medium,
    color: Colors.primary,
    fontWeight: '600',
    marginBottom: 8,
  },
  headerInfo: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Sizes.fontSize.large,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: Sizes.fontSize.small,
    color: Colors.textLight,
    marginTop: 4,
  },
  messagesList: {
    padding: Sizes.padding * 2,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  ownMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    fontSize: 24,
    marginHorizontal: 8,
  },
  messageBubble: {
    maxWidth: '70%',
    padding: 12,
    borderRadius: Sizes.borderRadius,
  },
  ownMessageBubble: {
    backgroundColor: Colors.primary,
  },
  otherMessageBubble: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  unreadMessageBubble: {
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: '#F0F0FF',
  },
  messageSenderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  messageSender: {
    fontSize: Sizes.fontSize.small,
    fontWeight: '600',
    color: Colors.primary,
  },
  newBadge: {
    backgroundColor: Colors.error,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  newBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  messageText: {
    fontSize: Sizes.fontSize.medium,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: Colors.text,
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
  },
  ownMessageTime: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'right',
  },
  otherMessageTime: {
    color: Colors.textLight,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: Sizes.padding * 2,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: Sizes.borderRadius,
    padding: 12,
    fontSize: Sizes.fontSize.medium,
    color: Colors.text,
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: Sizes.borderRadius,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 70,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.border,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: Sizes.fontSize.medium,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: Sizes.fontSize.large,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: Sizes.fontSize.small,
    color: Colors.textLight,
    textAlign: 'center',
  },
  restrictedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Sizes.padding * 2,
  },
  restrictedEmoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  restrictedTitle: {
    fontSize: Sizes.fontSize.large,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  restrictedText: {
    fontSize: Sizes.fontSize.medium,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: 24,
  },
  restrictedButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: Sizes.borderRadius,
  },
  restrictedButtonText: {
    color: '#FFFFFF',
    fontSize: Sizes.fontSize.medium,
    fontWeight: '600',
  },
});
