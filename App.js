import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './src/services/firebase';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    console.log('🔄 Setting up auth listener...');
    
    const subscriber = onAuthStateChanged(auth, async (authUser) => {
      console.log('🔐 Auth state changed:', authUser ? authUser.uid : 'null');
      
      if (authUser) {
        console.log('👤 User logged in:', authUser.uid);
        try {
          const userDoc = await getDoc(doc(db, 'users', authUser.uid));
          console.log('📄 User doc exists:', userDoc.exists());
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('✅ User data:', userData);
            setUser(authUser);
          } else {
            console.log('⚠️ User doc not found, staying on login');
            setUser(null);
          }
        } catch (error) {
          console.error('❌ Error fetching user doc:', error);
          setUser(authUser); // Login anyway even if doc fails
        }
      } else {
        console.log('�� No user, showing login');
        setUser(null);
      }
      
      if (initializing) {
        console.log('✅ Initialization complete');
        setInitializing(false);
      }
    });
    
    return subscriber;
  }, []);

  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF3EA5" />
      </View>
    );
  }

  console.log('🎨 Rendering AppNavigator, user:', user ? user.uid : 'null');
  return <AppNavigator initialUser={user} />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0B0F1A',
  },
});
