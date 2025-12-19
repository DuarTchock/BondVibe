// ============================================
// REFUND POLICY & IMPLEMENTATION
// functions/stripe/refunds.js
// ============================================

const functions = require("firebase-functions/v2");
const {defineSecret} = require("firebase-functions/params");
const admin = require("firebase-admin");
const db = admin.firestore();

// Define Stripe secret
const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");

// ============================================
// REFUND POLICY CONFIGURATION
// ============================================

const REFUND_POLICY = {
  USER_CANCELLATION: {
    DAYS_7_PLUS: 1.0,
    DAYS_3_TO_7: 0.5,
    DAYS_LESS_3: 0.0,
  },
  HOST_CANCELLATION: 1.0,
  MIN_REFUND_HOURS: 2,
};

// ============================================
// CALCULATE REFUND PERCENTAGE
// ============================================

/**
 * Calculate refund percentage based on cancellation timing
 * @param {string} eventDate - ISO date string of the event
 * @param {string} cancelledBy - Who cancelled: 'user' or 'host'
 * @return {number} Refund percentage (0.0 to 1.0)
 */
function calculateRefundPercentage(eventDate, cancelledBy) {
  const now = new Date();
  const eventDateTime = new Date(eventDate);
  const hoursUntilEvent = (eventDateTime - now) / (1000 * 60 * 60);
  const daysUntilEvent = hoursUntilEvent / 24;

  if (cancelledBy === "host") {
    return REFUND_POLICY.HOST_CANCELLATION;
  }

  if (daysUntilEvent >= 7) {
    return REFUND_POLICY.USER_CANCELLATION.DAYS_7_PLUS;
  } else if (daysUntilEvent >= 3) {
    return REFUND_POLICY.USER_CANCELLATION.DAYS_3_TO_7;
  } else {
    return REFUND_POLICY.USER_CANCELLATION.DAYS_LESS_3;
  }
}

// ============================================
// PROCESS REFUND
// ============================================

/**
 * Process a Stripe refund
 * @param {object} stripe - Stripe instance
 * @param {string} paymentIntentId - Stripe Payment Intent ID
 * @param {number} refundPercentage - Refund percentage (0.0 to 1.0)
 * @param {string} reason - Refund reason
 * @return {Promise<object>} Refund result
 */
async function processRefund(
  stripe,
  paymentIntentId,
  refundPercentage,
  reason,
) {
  try {
    console.log("💰 Processing refund:", {
      paymentIntentId: paymentIntentId,
      refundPercentage: refundPercentage,
      reason: reason,
    });

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (!paymentIntent) {
      throw new Error("Payment Intent not found");
    }

    console.log("📋 Payment Intent status:", paymentIntent.status);
    console.log("📋 Amount already refunded:", paymentIntent.amount_refunded);

    if (paymentIntent.status === "canceled") {
      return {
        success: false,
        error: "Payment was canceled",
      };
    }

    if (paymentIntent.amount_refunded >= paymentIntent.amount) {
      return {
        success: false,
        error: "Payment already fully refunded",
      };
    }

    const originalAmount = paymentIntent.amount;
    const alreadyRefunded = paymentIntent.amount_refunded || 0;
    const maxRefundable = originalAmount - alreadyRefunded;
    const desiredRefund = Math.floor(originalAmount * refundPercentage);
    const refundAmount = Math.min(desiredRefund, maxRefundable);

    if (refundAmount === 0) {
      return {
        success: false,
        error: "No refund available",
        refundPercentage: 0,
      };
    }

    console.log("💵 Refund calculation:", {
      originalAmount: originalAmount,
      alreadyRefunded: alreadyRefunded,
      maxRefundable: maxRefundable,
      desiredRefund: desiredRefund,
      refundAmount: refundAmount,
    });

    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: refundAmount,
      reason: reason || "requested_by_customer",
      metadata: {
        refund_percentage: refundPercentage * 100,
        original_amount: originalAmount,
        refunded_amount: refundAmount,
      },
    });

    console.log("✅ Refund created:", refund.id);

    return {
      success: true,
      refund: {
        id: refund.id,
        amount: refundAmount,
        percentage: refundPercentage * 100,
        originalAmount: originalAmount,
        status: refund.status,
      },
    };
  } catch (error) {
    console.error("❌ Error processing refund:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// ============================================
// CLOUD FUNCTION: USER CANCELLATION
// ============================================

exports.cancelEventAttendance = functions.https.onCall(
  {secrets: [stripeSecretKey]},
  async (request) => {
    if (!request.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Must be authenticated",
      );
    }

    const {eventId} = request.data;
    const userId = request.auth.uid;

    console.log("🚫 User cancelling attendance:", {
      eventId: eventId,
      userId: userId,
    });

    try {
      const stripe = require("stripe")(stripeSecretKey.value());

      const eventRef = db.collection("events").doc(eventId);
      const eventDoc = await eventRef.get();

      if (!eventDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Event not found");
      }

      const eventData = eventDoc.data();
      const attendees = eventData.attendees || [];
      let attendeeIndex = -1;

      for (let i = 0; i < attendees.length; i++) {
        const attendee = attendees[i];
        if (typeof attendee === "string" && attendee === userId) {
          attendeeIndex = i;
          break;
        } else if (attendee && attendee.userId === userId) {
          attendeeIndex = i;
          break;
        }
      }

      if (attendeeIndex === -1) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "User is not attending this event",
        );
      }

      const paymentsSnapshot = await db
        .collection("payments")
        .where("eventId", "==", eventId)
        .where("userId", "==", userId)
        .where("status", "==", "succeeded")
        .limit(1)
        .get();

      if (paymentsSnapshot.empty) {
        attendees.splice(attendeeIndex, 1);
        await eventRef.update({attendees: attendees});

        console.log("✅ Removed from free event");
        return {
          success: true,
          refund: null,
          message: "Removed from free event",
        };
      }

      const paymentDoc = paymentsSnapshot.docs[0];
      const paymentData = paymentDoc.data();
      const paymentIntentId = paymentData.paymentIntentId;

      const refundPercentage = calculateRefundPercentage(
        eventData.date,
        "user",
      );
      console.log("📊 Refund percentage:", refundPercentage * 100 + "%");

      const refundResult = await processRefund(
        stripe,
        paymentIntentId,
        refundPercentage,
        "requested_by_customer",
      );

      attendees.splice(attendeeIndex, 1);
      await eventRef.update({attendees: attendees});

      await paymentDoc.ref.update({
        status: refundResult.success ? "refunded" : "succeeded",
        refundAmount: refundResult.refund ? refundResult.refund.amount : 0,
        refundPercentage: refundPercentage * 100,
        refundedAt: refundResult.success ? new Date().toISOString() : null,
      });

      if (eventData.creatorId) {
        const userDoc = await db.collection("users").doc(userId).get();
        const userData = userDoc.data() || {};
        const userName = userData.name || userData.fullName || "Someone";

        const refundMsg =
          refundPercentage > 0 ?
            "Refund: " + refundPercentage * 100 + "%" :
            "No refund";

        await db.collection("notifications").add({
          userId: eventData.creatorId,
          type: "attendee_cancelled",
          title: "Attendee Cancelled",
          message:
            userName + " cancelled for \"" + eventData.title + "\". " + refundMsg,
          icon: "🚫",
          read: false,
          createdAt: new Date().toISOString(),
          metadata: {
            eventId: eventId,
            eventTitle: eventData.title,
            refundPercentage: refundPercentage * 100,
          },
        });
      }

      console.log("✅ Cancellation complete");

      const resultMessage =
        refundPercentage > 0 ?
          "Refund of " + refundPercentage * 100 + "% processed" :
          "No refund available (less than 3 days)";

      return {
        success: true,
        refund: refundResult.refund,
        refundPercentage: refundPercentage * 100,
        message: resultMessage,
      };
    } catch (error) {
      console.error("❌ Error cancelling attendance:", error);
      throw new functions.https.HttpsError("internal", error.message);
    }
  },
);

// ============================================
// CLOUD FUNCTION: HOST CANCELS EVENT
// ============================================

exports.hostCancelEvent = functions.https.onCall(
  {secrets: [stripeSecretKey]},
  async (request) => {
    if (!request.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Must be authenticated",
      );
    }

    const {eventId, cancellationReason} = request.data;
    const userId = request.auth.uid;

    console.log("🏠 Host cancelling event:", {
      eventId: eventId,
      userId: userId,
      reason: cancellationReason,
    });

    try {
      const stripe = require("stripe")(stripeSecretKey.value());

      const eventRef = db.collection("events").doc(eventId);
      const eventDoc = await eventRef.get();

      if (!eventDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Event not found");
      }

      const eventData = eventDoc.data();

      console.log("📋 Event data:", {
        title: eventData.title,
        creatorId: eventData.creatorId,
        attendeesCount: eventData.attendees ? eventData.attendees.length : 0,
      });

      // Verificar permisos
      if (eventData.creatorId !== userId) {
        const userDoc = await db.collection("users").doc(userId).get();
        const userData = userDoc.data();

        if (!userData || userData.role !== "admin") {
          throw new functions.https.HttpsError(
            "permission-denied",
            "Only host or admin can cancel",
          );
        }
      }

      // DEBUG: Query ALL payments for this event
      console.log("🔍 DEBUG - Searching payments for eventId:", eventId);

      const allPaymentsSnapshot = await db
        .collection("payments")
        .where("eventId", "==", eventId)
        .get();

      console.log("🔍 Total payments found:", allPaymentsSnapshot.size);

      allPaymentsSnapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log("🔍 Payment " + (index + 1) + ":", {
          id: doc.id,
          odl: data.userId,
          status: data.status,
          amount: data.amount,
          paymentIntentId: data.paymentIntentId,
        });
      });

      // Get payments with status 'succeeded'
      const paymentsSnapshot = await db
        .collection("payments")
        .where("eventId", "==", eventId)
        .where("status", "==", "succeeded")
        .get();

      console.log("💳 Payments with succeeded status:", paymentsSnapshot.size);

      const refundResults = [];
      const failedRefunds = [];

      // Process refunds (100%)
      for (const paymentDoc of paymentsSnapshot.docs) {
        const paymentData = paymentDoc.data();

        console.log("💵 Processing refund for:", {
          paymentId: paymentDoc.id,
          odl: paymentData.userId,
          paymentIntentId: paymentData.paymentIntentId,
          amount: paymentData.amount,
        });

        const refundResult = await processRefund(
          stripe,
          paymentData.paymentIntentId,
          1.0,
          "requested_by_customer",
        );

        if (refundResult.success) {
          await paymentDoc.ref.update({
            status: "refunded",
            refundAmount: refundResult.refund.amount,
            refundPercentage: 100,
            refundedAt: new Date().toISOString(),
            refundReason: "event_cancelled_by_host",
          });

          refundResults.push({
            paymentId: paymentDoc.id,
            odl: paymentData.userId,
            amount: refundResult.refund.amount,
          });

          // Notify user
          await db.collection("notifications").add({
            userId: paymentData.userId,
            type: "event_cancelled_refund",
            title: "Event Cancelled - Full Refund",
            message:
              "\"" + eventData.title + "\" was cancelled. Full refund processed.",
            icon: "💰",
            read: false,
            createdAt: new Date().toISOString(),
            metadata: {
              eventId: eventId,
              eventTitle: eventData.title,
              refundAmount: refundResult.refund.amount,
              reason: cancellationReason || "No reason provided",
            },
          });

          console.log("✅ Refund successful for user:", paymentData.userId);
        } else {
          console.log(
            "❌ Refund failed:",
            paymentData.userId,
            refundResult.error,
          );
          failedRefunds.push({
            odl: paymentData.userId,
            error: refundResult.error,
          });
        }
      }

      // Update event status
      await eventRef.update({
        status: "cancelled",
        cancelledAt: new Date().toISOString(),
        cancellationReason: cancellationReason || "No reason provided",
        cancelledBy: userId,
      });

      const logMsg =
        "✅ Event cancelled, " +
        refundResults.length +
        " refunds processed, " +
        failedRefunds.length +
        " failed";
      console.log(logMsg);

      return {
        success: true,
        refundsProcessed: refundResults.length,
        refunds: refundResults,
        failedRefunds: failedRefunds,
        message:
          "Event cancelled. " + refundResults.length + " refunds processed.",
      };
    } catch (error) {
      console.error("❌ Error cancelling event:", error);
      throw new functions.https.HttpsError("internal", error.message);
    }
  },
);

exports.REFUND_POLICY = REFUND_POLICY;
exports.calculateRefundPercentage = calculateRefundPercentage;
