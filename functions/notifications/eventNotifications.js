/**
 * EVENT PUSH NOTIFICATIONS
 * Sends push notifications for event-related actions
 * functions/notifications/eventNotifications.js
 */

const {onDocumentUpdated} = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const {sendBatchPushNotifications} = require("./pushService");
const {getAttendeeIds, getEventCreatorId} = require("../utils/eventHelpers");
const {tPush, baseLang} = require("../i18n");

const db = admin.firestore();

/**
 * TRIGGER: When event document is updated
 * Detects when attendees array changes and sends push notifications
 */
exports.onEventAttendeesChanged = onDocumentUpdated(
  "events/{eventId}",
  async (event) => {
    const beforeData = event.data.before.data();
    const afterData = event.data.after.data();
    const eventId = event.params.eventId;

    // Skip if event is cancelled
    if (afterData.status === "cancelled") {
      console.log("⏭️ Event is cancelled, skipping notifications");
      return null;
    }

    // Get attendees arrays (normalized to UID strings)
    const beforeAttendees = getAttendeeIds(beforeData.attendees);
    const afterAttendees = getAttendeeIds(afterData.attendees);

    // Detect new attendees (joined)
    const newAttendees = afterAttendees.filter(
      (id) => !beforeAttendees.includes(id),
    );

    // Detect removed attendees (cancelled)
    const removedAttendees = beforeAttendees.filter(
      (id) => !afterAttendees.includes(id),
    );

    console.log("👥 Attendee changes detected:", {
      eventId: eventId,
      eventTitle: afterData.title,
      newAttendees: newAttendees.length,
      removedAttendees: removedAttendees.length,
    });

    // Promote from the waitlist (FIFO) whenever a spot is open. The resulting
    // update re-triggers this function, which then notifies the host of the join.
    const max = afterData.maxAttendees || afterData.maxPeople || 0;
    const waitlist = Array.isArray(afterData.waitlist) ? afterData.waitlist : [];
    if (max && waitlist.length > 0 && afterAttendees.length < max) {
      const promoted = waitlist.slice(0, max - afterAttendees.length);
      if (promoted.length > 0) {
        await db.doc(`events/${eventId}`).update({
          attendees: admin.firestore.FieldValue.arrayUnion(...promoted),
          waitlist: admin.firestore.FieldValue.arrayRemove(...promoted),
        });
        for (const uid of promoted) {
          // BUG 34: store key+params (localized in-app + push per recipient);
          // the English title/message fallback is generated from the catalog, so
          // no English literal lives at the call site.
          const eventTitle = afterData.title || "an event";
          const params = {event: eventTitle};
          const tk = "notifications.event.waitlistPromoted.title";
          const bk = "notifications.event.waitlistPromoted.body";
          await db.collection("notifications").add({
            userId: uid,
            type: "waitlist_promoted",
            title: tPush(tk, "en", params),
            message: tPush(bk, "en", params),
            titleKey: tk,
            bodyKey: bk,
            params,
            icon: "🎉",
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            metadata: {eventId, eventTitle: afterData.title || ""},
          });
          const u = await db.collection("users").doc(uid).get();
          if (u.exists && u.data().pushToken) {
            await sendBatchPushNotifications([{
              pushToken: u.data().pushToken,
              uid,
              lang: baseLang(u.data().language), // recipient = promoted attendee
              titleKey: "notifications.event.waitlistPromoted.title",
              bodyKey: "notifications.event.waitlistPromoted.pushBody",
              params,
              data: {type: "waitlist_promoted", eventId},
            }]);
          }
        }
        console.log(`✅ Promoted ${promoted.length} from waitlist`);
      }
    }

    // Process new attendees (someone joined)
    if (newAttendees.length > 0) {
      await notifyHostOfNewAttendees(
        getEventCreatorId(afterData),
        eventId,
        afterData.title,
        afterData.price,
        newAttendees,
      );
    }

    // Process cancelled attendees (someone left)
    if (removedAttendees.length > 0) {
      await notifyHostOfCancellations(
        getEventCreatorId(afterData),
        eventId,
        afterData.title,
        removedAttendees,
      );
    }

    return null;
  },
);

/**
 * Notify host when new attendees join
 * @param {string} hostId - Host user ID
 * @param {string} eventId - Event ID
 * @param {string} eventTitle - Event title
 * @param {number} eventPrice - Event price in centavos
 * @param {Array<string>} attendeeIds - Array of attendee user IDs
 */
async function notifyHostOfNewAttendees(
  hostId,
  eventId,
  eventTitle,
  eventPrice,
  attendeeIds,
) {
  if (!hostId) {
    console.log("⚠️ No host ID, skipping notification");
    return;
  }

  try {
    const hostDoc = await db.collection("users").doc(hostId).get();
    if (!hostDoc.exists) {
      console.log("⚠️ Host not found:", hostId);
      return;
    }
    const hostData = hostDoc.data();
    const pushToken = hostData.pushToken;

    // Get attendee names (skip the host joining their own event)
    const attendeeNames = [];
    for (const attendeeId of attendeeIds) {
      if (attendeeId === hostId) continue;
      try {
        const attendeeDoc = await db.collection("users").doc(attendeeId).get();
        if (attendeeDoc.exists) {
          const attendeeData = attendeeDoc.data();
          const name =
            attendeeData.fullName?.split(" ")[0] ||
            attendeeData.name?.split(" ")[0] ||
            "Someone";
          attendeeNames.push(name);
        }
      } catch (error) {
        console.error(`Error getting attendee ${attendeeId}:`, error);
      }
    }

    if (attendeeNames.length === 0) {
      console.log("⏭️ No valid attendees to notify about");
      return;
    }

    // Format notification — BUG 34: pick a localized key by paid/free + count,
    // pass params, and keep the English title/body as a fallback.
    const n = attendeeNames.length;
    const paid = !!(eventPrice && eventPrice > 0);
    const priceMXN = paid ? (eventPrice / 100).toFixed(0) : null;
    const grp = paid ? "paid" : "free";
    const sfx = n === 1 ? "One" : "Other";
    const titleKey = `notifications.event.joined.${grp}Title${sfx}`;
    const bodyKey = `notifications.event.joined.${grp}Body${sfx}`;
    const params = {
      count: n,
      name: attendeeNames[0],
      names: attendeeNames.join(", "),
      event: eventTitle,
      price: priceMXN,
    };
    const title = tPush(titleKey, "en", params); // English fallback
    const body = tPush(bodyKey, "en", params);

    // 1. Always write an in-app notification (the bubble), regardless of push.
    //    This is the single source of "someone joined" for free/paid/membership.
    await db.collection("notifications").add({
      userId: hostId,
      type: "event_joined",
      title,
      message: body,
      titleKey,
      bodyKey,
      params,
      icon: paid ? "💰" : "👋",
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      metadata: {eventId, eventTitle},
    });
    console.log("✅ In-app notification written for host:", hostId);

    // 2. Send a push too, if the host has a token.
    if (pushToken) {
      await sendBatchPushNotifications([
        {
          pushToken,
          uid: hostId, // recipient = the host
          lang: baseLang(hostData.language), // reuse the already-loaded host doc
          titleKey,
          bodyKey,
          params,
          data: {type: "event_joined", eventId, eventTitle},
        },
      ]);
      console.log(
        `✅ Push sent for ${attendeeNames.length} new attendee(s)`,
      );
    } else {
      console.log("ℹ️ Host has no push token; bubble written, push skipped");
    }
  } catch (error) {
    console.error("❌ Error sending new attendee notification:", error);
  }
}

/**
 * Notify host when attendees cancel
 * @param {string} hostId - Host user ID
 * @param {string} eventId - Event ID
 * @param {string} eventTitle - Event title
 * @param {Array<string>} attendeeIds - Array of cancelled attendee user IDs
 */
async function notifyHostOfCancellations(
  hostId,
  eventId,
  eventTitle,
  attendeeIds,
) {
  if (!hostId) {
    console.log("⚠️ No host ID, skipping notification");
    return;
  }

  try {
    // Get host's push token
    const hostDoc = await db.collection("users").doc(hostId).get();
    if (!hostDoc.exists) {
      console.log("⚠️ Host not found:", hostId);
      return;
    }

    const hostData = hostDoc.data();
    const pushToken = hostData.pushToken;

    if (!pushToken) {
      console.log("⚠️ Host has no push token:", hostId);
      return;
    }

    // Get attendee names
    const attendeeNames = [];
    for (const attendeeId of attendeeIds) {
      // Skip if host cancelled their own attendance
      if (attendeeId === hostId) {
        continue;
      }

      try {
        const attendeeDoc = await db.collection("users").doc(attendeeId).get();
        if (attendeeDoc.exists) {
          const attendeeData = attendeeDoc.data();
          const name =
            attendeeData.fullName?.split(" ")[0] ||
            attendeeData.name?.split(" ")[0] ||
            "Someone";
          attendeeNames.push(name);
        }
      } catch (error) {
        console.error(`Error getting attendee ${attendeeId}:`, error);
      }
    }

    if (attendeeNames.length === 0) {
      console.log("⏭️ No valid cancellations to notify about");
      return;
    }

    // BUG 34: localized key by count; params carry the names/count/event.
    const n = attendeeNames.length;
    const sfx = n === 1 ? "One" : "Other";
    const params = {
      count: n,
      name: attendeeNames[0],
      names: attendeeNames.join(", "),
      event: eventTitle,
    };

    // Send push notification (host only; no in-app bubble for cancellations).
    console.log("📤 Sending cancellation notification to host:", hostId);
    const notifications = [
      {
        pushToken,
        uid: hostId, // recipient = the host
        lang: baseLang(hostData.language), // reuse the already-loaded host doc
        titleKey: `notifications.event.cancelled.title${sfx}`,
        bodyKey: `notifications.event.cancelled.body${sfx}`,
        params,
        data: {
          type: "attendee_cancelled",
          eventId: eventId,
          eventTitle: eventTitle,
        },
      },
    ];

    await sendBatchPushNotifications(notifications);
    console.log(
      `✅ Cancellation notification sent for ${attendeeNames.length} attendee(s)`,
    );
  } catch (error) {
    console.error("❌ Error sending cancellation notification:", error);
  }
}
