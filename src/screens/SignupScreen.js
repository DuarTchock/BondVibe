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

export default function SignupScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
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
    try {
      // Crear cuenta
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Crear documento de usuario en Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        createdAt: new Date().toISOString(),
        profileCompleted: false,
        emailVerified: false,
        legalAccepted: false,
        role: 'user',
      });

      // Enviar email de verificación
      await sendEmailVerification(user);

      Alert.alert(
        'Verification Email Sent!',
        'Please check your email and verify your account before continuing.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Cerrar sesión para forzar re-login después de verificar
              auth.signOut();
              navigation.replace('Login');
            }
          }
        ]
      );
    } catch (error) {
      console.error('Signup error:', error);
      Alert.alert('Signup Failed', error.message);
    } finally {
      setLoading(false);
    }
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
              borderColor: `${colors.primary}66`
            }]}>
              {loading ? (
                <ActivityIndicator size="small" color={colors.primary} />
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
    signupText: { fontSize: 17, fontWeight: '700', letterSpacing: -0.2 },
    loginLink: { alignItems: 'center', paddingVertical: 12 },
    loginLinkText: { fontSize: 15 },
  });
}
