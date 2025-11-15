import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Colors from '../constants/Colors';
import Sizes from '../constants/Sizes';

export default function LegalScreen({ navigation, onAccept }) {
  const [activeTab, setActiveTab] = useState('terms');
  const [accepted, setAccepted] = useState(false);

  const termsContent = `TERMS OF SERVICE

Last Updated: November 15, 2025

Welcome to BondVibe! By using our service, you agree to these terms.

1. ACCEPTANCE OF TERMS
By accessing and using BondVibe, you accept and agree to be bound by these Terms of Service.

2. ELIGIBILITY
You must be at least 18 years old to use BondVibe.

3. USER ACCOUNTS
- You are responsible for maintaining the confidentiality of your account
- You agree to provide accurate and complete information
- You are responsible for all activities under your account

4. USER CONDUCT
You agree NOT to:
- Harass, abuse, or harm other users
- Impersonate any person or entity
- Post false or misleading information
- Violate any laws or regulations

5. EVENTS AND GATHERINGS
- BondVibe facilitates connections but does not organize events
- You attend events at your own risk
- Users are responsible for their own safety
- BondVibe is not liable for any incidents at events

6. CONTENT
- You retain ownership of content you post
- You grant BondVibe a license to use your content
- BondVibe may remove content that violates these terms

7. PRIVACY
Your use of BondVibe is subject to our Privacy Policy.

8. TERMINATION
BondVibe may suspend or terminate your account for violations of these terms.

9. DISCLAIMER
BondVibe is provided "AS IS" without warranties of any kind.

10. LIMITATION OF LIABILITY
BondVibe shall not be liable for any indirect, incidental, or consequential damages.

11. CHANGES TO TERMS
We may update these terms. Continued use constitutes acceptance of changes.

12. CONTACT
For questions: support@bondvibe.com`;

  const privacyContent = `PRIVACY POLICY

Last Updated: November 15, 2025

BondVibe is committed to protecting your privacy.

1. INFORMATION WE COLLECT

Information You Provide:
- Email address
- Full name
- Age
- Location
- Bio (optional)
- Personality test responses

Automatically Collected:
- Device information
- Usage data
- Log data

2. HOW WE USE YOUR INFORMATION
We use your information to:
- Provide and improve our services
- Match you with compatible users for events
- Send notifications and updates
- Ensure safety and prevent fraud
- Comply with legal obligations

3. INFORMATION SHARING
We DO NOT sell your personal information.

We may share information with:
- Other users (limited profile information)
- Service providers (Firebase, analytics)
- Legal authorities (when required by law)

4. YOUR RIGHTS
You have the right to:
- Access your personal information
- Correct inaccurate information
- Delete your account and data
- Opt-out of marketing communications
- Export your data

5. DATA SECURITY
We implement security measures to protect your information, including:
- Encrypted data transmission
- Secure authentication (Firebase)
- Regular security audits

6. DATA RETENTION
We retain your information as long as your account is active or as needed to provide services.

7. CHILDREN'S PRIVACY
BondVibe is not intended for users under 18. We do not knowingly collect information from minors.

8. INTERNATIONAL USERS
Your information may be transferred to and processed in countries other than your own.

9. THIRD-PARTY SERVICES
We use third-party services:
- Firebase (Google) - Authentication, database, storage
- Analytics tools - Usage tracking

10. CHANGES TO PRIVACY POLICY
We may update this policy. We will notify you of significant changes.

11. CONTACT US
For privacy questions:
- Email: privacy@bondvibe.com
- In-app: Settings → Privacy

12. GDPR/CCPA COMPLIANCE
For users in EU/California:
- Right to access data
- Right to deletion
- Right to portability
- Right to opt-out of sale (we don't sell data)

BondVibe respects your privacy and is committed to transparency.`;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Legal Documents</Text>
        <Text style={styles.subtitle}>Please read and accept to continue</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'terms' && styles.activeTab]}
          onPress={() => setActiveTab('terms')}
        >
          <Text style={[styles.tabText, activeTab === 'terms' && styles.activeTabText]}>
            Terms of Service
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'privacy' && styles.activeTab]}
          onPress={() => setActiveTab('privacy')}
        >
          <Text style={[styles.tabText, activeTab === 'privacy' && styles.activeTabText]}>
            Privacy Policy
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        <Text style={styles.text}>
          {activeTab === 'terms' ? termsContent : privacyContent}
        </Text>
      </ScrollView>

      {/* Acceptance */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => setAccepted(!accepted)}
        >
          <View style={[styles.checkbox, accepted && styles.checkboxChecked]}>
            {accepted && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkboxText}>
            I have read and agree to the Terms of Service and Privacy Policy
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, !accepted && styles.buttonDisabled]}
          onPress={onAccept}
          disabled={!accepted}
        >
          <Text style={styles.buttonText}>Accept and Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
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
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: Sizes.fontSize.small,
    color: Colors.textLight,
    fontWeight: '500',
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    padding: Sizes.padding * 2,
  },
  text: {
    fontSize: Sizes.fontSize.small,
    lineHeight: 20,
    color: Colors.text,
  },
  footer: {
    padding: Sizes.padding * 2,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: '#FFFFFF',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxText: {
    flex: 1,
    fontSize: Sizes.fontSize.small,
    color: Colors.text,
  },
  button: {
    backgroundColor: Colors.primary,
    padding: Sizes.padding,
    borderRadius: Sizes.borderRadius,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: Sizes.fontSize.medium,
    fontWeight: '600',
  },
});
