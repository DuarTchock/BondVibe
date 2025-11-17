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
    console.log('📧 Email:', email);
    console.log('🔐 Password:', password ? '***' : 'empty');
    console.log('📝 Is SignUp:', isSignUp);

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
            {/* Toggle */}
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggleButton, !isSignUp && styles.toggleButtonActive]}
                onPress={() => {
                  console.log('✏️ Switching to Sign In');
                  setIsSignUp(false);
                }}
              >
                <Text style={[styles.toggleText, !isSignUp && styles.toggleTextActive]}>
                  Sign In
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, isSignUp && styles.toggleButtonActive]}
                onPress={() => {
                  console.log('✏️ Switching to Sign Up');
                  setIsSignUp(true);
                }}
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
                onChangeText={(text) => {
                  console.log('📧 Email changed:', text);
                  setEmail(text);
                }}
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
                onChangeText={(text) => {
                  console.log('🔒 Password changed');
                  setPassword(text);
                }}
                secureTextEntry
                editable={!loading}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.buttonDisabled]}
              onPress={() => {
                console.log('🚀 Submit button pressed!');
                handleAuth();
              }}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text style={styles.submitButtonText}>
                {loading ? '⏳ Loading...' : isSignUp ? '✨ Create Account' : '🔓 Sign In'}
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
              <Text style={styles.featureIcon}>🔒</Text>
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
    paddingTop: 100,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#F1F5F9',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    color: '#94A3B8',
  },
  formContainer: {
    gap: 16,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: '#FF3EA5',
  },
  toggleText: {
    fontSize: 16,
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
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1A1F3A',
    paddingHorizontal: 16,
  },
  inputIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#F1F5F9',
    paddingVertical: 16,
  },
  submitButton: {
    backgroundColor: '#FF3EA5',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 8,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#00F2FE',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    marginTop: 48,
  },
  featureItem: {
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  featureText: {
    fontSize: 12,
    color: '#94A3B8',
  },
});
