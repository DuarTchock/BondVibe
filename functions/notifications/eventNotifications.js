/**
 * EVENT PUSH NOTIFICATIONS
 * Sends push notifications for event-related actions
 * functions/notifications/eventNotifications.js
 */

const {onDocumentUpdated} = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const {sendBatchPushNotifications} = require("./pushService");

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

    // Get attendees arrays
    const beforeAttendees = beforeData.attendees || [];
    const afterAttendees = afterData.attendees || [];

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

    // Process new attendees (someone joined)
    if (newAttendees.length > 0) {
      await notifyHostOfNewAttendees(
        afterData.creatorId,
        eventId,
        afterData.title,
        afterData.price,
        newAttendees,
      );
    }

    // Process cancelled attendees (someone left)
    if (removedAttendees.length > 0) {
      await notifyHostOfCancellations(
        afterData.creatorId,
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
      // Don't notify if host joined their own event
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
      console.log("⏭️ No valid attendees to notify about");
      return;
    }

    // Format notification message
    let title;
    let body;

    if (eventPrice && eventPrice > 0) {
      // Paid event
      const priceMXN = (eventPrice / 100).toFixed(0);
      if (attendeeNames.length === 1) {
        title = "💰 New Paid Attendee!";
        body = `${attendeeNames[0]} paid $${priceMXN} MXN for "${eventTitle}"`;
      } else {
        title = `💰 ${attendeeNames.length} New Paid Attendees!`;
        body = `${attendeeNames.join(", ")} joined "${eventTitle}"`;
      }
    } else {
      // Free event
      if (attendeeNames.length === 1) {
        title = "👋 New Attendee!";
        body = `${attendeeNames[0]} joined "${eventTitle}"`;
      } else {
        title = `👋 ${attendeeNames.length} New Attendees!`;
        body = `${attendeeNames.join(", ")} joined "${eventTitle}"`;
      }
    }

    // Send push notification
    console.log("📤 Sending push notification to host:", hostId);
    const notifications = [
      {
        pushToken,
        title,
        body,
        data: {
          type: "event_joined",
          eventId: eventId,
          eventTitle: eventTitle,
        },
      },
    ];

    await sendBatchPushNotifications(notifications);
    console.log(
      `✅ Push notification sent for ${attendeeNames.length} new attendee(s)`,
    );
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

    // Format notification message
    let title;
    let body;

    if (attendeeNames.length === 1) {
      title = "🚫 Attendee Cancelled";
      body = `${attendeeNames[0]} cancelled their attendance for "${eventTitle}"`;
    } else {
      title = `🚫 ${attendeeNames.length} Attendees Cancelled`;
      body = `${attendeeNames.join(", ")} cancelled for "${eventTitle}"`;
    }

    // Send push notification
    console.log("📤 Sending cancellation notification to host:", hostId);
    const notifications = [
      {
        pushToken,
        title,
        body,
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
