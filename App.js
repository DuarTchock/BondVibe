import React, { useEffect } from "react";
import { AuthProvider } from "./src/contexts/AuthContext";
import { StripeProvider } from "@stripe/stripe-react-native";
import { ThemeProvider } from "./src/contexts/ThemeContext";
import AppNavigator from "./src/navigation/AppNavigator";

// Stripe Publishable Key - hardcoded for EAS builds
// This is the TEST key for BondVibe sandbox
const STRIPE_PUBLISHABLE_KEY =
  "pk_test_51SdBpqRZsYFCeXAcmSW4kr8AQpqRK8R9RJIApqlyIu6AMH3fdAWqxWAb6udURsLfVbkjennOcqXLqvux7IBM3R3N00hHaNCeTE";

export default function App() {
  useEffect(() => {
    // Verify Stripe key on app start
    console.log("💳 Stripe Configuration:");
    console.log("  Key length:", STRIPE_PUBLISHABLE_KEY?.length);
    console.log(
      "  Starts with pk_test:",
      STRIPE_PUBLISHABLE_KEY?.startsWith("pk_test_")
    );
    console.log(
      "  Key preview:",
      STRIPE_PUBLISHABLE_KEY?.substring(0, 30) + "..."
    );
  }, []);

  return (
    <AuthProvider>
      <ThemeProvider>
        <StripeProvider
          publishableKey={STRIPE_PUBLISHABLE_KEY}
          merchantIdentifier="merchant.com.bondvibe.app"
          urlScheme="bondvibe"
        >
          <AppNavigator />
        </StripeProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
