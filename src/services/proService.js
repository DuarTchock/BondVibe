/**
 * Kinlo Pro subscription — opens the hosted Stripe Checkout / Billing Portal.
 * The uid is taken server-side from the auth context; the Stripe webhook flips
 * users/{uid}.isPremium once payment completes.
 */
import { getFunctions, httpsCallable } from "firebase/functions";
import * as WebBrowser from "expo-web-browser";

/**
 * Deep link the Pro return page redirects to on load.
 *
 * This is why "Return to app" was a dead end: openBrowserAsync opens a tab and
 * forgets about it, so nothing watched for the return and the whole burden fell
 * on the user tapping a `kinlo://` link from inside a Custom Tab /
 * SFSafariViewController — a context that routinely refuses custom schemes.
 * openAuthSessionAsync intercepts this URL and closes the browser itself, which
 * is exactly how the Stripe Connect flow already worked (StripeConnectScreen).
 */
const PRO_RETURN_URL = "kinlo://pro/return";

/**
 * Open Pro checkout and wait for the browser session to end.
 *
 * @returns {Promise<{completed: boolean, cancelled: boolean}>} `completed` means
 *   Stripe redirected back through our return page — the flow finished. It does
 *   NOT mean the entitlement landed: Pro is granted by the webhook, which can
 *   arrive after this resolves. Callers must confirm isPremium separately.
 */
export const startProCheckout = async () => {
  const fn = httpsCallable(getFunctions(), "createProCheckoutSession");
  const res = await fn({});
  const url = res.data?.url;
  if (!url) throw new Error("Could not start checkout. Please try again.");

  const result = await WebBrowser.openAuthSessionAsync(url, PRO_RETURN_URL);
  const returnedUrl = (result?.type === "success" && result.url) || "";
  return {
    completed: result?.type === "success" && !returnedUrl.includes("status=cancel"),
    // dismiss = the sheet was swiped away; status=cancel = Stripe's cancel path.
    cancelled: result?.type === "dismiss" || returnedUrl.includes("status=cancel"),
  };
};

export const openProPortal = async () => {
  const fn = httpsCallable(getFunctions(), "createProPortalSession");
  const res = await fn({});
  const url = res.data?.url;
  if (!url) throw new Error("Could not open the billing portal.");
  await WebBrowser.openAuthSessionAsync(url, PRO_RETURN_URL);
};
