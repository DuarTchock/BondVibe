# 04 · Lifecycle Automations (channel routing)

Mount in the host **Manage / Business** area → **Automations**. `tier:'pro'`. AI copy via existing `callClaude`.

## The engine (one rule model for all channels)
A rule = **trigger → audience → message → channel(auto)**. The host writes the message (or uses/accepts an AI draft); Kinlo picks the channel automatically. The host never manages phone numbers or picks channels manually.

**Triggers (starter set):**
- Class/session **reminder** (24h + 1h before).
- **Expiring credit** (e.g. 3 days out).
- **Renewal / plan expiring**.
- **No-show** follow-up.
- **Birthday**.
- **Re-engagement / win-back** (at-risk / inactive N days) — ties to the Momentum board.
- **Welcome** on enrollment (+ guest-code delivery).

**Audience:** a member, a segment (regulars / at-risk / lapsed / by tag / by class), or a Momentum column.

## Channel routing (automatic) — phase 1
Kinlo routes to the best available channel per member; the host doesn’t choose:
- **Push** (app installed) — free, primary.
- **In-app** (notification center / banner) — free.
- **Email** — via provider (Resend/SendGrid/Postmark), cheap. Receipts, summaries, non-urgent.
- **SMS** — via **Twilio**, for members **without the app** or urgent moments (guest code, class reminder). Cost per message.
- **WhatsApp — PHASE 2** (not now). Requires WhatsApp Business API via a BSP (Twilio/360dialog/Meta Cloud), pre-approved templates, 24h window, per-conversation cost, business verification. Build the engine channel-agnostic so WhatsApp slots in later as one more channel with templates.

### SMS = model 1 (confirmed)
- All SMS send from a **single central Kinlo number (or small pool) on Twilio** — NOT a number per host.
- The **host’s name is in the message text** (e.g. “Ritmo Studio: your class is tomorrow 7pm…”).
- The host never provisions or manages numbers. Handle inbound keywords (STOP / CONFIRM / CANCEL) via Twilio webhook.
- **Consent:** capture SMS opt-in at enrollment; respect STOP/unsubscribe. Include a per-Pro monthly SMS quota (e.g. 200) to keep cost predictable; overage is a paid add-on.

## AI
- `callClaude` drafts message copy per trigger/audience, grounded in the member’s data; host approves/edits.
- AI can propose which triggers to enable based on the business’s patterns.

## Data
```
automations/{bizId}/{ruleId}   trigger, params, audience, messageTemplate, channelsAllowed[], active
messages/{bizId}/{msgId}       memberId, ruleId?, channel, body, status:'queued'|'sent'|'delivered'|'failed', ts
```
Cloud Functions: schedule triggers, resolve channel per member, send via provider, log delivery. Never send from the client.

## Acceptance
- Host defines a trigger + message once; Kinlo auto-routes per member across push/in-app/email/SMS.
- SMS all from a central Kinlo number with the host name in text; opt-out respected; quota enforced.
- Engine is channel-agnostic so WhatsApp (phase 2) drops in without redesign.
