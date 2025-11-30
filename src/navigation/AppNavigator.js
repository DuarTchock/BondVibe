import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../services/firebase";
import { ActivityIndicator, View } from "react-native";
import SuccessModal from "../components/SuccessModal";
import PersonalityQuizScreen from "../screens/PersonalityQuizScreen";
import PersonalityResultsScreen from "../screens/PersonalityResultsScreen";

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
import NotificationsScreen from "../screens/NotificationsScreen";
import EventChatScreen from "../screens/EventChatScreen";
import RequestHostScreen from "../screens/RequestHostScreen";
import AdminDashboardScreen from "../screens/AdminDashboardScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const [initialUser, setInitialUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState("Login");
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  useEffect(() => {
    console.log("🔄 Setting up auth listener...");
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("🔐 Auth state changed:", user?.uid || "null");

      if (user) {
        console.log("👤 User logged in:", user.uid);
        console.log("📧 Email verified:", user.emailVerified);

        const userDoc = await getDoc(doc(db, "users", user.uid));
        console.log("📄 User doc exists:", userDoc.exists());

        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log("✅ User data:", userData);

          // 1. Verificar email
          if (!user.emailVerified) {
            console.log(
              "❌ Email not verified - showing modal and signing out"
            );
            setShowVerificationModal(true);
            setInitialRoute("Login");
            setInitialUser(null);
            await auth.signOut();
          }
          // 2. Verificar términos legales
          else if (!userData.legalAccepted) {
            console.log("⚖️ Legal not accepted - navigating to Legal");
            setInitialRoute("Legal");
            setInitialUser(user);
          }
          // 3. Verificar perfil completado
          else if (!userData.profileCompleted) {
            console.log("👤 Profile incomplete - navigating to ProfileSetup");
            setInitialRoute("ProfileSetup");
            setInitialUser(user);
          }
          // 4. Todo completo - ir a Home
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
      } else {
        console.log("🚪 No user, showing login");
        setInitialRoute("Login");
        setInitialUser(null);
      }

      console.log("✅ Initialization complete");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleVerificationModalClose = () => {
    console.log("✅ Verification modal closed");
    setShowVerificationModal(false);
  };

  if (loading) {
    console.log("⏳ Loading initial user state...");
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
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="PersonalityResults"
                component={PersonalityResultsScreen}
                options={{ headerShown: false }}
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
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>

      {/* Modal de verificación de email */}
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
