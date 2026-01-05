/**
 * Pricing configuration for BondVibe
 * NEW MODEL: User pays fees on top of event price
 * Host receives 100% of their set price
 */

const PRICING_CONFIG = {
  version: "2.0.0",
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

/**
 * Calculate total amount user pays (event price + fees)
 * @param {number} eventPriceCentavos - Event price set by host in centavos
 * @return {object} Complete breakdown
 */
function calculateCheckoutAmount(eventPriceCentavos) {
  const eventPrice = eventPriceCentavos;
  const platformFee = Math.ceil(eventPrice * PRICING_CONFIG.platformFeePercent);
  const subtotal = eventPrice + platformFee;
  const stripeFee = Math.ceil(subtotal * PRICING_CONFIG.stripeFeePercent) +
    PRICING_CONFIG.stripeFeeFixed;
  const totalAmount = eventPrice + platformFee + stripeFee;
  const hostReceives = eventPrice;

  return {
    eventPrice: eventPrice,
    platformFee: platformFee,
    stripeFee: stripeFee,
    totalAmount: totalAmount,
    hostReceives: hostReceives,
    refundableAmount: eventPrice,
    nonRefundableFees: platformFee + stripeFee,
    currency: PRICING_CONFIG.currency,
    feeModel: PRICING_CONFIG.feeModel,
  };
}

/**
 * Calculate payment split for event tickets (for Stripe Connect)
 * @param {number} eventPriceCentavos - Event price in centavos
 * @return {object} Breakdown for payment intent
 */
function calculateEventSplit(eventPriceCentavos) {
  const breakdown = calculateCheckoutAmount(eventPriceCentavos);

  return {
    eventPrice: (breakdown.eventPrice / 100).toFixed(2),
    platformFee: (breakdown.platformFee / 100).toFixed(2),
    stripeFee: (breakdown.stripeFee / 100).toFixed(2),
    totalAmount: (breakdown.totalAmount / 100).toFixed(2),
    hostReceives: (breakdown.hostReceives / 100).toFixed(2),
    totalAmountCentavos: breakdown.totalAmount,
    applicationFee: breakdown.platformFee + breakdown.stripeFee,
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
  calculateCheckoutAmount,
  calculateEventSplit,
  calculateTipSplit,
  getPremiumSubscriptionPrice,
};
