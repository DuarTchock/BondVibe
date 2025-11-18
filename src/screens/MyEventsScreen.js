import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../services/firebase';

export default function MyEventsScreen({ navigation }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('joined'); // joined, hosting

  useEffect(() => {
    loadMyEvents();
  }, [activeTab]);

  const loadMyEvents = async () => {
    setLoading(true);
    try {
      if (activeTab === 'hosting') {
        const hostingQuery = query(
          collection(db, 'events'),
          where('creatorId', '==', auth.currentUser.uid)
        );
        const snapshot = await getDocs(hostingQuery);
        setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } else {
        // For now, empty array for joined events
        setEvents([]);
      }
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const EventCard = ({ event }) => (
    <TouchableOpacity
      style={styles.eventCard}
      onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
      activeOpacity={0.8}
    >
      <View style={styles.eventGlass}>
        <View style={styles.eventHeader}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{event.category}</Text>
          </View>
          <Text style={styles.eventDate}>{event.date}</Text>
        </View>
        
        <Text style={styles.eventTitle} numberOfLines={2}>
          {event.title}
        </Text>
        
        <View style={styles.eventMeta}>
          <Text style={styles.metaIcon}>📍</Text>
          <Text style={styles.metaText} numberOfLines={1}>
            {event.location}
          </Text>
        </View>

        <View style={styles.attendeesRow}>
          <Text style={styles.attendeesText}>
            {event.attendees?.length || 0}/{event.maxAttendees} people
          </Text>
          {event.status === 'published' && (
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>Active</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Events</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'joined' && styles.tabActive]}
          onPress={() => setActiveTab('joined')}
        >
          <View style={[styles.tabGlass, activeTab === 'joined' && styles.tabGlassActive]}>
            <Text style={[styles.tabText, activeTab === 'joined' && styles.tabTextActive]}>
              Joined
            </Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'hosting' && styles.tabActive]}
          onPress={() => setActiveTab('hosting')}
        >
          <View style={[styles.tabGlass, activeTab === 'hosting' && styles.tabGlassActive]}>
            <Text style={[styles.tabText, activeTab === 'hosting' && styles.tabTextActive]}>
              Hosting
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF3EA5" />
        </View>
      ) : events.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>
            {activeTab === 'joined' ? '🎯' : '🎪'}
          </Text>
          <Text style={styles.emptyTitle}>
            {activeTab === 'joined' ? 'No events joined yet' : 'No events created yet'}
          </Text>
          <Text style={styles.emptyText}>
            {activeTab === 'joined' 
              ? 'Explore events and join your first experience'
              : 'Create an event to bring people together'
            }
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => navigation.navigate(activeTab === 'joined' ? 'EventFeed' : 'CreateEvent')}
          >
            <View style={styles.emptyButtonGlass}>
              <Text style={styles.emptyButtonText}>
                {activeTab === 'joined' ? 'Explore Events' : 'Create Event'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F1A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    fontSize: 28,
    color: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F1F5F9',
    letterSpacing: -0.3,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 20,
    gap: 12,
  },
  tab: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  tabGlass: {
    backgroundColor: 'rgba(17, 24, 39, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabActive: {},
  tabGlassActive: {
    backgroundColor: 'rgba(255, 62, 165, 0.2)',
    borderColor: 'rgba(255, 62, 165, 0.4)',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#94A3B8',
  },
  tabTextActive: {
    color: '#FF3EA5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  eventCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  eventGlass: {
    backgroundColor: 'rgba(17, 24, 39, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    backgroundColor: 'rgba(255, 62, 165, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 62, 165, 0.3)',
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FF3EA5',
  },
  eventDate: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  eventTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#F1F5F9',
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  metaIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  metaText: {
    fontSize: 13,
    color: '#94A3B8',
    flex: 1,
  },
  attendeesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attendeesText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  statusBadge: {
    backgroundColor: 'rgba(166, 255, 150, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(166, 255, 150, 0.3)',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#A6FF96',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F1F5F9',
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  emptyButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  emptyButtonGlass: {
    backgroundColor: 'rgba(255, 62, 165, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 62, 165, 0.4)',
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF3EA5',
  },
});
