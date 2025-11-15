import React, { useState, useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { auth, db } from './src/services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import LoginScreen from './src/screens/LoginScreen';
import LegalScreen from './src/screens/LegalScreen';
import ProfileSetupScreen from './src/screens/ProfileSetupScreen';
import HomeScreen from './src/screens/HomeScreen';

export default function App() {
  const [user, setUser] = useState(null);
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [profileComplete, setProfileComplete] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        // Check user status
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
      // If document doesn't exist yet, create it
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

  // Not logged in
  if (!user) {
    return <LoginScreen />;
  }

  // Logged in but legal not accepted
  if (!legalAccepted) {
    return <LegalScreen onAccept={handleLegalAccept} />;
  }

  // Legal accepted but profile incomplete
  if (!profileComplete) {
    return <ProfileSetupScreen onComplete={handleProfileComplete} />;
  }

  // All complete - show home
  return <HomeScreen />;
}
