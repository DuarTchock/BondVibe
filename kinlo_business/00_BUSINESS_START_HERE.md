# Kinlo for Business — BUSINESS START HERE (Claude Code entry point)

> **Scope:** ONLY the host **ERP/CRM (“Kinlo for Business”)** module. This package is self-contained — it does NOT depend on any other redesign/AI/i18n work. Build it into the **existing** Kinlo app.
> **App:** Kinlo (Expo/React Native + Firebase). Anthropic **`callClaude` Cloud Function is already connected** (API key server-side) — reuse it, don’t rebuild it.

## The one prompt to give Claude Code
```
Read kinlo_business/00_BUSINESS_START_HERE.md and follow it. Build the Kinlo for Business (host ERP/CRM)
module into the EXISTING app, mounted in the Events tab when the host toggle is ON, gated to Pro.
Build in the order below, pausing after each block for my review. Show the file plan before editing.
Reuse the existing callClaude Cloud Function for all AI. Reference mockups in the repo root.
```

## Where it mounts (confirmed)
Hosts already reach management via the **Events tab with the host toggle ON**. Mount everything here as a **“Manage / Business” area** inside that host view. Do **not** add new tabs or change attendee navigation. Everything is gated `tier:'pro'`.

## Files in this package
| File | Contents |
|---|---|
| `00_BUSINESS_START_HERE.md` | This index + rules + build order |
| `01_ERP_CORE.md` | Member CRM (manual add + CSV) · guest-code→QR · packages/credits · attendance · scheduling/instructors · finance · multi-branch · staff roles · vertical presets |
| `02_ANALYTICS_MOMENTUM.md` | Ranged analytics (churn/active/recovered/prospects/projection) + **Momentum board** (Jira-style Kanban) |
| `03_PRIVATE_SESSIONS.md` | Agenda & 1:1/couple/group sessions · availability · requests · credits · two-way reminders · rating/chat/join-community hooks |
| `04_AUTOMATIONS.md` | Lifecycle automation engine · channel routing (Push+in-app+email+SMS now, WhatsApp phase 2) · SMS model 1 |
| `05_PRICING_CREDITS_AND_AGENDA.md` | **Two-tier (Local/General) pricing** on events & classes · **membership credit deducted at check-in** · **24h Agenda** day view with block-off. Built on the host's real `CreateEventScreen.js`. |

Reference mockups (open in a browser to match the UI):
`Kinlo Host Business.dc.html` · `Kinlo Host Analytics & Kanban.dc.html` · `Kinlo Retention Kanban Pro.dc.html` · `Kinlo Private Sessions.dc.html`

## Build order (stop for review after each block)
1. **CRM core** (`01`): member model + **manual add** + **guest-code→QR** + CSV import + member record. *(the core requirement — do first)*
2. **Packages/credits + attendance** (`01`): products, auto-deduct on check-in, manual adjust, QR + manual attendance.
3. **Business Dashboard + ranged analytics** (`02`): KPIs + charts (churn/active/recovered/prospects/projection) + AI read (via `callClaude`).
4. **Momentum board** (`02`): editable-column Kanban with card workflow + AI-drafted actions.
5. **Finance** (`01`): manual + online payments, balances, receipts, payout.
6. **Scheduling/instructors + waitlist** (`01`).
7. **Private sessions & agenda** (`03`).
8. **Automations** (`04`): rules engine + channel routing (SMS model 1).
9. **Multi-branch + staff roles** (`01`) + **vertical presets**.
10. **Two-tier pricing + credit-at-check-in + 24h Agenda** (`05`): extend the real `CreateEventScreen.js` (events + classes); add `pricingTier` to members; move membership-credit consumption to check-in (idempotent); build the per-staff 24h Agenda with block-off. *(pricing/credits can run alongside step 2; Agenda alongside step 6.)*

## Hard rules
- **All-vertical:** not dance-only. Generic copy (“members / sessions / packages”); a **vertical preset** only swaps labels/defaults. Never hardcode “dance/alumno/clase”.
- **Manual-first:** every record (member, payment, attendance, class, session) is creatable & editable **by hand**. App users + QR check-ins auto-populate the same records. The host must be able to run 100% of the business even if clients never use the app.
- **English** UI copy + code comments. Match the app’s existing theme/tokens (Clean); no hardcoded colors; reuse the existing `<Icon>` set.
- **Pro-gated:** the whole module is `tier:'pro'`. Read gating from a single config (`entitlements.js` if it exists, else create one) so changing a tier is a one-line edit. Issuing guest codes / unlocking QR requires Pro.
- **AI via `callClaude` only** (already connected, key server-side). Ground every AI output in the host’s real data; graceful fallback if unavailable — never fake numbers.
- **Privacy:** host analytics are aggregate; never expose cross-member private data. Consent for SMS captured at enrollment.
- Small commits per block; show the file plan and wait for OK before editing.
