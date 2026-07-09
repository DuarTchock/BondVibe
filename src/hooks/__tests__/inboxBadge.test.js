import { isThreadUnread } from "../../utils/dmUnread";

// toMillis accepts a {seconds} shape.
const ts = (s) => ({ seconds: s });
const me = "me";

describe("isThreadUnread", () => {
  it("is unread when the other person sent last after my last read", () => {
    expect(isThreadUnread({ lastSenderId: "other", updatedAt: ts(100), lastReadAt: { me: ts(50) } }, me)).toBe(true);
  });
  it("is unread when the other sent and I never read", () => {
    expect(isThreadUnread({ lastSenderId: "other", updatedAt: ts(100) }, me)).toBe(true);
  });
  it("is read once I've read since the last message", () => {
    expect(isThreadUnread({ lastSenderId: "other", updatedAt: ts(100), lastReadAt: { me: ts(150) } }, me)).toBe(false);
  });
  it("is never unread from my own message", () => {
    expect(isThreadUnread({ lastSenderId: "me", updatedAt: ts(100) }, me)).toBe(false);
  });
  it("handles missing/empty data", () => {
    expect(isThreadUnread(null, me)).toBe(false);
    expect(isThreadUnread({}, me)).toBe(false);
  });
});
