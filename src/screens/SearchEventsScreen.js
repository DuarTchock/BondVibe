import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

const QUICK_FILTERS = [
  { label: 'This Week', icon: '📅' },
  { label: 'Free Events', icon: '🎉' },
  { label: 'Near Me', icon: '📍' },
  { label: 'Popular', icon: '🔥' },
];

const CATEGORIES = [
  { name: 'Social', icon: '👥', color: '#FF3EA5' },
  { name: 'Sports', icon: '⚽', color: '#00F2FE' },
  { name: 'Food', icon: '🍕', color: '#A6FF96' },
  { name: 'Arts', icon: '🎨', color: '#8B5CF6' },
  { name: 'Learning', icon: '📚', color: '#F59E0B' },
  { name: 'Adventure', icon: '🏔️', color: '#EC4899' },
];

export default function SearchEventsScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState([]);

  const toggleFilter = (filter) => {
    if (selectedFilters.includes(filter)) {
      setSelectedFilters(selectedFilters.filter(f => f !== filter));
    } else {
      setSelectedFilters([...selectedFilters, filter]);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search events, people, places..."
              placeholderTextColor="#64748B"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={styles.clearIcon}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Quick Filters */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Filters</Text>
          <View style={styles.filtersGrid}>
            {QUICK_FILTERS.map((filter) => (
              <TouchableOpacity
                key={filter.label}
                style={styles.filterChip}
                onPress={() => toggleFilter(filter.label)}
                activeOpacity={0.8}
              >
                <View style={[
                  styles.filterGlass,
                  selectedFilters.includes(filter.label) && styles.filterGlassActive
                ]}>
                  <Text style={styles.filterIcon}>{filter.icon}</Text>
                  <Text style={[
                    styles.filterText,
                    selectedFilters.includes(filter.label) && styles.filterTextActive
                  ]}>
                    {filter.label}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Browse by Category</Text>
          <View style={styles.categoriesGrid}>
            {CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.name}
                style={styles.categoryCard}
                onPress={() => navigation.navigate('EventFeed')}
                activeOpacity={0.8}
              >
                <View style={styles.categoryGlass}>
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                  <Text style={styles.categoryName}>{category.name}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Searches */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent</Text>
            <TouchableOpacity>
              <Text style={styles.clearAllText}>Clear</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.recentList}>
            {['Coffee meetups', 'Basketball', 'Art gallery'].map((search, index) => (
              <TouchableOpacity
                key={index}
                style={styles.recentItem}
                onPress={() => setSearchQuery(search)}
              >
                <View style={styles.recentGlass}>
                  <Text style={styles.recentIcon}>🕐</Text>
                  <Text style={styles.recentText}>{search}</Text>
                  <Text style={styles.recentArrow}>↗</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Trending */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trending Now</Text>
          <View style={styles.trendingList}>
            {[
              { text: 'Summer BBQ', trend: '↗️ 45%' },
              { text: 'Yoga Sessions', trend: '↗️ 38%' },
              { text: 'Board Games', trend: '↗️ 29%' },
            ].map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.trendingItem}
                onPress={() => setSearchQuery(item.text)}
              >
                <View style={styles.trendingGlass}>
                  <Text style={styles.trendingRank}>#{index + 1}</Text>
                  <View style={styles.trendingContent}>
                    <Text style={styles.trendingText}>{item.text}</Text>
                    <Text style={styles.trendingTrend}>{item.trend}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 28,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(17, 24, 39, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 62, 165, 0.3)',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
  },
  searchIcon: {
    fontSize: 20,
    marginRight: 12,
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
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F1F5F9',
    paddingHorizontal: 24,
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  clearAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF3EA5',
  },
  filtersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    gap: 10,
  },
  filterChip: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  filterGlass: {
    backgroundColor: 'rgba(17, 24, 39, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterGlassActive: {
    backgroundColor: 'rgba(255, 62, 165, 0.2)',
    borderColor: 'rgba(255, 62, 165, 0.4)',
  },
  filterIcon: {
    fontSize: 16,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
  filterTextActive: {
    color: '#FF3EA5',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    gap: 12,
  },
  categoryCard: {
    width: '47%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  categoryGlass: {
    backgroundColor: 'rgba(17, 24, 39, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 20,
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 36,
    marginBottom: 10,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F1F5F9',
    letterSpacing: -0.1,
  },
  recentList: {
    paddingHorizontal: 24,
    gap: 10,
  },
  recentItem: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  recentGlass: {
    backgroundColor: 'rgba(17, 24, 39, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  recentIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  recentText: {
    flex: 1,
    fontSize: 15,
    color: '#F1F5F9',
    fontWeight: '500',
  },
  recentArrow: {
    fontSize: 16,
    color: '#64748B',
  },
  trendingList: {
    paddingHorizontal: 24,
    gap: 10,
  },
  trendingItem: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  trendingGlass: {
    backgroundColor: 'rgba(17, 24, 39, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendingRank: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF3EA5',
    marginRight: 14,
    width: 28,
  },
  trendingContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trendingText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F1F5F9',
  },
  trendingTrend: {
    fontSize: 13,
    fontWeight: '600',
    color: '#A6FF96',
  },
});
