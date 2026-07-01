import React from "react";
import { render } from "@testing-library/react-native";
import { Text } from "react-native";
import {
  PaymentPill,
  HostBadge,
  AttendeeRow,
  RSVPButton,
  CommunityHeader,
} from "../primitives";

jest.mock("../AvatarPicker", () => ({ AvatarDisplay: () => null }));
jest.mock("../../contexts/ThemeContext", () => ({
  useTheme: () => ({
    colors: {
      text: "#fff", textSecondary: "#999", textTertiary: "#777",
      primary: "#7C3AED", secondary: "#1F8A6E", border: "#333",
    },
    isDark: true,
  }),
}));

describe("UI primitives render", () => {
  it("PaymentPill shows the status", () => {
    const { getByText } = render(<PaymentPill status="Paid" />);
    expect(getByText("Paid")).toBeTruthy();
  });

  it("HostBadge renders", () => {
    const { getByText } = render(<HostBadge />);
    expect(getByText("Verified host")).toBeTruthy();
  });

  it("AttendeeRow shows name + status", () => {
    const { getByText } = render(
      <AttendeeRow name="Bob" status="Checked in" right={<Text>x</Text>} />
    );
    expect(getByText("Bob")).toBeTruthy();
    expect(getByText("Checked in")).toBeTruthy();
  });

  it("RSVPButton renders its label", () => {
    const { getByText } = render(<RSVPButton label="Join" onPress={() => {}} />);
    expect(getByText("Join")).toBeTruthy();
  });

  it("CommunityHeader renders name + subtitle", () => {
    const { getByText } = render(
      <CommunityHeader name="Regulars" subtitle="12 members" />
    );
    expect(getByText("Regulars")).toBeTruthy();
    expect(getByText("12 members")).toBeTruthy();
  });
});
