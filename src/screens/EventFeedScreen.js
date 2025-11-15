import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import EventCard from '../components/EventCard';
import { mockEvents, categories } from '../utils/mockEvents';
import Colors from '../constants/Colors';
import Sizes from '../constants/Sizes';

export default function EventFeedScreen({ navigation }) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('date');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      // Simplified query - no orderBy to avoid index requirement
      const eventsQuery = query(
        collection(db, 'events'),
        where('status', '==', 'published')
      );
      
      const querySnapshot = await getDocs(eventsQuery);
      const firestoreEvents = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        firestoreEvents.push({
          id: doc.id,
          ...data,
          // Add compatibility score (mock for now)
          compatibilityScore: Math.floor(Math.random() * (95 - 75 + 1)) + 75,
        });
      });

      // Combine Firestore events with mock events
      const allEvents = [...firestoreEvents, ...mockEvents];
      setEvents(allEvents);
      
      console.log(`✅ Loaded ${firestoreEvents.length} real events from Firestore`);
      console.log(`📦 Total events available: ${allEvents.length}`);
    } catch (error) {
      console.error('Error loading events:', error);
      // Fallback to mock data
      setEvents(mockEvents);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events
    .filter(event => selectedCategory === 'All' || event.category === selectedCategory)
    .sort((a, b) => {
      if (sortBy === 'compatibility') {
        return b.compatibilityScore - a.compatibilityScore;
      } else if (sortBy === 'price') {
        return a.price - b.price;
      } else {
        return new Date(a.date) - new Date(b.date);
      }
    });

  const handleEventPress = (event) => {
    navigation.navigate('EventDetail', { event });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading events...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Discover Events</Text>
        <Text style={styles.subtitle}>
          {filteredEvents.length} events available
        </Text>
      </View>

      {/* Categories */}
      <View style={styles.categoriesWrapper}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
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
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category && styles.categoryTextActive,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Sort Options */}
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <View style={styles.sortButtons}>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'date' && styles.sortButtonActive]}
            onPress={() => setSortBy('date')}
          >
            <Text style={[styles.sortText, sortBy === 'date' && styles.sortTextActive]}>
              Date
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'compatibility' && styles.sortButtonActive]}
            onPress={() => setSortBy('compatibility')}
          >
            <Text style={[styles.sortText, sortBy === 'compatibility' && styles.sortTextActive]}>
              Best Match
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'price' && styles.sortButtonActive]}
            onPress={() => setSortBy('price')}
          >
            <Text style={[styles.sortText, sortBy === 'price' && styles.sortTextActive]}>
              Price
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Events List */}
      <FlatList
        data={filteredEvents}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <EventCard event={item} onPress={() => handleEventPress(item)} />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyText}>No events found</Text>
            <Text style={styles.emptySubtext}>Try selecting a different category</Text>
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
  categoriesWrapper: {
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: 8,
  },
  categoriesContent: {
    paddingHorizontal: Sizes.padding,
    alignItems: 'center',
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    marginRight: 8,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
  },
  categoryText: {
    fontSize: Sizes.fontSize.small,
    color: Colors.text,
    fontWeight: '500',
    lineHeight: 20,
  },
  categoryTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Sizes.padding * 2,
    paddingVertical: 12,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sortLabel: {
    fontSize: Sizes.fontSize.small,
    color: Colors.textLight,
    marginRight: 12,
  },
  sortButtons: {
    flexDirection: 'row',
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    marginRight: 8,
    minHeight: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortButtonActive: {
    backgroundColor: Colors.primary,
  },
  sortText: {
    fontSize: Sizes.fontSize.small,
    color: Colors.text,
    lineHeight: 18,
  },
  sortTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  listContent: {
    padding: Sizes.padding * 2,
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
  },
});
