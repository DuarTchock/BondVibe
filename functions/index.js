/**
 * BondVibe Cloud Functions
 * Payment processing with Stripe + Push Notifications
 */

const {onRequest} = require("firebase-functions/v2/https");
const {onDocumentCreated} = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const {defineSecret} = require("firebase-functions/params");

// Define secrets
const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");

// Initialize Stripe (will be done inside functions)
let stripe;

// Initialize Firebase Admin FIRST
admin.initializeApp();
const db = admin.firestore();

// Import refunds AFTER Firebase is initialized
const {cancelEventAttendance, hostCancelEvent} = require("./stripe/refunds");

// Import pricing logic
const {
  calculateEventSplit,
  calculateTipSplit,
  getPremiumSubscriptionPrice,
} = require("./stripe/pricing");

// Import push notification service
const {sendBatchPushNotifications} = require("./notifications/pushService");

// ============================================
// PUSH NOTIFICATIONS
// ============================================

/**
 * Trigger: When a new message is created in a conversation
 * Sends push notifications to all participants except the sender
 */
exports.onNewMessage = onDocumentCreated(
  "conversations/{conversationId}/messages/{messageId}",
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      console.log("⚠️ No data in snapshot");
      return;
    }

    const messageData = snapshot.data();
    const {conversationId} = event.params;

    console.log("📨 New message detected:", {
      conversationId,
      senderId: messageData.senderId,
      type: messageData.type,
    });

    // Only process text and location messages
    if (!["text", "location"].includes(messageData.type)) {
      console.log("⏭️ Skipping non-text/location message");
      return;
    }

    try {
      // Extract eventId from conversationId (format: "event_{eventId}")
      const eventId = conversationId.replace("event_", "");

      // Get event data
      const eventDoc = await db.collection("events").doc(eventId).get();
      if (!eventDoc.exists) {
        console.log("⚠️ Event not found:", eventId);
        return;
      }

      const eventData = eventDoc.data();
      const eventTitle = eventData.title;

      // Get sender info
      const senderDoc = await db
        .collection("users")
        .doc(messageData.senderId)
        .get();
      const senderName = senderDoc.exists ?
        senderDoc.data().fullName?.split(" ")[0] ||
          senderDoc.data().name?.split(" ")[0] ||
          "Someone" :
        "Someone";

      // Get all participants (attendees + creator)
      const participantIds = new Set();

      // Add creator
      if (eventData.creatorId) {
        participantIds.add(eventData.creatorId);
      }

      // Add attendees
      if (Array.isArray(eventData.attendees)) {
        eventData.attendees.forEach((attendee) => {
          if (typeof attendee === "object" && attendee?.userId) {
            participantIds.add(attendee.userId);
          } else if (typeof attendee === "string") {
            participantIds.add(attendee);
          }
        });
      }

      // Remove sender from recipients
      participantIds.delete(messageData.senderId);

      console.log("👥 Participants to notify:", participantIds.size);

      if (participantIds.size === 0) {
        console.log("⚠️ No participants to notify");
        return;
      }

      // Prepare message body
      let messageBody;
      if (messageData.type === "location") {
        messageBody = "📍 Shared their location";
      } else {
        messageBody =
          messageData.text?.length > 100 ?
            messageData.text.substring(0, 100) + "..." :
            messageData.text;
      }

      // Get push tokens for all participants
      const notifications = [];

      for (const userId of participantIds) {
        try {
          const userDoc = await db.collection("users").doc(userId).get();

          if (userDoc.exists) {
            const userData = userDoc.data();
            const pushToken = userData.pushToken;

            if (pushToken) {
              notifications.push({
                pushToken,
                title: `${senderName} in ${eventTitle}`,
                body: messageBody,
                data: {
                  type: "event_message",
                  eventId: eventId,
                  conversationId: conversationId,
                  eventTitle: eventTitle,
                },
              });

              console.log(`📱 Queued notification for user: ${userId}`);
            } else {
              console.log(`⚠️ No push token for user: ${userId}`);
            }
          }
        } catch (userError) {
          console.error(`❌ Error getting user ${userId}:`, userError);
        }
      }

      // Send all push notifications
      if (notifications.length > 0) {
        const tickets = await sendBatchPushNotifications(notifications);
        console.log(
          `✅ Sent ${tickets.length} push notifications for message in ${eventTitle}`,
        );
      } else {
        console.log("⚠️ No valid push tokens found");
      }

      // Update in-app notification (existing logic)
      for (const userId of participantIds) {
        try {
          const cleanEventId = eventId;
          const notificationId = `event_msg_${cleanEventId}_${userId}`;
          const notificationRef = db
            .collection("notifications")
            .doc(notificationId);
          const existingNotif = await notificationRef.get();

          if (existingNotif.exists) {
            const currentCount = existingNotif.data().unreadCount ?? 0;
            await notificationRef.update({
              unreadCount: currentCount + 1,
              lastMessage: messageBody,
              lastSender: senderName,
              updatedAt: new Date().toISOString(),
              read: false,
            });
          } else {
            await notificationRef.set({
              userId,
              type: "event_messages",
              eventId: `event_${cleanEventId}`,
              eventTitle,
              unreadCount: 1,
              lastMessage: messageBody,
              lastSender: senderName,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              read: false,
            });
          }
        } catch (notifError) {
          console.error(
            `❌ Error updating notification for ${userId}:`,
            notifError,
          );
        }
      }
    } catch (error) {
      console.error("❌ Error processing new message:", error);
    }
  },
);

// ============================================
// PAYMENT FUNCTIONS (existing)
// ============================================

/**
 * Create Payment Intent for event ticket
 */
exports.createEventPaymentIntent = onRequest(
  {cors: true, secrets: [stripeSecretKey]},
  async (req, res) => {
    if (req.method !== "POST") {
      return res.status(405).json({error: "Method not allowed"});
    }

    try {
      // Initialize Stripe with secret
      if (!stripe) {
        stripe = require("stripe")(stripeSecretKey.value());
      }

      const {eventId, userId, amount} = req.body;

      if (!eventId || !userId || !amount) {
        return res.status(400).json({error: "Missing required fields"});
      }

      const eventDoc = await db.collection("events").doc(eventId).get();
      if (!eventDoc.exists) {
        return res.status(404).json({error: "Event not found"});
      }

      const eventData = eventDoc.data();
      const hostId = eventData.createdBy;

      const split = calculateEventSplit(amount);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "mxn",
        metadata: {
          type: "event_ticket",
          eventId: eventId,
          eventTitle: eventData.title,
          userId: userId,
          hostId: hostId,
          platformFee: split.platformFee,
          hostReceives: split.hostReceives,
        },
        description: `Ticket for ${eventData.title}`,
      });

      console.log("✅ Payment Intent created:", paymentIntent.id);

      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        split: split,
      });
    } catch (error) {
      console.error("❌ Error creating payment intent:", error);
      res.status(500).json({error: error.message});
    }
  },
);

/**
 * Create Payment Intent for tip
 */
exports.createTipPaymentIntent = onRequest(
  {cors: true, secrets: [stripeSecretKey]},
  async (req, res) => {
    if (req.method !== "POST") {
      return res.status(405).json({error: "Method not allowed"});
    }

    try {
      if (!stripe) {
        stripe = require("stripe")(stripeSecretKey.value());
      }

      const {hostId, eventId, amount, message, userId} = req.body;

      if (!hostId || !amount || !userId) {
        return res.status(400).json({error: "Missing required fields"});
      }

      const split = calculateTipSplit(amount);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "mxn",
        metadata: {
          type: "tip",
          hostId: hostId,
          eventId: eventId || "",
          userId: userId,
          message: message || "",
          platformFee: "0.00",
        },
        description: "Tip for host",
      });

      console.log("✅ Tip Payment Intent created:", paymentIntent.id);

      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        split: split,
      });
    } catch (error) {
      console.error("❌ Error creating tip payment intent:", error);
      res.status(500).json({error: error.message});
    }
  },
);

/**
 * Get pricing info
 */
exports.getPricingInfo = onRequest({cors: true}, (req, res) => {
  const amount = parseInt(req.query.amount) || 0;

  if (amount < 5000) {
    return res.status(400).json({
      error: "Amount too low (minimum $50 MXN)",
    });
  }

  const split = calculateEventSplit(amount);
  const premiumPrice = getPremiumSubscriptionPrice();

  res.json({
    eventSplit: split,
    premiumSubscription: premiumPrice,
    minimums: {
      eventPrice: "$50 MXN",
      tip: "$10 MXN",
    },
  });
});

exports.cancelEventAttendance = cancelEventAttendance;
exports.hostCancelEvent = hostCancelEvent;
