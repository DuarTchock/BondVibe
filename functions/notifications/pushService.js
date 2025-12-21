/**
 * Expo Push Notification Service
 * Sends real push notifications via Expo's push service
 */

const {Expo} = require("expo-server-sdk");

// Create a new Expo SDK client
const expo = new Expo();

/**
 * Send push notification to a single user
 * @param {string} pushToken - Expo push token
 * @param {object} notification - { title, body, data }
 */
const sendPushNotification = async (pushToken, notification) => {
  // Check that the push token is valid
  if (!Expo.isExpoPushToken(pushToken)) {
    console.error(`❌ Invalid Expo push token: ${pushToken}`);
    return {success: false, error: "Invalid push token"};
  }

  const message = {
    to: pushToken,
    sound: "default",
    title: notification.title,
    body: notification.body,
    data: notification.data || {},
    badge: notification.badge || 1,
    priority: "high",
    channelId: "default",
  };

  try {
    const ticket = await expo.sendPushNotificationsAsync([message]);
    console.log("✅ Push notification sent:", ticket);
    return {success: true, ticket: ticket[0]};
  } catch (error) {
    console.error("❌ Error sending push notification:", error);
    return {success: false, error: error.message};
  }
};

/**
 * Send push notifications to multiple users
 * @param {Array} notifications - Array of { pushToken, title, body, data }
 */
const sendBatchPushNotifications = async (notifications) => {
  const messages = [];

  for (const notif of notifications) {
    if (!Expo.isExpoPushToken(notif.pushToken)) {
      console.error(`❌ Invalid token skipped: ${notif.pushToken}`);
      continue;
    }

    messages.push({
      to: notif.pushToken,
      sound: "default",
      title: notif.title,
      body: notif.body,
      data: notif.data || {},
      badge: notif.badge || 1,
      priority: "high",
      channelId: "default",
    });
  }

  if (messages.length === 0) {
    console.log("⚠️ No valid push tokens to send");
    return [];
  }

  // Expo recommends sending in chunks of 100
  const chunks = expo.chunkPushNotifications(messages);
  const tickets = [];

  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      console.log(`✅ Sent ${ticketChunk.length} push notifications`);
      tickets.push(...ticketChunk);
    } catch (error) {
      console.error("❌ Error sending chunk:", error);
    }
  }

  return tickets;
};

module.exports = {
  sendPushNotification,
  sendBatchPushNotifications,
  expo,
};
