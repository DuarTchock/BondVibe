import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db, auth } from "../services/firebase";
import { useTheme } from "../contexts/ThemeContext";
import { createNotification } from "../utils/notificationService";
import { pesosTocentavos } from "../services/stripeService";
import CancelEventModal from "../components/CancelEventModal";
import { getFunctions, httpsCallable } from "firebase/functions";

export default function EventDetailScreen({ route, navigation }) {
  const { colors, isDark } = useTheme();
  const { eventId } = route.params;
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isJoined, setIsJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [attendeesData, setAttendeesData] = useState([]);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const calculateDaysUntilEvent = (eventDate) => {
    const now = new Date();
    const eventDateTime = new Date(eventDate);
    const hoursUntil = (eventDateTime - now) / (1000 * 60 * 60);
    return hoursUntil / 24;
  };

  const getRefundPercentage = (daysUntil) => {
    if (daysUntil >= 7) return 100;
    if (daysUntil >= 3) return 50;
    return 0;
  };

  useEffect(() => {
    loadCurrentUser();
    loadEvent();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
      if (userDoc.exists()) {
        setCurrentUser(userDoc.data());
      }
    } catch (error) {
      console.error("Error loading current user:", error);
    }
  };

  const loadEvent = async () => {
    try {
      const eventDoc = await getDoc(doc(db, "events", eventId));
      if (eventDoc.exists()) {
        const eventData = { id: eventDoc.id, ...eventDoc.data() };
        setEvent(eventData);
        setIsJoined(eventData.attendees?.includes(auth.currentUser.uid));

        // Load attendees data if creator or admin
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        const userData = userDoc.data();
        if (
          eventData.creatorId === auth.currentUser.uid ||
          userData?.role === "admin"
        ) {
          await loadAttendeesData(eventData.attendees || []);
        }
      } else {
        // ✅ Event not found - no mock fallback
        console.log("❌ Event not found:", eventId);
        setEvent(null);
      }
    } catch (error) {
      console.error("Error loading event:", error);
      setEvent(null);
    } finally {
      setLoading(false);
    }
  };

  const loadAttendeesData = async (attendeeIds) => {
    try {
      const validIds = (attendeeIds || []).filter(
        (id) => typeof id === "string" && id.trim().length > 0
      );

      if (validIds.length === 0) {
        console.log("No valid attendee IDs to load");
        return;
      }

      const attendeesPromises = validIds.map(async (userId) => {
        try {
          const userDoc = await getDoc(doc(db, "users", userId));
          return userDoc.exists() ? { id: userId, ...userDoc.data() } : null;
        } catch (error) {
          console.error(`Error loading user ${userId}:`, error);
          return null;
        }
      });

      const attendees = await Promise.all(attendeesPromises);
      setAttendeesData(attendees.filter((a) => a !== null));
    } catch (error) {
      console.error("Error loading attendees:", error);
    }
  };

  const handleJoinLeave = async () => {
    if (!event) return;

    // If leaving, handle normally
    if (isJoined) {
      setJoining(true);
      try {
        const eventRef = doc(db, "events", eventId);
        await updateDoc(eventRef, {
          attendees: arrayRemove(auth.currentUser.uid),
        });
        setIsJoined(false);
        Alert.alert("Left Event", "You have left this event");
        await loadEvent();
      } catch (error) {
        console.error("Error leaving event:", error);
        Alert.alert("Error", "Could not leave event");
      } finally {
        setJoining(false);
      }
      return;
    }

    // Check capacity
    const maxCapacity = event.maxAttendees || event.maxPeople || 0;
    const currentCount = event.attendees?.length || 0;

    if (currentCount >= maxCapacity) {
      Alert.alert("Event Full", "This event has reached maximum capacity");
      return;
    }

    // If event has price, navigate to Checkout
    if (event.price && event.price > 0) {
      const amountInCentavos = pesosTocentavos(event.price);
      navigation.navigate("Checkout", {
        eventId: event.id,
        eventTitle: event.title,
        amount: amountInCentavos,
      });
      return;
    }

    // Free event - join directly
    setJoining(true);
    try {
      const eventRef = doc(db, "events", eventId);
      await updateDoc(eventRef, {
        attendees: arrayUnion(auth.currentUser.uid),
      });
      setIsJoined(true);

      if (event.creatorId && event.creatorId !== auth.currentUser.uid) {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        const userName = userDoc.data()?.fullName || "Someone";

        console.log("📬 Creating notification for:", event.creatorId);
        await createNotification(event.creatorId, {
          type: "event_joined",
          title: "New attendee!",
          message: `${userName} joined your "${event.title}" event`,
          icon: "👋",
          metadata: { eventId: event.id, eventTitle: event.title },
        });
      }

      Alert.alert("Joined!", "You have joined this event");
      await loadEvent();
    } catch (error) {
      console.error("Error joining event:", error);
      Alert.alert("Error", "Could not join event");
    } finally {
      setJoining(false);
    }
  };

  const handleCancelEvent = () => {
    setShowCancelModal(true);
  };

  const handleCancelAttendance = async () => {
    if (!event || !isJoined) return;

    const daysUntil = calculateDaysUntilEvent(event.date);
    const refundPercentage = getRefundPercentage(daysUntil);

    let refundText = "";
    if (event.price && event.price > 0) {
      if (refundPercentage === 100) {
        refundText = `You will receive a 100% refund ($${event.price} MXN)`;
      } else if (refundPercentage === 50) {
        refundText = `You will receive a 50% refund ($${
          event.price * 0.5
        } MXN)`;
      } else {
        refundText = "No refund available (less than 3 days until event)";
      }
    } else {
      refundText = "You will be removed from this free event";
    }

    Alert.alert(
      "Cancel Your Attendance?",
      `${refundText}\n\nAre you sure you want to cancel?`,
      [
        { text: "Keep My Spot", style: "cancel" },
        {
          text: "Cancel Attendance",
          style: "destructive",
          onPress: async () => {
            setJoining(true);
            try {
              const functions = getFunctions();
              const cancelAttendance = httpsCallable(
                functions,
                "cancelEventAttendance"
              );

              const result = await cancelAttendance({ eventId: event.id });

              if (result.data.success) {
                setIsJoined(false);
                Alert.alert(
                  "Attendance Cancelled",
                  result.data.message || "You have been removed from the event"
                );
                await loadEvent();
              } else {
                Alert.alert(
                  "Error",
                  result.data.message || "Could not cancel attendance"
                );
              }
            } catch (error) {
              console.error("Error cancelling attendance:", error);
              Alert.alert(
                "Error",
                "Failed to cancel attendance. Please try again."
              );
            } finally {
              setJoining(false);
            }
          },
        },
      ]
    );
  };

  const performCancellation = async (cancellationReason) => {
    try {
      setShowCancelModal(false);
      setLoading(true);

      const eventRef = doc(db, "events", eventId);
      await updateDoc(eventRef, {
        status: "cancelled",
        cancelledAt: new Date().toISOString(),
        cancellationReason: cancellationReason,
      });

      const allParticipants = [
        ...(event.participants || []),
        ...(event.attendees || []),
      ];
      const uniqueParticipants = [...new Set(allParticipants)];

      console.log(
        "📤 Sending notifications to:",
        uniqueParticipants.length,
        "participants"
      );

      const reason =
        cancellationReason !== "No reason provided"
          ? `Reason: ${cancellationReason}`
          : "No reason provided.";

      for (const participantId of uniqueParticipants) {
        if (participantId !== auth.currentUser.uid) {
          try {
            await createNotification(participantId, {
              type: "event_cancelled",
              title: "Event Cancelled",
              message: `"${event.title}" has been cancelled. ${reason}`,
              icon: "🚫",
              metadata: {
                eventId: event.id,
                eventTitle: event.title,
                reason: cancellationReason,
              },
            });
            console.log("✅ Notification sent to:", participantId);
          } catch (notifError) {
            console.error(
              "❌ Failed to send notification to:",
              participantId,
              notifError
            );
          }
        }
      }

      console.log("✅ Event cancelled successfully");
      setLoading(false);
      navigation.navigate("Home");
    } catch (error) {
      console.error("Error cancelling event:", error);
      setLoading(false);
      Alert.alert("Error", "Failed to cancel event. Please try again.");
    }
  };

  const styles = createStyles(colors);

  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!event) {
    return (
      <View
        style={[styles.errorContainer, { backgroundColor: colors.background }]}
      >
        <Text style={styles.errorEmoji}>😕</Text>
        <Text style={[styles.errorTitle, { color: colors.text }]}>
          Event Not Found
        </Text>
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>
          This event may have been deleted or cancelled
        </Text>
        <TouchableOpacity
          style={styles.errorButton}
          onPress={() => navigation.goBack()}
        >
          <View
            style={[
              styles.errorButtonGlass,
              {
                backgroundColor: `${colors.primary}33`,
                borderColor: `${colors.primary}66`,
              },
            ]}
          >
            <Text style={[styles.errorButtonText, { color: colors.primary }]}>
              Go Back
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  const isCreator = event.creatorId === auth.currentUser.uid;
  const isAdmin = currentUser?.role === "admin";
  const canSeeAttendees = isCreator || isAdmin;

  const maxCapacity = event.maxAttendees || event.maxPeople || 0;
  const currentAttendees =
    event.attendees?.length || event.participants?.length || 0;
  const spotsLeft = maxCapacity - currentAttendees;
  const isFull = spotsLeft <= 0;

  const getButtonText = () => {
    if (joining) return "Loading...";
    if (isJoined) return "Leave Event";
    if (isFull) return "Event Full";
    if (event.price && event.price > 0) return `Pay $${event.price} MXN`;
    return "Join Event (Free)";
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <View
            style={[
              styles.headerButton,
              {
                backgroundColor: colors.surfaceGlass,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.headerButtonText, { color: colors.text }]}>
              ←
            </Text>
          </View>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          {(isJoined || isCreator) && (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("EventChat", {
                  eventId: event.id,
                  eventTitle: event.title,
                })
              }
            >
              <View
                style={[
                  styles.headerButton,
                  {
                    backgroundColor: colors.surfaceGlass,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={styles.headerButtonText}>💬</Text>
              </View>
            </TouchableOpacity>
          )}
          {isCreator && (
            <TouchableOpacity
              onPress={() => navigation.navigate("EditEvent", { eventId })}
            >
              <View
                style={[
                  styles.headerButton,
                  {
                    backgroundColor: colors.surfaceGlass,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={styles.headerButtonText}>✏️</Text>
              </View>
            </TouchableOpacity>
          )}
          {(isCreator || isAdmin) && event.status !== "cancelled" && (
            <TouchableOpacity onPress={handleCancelEvent}>
              <View
                style={[
                  styles.headerButton,
                  {
                    backgroundColor: `${colors.error}20`,
                    borderColor: colors.error,
                  },
                ]}
              >
                <Text
                  style={[styles.headerButtonText, { color: colors.error }]}
                >
                  🚫
                </Text>
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
            <View
              style={[
                styles.categoryBadge,
                {
                  backgroundColor: `${colors.primary}26`,
                  borderColor: `${colors.primary}4D`,
                },
              ]}
            >
              <Text style={[styles.categoryText, { color: colors.primary }]}>
                {event.category}
              </Text>
            </View>
            {event.price === 0 ? (
              <View style={styles.freeBadge}>
                <Text style={styles.freeBadgeText}>FREE</Text>
              </View>
            ) : (
              <View
                style={[
                  styles.priceBadge,
                  {
                    backgroundColor: `${colors.secondary}26`,
                    borderColor: `${colors.secondary}4D`,
                  },
                ]}
              >
                <Text style={[styles.priceText, { color: colors.secondary }]}>
                  ${event.price}
                </Text>
              </View>
            )}
          </View>

          <Text style={[styles.title, { color: colors.text }]}>
            {event.title}
          </Text>
          {event.status === "cancelled" && (
            <View
              style={[
                styles.cancelledBadge,
                {
                  backgroundColor: `${colors.error}20`,
                  borderColor: colors.error,
                },
              ]}
            >
              <Text style={[styles.cancelledText, { color: colors.error }]}>
                🚫 Event Cancelled
              </Text>
            </View>
          )}
        </View>

        {/* Info Cards */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <View
              style={[
                styles.infoGlass,
                {
                  backgroundColor: colors.surfaceGlass,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={styles.infoIcon}>📅</Text>
              <View style={styles.infoContent}>
                <Text
                  style={[styles.infoLabel, { color: colors.textSecondary }]}
                >
                  Date & Time
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {event.date
                    ? (() => {
                        const eventDate = new Date(event.date);
                        const dateStr = eventDate.toLocaleDateString("en-US", {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        });
                        const timeStr =
                          event.time ||
                          eventDate.toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          });
                        return `${dateStr} at ${timeStr}`;
                      })()
                    : "Date TBD"}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View
              style={[
                styles.infoGlass,
                {
                  backgroundColor: colors.surfaceGlass,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={styles.infoIcon}>📍</Text>
              <View style={styles.infoContent}>
                <Text
                  style={[styles.infoLabel, { color: colors.textSecondary }]}
                >
                  Location
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {event.location}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View
              style={[
                styles.infoGlass,
                {
                  backgroundColor: colors.surfaceGlass,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={styles.infoIcon}>👥</Text>
              <View style={styles.infoContent}>
                <Text
                  style={[styles.infoLabel, { color: colors.textSecondary }]}
                >
                  Attendees
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {currentAttendees}/{maxCapacity}
                  {isFull ? " (Full)" : ` (${spotsLeft} spots left)`}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Group Chat Button */}
        {(isJoined || isCreator) && (
          <View style={styles.chatSection}>
            <TouchableOpacity
              style={styles.chatButton}
              onPress={() =>
                navigation.navigate("EventChat", {
                  eventId: event.id,
                  eventTitle: event.title,
                })
              }
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.chatGlass,
                  {
                    backgroundColor: `${colors.primary}1A`,
                    borderColor: `${colors.primary}33`,
                  },
                ]}
              >
                <Text style={styles.chatIcon}>💬</Text>
                <View style={styles.chatContent}>
                  <Text style={[styles.chatTitle, { color: colors.primary }]}>
                    Group Chat
                  </Text>
                  <Text
                    style={[
                      styles.chatSubtitle,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Connect with other attendees
                  </Text>
                </View>
                <Text style={[styles.chatArrow, { color: colors.primary }]}>
                  →
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Description */}
        <View style={styles.descriptionSection}>
          <View
            style={[
              styles.descriptionGlass,
              {
                backgroundColor: colors.surfaceGlass,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              About
            </Text>
            <Text
              style={[styles.descriptionText, { color: colors.textSecondary }]}
            >
              {event.description}
            </Text>
          </View>
        </View>

        {/* Cancellation Policy */}
        {event.price && event.price > 0 && (
          <View style={styles.policySection}>
            <View
              style={[
                styles.policyGlass,
                {
                  backgroundColor: colors.surfaceGlass,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                📋 Cancellation Policy
              </Text>
              <View style={styles.policyItem}>
                <Text style={[styles.policyDot, { color: colors.primary }]}>
                  •
                </Text>
                <Text
                  style={[styles.policyText, { color: colors.textSecondary }]}
                >
                  7+ days before: 100% refund
                </Text>
              </View>
              <View style={styles.policyItem}>
                <Text style={[styles.policyDot, { color: colors.primary }]}>
                  •
                </Text>
                <Text
                  style={[styles.policyText, { color: colors.textSecondary }]}
                >
                  3-7 days before: 50% refund
                </Text>
              </View>
              <View style={styles.policyItem}>
                <Text style={[styles.policyDot, { color: colors.primary }]}>
                  •
                </Text>
                <Text
                  style={[styles.policyText, { color: colors.textSecondary }]}
                >
                  Less than 3 days: No refund
                </Text>
              </View>
              <View
                style={[
                  styles.policyDivider,
                  { backgroundColor: colors.border },
                ]}
              />
              <View style={styles.policyItem}>
                <Text style={[styles.policyDot, { color: colors.secondary }]}>
                  •
                </Text>
                <Text
                  style={[styles.policyText, { color: colors.textSecondary }]}
                >
                  If host cancels: Always 100% refund
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Attendees List */}
        {canSeeAttendees && attendeesData.length > 0 && (
          <View style={styles.attendeesSection}>
            <View
              style={[
                styles.attendeesGlass,
                {
                  backgroundColor: colors.surfaceGlass,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Attendees ({attendeesData.length})
              </Text>
              {attendeesData.map((attendee, index) => (
                <View key={index} style={styles.attendeeRow}>
                  <View
                    style={[
                      styles.attendeeAvatar,
                      {
                        backgroundColor: `${colors.primary}26`,
                        borderColor: `${colors.primary}4D`,
                      },
                    ]}
                  >
                    <Text style={styles.attendeeEmoji}>
                      {attendee.avatar || "😊"}
                    </Text>
                  </View>
                  <Text style={[styles.attendeeName, { color: colors.text }]}>
                    {attendee.fullName || attendee.name || "Anonymous"}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Action */}
      {!isCreator && (
        <View style={styles.bottomAction}>
          <View
            style={[
              styles.bottomGlass,
              {
                backgroundColor: isDark
                  ? "rgba(11, 15, 26, 0.95)"
                  : "rgba(250, 250, 252, 0.95)",
                borderTopColor: colors.border,
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.actionButton,
                isFull && !isJoined && styles.actionButtonDisabled,
              ]}
              onPress={handleJoinLeave}
              disabled={joining || (isFull && !isJoined)}
            >
              <View
                style={[
                  styles.actionButtonGlass,
                  {
                    backgroundColor: isJoined
                      ? colors.surfaceGlass
                      : event.price && event.price > 0
                      ? colors.primary
                      : `${colors.primary}33`,
                    borderColor: isJoined
                      ? colors.border
                      : event.price && event.price > 0
                      ? colors.primary
                      : `${colors.primary}66`,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.actionButtonText,
                    {
                      color:
                        event.price && event.price > 0 && !isJoined
                          ? "#FFFFFF"
                          : isJoined
                          ? colors.text
                          : colors.primary,
                    },
                  ]}
                >
                  {getButtonText()}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Cancel Event Modal */}
      <CancelEventModal
        visible={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={performCancellation}
        eventTitle={event?.title || ""}
      />
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 48,
    },
    errorEmoji: { fontSize: 80, marginBottom: 24 },
    errorTitle: {
      fontSize: 24,
      fontWeight: "700",
      marginBottom: 12,
      letterSpacing: -0.3,
    },
    errorText: {
      fontSize: 15,
      textAlign: "center",
      marginBottom: 32,
    },
    errorButton: {
      borderRadius: 16,
      overflow: "hidden",
    },
    errorButtonGlass: {
      borderWidth: 1,
      paddingVertical: 14,
      paddingHorizontal: 32,
      alignItems: "center",
    },
    errorButtonText: {
      fontSize: 16,
      fontWeight: "700",
      letterSpacing: -0.2,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 24,
      paddingTop: 60,
      paddingBottom: 20,
    },
    headerButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 1,
      justifyContent: "center",
      alignItems: "center",
      marginLeft: 8,
    },
    headerButtonText: { fontSize: 20 },
    headerActions: { flexDirection: "row" },
    scrollView: { flex: 1 },
    scrollContent: { paddingHorizontal: 24, paddingBottom: 120 },
    heroSection: { marginBottom: 24 },
    categoryRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 16,
    },
    categoryBadge: {
      paddingVertical: 6,
      paddingHorizontal: 14,
      borderRadius: 10,
      borderWidth: 1,
    },
    categoryText: { fontSize: 12, fontWeight: "600", letterSpacing: 0.3 },
    freeBadge: {
      backgroundColor: "rgba(166, 255, 150, 0.15)",
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: "rgba(166, 255, 150, 0.3)",
    },
    freeBadgeText: {
      fontSize: 12,
      fontWeight: "700",
      color: "#A6FF96",
      letterSpacing: 0.5,
    },
    priceBadge: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 10,
      borderWidth: 1,
    },
    priceText: { fontSize: 14, fontWeight: "700" },
    title: {
      fontSize: 28,
      fontWeight: "700",
      lineHeight: 36,
      letterSpacing: -0.5,
    },
    cancelledBadge: {
      marginTop: 12,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 12,
      borderWidth: 1,
      alignSelf: "flex-start",
    },
    cancelledText: {
      fontSize: 14,
      fontWeight: "700",
      letterSpacing: 0.5,
    },
    infoSection: { gap: 12, marginBottom: 24 },
    infoCard: { borderRadius: 16, overflow: "hidden" },
    infoGlass: {
      borderWidth: 1,
      padding: 16,
      flexDirection: "row",
      alignItems: "center",
    },
    infoIcon: { fontSize: 28, marginRight: 14 },
    infoContent: { flex: 1 },
    infoLabel: { fontSize: 12, marginBottom: 4, letterSpacing: 0.3 },
    infoValue: { fontSize: 15, fontWeight: "600", letterSpacing: -0.2 },
    chatSection: { marginBottom: 24 },
    chatButton: { borderRadius: 20, overflow: "hidden" },
    chatGlass: {
      borderWidth: 1,
      padding: 20,
      flexDirection: "row",
      alignItems: "center",
    },
    chatIcon: { fontSize: 32, marginRight: 16 },
    chatContent: { flex: 1 },
    chatTitle: {
      fontSize: 18,
      fontWeight: "700",
      marginBottom: 4,
      letterSpacing: -0.3,
    },
    chatSubtitle: { fontSize: 13 },
    chatArrow: { fontSize: 24, marginLeft: 12 },
    descriptionSection: {
      marginBottom: 24,
      borderRadius: 16,
      overflow: "hidden",
    },
    descriptionGlass: { borderWidth: 1, padding: 20 },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "700",
      marginBottom: 14,
      letterSpacing: -0.2,
    },
    descriptionText: { fontSize: 15, lineHeight: 24 },
    policySection: {
      marginBottom: 24,
      borderRadius: 16,
      overflow: "hidden",
    },
    policyGlass: { borderWidth: 1, padding: 20 },
    policyItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 10,
    },
    policyDot: { fontSize: 16, marginRight: 8, marginTop: 2 },
    policyText: { fontSize: 14, lineHeight: 20, flex: 1 },
    policyDivider: { height: 1, marginVertical: 14 },
    attendeesSection: {
      marginBottom: 24,
      borderRadius: 16,
      overflow: "hidden",
    },
    attendeesGlass: { borderWidth: 1, padding: 20 },
    attendeeRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: "rgba(255,255,255,0.05)",
    },
    attendeeAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 2,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    attendeeEmoji: { fontSize: 20 },
    attendeeName: { fontSize: 15, fontWeight: "600" },
    bottomAction: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      paddingBottom: 40,
    },
    bottomGlass: { borderTopWidth: 1, padding: 24 },
    actionButton: { borderRadius: 16, overflow: "hidden" },
    actionButtonDisabled: { opacity: 0.5 },
    actionButtonGlass: {
      borderWidth: 1,
      paddingVertical: 16,
      alignItems: "center",
    },
    actionButtonText: { fontSize: 17, fontWeight: "700", letterSpacing: -0.2 },
  });
}
