# 01 · ERP Core — CRM, guest-code→QR, packages, attendance, scheduling, finance, staff

Mount inside the **Events tab (host toggle ON) → “Manage / Business”**. All `tier:'pro'`. Manual-first, all-vertical. Reference: `Kinlo Host Business.dc.html`.

## Design principle: manual-first
Every record is creatable & editable by hand. App signups + QR check-ins auto-populate the **same** records. A cash/walk-in client with no app account is a first-class member. The host never depends on clients using the app.

## 1. Member CRM  ★ core — build first
- **Add member manually:** name, phone, email (optional), join date, tags, plan/package, notes. No app account required.
- **CSV import:** map columns → bulk create members (migrate an existing client list).
- **Auto-link:** when a manual member later signs up in the app (or redeems a guest code), link to the existing record — never duplicate.
- **Member record:** photo/initials, status (active / at-risk / inactive), attendance history, payment history, credit balance, tags, notes timeline, groups/classes. All editable by hand.
- **List:** search, filter by status/tag/plan, bulk actions.

## 2. Guest-code → QR onboarding  ★
When a Pro host enrolls someone manually:
1. Host adds the member → Kinlo generates a short **guest code** (e.g. `RITMO-7F3K`) tied to that member + business.
2. Host shares it (SMS/print/QR at the desk). Member enters/scans it in Kinlo → account **links to the existing record** and their personal **QR check-in pass unlocks**.
3. Until redeemed, the host runs everything manually (mark-present, credits).
- **Gate:** issuing codes + unlocking QR = Pro. Joining via code = free for the member.
- Data: `members/{bizId}/people/{memberId}.inviteCode`, `redeemedAt`, `linkedUid`, `qrPassId`.

## 3. Packages & memberships (credits)
- Products: class/session packs (e.g. 10), monthly unlimited, drop-in; price, validity/expiration.
- **Auto-deduct** a credit on QR check-in (or session booking); **manual adjust** (+/–) with reason.
- Expiring-credit + renewal reminders (feeds `04` automations).

## 4. Attendance ledger
- Per-class **roster**; check-in via **QR or manual** “mark present” (for non-app clients).
- Per-member attendance history; no-show tracking. Source flag: `qr` | `manual`.

## 5. Scheduling — classes, instructors, capacity
- Recurring schedule + calendar view; assign **instructors**; capacity + **waitlist** (auto-promote on cancellation).
- A class can optionally be listed publicly (discovery bridge → new customers into the same CRM).

## 6. Finance
- Record **manual payments** (cash/transfer) + **online** (Stripe / Mercado Pago).
- Receipts/invoices; outstanding balances; revenue by method; payout view.

## 7. Multi-branch + staff roles
- One business, multiple **branches** (per-branch dashboard + roll-up).
- Invite **staff** with scoped permissions: `owner` (all), `instructor`, `reception` (check-in only, no finance).

## 8. Vertical presets (all-vertical)
- On first setup the host picks a preset: Dance · Gym/Studio · Yoga/Pilates · Retreat · School · Coaching · Tours · Nightlife · Community · Events · Other.
- Preset changes **labels + defaults only** (e.g. “sessions” vs “classes” vs “tours”, default packages/tags) — never the data model. Copy stays generic.

## Data model (Firestore, additive)
```
businesses/{bizId}                 ownerUid, name, vertical, branches:[{id,name,address}], settings
members/{bizId}/people/{memberId}  name, phone, email?, linkedUid?, inviteCode?, qrPassId?, joinDate,
                                   tags[], status, notes[], planId?, creditBalance, branchId
packages/{bizId}/{packageId}       name, credits|unlimited, price, validityDays, kind:'class'|'session'
payments/{bizId}/{paymentId}       memberId, amount, method:'cash'|'transfer'|'stripe'|'mercadopago', date, note, invoiceId?
attendance/{bizId}/{recordId}      memberId, classId, date, source:'qr'|'manual'
classes/{bizId}/{classId}          title, instructorUid, schedule(rrule), capacity, branchId, waitlist[]
staff/{bizId}/{uid}                role:'owner'|'instructor'|'reception', branchIds[], permissions
```
Rules: readable/writable only by `staff` of that `bizId` per `permissions` (reception can’t read `payments`). Reuse existing Stripe/Mercado Pago + QR check-in.

## Acceptance
- A Pro host runs the business with **zero dependency** on clients using the app (all manual), while app users + QR auto-populate the same records.
- Guest code converts a cash client into an app member without duplicating the record.
- Everything gated Pro via one config; labels adapt to the chosen vertical.
