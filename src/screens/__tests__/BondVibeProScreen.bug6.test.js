/**
 * BUG 6 — paying doesn't leave you on the paywall.
 *
 * The bug was a race, so that's what these pin: returning from Stripe is not the
 * same as being entitled. The webhook grants Pro and can land after the browser
 * closes, and the old code just re-rendered the shop.
 */
import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import { startProCheckout } from "../../services/proService";
import { usePremium, waitForPremium } from "../../hooks/usePremium";
import BondVibeProScreen from "../BondVibeProScreen";

jest.mock("../../services/proService", () => ({
  startProCheckout: jest.fn(),
  openProPortal: jest.fn(),
}));
jest.mock("../../hooks/usePremium", () => ({
  usePremium: jest.fn(),
  waitForPremium: jest.fn(),
}));
jest.mock("../../components/Icon", () => () => null);
jest.mock("../../components/GradientBackground", () => {
  const { View } = require("react-native");
  return ({ children }) => <View>{children}</View>;
});
jest.mock("../../contexts/ThemeContext", () => ({
  useTheme: () => ({
    isDark: false,
    colors: {
      text: "#000", textSecondary: "#666", textTertiary: "#999", primary: "#7C3AED",
      border: "#ECE8F2", brandSoft: "#F1E9FE",
    },
  }),
}));
jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (k) => k }) }));

const setup = () => {
  const navigation = { replace: jest.fn(), goBack: jest.fn(), navigate: jest.fn() };
  return { navigation, ...render(<BondVibeProScreen navigation={navigation} />) };
};

describe("BondVibeProScreen — after paying", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    usePremium.mockReturnValue({ isPremium: false, loading: false });
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  it("waits for the entitlement, then leaves the paywall for the Business Hub", async () => {
    startProCheckout.mockResolvedValue({ completed: true, cancelled: false });
    waitForPremium.mockResolvedValue(true);

    const utils = setup();
    fireEvent.press(utils.getByText("bondvibePro.ctaGoPro"));

    await waitFor(() => expect(waitForPremium).toHaveBeenCalled());
    // The destination of value — not the shop they just bought from.
    expect(utils.navigation.replace).toHaveBeenCalledWith("BusinessHub");
  });

  it("does not navigate on the strength of a closed browser alone", async () => {
    // Stripe redirected back, but the webhook never landed.
    startProCheckout.mockResolvedValue({ completed: true, cancelled: false });
    waitForPremium.mockResolvedValue(false);

    const utils = setup();
    fireEvent.press(utils.getByText("bondvibePro.ctaGoPro"));

    await waitFor(() => expect(Alert.alert).toHaveBeenCalled());
    expect(utils.navigation.replace).not.toHaveBeenCalled();
    // Honest about the gap: not a failure, not a fake success.
    expect(Alert.alert.mock.calls[0][0]).toBe("bondvibePro.processingTitle");
  });

  it("stays put and says nothing when checkout is cancelled", async () => {
    startProCheckout.mockResolvedValue({ completed: false, cancelled: true });

    const utils = setup();
    fireEvent.press(utils.getByText("bondvibePro.ctaGoPro"));

    await waitFor(() => expect(startProCheckout).toHaveBeenCalled());
    expect(waitForPremium).not.toHaveBeenCalled();
    expect(utils.navigation.replace).not.toHaveBeenCalled();
    expect(Alert.alert).not.toHaveBeenCalled(); // cancelling isn't an error
  });

  it("shows the buy CTA only while not Pro", () => {
    expect(setup().getByText("bondvibePro.ctaGoPro")).toBeTruthy();
  });

  it("offers subscription management instead once Pro — reactively", () => {
    usePremium.mockReturnValue({ isPremium: true, loading: false });
    const utils = setup();
    expect(utils.getByText("bondvibePro.manageSubscription")).toBeTruthy();
    expect(utils.queryByText("bondvibePro.ctaGoPro")).toBeNull();
  });
});
