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

// Processing fee per payout processor. The buyer pays this on top so the host
// receives 100% of their price. Rates are approximate — confirm current rates
// per processor (and note IVA may apply on the commission in Mexico).
export const PROCESSOR_FEES = {
  stripe: { percent: 0.029, fixedCentavos: 300 },
  mercadopago: { percent: 0.0349, fixedCentavos: 0 },
};

export const PRICING = {
  platformFeePercent: 0.05,
  currency: "MXN",
  // Kept for backwards-compatibility with older callers/tests.
  stripeFeePercent: 0.029,
  stripeFeeFixedCentavos: 300,
};

/**
 * Estimate the fee breakdown for a given base price and payout processor.
 * @param {number} baseCentavos - price set by the host, in centavos
 * @param {"stripe"|"mercadopago"} [processor="stripe"] - host payout processor
 * @returns {{baseCentavos:number, platformFeeCentavos:number,
 *            processorFeeCentavos:number, stripeFeeCentavos:number,
 *            processor:string, totalCentavos:number}}
 */
export const estimateCheckout = (baseCentavos, processor = "stripe") => {
  const base = Math.max(0, Math.round(Number(baseCentavos) || 0));
  const platformFee = Math.ceil(base * PRICING.platformFeePercent);
  const fee = PROCESSOR_FEES[processor] || PROCESSOR_FEES.stripe;
  const processorFee =
    Math.ceil((base + platformFee) * fee.percent) + fee.fixedCentavos;
  return {
    baseCentavos: base,
    platformFeeCentavos: platformFee,
    processorFeeCentavos: processorFee,
    // Alias kept so existing UI reading stripeFeeCentavos keeps working.
    stripeFeeCentavos: processorFee,
    processor,
    totalCentavos: base + platformFee + processorFee,
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
