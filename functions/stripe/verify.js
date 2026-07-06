/**
 * Authoritative paid-host verification. The `stripeConnect.chargesEnabled` /
 * `hostConfig.canCreatePaidEvents` flags stored on the user doc are
 * client-forgeable (an owner can PATCH their own doc), so payment-creating
 * functions must NOT trust them — they ask Stripe directly whether the
 * connected account can actually accept charges.
 */

/**
 * Throw unless the connected Stripe account can accept charges right now.
 * @param {object} stripe an initialized Stripe client
 * @param {string} accountId the host's Stripe Connect account id
 * @return {Promise<object>} the retrieved Stripe account
 */
async function assertCanCharge(stripe, accountId) {
  if (!accountId) {
    const e = new Error("host_stripe_not_connected");
    e.code = "host_stripe_not_connected";
    throw e;
  }
  let account;
  try {
    account = await stripe.accounts.retrieve(accountId);
  } catch (err) {
    const e = new Error("host_stripe_account_invalid");
    e.code = "host_stripe_account_invalid";
    throw e;
  }
  if (!account.charges_enabled) {
    const e = new Error("host_charges_not_enabled");
    e.code = "host_charges_not_enabled";
    throw e;
  }
  return account;
}

module.exports = {assertCanCharge};
