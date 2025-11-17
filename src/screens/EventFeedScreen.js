import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { generateMockEvents } from '../utils/mockEvents';

export default function EventFeedScreen({ navigation }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Social', 'Sports', 'Food', 'Arts', 'Learning', 'Adventure'];

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const eventsQuery = query(
        collection(db, 'events'),
        where('status', '==', 'published'),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      const snapshot = await getDocs(eventsQuery);
      const realEvents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const mockEvents = generateMockEvents();
      const allEvents = [...realEvents, ...mockEvents];
      
      setEvents(allEvents);
    } catch (error) {
      console.error('Error loading events:', error);
      const mockEvents = generateMockEvents();
      setEvents(mockEvents);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || event.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const EventCard = ({ event }) => (
    <TouchableOpacity
      style={styles.eventCard}
      onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
      activeOpacity={0.8}
    >
      <View style={styles.eventGlass}>
        {/* Header */}
        <View style={styles.eventHeader}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{event.category}</Text>
          </View>
          {event.price === 0 ? (
            <View style={styles.freeBadge}>
              <Text style={styles.freeBadgeText}>FREE</Text>
            </View>
          ) : (
            <Text style={styles.priceText}>${event.price}</Text>
          )}
        </View>

        {/* Title */}
        <Text style={styles.eventTitle} numberOfLines={2}>
          {event.title}
        </Text>

        {/* Meta Info */}
        <View style={styles.eventMeta}>
          <View style={styles.metaItem}>
            <Text style={styles.metaIcon}>📅</Text>
            <Text style={styles.metaText}>{event.date}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaIcon}>📍</Text>
            <Text style={styles.metaText} numberOfLines={1}>
              {event.location}
            </Text>
          </View>
        </View>

        {/* Attendees */}
        <View style={styles.attendeesRow}>
          <View style={styles.attendeesAvatars}>
            {event.attendees?.slice(0, 3).map((attendee, index) => (
              <View
                key={index}
                style={[styles.avatar, { marginLeft: index > 0 ? -8 : 0 }]}
              >
                <Text style={styles.avatarEmoji}>{attendee.avatar || '😊'}</Text>
              </View>
            ))}
            {event.attendees?.length > 3 && (
              <View style={[styles.avatar, styles.avatarMore]}>
                <Text style={styles.avatarMoreText}>+{event.attendees.length - 3}</Text>
              </View>
            )}
          </View>
          <Text style={styles.attendeesCount}>
            {event.attendees?.length || 0}/{event.maxAttendees}
          </Text>
        </View>

        {/* Compatibility if available */}
        {event.compatibilityScore && (
          <View style={styles.compatibilityContainer}>
            <View style={styles.compatibilityBar}>
              <View 
                style={[styles.compatibilityFill, { width: `${event.compatibilityScore}%` }]} 
              />
            </View>
            <Text style={styles.compatibilityText}>{event.compatibilityScore}% match</Text>
          </View>
        )}
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
        <Text style={styles.headerTitle}>Discover</Text>
        <TouchableOpacity onPress={() => navigation.navigate('SearchEvents')}>
          <Text style={styles.searchIcon}>🔍</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchBarIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search events..."
            placeholderTextColor="#64748B"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesScroll}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryChip,
              selectedCategory === category && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(category)}
            activeOpacity={0.7}
          >
            <View style={[
              styles.categoryChipGlass,
              selectedCategory === category && styles.categoryChipGlassActive,
            ]}>
              <Text style={[
                styles.categoryChipText,
                selectedCategory === category && styles.categoryChipTextActive,
              ]}>
                {category}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Events List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF3EA5" />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredEvents.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🎯</Text>
              <Text style={styles.emptyTitle}>No events found</Text>
              <Text style={styles.emptyText}>
                Try adjusting your filters
              </Text>
            </View>
          ) : (
            filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))
          )}
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
  searchIcon: {
    fontSize: 22,
  },
  
  // Search Bar
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(17, 24, 39, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 48,
  },
  searchBarIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#F1F5F9',
  },
  clearIcon: {
    fontSize: 16,
    color: '#64748B',
    padding: 4,
  },
  
  // Categories
  categoriesScroll: {
    marginBottom: 20,
  },
  categoriesContent: {
    paddingHorizontal: 24,
    gap: 8,
  },
  categoryChip: {
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 8,
  },
  categoryChipGlass: {
    backgroundColor: 'rgba(17, 24, 39, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  categoryChipActive: {},
  categoryChipGlassActive: {
    backgroundColor: 'rgba(255, 62, 165, 0.2)',
    borderColor: 'rgba(255, 62, 165, 0.4)',
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
    letterSpacing: -0.1,
  },
  categoryChipTextActive: {
    color: '#FF3EA5',
  },
  
  // Events List
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
  
  // Event Card
  eventCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  eventGlass: {
    backgroundColor: 'rgba(17, 24, 39, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 18,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
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
    letterSpacing: 0.3,
  },
  freeBadge: {
    backgroundColor: 'rgba(166, 255, 150, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(166, 255, 150, 0.3)',
  },
  freeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A6FF96',
    letterSpacing: 0.5,
  },
  priceText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#00F2FE',
    letterSpacing: -0.5,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F1F5F9',
    marginBottom: 12,
    lineHeight: 24,
    letterSpacing: -0.3,
  },
  eventMeta: {
    gap: 8,
    marginBottom: 14,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  metaText: {
    fontSize: 13,
    color: '#94A3B8',
    flex: 1,
  },
  
  // Attendees
  attendeesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  attendeesAvatars: {
    flexDirection: 'row',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(17, 24, 39, 0.8)',
    borderWidth: 2,
    borderColor: '#0B0F1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
    fontSize: 14,
  },
  avatarMore: {
    backgroundColor: 'rgba(255, 62, 165, 0.3)',
  },
  avatarMoreText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#F1F5F9',
  },
  attendeesCount: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  
  // Compatibility
  compatibilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  compatibilityBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  compatibilityFill: {
    height: '100%',
    backgroundColor: '#A6FF96',
    borderRadius: 3,
  },
  compatibilityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A6FF96',
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    marginTop: 80,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F1F5F9',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
});
