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
import { auth, db } from '../services/firebase';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import Colors from '../constants/Colors';
import Sizes from '../constants/Sizes';

export default function RequestHostScreen({ navigation }) {
  const [message, setMessage] = useState('');
  const [experience, setExperience] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmitRequest = async () => {
    if (!message.trim()) {
      Alert.alert('Error', 'Please tell us why you want to be a host');
      return;
    }

    setLoading(true);

    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      const userData = userDoc.data();

      await addDoc(collection(db, 'hostRequests'), {
        userId: auth.currentUser.uid,
        userName: userData.fullName,
        email: userData.email,
        message: message.trim(),
        experience: experience.trim(),
        status: 'pending',
        createdAt: new Date().toISOString(),
      });

      Alert.alert(
        'Request Submitted!',
        'We will review your application and get back to you within 2-3 business days.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Submit request error:', error);
      Alert.alert('Error', 'Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Become a Host</Text>
        <Text style={styles.subtitle}>
          Help build community by organizing events
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>🎯 What is a Verified Host?</Text>
          <Text style={styles.infoText}>
            Verified hosts can create and manage events on BondVibe. We verify hosts to ensure quality experiences for our community.
          </Text>
        </View>

        <View style={styles.benefitsSection}>
          <Text style={styles.sectionTitle}>Benefits:</Text>
          <View style={styles.benefit}>
            <Text style={styles.benefitIcon}>✓</Text>
            <Text style={styles.benefitText}>Create unlimited events</Text>
          </View>
          <View style={styles.benefit}>
            <Text style={styles.benefitIcon}>✓</Text>
            <Text style={styles.benefitText}>Verified host badge</Text>
          </View>
          <View style={styles.benefit}>
            <Text style={styles.benefitIcon}>✓</Text>
            <Text style={styles.benefitText}>Build your community</Text>
          </View>
          <View style={styles.benefit}>
            <Text style={styles.benefitIcon}>✓</Text>
            <Text style={styles.benefitText}>Priority support</Text>
          </View>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Why do you want to be a host? *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Tell us about your passion for bringing people together..."
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={6}
            maxLength={500}
          />
          <Text style={styles.charCount}>{message.length}/500</Text>

          <Text style={styles.label}>Previous experience (optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Have you organized events before? Tell us about it..."
            value={experience}
            onChangeText={setExperience}
            multiline
            numberOfLines={4}
            maxLength={300}
          />
          <Text style={styles.charCount}>{experience.length}/300</Text>

          <View style={styles.requirementsBox}>
            <Text style={styles.requirementsTitle}>Requirements:</Text>
            <Text style={styles.requirementText}>• Verified email address ✓</Text>
            <Text style={styles.requirementText}>• Complete profile ✓</Text>
            <Text style={styles.requirementText}>• Good standing in community</Text>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.buttonDisabled]}
            onPress={handleSubmitRequest}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Submitting...' : 'Submit Application'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.note}>
            💡 Applications are typically reviewed within 2-3 business days. We will email you with the decision.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: Sizes.padding * 2,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    fontSize: Sizes.fontSize.medium,
    color: Colors.primary,
    fontWeight: '600',
    marginBottom: 12,
  },
  title: {
    fontSize: Sizes.fontSize.xlarge,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: Sizes.fontSize.medium,
    color: Colors.textLight,
  },
  content: {
    padding: Sizes.padding * 2,
  },
  infoBox: {
    backgroundColor: '#F0F0FF',
    padding: 20,
    borderRadius: Sizes.borderRadius,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: Sizes.fontSize.medium,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: Sizes.fontSize.small,
    color: Colors.text,
    lineHeight: 20,
  },
  benefitsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: Sizes.fontSize.large,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  benefitIcon: {
    fontSize: 18,
    color: Colors.success,
    marginRight: 12,
    fontWeight: 'bold',
  },
  benefitText: {
    fontSize: Sizes.fontSize.medium,
    color: Colors.text,
  },
  form: {
    marginTop: 8,
  },
  label: {
    fontSize: Sizes.fontSize.medium,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8F9FA',
    padding: Sizes.padding,
    borderRadius: Sizes.borderRadius,
    marginBottom: 8,
    fontSize: Sizes.fontSize.medium,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: Sizes.fontSize.small,
    color: Colors.textLight,
    textAlign: 'right',
    marginBottom: 16,
  },
  requirementsBox: {
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: Sizes.borderRadius,
    marginBottom: 24,
  },
  requirementsTitle: {
    fontSize: Sizes.fontSize.medium,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  requirementText: {
    fontSize: Sizes.fontSize.small,
    color: Colors.text,
    marginBottom: 4,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    padding: Sizes.padding + 4,
    borderRadius: Sizes.borderRadius,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: Sizes.fontSize.large,
    fontWeight: '700',
  },
  note: {
    fontSize: Sizes.fontSize.small,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
});
