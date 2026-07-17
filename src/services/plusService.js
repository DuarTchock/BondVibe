/**
 * Kinlo Plus subscription (attendee) — opens the hosted Stripe Checkout /
 * Billing Portal. Mirrors proService. The Stripe webhook flips
 * users/{uid}.plan to "kinlo_plus" on success. (The createPlusCheckoutSession
 * Cloud Function is wired in Block 2.5.)
 */
import { getFunctions, httpsCallable } from "firebase/functions";
import * as WebBrowser from "expo-web-browser";

// Same reason as proService: openBrowserAsync never watches for the return,
// so "Return to app" depended on a custom-scheme tap that Custom Tabs /
// SFSafariViewController routinely refuse. openAuthSessionAsync intercepts.
const PLUS_RETURN_URL = "kinlo://plus/return";

export const startPlusCheckout = async () => {
  const fn = httpsCallable(getFunctions(), "createPlusCheckoutSession");
  const res = await fn({});
  const url = res.data?.url;
  if (!url) throw new Error("Could not start checkout. Please try again.");
  await WebBrowser.openAuthSessionAsync(url, PLUS_RETURN_URL);
};

export const openPlusPortal = async () => {
  const fn = httpsCallable(getFunctions(), "createPlusPortalSession");
  const res = await fn({});
  const url = res.data?.url;
  if (!url) throw new Error("Could not open the billing portal.");
  await WebBrowser.openAuthSessionAsync(url, PLUS_RETURN_URL);
};
