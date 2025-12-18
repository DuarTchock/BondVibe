import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { CardField, useConfirmPayment } from "@stripe/stripe-react-native";
import { doc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";
import { auth, db } from "../../services/firebase";
import { useTheme } from "../../contexts/ThemeContext";
import {
  createEventPaymentIntent,
  formatMXN,
} from "../../services/stripeService";
import { savePaymentRecord } from "../../services/paymentService";
import { createNotification } from "../../utils/notificationService";

export default function CheckoutScreen({ route, navigation }) {
  const { colors, isDark } = useTheme();
  const { confirmPayment, loading: confirmLoading } = useConfirmPayment();

  const { eventId, eventTitle, amount } = route.params;

  const [cardComplete, setCardComplete] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handlePayment = async () => {
    if (!cardComplete) {
      Alert.alert("Incomplete Card", "Please enter complete card details");
      return;
    }

    setProcessing(true);
    console.log("💳 Starting payment process...");

    try {
      // 1. Create Payment Intent
      console.log("🔐 Creating payment intent...");
      const { clientSecret, paymentIntentId, split } =
        await createEventPaymentIntent(eventId, auth.currentUser.uid, amount);

      console.log(`Payment Intent created: ${paymentIntentId}`);

      // 2. Confirm Payment with Stripe
      console.log("💰 Confirming payment with Stripe...");
      const { paymentIntent, error } = await confirmPayment(clientSecret, {
        paymentMethodType: "Card",
      });

      if (error) {
        console.error("❌ Payment failed:", error);
        Alert.alert(
          "Payment Failed",
          error.message || "There was an error processing your payment"
        );
        setProcessing(false);
        return;
      }

      console.log("✅ Payment succeeded!");

      // 3. Get event data FIRST (before saving payment record)
      console.log("📄 Fetching event data...");
      const eventRef = doc(db, "events", eventId);
      const eventDoc = await getDoc(eventRef);

      if (!eventDoc.exists()) {
        throw new Error("Event not found");
      }

      const eventData = eventDoc.data();

      // 4. Save payment record
      console.log("💾 Saving payment record...");
      await savePaymentRecord({
        eventId: eventId,
        paymentIntentId: paymentIntent.id,
        amount: amount,
        currency: "mxn",
        eventTitle: eventTitle,
        hostId: eventData.creatorId,
      });
      console.log("✅ Payment record saved");

      // 5. Add user to event attendees
      console.log("👥 Adding user to event attendees...");
      await updateDoc(eventRef, {
        attendees: arrayUnion(auth.currentUser.uid),
      });
      console.log("✅ User added to attendees");

      // 6. Get user data for notification
      console.log("📄 Fetching user data...");
      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
      const userData = userDoc.data();
      const userName = userData?.fullName || userData?.name || "Someone";

      // 7. Send notification to host
      if (eventData.creatorId && eventData.creatorId !== auth.currentUser.uid) {
        console.log("📬 Sending notification to host:", eventData.creatorId);
        await createNotification(eventData.creatorId, {
          type: "event_joined",
          title: "New paid attendee! 💰",
          message: `${userName} paid ${formatMXN(amount)} for "${eventTitle}"`,
          icon: "💵",
          metadata: {
            eventId: eventId,
            eventTitle: eventTitle,
            userId: auth.currentUser.uid,
            amount: amount,
            paymentIntentId: paymentIntentId,
          },
        });
        console.log("✅ Notification sent to host");
      }

      // 8. Show success and navigate
      Alert.alert(
        "Payment Successful! 🎉",
        `You've successfully joined "${eventTitle}"`,
        [
          {
            text: "OK",
            onPress: () => {
              navigation.navigate("EventDetail", { eventId });
            },
          },
        ]
      );
    } catch (error) {
      console.error("❌ Payment error:", error);
      Alert.alert(
        "Payment Error",
        "There was an error processing your payment. Please try again."
      );
    } finally {
      setProcessing(false);
    }
  };

  const styles = createStyles(colors);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={[styles.backIcon, { color: colors.text }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Checkout
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* Event Info */}
        <View
          style={[
            styles.eventCard,
            {
              backgroundColor: colors.surfaceGlass,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.eventTitle, { color: colors.text }]}>
            {eventTitle}
          </Text>
          <Text style={[styles.eventPrice, { color: colors.primary }]}>
            {formatMXN(amount)}
          </Text>
        </View>

        {/* Pricing Breakdown */}
        <View
          style={[
            styles.breakdownCard,
            {
              backgroundColor: colors.surfaceGlass,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.breakdownTitle, { color: colors.text }]}>
            Pricing Breakdown
          </Text>

          <View style={styles.breakdownRow}>
            <Text
              style={[styles.breakdownLabel, { color: colors.textSecondary }]}
            >
              Ticket Price
            </Text>
            <Text style={[styles.breakdownValue, { color: colors.text }]}>
              {formatMXN(amount)}
            </Text>
          </View>

          <View style={styles.breakdownRow}>
            <Text
              style={[styles.breakdownLabel, { color: colors.textSecondary }]}
            >
              Platform Fee (5%)
            </Text>
            <Text style={[styles.breakdownValue, { color: colors.text }]}>
              Included
            </Text>
          </View>

          <View style={styles.breakdownRow}>
            <Text
              style={[styles.breakdownLabel, { color: colors.textSecondary }]}
            >
              Processing Fee
            </Text>
            <Text style={[styles.breakdownValue, { color: colors.text }]}>
              Included
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.breakdownRow}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>
              Total
            </Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>
              {formatMXN(amount)}
            </Text>
          </View>

          <Text
            style={[styles.hostReceivesText, { color: colors.textTertiary }]}
          >
            Host receives: ~{formatMXN(Math.floor(amount * 0.9))} after fees
          </Text>
        </View>

        {/* Card Input */}
        <View
          style={[
            styles.cardFieldContainer,
            {
              backgroundColor: colors.surfaceGlass,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.cardLabel, { color: colors.text }]}>
            Card Details
          </Text>
          <CardField
            postalCodeEnabled={false}
            placeholders={{
              number: "4242 4242 4242 4242",
            }}
            cardStyle={{
              backgroundColor: colors.surface,
              textColor: colors.text,
              placeholderColor: colors.textTertiary,
            }}
            style={styles.cardField}
            onCardChange={(cardDetails) => {
              setCardComplete(cardDetails.complete);
            }}
          />
        </View>

        {/* Security Message */}
        <View style={styles.securityRow}>
          <Text style={styles.lockIcon}>🔒</Text>
          <Text style={[styles.securityText, { color: colors.textSecondary }]}>
            Your payment is secure and encrypted
          </Text>
        </View>

        {/* Pay Button */}
        <TouchableOpacity
          style={[
            styles.payButton,
            {
              backgroundColor: cardComplete ? colors.primary : colors.border,
              opacity: processing || !cardComplete ? 0.5 : 1,
            },
          ]}
          onPress={handlePayment}
          disabled={!cardComplete || processing || confirmLoading}
        >
          {processing || confirmLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.payButtonText}>Pay {formatMXN(amount)}</Text>
          )}
        </TouchableOpacity>

        {/* Terms */}
        <Text style={[styles.termsText, { color: colors.textTertiary }]}>
          By completing this purchase you agree to our Terms of Service and
          Privacy Policy
        </Text>
      </View>
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingTop: 60,
      paddingBottom: 16,
    },
    backButton: {
      width: 40,
      height: 40,
      justifyContent: "center",
    },
    backIcon: {
      fontSize: 28,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "700",
      letterSpacing: -0.3,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    eventCard: {
      borderWidth: 1,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
    },
    eventTitle: {
      fontSize: 18,
      fontWeight: "700",
      marginBottom: 8,
    },
    eventPrice: {
      fontSize: 28,
      fontWeight: "800",
    },
    breakdownCard: {
      borderWidth: 1,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
    },
    breakdownTitle: {
      fontSize: 16,
      fontWeight: "700",
      marginBottom: 16,
    },
    breakdownRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    breakdownLabel: {
      fontSize: 14,
    },
    breakdownValue: {
      fontSize: 14,
      fontWeight: "600",
    },
    divider: {
      height: 1,
      marginVertical: 12,
    },
    totalLabel: {
      fontSize: 16,
      fontWeight: "700",
    },
    totalValue: {
      fontSize: 20,
      fontWeight: "800",
    },
    hostReceivesText: {
      fontSize: 12,
      marginTop: 8,
      textAlign: "center",
    },
    cardFieldContainer: {
      borderWidth: 1,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
    },
    cardLabel: {
      fontSize: 16,
      fontWeight: "700",
      marginBottom: 12,
    },
    cardField: {
      width: "100%",
      height: 50,
    },
    securityRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 20,
    },
    lockIcon: {
      fontSize: 16,
      marginRight: 6,
    },
    securityText: {
      fontSize: 13,
    },
    payButton: {
      borderRadius: 16,
      paddingVertical: 18,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },
    payButtonText: {
      color: "#FFFFFF",
      fontSize: 18,
      fontWeight: "700",
    },
    termsText: {
      fontSize: 12,
      textAlign: "center",
      lineHeight: 18,
    },
  });
}
