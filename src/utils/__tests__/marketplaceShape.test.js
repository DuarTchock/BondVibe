import { shapeListing, SERVICE_VERTICALS, MARKETPLACE_VERTICALS } from "../marketplaceShape";

describe("marketplaceShape.shapeListing", () => {
  it("derives bizId from the collectionGroup parent path", () => {
    const fake = {
      id: "svc1",
      ref: { parent: { parent: { id: "biz-abc" } } },
      data: () => ({ name: "Manicure", vertical: "beauty", priceCents: 45000, durationMin: 60 }),
    };
    const l = shapeListing(fake);
    expect(l.bizId).toBe("biz-abc");
    expect(l.name).toBe("Manicure");
    expect(l.vertical).toBe("beauty");
    expect(l.priceCents).toBe(45000);
  });

  it("accepts a plain {id,bizId,...} shape too", () => {
    const l = shapeListing({ id: "s", bizId: "b", name: "Coaching", vertical: "wellness" });
    expect(l.bizId).toBe("b");
    expect(l.vertical).toBe("wellness");
  });

  it("applies safe defaults (never undefined) for missing fields", () => {
    const l = shapeListing({ id: "s", bizId: "b" });
    expect(l.priceCents).toBe(0);
    expect(l.durationMin).toBe(60);
    expect(l.capacityMax).toBe(1);
    expect(l.bookingMode).toBe("slot");
    expect(l.locationMode).toBe("at_business");
    expect(l.photos).toEqual([]);
    expect(l.city).toBeNull();
  });

  it("normalizes bookingMode to slot unless explicitly quote", () => {
    expect(shapeListing({ id: "s", bizId: "b", bookingMode: "quote" }).bookingMode).toBe("quote");
    expect(shapeListing({ id: "s", bizId: "b", bookingMode: "weird" }).bookingMode).toBe("slot");
  });

  it("exposes the vertical taxonomy (rentals surfaced but not a service vertical)", () => {
    expect(SERVICE_VERTICALS).not.toContain("rentals");
    expect(MARKETPLACE_VERTICALS).toContain("rentals");
    expect(MARKETPLACE_VERTICALS).toEqual(expect.arrayContaining(SERVICE_VERTICALS));
  });
});
