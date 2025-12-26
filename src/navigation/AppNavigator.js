import React, { useState, useEffect, forwardRef } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { ActivityIndicator, View } from "react-native";

// Contexts
import { useAuthContext } from "../contexts/AuthContext";

// Components
import SuccessModal from "../components/SuccessModal";

// Auth Screens
import LoginScreen from "../screens/LoginScreen";
import SignupScreen from "../screens/SignupScreen";
import LegalScreen from "../screens/LegalScreen";
import ProfileSetupScreen from "../screens/ProfileSetupScreen";

// Main Screens
import HomeScreen from "../screens/HomeScreen";
import SearchEventsScreen from "../screens/SearchEventsScreen";
import EventDetailScreen from "../screens/EventDetailScreen";
import CreateEventScreen from "../screens/CreateEventScreen";
import EditEventScreen from "../screens/EditEventScreen";
import MyEventsScreen from "../screens/MyEventsScreen";
import ProfileScreen from "../screens/ProfileScreen";
import PersonalityQuizScreen from "../screens/PersonalityQuizScreen";
import PersonalityResultsScreen from "../screens/PersonalityResultsScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import EventChatScreen from "../screens/EventChatScreen";
import RequestHostScreen from "../screens/RequestHostScreen";
import AdminDashboardScreen from "../screens/AdminDashboardScreen";

// Payment Screens
import CheckoutScreen from "../screens/payment/CheckoutScreen";

// Stripe Connect Screens
import HostTypeSelectionScreen from "../screens/HostTypeSelectionScreen";
import StripeConnectScreen from "../screens/StripeConnectScreen";

const Stack = createNativeStackNavigator();

// ✅ UPDATED: Use forwardRef to expose navigation ref to App.js
const AppNavigator = forwardRef((props, ref) => {
  const { signupInProgress } = useAuthContext();
  const [initialUser, setInitialUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState("Login");
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showUserNotFoundModal, setShowUserNotFoundModal] = useState(false);
  const [auth, setAuth] = useState(null);
  const [db, setDb] = useState(null);

  // Initialize Firebase dynamically
  useEffect(() => {
    console.log("🔥 Initializing Firebase...");

    const initFirebase = async () => {
      try {
        const firebase = await import("../services/firebase");
        setAuth(firebase.auth);
        setDb(firebase.db);
        console.log("✅ Firebase initialized successfully");
      } catch (error) {
        console.error("❌ Firebase initialization failed:", error);
      }
    };

    initFirebase();
  }, []);

  // Set up auth listener once Firebase is ready
  useEffect(() => {
    if (!auth || !db) {
      console.log("⏳ Waiting for Firebase...");
      return;
    }

    console.log("🔄 Setting up auth listener...");

    let unsubscribeFirestore = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      // Ignorar auth state changes durante signup
      if (signupInProgress) {
        console.log("⏭️ Signup in progress - ignoring auth state change");
        return;
      }

      console.log("🔐 Auth state changed:", user?.uid || "null");

      // Cleanup previous Firestore listener
      if (unsubscribeFirestore) {
        console.log("🧹 Cleaning up previous Firestore listener");
        unsubscribeFirestore();
        unsubscribeFirestore = null;
      }

      if (user) {
        console.log("👤 User logged in:", user.uid);
        console.log("📧 Email verified:", user.emailVerified);

        // Set up real-time Firestore listener for this user
        console.log("🔄 Setting up Firestore listener for user:", user.uid);

        unsubscribeFirestore = onSnapshot(
          doc(db, "users", user.uid),
          (docSnapshot) => {
            console.log("📄 Firestore document updated");

            if (docSnapshot.exists()) {
              const userData = docSnapshot.data();
              console.log("✅ User data:", userData);

              // 1. Verify email
              if (!user.emailVerified) {
                console.log(
                  "❌ Email not verified - showing modal and signing out"
                );
                setShowVerificationModal(true);
                setInitialRoute("Login");
                setInitialUser(null);
                auth.signOut();
              }
              // 2. Verify legal terms accepted
              else if (!userData.legalAccepted) {
                console.log("⚖️ Legal not accepted - navigating to Legal");
                setInitialRoute("Legal");
                setInitialUser(user);
              }
              // 3. Verify profile completed
              else if (!userData.profileCompleted) {
                console.log(
                  "👤 Profile incomplete - navigating to ProfileSetup"
                );
                setInitialRoute("ProfileSetup");
                setInitialUser(user);
              }
              // 4. Check if host needs to select type
              else if (userData.role === "host" && !userData.hostConfig) {
                console.log(
                  "🎪 Host needs to select type - navigating to HostTypeSelection"
                );
                setInitialRoute("HostTypeSelection");
                setInitialUser(user);
              }
              // 5. All checks passed - go to Home
              else {
                console.log("✅ All checks passed - navigating to Home");
                setInitialRoute("Home");
                setInitialUser(user);
              }
            } else {
              console.log(
                "❌ User doc does not exist - showing modal and signing out"
              );
              setShowUserNotFoundModal(true);
              setInitialRoute("Login");
              setInitialUser(null);
              auth.signOut();
            }

            console.log("✅ Initialization complete");
            setLoading(false);
          },
          (error) => {
            console.error("❌ Error listening to user doc:", error);
            setInitialRoute("Login");
            setInitialUser(null);
            setLoading(false);
          }
        );
      } else {
        console.log("🚪 No user, showing login");
        setInitialRoute("Login");
        setInitialUser(null);
        setLoading(false);
      }
    });

    return () => {
      console.log("🧹 Cleaning up listeners");
      unsubscribeAuth();
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
      }
    };
  }, [auth, db, signupInProgress]);

  const handleVerificationModalClose = () => {
    console.log("✅ Verification modal closed");
    setShowVerificationModal(false);
  };

  const handleUserNotFoundModalClose = () => {
    console.log("✅ User not found modal closed");
    setShowUserNotFoundModal(false);
  };

  if (loading || !auth || !db) {
    console.log("⏳ Loading...");
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#0B0F1A",
        }}
      >
        <ActivityIndicator size="large" color="#FF6B9D" />
      </View>
    );
  }

  console.log(
    "🗺️ AppNavigator rendering, initialUser:",
    initialUser?.uid || "null"
  );

  return (
    <>
      {/* ✅ UPDATED: Pass ref to NavigationContainer */}
      <NavigationContainer ref={ref}>
        <Stack.Navigator
          initialRouteName={initialRoute}
          screenOptions={{ headerShown: false }}
        >
          {!initialUser ? (
            // Auth Stack
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Signup" component={SignupScreen} />
            </>
          ) : initialRoute === "Legal" ? (
            // Legal Stack
            <>
              <Stack.Screen name="Legal" component={LegalScreen} />
            </>
          ) : initialRoute === "ProfileSetup" ? (
            // Profile Setup Stack
            <>
              <Stack.Screen
                name="ProfileSetup"
                component={ProfileSetupScreen}
              />
            </>
          ) : initialRoute === "HostTypeSelection" ? (
            // Host Type Selection Stack
            <>
              <Stack.Screen
                name="HostTypeSelection"
                component={HostTypeSelectionScreen}
                initialParams={{
                  userEmail: initialUser?.email,
                  fullName: "Host",
                }}
              />
            </>
          ) : (
            // Main App Stack
            <>
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen
                name="SearchEvents"
                component={SearchEventsScreen}
              />
              <Stack.Screen name="EventDetail" component={EventDetailScreen} />
              <Stack.Screen name="CreateEvent" component={CreateEventScreen} />
              <Stack.Screen name="EditEvent" component={EditEventScreen} />
              <Stack.Screen name="MyEvents" component={MyEventsScreen} />
              <Stack.Screen name="Profile" component={ProfileScreen} />
              <Stack.Screen
                name="PersonalityQuiz"
                component={PersonalityQuizScreen}
              />
              <Stack.Screen
                name="PersonalityResults"
                component={PersonalityResultsScreen}
              />
              <Stack.Screen
                name="Notifications"
                component={NotificationsScreen}
              />
              <Stack.Screen name="EventChat" component={EventChatScreen} />
              <Stack.Screen name="RequestHost" component={RequestHostScreen} />
              <Stack.Screen
                name="AdminDashboard"
                component={AdminDashboardScreen}
              />
              {/* Payment Screens */}
              <Stack.Screen name="Checkout" component={CheckoutScreen} />
              {/* Stripe Connect Screens */}
              <Stack.Screen
                name="HostTypeSelection"
                component={HostTypeSelectionScreen}
              />
              <Stack.Screen
                name="StripeConnect"
                component={StripeConnectScreen}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>

      {/* Email verification modal */}
      <SuccessModal
        visible={showVerificationModal}
        onClose={handleVerificationModalClose}
        title="Verify Your Email"
        message="Please verify your email address before logging in. Check your inbox (and spam folder) and click the verification link we sent you."
        emoji="📧"
      />

      {/* User doc not found modal */}
      <SuccessModal
        visible={showUserNotFoundModal}
        onClose={handleUserNotFoundModalClose}
        title="Account Issue"
        message="Your account was created but user data is missing. This sometimes happens if signup was interrupted. Please try signing up again or contact support."
        emoji="⚠️"
      />
    </>
  );
});

export default AppNavigator;
