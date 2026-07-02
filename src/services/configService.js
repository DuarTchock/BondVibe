/**
 * App configuration (admin-tunable pricing knobs) stored at config/pricing.
 *
 * Read by checkout screens so the fee estimate shown matches what the server
 * charges; written only by admins (enforced by Firestore rules). Values mirror
 * the server defaults in functions/stripe/pricing.js.
 */
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { PRICING, PROCESSOR_FEES } from "../utils/pricing";
import { logger } from "../utils/logger";

export const PRICING_DEFAULTS = {
  eventPlatformFeePercent: PRICING.platformFeePercent,
  rentalPlatformFeePercent: PRICING.platformFeePercent,
  stripeFeePercent: PROCESSOR_FEES.stripe.percent,
  stripeFixedCentavos: PROCESSOR_FEES.stripe.fixedCentavos,
};

const num = (v, fallback) => (Number.isFinite(Number(v)) ? Number(v) : fallback);

/** Read the pricing config, falling back to defaults for any missing field. */
export const getPricingConfig = async () => {
  try {
    const snap = await getDoc(doc(db, "config", "pricing"));
    const d = snap.exists() ? snap.data() : {};
    return {
      eventPlatformFeePercent: num(d.eventPlatformFeePercent, PRICING_DEFAULTS.eventPlatformFeePercent),
      rentalPlatformFeePercent: num(d.rentalPlatformFeePercent, PRICING_DEFAULTS.rentalPlatformFeePercent),
      stripeFeePercent: num(d.stripeFeePercent, PRICING_DEFAULTS.stripeFeePercent),
      stripeFixedCentavos: num(d.stripeFixedCentavos, PRICING_DEFAULTS.stripeFixedCentavos),
    };
  } catch (e) {
    logger.error("getPricingConfig:", e);
    return { ...PRICING_DEFAULTS };
  }
};

/** Admin-only: persist pricing knobs (Firestore rules enforce admin). */
export const updatePricingConfig = async (values) => {
  await setDoc(
    doc(db, "config", "pricing"),
    {
      eventPlatformFeePercent: num(values.eventPlatformFeePercent, PRICING_DEFAULTS.eventPlatformFeePercent),
      rentalPlatformFeePercent: num(values.rentalPlatformFeePercent, PRICING_DEFAULTS.rentalPlatformFeePercent),
      stripeFeePercent: num(values.stripeFeePercent, PRICING_DEFAULTS.stripeFeePercent),
      stripeFixedCentavos: Math.round(num(values.stripeFixedCentavos, PRICING_DEFAULTS.stripeFixedCentavos)),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
};

/** Build the estimateCheckout overrides object for a given fee bucket. */
export const overridesFor = (cfg, bucket) => {
  if (!cfg) return {};
  return {
    platformFeePercent:
      bucket === "rental" ? cfg.rentalPlatformFeePercent : cfg.eventPlatformFeePercent,
    processorPercent: cfg.stripeFeePercent,
    processorFixed: cfg.stripeFixedCentavos,
  };
};
