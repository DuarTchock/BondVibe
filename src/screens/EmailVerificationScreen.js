import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { auth } from '../services/firebase';
import { sendEmailVerification, signOut, reload } from 'firebase/auth';
import Colors from '../constants/Colors';
import Sizes from '../constants/Sizes';

export default function EmailVerificationScreen() {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    // Auto-check every 3 seconds
    const interval = setInterval(() => {
      checkVerification();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Countdown for resend button
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const checkVerification = async () => {
    if (checking) return;
    
    setChecking(true);
    try {
      await reload(auth.currentUser);
      // If email is verified, the app will automatically redirect
    } catch (error) {
      console.error('Check verification error:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleResendEmail = async () => {
    if (resendCooldown > 0) return;

    setLoading(true);
    try {
      await sendEmailVerification(auth.currentUser);
      Alert.alert('Success', 'Verification email sent! Please check your inbox.');
      setResendCooldown(60); // 60 second cooldown
    } catch (error) {
      console.error('Resend email error:', error);
      if (error.code === 'auth/too-many-requests') {
        Alert.alert('Error', 'Too many requests. Please wait a few minutes before trying again.');
      } else {
        Alert.alert('Error', 'Failed to send email. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.content}>
        <Text style={styles.emoji}>📧</Text>
        <Text style={styles.title}>Verify Your Email</Text>
        <Text style={styles.subtitle}>
          We sent a verification link to:
        </Text>
        <Text style={styles.email}>{auth.currentUser?.email}</Text>

        <View style={styles.instructions}>
          <Text style={styles.instructionTitle}>Next steps:</Text>
          <Text style={styles.instructionText}>
            1. Check your inbox (and spam folder)
          </Text>
          <Text style={styles.instructionText}>
            2. Click the verification link
          </Text>
          <Text style={styles.instructionText}>
            3. Return to this screen
          </Text>
        </View>

        {checking && (
          <View style={styles.checkingContainer}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.checkingText}>Checking verification status...</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={checkVerification}
          disabled={checking}
        >
          <Text style={styles.buttonText}>
            I've Verified My Email
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton, (loading || resendCooldown > 0) && styles.buttonDisabled]}
          onPress={handleResendEmail}
          disabled={loading || resendCooldown > 0}
        >
          <Text style={styles.secondaryButtonText}>
            {resendCooldown > 0 
              ? `Resend Email (${resendCooldown}s)` 
              : loading 
                ? 'Sending...' 
                : 'Resend Verification Email'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.note}>
          💡 Tip: Can't find the email? Check your spam folder or try resending.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Sizes.padding * 2,
  },
  emoji: {
    fontSize: 80,
    marginBottom: 24,
  },
  title: {
    fontSize: Sizes.fontSize.xlarge,
    fontWeight: 'bold',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: Sizes.fontSize.medium,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: 8,
  },
  email: {
    fontSize: Sizes.fontSize.medium,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 32,
  },
  instructions: {
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderRadius: Sizes.borderRadius,
    marginBottom: 32,
    width: '100%',
    maxWidth: 400,
  },
  instructionTitle: {
    fontSize: Sizes.fontSize.medium,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  instructionText: {
    fontSize: Sizes.fontSize.medium,
    color: Colors.text,
    marginBottom: 8,
    lineHeight: 22,
  },
  checkingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkingText: {
    fontSize: Sizes.fontSize.small,
    color: Colors.textLight,
    marginLeft: 8,
  },
  button: {
    backgroundColor: Colors.primary,
    padding: Sizes.padding,
    borderRadius: Sizes.borderRadius,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: Sizes.fontSize.medium,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    padding: Sizes.padding,
    borderRadius: Sizes.borderRadius,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
    marginBottom: 24,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  secondaryButtonText: {
    color: Colors.primary,
    fontSize: Sizes.fontSize.medium,
    fontWeight: '600',
  },
  logoutButton: {
    marginBottom: 24,
  },
  logoutText: {
    color: Colors.error,
    fontSize: Sizes.fontSize.small,
  },
  note: {
    fontSize: Sizes.fontSize.small,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
});
