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
import { useTheme } from '../contexts/ThemeContext';
import { generateMockEvents } from '../utils/mockEvents';

export default function EventDetailScreen({ route, navigation }) {
  const { colors, isDark } = useTheme();
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
      // Try to load from Firestore first
      const eventDoc = await getDoc(doc(db, 'events', eventId));
      if (eventDoc.exists()) {
        const eventData = { id: eventDoc.id, ...eventDoc.data() };
        setEvent(eventData);
        setIsJoined(eventData.attendees?.includes(auth.currentUser.uid));
      } else {
        // If not found, check mock events
        const mockEvents = generateMockEvents();
        const mockEvent = mockEvents.find(e => e.id === eventId);
        if (mockEvent) {
          setEvent(mockEvent);
          setIsJoined(false);
        }
      }
    } catch (error) {
      console.error('Error loading event:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinLeave = async () => {
    if (!event) return;

    // Mock events can't be joined
    if (event.id.startsWith('mock')) {
      Alert.alert('Demo Event', 'This is a demo event. Create a real event to join!');
      return;
    }

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

  const styles = createStyles(colors);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>
          Event not found
        </Text>
      </View>
    );
  }

  const isCreator = event.creatorId === auth.currentUser.uid;
  const spotsLeft = event.maxAttendees - (event.attendees?.length || 0);
  const isFull = spotsLeft <= 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <View style={[styles.headerButton, {
            backgroundColor: colors.surfaceGlass,
            borderColor: colors.border
          }]}>
            <Text style={[styles.headerButtonText, { color: colors.text }]}>←</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          {isCreator && !event.id.startsWith('mock') && (
            <TouchableOpacity
              onPress={() => navigation.navigate('EditEvent', { eventId })}
            >
              <View style={[styles.headerButton, {
                backgroundColor: colors.surfaceGlass,
                borderColor: colors.border
              }]}>
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
              <View style={[styles.priceBadge, {
                backgroundColor: `${colors.secondary}26`,
                borderColor: `${colors.secondary}4D`
              }]}>
                <Text style={[styles.priceText, { color: colors.secondary }]}>
                  ${event.price}
                </Text>
              </View>
            )}
          </View>
          
          <Text style={[styles.title, { color: colors.text }]}>{event.title}</Text>
        </View>

        {/* Info Cards */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <View style={[styles.infoGlass, {
              backgroundColor: colors.surfaceGlass,
              borderColor: colors.border
            }]}>
              <Text style={styles.infoIcon}>📅</Text>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  Date & Time
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {event.date} at {event.time}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={[styles.infoGlass, {
              backgroundColor: colors.surfaceGlass,
              borderColor: colors.border
            }]}>
              <Text style={styles.infoIcon}>📍</Text>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  Location
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {event.location}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={[styles.infoGlass, {
              backgroundColor: colors.surfaceGlass,
              borderColor: colors.border
            }]}>
              <Text style={styles.infoIcon}>👥</Text>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  Attendees
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {event.attendees?.length || 0}/{event.maxAttendees}
                  {isFull ? ' (Full)' : ` (${spotsLeft} spots left)`}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.descriptionSection}>
          <View style={[styles.descriptionGlass, {
            backgroundColor: colors.surfaceGlass,
            borderColor: colors.border
          }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
            <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
              {event.description}
            </Text>
          </View>
        </View>

        {/* Attendees List */}
        {event.attendees && event.attendees.length > 0 && (
          <View style={styles.attendeesSection}>
            <View style={[styles.attendeesGlass, {
              backgroundColor: colors.surfaceGlass,
              borderColor: colors.border
            }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Who's Going</Text>
              <View style={styles.attendeesGrid}>
                {event.attendees.map((attendeeId, index) => (
                  <View key={index} style={styles.attendeeCard}>
                    <View style={[styles.attendeeAvatar, {
                      backgroundColor: `${colors.primary}26`,
                      borderColor: `${colors.primary}4D`
                    }]}>
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
          <View style={[styles.hostGlass, {
            backgroundColor: colors.surfaceGlass,
            borderColor: colors.border
          }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Hosted by</Text>
            <View style={styles.hostInfo}>
              <View style={[styles.hostAvatar, {
                backgroundColor: `${colors.primary}26`,
                borderColor: `${colors.primary}4D`
              }]}>
                <Text style={styles.hostEmoji}>🎸</Text>
              </View>
              <View style={styles.hostDetails}>
                <Text style={[styles.hostName, { color: colors.text }]}>Event Host</Text>
                <Text style={[styles.hostBio, { color: colors.textSecondary }]}>
                  Community Organizer
                </Text>
              </View>
              <TouchableOpacity style={styles.messageButton}>
                <View style={[styles.messageButtonGlass, {
                  backgroundColor: `${colors.primary}26`,
                  borderColor: `${colors.primary}4D`
                }]}>
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
          <View style={[styles.bottomGlass, {
            backgroundColor: isDark ? 'rgba(11, 15, 26, 0.95)' : 'rgba(250, 250, 252, 0.95)',
            borderTopColor: colors.border
          }]}>
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
                {
                  backgroundColor: isJoined ? colors.surfaceGlass : `${colors.primary}33`,
                  borderColor: isJoined ? colors.border : `${colors.primary}66`
                }
              ]}>
                <Text style={[
                  styles.actionButtonText,
                  { color: isJoined ? colors.text : colors.primary }
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

function createStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorText: {
      fontSize: 16,
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
      borderWidth: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerButtonText: {
      fontSize: 20,
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
      paddingVertical: 6,
      paddingHorizontal: 14,
      borderRadius: 10,
      borderWidth: 1,
    },
    categoryText: {
      fontSize: 12,
      fontWeight: '600',
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
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 10,
      borderWidth: 1,
    },
    priceText: {
      fontSize: 14,
      fontWeight: '700',
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
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
      borderWidth: 1,
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
      marginBottom: 4,
      letterSpacing: 0.3,
    },
    infoValue: {
      fontSize: 15,
      fontWeight: '600',
      letterSpacing: -0.2,
    },
    descriptionSection: {
      marginBottom: 24,
      borderRadius: 16,
      overflow: 'hidden',
    },
    descriptionGlass: {
      borderWidth: 1,
      padding: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 14,
      letterSpacing: -0.2,
    },
    descriptionText: {
      fontSize: 15,
      lineHeight: 24,
    },
    attendeesSection: {
      marginBottom: 24,
      borderRadius: 16,
      overflow: 'hidden',
    },
    attendeesGlass: {
      borderWidth: 1,
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
      borderWidth: 2,
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
      borderWidth: 1,
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
      borderWidth: 2,
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
      marginBottom: 4,
      letterSpacing: -0.2,
    },
    hostBio: {
      fontSize: 13,
    },
    messageButton: {
      borderRadius: 12,
      overflow: 'hidden',
    },
    messageButtonGlass: {
      width: 44,
      height: 44,
      borderWidth: 1,
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
      borderTopWidth: 1,
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
      borderWidth: 1,
      paddingVertical: 16,
      alignItems: 'center',
    },
    actionButtonText: {
      fontSize: 17,
      fontWeight: '700',
      letterSpacing: -0.2,
    },
  });
}
