/**
 * Client-side pricing estimate.
 *
 * The SERVER (functions/stripe/pricing.js) is the source of truth for what is
 * actually charged — these constants mirror it only to show the buyer an
 * estimated breakdown before the PaymentIntent is created. Keep them in sync
 * with functions/stripe/pricing.js (PRICING_CONFIG).
 *
 * Model: USER_PAYS_FEES — the buyer pays the price plus platform + processing
 * fees on top; the host receives 100% of the price they set.
 */

export const PRICING = {
  platformFeePercent: 0.05,
  stripeFeePercent: 0.029,
  stripeFeeFixedCentavos: 300,
  currency: "MXN",
};

/**
 * Estimate the fee breakdown for a given base price.
 * @param {number} baseCentavos - price set by the host, in centavos
 * @returns {{baseCentavos:number, platformFeeCentavos:number,
 *            stripeFeeCentavos:number, totalCentavos:number}}
 */
export const estimateCheckout = (baseCentavos) => {
  const base = Math.max(0, Math.round(Number(baseCentavos) || 0));
  const platformFee = Math.ceil(base * PRICING.platformFeePercent);
  const stripeFee =
    Math.ceil((base + platformFee) * PRICING.stripeFeePercent) +
    PRICING.stripeFeeFixedCentavos;
  return {
    baseCentavos: base,
    platformFeeCentavos: platformFee,
    stripeFeeCentavos: stripeFee,
    totalCentavos: base + platformFee + stripeFee,
  };
};

/**
 * Format centavos as a MXN currency string.
 * @param {number} centavos
 * @returns {string}
 */
export const formatCentavos = (centavos) => {
  const pesos = (Number(centavos) || 0) / 100;
  return `$${pesos.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} MXN`;
};
