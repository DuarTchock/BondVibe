# Home Monetization — Featured Events (Phase 1)

> Status: IN PROGRESS (Phase 1 implemented). Phases 2–3 are future work.

## Goal
Monetize prime Home real estate and create platform revenue without degrading
the community feel. Phase 1 = **Featured (promoted) events**: hosts pay to
boost their event into a "Featured" carousel on Home (and a badge in Search).
The platform keeps **100%** of the promotion fee (separate from ticket sales).

## Why featured events (vs third-party ads)
- On-brand: the Home shows relevant events, not random banners.
- Reuses existing rails (Stripe, payment webhook, pricing).
- Aligned incentives: monetizes existing host supply.
- Third-party ad networks (AdMob) are deferred — low relevance, UX cost.

## Data model
### `events` (added fields)
- `featured: boolean`
- `featuredUntil: timestamp` — promotion expiry
- `featuredTier: string` — e.g. "standard" (room for "premium" later)

These are **set only by the server** (payment webhook via Admin SDK). The
Firestore rules forbid hosts from writing them directly (no free featuring).

### `promotions/{promotionId}`
- hostId, eventId, eventTitle, planId, tier
- amountCentavos, startsAt, expiresAt, paymentId, status

## Promotion plans (server is the source of truth)
Defined in `functions/stripe/promotions.js` (platform-owned catalog, not host
created):
- `feat_7`  — 7 days featured  — $99 MXN
- `feat_14` — 14 days featured — $179 MXN
- `feat_30` — 30 days featured — $299 MXN

The client shows a mirrored catalog for display; the server validates `planId`
and charges its own price (client can't tamper with the amount).

## Payment flow (platform keeps 100%)
1. Host opens their own event → "Promote this event" → PromoteEventScreen.
2. Picks a plan → pays with card.
3. `createPromotionPaymentIntent` creates a PaymentIntent **on the platform
   account** — no `transfer_data`, no `application_fee` — so 100% goes to the
   platform (this is platform income, not a host payout).
4. The payment webhook (`type: "promotion"`) sets `featured=true`,
   `featuredUntil = now + planDays`, `featuredTier`, and writes a `promotions`
   record. Receipt emailed via `receipt_email`.

## Surfaces
- **Home**: a "✨ Featured" horizontal carousel near the top (only shows
  events with `featuredUntil > now`).
- **Search**: featured badge + top ranking (Phase 1.1, optional).

## Expiry
A query-time guard (`featuredUntil > now`) plus a daily scheduled function
that flips expired `featured` back to false (reuses the reminders pattern).

## Security
- `promotions`: server-only writes; read by owner/admin.
- `events` update rule: hosts may update their event but **not** the
  `featured`, `featuredUntil`, or `featuredTier` fields — those are server-only.

## Future phases
- Phase 2: curated sponsor/partner banner slot (admin-managed campaigns).
- Phase 3: self-serve advertiser portal or ad network, if desired.
