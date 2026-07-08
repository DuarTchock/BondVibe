# 05 · Two-tier pricing · membership credit at check-in · 24h Agenda

Mount inside the host **Manage / Business** area. `tier:'pro'`. Built on the host's **real** screen — reference mockup: `Kinlo Business Map & Agenda.dc.html` (phones 3–6).

## Base file (do not rewrite)
Build on the attached **`src/screens/CreateEventScreen.js`**. **Reuse this exact screen for events AND classes.** Only ADD the pieces below — keep the existing Stripe validation (`handlePriceChange`, `canCreatePaidNow`), recurrence, images, draft-with-AI, and `acceptsMembership` flow intact.

## A. Member pricing tier (CRM)
- Add `pricingTier: 'local' | 'general'` to the member record (`members/{bizId}/people/{memberId}`; mirror on the linked user). **Default `'general'`.**
- Member screen gets a segmented **Local / General** control that writes this field. Locals are auto-charged the host's local price.

## B. Two-tier pricing in CreateEventScreen (events + classes)
Extend the existing Free/Paid + price section; leave the rest.
- New state beside `price`:
  ```js
  const [twoTier, setTwoTier] = useState(false);
  const [priceLocal, setPriceLocal] = useState("");    // MXN integer
  const [priceGeneral, setPriceGeneral] = useState(""); // MXN integer
  ```
- Render **only when `!isFree`**. A "Two-tier pricing" switch (`twoTier`); ON → two inputs (Local, General) reusing the SAME `inputWrapper`/`input` styles and the SAME `handlePriceChange` Stripe guard on both. OFF → today's single `price` input, unchanged.
- Validation in `handleCreateEvent`: if `twoTier`, require `priceLocal>0 && priceGeneral>0`; else keep the current single-price check.
- In `baseEventData` — keep backwards-compat, add fields:
  ```js
  price: isFree ? 0 : parseInt(twoTier ? priceGeneral : price, 10), // general stays canonical
  priceLocal: (!isFree && twoTier) ? parseInt(priceLocal, 10) : null,
  twoTier: !isFree && twoTier,
  currency: "MXN",
  ```
  Everything that reads `price` today keeps working; `priceLocal` is additive.

## C. Checkout — resolve price by the member's tier
```js
const effectivePrice =
  event.twoTier && member.pricingTier === 'local' && event.priceLocal != null
    ? event.priceLocal
    : event.price;                       // general / default
```
Record on the ticket: `pricePaid`, `pricingTierApplied`, `paidWith:'cash'|'stripe'|'mercadopago'|'membership'`.

## D. Membership credit — deducted AT CHECK-IN  ★ (the key change)
The event already carries `acceptsMembership` + `creditCost: 1`. Change **when** the credit is consumed:
- **Reservation with a membership** records `paidWith:'membership'` + `creditHold:true` — it does **NOT** decrement the balance.
- **On successful check-in** (QR scan or manual "mark present"), if `ticket.paidWith==='membership'` and `ticket.creditConsumed !== true`:
  1. decrement the member's membership `creditsRemaining` by `event.creditCost` (default 1);
  2. set `ticket.creditConsumed = true`, `ticket.consumedAt = now`.
- **Idempotent:** a re-scan never double-deducts (guarded by `creditConsumed`). Run inside a Firestore transaction so concurrent scans can't race the balance.
- Balance 0 at check-in → block + prompt host (renew / charge / override); log any override.
- Cash / guest / non-membership check-ins skip all credit logic.

## E. Classes = the same screen
Create Class reuses CreateEventScreen with `kind:'class'`, default recurrence (weekly) + required `instructorUid`. Identical two-tier pricing + credit-at-check-in behavior; a class check-in consumes a credit exactly like an event.

## F. Agenda — 24-hour day view (per staff)
- A **day view per instructor/staff member**: pick a date + a staff tab → their day.
- Time axis is the **full 24 hours in `HH:mm`** (00:00–23:30), 30-min rows, scrollable.
- Cells show that member's **classes** + **private sessions**; tapping an empty slot creates one.
- Staff can **block off** any slot/range as **Unavailable** (optionally named — "Lunch", "Vacation"); blocked time can't be booked and renders distinct (striped).
- Data: `agendaBlocks/{bizId}/{blockId}: { staffUid, start, end, type:'blocked'|'busy', label? }`. Classes/sessions already carry `instructorUid` + time, so the day view is a merged read of classes + bookings + agendaBlocks filtered by `staffUid` + date.

## G. Memberships — tier scope + NO unlimited
**Remove “unlimited” memberships entirely** (UI, model, checkout, check-in, reminders). Every membership/package is **credit-based**:
- a fixed **number of events/classes** the member may attend (`credits`, integer > 0), **and**
- an **expiration date** the host sets (`expiresAt`, required).

On creation the host also picks an **audience tier** — **Local**, **General**, or **Both**:
- `local` → only members with `pricingTier:'local'` can buy/redeem it;
- `general` → only general members;
- `both` → everyone.

Enforce the scope at **purchase** (hide/deny non-matching plans) and at **redemption/check-in** (a local-only credit can't be used by a general member).
Model `packages/{bizId}/{planId}`: `{ name, credits(int,>0,required), expiresAt(required), audienceTier:'local'|'general'|'both', price, kind:'event'|'class'|'session' }` — **no `unlimited` field/kind anywhere.**
Migration: convert any existing unlimited plan to a finite credit plan (host sets credits + expiry on first edit); block creation of new unlimited plans.

## Acceptance
- A member marked **Local** is auto-charged the local price; General pays general.
- A membership attendee's credit is deducted **exactly once, at check-in** — never at reservation, never twice.
- Classes behave identically to events for pricing + credits.
- Memberships are always **credit-count + expiry** (no unlimited) and carry an **audience tier** (local/general/both) enforced at purchase and check-in.
- Agenda shows a **24h HH:mm** day per staff member with class/session blocks and host-defined **block-off** time.
