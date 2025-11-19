import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { useTheme } from '../contexts/ThemeContext';

export default function SignupScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!form.fullName.trim() || !form.email.trim() || !form.password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (form.password !== form.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (form.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        form.email.trim(),
        form.password
      );

      await setDoc(doc(db, 'users', userCredential.user.uid), {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        avatar: '😊',
        role: 'user',
        createdAt: new Date().toISOString(),
        onboardingComplete: false,
      });

      navigation.replace('Legal');
    } catch (error) {
      console.error('Signup error:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const styles = createStyles(colors);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={[styles.backButton, { color: colors.text }]}>←</Text>
          </TouchableOpacity>
        </View>

        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.emoji}>✨</Text>
          <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Join BondVibe and start connecting
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Full Name</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, {
                  backgroundColor: colors.surfaceGlass,
                  borderColor: colors.border,
                  color: colors.text
                }]}
                value={form.fullName}
                onChangeText={(text) => setForm({ ...form, fullName: text })}
                placeholder="John Doe"
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Email</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, {
                  backgroundColor: colors.surfaceGlass,
                  borderColor: colors.border,
                  color: colors.text
                }]}
                value={form.email}
                onChangeText={(text) => setForm({ ...form, email: text })}
                placeholder="you@example.com"
                placeholderTextColor={colors.textTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Password</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, {
                  backgroundColor: colors.surfaceGlass,
                  borderColor: colors.border,
                  color: colors.text
                }]}
                value={form.password}
                onChangeText={(text) => setForm({ ...form, password: text })}
                placeholder="At least 6 characters"
                placeholderTextColor={colors.textTertiary}
                secureTextEntry
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Confirm Password</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, {
                  backgroundColor: colors.surfaceGlass,
                  borderColor: colors.border,
                  color: colors.text
                }]}
                value={form.confirmPassword}
                onChangeText={(text) => setForm({ ...form, confirmPassword: text })}
                placeholder="Re-enter password"
                placeholderTextColor={colors.textTertiary}
                secureTextEntry
              />
            </View>
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
              <Text style={[styles.signupButtonText, { color: colors.primary }]}>
                {loading ? 'Creating Account...' : 'Sign Up'}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={[styles.loginLinkText, { color: colors.textSecondary }]}>
              Already have an account?{' '}
              <Text style={{ color: colors.primary, fontWeight: '600' }}>Log In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: { flex: 1 },
    scrollView: { flex: 1 },
    scrollContent: { paddingHorizontal: 32, paddingBottom: 40 },
    header: { paddingTop: 60, paddingBottom: 20 },
    backButton: { fontSize: 28 },
    titleSection: { alignItems: 'center', marginBottom: 40 },
    emoji: { fontSize: 64, marginBottom: 16 },
    title: { fontSize: 32, fontWeight: '700', marginBottom: 8, letterSpacing: -0.5 },
    subtitle: { fontSize: 15, textAlign: 'center' },
    form: { gap: 20 },
    inputGroup: { gap: 8 },
    label: { fontSize: 13, fontWeight: '600', letterSpacing: -0.1 },
    inputWrapper: { borderRadius: 12, overflow: 'hidden' },
    input: { borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15 },
    signupButton: { borderRadius: 16, overflow: 'hidden', marginTop: 8 },
    signupGlass: { borderWidth: 1, paddingVertical: 16, alignItems: 'center' },
    signupButtonText: { fontSize: 17, fontWeight: '700', letterSpacing: -0.2 },
    loginLink: { alignItems: 'center', marginTop: 8 },
    loginLinkText: { fontSize: 14 },
  });
}
