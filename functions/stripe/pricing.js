/**
 * Pricing configuration for BondVibe
 * This is where you control fees and splits
 */

const PRICING_CONFIG = {
  version: "1.0.0",
  currency: "mxn", // Mexican Pesos

  // Platform fees
  platformFeePercent: 0.05, // 5% - MODIFICABLE cuando quieras

  // Stripe fees (Mexico)
  stripeFeePercent: 0.029, // 2.9%
  stripeFeeFixed: 3.00, // $3.00 MXN fixed fee

  // Fee model: who absorbs Stripe fees
  feeModel: "HOST_ABSORBS", // Options: "HOST_ABSORBS" | "USER_PAYS_EXTRA"

  // Minimum amounts (in centavos)
  minimumEventPrice: 5000, // $50 MXN minimum
  minimumTip: 1000, // $10 MXN minimum tip

  // Premium subscription
  premiumSubscription: {
    monthly: 19900, // $199 MXN/month
    interval: "month",
  },
};

/**
 * Calculate payment split for event tickets
 * @param {number} eventPriceCentavos - Event price in centavos (e.g., 50000 = $500 MXN)
 * @return {object} Breakdown of fees and amounts
 */
function calculateEventSplit(eventPriceCentavos) {
  const eventPrice = eventPriceCentavos / 100; // Convert to pesos

  // Calculate Stripe fee
  const stripeFee = (eventPrice * PRICING_CONFIG.stripeFeePercent) + PRICING_CONFIG.stripeFeeFixed;

  // Calculate platform fee on the amount after Stripe fee
  const amountAfterStripeFee = eventPrice - stripeFee;
  const platformFee = amountAfterStripeFee * PRICING_CONFIG.platformFeePercent;

  // Host receives the rest
  const hostReceives = amountAfterStripeFee - platformFee;

  return {
    eventPrice: eventPrice.toFixed(2),
    stripeFee: stripeFee.toFixed(2),
    platformFee: platformFee.toFixed(2),
    hostReceives: hostReceives.toFixed(2),
    currency: PRICING_CONFIG.currency,
    feeModel: PRICING_CONFIG.feeModel,
  };
}

/**
 * Calculate tip split (no platform fee, only Stripe fee)
 * @param {number} tipCentavos - Tip amount in centavos
 * @return {object} Breakdown of tip
 */
function calculateTipSplit(tipCentavos) {
  const tipAmount = tipCentavos / 100;

  const stripeFee = (tipAmount * PRICING_CONFIG.stripeFeePercent) + PRICING_CONFIG.stripeFeeFixed;
  const hostReceives = tipAmount - stripeFee;

  return {
    tipAmount: tipAmount.toFixed(2),
    stripeFee: stripeFee.toFixed(2),
    hostReceives: hostReceives.toFixed(2),
    platformFee: 0, // No platform fee on tips
    currency: PRICING_CONFIG.currency,
  };
}

/**
 * Get premium subscription price
 * @return {object} Subscription details
 */
function getPremiumSubscriptionPrice() {
  return {
    amountCentavos: PRICING_CONFIG.premiumSubscription.monthly,
    amountPesos: (PRICING_CONFIG.premiumSubscription.monthly / 100).toFixed(2),
    interval: PRICING_CONFIG.premiumSubscription.interval,
    currency: PRICING_CONFIG.currency,
  };
}

module.exports = {
  PRICING_CONFIG,
  calculateEventSplit,
  calculateTipSplit,
  getPremiumSubscriptionPrice,
};
