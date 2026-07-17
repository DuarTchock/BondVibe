/**
 * RequestHostScreen — the structured application (host onboarding redesign).
 *
 * The point of these is the contract the redesign promises: step 1 is the whole
 * application, experience never blocks it, and the doc we write keeps the admin
 * view working. They assert on the Firestore payload and on what's rendered,
 * not on internals.
 */
import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { addDoc, getDocs } from "firebase/firestore";
import RequestHostScreen from "../RequestHostScreen";

jest.mock("../../services/firebase", () => ({ db: {}, auth: { currentUser: { uid: "u1" } } }));
jest.mock("firebase/firestore", () => ({
  collection: jest.fn(() => "col"),
  addDoc: jest.fn(() => Promise.resolve({ id: "req1" })),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(() => Promise.resolve({ empty: true })),
}));
jest.mock("../../components/Icon", () => () => null);
jest.mock("../../components/SuccessModal", () => () => null);
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));
jest.mock("../../contexts/ThemeContext", () => ({
  useTheme: () => ({
    isDark: false,
    colors: {
      text: "#000", textSecondary: "#666", textTertiary: "#999", primary: "#7C3AED",
      border: "#ECE8F2", surface: "#FFF", sunken: "#F7F5FB", background: "#F1F0F4",
      onPrimary: "#FFF",
    },
  }),
}));
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (k, opts) =>
      opts ? `${k}:${JSON.stringify(opts)}` : k,
  }),
}));

const setup = () => {
  const navigation = { goBack: jest.fn(), navigate: jest.fn() };
  return { navigation, ...render(<RequestHostScreen navigation={navigation} />) };
};

/** The CTA label doubles as the step indicator, so find it by that. */
const cta = (utils, step = 1) =>
  utils.getByText(step === 1 ? "requestHost.continue" : "requestHost.submitApplication");

const fillStep1 = (utils, { type = "requestHost.communityTypes.yoga", tagline = "Sunrise yoga" } = {}) => {
  fireEvent.press(utils.getByText(type));
  fireEvent.changeText(utils.getByPlaceholderText("requestHost.taglinePlaceholder"), tagline);
};

describe("RequestHostScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getDocs.mockResolvedValue({ empty: true });
    addDoc.mockResolvedValue({ id: "req1" });
  });

  describe("step 1 — the whole application", () => {
    it("shows no free-text essays, only the one-line tagline", () => {
      const utils = setup();
      // The three 500-char essays that used to gate this screen are gone.
      expect(utils.queryByPlaceholderText("requestHost.whyHostPlaceholder")).toBeNull();
      expect(utils.queryByPlaceholderText("requestHost.eventIdeasPlaceholder")).toBeNull();
      expect(utils.getByPlaceholderText("requestHost.taglinePlaceholder")).toBeTruthy();
    });

    it("offers every community type as a tappable chip", () => {
      const utils = setup();
      ["yoga", "running", "salsa", "wellness", "fitness", "art", "music", "other"].forEach((id) =>
        expect(utils.getByText(`requestHost.communityTypes.${id}`)).toBeTruthy()
      );
    });

    it("stays blocked until both required answers are given", () => {
      const utils = setup();
      expect(cta(utils).parent.props.accessibilityState?.disabled ?? true).toBeTruthy();

      // Type alone isn't enough…
      fireEvent.press(utils.getByText("requestHost.communityTypes.yoga"));
      fireEvent.press(cta(utils));
      expect(utils.queryByText("requestHost.step2Title")).toBeNull();

      // …tagline completes it.
      fireEvent.changeText(
        utils.getByPlaceholderText("requestHost.taglinePlaceholder"),
        "Sunrise yoga"
      );
      fireEvent.press(cta(utils));
      expect(utils.getByText("requestHost.step2Title")).toBeTruthy();
    });

    it("treats a whitespace-only tagline as unanswered", () => {
      const utils = setup();
      fillStep1(utils, { tagline: "   " });
      fireEvent.press(cta(utils));
      expect(utils.queryByText("requestHost.step2Title")).toBeNull();
    });

    it("reports progress as step 1 of 2", () => {
      const utils = setup();
      expect(utils.getByText('requestHost.stepOf:{"current":1,"total":2}')).toBeTruthy();
    });
  });

  describe("step 2 — optional", () => {
    it("submits without any experience text", async () => {
      const utils = setup();
      fillStep1(utils);
      fireEvent.press(cta(utils));
      fireEvent.press(utils.getByText("requestHost.skipAndSubmit"));

      await waitFor(() => expect(addDoc).toHaveBeenCalled());
      expect(addDoc.mock.calls[0][1].experience).toBeNull();
    });

    it("keeps the experience note when it is written", async () => {
      const utils = setup();
      fillStep1(utils);
      fireEvent.press(cta(utils));
      fireEvent.changeText(
        utils.getByPlaceholderText("requestHost.experiencePlaceholder"),
        "Taught for 5 years"
      );
      fireEvent.press(cta(utils, 2));

      await waitFor(() => expect(addDoc).toHaveBeenCalled());
      expect(addDoc.mock.calls[0][1].experience).toBe("Taught for 5 years");
    });
  });

  describe("the hostRequests document", () => {
    it("stores the structured answers and mirrors tagline into whyHost for the admin view", async () => {
      const utils = setup();
      fillStep1(utils, { tagline: "  Sunrise yoga in the park  " });
      fireEvent.press(utils.getByText("requestHost.frequencies.weekly"));
      fireEvent.press(utils.getByText("requestHost.groupSizes.small"));
      fireEvent.press(cta(utils));
      fireEvent.press(utils.getByText("requestHost.skipAndSubmit"));

      await waitFor(() => expect(addDoc).toHaveBeenCalled());
      expect(addDoc.mock.calls[0][1]).toMatchObject({
        userId: "u1",
        communityType: "yoga",
        frequency: "weekly",
        groupSize: "small",
        tagline: "Sunrise yoga in the park",
        whyHost: "Sunrise yoga in the park", // back-compat mirror
        status: "pending",
      });
    });

    it("writes null — never undefined — for skipped optional chips", async () => {
      const utils = setup();
      fillStep1(utils);
      fireEvent.press(cta(utils));
      fireEvent.press(utils.getByText("requestHost.skipAndSubmit"));

      await waitFor(() => expect(addDoc).toHaveBeenCalled());
      const payload = addDoc.mock.calls[0][1];
      // Firestore rejects undefined outright, so this is a real crash guard.
      expect(payload.frequency).toBeNull();
      expect(payload.groupSize).toBeNull();
      Object.values(payload).forEach((v) => expect(v).not.toBeUndefined());
    });

    it("does not file a second request when one is already pending", async () => {
      getDocs.mockResolvedValue({ empty: false });
      const utils = setup();
      fillStep1(utils);
      fireEvent.press(cta(utils));
      fireEvent.press(utils.getByText("requestHost.skipAndSubmit"));

      await waitFor(() => expect(getDocs).toHaveBeenCalled());
      expect(addDoc).not.toHaveBeenCalled();
    });
  });
});
