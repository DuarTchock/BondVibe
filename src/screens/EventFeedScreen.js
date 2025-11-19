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
import { db } from '../services/firebase';
import { generateMockEvents } from '../utils/mockEvents';
import { useTheme } from '../contexts/ThemeContext';

export default function EventFeedScreen({ navigation }) {
  const { colors, isDark } = useTheme();
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
      
      console.log('📊 Loaded events:', allEvents.length);
      setEvents(allEvents);
    } catch (error) {
      console.error('Error loading events:', error);
      const mockEvents = generateMockEvents();
      console.log('📊 Using mock events:', mockEvents.length);
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

  const styles = createStyles(colors);

  const EventCard = ({ event }) => (
    <TouchableOpacity
      style={styles.eventCard}
      onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
      activeOpacity={0.8}
    >
      <View style={[styles.eventGlass, {
        backgroundColor: colors.surfaceGlass,
        borderColor: colors.border
      }]}>
        {/* Header */}
        <View style={styles.eventHeader}>
          <View style={[styles.categoryBadge, {
            backgroundColor: `${colors.primary}26`,
            borderColor: `${colors.primary}4D`
          }]}>
            <Text style={[styles.categoryText, { color: colors.primary }]}>
              {event.category}
            </Text>
          </View>
          {event.price === 0 ? (
            <View style={styles.freeBadge}>
              <Text style={styles.freeBadgeText}>FREE</Text>
            </View>
          ) : (
            <Text style={[styles.priceText, { color: colors.secondary }]}>
              ${event.price}
            </Text>
          )}
        </View>

        {/* Title */}
        <Text style={[styles.eventTitle, { color: colors.text }]} numberOfLines={2}>
          {event.title}
        </Text>

        {/* Meta Info */}
        <View style={styles.eventMeta}>
          <View style={styles.metaItem}>
            <Text style={styles.metaIcon}>📅</Text>
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
              {event.date}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaIcon}>📍</Text>
            <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>
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
                style={[styles.avatar, { 
                  marginLeft: index > 0 ? -8 : 0,
                  backgroundColor: colors.surface,
                  borderColor: colors.background
                }]}
              >
                <Text style={styles.avatarEmoji}>😊</Text>
              </View>
            ))}
            {event.attendees?.length > 3 && (
              <View style={[styles.avatar, styles.avatarMore, {
                backgroundColor: `${colors.primary}4D`,
                borderColor: colors.background
              }]}>
                <Text style={[styles.avatarMoreText, { color: colors.text }]}>
                  +{event.attendees.length - 3}
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.attendeesCount, { color: colors.textSecondary }]}>
            {event.attendees?.length || 0}/{event.maxAttendees}
          </Text>
        </View>

        {/* Compatibility */}
        {event.compatibilityScore && (
          <View style={styles.compatibilityContainer}>
            <View style={[styles.compatibilityBar, {
              backgroundColor: `${colors.border}`
            }]}>
              <View 
                style={[styles.compatibilityFill, { 
                  width: `${event.compatibilityScore}%`,
                  backgroundColor: colors.accent
                }]} 
              />
            </View>
            <Text style={[styles.compatibilityText, { color: colors.accent }]}>
              {event.compatibilityScore}% match
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backButton, { color: colors.text }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Discover</Text>
        <TouchableOpacity onPress={() => navigation.navigate('SearchEvents')}>
          <Text style={styles.searchIcon}>🔍</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, {
          backgroundColor: colors.surfaceGlass,
          borderColor: colors.border
        }]}>
          <Text style={styles.searchBarIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search events..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={[styles.clearIcon, { color: colors.textTertiary }]}>✕</Text>
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
            style={styles.categoryChip}
            onPress={() => setSelectedCategory(category)}
            activeOpacity={0.7}
          >
            <View style={[
              styles.categoryChipGlass,
              {
                backgroundColor: selectedCategory === category 
                  ? `${colors.primary}33` 
                  : colors.surfaceGlass,
                borderColor: selectedCategory === category 
                  ? `${colors.primary}66` 
                  : colors.border
              }
            ]}>
              <Text style={[
                styles.categoryChipText,
                { color: selectedCategory === category ? colors.primary : colors.textSecondary }
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
          <ActivityIndicator size="large" color={colors.primary} />
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
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No events found</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
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

function createStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
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
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      letterSpacing: -0.3,
    },
    searchIcon: {
      fontSize: 22,
    },
    searchContainer: {
      paddingHorizontal: 24,
      marginBottom: 16,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
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
    },
    clearIcon: {
      fontSize: 16,
      padding: 4,
    },
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
      borderWidth: 1,
      paddingVertical: 8,
      paddingHorizontal: 16,
    },
    categoryChipText: {
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: -0.1,
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
      borderRadius: 20,
      overflow: 'hidden',
    },
    eventGlass: {
      borderWidth: 1,
      padding: 18,
    },
    eventHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 14,
    },
    categoryBadge: {
      paddingVertical: 4,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
    },
    categoryText: {
      fontSize: 11,
      fontWeight: '600',
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
      letterSpacing: -0.5,
    },
    eventTitle: {
      fontSize: 18,
      fontWeight: '700',
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
      flex: 1,
    },
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
      borderWidth: 2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarEmoji: {
      fontSize: 14,
    },
    avatarMore: {},
    avatarMoreText: {
      fontSize: 10,
      fontWeight: '600',
    },
    attendeesCount: {
      fontSize: 12,
      fontWeight: '600',
    },
    compatibilityContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    compatibilityBar: {
      flex: 1,
      height: 6,
      borderRadius: 3,
      overflow: 'hidden',
    },
    compatibilityFill: {
      height: '100%',
      borderRadius: 3,
    },
    compatibilityText: {
      fontSize: 12,
      fontWeight: '600',
    },
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
      marginBottom: 8,
      letterSpacing: -0.3,
    },
    emptyText: {
      fontSize: 14,
      textAlign: 'center',
    },
  });
}
