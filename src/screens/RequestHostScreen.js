import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import Colors from '../constants/Colors';
import Sizes from '../constants/Sizes';

export default function RequestHostScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    reason: '',
    experience: '',
    eventIdeas: '',
  });

  const handleSubmit = async () => {
    if (!formData.reason.trim()) {
      Alert.alert('Error', 'Please tell us why you want to become a host');
      return;
    }

    if (!formData.experience.trim()) {
      Alert.alert('Error', 'Please share your relevant experience');
      return;
    }

    setLoading(true);
    try {
      // Check if user already has a pending request
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      const userData = userDoc.data();

      if (userData?.role === 'verified_host') {
        Alert.alert('Already a Host', 'You are already a verified host!');
        setLoading(false);
        navigation.goBack();
        return;
      }

      // Create host request
      await addDoc(collection(db, 'hostRequests'), {
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        userName: userData?.fullName || 'Unknown',
        reason: formData.reason.trim(),
        experience: formData.experience.trim(),
        eventIdeas: formData.eventIdeas.trim(),
        status: 'pending',
        createdAt: new Date().toISOString(),
      });

      console.log('✅ Host request submitted');

      // Show success message
      Alert.alert(
        'Request Submitted! 🎉',
        'Your host request has been submitted successfully. We\'ll review it and get back to you soon via email.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error submitting host request:', error);
      Alert.alert(
        'Submission Failed',
        'There was an error submitting your request. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Become a Host</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroSection}>
          <Text style={styles.heroEmoji}>🎯</Text>
          <Text style={styles.heroTitle}>Become a Host</Text>
          <Text style={styles.heroSubtitle}>
            Want to organize events and bring people together?
          </Text>
          <Text style={styles.heroDescription}>
            Verified hosts can create and manage events on BondVibe.
          </Text>
        </View>

        <View style={styles.benefitsCard}>
          <Text style={styles.benefitsTitle}>Host Benefits:</Text>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>✓</Text>
            <Text style={styles.benefitText}>Create unlimited events</Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>✓</Text>
            <Text style={styles.benefitText}>Build your community</Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>✓</Text>
            <Text style={styles.benefitText}>Verified host badge</Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>✓</Text>
            <Text style={styles.benefitText}>Priority support</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Tell us about yourself</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Why do you want to become a host? *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.reason}
            onChangeText={(text) => setFormData({ ...formData, reason: text })}
            placeholder="Share your motivation for hosting events..."
            multiline
            maxLength={300}
            placeholderTextColor={Colors.textLight}
          />
          <Text style={styles.charCount}>{formData.reason.length}/300</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Relevant Experience *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.experience}
            onChangeText={(text) => setFormData({ ...formData, experience: text })}
            placeholder="Tell us about your experience organizing events or building communities..."
            multiline
            maxLength={300}
            placeholderTextColor={Colors.textLight}
          />
          <Text style={styles.charCount}>{formData.experience.length}/300</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Event Ideas (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.eventIdeas}
            onChangeText={(text) => setFormData({ ...formData, eventIdeas: text })}
            placeholder="What types of events would you like to host?"
            multiline
            maxLength={300}
            placeholderTextColor={Colors.textLight}
          />
          <Text style={styles.charCount}>{formData.eventIdeas.length}/300</Text>
        </View>

        <View style={styles.noteCard}>
          <Text style={styles.noteIcon}>ℹ️</Text>
          <Text style={styles.noteText}>
            We review all host applications carefully. You'll receive an email with our decision within 2-3 business days.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Request Host Access</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: Sizes.padding * 2,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    fontSize: Sizes.fontSize.medium,
    color: Colors.primary,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: Sizes.fontSize.large,
    fontWeight: 'bold',
    color: Colors.text,
  },
  content: {
    padding: Sizes.padding * 2,
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
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: Sizes.fontSize.large,
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  heroDescription: {
    fontSize: Sizes.fontSize.medium,
    color: Colors.textLight,
    textAlign: 'center',
  },
  benefitsCard: {
    backgroundColor: Colors.background,
    padding: 20,
    borderRadius: Sizes.borderRadius,
    marginBottom: 32,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  benefitsTitle: {
    fontSize: Sizes.fontSize.large,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitIcon: {
    fontSize: 20,
    color: Colors.success,
    marginRight: 12,
    fontWeight: 'bold',
  },
  benefitText: {
    fontSize: Sizes.fontSize.medium,
    color: Colors.text,
  },
  sectionTitle: {
    fontSize: Sizes.fontSize.large,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: Sizes.fontSize.medium,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Sizes.borderRadius,
    padding: 12,
    fontSize: Sizes.fontSize.medium,
    color: Colors.text,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: Sizes.fontSize.small,
    color: Colors.textLight,
    textAlign: 'right',
    marginTop: 4,
  },
  noteCard: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: Sizes.borderRadius,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  noteIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  noteText: {
    flex: 1,
    fontSize: Sizes.fontSize.small,
    color: Colors.text,
    lineHeight: 20,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    padding: Sizes.padding + 4,
    borderRadius: Sizes.borderRadius,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: Sizes.fontSize.large,
    fontWeight: '700',
  },
});
