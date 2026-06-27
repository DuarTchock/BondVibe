/**
 * Featured-event promotion plans (platform-owned catalog).
 * The platform keeps 100% of these fees — they are NOT split with the host.
 */

const PROMOTION_PLANS = {
  feat_7: {id: "feat_7", days: 7, priceCentavos: 9900, tier: "standard", label: "7 days featured"},
  feat_14: {id: "feat_14", days: 14, priceCentavos: 17900, tier: "standard", label: "14 days featured"},
  feat_30: {id: "feat_30", days: 30, priceCentavos: 29900, tier: "standard", label: "30 days featured"},
};

/**
 * Look up a promotion plan by id.
 * @param {string} planId
 * @return {object|null}
 */
function getPromotionPlan(planId) {
  return PROMOTION_PLANS[planId] || null;
}

module.exports = {PROMOTION_PLANS, getPromotionPlan};
