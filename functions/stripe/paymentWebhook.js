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
  const {id: paymentIntentId, amount, currency, metadata} = paymentIntent;

  console.log("💳 Processing payment success:", paymentIntentId);

  // Extract metadata
  const {type, eventId, eventTitle, userId, hostId} = metadata;

  // Only process event_ticket payments
  if (type !== "event_ticket") {
    console.log("⏭️ Skipping non-event payment:", type);
    return;
  }

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
