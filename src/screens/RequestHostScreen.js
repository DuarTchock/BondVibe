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

export default function RequestHostScreen({ navigation }) {
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

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Become a Host</Text>
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
          <Text style={styles.heroTitle}>Host Amazing Events</Text>
          <Text style={styles.heroText}>
            Share your passion and bring people together through unique experiences
          </Text>
        </View>

        {/* Benefits */}
        <View style={styles.benefitsSection}>
          <View style={styles.benefitCard}>
            <View style={styles.benefitGlass}>
              <Text style={styles.benefitIcon}>🎯</Text>
              <Text style={styles.benefitText}>Create unlimited events</Text>
            </View>
          </View>
          <View style={styles.benefitCard}>
            <View style={styles.benefitGlass}>
              <Text style={styles.benefitIcon}>👥</Text>
              <Text style={styles.benefitText}>Build your community</Text>
            </View>
          </View>
          <View style={styles.benefitCard}>
            <View style={styles.benefitGlass}>
              <Text style={styles.benefitIcon}>⚡</Text>
              <Text style={styles.benefitText}>Priority support</Text>
            </View>
          </View>
        </View>

        {/* Form */}
        <View style={styles.formSection}>
          <Text style={styles.formTitle}>Tell us about yourself</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Why do you want to host? *</Text>
            <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={form.reason}
                onChangeText={(text) => setForm({ ...form, reason: text })}
                placeholder="I'm passionate about..."
                placeholderTextColor="#64748B"
                multiline
                maxLength={300}
              />
            </View>
            <Text style={styles.charCount}>{form.reason.length}/300</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Your experience *</Text>
            <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={form.experience}
                onChangeText={(text) => setForm({ ...form, experience: text })}
                placeholder="I've organized..."
                placeholderTextColor="#64748B"
                multiline
                maxLength={300}
              />
            </View>
            <Text style={styles.charCount}>{form.experience.length}/300</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Event ideas (optional)</Text>
            <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={form.eventIdeas}
                onChangeText={(text) => setForm({ ...form, eventIdeas: text })}
                placeholder="I'd love to host..."
                placeholderTextColor="#64748B"
                multiline
                maxLength={300}
              />
            </View>
            <Text style={styles.charCount}>{form.eventIdeas.length}/300</Text>
          </View>

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <View style={styles.submitGlass}>
              <Text style={styles.submitButtonText}>
                {submitting ? 'Submitting...' : '✨ Submit Application'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoGlass}>
            <Text style={styles.infoIcon}>💡</Text>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>What happens next?</Text>
              <Text style={styles.infoText}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F1A',
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
    color: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F1F5F9',
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
    color: '#F1F5F9',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  heroText: {
    fontSize: 15,
    color: '#94A3B8',
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
    backgroundColor: 'rgba(17, 24, 39, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
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
    color: '#F1F5F9',
    letterSpacing: -0.1,
  },
  formSection: {
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F1F5F9',
    marginBottom: 20,
    letterSpacing: -0.3,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F1F5F9',
    marginBottom: 10,
    letterSpacing: -0.1,
  },
  inputWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  input: {
    backgroundColor: 'rgba(17, 24, 39, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#F1F5F9',
  },
  textAreaWrapper: {},
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'right',
    marginTop: 6,
  },
  submitButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
  },
  submitGlass: {
    backgroundColor: 'rgba(255, 62, 165, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 62, 165, 0.4)',
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FF3EA5',
    letterSpacing: -0.2,
  },
  infoCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  infoGlass: {
    backgroundColor: 'rgba(0, 242, 254, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.2)',
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
    color: '#00F2FE',
    marginBottom: 10,
    letterSpacing: -0.1,
  },
  infoText: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 20,
  },
});
