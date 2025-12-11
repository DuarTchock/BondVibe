/**
 * Stripe Service - Frontend
 * Handles payment flows in React Native
 */

// Cloud Functions base URL
const FUNCTIONS_BASE_URL = 'https://us-central1-bondvibe-dev.cloudfunctions.net';

/**
 * Create payment intent for event ticket
 */
export const createEventPaymentIntent = async (eventId, userId, amount) => {
  try {
    const response = await fetch(`${FUNCTIONS_BASE_URL}/createEventPaymentIntent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventId,
        userId,
        amount,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create payment intent');
    }

    return data;
  } catch (error) {
    console.error('Error creating event payment intent:', error);
    throw error;
  }
};

/**
 * Create payment intent for tip
 */
export const createTipPaymentIntent = async (hostId, userId, amount, eventId = '', message = '') => {
  try {
    const response = await fetch(`${FUNCTIONS_BASE_URL}/createTipPaymentIntent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        hostId,
        userId,
        amount,
        eventId,
        message,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create tip payment intent');
    }

    return data;
  } catch (error) {
    console.error('Error creating tip payment intent:', error);
    throw error;
  }
};

/**
 * Get pricing information
 */
export const getPricingInfo = async (amount) => {
  try {
    const response = await fetch(`${FUNCTIONS_BASE_URL}/getPricingInfo?amount=${amount}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to get pricing info');
    }

    return data;
  } catch (error) {
    console.error('Error getting pricing info:', error);
    throw error;
  }
};

/**
 * Get Stripe publishable key from environment
 */
export const getStripePublishableKey = () => {
  return process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;
};

/**
 * Format amount in centavos to MXN string
 */
export const formatMXN = (centavos) => {
  const pesos = centavos / 100;
  return `$${pesos.toFixed(2)} MXN`;
};

/**
 * Convert pesos to centavos
 */
export const pesosTocentavos = (pesos) => {
  return Math.round(pesos * 100);
};
