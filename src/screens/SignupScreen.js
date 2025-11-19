import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { useTheme } from '../contexts/ThemeContext';
import SuccessModal from '../components/SuccessModal';

export default function SignupScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSignup = async () => {
    console.log('📝 Starting signup process...');
    
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    
    let user = null;
    let emailSent = false;
    
    try {
      console.log('📤 Creating user account...');
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      user = userCredential.user;
      console.log('✅ User account created:', user.uid);

      console.log('📄 Creating Firestore document...');
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        createdAt: new Date().toISOString(),
        profileCompleted: false,
        emailVerified: false,
        legalAccepted: false,
        role: 'user',
      });
      console.log('✅ Firestore document created');

      console.log('📧 Attempting to send verification email...');
      try {
        await sendEmailVerification(user, {
          url: window.location.origin,
          handleCodeInApp: false,
        });
        console.log('✅ Verification email sent to:', user.email);
        emailSent = true;
      } catch (emailError) {
        console.error('⚠️ Email verification error:', emailError);
        console.error('Error code:', emailError.code);
        console.error('Error message:', emailError.message);
        // Continuar aunque falle el email - el usuario puede reenviar después
      }

    } catch (error) {
      console.error('❌ Signup error:', error);
      console.error('Error code:', error.code);
      setLoading(false);
      
      if (error.code === 'auth/email-already-in-use') {
        Alert.alert('Email Already Registered', 'This email is already registered. Please log in instead.');
      } else if (error.code === 'auth/invalid-email') {
        Alert.alert('Invalid Email', 'Please enter a valid email address.');
      } else if (error.code === 'auth/weak-password') {
        Alert.alert('Weak Password', 'Password should be at least 6 characters.');
      } else {
        Alert.alert('Signup Failed', error.message);
      }
      return;
    }

    // Cerrar sesión y mostrar modal
    try {
      console.log('🚪 Signing out user...');
      await auth.signOut();
      console.log('✅ User signed out');
      
      setLoading(false);
      setShowSuccess(true);
      console.log('🎉 Showing success modal');
      
      if (!emailSent) {
        console.log('⚠️ Note: Verification email may not have been sent');
      }
      
    } catch (error) {
      console.error('❌ Error signing out:', error);
      setLoading(false);
      setShowSuccess(true);
    }
  };

  const handleModalClose = () => {
    console.log('👋 Closing modal and navigating to Login');
    setShowSuccess(false);
    navigation.replace('Login');
  };

  const styles = createStyles(colors);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backButton, { color: colors.text }]}>←</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.titleSection}>
          <Text style={styles.logo}>🎪</Text>
          <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Join BondVibe and start connecting
          </Text>
        </View>

        <View style={styles.form}>
          <View style={[styles.inputWrapper, {
            backgroundColor: colors.surfaceGlass,
            borderColor: colors.border
          }]}>
            <Text style={styles.inputIcon}>📧</Text>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Email"
              placeholderTextColor={colors.textTertiary}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={[styles.inputWrapper, {
            backgroundColor: colors.surfaceGlass,
            borderColor: colors.border
          }]}>
            <Text style={styles.inputIcon}>🔒</Text>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Password (min 6 characters)"
              placeholderTextColor={colors.textTertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <View style={[styles.inputWrapper, {
            backgroundColor: colors.surfaceGlass,
            borderColor: colors.border
          }]}>
            <Text style={styles.inputIcon}>🔒</Text>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Confirm Password"
              placeholderTextColor={colors.textTertiary}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={styles.signupButton}
            onPress={handleSignup}
            disabled={loading}
          >
            <View style={[styles.signupGlass, {
              backgroundColor: `${colors.primary}33`,
              borderColor: `${colors.primary}66`,
              opacity: loading ? 0.7 : 1
            }]}>
              {loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={[styles.signupText, { color: colors.primary, marginLeft: 12 }]}>
                    Creating account...
                  </Text>
                </View>
              ) : (
                <Text style={[styles.signupText, { color: colors.primary }]}>
                  Sign Up
                </Text>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={[styles.loginLinkText, { color: colors.textSecondary }]}>
              Already have an account? <Text style={{ color: colors.primary, fontWeight: '600' }}>Log In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <SuccessModal
        visible={showSuccess}
        onClose={handleModalClose}
        title="Verify Your Email"
        message="We've sent a verification link to your email. Please check your inbox (and spam folder) and click the link to verify your account before logging in."
        emoji="📧"
      />
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20 },
    backButton: { fontSize: 28 },
    content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
    titleSection: { alignItems: 'center', marginBottom: 48 },
    logo: { fontSize: 72, marginBottom: 16 },
    title: { fontSize: 28, fontWeight: '700', marginBottom: 8, letterSpacing: -0.4 },
    subtitle: { fontSize: 15, textAlign: 'center' },
    form: { width: '100%', maxWidth: 400, alignSelf: 'center' },
    inputWrapper: { borderWidth: 1, borderRadius: 16, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 16 },
    inputIcon: { fontSize: 20, marginRight: 12 },
    input: { flex: 1, fontSize: 16, paddingVertical: 16 },
    signupButton: { borderRadius: 16, overflow: 'hidden', marginTop: 8, marginBottom: 20 },
    signupGlass: { borderWidth: 1, paddingVertical: 16, alignItems: 'center' },
    loadingRow: { flexDirection: 'row', alignItems: 'center' },
    signupText: { fontSize: 17, fontWeight: '700', letterSpacing: -0.2 },
    loginLink: { alignItems: 'center', paddingVertical: 12 },
    loginLinkText: { fontSize: 15 },
  });
}
