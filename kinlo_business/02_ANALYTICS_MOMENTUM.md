# 02 · Analytics (ranged) + Momentum board (Kanban)

Mount in the host **Manage / Business** area. `tier:'pro'`. AI via existing `callClaude`. Reference: `Kinlo Host Analytics & Kanban.dc.html`, `Kinlo Retention Kanban Pro.dc.html`.

## A. Business Dashboard + ranged analytics
Bring Entri’s web dashboards to **native mobile**, and go beyond them.

**Date-range control on every chart:** Day · Week · Month · **Quarter · Semester · Year · Total · Custom (from/to)**. Period-over-period comparison.

**Metrics to plot (per range):**
- **Churn (abandono)** — members lost.
- **Active (activos)**.
- **Recovered (recuperados)** — reactivated after at-risk/inactive.
- **New prospects (nuevos prospectos)** — leads/first-timers not yet converted.
- **Projection (proyección)** — AI forecast (revenue/active/churn) next period via `callClaude`, grounded in history. Label as an estimate.
Plus staples: revenue by method, avg ticket, attendance, active tenure, trend %.

**AI period findings:** a grounded narrative (“revenue +18%, driven by the sunrise slot; 6 at-risk — send win-back”) via `callClaude`. Export **CSV / PDF**.

Data: aggregate from `payments`, `attendance`, `members`. One cached AI call per range; recompute on data change or weekly.

## B. Momentum board (Jira-style Kanban)
User-facing name **“Momentum”** (not “Retention”). A proactive work board for members needing attention. (Owner may rename → *Member Care · Follow-ups · Pulse · Comeback*, one-line label.)

**Columns (lifecycle) — editable**
- Defaults: **At-risk · Inactive · Contacted · Recovered** (+ optional Prospect, Lost).
- Host can **rename · reorder · recolor · add · archive/delete** (min 1). Stored: `momentumColumns/{bizId}: [{id,name,color,order,wipLimit?}]`.
- Moving a card changes its `stage`; entering a column may fire automation (→ Contacted sends the templated message; → Recovered logs the save).

**Move a card two ways:** (1) **drag & drop**, (2) **column dropdown on the card**. Both write the same `stage`.

**Card fields (Jira-like)**
| Field | Notes |
|---|---|
| Member | linked CRM record |
| Priority | Low / Medium / High / Urgent |
| Labels/Tags | e.g. expiring-credit, no-show, VIP |
| Assignee | a staff member |
| Action (title) | e.g. “Send 2-for-1 offer” |
| Description / content | rich notes / message body |
| Action status | To-do / In-progress / Done (separate from column stage) |
| Due date | deadline |
| Reminder | on/off + when → auto push to assignee |
| Checklist / subtasks | ☐ call ☐ send offer ☐ confirm |
| Channel | push / SMS / email (WhatsApp phase 2) |
| Activity / comments | timeline of changes + sent messages |
| Attachments | optional |

**AI (via `callClaude`):** suggests next action + priority and **drafts the message**; host approves. Auto-creates cards for newly at-risk members; auto-reminders at due date; auto-move to Recovered when a payment/attendance resumes.

**Views:** board (default), list, filter by assignee/priority/label/due.
Data: `momentumCards/{bizId}/{cardId}: {memberId, stage, priority, labels[], assigneeUid, actionTitle, description, actionStatus, dueDate, reminder, checklist[], channel, activity[]}`.

## Acceptance
- Every chart supports Day→Total + custom range and plots churn/active/recovered/prospects/projection with comparison.
- Momentum columns are fully editable; cards move by drag OR dropdown; cards carry the full Jira-style field set; AI fills + drafts.
