/**
 * Crash / error reporting. Safe by design: a no-op until a DSN is configured, so
 * the app behaves identically with no Sentry account. Set the DSN in app.json
 * `extra.SENTRY_DSN` (or EXPO_PUBLIC_SENTRY_DSN). Native crash capture activates
 * on the next native build; JS errors are captured at runtime.
 */
import * as Sentry from "@sentry/react-native";
import Constants from "expo-constants";

const dsn =
  Constants.expoConfig?.extra?.SENTRY_DSN ||
  process.env.EXPO_PUBLIC_SENTRY_DSN ||
  "";

export function initSentry() {
  if (!dsn) return; // no DSN yet → do nothing
  Sentry.init({
    dsn,
    enabled: !__DEV__, // don't report from the dev client / Expo Go
    tracesSampleRate: 0.2,
    sendDefaultPii: false,
  });
}

export { Sentry };
