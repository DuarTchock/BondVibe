import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useStripe, CardField } from '@stripe/stripe-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { auth } from '../../services/firebase';
import {
  createEventPaymentIntent,
  formatMXN,
  getPricingInfo,
} from '../../services/stripeService';

export default function CheckoutScreen({ route, navigation }) {
  const { eventId, eventTitle, amount } = route.params;
  const { colors, isDark } = useTheme();
  const { confirmPayment } = useStripe();
  
  const [loading, setLoading] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [pricingInfo, setPricingInfo] = useState(null);
  const [loadingPricing, setLoadingPricing] = useState(true);

  useEffect(() => {
    loadPricingInfo();
  }, []);

  const loadPricingInfo = async () => {
    try {
      const info = await getPricingInfo(amount);
      setPricingInfo(info.eventSplit);
      setLoadingPricing(false);
    } catch (error) {
      console.error('Error loading pricing:', error);
      Alert.alert('Error', 'Could not load pricing information');
      setLoadingPricing(false);
    }
  };

  const handlePayment = async () => {
    if (!cardComplete) {
      Alert.alert('Incomplete', 'Please enter complete card details');
      return;
    }

    setLoading(true);

    try {
      // Create payment intent
      const { clientSecret, paymentIntentId, split } = await createEventPaymentIntent(
        eventId,
        auth.currentUser.uid,
        amount
      );

      console.log('Payment Intent created:', paymentIntentId);

      // Confirm payment with Stripe
      const { paymentIntent, error } = await confirmPayment(clientSecret, {
        paymentMethodType: 'Card',
      });

      if (error) {
        console.error('Payment failed:', error);
        Alert.alert('Payment Failed', error.message);
        setLoading(false);
        return;
      }

      if (paymentIntent.status === 'Succeeded') {
        console.log('✅ Payment succeeded!');
        Alert.alert(
          'Payment Successful! 🎉',
          `You've successfully joined "${eventTitle}"`,
          [
            {
              text: 'View Event',
              onPress: () => {
                navigation.reset({
                  index: 0,
                  routes: [
                    { name: 'Home' },
                    { name: 'EventDetail', params: { eventId } },
                  ],
                });
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      Alert.alert('Error', 'Payment processing failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const styles = createStyles(colors);

  if (loadingPricing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backButton, { color: colors.text }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Checkout
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Event Info */}
        <View
          style={[
            styles.eventCard,
            {
              backgroundColor: colors.surfaceGlass,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.eventTitle, { color: colors.text }]}>
            {eventTitle}
          </Text>
          <Text style={[styles.eventPrice, { color: colors.primary }]}>
            {formatMXN(amount)}
          </Text>
        </View>

        {/* Pricing Breakdown */}
        {pricingInfo && (
          <View
            style={[
              styles.breakdownCard,
              {
                backgroundColor: colors.surfaceGlass,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.breakdownTitle, { color: colors.text }]}>
              Price Breakdown
            </Text>

            <View style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>
                Ticket Price
              </Text>
              <Text style={[styles.breakdownValue, { color: colors.text }]}>
                ${pricingInfo.eventPrice} MXN
              </Text>
            </View>

            <View style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>
                Platform Fee (5%)
              </Text>
              <Text style={[styles.breakdownValue, { color: colors.text }]}>
                ${pricingInfo.platformFee} MXN
              </Text>
            </View>

            <View style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>
                Processing Fee
              </Text>
              <Text style={[styles.breakdownValue, { color: colors.text }]}>
                ${pricingInfo.stripeFee} MXN
              </Text>
            </View>

            <View
              style={[
                styles.breakdownDivider,
                { backgroundColor: colors.border },
              ]}
            />

            <View style={styles.breakdownRow}>
              <Text style={[styles.totalLabel, { color: colors.text }]}>
                Total
              </Text>
              <Text style={[styles.totalValue, { color: colors.primary }]}>
                {formatMXN(amount)}
              </Text>
            </View>

            <Text style={[styles.hostReceivesText, { color: colors.textTertiary }]}>
              Host receives: ${pricingInfo.hostReceives} MXN
            </Text>
          </View>
        )}

        {/* Card Input */}
        <View
          style={[
            styles.cardContainer,
            {
              backgroundColor: colors.surfaceGlass,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.cardLabel, { color: colors.text }]}>
            Card Details
          </Text>
          <CardField
            postalCodeEnabled={false}
            onCardChange={(cardDetails) => {
              setCardComplete(cardDetails.complete);
            }}
            style={styles.cardField}
            cardStyle={{
              backgroundColor: colors.surface,
              textColor: colors.text,
              placeholderColor: colors.textTertiary,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          />
          <Text style={[styles.secureText, { color: colors.textTertiary }]}>
            🔒 Your payment is secure and encrypted
          </Text>
        </View>

        {/* Pay Button */}
        <TouchableOpacity
          style={[
            styles.payButton,
            {
              backgroundColor: cardComplete && !loading ? colors.primary : colors.border,
            },
          ]}
          onPress={handlePayment}
          disabled={!cardComplete || loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.payButtonText}>
              Pay {formatMXN(amount)}
            </Text>
          )}
        </TouchableOpacity>

        {/* Terms */}
        <Text style={[styles.termsText, { color: colors.textTertiary }]}>
          By completing this purchase, you agree to BondVibe's{' '}
          <Text style={{ color: colors.primary }}>Terms of Service</Text> and{' '}
          <Text style={{ color: colors.primary }}>Privacy Policy</Text>
        </Text>
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
    eventCard: {
      padding: 20,
      borderRadius: 16,
      borderWidth: 1,
      marginBottom: 20,
    },
    eventTitle: {
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 8,
      letterSpacing: -0.3,
    },
    eventPrice: {
      fontSize: 32,
      fontWeight: '800',
      letterSpacing: -0.5,
    },
    breakdownCard: {
      padding: 20,
      borderRadius: 16,
      borderWidth: 1,
      marginBottom: 20,
    },
    breakdownTitle: {
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 16,
      letterSpacing: -0.2,
    },
    breakdownRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    breakdownLabel: {
      fontSize: 14,
    },
    breakdownValue: {
      fontSize: 14,
      fontWeight: '600',
    },
    breakdownDivider: {
      height: 1,
      marginVertical: 12,
    },
    totalLabel: {
      fontSize: 16,
      fontWeight: '700',
    },
    totalValue: {
      fontSize: 16,
      fontWeight: '800',
    },
    hostReceivesText: {
      fontSize: 12,
      marginTop: 8,
      textAlign: 'right',
    },
    cardContainer: {
      padding: 20,
      borderRadius: 16,
      borderWidth: 1,
      marginBottom: 20,
    },
    cardLabel: {
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 16,
      letterSpacing: -0.2,
    },
    cardField: {
      height: 50,
      marginBottom: 12,
    },
    secureText: {
      fontSize: 12,
      textAlign: 'center',
    },
    payButton: {
      height: 56,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    payButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: -0.2,
    },
    termsText: {
      fontSize: 12,
      textAlign: 'center',
      lineHeight: 18,
    },
  });
}
