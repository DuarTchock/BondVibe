/**
 * E3 — Kinlo Plus checkout (attendee). Opens Stripe hosted Checkout; the webhook
 * flips users/{uid}.plan to "kinlo_plus" on success (Block 2.5).
 */
import React, { useState, useEffect } from "react";
import { Alert } from "react-native";
import SubscriptionCheckoutView from "./SubscriptionCheckoutView";
import { startPlusCheckout } from "../../services/plusService";
import { getSubscriptionConfig, SUBSCRIPTION_DEFAULTS } from "../../services/configService";

export default function PlusCheckoutScreen({ navigation }) {
  const [plus, setPlus] = useState(SUBSCRIPTION_DEFAULTS.plus);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getSubscriptionConfig().then((c) => setPlus(c.plus));
  }, []);

  const onSubscribe = async () => {
    setLoading(true);
    try {
      await startPlusCheckout();
      navigation.replace("PlusActivated");
    } catch (e) {
      Alert.alert("Checkout", e.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SubscriptionCheckoutView
      title="Kinlo Plus"
      planName="Kinlo Plus"
      amount={plus.amount}
      currency={plus.currency}
      interval={plus.interval}
      note="Unlimited matches at every event."
      loading={loading}
      onSubscribe={onSubscribe}
      onBack={() => navigation.goBack()}
    />
  );
}
