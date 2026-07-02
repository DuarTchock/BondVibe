/**
 * Pricing configuration for BondVibe
 * NEW MODEL: User pays fees on top of event price
 * Host receives 100% of their set price
 */

const PRICING_CONFIG = {
  version: "2.1.0",
  currency: "mxn",
  platformFeePercent: 0.05,
  stripeFeePercent: 0.029,
  stripeFeeFixed: 300,
  feeModel: "USER_PAYS_FEES",
  minimumEventPrice: 5000,
  minimumTip: 1000,
  refundPolicy: {
    feesRefundable: false,
  },
};

// Processing fee per payout processor (the buyer pays this on top so the host
// receives 100%). Rates are approximate — confirm current rates per processor;
// IVA may apply on the commission in Mexico.
const PROCESSOR_FEES = {
  stripe: {percent: 0.029, fixedCentavos: 300},
  mercadopago: {percent: 0.0349, fixedCentavos: 0},
};

/**
 * Read admin-configurable pricing knobs from Firestore (config/pricing),
 * falling back to the built-in defaults. One cheap read per checkout.
 * @param {object} db - admin.firestore() instance
 * @return {Promise<{eventPlatformFeePercent:number,
 *   rentalPlatformFeePercent:number, stripeFeePercent:number,
 *   stripeFixedCentavos:number}>}
 */
async function getPricingConfig(db) {
  const defaults = {
    eventPlatformFeePercent: PRICING_CONFIG.platformFeePercent,
    rentalPlatformFeePercent: PRICING_CONFIG.platformFeePercent,
    stripeFeePercent: PROCESSOR_FEES.stripe.percent,
    stripeFixedCentavos: PROCESSOR_FEES.stripe.fixedCentavos,
  };
  try {
    const snap = await db.collection("config").doc("pricing").get();
    if (!snap.exists) return defaults;
    const d = snap.data() || {};
    return {
      eventPlatformFeePercent: Number.isFinite(d.eventPlatformFeePercent) ?
        d.eventPlatformFeePercent : defaults.eventPlatformFeePercent,
      rentalPlatformFeePercent: Number.isFinite(d.rentalPlatformFeePercent) ?
        d.rentalPlatformFeePercent : defaults.rentalPlatformFeePercent,
      stripeFeePercent: Number.isFinite(d.stripeFeePercent) ?
        d.stripeFeePercent : defaults.stripeFeePercent,
      stripeFixedCentavos: Number.isFinite(d.stripeFixedCentavos) ?
        d.stripeFixedCentavos : defaults.stripeFixedCentavos,
    };
  } catch (e) {
    return defaults;
  }
}

/**
 * Calculate total amount user pays (event price + fees), processor-aware.
 * @param {number} eventPriceCentavos - Event price set by host in centavos
 * @param {string} [processor="stripe"] - Host payout processor
 * @param {object} [overrides] - Admin-configurable rate overrides:
 *   { platformFeePercent, processorPercent, processorFixed }
 * @return {object} Complete breakdown
 */
function calculateCheckoutAmount(eventPriceCentavos, processor = "stripe", overrides = {}) {
  const eventPrice = eventPriceCentavos;
  const platformFeePercent = Number.isFinite(overrides.platformFeePercent) ?
    overrides.platformFeePercent : PRICING_CONFIG.platformFeePercent;
  const platformFee = Math.ceil(eventPrice * platformFeePercent);
  const subtotal = eventPrice + platformFee;
  const base = PROCESSOR_FEES[processor] || PROCESSOR_FEES.stripe;
  const pPercent = Number.isFinite(overrides.processorPercent) ?
    overrides.processorPercent : base.percent;
  const pFixed = Number.isFinite(overrides.processorFixed) ?
    overrides.processorFixed : base.fixedCentavos;
  const processorFee = Math.ceil(subtotal * pPercent) + pFixed;
  const totalAmount = eventPrice + platformFee + processorFee;
  const hostReceives = eventPrice;

  return {
    eventPrice: eventPrice,
    platformFee: platformFee,
    processor: processor,
    processorFee: processorFee,
    // Alias kept so existing callers reading stripeFee keep working.
    stripeFee: processorFee,
    totalAmount: totalAmount,
    hostReceives: hostReceives,
    refundableAmount: eventPrice,
    nonRefundableFees: platformFee + processorFee,
    currency: PRICING_CONFIG.currency,
    feeModel: PRICING_CONFIG.feeModel,
  };
}

/**
 * Calculate payment split for event tickets (for Stripe Connect)
 * @param {number} eventPriceCentavos - Event price in centavos
 * @param {string} [processor="stripe"] - Host payout processor
 * @return {object} Breakdown for payment intent
 */
function calculateEventSplit(eventPriceCentavos, processor = "stripe") {
  const breakdown = calculateCheckoutAmount(eventPriceCentavos, processor);

  return {
    eventPrice: (breakdown.eventPrice / 100).toFixed(2),
    platformFee: (breakdown.platformFee / 100).toFixed(2),
    processor: breakdown.processor,
    processorFee: (breakdown.processorFee / 100).toFixed(2),
    stripeFee: (breakdown.stripeFee / 100).toFixed(2),
    totalAmount: (breakdown.totalAmount / 100).toFixed(2),
    hostReceives: (breakdown.hostReceives / 100).toFixed(2),
    totalAmountCentavos: breakdown.totalAmount,
    applicationFee: breakdown.platformFee + breakdown.processorFee,
    transferAmount: breakdown.hostReceives,
    refundableAmount: (breakdown.refundableAmount / 100).toFixed(2),
    nonRefundableFees: (breakdown.nonRefundableFees / 100).toFixed(2),
    currency: breakdown.currency,
    feeModel: breakdown.feeModel,
  };
}

/**
 * Calculate tip split (no platform fee, only Stripe fee paid by user)
 * @param {number} tipCentavos - Tip amount in centavos
 * @return {object} Breakdown of tip
 */
function calculateTipSplit(tipCentavos) {
  const tipAmount = tipCentavos;
  const stripeFee = Math.ceil(tipAmount * PRICING_CONFIG.stripeFeePercent) +
    PRICING_CONFIG.stripeFeeFixed;
  const totalAmount = tipAmount + stripeFee;

  return {
    tipAmount: (tipAmount / 100).toFixed(2),
    stripeFee: (stripeFee / 100).toFixed(2),
    totalAmount: (totalAmount / 100).toFixed(2),
    hostReceives: (tipAmount / 100).toFixed(2),
    platformFee: "0.00",
    totalAmountCentavos: totalAmount,
    currency: PRICING_CONFIG.currency,
  };
}

/**
 * Get premium subscription price
 * @return {object} Subscription price details
 */
function getPremiumSubscriptionPrice() {
  return {
    amountCentavos: 19900,
    amountPesos: "199.00",
    interval: "month",
    currency: PRICING_CONFIG.currency,
  };
}

module.exports = {
  PRICING_CONFIG,
  PROCESSOR_FEES,
  calculateCheckoutAmount,
  calculateEventSplit,
  calculateTipSplit,
  getPremiumSubscriptionPrice,
  getPricingConfig,
};
