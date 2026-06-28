import { estimateCheckout, formatCentavos, PRICING } from "../pricing";

describe("estimateCheckout", () => {
  it("adds 5% platform fee + 2.9% processing + $3 fixed on top of the base", () => {
    // base = $1000.00 MXN = 100000 centavos
    const r = estimateCheckout(100000);
    // platform: ceil(100000 * 0.05) = 5000
    expect(r.platformFeeCentavos).toBe(5000);
    // stripe: ceil((100000 + 5000) * 0.029) + 300 = ceil(3045) + 300 = 3345
    expect(r.stripeFeeCentavos).toBe(3345);
    expect(r.totalCentavos).toBe(100000 + 5000 + 3345);
    expect(r.baseCentavos).toBe(100000);
  });

  it("uses the documented pricing constants", () => {
    expect(PRICING.platformFeePercent).toBe(0.05);
    expect(PRICING.stripeFeePercent).toBe(0.029);
    expect(PRICING.stripeFeeFixedCentavos).toBe(300);
  });

  it("defaults to the Stripe processor", () => {
    expect(estimateCheckout(100000).stripeFeeCentavos).toBe(3345);
    expect(estimateCheckout(100000).processor).toBe("stripe");
  });

  it("uses Mercado Pago's fee when that processor is chosen", () => {
    // base = 100000, platform = 5000, subtotal = 105000
    // mercadopago: ceil(105000 * 0.0349) + 0 = ceil(3664.5) = 3665
    const r = estimateCheckout(100000, "mercadopago");
    expect(r.processor).toBe("mercadopago");
    expect(r.processorFeeCentavos).toBe(3665);
    expect(r.totalCentavos).toBe(100000 + 5000 + 3665);
  });

  it("falls back to Stripe for an unknown processor", () => {
    expect(estimateCheckout(100000, "bogus").processorFeeCentavos).toBe(3345);
  });

  it("handles zero and invalid input safely", () => {
    expect(estimateCheckout(0).totalCentavos).toBe(300); // only fixed fee
    expect(estimateCheckout(undefined).baseCentavos).toBe(0);
    expect(estimateCheckout("not a number").baseCentavos).toBe(0);
    expect(estimateCheckout(-500).baseCentavos).toBe(0);
  });

  it("never produces fractional centavos", () => {
    const r = estimateCheckout(12345);
    expect(Number.isInteger(r.platformFeeCentavos)).toBe(true);
    expect(Number.isInteger(r.stripeFeeCentavos)).toBe(true);
    expect(Number.isInteger(r.totalCentavos)).toBe(true);
  });
});

describe("formatCentavos", () => {
  it("formats centavos as MXN with two decimals", () => {
    expect(formatCentavos(100000)).toContain("1,000.00");
    expect(formatCentavos(100000)).toContain("MXN");
    expect(formatCentavos(0)).toContain("0.00");
  });
});
