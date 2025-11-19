import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { useTheme } from '../contexts/ThemeContext';

export default function LegalScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!acceptedTerms || !acceptedPrivacy) {
      Alert.alert('Required', 'Please accept both Terms and Privacy Policy to continue');
      return;
    }

    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        acceptedTerms: true,
        acceptedPrivacy: true,
        acceptedAt: new Date().toISOString(),
      });
      navigation.replace('PersonalityTest');
    } catch (error) {
      console.error('Error updating user:', error);
      Alert.alert('Error', 'Something went wrong');
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
        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.emoji}>📋</Text>
          <Text style={[styles.title, { color: colors.text }]}>Legal Stuff</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            We need your consent to continue
          </Text>
        </View>

        {/* Terms */}
        <TouchableOpacity
          style={styles.checkboxCard}
          onPress={() => setAcceptedTerms(!acceptedTerms)}
          activeOpacity={0.8}
        >
          <View style={[styles.checkboxGlass, {
            backgroundColor: acceptedTerms ? `${colors.primary}26` : colors.surfaceGlass,
            borderColor: acceptedTerms ? `${colors.primary}66` : colors.border
          }]}>
            <View style={[styles.checkbox, {
              backgroundColor: acceptedTerms ? colors.primary : 'transparent',
              borderColor: acceptedTerms ? colors.primary : colors.border
            }]}>
              {acceptedTerms && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <View style={styles.checkboxContent}>
              <Text style={[styles.checkboxTitle, { color: colors.text }]}>
                Terms of Service
              </Text>
              <Text style={[styles.checkboxText, { color: colors.textSecondary }]}>
                I agree to BondVibe's Terms of Service
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Privacy */}
        <TouchableOpacity
          style={styles.checkboxCard}
          onPress={() => setAcceptedPrivacy(!acceptedPrivacy)}
          activeOpacity={0.8}
        >
          <View style={[styles.checkboxGlass, {
            backgroundColor: acceptedPrivacy ? `${colors.primary}26` : colors.surfaceGlass,
            borderColor: acceptedPrivacy ? `${colors.primary}66` : colors.border
          }]}>
            <View style={[styles.checkbox, {
              backgroundColor: acceptedPrivacy ? colors.primary : 'transparent',
              borderColor: acceptedPrivacy ? colors.primary : colors.border
            }]}>
              {acceptedPrivacy && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <View style={styles.checkboxContent}>
              <Text style={[styles.checkboxTitle, { color: colors.text }]}>
                Privacy Policy
              </Text>
              <Text style={[styles.checkboxText, { color: colors.textSecondary }]}>
                I agree to BondVibe's Privacy Policy
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          disabled={loading || !acceptedTerms || !acceptedPrivacy}
        >
          <View style={[styles.continueGlass, {
            backgroundColor: (acceptedTerms && acceptedPrivacy) ? `${colors.primary}33` : colors.surfaceGlass,
            borderColor: (acceptedTerms && acceptedPrivacy) ? `${colors.primary}66` : colors.border,
            opacity: (acceptedTerms && acceptedPrivacy) ? 1 : 0.5
          }]}>
            <Text style={[styles.continueButtonText, {
              color: (acceptedTerms && acceptedPrivacy) ? colors.primary : colors.textSecondary
            }]}>
              {loading ? 'Processing...' : 'Continue'}
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: { flex: 1 },
    scrollView: { flex: 1 },
    scrollContent: { paddingHorizontal: 32, paddingTop: 80, paddingBottom: 40 },
    titleSection: { alignItems: 'center', marginBottom: 40 },
    emoji: { fontSize: 64, marginBottom: 16 },
    title: { fontSize: 32, fontWeight: '700', marginBottom: 8, letterSpacing: -0.5 },
    subtitle: { fontSize: 15, textAlign: 'center' },
    checkboxCard: { marginBottom: 16, borderRadius: 16, overflow: 'hidden' },
    checkboxGlass: { borderWidth: 1, padding: 20, flexDirection: 'row', alignItems: 'center' },
    checkbox: {
      width: 28,
      height: 28,
      borderRadius: 8,
      borderWidth: 2,
      marginRight: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkmark: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
    checkboxContent: { flex: 1 },
    checkboxTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4, letterSpacing: -0.2 },
    checkboxText: { fontSize: 13 },
    continueButton: { borderRadius: 16, overflow: 'hidden', marginTop: 24 },
    continueGlass: { borderWidth: 1, paddingVertical: 16, alignItems: 'center' },
    continueButtonText: { fontSize: 17, fontWeight: '700', letterSpacing: -0.2 },
  });
}
