import React from "react";
import { AuthProvider } from "./src/contexts/AuthContext";
import { StripeProvider } from "@stripe/stripe-react-native";
import { ThemeProvider } from "./src/contexts/ThemeContext";
import AppNavigator from "./src/navigation/AppNavigator";

// Stripe Publishable Key
const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
          <AppNavigator />
        </StripeProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
