/**
 * Kinlo for Business — Lifecycle Automations engine (kinlo_business/04).
 * One rule model for all channels: trigger → audience → message → channel(auto).
 * The engine resolves the best available channel per member and logs delivery.
 *
 * Channels: Push + In-app are live (existing infra). SMS (Twilio, model 1) and
 * Email are wired but INERT until credentials are configured — see sendSms /
 * sendEmail. Never sent from the client; all sends go through here (server).
 *
 * Consent (LFPDPPP): SMS only to members with smsConsent.granted === true;
 * inbound STOP flips it off (twilioWebhook). A per-business monthly SMS quota
 * keeps cost predictable.
 */
/* eslint-disable require-jsdoc, valid-jsdoc */
const admin = require("firebase-admin");
const {HttpsError} = require("firebase-functions/v2/https");
const {sendPushNotification} = require("../notifications/pushService");

const db = () => admin.firestore();
const SMS_MONTHLY_QUOTA = 200;

// ── Channel senders ──────────────────────────────────────────────────────────

/** Send an SMS via Twilio (model 1). Inert until TWILIO_* env is bound. */
async function sendSms(to, body) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const mg = process.env.TWILIO_MESSAGING_SERVICE_SID;
  if (!sid || !token || !mg || !to) {
    return {status: "skipped", reason: "sms_not_configured"};
  }
  try {
    const auth = Buffer.from(`${sid}:${token}`).toString("base64");
    const params = new URLSearchParams({
      MessagingServiceSid: mg, To: to, Body: body,
    });
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {method: "POST",
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString()});
    if (res.ok) return {status: "sent"};
    return {status: "failed", reason: `twilio_${res.status}`};
  } catch (e) {
    return {status: "failed", reason: String(e.message || e).slice(0, 60)};
  }
}

/** Send an email. Inert until an email provider key is configured. */
async function sendEmail() {
  return {status: "skipped", reason: "email_not_configured"};
}

async function sendPush(linkedUid, title, body) {
  if (!linkedUid) return {status: "skipped", reason: "no_account"};
  const u = await db().collection("users").doc(linkedUid).get();
  const token = u.exists ? u.data().pushToken : null;
  if (!token) return {status: "skipped", reason: "no_push_token"};
  try {
    await sendPushNotification(token, {title, body, data: {type: "business"}});
    return {status: "sent"};
  } catch (e) {
    return {status: "failed", reason: "push_error"};
  }
}

async function sendInApp(linkedUid, hostName, body) {
  if (!linkedUid) return {status: "skipped", reason: "no_account"};
  await db().collection("notifications").add({
    userId: linkedUid,
    type: "business_message",
    title: hostName || "Kinlo",
    message: body,
    icon: "bell",
    read: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return {status: "sent"};
}

// ── Core ─────────────────────────────────────────────────────────────────────

/** Members matching an audience descriptor. */
async function resolveAudience(bizId, audience = {}) {
  const snap = await db().collection("businesses").doc(bizId)
    .collection("members").limit(2000).get();
  let members = snap.docs.map((d) => ({id: d.id, ...d.data()}));
  const type = audience.type || "all";
  if (type === "member") {
    members = members.filter((m) => m.id === audience.value);
  } else if (type === "active") {
    members = members.filter((m) => (m.status || "active") === "active");
  } else if (type === "at_risk") {
    members = members.filter((m) => m.status === "at_risk");
  } else if (type === "inactive") {
    members = members.filter((m) => m.status === "inactive");
  } else if (type === "tag") {
    members = members.filter((m) =>
      Array.isArray(m.tags) && m.tags.includes(audience.value));
  }
  return members;
}

/**
 * Route a message to one member across allowed channels (first available wins:
 * push → in-app → SMS → email), honoring SMS consent + quota. Logs the result.
 */
async function sendToMember(bizId, member, body, channels, hostName, ruleId, quota) {
  const allowed = Array.isArray(channels) && channels.length ?
    channels : ["push", "inapp"];
  const smsBody = `${hostName ? hostName + ": " : ""}${body}`;
  let result = {status: "skipped", reason: "no_channel"};
  let channel = "none";

  for (const ch of allowed) {
    if (ch === "push" && member.linkedUid) {
      result = await sendPush(member.linkedUid, hostName || "Kinlo", body);
    } else if (ch === "inapp" && member.linkedUid) {
      result = await sendInApp(member.linkedUid, hostName, body);
    } else if (ch === "sms" && member.phone &&
               member.smsConsent && member.smsConsent.granted === true) {
      if (quota && quota.count >= SMS_MONTHLY_QUOTA) {
        result = {status: "skipped", reason: "sms_quota"};
      } else {
        result = await sendSms(member.phone, smsBody);
        if (result.status === "sent" && quota) quota.count += 1;
      }
    } else if (ch === "email" && member.email) {
      result = await sendEmail(member.email, hostName, body);
    } else {
      continue;
    }
    channel = ch;
    if (result.status === "sent") break; // delivered — stop trying channels
  }

  await db().collection("businesses").doc(bizId).collection("messages").add({
    memberId: member.id,
    memberName: member.name || "",
    ruleId: ruleId || null,
    channel,
    body,
    status: result.status,
    reason: result.reason || null,
    ts: admin.firestore.FieldValue.serverTimestamp(),
  });
  return {channel, ...result};
}

async function loadQuota(bizId) {
  const ref = db().collection("businesses").doc(bizId);
  const snap = await ref.get();
  const d = snap.exists ? snap.data() : {};
  const month = new Date().toISOString().slice(0, 7);
  return {ref, month, count: d.smsMonth === month ? (d.smsCount || 0) : 0};
}
async function saveQuota(quota) {
  await quota.ref.set(
    {smsMonth: quota.month, smsCount: quota.count}, {merge: true});
}

// ── Handlers ─────────────────────────────────────────────────────────────────

/** Callable: send a message now to an audience (host-triggered broadcast). */
async function sendBusinessMessage(request) {
  const uid = request.auth && request.auth.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Sign in required.");
  const {bizId, message, audience, channels, ruleId} = request.data || {};
  // v1: one business per owner → the caller must own this business.
  if (bizId !== uid) throw new HttpsError("permission-denied", "Not your business.");
  if (!message || !String(message).trim()) {
    throw new HttpsError("invalid-argument", "Message is empty.");
  }
  const bizSnap = await db().collection("businesses").doc(bizId).get();
  const hostName = bizSnap.exists ? (bizSnap.data().name || "") : "";
  const members = await resolveAudience(bizId, audience);
  const quota = await loadQuota(bizId);
  let sent = 0; let skipped = 0;
  for (const m of members) {
    const r = await sendToMember(
      bizId, m, String(message).trim(), channels, hostName, ruleId, quota);
    if (r.status === "sent") sent++; else skipped++;
  }
  await saveQuota(quota);
  return {sent, skipped, total: members.length};
}

/**
 * Scheduled: process active "expiring_credit" rules — message members whose
 * package expires exactly `params.days` out (fires once per member/package).
 * Other scheduled triggers are added incrementally.
 */
async function remindersCron() {
  const rules = await db().collectionGroup("automations")
    .where("active", "==", true).limit(500).get();
  for (const doc of rules.docs) {
    const rule = doc.data();
    if (rule.trigger !== "expiring_credit") continue;
    const bizId = doc.ref.parent.parent.id;
    const days = (rule.params && rule.params.days) || 3;
    const bizSnap = await db().collection("businesses").doc(bizId).get();
    const hostName = bizSnap.exists ? (bizSnap.data().name || "") : "";
    const members = await resolveAudience(bizId, rule.audience);
    const quota = await loadQuota(bizId);
    const targetDay = new Date(Date.now() + days * 86400000)
      .toISOString().slice(0, 10);
    for (const m of members) {
      const exp = m.activePackage && m.activePackage.expiresAt ?
        String(m.activePackage.expiresAt).slice(0, 10) : null;
      if (exp === targetDay) {
        await sendToMember(bizId, m, rule.message, rule.channels,
          hostName, doc.id, quota);
      }
    }
    await saveQuota(quota);
  }
}

/**
 * Twilio inbound webhook — handle STOP/START keywords (LFPDPPP opt-out).
 * Flips the member's smsConsent by matching the sender's phone.
 */
async function twilioWebhook(req, res) {
  try {
    const from = (req.body && (req.body.From || req.body.from)) || "";
    const text = String((req.body && (req.body.Body || req.body.body)) || "")
      .trim().toUpperCase();
    const stop = ["STOP", "CANCEL", "UNSUBSCRIBE", "BAJA"].includes(text);
    const start = ["START", "UNSTOP", "ALTA"].includes(text);
    if (from && (stop || start)) {
      const snap = await db().collectionGroup("members")
        .where("phone", "==", from).limit(20).get();
      const batch = db().batch();
      snap.docs.forEach((d) => batch.set(d.ref, {
        smsConsent: {
          granted: start,
          at: new Date().toISOString(),
          purpose: "sms_keyword",
          source: stop ? "stop" : "start",
        },
      }, {merge: true}));
      await batch.commit();
    }
  } catch (e) {
    console.error("twilioWebhook error:", e.message);
  }
  res.set("Content-Type", "text/xml");
  res.status(200).send("<Response></Response>");
}

module.exports = {sendBusinessMessage, remindersCron, twilioWebhook};
