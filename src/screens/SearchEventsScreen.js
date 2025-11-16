import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import { MOCK_EVENTS } from '../data/mockEvents';
import Colors from '../constants/Colors';
import Sizes from '../constants/Sizes';

const CATEGORIES = ['All', 'Social', 'Sports', 'Food', 'Arts', 'Learning', 'Outdoor'];
const PRICE_FILTERS = ['All', 'Free', 'Paid'];
const SORT_OPTIONS = ['Date', 'Compatibility', 'Popularity', 'Price'];

export default function SearchEventsScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPriceFilter, setSelectedPriceFilter] = useState('All');
  const [selectedSort, setSelectedSort] = useState('Date');

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [events, searchQuery, selectedCategory, selectedPriceFilter, selectedSort]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const eventsQuery = query(
        collection(db, 'events'),
        where('status', '==', 'published')
      );
      const eventsSnapshot = await getDocs(eventsQuery);
      const realEvents = [];
      
      eventsSnapshot.forEach((doc) => {
        realEvents.push({ id: doc.id, ...doc.data() });
      });
      
      const allEvents = [...realEvents, ...MOCK_EVENTS];
      setEvents(allEvents);
      console.log(`✅ Loaded ${allEvents.length} events for search`);
    } catch (error) {
      console.error('Error loading events:', error);
      setEvents(MOCK_EVENTS);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...events];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        event.location.toLowerCase().includes(query)
      );
    }

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(event => event.category === selectedCategory);
    }

    if (selectedPriceFilter === 'Free') {
      filtered = filtered.filter(event => event.price === 0);
    } else if (selectedPriceFilter === 'Paid') {
      filtered = filtered.filter(event => event.price > 0);
    }

    if (selectedSort === 'Date') {
      filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (selectedSort === 'Compatibility') {
      filtered.sort((a, b) => (b.compatibilityScore || 0) - (a.compatibilityScore || 0));
    } else if (selectedSort === 'Popularity') {
      filtered.sort((a, b) => b.currentAttendees - a.currentAttendees);
    } else if (selectedSort === 'Price') {
      filtered.sort((a, b) => a.price - b.price);
    }

    setFilteredEvents(filtered);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedPriceFilter('All');
    setSelectedSort('Date');
  };

  const hasActiveFilters = searchQuery || selectedCategory !== 'All' || selectedPriceFilter !== 'All' || selectedSort !== 'Date';

  const renderEvent = ({ item }) => (
    <TouchableOpacity
      style={styles.eventCard}
      onPress={() => navigation.navigate('EventDetail', { event: item })}
    >
      <View style={styles.eventHeader}>
        <View style={styles.eventBadges}>
          {item.hostType === 'official' && (
            <View style={styles.officialBadge}>
              <Text style={styles.badgeText}>OFFICIAL</Text>
            </View>
          )}
          <View style={styles.categoryBadge}>
            <Text style={styles.badgeText}>{item.category}</Text>
          </View>
        </View>
        <View style={styles.compatibilityBadge}>
          <Text style={styles.compatibilityText}>{item.compatibilityScore}%</Text>
        </View>
      </View>

      <Text style={styles.eventTitle}>{item.title}</Text>
      <Text style={styles.eventDescription} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.eventInfo}>
        <Text style={styles.eventInfoText}>
          📅 {new Date(item.date).toLocaleDateString()}
        </Text>
        <Text style={styles.eventInfoText}>
          📍 {item.location}
        </Text>
        <Text style={styles.eventInfoText}>
          👥 {item.currentAttendees}/{item.maxAttendees}
        </Text>
      </View>

      <View style={styles.eventFooter}>
        <Text style={styles.eventPrice}>
          {item.price === 0 ? 'FREE' : `$${item.price} MXN`}
        </Text>
        <Text style={styles.eventDuration}>{item.duration}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search Events</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search events..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={Colors.textLight}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Category</Text>
          <View style={styles.filterChips}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.chip,
                  selectedCategory === cat && styles.chipSelected
                ]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={[
                  styles.chipText,
                  selectedCategory === cat && styles.chipTextSelected
                ]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Price</Text>
          <View style={styles.filterChips}>
            {PRICE_FILTERS.map(price => (
              <TouchableOpacity
                key={price}
                style={[
                  styles.chip,
                  selectedPriceFilter === price && styles.chipSelected
                ]}
                onPress={() => setSelectedPriceFilter(price)}
              >
                <Text style={[
                  styles.chipText,
                  selectedPriceFilter === price && styles.chipTextSelected
                ]}>
                  {price}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Sort by</Text>
          <View style={styles.filterChips}>
            {SORT_OPTIONS.map(sort => (
              <TouchableOpacity
                key={sort}
                style={[
                  styles.chip,
                  selectedSort === sort && styles.chipSelected
                ]}
                onPress={() => setSelectedSort(sort)}
              >
                <Text style={[
                  styles.chipText,
                  selectedSort === sort && styles.chipTextSelected
                ]}>
                  {sort}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {hasActiveFilters && (
          <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
            <Text style={styles.clearButtonText}>Clear All Filters</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Results */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsText}>
          {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'} found
        </Text>
      </View>

      <FlatList
        data={filteredEvents}
        keyExtractor={(item) => item.id}
        renderItem={renderEvent}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyText}>No events found</Text>
            <Text style={styles.emptySubtext}>
              Try adjusting your search or filters
            </Text>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  },
  headerTitle: {
    fontSize: Sizes.fontSize.large,
    fontWeight: 'bold',
    color: Colors.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    margin: Sizes.padding * 2,
    marginBottom: Sizes.padding,
    padding: 12,
    borderRadius: Sizes.borderRadius,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: Sizes.fontSize.medium,
    color: Colors.text,
  },
  clearIcon: {
    fontSize: 20,
    color: Colors.textLight,
    padding: 4,
  },
  filtersContainer: {
    backgroundColor: Colors.background,
    paddingHorizontal: Sizes.padding * 2,
    paddingVertical: Sizes.padding,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: Sizes.fontSize.medium,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: Sizes.fontSize.small,
    color: Colors.text,
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  clearButton: {
    backgroundColor: Colors.error,
    padding: 12,
    borderRadius: Sizes.borderRadius,
    alignItems: 'center',
    marginTop: 8,
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: Sizes.fontSize.medium,
    fontWeight: '600',
  },
  resultsHeader: {
    backgroundColor: Colors.background,
    padding: Sizes.padding,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  resultsText: {
    fontSize: Sizes.fontSize.small,
    color: Colors.textLight,
    textAlign: 'center',
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
    marginBottom: 12,
  },
  eventBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  officialBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryBadge: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  compatibilityBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  compatibilityText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.success,
  },
  eventTitle: {
    fontSize: Sizes.fontSize.large,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  eventDescription: {
    fontSize: Sizes.fontSize.small,
    color: Colors.textLight,
    marginBottom: 12,
  },
  eventInfo: {
    gap: 4,
    marginBottom: 12,
  },
  eventInfoText: {
    fontSize: Sizes.fontSize.small,
    color: Colors.text,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventPrice: {
    fontSize: Sizes.fontSize.medium,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  eventDuration: {
    fontSize: Sizes.fontSize.small,
    color: Colors.textLight,
  },
  emptyContainer: {
    alignItems: 'center',
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
  },
});
