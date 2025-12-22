/**
 * Payment Functions with Stripe Connect
 * Updated to support direct payments to hosts
 */

const {onRequest} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const {defineSecret} = require("firebase-functions/params");
const {calculatePlatformFee} = require("../config/platform");

// Define secrets
const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");

// Initialize Stripe (will be done inside functions)
let stripe;

const db = admin.firestore();

/**
 * Create Payment Intent for event ticket with Stripe Connect
 * Money flows: User → Host (95%) + BondVibe (5%)
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

      // Get event data
      const eventDoc = await db.collection("events").doc(eventId).get();
      if (!eventDoc.exists) {
        return res.status(404).json({error: "Event not found"});
      }

      const eventData = eventDoc.data();
      const hostId = eventData.createdBy;

      // Get host's Stripe Connect account
      const hostDoc = await db.collection("users").doc(hostId).get();
      if (!hostDoc.exists) {
        return res.status(404).json({error: "Host not found"});
      }

      const hostData = hostDoc.data();
      const stripeAccountId = hostData.stripeConnect?.accountId;

      // Calculate platform fee (5%)
      const platformFee = calculatePlatformFee(amount);
      const hostReceives = amount - platformFee;

      console.log("💰 Payment breakdown:", {
        total: amount,
        platformFee: platformFee,
        hostReceives: hostReceives,
        stripeAccountId: stripeAccountId,
      });

      // Check if host has Stripe Connect (for paid events)
      if (amount > 0 && !stripeAccountId) {
        return res.status(400).json({
          error: "Host has not connected their Stripe account",
          details: "Host must connect Stripe to receive payments",
        });
      }

      // Check if host can accept payments
      if (amount > 0 && !hostData.hostConfig?.canCreatePaidEvents) {
        return res.status(400).json({
          error: "Host cannot accept payments yet",
          details: "Host needs to complete Stripe verification",
        });
      }

      // Create Payment Intent
      const paymentIntentConfig = {
        amount: amount,
        currency: "mxn",
        metadata: {
          type: "event_ticket",
          eventId: eventId,
          eventTitle: eventData.title,
          userId: userId,
          hostId: hostId,
          platformFee: platformFee.toString(),
          hostReceives: hostReceives.toString(),
        },
        description: `Ticket for ${eventData.title}`,
      };

      // Add Stripe Connect parameters for paid events
      if (amount > 0 && stripeAccountId) {
        paymentIntentConfig.application_fee_amount = platformFee;
        paymentIntentConfig.transfer_data = {
          destination: stripeAccountId,
        };
      }

      const paymentIntent = await stripe.paymentIntents.create(
        paymentIntentConfig,
      );

      console.log("✅ Payment Intent created:", paymentIntent.id);

      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        breakdown: {
          total: amount,
          platformFee: platformFee,
          hostReceives: hostReceives,
          currency: "mxn",
        },
      });
    } catch (error) {
      console.error("❌ Error creating payment intent:", error);
      res.status(500).json({error: error.message});
    }
  },
);

/**
 * Create Payment Intent for tip with Stripe Connect
 * Tips go 100% to host (no platform fee)
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

      // Get host's Stripe Connect account
      const hostDoc = await db.collection("users").doc(hostId).get();
      if (!hostDoc.exists) {
        return res.status(404).json({error: "Host not found"});
      }

      const hostData = hostDoc.data();
      const stripeAccountId = hostData.stripeConnect?.accountId;

      if (!stripeAccountId) {
        return res.status(400).json({
          error: "Host has not connected their Stripe account",
        });
      }

      console.log("💝 Tip payment:", {
        amount: amount,
        hostId: hostId,
        stripeAccountId: stripeAccountId,
      });

      // Tip goes 100% to host (no platform fee)
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "mxn",
        application_fee_amount: 0, // No platform fee on tips
        transfer_data: {
          destination: stripeAccountId, // 100% to host
        },
        metadata: {
          type: "tip",
          hostId: hostId,
          eventId: eventId || "",
          userId: userId,
          message: message || "",
          platformFee: "0",
        },
        description: "Tip for host",
      });

      console.log("✅ Tip Payment Intent created:", paymentIntent.id);

      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        breakdown: {
          total: amount,
          platformFee: 0,
          hostReceives: amount,
          currency: "mxn",
        },
      });
    } catch (error) {
      console.error("❌ Error creating tip payment intent:", error);
      res.status(500).json({error: error.message});
    }
  },
);
