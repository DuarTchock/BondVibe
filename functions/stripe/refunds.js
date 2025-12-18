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
    DAYS_7_PLUS: 1.0, // 100% refund
    DAYS_3_TO_7: 0.5, // 50% refund
    DAYS_LESS_3: 0.0, // Sin refund
  },
  HOST_CANCELLATION: 1.0, // Siempre 100%
  MIN_REFUND_HOURS: 2, // Tiempo mínimo para procesar
};

// ============================================
// CALCULATE REFUND PERCENTAGE
// ============================================
/**
 * Calculate refund percentage based on cancellation timing
 * @param {string} eventDate - ISO date string of the event
 * @param {string} cancelledBy - 'user' or 'host'
 * @return {number} Refund percentage (0.0 to 1.0)
 */
function calculateRefundPercentage(eventDate, cancelledBy) {
  const now = new Date();
  const eventDateTime = new Date(eventDate);
  const hoursUntilEvent = (eventDateTime - now) / (1000 * 60 * 60);
  const daysUntilEvent = hoursUntilEvent / 24;

  // Si el host cancela → siempre 100%
  if (cancelledBy === "host") {
    return REFUND_POLICY.HOST_CANCELLATION;
  }

  // Usuario cancela
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
      paymentIntentId,
      refundPercentage,
      reason,
    });

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (!paymentIntent) {
      throw new Error("Payment Intent not found");
    }

    if (
      paymentIntent.status === "canceled" ||
      paymentIntent.amount_refunded > 0
    ) {
      return {
        success: false,
        error: "Payment already refunded",
      };
    }

    const originalAmount = paymentIntent.amount;
    const refundAmount = Math.floor(originalAmount * refundPercentage);

    if (refundAmount === 0) {
      return {
        success: false,
        error: "No refund available based on cancellation policy",
        refundPercentage: 0,
      };
    }

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
    // Verificar autenticación
    if (!request.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Must be authenticated",
      );
    }

    const {eventId} = request.data;
    const userId = request.auth.uid;

    console.log("🚫 User cancelling attendance:", {eventId, userId});

    try {
      // Initialize Stripe
      const stripe = require("stripe")(stripeSecretKey.value());

      const eventRef = db.collection("events").doc(eventId);
      const eventDoc = await eventRef.get();

      if (!eventDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Event not found");
      }

      const eventData = eventDoc.data();
      const attendees = eventData.attendees || [];
      const attendeeIndex = attendees.indexOf(userId);

      if (attendeeIndex === -1) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "User is not attending this event",
        );
      }

      // Buscar pago del usuario
      const paymentsSnapshot = await db
        .collection("payments")
        .where("eventId", "==", eventId)
        .where("userId", "==", userId)
        .where("status", "==", "succeeded")
        .limit(1)
        .get();

      if (paymentsSnapshot.empty) {
        // Evento gratuito - solo remover
        attendees.splice(attendeeIndex, 1);
        await eventRef.update({attendees});

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

      // Calcular refund
      const refundPercentage = calculateRefundPercentage(
        eventData.date,
        "user",
      );
      console.log("📊 Refund percentage:", refundPercentage * 100 + "%");

      // Procesar refund
      const refundResult = await processRefund(
        stripe,
        paymentIntentId,
        refundPercentage,
        "requested_by_customer",
      );

      // Remover del evento
      attendees.splice(attendeeIndex, 1);
      await eventRef.update({attendees});

      // Actualizar pago
      await paymentDoc.ref.update({
        status: refundResult.success ? "refunded" : "succeeded",
        refundAmount: refundResult.refund?.amount || 0,
        refundPercentage: refundPercentage * 100,
        refundedAt: refundResult.success ? new Date().toISOString() : null,
      });

      // Notificar al host
      if (eventData.creatorId) {
        const userDoc = await db.collection("users").doc(userId).get();
        const userName = userDoc.data()?.fullName || "Someone";

        const refundMessage =
          refundPercentage > 0 ?
            `Refund: ${refundPercentage * 100}%` :
            "No refund";

        await db.collection("notifications").add({
          userId: eventData.creatorId,
          type: "attendee_cancelled",
          title: "Attendee Cancelled",
          message: `${userName} cancelled for "${eventData.title}". ${refundMessage}`,
          icon: "🚫",
          read: false,
          createdAt: new Date().toISOString(),
          metadata: {
            eventId,
            eventTitle: eventData.title,
            refundPercentage: refundPercentage * 100,
          },
        });
      }

      console.log("✅ Cancellation complete");

      const resultMessage =
        refundPercentage > 0 ?
          `Refund of ${refundPercentage * 100}% processed` :
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
    // Verificar autenticación
    if (!request.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Must be authenticated",
      );
    }

    const {eventId, cancellationReason} = request.data;
    const userId = request.auth.uid;

    console.log("🏠 Host cancelling event:", {
      eventId,
      userId,
      reason: cancellationReason,
    });

    try {
      // Initialize Stripe
      const stripe = require("stripe")(stripeSecretKey.value());

      const eventRef = db.collection("events").doc(eventId);
      const eventDoc = await eventRef.get();

      if (!eventDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Event not found");
      }

      const eventData = eventDoc.data();

      // Verificar permisos
      if (eventData.creatorId !== userId) {
        const userDoc = await db.collection("users").doc(userId).get();
        const userData = userDoc.data();

        if (userData?.role !== "admin") {
          throw new functions.https.HttpsError(
            "permission-denied",
            "Only host or admin can cancel",
          );
        }
      }

      // Obtener todos los pagos
      const paymentsSnapshot = await db
        .collection("payments")
        .where("eventId", "==", eventId)
        .where("status", "==", "succeeded")
        .get();

      const refundResults = [];

      // Procesar refunds (100%)
      for (const paymentDoc of paymentsSnapshot.docs) {
        const paymentData = paymentDoc.data();

        const refundResult = await processRefund(
          stripe,
          paymentData.paymentIntentId,
          1.0,
          "requested_by_host",
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
            userId: paymentData.userId,
            amount: refundResult.refund.amount,
          });

          // Notificar usuario
          await db.collection("notifications").add({
            userId: paymentData.userId,
            type: "event_cancelled_refund",
            title: "Event Cancelled - Full Refund",
            message: `"${eventData.title}" was cancelled. Full refund processed.`,
            icon: "💰",
            read: false,
            createdAt: new Date().toISOString(),
            metadata: {
              eventId,
              eventTitle: eventData.title,
              refundAmount: refundResult.refund.amount,
              reason: cancellationReason,
            },
          });
        }
      }

      // Actualizar evento
      await eventRef.update({
        status: "cancelled",
        cancelledAt: new Date().toISOString(),
        cancellationReason: cancellationReason || "No reason provided",
        cancelledBy: userId,
      });

      console.log(
        `✅ Event cancelled, ${refundResults.length} refunds processed`,
      );

      return {
        success: true,
        refundsProcessed: refundResults.length,
        refunds: refundResults,
        message: `Event cancelled. ${refundResults.length} refunds processed.`,
      };
    } catch (error) {
      console.error("❌ Error cancelling event:", error);
      throw new functions.https.HttpsError("internal", error.message);
    }
  },
);

exports.REFUND_POLICY = REFUND_POLICY;
exports.calculateRefundPercentage = calculateRefundPercentage;
