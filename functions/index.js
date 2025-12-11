/**
 * BondVibe Cloud Functions
 * Payment processing with Stripe
 */

const {onRequest} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const {defineSecret} = require("firebase-functions/params");

// Define secrets
const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");

// Initialize Stripe (will be done inside functions)
let stripe;

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Import pricing logic
const {
  calculateEventSplit,
  calculateTipSplit,
  getPremiumSubscriptionPrice,
} = require("./stripe/pricing");

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
    });

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
    });

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
