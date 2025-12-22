/**
 * Platform Configuration for BondVibe
 * Centralized config for fees, limits, and business rules
 */

const PLATFORM_CONFIG = {
  version: "2.0.0",
  currency: "mxn", // Mexican Pesos

  // ===================================
  // PLATFORM FEE (FÁCIL DE MODIFICAR)
  // ===================================
  platformFeePercent: 0.05, // 5% - CAMBIAR AQUÍ PARA AJUSTAR COMISIÓN

  // ===================================
  // STRIPE FEES (MEXICO)
  // ===================================
  stripeFeePercent: 0.036, // 3.6% for Mexico
  stripeFeeFixed: 300, // $3.00 MXN (in centavos)

  // ===================================
  // MINIMUM AMOUNTS (in centavos)
  // ===================================
  minimumEventPrice: 5000, // $50 MXN minimum
  minimumTip: 1000, // $10 MXN minimum tip

  // ===================================
  // REFUND POLICY
  // ===================================
  refundPolicy: {
    userCancellation: {
      days7Plus: 1.0, // 100% refund
      days3To7: 0.5, // 50% refund
      daysLess3: 0.0, // No refund
    },
    hostCancellation: 1.0, // Always 100% refund
    minRefundHours: 2,
  },

  // ===================================
  // PREMIUM SUBSCRIPTION
  // ===================================
  premiumSubscription: {
    monthly: 19900, // $199 MXN/month
    interval: "month",
  },
};

/**
 * Calculate platform fee in centavos
 * @param {number} amountCentavos - Amount in centavos
 * @return {number} Platform fee in centavos
 */
function calculatePlatformFee(amountCentavos) {
  return Math.round(amountCentavos * PLATFORM_CONFIG.platformFeePercent);
}

/**
 * Calculate what host receives after platform fee
 * @param {number} amountCentavos - Total amount in centavos
 * @return {object} Breakdown
 */
function calculateHostReceives(amountCentavos) {
  const platformFee = calculatePlatformFee(amountCentavos);
  const hostReceives = amountCentavos - platformFee;

  return {
    total: amountCentavos,
    platformFee: platformFee,
    hostReceives: hostReceives,
    platformFeePercent: PLATFORM_CONFIG.platformFeePercent * 100,
  };
}

module.exports = {
  PLATFORM_CONFIG,
  calculatePlatformFee,
  calculateHostReceives,
};
