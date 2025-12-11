import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { ActivityIndicator, View } from "react-native";

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

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const [initialUser, setInitialUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState("Login");
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [auth, setAuth] = useState(null);
  const [db, setDb] = useState(null);

  // Initialize Firebase dynamically (still needed to ensure proper timing)
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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("🔐 Auth state changed:", user?.uid || "null");

      if (user) {
        console.log("👤 User logged in:", user.uid);
        console.log("📧 Email verified:", user.emailVerified);

        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          console.log("📄 User doc exists:", userDoc.exists());

          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log("✅ User data:", userData);

            // 1. Verify email
            if (!user.emailVerified) {
              console.log(
                "❌ Email not verified - showing modal and signing out"
              );
              setShowVerificationModal(true);
              setInitialRoute("Login");
              setInitialUser(null);
              await auth.signOut();
            }
            // 2. Verify legal terms accepted
            else if (!userData.legalAccepted) {
              console.log("⚖️ Legal not accepted - navigating to Legal");
              setInitialRoute("Legal");
              setInitialUser(user);
            }
            // 3. Verify profile completed
            else if (!userData.profileCompleted) {
              console.log("👤 Profile incomplete - navigating to ProfileSetup");
              setInitialRoute("ProfileSetup");
              setInitialUser(user);
            }
            // 4. All checks passed - go to Home
            else {
              console.log("✅ All checks passed - navigating to Home");
              setInitialRoute("Home");
              setInitialUser(user);
            }
          } else {
            console.log("❌ User doc does not exist - staying on Login");
            setInitialRoute("Login");
            setInitialUser(null);
          }
        } catch (error) {
          console.error("❌ Error fetching user doc:", error);
          setInitialRoute("Login");
          setInitialUser(null);
        }
      } else {
        console.log("🚪 No user, showing login");
        setInitialRoute("Login");
        setInitialUser(null);
      }

      console.log("✅ Initialization complete");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, db]);

  const handleVerificationModalClose = () => {
    console.log("✅ Verification modal closed");
    setShowVerificationModal(false);
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
      <NavigationContainer>
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
    </>
  );
}
