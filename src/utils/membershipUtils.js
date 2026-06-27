/**
 * Pure membership helpers — no Firebase imports, so they are trivially unit
 * testable and reusable on both client and (logic-mirrored) server side.
 */

export const MEMBERSHIP_PLAN_TYPES = {
  CREDITS: "credits",
  UNLIMITED: "unlimited",
};

/**
 * Normalize a Firestore Timestamp | {seconds} | Date | ISO string to millis.
 * @param {*} ts
 * @returns {number}
 */
export const toMillis = (ts) => {
  if (!ts) return 0;
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (typeof ts.seconds === "number") return ts.seconds * 1000;
  const ms = new Date(ts).getTime();
  return Number.isFinite(ms) ? ms : 0;
};

/**
 * Validate plan input before writing.
 * @param {object} data
 * @returns {string|null} error message, or null if valid
 */
export const validatePlanInput = (data) => {
  if (!data.name || !data.name.trim()) return "Plan name is required.";
  if (!data.priceCentavos || data.priceCentavos <= 0) {
    return "Price must be greater than zero.";
  }
  if (!data.validityDays || data.validityDays <= 0) {
    return "Validity (in days) must be greater than zero.";
  }
  if (data.type === MEMBERSHIP_PLAN_TYPES.CREDITS) {
    if (!data.creditsIncluded || data.creditsIncluded <= 0) {
      return "A credit pack must include at least one credit.";
    }
  } else if (data.type !== MEMBERSHIP_PLAN_TYPES.UNLIMITED) {
    return "Invalid plan type.";
  }
  return null;
};

/**
 * Derive a membership's usable state from its data.
 * @param {object} m membership
 * @param {number} [nowMs] current time (injectable for testing)
 * @returns {"active"|"expired"|"depleted"}
 */
export const getMembershipState = (m, nowMs = Date.now()) => {
  if (!m) return "expired";
  if (toMillis(m.expiresAt) < nowMs) return "expired";
  if (
    m.type === MEMBERSHIP_PLAN_TYPES.CREDITS &&
    (m.creditsRemaining || 0) <= 0
  ) {
    return "depleted";
  }
  return "active";
};

/**
 * Convert a membership's expiry to a JS Date.
 * @param {object} m
 * @returns {Date|null}
 */
export const getMembershipExpiryDate = (m) => {
  const ms = toMillis(m?.expiresAt);
  return ms ? new Date(ms) : null;
};

/**
 * Format centavos as a MXN price string.
 * @param {number} centavos
 * @returns {string}
 */
export const formatPlanPrice = (centavos) => {
  const pesos = (Number(centavos) || 0) / 100;
  return `$${pesos.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} MXN`;
};

/**
 * Human summary of what a plan includes.
 * @param {object} plan
 * @returns {string}
 */
export const describePlan = (plan) => {
  if (!plan) return "";
  const validity = `${plan.validityDays} days`;
  if (plan.type === MEMBERSHIP_PLAN_TYPES.UNLIMITED) {
    return `Unlimited classes · valid ${validity}`;
  }
  const credits = plan.creditsIncluded;
  return `${credits} class${credits === 1 ? "" : "es"} · valid ${validity}`;
};
