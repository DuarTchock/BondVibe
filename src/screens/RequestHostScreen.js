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
import { collection, addDoc } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { useTheme } from '../contexts/ThemeContext';

export default function RequestHostScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const [form, setForm] = useState({
    reason: '',
    experience: '',
    eventIdeas: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!form.reason.trim() || !form.experience.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'hostRequests'), {
        userId: auth.currentUser.uid,
        reason: form.reason.trim(),
        experience: form.experience.trim(),
        eventIdeas: form.eventIdeas.trim(),
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
      
      Alert.alert(
        'Request Submitted!',
        'We\'ll review your application and get back to you soon.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error submitting request:', error);
      Alert.alert('Error', 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const styles = createStyles(colors);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backButton, { color: colors.text }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Become a Host</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.heroSection}>
          <Text style={styles.heroEmoji}>✨</Text>
          <Text style={[styles.heroTitle, { color: colors.text }]}>Host Amazing Events</Text>
          <Text style={[styles.heroText, { color: colors.textSecondary }]}>
            Share your passion and bring people together through unique experiences
          </Text>
        </View>

        {/* Benefits */}
        <View style={styles.benefitsSection}>
          <View style={styles.benefitCard}>
            <View style={[styles.benefitGlass, {
              backgroundColor: colors.surfaceGlass,
              borderColor: colors.border
            }]}>
              <Text style={styles.benefitIcon}>🎯</Text>
              <Text style={[styles.benefitText, { color: colors.text }]}>
                Create unlimited events
              </Text>
            </View>
          </View>
          <View style={styles.benefitCard}>
            <View style={[styles.benefitGlass, {
              backgroundColor: colors.surfaceGlass,
              borderColor: colors.border
            }]}>
              <Text style={styles.benefitIcon}>👥</Text>
              <Text style={[styles.benefitText, { color: colors.text }]}>
                Build your community
              </Text>
            </View>
          </View>
          <View style={styles.benefitCard}>
            <View style={[styles.benefitGlass, {
              backgroundColor: colors.surfaceGlass,
              borderColor: colors.border
            }]}>
              <Text style={styles.benefitIcon}>⚡</Text>
              <Text style={[styles.benefitText, { color: colors.text }]}>
                Priority support
              </Text>
            </View>
          </View>
        </View>

        {/* Form */}
        <View style={styles.formSection}>
          <Text style={[styles.formTitle, { color: colors.text }]}>
            Tell us about yourself
          </Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              Why do you want to host? *
            </Text>
            <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
              <TextInput
                style={[styles.input, styles.textArea, {
                  backgroundColor: colors.surfaceGlass,
                  borderColor: colors.border,
                  color: colors.text
                }]}
                value={form.reason}
                onChangeText={(text) => setForm({ ...form, reason: text })}
                placeholder="I'm passionate about..."
                placeholderTextColor={colors.textTertiary}
                multiline
                maxLength={300}
              />
            </View>
            <Text style={[styles.charCount, { color: colors.textTertiary }]}>
              {form.reason.length}/300
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              Your experience *
            </Text>
            <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
              <TextInput
                style={[styles.input, styles.textArea, {
                  backgroundColor: colors.surfaceGlass,
                  borderColor: colors.border,
                  color: colors.text
                }]}
                value={form.experience}
                onChangeText={(text) => setForm({ ...form, experience: text })}
                placeholder="I've organized..."
                placeholderTextColor={colors.textTertiary}
                multiline
                maxLength={300}
              />
            </View>
            <Text style={[styles.charCount, { color: colors.textTertiary }]}>
              {form.experience.length}/300
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              Event ideas (optional)
            </Text>
            <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
              <TextInput
                style={[styles.input, styles.textArea, {
                  backgroundColor: colors.surfaceGlass,
                  borderColor: colors.border,
                  color: colors.text
                }]}
                value={form.eventIdeas}
                onChangeText={(text) => setForm({ ...form, eventIdeas: text })}
                placeholder="I'd love to host..."
                placeholderTextColor={colors.textTertiary}
                multiline
                maxLength={300}
              />
            </View>
            <Text style={[styles.charCount, { color: colors.textTertiary }]}>
              {form.eventIdeas.length}/300
            </Text>
          </View>

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <View style={[styles.submitGlass, {
              backgroundColor: `${colors.primary}33`,
              borderColor: `${colors.primary}66`
            }]}>
              <Text style={[styles.submitButtonText, { color: colors.primary }]}>
                {submitting ? 'Submitting...' : '✨ Submit Application'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <View style={[styles.infoGlass, {
            backgroundColor: `${colors.secondary}1A`,
            borderColor: `${colors.secondary}33`
          }]}>
            <Text style={styles.infoIcon}>💡</Text>
            <View style={styles.infoContent}>
              <Text style={[styles.infoTitle, { color: colors.secondary }]}>
                What happens next?
              </Text>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                • We review applications within 48 hours{'\n'}
                • You'll receive an email notification{'\n'}
                • Approved hosts can start creating events
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingTop: 60,
      paddingBottom: 20,
    },
    backButton: {
      fontSize: 28,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      letterSpacing: -0.3,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 24,
      paddingBottom: 40,
    },
    heroSection: {
      alignItems: 'center',
      marginBottom: 32,
    },
    heroEmoji: {
      fontSize: 64,
      marginBottom: 16,
    },
    heroTitle: {
      fontSize: 24,
      fontWeight: '700',
      marginBottom: 12,
      letterSpacing: -0.5,
    },
    heroText: {
      fontSize: 15,
      textAlign: 'center',
      lineHeight: 22,
      paddingHorizontal: 20,
    },
    benefitsSection: {
      gap: 12,
      marginBottom: 32,
    },
    benefitCard: {
      borderRadius: 12,
      overflow: 'hidden',
    },
    benefitGlass: {
      borderWidth: 1,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
    },
    benefitIcon: {
      fontSize: 24,
      marginRight: 14,
    },
    benefitText: {
      fontSize: 15,
      fontWeight: '600',
      letterSpacing: -0.1,
    },
    formSection: {
      marginBottom: 24,
    },
    formTitle: {
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 20,
      letterSpacing: -0.3,
    },
    inputGroup: {
      marginBottom: 20,
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
      marginBottom: 10,
      letterSpacing: -0.1,
    },
    inputWrapper: {
      borderRadius: 12,
      overflow: 'hidden',
    },
    input: {
      borderWidth: 1,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 15,
    },
    textAreaWrapper: {},
    textArea: {
      minHeight: 100,
      textAlignVertical: 'top',
    },
    charCount: {
      fontSize: 11,
      textAlign: 'right',
      marginTop: 6,
    },
    submitButton: {
      borderRadius: 16,
      overflow: 'hidden',
      marginTop: 8,
    },
    submitGlass: {
      borderWidth: 1,
      paddingVertical: 16,
      alignItems: 'center',
    },
    submitButtonText: {
      fontSize: 17,
      fontWeight: '700',
      letterSpacing: -0.2,
    },
    infoCard: {
      borderRadius: 16,
      overflow: 'hidden',
    },
    infoGlass: {
      borderWidth: 1,
      padding: 18,
      flexDirection: 'row',
    },
    infoIcon: {
      fontSize: 24,
      marginRight: 12,
    },
    infoContent: {
      flex: 1,
    },
    infoTitle: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 10,
      letterSpacing: -0.1,
    },
    infoText: {
      fontSize: 13,
      lineHeight: 20,
    },
  });
}
