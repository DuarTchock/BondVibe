# 03 · Agenda & Private Sessions (1:1 · couples · exclusive group)

Mount in the host **Manage / Business** area → **Agenda**. `tier:'pro'`. All-vertical (private class, coaching, couples, exclusive group). Reference: `Kinlo Private Sessions.dc.html`.

## Why
Private sessions = premium revenue + high churn risk (if requests dry up, the client silently leaves). This makes booking easy, protects both sides with reminders, and feeds the Momentum board when a private client goes quiet.

## Objects
```
sessionTypes/{bizId}/{id}         name, durationOptions[], capacityMax(1=1:1,2=couple,n=group), priceOrCredits, description
availability/{bizId}/{ruleId}     weekday|date, startTime, duration, sessionTypeId, location, capacity, price|credits, buffer
bookings/{bizId}/{bookingId}      memberId(s)[], sessionTypeId, start, end, location,
                                  status:'requested'|'confirmed'|'declined'|'done'|'no_show'|'cancelled',
                                  paidWith:'credit'|'cash'|'stripe'|'mercadopago', reminderHostAt, reminderAttendeeAt, notes
```
**Private-session credits reuse the Packages feature (`01`)** — add a `session` package kind granting N session credits with expiry; booking auto-deducts one.

## Flows
1. **Agenda (host):** day/week calendar of confirmed sessions + open availability; color by type; Today + upcoming.
2. **Set availability:** recurring or one-off slots — type, duration, location, capacity, price/credits, buffer, block-off vacations.
3. **Requests inbox:** incoming → **Confirm / Propose new time / Decline**. Confirm books the slot, deducts a credit (or takes payment), schedules both reminders.
4. **Session detail:** member(s), type, time, location, credit/payment status, notes; reschedule/cancel; mark **done / no-show**; message the attendee.
5. **Attendee side:** request from the host’s profile — pick type + time from availability, pay/redeem credit, get confirmation + reminders; reschedule/cancel within policy.

## Reminders (both sides)
- Auto reminders to **attendee** and **host** at configurable lead times (e.g. 24h + 1h). Channels: push + in-app + email + **SMS (model 1 — see `04`)**; WhatsApp phase 2.
- Cancellation/reschedule/no-show notices auto-sent per the host’s policy (e.g. free cancel ≥12h).

## Automations & AI (via `callClaude`)
- **No-request detector:** a private client with no upcoming booking + none in N days → auto-creates a **Momentum** card (“re-book {name}”) with an AI-drafted nudge.
- AI suggests optimal slots and drafts reminder/nudge copy. Expiring session-credits → reminder + Momentum card.

## Post-session hooks (wire to existing features — not new modules)
- **Rating trigger:** marking a session **done** fires the existing event-rating flow (attendee rates session/host → reputation + coaching). No-show does not trigger a rating.
- **Host↔attendee chat:** every confirmed booking opens a **1:1 thread** in the existing DM/Inbox system.
- **Join the community:** on confirmation + post-session, the attendee gets **“Join {host}’s community”** → follows/joins the host’s Vibe, entering the CRM + discovery loop. A private client becomes a full member (acquisition).

## Acceptance
- Publish availability, receive/confirm/decline requests, run 1:1/couple/group, deduct credits, both parties get reminders — no external calendar needed.
- Session credits live in Packages. Lapsed private clients auto-surface on Momentum. Done → rating + chat + join-community.
