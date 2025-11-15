import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Colors from '../constants/Colors';
import Sizes from '../constants/Sizes';

export default function EventDetailScreen({ route, navigation }) {
  const { event } = route.params;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleJoinEvent = () => {
    Alert.alert(
      'Join Event',
      `You're about to join "${event.title}". Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Join',
          onPress: () => {
            Alert.alert('Success!', 'You have joined this event. Check your email for details.');
            // TODO: Implement actual join logic with Firestore
          },
        },
      ]
    );
  };

  const spotsLeft = event.maxAttendees - event.currentAttendees;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.compatibilityBadge}>
            <Text style={styles.compatibilityText}>
              {event.compatibilityScore}% Match
            </Text>
          </View>
        </View>

        {/* Event Info */}
        <View style={styles.content}>
          <View style={styles.hostSection}>
            <Text style={styles.hostAvatar}>{event.hostAvatar}</Text>
            <View>
              <Text style={styles.category}>{event.category}</Text>
              <Text style={styles.hostName}>Hosted by {event.hostName}</Text>
            </View>
          </View>

          <Text style={styles.title}>{event.title}</Text>
          <Text style={styles.description}>{event.description}</Text>

          {/* Details */}
          <View style={styles.detailsSection}>
            <View style={styles.detailCard}>
              <Text style={styles.detailIcon}>📅</Text>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Date & Time</Text>
                <Text style={styles.detailValue}>{formatDate(event.date)}</Text>
              </View>
            </View>

            <View style={styles.detailCard}>
              <Text style={styles.detailIcon}>📍</Text>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Location</Text>
                <Text style={styles.detailValue}>{event.location}</Text>
              </View>
            </View>

            <View style={styles.detailCard}>
              <Text style={styles.detailIcon}>⏱️</Text>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Duration</Text>
                <Text style={styles.detailValue}>{event.duration}</Text>
              </View>
            </View>

            <View style={styles.detailCard}>
              <Text style={styles.detailIcon}>👥</Text>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Group Size</Text>
                <Text style={styles.detailValue}>
                  {event.currentAttendees}/{event.maxAttendees} people
                </Text>
              </View>
            </View>

            <View style={styles.detailCard}>
              <Text style={styles.detailIcon}>🗣️</Text>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Languages</Text>
                <Text style={styles.detailValue}>{event.language.join(', ')}</Text>
              </View>
            </View>
          </View>

          {/* What's Included */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What's Included</Text>
            {event.whatsIncluded.map((item, index) => (
              <View key={index} style={styles.includedItem}>
                <Text style={styles.includedIcon}>✓</Text>
                <Text style={styles.includedText}>{item}</Text>
              </View>
            ))}
          </View>

          {/* Price */}
          <View style={styles.priceSection}>
            <View>
              <Text style={styles.priceLabel}>Price per person</Text>
              {event.price === 0 ? (
                <Text style={styles.freePrice}>FREE</Text>
              ) : (
                <Text style={styles.price}>${event.price} MXN</Text>
              )}
            </View>
            <View>
              <Text style={styles.spotsLabel}>
                {spotsLeft} {spotsLeft === 1 ? 'spot' : 'spots'} left
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Join Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.joinButton, spotsLeft === 0 && styles.joinButtonDisabled]}
          onPress={handleJoinEvent}
          disabled={spotsLeft === 0}
        >
          <Text style={styles.joinButtonText}>
            {spotsLeft === 0 ? 'Event Full' : 'Join This Event'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Sizes.padding * 2,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: Sizes.fontSize.medium,
    color: Colors.primary,
    fontWeight: '600',
  },
  compatibilityBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  compatibilityText: {
    fontSize: Sizes.fontSize.small,
    fontWeight: '700',
    color: Colors.success,
  },
  content: {
    padding: Sizes.padding * 2,
  },
  hostSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  hostAvatar: {
    fontSize: 48,
    marginRight: 16,
  },
  category: {
    fontSize: Sizes.fontSize.small,
    color: Colors.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  hostName: {
    fontSize: Sizes.fontSize.medium,
    color: Colors.text,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
    lineHeight: 36,
  },
  description: {
    fontSize: Sizes.fontSize.medium,
    color: Colors.text,
    lineHeight: 24,
    marginBottom: 24,
  },
  detailsSection: {
    marginBottom: 24,
  },
  detailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: Sizes.borderRadius,
    marginBottom: 12,
  },
  detailIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: Sizes.fontSize.small,
    color: Colors.textLight,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: Sizes.fontSize.medium,
    color: Colors.text,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: Sizes.fontSize.large,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  includedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  includedIcon: {
    fontSize: 16,
    color: Colors.success,
    marginRight: 12,
    fontWeight: 'bold',
  },
  includedText: {
    fontSize: Sizes.fontSize.medium,
    color: Colors.text,
  },
  priceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: Sizes.borderRadius,
    marginBottom: 24,
  },
  priceLabel: {
    fontSize: Sizes.fontSize.small,
    color: Colors.textLight,
    marginBottom: 4,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  freePrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.success,
  },
  spotsLabel: {
    fontSize: Sizes.fontSize.small,
    color: Colors.textLight,
  },
  footer: {
    padding: Sizes.padding * 2,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  joinButton: {
    backgroundColor: Colors.primary,
    padding: Sizes.padding + 4,
    borderRadius: Sizes.borderRadius,
    alignItems: 'center',
  },
  joinButtonDisabled: {
    backgroundColor: Colors.border,
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: Sizes.fontSize.large,
    fontWeight: '700',
  },
});
