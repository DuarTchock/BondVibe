import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import GroupChatScreen from "../GroupChatScreen";
import {
  getGroup,
  subscribeGroupMessages,
  sendGroupMessage,
  markGroupMessagesRead,
  markGroupNotificationsRead,
} from "../../services/hostGroupService";

jest.mock("../../services/firebase", () => ({
  auth: { currentUser: { uid: "host1" } },
  db: {},
}));
jest.mock("../../services/hostGroupService", () => ({
  getGroup: jest.fn(),
  subscribeGroupMessages: jest.fn(),
  sendGroupMessage: jest.fn(),
  sendEventInvite: jest.fn(),
  markGroupMessagesRead: jest.fn(),
  markGroupNotificationsRead: jest.fn(),
}));
jest.mock("../../services/pollService", () => ({ createPoll: jest.fn() }));
jest.mock("../../components/PollCard", () => () => null);
jest.mock("../../components/KeyboardAccessory", () => () => null);
jest.mock("../../components/GradientBackground", () => {
  const { View } = require("react-native");
  return ({ children }) => <View>{children}</View>;
});
jest.mock("../../contexts/ThemeContext", () => ({
  useTheme: () => ({
    colors: {
      background: "#000", text: "#fff", primary: "#7C3AED",
      textSecondary: "#999", textTertiary: "#777", border: "#333",
      surfaceGlass: "rgba(255,255,255,0.1)",
    },
    isDark: true,
  }),
}));

// host1 + two members; recipients of host1's messages = [m2, m3].
const GROUP = { id: "g1", name: "Regulars", hostId: "host1", memberIds: ["m2", "m3"] };
const nav = { goBack: jest.fn(), navigate: jest.fn() };

const renderWith = (messages) => {
  getGroup.mockResolvedValue(GROUP);
  subscribeGroupMessages.mockImplementation((id, cb) => {
    cb(messages);
    return () => {};
  });
  return render(<GroupChatScreen route={{ params: { groupId: "g1" } }} navigation={nav} />);
};

describe("GroupChatScreen — delivery/read ticks", () => {
  beforeEach(() => jest.clearAllMocks());

  it("shows a 'sent' tick when no recipient has received yet", async () => {
    const { findByTestId } = renderWith([
      { id: "x1", senderId: "host1", type: "text", text: "hello" },
    ]);
    expect(await findByTestId("tick-sent")).toBeTruthy();
  });

  it("shows 'delivered' when every recipient is in deliveredTo", async () => {
    const { findByTestId } = renderWith([
      { id: "x1", senderId: "host1", type: "text", text: "hi", deliveredTo: ["m2", "m3"] },
    ]);
    expect(await findByTestId("tick-delivered")).toBeTruthy();
  });

  it("shows 'read' (blue) when every recipient is in readBy", async () => {
    const { findByTestId } = renderWith([
      { id: "x1", senderId: "host1", type: "text", text: "hi", deliveredTo: ["m2", "m3"], readBy: ["m2", "m3"] },
    ]);
    expect(await findByTestId("tick-read")).toBeTruthy();
  });

  it("marks incoming messages read + clears the badge on open", async () => {
    renderWith([{ id: "x1", senderId: "m2", type: "text", text: "yo" }]);
    await waitFor(() => {
      expect(markGroupMessagesRead).toHaveBeenCalledWith("g1", expect.any(Array));
      expect(markGroupNotificationsRead).toHaveBeenCalledWith("g1");
    });
  });

  it("sends a typed message via the Send button", async () => {
    const { getByPlaceholderText, getByTestId } = renderWith([]);
    fireEvent.changeText(getByPlaceholderText("Message…"), "good morning");
    fireEvent.press(getByTestId("send-button"));
    await waitFor(() =>
      expect(sendGroupMessage).toHaveBeenCalledWith("g1", "good morning")
    );
  });
});
