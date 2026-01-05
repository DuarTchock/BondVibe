const fs = require('fs');

const refundsPath = 'functions/stripe/refunds.js';
let content = fs.readFileSync(refundsPath, 'utf8');

// Actualizar la función processRefund para usar el nuevo modelo
const oldProcessRefund = `async function processRefund(
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

    // ✅ NEW: Calculate Stripe fee (non-refundable)
    const stripeFee = calculateStripeFee(originalAmount);

    // ✅ NEW: Refundable amount = original amount - Stripe fee
    const refundableAmount = originalAmount - stripeFee;

    console.log("💵 Fee breakdown:", {
      originalAmount: originalAmount,
      stripeFee: stripeFee,
      refundableAmount: refundableAmount,
      stripeFeesRefundable: REFUND_POLICY.STRIPE_FEES_REFUNDABLE,
    });

    // Calculate refund based on refundable amount
    const maxRefundable = refundableAmount - alreadyRefunded;
    const desiredRefund = Math.floor(refundableAmount * refundPercentage);
    const refundAmount = Math.min(desiredRefund, maxRefundable);

    if (refundAmount <= 0) {
      return {
        success: false,
        error: "No refund available",
        refundPercentage: 0,
        stripeFeeRetained: stripeFee,
      };
    }

    console.log("💵 Refund calculation:", {
      originalAmount: originalAmount,
      stripeFee: stripeFee,
      refundableAmount: refundableAmount,
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
        stripe_fee_retained: stripeFee,
        refundable_amount: refundableAmount,
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
        stripeFeeRetained: stripeFee,
        refundableAmount: refundableAmount,
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
}`;

const newProcessRefund = `async function processRefund(
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

    const metadata = paymentIntent.metadata || {};
    const totalPaid = paymentIntent.amount;
    const alreadyRefunded = paymentIntent.amount_refunded || 0;

    // NEW MODEL: Only event price is refundable (fees are NOT refundable)
    // Get eventPrice from metadata (what host set)
    let eventPrice = parseInt(metadata.eventPrice) || 0;
    
    // Fallback for old payments without new metadata
    if (!eventPrice) {
      // Old model: calculate based on total - fees
      const stripeFee = calculateStripeFee(totalPaid);
      eventPrice = totalPaid - stripeFee;
    }

    const platformFee = parseInt(metadata.platformFee) || 0;
    const stripeFee = parseInt(metadata.stripeFee) || calculateStripeFee(totalPaid);
    const nonRefundableFees = platformFee + stripeFee;

    console.log("💵 NEW Fee breakdown:", {
      totalPaid: totalPaid,
      eventPrice: eventPrice,
      platformFee: platformFee,
      stripeFee: stripeFee,
      nonRefundableFees: nonRefundableFees,
      refundableAmount: eventPrice,
      feeModel: metadata.feeModel || "LEGACY",
    });

    // Only the event price is refundable
    const refundableAmount = eventPrice;
    const maxRefundable = Math.max(0, refundableAmount - alreadyRefunded);
    const desiredRefund = Math.floor(refundableAmount * refundPercentage);
    const refundAmount = Math.min(desiredRefund, maxRefundable);

    if (refundAmount <= 0) {
      return {
        success: false,
        error: "No refund available",
        refundPercentage: 0,
        feesRetained: nonRefundableFees,
      };
    }

    console.log("💵 Refund calculation:", {
      totalPaid: totalPaid,
      eventPrice: eventPrice,
      refundableAmount: refundableAmount,
      alreadyRefunded: alreadyRefunded,
      maxRefundable: maxRefundable,
      desiredRefund: desiredRefund,
      refundAmount: refundAmount,
      feesRetained: nonRefundableFees,
    });

    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: refundAmount,
      reason: reason || "requested_by_customer",
      metadata: {
        refund_percentage: refundPercentage * 100,
        total_paid: totalPaid,
        event_price: eventPrice,
        refunded_amount: refundAmount,
        fees_retained: nonRefundableFees,
        fee_model: "USER_PAYS_FEES",
      },
    });

    console.log("✅ Refund created:", refund.id);

    return {
      success: true,
      refund: {
        id: refund.id,
        amount: refundAmount,
        percentage: refundPercentage * 100,
        totalPaid: totalPaid,
        eventPrice: eventPrice,
        feesRetained: nonRefundableFees,
        refundableAmount: refundableAmount,
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
}`;

content = content.replace(oldProcessRefund, newProcessRefund);
fs.writeFileSync(refundsPath, content);
console.log('✅ Updated processRefund in functions/stripe/refunds.js');
