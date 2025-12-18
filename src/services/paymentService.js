// ============================================
// PAYMENT TRACKING SERVICE
// src/services/paymentService.js
// ============================================

import { db, auth } from './firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';

/**
 * Save payment record to Firestore
 * Called after successful payment
 */
export const savePaymentRecord = async (paymentData) => {
  try {
    console.log('💾 Saving payment record:', paymentData);

    const paymentRecord = {
      userId: auth.currentUser.uid,
      eventId: paymentData.eventId,
      paymentIntentId: paymentData.paymentIntentId,
      amount: paymentData.amount, // En centavos
      currency: paymentData.currency || 'mxn',
      status: 'succeeded',
      createdAt: new Date().toISOString(),
      eventTitle: paymentData.eventTitle,
      hostId: paymentData.hostId,
    };

    const docRef = await addDoc(collection(db, 'payments'), paymentRecord);
    
    console.log('✅ Payment record saved:', docRef.id);
    
    return {
      success: true,
      paymentId: docRef.id,
    };
  } catch (error) {
    console.error('❌ Error saving payment record:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get user's payment for specific event
 */
export const getUserEventPayment = async (userId, eventId) => {
  try {
    const paymentsQuery = query(
      collection(db, 'payments'),
      where('userId', '==', userId),
      where('eventId', '==', eventId),
      where('status', '==', 'succeeded')
    );

    const snapshot = await getDocs(paymentsQuery);
    
    if (snapshot.empty) {
      return null;
    }

    const paymentDoc = snapshot.docs[0];
    return {
      id: paymentDoc.id,
      ...paymentDoc.data(),
    };
  } catch (error) {
    console.error('❌ Error getting payment:', error);
    return null;
  }
};

/**
 * Get all payments for an event
 * Used by hosts to see who paid
 */
export const getEventPayments = async (eventId) => {
  try {
    const paymentsQuery = query(
      collection(db, 'payments'),
      where('eventId', '==', eventId),
      where('status', '==', 'succeeded')
    );

    const snapshot = await getDocs(paymentsQuery);
    
    const payments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return payments;
  } catch (error) {
    console.error('❌ Error getting event payments:', error);
    return [];
  }
};

/**
 * Get user's payment history
 */
export const getUserPaymentHistory = async (userId) => {
  try {
    const paymentsQuery = query(
      collection(db, 'payments'),
      where('userId', '==', userId)
    );

    const snapshot = await getDocs(paymentsQuery);
    
    const payments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Sort by date descending
    payments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return payments;
  } catch (error) {
    console.error('❌ Error getting payment history:', error);
    return [];
  }
};

/**
 * Check if user has paid for event
 */
export const hasUserPaidForEvent = async (userId, eventId) => {
  const payment = await getUserEventPayment(userId, eventId);
  return payment !== null && payment.status === 'succeeded';
};
