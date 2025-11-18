import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db, auth } from '../services/firebase';

export default function EventDetailScreen({ route, navigation }) {
  const { eventId } = route.params;
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isJoined, setIsJoined] = useState(false);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    loadEvent();
  }, []);

  const loadEvent = async () => {
    try {
      const eventDoc = await getDoc(doc(db, 'events', eventId));
      if (eventDoc.exists()) {
        const eventData = { id: eventDoc.id, ...eventDoc.data() };
        setEvent(eventData);
        setIsJoined(eventData.attendees?.includes(auth.currentUser.uid));
      }
    } catch (error) {
      console.error('Error loading event:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinLeave = async () => {
    if (!event) return;

    setJoining(true);
    try {
      const eventRef = doc(db, 'events', eventId);
      
      if (isJoined) {
        await updateDoc(eventRef, {
          attendees: arrayRemove(auth.currentUser.uid)
        });
        setIsJoined(false);
        Alert.alert('Left Event', 'You have left this event');
      } else {
        if (event.attendees?.length >= event.maxAttendees) {
          Alert.alert('Event Full', 'This event has reached maximum capacity');
          return;
        }
        
        await updateDoc(eventRef, {
          attendees: arrayUnion(auth.currentUser.uid)
        });
        setIsJoined(true);
        Alert.alert('Joined!', 'You have joined this event');
      }
      
      await loadEvent();
    } catch (error) {
      console.error('Error joining/leaving event:', error);
      Alert.alert('Error', 'Could not update event');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF3EA5" />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Event not found</Text>
      </View>
    );
  }

  const isCreator = event.creatorId === auth.currentUser.uid;
  const spotsLeft = event.maxAttendees - (event.attendees?.length || 0);
  const isFull = spotsLeft <= 0;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <View style={styles.headerButton}>
            <Text style={styles.headerButtonText}>←</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          {isCreator && (
            <TouchableOpacity
              onPress={() => navigation.navigate('EditEvent', { eventId })}
            >
              <View style={styles.headerButton}>
                <Text style={styles.headerButtonText}>✏️</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.categoryRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{event.category}</Text>
            </View>
            {event.price === 0 ? (
              <View style={styles.freeBadge}>
                <Text style={styles.freeBadgeText}>FREE</Text>
              </View>
            ) : (
              <View style={styles.priceBadge}>
                <Text style={styles.priceText}>${event.price}</Text>
              </View>
            )}
          </View>
          
          <Text style={styles.title}>{event.title}</Text>
        </View>

        {/* Info Cards */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <View style={styles.infoGlass}>
              <Text style={styles.infoIcon}>📅</Text>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Date & Time</Text>
                <Text style={styles.infoValue}>{event.date} at {event.time}</Text>
              </View>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoGlass}>
              <Text style={styles.infoIcon}>📍</Text>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Location</Text>
                <Text style={styles.infoValue}>{event.location}</Text>
              </View>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoGlass}>
              <Text style={styles.infoIcon}>👥</Text>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Attendees</Text>
                <Text style={styles.infoValue}>
                  {event.attendees?.length || 0}/{event.maxAttendees}
                  {isFull ? ' (Full)' : ` (${spotsLeft} spots left)`}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.descriptionSection}>
          <View style={styles.descriptionGlass}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.descriptionText}>{event.description}</Text>
          </View>
        </View>

        {/* Attendees List */}
        {event.attendees && event.attendees.length > 0 && (
          <View style={styles.attendeesSection}>
            <View style={styles.attendeesGlass}>
              <Text style={styles.sectionTitle}>Who's Going</Text>
              <View style={styles.attendeesGrid}>
                {event.attendees.map((attendeeId, index) => (
                  <View key={index} style={styles.attendeeCard}>
                    <View style={styles.attendeeAvatar}>
                      <Text style={styles.attendeeEmoji}>😊</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Host Info */}
        <View style={styles.hostSection}>
          <View style={styles.hostGlass}>
            <Text style={styles.sectionTitle}>Hosted by</Text>
            <View style={styles.hostInfo}>
              <View style={styles.hostAvatar}>
                <Text style={styles.hostEmoji}>🎸</Text>
              </View>
              <View style={styles.hostDetails}>
                <Text style={styles.hostName}>Event Host</Text>
                <Text style={styles.hostBio}>Community Organizer</Text>
              </View>
              <TouchableOpacity style={styles.messageButton}>
                <View style={styles.messageButtonGlass}>
                  <Text style={styles.messageButtonText}>💬</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action */}
      {!isCreator && (
        <View style={styles.bottomAction}>
          <View style={styles.bottomGlass}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                (isFull && !isJoined) && styles.actionButtonDisabled
              ]}
              onPress={handleJoinLeave}
              disabled={joining || (isFull && !isJoined)}
            >
              <View style={[
                styles.actionButtonGlass,
                isJoined && styles.actionButtonJoinedGlass
              ]}>
                <Text style={[
                  styles.actionButtonText,
                  isJoined && styles.actionButtonJoinedText
                ]}>
                  {joining ? 'Loading...' : isJoined ? 'Leave Event' : isFull ? 'Event Full' : 'Join Event'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F1A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0B0F1A',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0B0F1A',
  },
  errorText: {
    fontSize: 16,
    color: '#94A3B8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(17, 24, 39, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtonText: {
    fontSize: 20,
    color: '#F1F5F9',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  heroSection: {
    marginBottom: 24,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  categoryBadge: {
    backgroundColor: 'rgba(255, 62, 165, 0.15)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 62, 165, 0.3)',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF3EA5',
    letterSpacing: 0.3,
  },
  freeBadge: {
    backgroundColor: 'rgba(166, 255, 150, 0.15)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(166, 255, 150, 0.3)',
  },
  freeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A6FF96',
    letterSpacing: 0.5,
  },
  priceBadge: {
    backgroundColor: 'rgba(0, 242, 254, 0.15)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.3)',
  },
  priceText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#00F2FE',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F1F5F9',
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  infoSection: {
    gap: 12,
    marginBottom: 24,
  },
  infoCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  infoGlass: {
    backgroundColor: 'rgba(17, 24, 39, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    fontSize: 28,
    marginRight: 14,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F1F5F9',
    letterSpacing: -0.2,
  },
  descriptionSection: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  descriptionGlass: {
    backgroundColor: 'rgba(17, 24, 39, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F1F5F9',
    marginBottom: 14,
    letterSpacing: -0.2,
  },
  descriptionText: {
    fontSize: 15,
    color: '#94A3B8',
    lineHeight: 24,
  },
  attendeesSection: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  attendeesGlass: {
    backgroundColor: 'rgba(17, 24, 39, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 20,
  },
  attendeesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  attendeeCard: {
    width: 56,
    alignItems: 'center',
  },
  attendeeAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 62, 165, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(255, 62, 165, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  attendeeEmoji: {
    fontSize: 28,
  },
  hostSection: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  hostGlass: {
    backgroundColor: 'rgba(17, 24, 39, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 20,
  },
  hostInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hostAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 62, 165, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(255, 62, 165, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  hostEmoji: {
    fontSize: 28,
  },
  hostDetails: {
    flex: 1,
  },
  hostName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F1F5F9',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  hostBio: {
    fontSize: 13,
    color: '#94A3B8',
  },
  messageButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  messageButtonGlass: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(255, 62, 165, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 62, 165, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageButtonText: {
    fontSize: 20,
  },
  bottomAction: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 40,
  },
  bottomGlass: {
    backgroundColor: 'rgba(11, 15, 26, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    padding: 24,
  },
  actionButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonGlass: {
    backgroundColor: 'rgba(255, 62, 165, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 62, 165, 0.4)',
    paddingVertical: 16,
    alignItems: 'center',
  },
  actionButtonJoinedGlass: {
    backgroundColor: 'rgba(17, 24, 39, 0.6)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  actionButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FF3EA5',
    letterSpacing: -0.2,
  },
  actionButtonJoinedText: {
    color: '#F1F5F9',
  },
});
