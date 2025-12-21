import React, { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { AuthProvider } from "./src/contexts/AuthContext";
import { StripeProvider } from "@stripe/stripe-react-native";
import { ThemeProvider } from "./src/contexts/ThemeContext";
import AppNavigator from "./src/navigation/AppNavigator";
import * as Notifications from "expo-notifications";
import { registerPushToken } from "./src/utils/messageService";
import { auth } from "./src/services/firebase";

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Stripe Publishable Key
const STRIPE_PUBLISHABLE_KEY =
  "pk_test_51SdBpqRZsYFCeXAcmSW4kr8AQpqRK8R9RJIApqlyIu6AMH3fdAWqxWAb6udURsLfVbkjennOcqXLqvux7IBM3R3N00hHaNCeTE";

export default function App() {
  const notificationListener = useRef();
  const responseListener = useRef();

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

    // Set up push notifications
    setupPushNotifications();

    // Listen for incoming notifications while app is foregrounded
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("📬 Notification received:", notification);
      });

    // Listen for user interactions with notifications
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("👆 Notification tapped:", response);
        const data = response.notification.request.content.data;

        // Handle navigation based on notification data
        if (data?.type === "event_message" && data?.eventId) {
          // Navigation will be handled by AppNavigator
          console.log("📍 Should navigate to event chat:", data.eventId);
        }
      });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(
          notificationListener.current
        );
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  const setupPushNotifications = async () => {
    try {
      // Request permissions
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.log("⚠️ Push notification permission not granted");
        return;
      }

      console.log("✅ Push notification permission granted");

      // Configure Android channel
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "Default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF6B9D",
          sound: "default",
        });
        console.log("✅ Android notification channel configured");
      }

      // Register push token when user is authenticated
      const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (user) {
          console.log("🔔 Registering push token for user:", user.uid);
          await registerPushToken(user.uid);
        }
      });

      // Cleanup
      return () => unsubscribe();
    } catch (error) {
      console.error("❌ Error setting up push notifications:", error);
    }
  };

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
