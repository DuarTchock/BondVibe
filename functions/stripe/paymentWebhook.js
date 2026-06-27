/**
 * Stripe Payment Success Webhook
 * Handles payment_intent.succeeded events
 * functions/stripe/paymentWebhook.js
 */

const {onRequest} = require("firebase-functions/v2/https");
const {defineSecret} = require("firebase-functions/params");
const admin = require("firebase-admin");

const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");
const stripeWebhookSecret = defineSecret("STRIPE_WEBHOOK_SECRET_PAYMENTS");

const db = admin.firestore();

/**
 * Webhook endpoint for Stripe payment events
 * Handles: payment_intent.succeeded
 */
exports.stripePaymentWebhook = onRequest(
  {secrets: [stripeSecretKey, stripeWebhookSecret]},
  async (req, res) => {
    const stripe = require("stripe")(stripeSecretKey.value());
    const sig = req.headers["stripe-signature"];

    let event;

    try {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        sig,
        stripeWebhookSecret.value(),
      );
    } catch (err) {
      console.error("❌ Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log("🔔 Stripe webhook received:", event.type);

    // Handle payment_intent.succeeded
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object;

      try {
        await handlePaymentSuccess(paymentIntent);
        res.json({received: true, handled: true});
      } catch (error) {
        console.error("❌ Error handling payment success:", error);
        res
          .status(500)
          .json({received: true, handled: false, error: error.message});
      }
    } else {
      // Other event types - just acknowledge
      res.json({received: true, handled: false});
    }
  },
);

/**
 * Handle successful payment
 * Saves payment record, adds user to event, sends notification
 * @param {Object} paymentIntent - Stripe PaymentIntent object
 * @return {Promise<void>}
 */
async function handlePaymentSuccess(paymentIntent) {
  const {metadata} = paymentIntent;
  const type = metadata.type;

  if (type === "membership") {
    return handleMembershipPurchase(paymentIntent);
  }

  if (type !== "event_ticket") {
    console.log("⏭️ Skipping unhandled payment type:", type);
    return;
  }

  return handleEventTicketPurchase(paymentIntent);
}

/**
 * Handle a successful event ticket payment.
 * @param {Object} paymentIntent - Stripe PaymentIntent object
 * @return {Promise<void>}
 */
async function handleEventTicketPurchase(paymentIntent) {
  const {id: paymentIntentId, amount, currency, metadata} = paymentIntent;

  console.log("💳 Processing event ticket payment:", paymentIntentId);

  // Extract metadata
  const {eventId, eventTitle, userId, hostId} = metadata;

  // Validate required fields
  if (!eventId || !userId || !hostId) {
    throw new Error("Missing required metadata in payment intent");
  }

  // 1. Save payment record
  console.log("💾 Saving payment record...");
  const paymentData = {
    paymentIntentId: paymentIntentId,
    userId: userId,
    hostId: hostId,
    eventId: eventId,
    eventTitle: eventTitle,
    amount: amount,
    currency: currency,
    status: "succeeded",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    metadata: metadata,
  };

  await db.collection("payments").doc(paymentIntentId).set(paymentData);
  console.log("✅ Payment record saved");

  // 2. Add user to event attendees
  console.log("👥 Adding user to event attendees...");
  const eventRef = db.collection("events").doc(eventId);
  await eventRef.update({
    attendees: admin.firestore.FieldValue.arrayUnion(userId),
  });
  console.log("✅ User added to attendees");

  // ⭐ 3. Get user info for notification
  console.log("📧 Getting user info for notification...");
  const userDoc = await db.collection("users").doc(userId).get();
  const userName = userDoc.exists ?
    userDoc.data().fullName || userDoc.data().name || "Someone" :
    "Someone";

  // ⭐ 4. Send notification to host
  console.log("📬 Sending notification to host:", hostId);
  const notificationData = {
    userId: hostId,
    type: "event_paid_attendee",
    title: "New paid attendee! 💰",
    message: `${userName} paid $${(amount / 100).toFixed(
      2,
    )} MXN for "${eventTitle}"`,
    icon: "💰",
    read: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    metadata: {
      eventId: eventId,
      eventTitle: eventTitle,
      attendeeId: userId,
      attendeeName: userName,
      amount: amount,
      currency: currency,
    },
  };

  await db.collection("notifications").add(notificationData);
  console.log("✅ Notification sent to host");

  console.log("✅ Payment processing complete");
}

/**
 * Handle a successful membership plan purchase.
 * Creates the membership instance (credits + expiry) and notifies both parties.
 * @param {Object} paymentIntent - Stripe PaymentIntent object
 * @return {Promise<void>}
 */
async function handleMembershipPurchase(paymentIntent) {
  const {id: paymentIntentId, amount, currency, metadata} = paymentIntent;
  const {planId, planName, planType, userId, hostId} = metadata;
  const creditsIncluded = parseInt(metadata.creditsIncluded, 10) || 0;
  const validityDays = parseInt(metadata.validityDays, 10) || 0;

  console.log("🎟️ Processing membership purchase:", paymentIntentId);

  if (!planId || !userId || !hostId) {
    throw new Error("Missing required membership metadata in payment intent");
  }

  // Idempotency: if this payment was already processed, skip.
  const existingPayment = await db
    .collection("payments")
    .doc(paymentIntentId)
    .get();
  if (existingPayment.exists) {
    console.log("⏭️ Membership payment already processed, skipping");
    return;
  }

  // 1. Save payment record
  await db.collection("payments").doc(paymentIntentId).set({
    paymentIntentId,
    userId,
    hostId,
    planId,
    planName,
    type: "membership",
    amount,
    currency,
    status: "succeeded",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    metadata,
  });
  console.log("✅ Membership payment record saved");

  // 2. Create the membership instance
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + validityDays);
  const isCredits = planType === "credits";

  const membershipRef = await db.collection("memberships").add({
    userId,
    hostId,
    planId,
    planName,
    type: planType,
    creditsTotal: isCredits ? creditsIncluded : null,
    creditsRemaining: isCredits ? creditsIncluded : null,
    purchasedAt: admin.firestore.Timestamp.fromDate(now),
    expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
    status: "active",
    autoRenew: false,
    paymentId: paymentIntentId,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log("✅ Membership created:", membershipRef.id);

  // 3. Get buyer name for notifications
  const userDoc = await db.collection("users").doc(userId).get();
  const userName = userDoc.exists ?
    userDoc.data().fullName || userDoc.data().name || "Someone" :
    "Someone";

  // 4. Notify host
  await db.collection("notifications").add({
    userId: hostId,
    type: "membership_sold",
    title: "Membership sold! 🎟️",
    message: `${userName} purchased "${planName}" for $${(amount / 100).toFixed(
      2,
    )} MXN`,
    icon: "🎟️",
    read: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    metadata: {planId, planName, membershipId: membershipRef.id, userId},
  });

  // 5. Notify buyer
  await db.collection("notifications").add({
    userId: userId,
    type: "membership_purchased",
    title: "Membership active! 🎉",
    message: isCredits ?
      `Your "${planName}" is ready — ${creditsIncluded} classes available.` :
      `Your "${planName}" is active. Enjoy unlimited classes!`,
    icon: "🎉",
    read: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    metadata: {planId, planName, membershipId: membershipRef.id},
  });

  console.log("✅ Membership purchase processing complete");
}
