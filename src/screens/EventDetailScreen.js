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
import { doc, updateDoc, arrayUnion, getDoc, increment } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { notifyUserJoinedEvent } from '../services/notifications';
import Colors from '../constants/Colors';
import Sizes from '../constants/Sizes';

export default function EventDetailScreen({ route, navigation }) {
  const { event } = route.params;
  const [currentEvent, setCurrentEvent] = useState(event);
  const [loading, setLoading] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [attendeeProfiles, setAttendeeProfiles] = useState([]);
  const [loadingAttendees, setLoadingAttendees] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [currentUserName, setCurrentUserName] = useState('');

  const isRealEvent = event.id && event.id.length > 10;

  useEffect(() => {
    checkIfJoined();
    checkIfHost();
    loadCurrentUserName();
    if (isRealEvent) {
      loadAttendees();
    }
  }, []);

  const loadCurrentUserName = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        setCurrentUserName(userDoc.data().fullName || 'User');
      }
    } catch (error) {
      console.error('Error loading user name:', error);
    }
  };

  const checkIfJoined = async () => {
    if (currentEvent.attendees) {
      const joined = currentEvent.attendees.some(
        (attendee) => attendee.userId === auth.currentUser.uid
      );
      setHasJoined(joined);
    }
  };

  const checkIfHost = () => {
    setIsHost(currentEvent.hostId === auth.currentUser.uid);
  };

  const loadAttendees = async () => {
    if (!currentEvent.attendees || currentEvent.attendees.length === 0) {
      return;
    }

    setLoadingAttendees(true);
    try {
      const profiles = [];
      
      for (const attendee of currentEvent.attendees) {
        const userDocRef = doc(db, 'users', attendee.userId);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          profiles.push({
            userId: attendee.userId,
            fullName: userData.fullName || 'User',
            avatar: userData.avatar || '👤',
            joinedAt: attendee.joinedAt,
          });
        }
      }
      
      setAttendeeProfiles(profiles);
      console.log(`✅ Loaded ${profiles.length} attendee profiles`);
    } catch (error) {
      console.error('Error loading attendees:', error);
    } finally {
      setLoadingAttendees(false);
    }
  };

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

  const handleJoinEvent = async () => {
    if (!isRealEvent) {
      console.log('❌ Cannot join mock event');
      return;
    }

    if (hasJoined) {
      return;
    }

    const spotsLeft = currentEvent.maxAttendees - currentEvent.currentAttendees;
    if (spotsLeft <= 0) {
      return;
    }

    setLoading(true);
    try {
      const eventRef = doc(db, 'events', currentEvent.id);
      
      await updateDoc(eventRef, {
        currentAttendees: increment(1),
        attendees: arrayUnion({
          userId: auth.currentUser.uid,
          joinedAt: new Date().toISOString(),
          status: 'confirmed',
        }),
        updatedAt: new Date().toISOString(),
      });

      const updatedEventDoc = await getDoc(eventRef);
      const updatedEventData = {
        id: updatedEventDoc.id,
        ...updatedEventDoc.data(),
      };
      
      setCurrentEvent(updatedEventData);
      setHasJoined(true);
      setShowConfirm(false);
      
      await loadAttendees();

      if (currentEvent.hostId !== auth.currentUser.uid) {
        await notifyUserJoinedEvent(
          currentEvent.hostId,
          currentEvent.id,
          currentUserName,
          currentEvent.title
        );
      }

      console.log('✅ Successfully joined event!');
    } catch (error) {
      console.error('Join event error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChat = () => {
    navigation.navigate('EventChat', {
      eventId: currentEvent.id,
      eventTitle: currentEvent.title,
    });
  };

  const spotsLeft = currentEvent.maxAttendees - currentEvent.currentAttendees;
  const canAccessChat = isRealEvent && (isHost || hasJoined);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <ScrollView>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.headerActions}>
            {canAccessChat && (
              <TouchableOpacity
                style={styles.chatIconButton}
                onPress={handleOpenChat}
              >
                <Text style={styles.chatIcon}>💬</Text>
              </TouchableOpacity>
            )}
            <View style={styles.compatibilityBadge}>
              <Text style={styles.compatibilityText}>
                {currentEvent.compatibilityScore}% Match
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          {!isRealEvent && (
            <View style={styles.mockNotice}>
              <Text style={styles.mockNoticeText}>
                📝 This is a demo event for preview purposes
              </Text>
            </View>
          )}

          {canAccessChat && (
            <TouchableOpacity 
              style={styles.chatPromoBanner}
              onPress={handleOpenChat}
            >
              <Text style={styles.chatPromoIcon}>💬</Text>
              <View style={styles.chatPromoContent}>
                <Text style={styles.chatPromoTitle}>Event Chat</Text>
                <Text style={styles.chatPromoText}>
                  Connect with other attendees
                </Text>
              </View>
              <Text style={styles.chatPromoArrow}>→</Text>
            </TouchableOpacity>
          )}

          <View style={styles.hostSection}>
            <Text style={styles.hostAvatar}>{currentEvent.hostAvatar}</Text>
            <View>
              <Text style={styles.category}>{currentEvent.category}</Text>
              <Text style={styles.hostName}>Hosted by {currentEvent.hostName}</Text>
              {currentEvent.hostType === 'official' && (
                <View style={styles.officialBadge}>
                  <Text style={styles.officialBadgeText}>🏆 OFFICIAL</Text>
                </View>
              )}
            </View>
          </View>

          <Text style={styles.title}>{currentEvent.title}</Text>
          <Text style={styles.description}>{currentEvent.description}</Text>

          <View style={styles.detailsSection}>
            <View style={styles.detailCard}>
              <Text style={styles.detailIcon}>📅</Text>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Date & Time</Text>
                <Text style={styles.detailValue}>{formatDate(currentEvent.date)}</Text>
              </View>
            </View>

            <View style={styles.detailCard}>
              <Text style={styles.detailIcon}>📍</Text>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Location</Text>
                <Text style={styles.detailValue}>{currentEvent.location}</Text>
              </View>
            </View>

            <View style={styles.detailCard}>
              <Text style={styles.detailIcon}>⏱️</Text>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Duration</Text>
                <Text style={styles.detailValue}>{currentEvent.duration}</Text>
              </View>
            </View>

            <View style={styles.detailCard}>
              <Text style={styles.detailIcon}>👥</Text>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Group Size</Text>
                <Text style={styles.detailValue}>
                  {currentEvent.currentAttendees}/{currentEvent.maxAttendees} people
                </Text>
              </View>
            </View>

            <View style={styles.detailCard}>
              <Text style={styles.detailIcon}>🗣️</Text>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Languages</Text>
                <Text style={styles.detailValue}>{currentEvent.language.join(', ')}</Text>
              </View>
            </View>
          </View>

          {isHost && isRealEvent && attendeeProfiles.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Attendees ({attendeeProfiles.length})
              </Text>
              {loadingAttendees ? (
                <ActivityIndicator color={Colors.primary} />
              ) : (
                attendeeProfiles.map((attendee, index) => (
                  <View key={index} style={styles.attendeeItem}>
                    <Text style={styles.attendeeAvatar}>{attendee.avatar}</Text>
                    <View style={styles.attendeeInfo}>
                      <Text style={styles.attendeeName}>{attendee.fullName}</Text>
                      <Text style={styles.attendeeDate}>
                        Joined {new Date(attendee.joinedAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {currentEvent.whatsIncluded && currentEvent.whatsIncluded.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>What's Included</Text>
              {currentEvent.whatsIncluded.map((item, index) => (
                <View key={index} style={styles.includedItem}>
                  <Text style={styles.includedIcon}>✓</Text>
                  <Text style={styles.includedText}>{item}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.priceSection}>
            <View>
              <Text style={styles.priceLabel}>Price per person</Text>
              {currentEvent.price === 0 ? (
                <Text style={styles.freePrice}>FREE</Text>
              ) : (
                <Text style={styles.price}>${currentEvent.price} MXN</Text>
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

      {showConfirm && (
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitle}>Join Event?</Text>
            <Text style={styles.confirmText}>
              You're about to join "{currentEvent.title}"
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowConfirm(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleJoinEvent}
              >
                <Text style={styles.confirmButtonText}>Join</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <View style={styles.footer}>
        {!isRealEvent ? (
          <View style={styles.mockButton}>
            <Text style={styles.mockButtonText}>📝 Demo Event - Join Not Available</Text>
          </View>
        ) : isHost ? (
          <View style={styles.hostButton}>
            <Text style={styles.hostButtonText}>👑 You're hosting this event</Text>
          </View>
        ) : hasJoined ? (
          <View style={styles.joinedButton}>
            <Text style={styles.joinedButtonText}>✓ Already Joined</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.joinButton,
              (spotsLeft === 0 || loading) && styles.joinButtonDisabled
            ]}
            onPress={() => setShowConfirm(true)}
            disabled={spotsLeft === 0 || loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.joinButtonText}>
                {spotsLeft === 0 ? 'Event Full' : 'Join This Event'}
              </Text>
            )}
          </TouchableOpacity>
        )}
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  chatIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatIcon: {
    fontSize: 20,
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
  mockNotice: {
    backgroundColor: '#FFF9E6',
    padding: 12,
    borderRadius: Sizes.borderRadius,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
  },
  mockNoticeText: {
    fontSize: Sizes.fontSize.small,
    color: Colors.text,
    textAlign: 'center',
  },
  chatPromoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: Sizes.borderRadius,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  chatPromoIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  chatPromoContent: {
    flex: 1,
  },
  chatPromoTitle: {
    fontSize: Sizes.fontSize.medium,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 2,
  },
  chatPromoText: {
    fontSize: Sizes.fontSize.small,
    color: Colors.text,
  },
  chatPromoArrow: {
    fontSize: 24,
    color: Colors.primary,
    marginLeft: 8,
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
    marginBottom: 4,
  },
  officialBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  officialBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
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
  attendeeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: Sizes.borderRadius,
    marginBottom: 8,
  },
  attendeeAvatar: {
    fontSize: 32,
    marginRight: 12,
  },
  attendeeInfo: {
    flex: 1,
  },
  attendeeName: {
    fontSize: Sizes.fontSize.medium,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  attendeeDate: {
    fontSize: Sizes.fontSize.small,
    color: Colors.textLight,
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
  confirmOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  confirmBox: {
    backgroundColor: Colors.background,
    padding: 24,
    borderRadius: Sizes.borderRadius,
    width: '90%',
    maxWidth: 400,
  },
  confirmTitle: {
    fontSize: Sizes.fontSize.large,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  confirmText: {
    fontSize: Sizes.fontSize.medium,
    color: Colors.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  confirmButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.border,
    padding: Sizes.padding,
    borderRadius: Sizes.borderRadius,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: Colors.text,
    fontSize: Sizes.fontSize.medium,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    padding: Sizes.padding,
    borderRadius: Sizes.borderRadius,
    marginLeft: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: Sizes.fontSize.medium,
    fontWeight: '600',
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
  joinedButton: {
    backgroundColor: Colors.success,
    padding: Sizes.padding + 4,
    borderRadius: Sizes.borderRadius,
    alignItems: 'center',
  },
  joinedButtonText: {
    color: '#FFFFFF',
    fontSize: Sizes.fontSize.large,
    fontWeight: '700',
  },
  hostButton: {
    backgroundColor: '#FFD700',
    padding: Sizes.padding + 4,
    borderRadius: Sizes.borderRadius,
    alignItems: 'center',
  },
  hostButtonText: {
    color: '#000',
    fontSize: Sizes.fontSize.large,
    fontWeight: '700',
  },
  mockButton: {
    backgroundColor: '#F0F0F0',
    padding: Sizes.padding + 4,
    borderRadius: Sizes.borderRadius,
    alignItems: 'center',
  },
  mockButtonText: {
    color: Colors.textLight,
    fontSize: Sizes.fontSize.medium,
    fontWeight: '600',
  },
});
