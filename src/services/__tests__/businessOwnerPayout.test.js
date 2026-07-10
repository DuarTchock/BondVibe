// resolveBusinessOwnerUid is pure; stub ./firebase so importing the service
// doesn't try to init the SDK (expo Constants aren't present under jest).
jest.mock("../firebase", () => ({ db: {}, auth: {} }));

import { resolveBusinessOwnerUid } from "../businessService";

// BUG 32.7 — businessOwnerUid is stamped ONLY when the create happens in the
// explicit business-hosting flow: hosting mode + a foreign (staff-of) business
// active. Everything else leaves it unset so payout falls back to the creator.
const foreign = { bizId: "bizOwner1", isOwner: false, ownerUid: "ownerUid1" };
const own = { bizId: "meUid", isOwner: true, ownerUid: "meUid" };

describe("resolveBusinessOwnerUid (BUG 32.7)", () => {
  it("stamps the owner when acting as staff of a foreign business in hosting mode", () => {
    expect(
      resolveBusinessOwnerUid({ isHosting: true, activeBizId: "bizOwner1", businesses: [foreign] })
    ).toBe("ownerUid1");
  });

  it("does NOT stamp in attending mode (staff of a foreign business)", () => {
    expect(
      resolveBusinessOwnerUid({ isHosting: false, activeBizId: "bizOwner1", businesses: [foreign] })
    ).toBeNull();
  });

  it("does NOT stamp when the active business is the user's own", () => {
    expect(
      resolveBusinessOwnerUid({ isHosting: true, activeBizId: "meUid", businesses: [own] })
    ).toBeNull();
  });

  it("does NOT stamp when there is no active business", () => {
    expect(
      resolveBusinessOwnerUid({ isHosting: true, activeBizId: null, businesses: [foreign] })
    ).toBeNull();
    expect(
      resolveBusinessOwnerUid({ isHosting: true, activeBizId: "bizOwner1", businesses: [] })
    ).toBeNull();
  });

  it("tolerates missing args", () => {
    expect(resolveBusinessOwnerUid()).toBeNull();
    expect(resolveBusinessOwnerUid({})).toBeNull();
  });
});
