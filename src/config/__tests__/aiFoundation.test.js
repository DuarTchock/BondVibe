/**
 * AI Foundation server logic — unit tests for the pure/mockable pieces:
 * output validators (grounding enforcement) and the usage budget
 * (daily rate limit + weekly freemium taste). The full callable path is
 * exercised against the real deployed function during phase verification.
 */
jest.mock(
  "firebase-functions/v2/https",
  () => ({ onCall: jest.fn(() => jest.fn()) }),
  { virtual: true }
);

const {
  VALIDATORS,
  consumeBudget,
  getAiConfig,
  AI_DEFAULTS,
} = require("../../../functions/ai/foundation");

// ─── Validators: every eventId must be grounded in the context ──────────────

describe("VALIDATORS.smart_wall", () => {
  const ctx = { candidates: [{ eventId: "e1" }, { eventId: "e2" }] };

  test("accepts well-formed grounded output", () => {
    const out = {
      digest: { text: "Your week" },
      feed: [{ eventId: "e1", reason: "friends going", score: 0.9 }],
    };
    expect(VALIDATORS.smart_wall(out, ctx)).toBeNull();
  });

  test("rejects hallucinated eventIds", () => {
    const out = {
      digest: { text: "x" },
      feed: [{ eventId: "made-up", reason: "r", score: 0.5 }],
    };
    expect(VALIDATORS.smart_wall(out, ctx)).toMatch(/ungrounded/);
  });

  test("rejects missing digest and malformed items", () => {
    expect(VALIDATORS.smart_wall({ feed: [] }, ctx)).toMatch(/digest/);
    expect(
      VALIDATORS.smart_wall(
        { digest: { text: "x" }, feed: [{ eventId: "e1" }] },
        ctx
      )
    ).toMatch(/malformed/);
  });
});

describe("VALIDATORS.ask_kinlo", () => {
  const ctx = { events: [{ eventId: "e1" }] };

  test("accepts grounded reply with attachments", () => {
    const out = {
      reply: "Try this",
      attachments: [{ type: "event", eventId: "e1" }],
      suggestions: ["More"],
    };
    expect(VALIDATORS.ask_kinlo(out, ctx)).toBeNull();
  });

  test("rejects ungrounded attachments", () => {
    const out = {
      reply: "x",
      attachments: [{ type: "event", eventId: "ghost" }],
      suggestions: [],
    };
    expect(VALIDATORS.ask_kinlo(out, ctx)).toMatch(/ungrounded/);
  });

  test("rejects empty reply", () => {
    expect(
      VALIDATORS.ask_kinlo({ reply: "", attachments: [], suggestions: [] }, ctx)
    ).toMatch(/reply/);
  });
});

// ─── Budget: daily limit + weekly taste, via a fake transactional store ─────

function fakeDb(initial = null) {
  let stored = initial;
  return {
    data: () => stored,
    collection: () => ({ doc: () => ({}) }),
    runTransaction: async (fn) =>
      fn({
        get: async () => ({ exists: stored !== null, data: () => stored }),
        set: (ref, value) => {
          stored = value;
        },
      }),
  };
}

describe("consumeBudget", () => {
  const cfg = AI_DEFAULTS;

  test("first call of the day is allowed and counted", async () => {
    const db = fakeDb(null);
    const res = await consumeBudget(db, "u1", "smart_wall", cfg, false);
    expect(res.allowed).toBe(true);
    expect(db.data().calls).toBe(1);
  });

  test("daily limit blocks with rate_limited", async () => {
    const today = new Date().toISOString().slice(0, 10);
    const db = fakeDb({ day: today, calls: cfg.dailyCallLimit, weekly: {} });
    const res = await consumeBudget(db, "u1", "smart_wall", cfg, false);
    expect(res).toMatchObject({ allowed: false, reason: "rate_limited" });
  });

  test("ask_kinlo taste blocks non-Plus after N weekly uses, not Plus", async () => {
    const today = new Date().toISOString().slice(0, 10);
    // Build a doc that consumeBudget sees as "this week" by running one call
    // first (it stamps the current week key), then exhausting the taste.
    const db = fakeDb(null);
    for (let i = 0; i < cfg.features.ask_kinlo.freeTastePerWeek; i++) {
      const r = await consumeBudget(db, "u1", "ask_kinlo", cfg, false);
      expect(r.allowed).toBe(true);
    }
    const blocked = await consumeBudget(db, "u1", "ask_kinlo", cfg, false);
    expect(blocked).toMatchObject({ allowed: false, reason: "taste_limit" });

    // Same exhausted state, but the user has Plus → allowed.
    const plus = await consumeBudget(db, "u1", "ask_kinlo", cfg, true);
    expect(plus.allowed).toBe(true);
    expect(db.data().day).toBe(today);
  });
});

// ─── Config merge: remote overrides defaults, never hardcoded in screens ────

describe("getAiConfig", () => {
  test("merges Firestore config/ai over defaults", async () => {
    const db = {
      collection: () => ({
        doc: () => ({
          get: async () => ({
            exists: true,
            data: () => ({
              model: "claude-x-override",
              features: { ask_kinlo: { freeTastePerWeek: 5 } },
            }),
          }),
        }),
      }),
    };
    const cfg = await getAiConfig(db);
    expect(cfg.model).toBe("claude-x-override");
    expect(cfg.features.ask_kinlo.freeTastePerWeek).toBe(5);
    // untouched defaults survive
    expect(cfg.features.smart_wall.candidateLimit).toBe(
      AI_DEFAULTS.features.smart_wall.candidateLimit
    );
  });

  test("falls back to defaults when doc missing or read fails", async () => {
    const missing = {
      collection: () => ({ doc: () => ({ get: async () => ({ exists: false }) }) }),
    };
    expect((await getAiConfig(missing)).model).toBe(AI_DEFAULTS.model);
    const broken = {
      collection: () => ({ doc: () => ({ get: async () => { throw new Error("x"); } }) }),
    };
    expect((await getAiConfig(broken)).model).toBe(AI_DEFAULTS.model);
  });
});
