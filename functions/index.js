/**
 * BondVibe Cloud Functions
 * Payment processing with Stripe
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const stripe = require("stripe")(functions.config().stripe.secret_key);
const cors = require("cors")({origin: true});

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Import pricing logic
const {calculateEventSplit, calculateTipSplit, getPremiumSubscriptionPrice} = require("./stripe/pricing");

/**
 * Create Payment Intent for event ticket
 *
 * POST /createEventPaymentIntent
 * Body: { eventId, userId, amount (in centavos) }
 */
exports.createEventPaymentIntent = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).json({error: "Method not allowed"});
    }

    try {
      const {eventId, userId, amount} = req.body;

      // Validate input
      if (!eventId || !userId || !amount) {
        return res.status(400).json({error: "Missing required fields"});
      }

      // Get event details from Firestore
      const eventDoc = await db.collection("events").doc(eventId).get();
      if (!eventDoc.exists) {
        return res.status(404).json({error: "Event not found"});
      }

      const eventData = eventDoc.data();
      const hostId = eventData.createdBy;

      // Calculate split
      const split = calculateEventSplit(amount);

      // Create Payment Intent
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
  });
});

/**
 * Create Payment Intent for tip
 *
 * POST /createTipPaymentIntent
 * Body: { hostId, eventId, amount, message }
 */
exports.createTipPaymentIntent = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).json({error: "Method not allowed"});
    }

    try {
      const {hostId, eventId, amount, message, userId} = req.body;

      if (!hostId || !amount || !userId) {
        return res.status(400).json({error: "Missing required fields"});
      }

      // Calculate split (tips have no platform fee)
      const split = calculateTipSplit(amount);

      // Create Payment Intent
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
        description: `Tip for host`,
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
  });
});

/**
 * Webhook handler for Stripe events
 * This runs when payments succeed, fail, etc.
 */
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = functions.config().stripe.webhook_secret;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case "payment_intent.succeeded":
      await handlePaymentSuccess(event.data.object);
      break;
    case "payment_intent.payment_failed":
      await handlePaymentFailure(event.data.object);
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({received: true});
});

/**
 * Handle successful payment
 */
async function handlePaymentSuccess(paymentIntent) {
  console.log("✅ Payment succeeded:", paymentIntent.id);

  const {type, eventId, userId, hostId} = paymentIntent.metadata;

  try {
    if (type === "event_ticket") {
      // Add user to event attendees
      await db.collection("events").doc(eventId).update({
        attendees: admin.firestore.FieldValue.arrayUnion(userId),
        attendeeCount: admin.firestore.FieldValue.increment(1),
      });

      // Create transaction record
      await db.collection("transactions").add({
        type: "event_ticket",
        paymentIntentId: paymentIntent.id,
        eventId: eventId,
        userId: userId,
        hostId: hostId,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: "succeeded",
        platformFee: paymentIntent.metadata.platformFee,
        hostReceives: paymentIntent.metadata.hostReceives,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Send notification to host
      await db.collection("notifications").add({
        userId: hostId,
        type: "event_joined",
        title: "New attendee! 🎉",
        message: `Someone just bought a ticket to your event`,
        read: false,
        metadata: {eventId},
        createdAt: new Date().toISOString(),
      });

      console.log("✅ User added to event and transaction recorded");
    } else if (type === "tip") {
      // Record tip transaction
      await db.collection("transactions").add({
        type: "tip",
        paymentIntentId: paymentIntent.id,
        hostId: hostId,
        userId: userId,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: "succeeded",
        message: paymentIntent.metadata.message,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Send notification to host
      await db.collection("notifications").add({
        userId: hostId,
        type: "tip_received",
        title: "You received a tip! 💝",
        message: paymentIntent.metadata.message || "Someone sent you a tip",
        read: false,
        createdAt: new Date().toISOString(),
      });

      console.log("✅ Tip recorded");
    }
  } catch (error) {
    console.error("❌ Error handling payment success:", error);
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailure(paymentIntent) {
  console.log("❌ Payment failed:", paymentIntent.id);

  // You can add logic here to notify users or retry
  const {userId} = paymentIntent.metadata;

  if (userId) {
    await db.collection("notifications").add({
      userId: userId,
      type: "payment_failed",
      title: "Payment failed",
      message: "Your payment could not be processed. Please try again.",
      read: false,
      createdAt: new Date().toISOString(),
    });
  }
}

/**
 * Get pricing info (for displaying to users)
 *
 * GET /getPricingInfo?amount=50000
 */
exports.getPricingInfo = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    const amount = parseInt(req.query.amount) || 0;

    if (amount < 5000) {
      return res.status(400).json({error: "Amount too low (minimum $50 MXN)"});
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
});
