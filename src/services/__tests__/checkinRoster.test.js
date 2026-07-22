/**
 * fix/roster-migration-client — QR check-in gates on the ROSTER subcollection,
 * not the removed events/{id}.attendees array (#55). A scan for someone whose
 * roster doc exists succeeds; a scan for a non-roster user is rejected.
 */
import { checkInFromScan, buildCheckinPayload } from "../checkinService";

jest.mock("../firebase", () => ({ db: {}, auth: { currentUser: { uid: "host" } } }));
jest.mock("../membershipService", () => ({
  getEventReservations: () => Promise.resolve([]),
  redeemMembershipCredit: jest.fn(),
}));

let mockRosterExists = true;
jest.mock("firebase/firestore", () => ({
  doc: (_db, ...segs) => ({ segs }),
  getDoc: async (ref) => {
    const p = ref.segs;
    if (p.includes("roster")) return { exists: () => mockRosterExists };
    if (p[0] === "events" && p.length === 2) return { exists: () => true, data: () => ({}) };
    if (p[0] === "users") return { exists: () => true, data: () => ({ fullName: "Ana" }) };
    if (p.includes("checkins")) return { exists: () => false }; // not yet checked in
    return { exists: () => false };
  },
  setDoc: jest.fn(() => Promise.resolve()),
  collection: jest.fn(),
  onSnapshot: jest.fn(),
}));

const raw = buildCheckinPayload("evt1", "user1");

describe("checkInFromScan — roster gate", () => {
  it("succeeds when the scanned user has a roster doc", async () => {
    mockRosterExists = true;
    const r = await checkInFromScan("evt1", raw);
    expect(r.success).toBe(true);
    expect(r.name).toBe("Ana");
  });

  it("rejects a user who is NOT on the roster", async () => {
    mockRosterExists = false;
    const r = await checkInFromScan("evt1", raw);
    expect(r.success).toBe(false);
    expect(r.error).toMatch(/guest list/i);
  });
});
