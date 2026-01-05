const fs = require('fs');

const indexPath = 'functions/index.js';
let content = fs.readFileSync(indexPath, 'utf8');

// Buscar y reemplazar la función createEventPaymentIntent
const oldFunction = `exports.createEventPaymentIntent = onRequest(
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
        description: \`Ticket for \${eventData.title}\`,
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
);`;

const newFunction = `exports.createEventPaymentIntent = onRequest(
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

      const {eventId, userId, eventPriceCentavos} = req.body;
      
      // Support both old 'amount' param and new 'eventPriceCentavos'
      const eventPrice = eventPriceCentavos || req.body.amount;

      if (!eventId || !userId || !eventPrice) {
        return res.status(400).json({error: "Missing required fields"});
      }

      // Get event data
      const eventDoc = await db.collection("events").doc(eventId).get();
      if (!eventDoc.exists) {
        return res.status(404).json({error: "Event not found"});
      }

      const eventData = eventDoc.data();
      const hostId = eventData.createdBy || eventData.creatorId;

      // Get host's Stripe Connect account
      const hostDoc = await db.collection("users").doc(hostId).get();
      if (!hostDoc.exists) {
        return res.status(404).json({error: "Host not found"});
      }

      const hostData = hostDoc.data();
      const stripeAccountId = hostData.stripeConnect?.accountId;

      // NEW: Calculate fees using new pricing model
      const {calculateCheckoutAmount} = require("./stripe/pricing");
      const pricing = calculateCheckoutAmount(eventPrice);

      console.log("💰 NEW Payment breakdown:", {
        eventPrice: pricing.eventPrice,
        platformFee: pricing.platformFee,
        stripeFee: pricing.stripeFee,
        totalAmount: pricing.totalAmount,
        hostReceives: pricing.hostReceives,
        refundableAmount: pricing.refundableAmount,
        stripeAccountId: stripeAccountId,
      });

      // Check if host has Stripe Connect (for paid events)
      if (eventPrice > 0 && !stripeAccountId) {
        return res.status(400).json({
          error: "Host has not connected their Stripe account",
          details: "Host must connect Stripe to receive payments",
        });
      }

      // Check if host can accept payments
      if (eventPrice > 0 && !hostData.hostConfig?.canCreatePaidEvents) {
        return res.status(400).json({
          error: "Host cannot accept payments yet",
          details: "Host needs to complete Stripe verification",
        });
      }

      // Create Payment Intent with NEW pricing
      const paymentIntentConfig = {
        amount: pricing.totalAmount, // User pays total (event + fees)
        currency: "mxn",
        metadata: {
          type: "event_ticket",
          eventId: eventId,
          eventTitle: eventData.title,
          userId: userId,
          hostId: hostId,
          // NEW: Store all pricing details for refunds
          eventPrice: pricing.eventPrice.toString(),
          platformFee: pricing.platformFee.toString(),
          stripeFee: pricing.stripeFee.toString(),
          totalAmount: pricing.totalAmount.toString(),
          hostReceives: pricing.hostReceives.toString(),
          refundableAmount: pricing.refundableAmount.toString(),
          feeModel: "USER_PAYS_FEES",
        },
        description: \`Ticket for \${eventData.title}\`,
      };

      // Add Stripe Connect parameters
      // BondVibe keeps: platform fee + stripe fee
      // Host receives: event price (100% of what they set)
      if (eventPrice > 0 && stripeAccountId) {
        paymentIntentConfig.application_fee_amount = pricing.platformFee + pricing.stripeFee;
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
          eventPrice: pricing.eventPrice,
          platformFee: pricing.platformFee,
          stripeFee: pricing.stripeFee,
          totalAmount: pricing.totalAmount,
          hostReceives: pricing.hostReceives,
          refundableAmount: pricing.refundableAmount,
          nonRefundableFees: pricing.platformFee + pricing.stripeFee,
          currency: "mxn",
          feeModel: "USER_PAYS_FEES",
        },
      });
    } catch (error) {
      console.error("❌ Error creating payment intent:", error);
      res.status(500).json({error: error.message});
    }
  },
);`;

content = content.replace(oldFunction, newFunction);
fs.writeFileSync(indexPath, content);
console.log('✅ Updated createEventPaymentIntent in functions/index.js');
