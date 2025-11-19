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
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useTheme } from '../contexts/ThemeContext';

export default function LoginScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Information', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // AppNavigator will handle navigation based on user state
    } catch (error) {
      console.error('Login error:', error);
      
      // Mensajes de error amigables
      let errorTitle = 'Login Failed';
      let errorMessage = '';
      
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        errorTitle = 'Account Not Found';
        errorMessage = 'No account exists with this email. Would you like to create one?';
        
        Alert.alert(
          errorTitle,
          errorMessage,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Sign Up', 
              onPress: () => navigation.navigate('Signup'),
              style: 'default'
            }
          ]
        );
      } else if (error.code === 'auth/wrong-password') {
        Alert.alert('Incorrect Password', 'The password you entered is incorrect. Please try again.');
      } else if (error.code === 'auth/invalid-email') {
        Alert.alert('Invalid Email', 'Please enter a valid email address.');
      } else if (error.code === 'auth/too-many-requests') {
        Alert.alert('Too Many Attempts', 'Too many failed login attempts. Please try again later.');
      } else {
        Alert.alert(errorTitle, error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const styles = createStyles(colors);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.logo}>🎪</Text>
          <Text style={[styles.title, { color: colors.text }]}>BondVibe</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Connect through shared experiences
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
              placeholder="Password"
              placeholderTextColor={colors.textTertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={loading}
          >
            <View style={[styles.loginGlass, {
              backgroundColor: `${colors.primary}33`,
              borderColor: `${colors.primary}66`
            }]}>
              {loading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={[styles.loginText, { color: colors.primary }]}>
                  Log In
                </Text>
              )}
            </View>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textTertiary }]}>or</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          <TouchableOpacity
            style={styles.signupButton}
            onPress={() => navigation.navigate('Signup')}
          >
            <View style={[styles.signupGlass, {
              backgroundColor: colors.surfaceGlass,
              borderColor: colors.border
            }]}>
              <Text style={[styles.signupText, { color: colors.text }]}>
                Don't have an account? <Text style={{ color: colors.primary, fontWeight: '700' }}>Sign Up</Text>
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: { flex: 1 },
    content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
    header: { alignItems: 'center', marginBottom: 48 },
    logo: { fontSize: 72, marginBottom: 16 },
    title: { fontSize: 32, fontWeight: '700', marginBottom: 8, letterSpacing: -0.5 },
    subtitle: { fontSize: 15, textAlign: 'center' },
    form: { width: '100%', maxWidth: 400, alignSelf: 'center' },
    inputWrapper: { borderWidth: 1, borderRadius: 16, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 16 },
    inputIcon: { fontSize: 20, marginRight: 12 },
    input: { flex: 1, fontSize: 16, paddingVertical: 16 },
    loginButton: { borderRadius: 16, overflow: 'hidden', marginBottom: 20 },
    loginGlass: { borderWidth: 1, paddingVertical: 16, alignItems: 'center' },
    loginText: { fontSize: 17, fontWeight: '700', letterSpacing: -0.2 },
    divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    dividerLine: { flex: 1, height: 1 },
    dividerText: { marginHorizontal: 16, fontSize: 14 },
    signupButton: { borderRadius: 16, overflow: 'hidden' },
    signupGlass: { borderWidth: 1, paddingVertical: 16, alignItems: 'center' },
    signupText: { fontSize: 15 },
  });
}
