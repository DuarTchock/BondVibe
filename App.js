import React, { useState, useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { auth, db } from './src/services/firebase';
import { onAuthStateChanged, sendEmailVerification } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import LoginScreen from './src/screens/LoginScreen';
import EmailVerificationScreen from './src/screens/EmailVerificationScreen';
import LegalScreen from './src/screens/LegalScreen';
import ProfileSetupScreen from './src/screens/ProfileSetupScreen';
import HomeScreen from './src/screens/HomeScreen';
import EventFeedScreen from './src/screens/EventFeedScreen';
import EventDetailScreen from './src/screens/EventDetailScreen';
import CreateEventScreen from './src/screens/CreateEventScreen';
import RequestHostScreen from './src/screens/RequestHostScreen';
import AdminDashboardScreen from './src/screens/AdminDashboardScreen';
import MyEventsScreen from './src/screens/MyEventsScreen';

const Stack = createNativeStackNavigator();

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}

function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="EventFeed" component={EventFeedScreen} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} />
      <Stack.Screen name="CreateEvent" component={CreateEventScreen} />
      <Stack.Screen name="RequestHost" component={RequestHostScreen} />
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <Stack.Screen name="MyEvents" component={MyEventsScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [profileComplete, setProfileComplete] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        setEmailVerified(currentUser.emailVerified);

        if (!currentUser.emailVerified) {
          try {
            await sendEmailVerification(currentUser);
            console.log('Verification email sent');
          } catch (error) {
            console.error('Error sending verification email:', error);
          }
        }

        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setLegalAccepted(data.legalAccepted || false);
          setProfileComplete(data.profileCompleted || false);
        } else {
          setLegalAccepted(false);
          setProfileComplete(false);
        }
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleLegalAccept = async () => {
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        legalAccepted: true,
        legalAcceptedAt: new Date().toISOString(),
      });
      setLegalAccepted(true);
    } catch (error) {
      console.log('Creating initial user document');
      setLegalAccepted(true);
    }
  };

  const handleProfileComplete = () => {
    setProfileComplete(true);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  if (!user) {
    return (
      <NavigationContainer>
        <AuthStack />
      </NavigationContainer>
    );
  }

  if (!emailVerified) {
    return <EmailVerificationScreen />;
  }

  if (!legalAccepted) {
    return <LegalScreen onAccept={handleLegalAccept} />;
  }

  if (!profileComplete) {
    return <ProfileSetupScreen onComplete={handleProfileComplete} />;
  }

  return (
    <NavigationContainer>
      <AppStack />
    </NavigationContainer>
  );
}
