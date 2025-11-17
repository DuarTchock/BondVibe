import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { doc, setDoc } from 'firebase/firestore';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    console.log('🔑 handleAuth called');

    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        console.log('🆕 Creating new user...');
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        console.log('✅ User created:', userCredential.user.uid);
        
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: email.trim(),
          createdAt: new Date().toISOString(),
          role: 'user',
        });
        console.log('✅ User doc created in Firestore');
      } else {
        console.log('🔐 Logging in...');
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
        console.log('✅ Login successful:', userCredential.user.uid);
      }
    } catch (error) {
      console.error('❌ Auth error:', error);
      
      let errorMessage = 'Authentication failed';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email already in use. Try logging in instead.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Wrong password';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'User not found. Try signing up instead.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters';
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Logo */}
          <View style={styles.logoSection}>
            <Text style={styles.logoEmoji}>🎉</Text>
            <Text style={styles.logoText}>BondVibe</Text>
            <Text style={styles.tagline}>Connect through experiences</Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {/* Toggle - COMPACTO */}
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggleButton, !isSignUp && styles.toggleButtonActive]}
                onPress={() => setIsSignUp(false)}
              >
                <Text style={[styles.toggleText, !isSignUp && styles.toggleTextActive]}>
                  Sign In
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, isSignUp && styles.toggleButtonActive]}
                onPress={() => setIsSignUp(true)}
              >
                <Text style={[styles.toggleText, isSignUp && styles.toggleTextActive]}>
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputIcon}>📧</Text>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#64748B"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#64748B"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
              />
            </View>

            {/* Submit Button - COMPACTO */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.buttonDisabled]}
              onPress={handleAuth}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Loading...' : isSignUp ? 'Create Account' : '�� Sign In'}
              </Text>
            </TouchableOpacity>

            {/* Forgot Password */}
            {!isSignUp && (
              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>��</Text>
              <Text style={styles.featureText}>Secure</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>⚡</Text>
              <Text style={styles.featureText}>Fast</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🎯</Text>
              <Text style={styles.featureText}>Personal</Text>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F1A',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 80,
    justifyContent: 'center',
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoEmoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F1F5F9',
    marginBottom: 6,
  },
  tagline: {
    fontSize: 13,
    color: '#94A3B8',
  },
  formContainer: {
    gap: 14,
  },
  // TOGGLE MÁS COMPACTO
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#111827',
    borderRadius: 10,
    padding: 3,
    marginBottom: 12,
    alignSelf: 'center',
    width: 240,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 7,
  },
  toggleButtonActive: {
    backgroundColor: '#FF3EA5',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1A1F3A',
    paddingHorizontal: 14,
  },
  inputIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#F1F5F9',
    paddingVertical: 14,
  },
  // BOTÓN MÁS COMPACTO
  submitButton: {
    backgroundColor: '#FF3EA5',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 6,
  },
  forgotPasswordText: {
    fontSize: 13,
    color: '#00F2FE',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 28,
    marginTop: 40,
  },
  featureItem: {
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  featureText: {
    fontSize: 11,
    color: '#94A3B8',
  },
});
