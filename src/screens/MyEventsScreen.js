import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { collection, query, where, getDocs, doc, updateDoc, arrayRemove, increment, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import Colors from '../constants/Colors';
import Sizes from '../constants/Sizes';

export default function MyEventsScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('joined'); // 'joined' or 'hosting'
  const [joinedEvents, setJoinedEvents] = useState([]);
  const [hostingEvents, setHostingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('user');
  const [leavingEventId, setLeavingEventId] = useState(null);

  useEffect(() => {
    loadMyEvents();
  }, []);

  const loadMyEvents = async () => {
    setLoading(true);
    try {
      const userId = auth.currentUser.uid;

      // Get user role
      const userDocRef = doc(db, 'users', userId);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        setUserRole(userData.role || 'user');
      }

      // Load events where user is an attendee
      const allEventsSnapshot = await getDocs(collection(db, 'events'));
      const joined = [];
      const hosting = [];

      allEventsSnapshot.forEach((doc) => {
        const eventData = { id: doc.id, ...doc.data() };
        
        // Check if user is attendee
        if (eventData.attendees && eventData.attendees.some(a => a.userId === userId)) {
          joined.push(eventData);
        }

        // Check if user is host
        if (eventData.hostId === userId) {
          hosting.push(eventData);
        }
      });

      setJoinedEvents(joined);
      setHostingEvents(hosting);

      console.log(`✅ Loaded ${joined.length} joined events, ${hosting.length} hosting events`);
    } catch (error) {
      console.error('Error loading my events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveEvent = async (eventId) => {
    setLeavingEventId(eventId);
    try {
      const userId = auth.currentUser.uid;
      const eventRef = doc(db, 'events', eventId);
      
      // Get event data to find the attendee object
      const eventSnap = await getDoc(eventRef);
      const eventData = eventSnap.data();
      
      // Find the attendee object for this user
      const attendeeToRemove = eventData.attendees.find(a => a.userId === userId);
      
      if (attendeeToRemove) {
        // Remove user from attendees and decrement count
        await updateDoc(eventRef, {
          currentAttendees: increment(-1),
          attendees: arrayRemove(attendeeToRemove),
          updatedAt: new Date().toISOString(),
        });

        console.log('✅ Successfully left event');
        
        // Reload events
        await loadMyEvents();
      }
    } catch (error) {
      console.error('Leave event error:', error);
    } finally {
      setLeavingEventId(null);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderEvent = ({ item }) => (
    <TouchableOpacity
      style={styles.eventCard}
      onPress={() => navigation.navigate('EventDetail', { event: item })}
    >
      <View style={styles.eventHeader}>
        <View style={styles.eventBadges}>
          {item.hostType === 'official' && (
            <View style={styles.officialBadge}>
              <Text style={styles.officialBadgeText}>OFFICIAL</Text>
            </View>
          )}
          <View style={[
            styles.statusBadge,
            item.status === 'published' ? styles.publishedBadge : styles.pendingBadge
          ]}>
            <Text style={styles.statusBadgeText}>
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={styles.eventCategory}>{item.category}</Text>
      </View>

      <Text style={styles.eventTitle}>{item.title}</Text>
      
      <View style={styles.eventInfo}>
        <Text style={styles.eventIcon}>📅</Text>
        <Text style={styles.eventInfoText}>{formatDate(item.date)}</Text>
      </View>

      <View style={styles.eventInfo}>
        <Text style={styles.eventIcon}>📍</Text>
        <Text style={styles.eventInfoText}>{item.location}</Text>
      </View>

      <View style={styles.eventInfo}>
        <Text style={styles.eventIcon}>👥</Text>
        <Text style={styles.eventInfoText}>
          {item.currentAttendees}/{item.maxAttendees} people
        </Text>
      </View>

      {activeTab === 'joined' && (
        <TouchableOpacity
          style={[
            styles.leaveButton,
            leavingEventId === item.id && styles.buttonDisabled
          ]}
          onPress={(e) => {
            e.stopPropagation();
            handleLeaveEvent(item.id);
          }}
          disabled={leavingEventId === item.id}
        >
          {leavingEventId === item.id ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.leaveButtonText}>Leave Event</Text>
          )}
        </TouchableOpacity>
      )}

      {activeTab === 'hosting' && (
        <View style={styles.hostActions}>
          <TouchableOpacity
            style={styles.manageButton}
            onPress={(e) => {
              e.stopPropagation();
              navigation.navigate('EventDetail', { event: item });
            }}
          >
            <Text style={styles.manageButtonText}>View Details</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading your events...</Text>
      </View>
    );
  }

  const canHost = userRole === 'admin' || userRole === 'verified_host';

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Events</Text>
        <Text style={styles.subtitle}>
          {activeTab === 'joined' 
            ? `${joinedEvents.length} events joined` 
            : `${hostingEvents.length} events hosting`}
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'joined' && styles.activeTab]}
          onPress={() => setActiveTab('joined')}
        >
          <Text style={[styles.tabText, activeTab === 'joined' && styles.activeTabText]}>
            Joined ({joinedEvents.length})
          </Text>
        </TouchableOpacity>

        {canHost && (
          <TouchableOpacity
            style={[styles.tab, activeTab === 'hosting' && styles.activeTab]}
            onPress={() => setActiveTab('hosting')}
          >
            <Text style={[styles.tabText, activeTab === 'hosting' && styles.activeTabText]}>
              Hosting ({hostingEvents.length})
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Events List */}
      <FlatList
        data={activeTab === 'joined' ? joinedEvents : hostingEvents}
        keyExtractor={(item) => item.id}
        renderItem={renderEvent}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>
              {activeTab === 'joined' ? '🎯' : '🎪'}
            </Text>
            <Text style={styles.emptyText}>
              {activeTab === 'joined' 
                ? 'No events joined yet' 
                : 'No events hosting yet'}
            </Text>
            <Text style={styles.emptySubtext}>
              {activeTab === 'joined'
                ? 'Explore events and join your first one!'
                : 'Create your first event to get started!'}
            </Text>
            <TouchableOpacity
              style={styles.exploreButton}
              onPress={() => navigation.navigate(
                activeTab === 'joined' ? 'EventFeed' : 'CreateEvent'
              )}
            >
              <Text style={styles.exploreButtonText}>
                {activeTab === 'joined' ? 'Explore Events' : 'Create Event'}
              </Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
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
    marginBottom: 12,
  },
  title: {
    fontSize: Sizes.fontSize.xlarge,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: Sizes.fontSize.small,
    color: Colors.textLight,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    padding: Sizes.padding,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: Sizes.fontSize.medium,
    color: Colors.textLight,
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  listContent: {
    padding: Sizes.padding * 2,
  },
  eventCard: {
    backgroundColor: Colors.background,
    borderRadius: Sizes.borderRadius,
    padding: Sizes.padding * 2,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventBadges: {
    flexDirection: 'row',
  },
  officialBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  officialBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  publishedBadge: {
    backgroundColor: '#E8F5E9',
  },
  pendingBadge: {
    backgroundColor: '#FFF9E6',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  eventCategory: {
    fontSize: Sizes.fontSize.small,
    color: Colors.primary,
    fontWeight: '600',
  },
  eventTitle: {
    fontSize: Sizes.fontSize.large,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  eventInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  eventInfoText: {
    fontSize: Sizes.fontSize.small,
    color: Colors.text,
  },
  leaveButton: {
    backgroundColor: Colors.error,
    padding: Sizes.padding,
    borderRadius: Sizes.borderRadius,
    alignItems: 'center',
    marginTop: 12,
  },
  leaveButtonText: {
    color: '#FFFFFF',
    fontSize: Sizes.fontSize.medium,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  hostActions: {
    flexDirection: 'row',
    marginTop: 12,
  },
  manageButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    padding: Sizes.padding,
    borderRadius: Sizes.borderRadius,
    alignItems: 'center',
  },
  manageButtonText: {
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
    marginBottom: 24,
    textAlign: 'center',
  },
  exploreButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: Sizes.borderRadius,
  },
  exploreButtonText: {
    color: '#FFFFFF',
    fontSize: Sizes.fontSize.medium,
    fontWeight: '600',
  },
});
