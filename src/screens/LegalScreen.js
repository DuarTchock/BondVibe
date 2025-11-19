import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { useTheme } from '../contexts/ThemeContext';
import LegalDocumentModal from '../components/LegalDocumentModal';

// Contenido de los documentos legales
const TERMS_OF_SERVICE = `Terms of Service

Last Updated: November 2024

1. Acceptance of Terms
By accessing and using BondVibe, you accept and agree to be bound by the terms and provision of this agreement.

2. Use License
Permission is granted to temporarily use BondVibe for personal, non-commercial transitory viewing only.

3. User Accounts
- You must provide accurate information when creating an account
- You are responsible for maintaining the security of your account
- You must be at least 18 years old to use this service

4. User Conduct
You agree not to:
- Use the service for any illegal purpose
- Harass, abuse, or harm other users
- Impersonate any person or entity
- Transmit any harmful code or malware

5. Content
- You retain rights to content you post
- By posting, you grant us a license to use, modify, and display your content
- We reserve the right to remove any content that violates these terms

6. Privacy
Your use of BondVibe is also governed by our Privacy Policy.

7. Events and Gatherings
- Users attend events at their own risk
- BondVibe is not responsible for the conduct of event hosts or attendees
- Report any safety concerns immediately

8. Termination
We reserve the right to terminate or suspend access to our service immediately, without prior notice, for any reason.

9. Disclaimer
The service is provided "as is" without warranties of any kind.

10. Limitation of Liability
BondVibe shall not be liable for any indirect, incidental, special, consequential or punitive damages.

11. Changes to Terms
We reserve the right to modify these terms at any time. Continued use constitutes acceptance of modified terms.

12. Contact Us
For questions about these Terms, contact us at legal@bondvibe.com`;

const PRIVACY_POLICY = `Privacy Policy

Last Updated: November 2024

1. Information We Collect

Personal Information:
- Email address
- Name and profile information
- Personality assessment responses
- Location data
- Event participation history

Automatically Collected:
- Device information
- Usage data
- Log files
- Cookies and similar technologies

2. How We Use Your Information

We use collected information to:
- Provide and maintain our service
- Match you with compatible group experiences
- Improve and personalize your experience
- Communicate with you about events and updates
- Ensure safety and prevent fraud
- Comply with legal obligations

3. Personality Assessment Data

- Your Big Five personality traits are used for group matching
- This data is stored securely and used only for compatibility purposes
- You can request deletion of this data at any time

4. Sharing Your Information

We do not sell your personal information. We may share data with:
- Other users (limited profile information for matched events)
- Service providers who assist our operations
- Law enforcement when legally required
- In connection with a business transfer or merger

5. Data Security

We implement appropriate security measures to protect your information:
- Encryption of data in transit and at rest
- Regular security audits
- Access controls and authentication
- Secure data storage with Firebase

6. Your Rights

You have the right to:
- Access your personal data
- Correct inaccurate data
- Request deletion of your data
- Object to processing
- Export your data
- Withdraw consent

7. Location Data

We collect location information to:
- Show you nearby events
- Match you with local communities
- Provide location-based recommendations

You can disable location services in your device settings.

8. Communications

We may send you:
- Event notifications
- Service updates
- Safety alerts
- Marketing communications (you can opt out)

9. Third-Party Services

We use third-party services including:
- Firebase (Google) for authentication and data storage
- Analytics providers
- Email service providers

These services have their own privacy policies.

10. Children's Privacy

BondVibe is not intended for users under 18. We do not knowingly collect information from minors.

11. International Users

Your information may be transferred to and processed in countries other than your own.

12. Changes to Privacy Policy

We will notify you of any material changes to this policy via email or app notification.

13. Contact Us

For privacy concerns or requests, contact us at:
- Email: privacy@bondvibe.com
- Mail: BondVibe Privacy Team, [Address]

14. Data Retention

We retain your data for as long as your account is active or as needed to provide services. You can request deletion at any time.`;

export default function LegalScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const handleContinue = async () => {
    console.log('🔘 Continue clicked');
    console.log('📋 Terms accepted:', termsAccepted);
    console.log('🔒 Privacy accepted:', privacyAccepted);

    if (!termsAccepted || !privacyAccepted) {
      console.log('❌ Not all terms accepted');
      Alert.alert('Please Accept Terms', 'You must accept both Terms of Service and Privacy Policy to continue.');
      return;
    }

    setLoading(true);
    console.log('⏳ Starting legal acceptance update...');

    try {
      const user = auth.currentUser;
      if (!user) {
        console.log('❌ No user found');
        Alert.alert('Error', 'No user found. Please log in again.');
        setLoading(false);
        return;
      }

      console.log('👤 Updating legal acceptance for user:', user.uid);
      
      await updateDoc(doc(db, 'users', user.uid), {
        legalAccepted: true,
        legalAcceptedAt: new Date().toISOString(),
      });
      
      console.log('✅ Legal acceptance updated successfully');
      console.log('🔄 AppNavigator should detect change and navigate...');
      
      // AppNavigator will handle navigation automatically
      
    } catch (error) {
      console.error('❌ Error updating legal acceptance:', error);
      Alert.alert('Error', 'Failed to save your consent. Please try again.');
      setLoading(false);
    }
  };

  const styles = createStyles(colors);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.icon}>📋</Text>
          <Text style={[styles.title, { color: colors.text }]}>Legal Stuff</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            We need your consent to continue
          </Text>
        </View>

        <View style={styles.agreements}>
          {/* Terms of Service */}
          <TouchableOpacity
            style={[styles.agreementCard, {
              backgroundColor: colors.surfaceGlass,
              borderColor: termsAccepted ? colors.primary : colors.border,
              borderWidth: termsAccepted ? 2 : 1,
            }]}
            onPress={() => {
              console.log('📝 Terms checkbox clicked');
              setTermsAccepted(!termsAccepted);
            }}
            activeOpacity={0.7}
          >
            <View style={styles.checkbox}>
              <View style={[styles.checkboxInner, {
                backgroundColor: termsAccepted ? colors.primary : 'transparent',
                borderColor: termsAccepted ? colors.primary : colors.border,
              }]}>
                {termsAccepted && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </View>
            <View style={styles.agreementText}>
              <Text style={[styles.agreementTitle, { color: colors.text }]}>
                Terms of Service
              </Text>
              <Text style={[styles.agreementSubtitle, { color: colors.textSecondary }]}>
                I agree to BondVibe's Terms of Service
              </Text>
              <TouchableOpacity 
                onPress={(e) => {
                  e.stopPropagation();
                  console.log('📖 Opening Terms modal');
                  setShowTermsModal(true);
                }}
                style={styles.readLink}
              >
                <Text style={[styles.readLinkText, { color: colors.primary }]}>
                  Read Terms →
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>

          {/* Privacy Policy */}
          <TouchableOpacity
            style={[styles.agreementCard, {
              backgroundColor: colors.surfaceGlass,
              borderColor: privacyAccepted ? colors.primary : colors.border,
              borderWidth: privacyAccepted ? 2 : 1,
            }]}
            onPress={() => {
              console.log('🔒 Privacy checkbox clicked');
              setPrivacyAccepted(!privacyAccepted);
            }}
            activeOpacity={0.7}
          >
            <View style={styles.checkbox}>
              <View style={[styles.checkboxInner, {
                backgroundColor: privacyAccepted ? colors.primary : 'transparent',
                borderColor: privacyAccepted ? colors.primary : colors.border,
              }]}>
                {privacyAccepted && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </View>
            <View style={styles.agreementText}>
              <Text style={[styles.agreementTitle, { color: colors.text }]}>
                Privacy Policy
              </Text>
              <Text style={[styles.agreementSubtitle, { color: colors.textSecondary }]}>
                I agree to BondVibe's Privacy Policy
              </Text>
              <TouchableOpacity 
                onPress={(e) => {
                  e.stopPropagation();
                  console.log('📖 Opening Privacy modal');
                  setShowPrivacyModal(true);
                }}
                style={styles.readLink}
              >
                <Text style={[styles.readLinkText, { color: colors.primary }]}>
                  Read Privacy Policy →
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.continueButton, {
            opacity: (termsAccepted && privacyAccepted) ? 1 : 0.5,
          }]}
          onPress={handleContinue}
          disabled={!termsAccepted || !privacyAccepted || loading}
        >
          <View style={[styles.continueGlass, {
            backgroundColor: `${colors.primary}33`,
            borderColor: `${colors.primary}66`,
          }]}>
            {loading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={[styles.continueText, { color: colors.primary }]}>
                Continue
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Modals for displaying documents */}
      <LegalDocumentModal
        visible={showTermsModal}
        onClose={() => {
          console.log('📖 Closing Terms modal');
          setShowTermsModal(false);
        }}
        title="Terms of Service"
        content={TERMS_OF_SERVICE}
      />

      <LegalDocumentModal
        visible={showPrivacyModal}
        onClose={() => {
          console.log('📖 Closing Privacy modal');
          setShowPrivacyModal(false);
        }}
        title="Privacy Policy"
        content={PRIVACY_POLICY}
      />
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: { flex: 1 },
    scrollView: { flex: 1 },
    content: { padding: 24, paddingTop: 60 },
    header: { alignItems: 'center', marginBottom: 48 },
    icon: { fontSize: 72, marginBottom: 16 },
    title: { fontSize: 32, fontWeight: '700', marginBottom: 8, letterSpacing: -0.5 },
    subtitle: { fontSize: 15, textAlign: 'center' },
    agreements: { gap: 16, marginBottom: 32 },
    agreementCard: {
      borderRadius: 20,
      padding: 20,
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    checkbox: { marginRight: 16, marginTop: 2 },
    checkboxInner: {
      width: 28,
      height: 28,
      borderRadius: 8,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkmark: { color: '#FFF', fontSize: 16, fontWeight: '700' },
    agreementText: { flex: 1 },
    agreementTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
    agreementSubtitle: { fontSize: 14, marginBottom: 8 },
    readLink: { paddingVertical: 4 },
    readLinkText: { fontSize: 14, fontWeight: '600' },
    continueButton: { borderRadius: 16, overflow: 'hidden', marginTop: 16 },
    continueGlass: { borderWidth: 1, paddingVertical: 18, alignItems: 'center' },
    continueText: { fontSize: 18, fontWeight: '700', letterSpacing: -0.2 },
  });
}
