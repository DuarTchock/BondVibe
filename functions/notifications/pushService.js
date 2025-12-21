/**
 * Expo Push Notification Service
 * Sends push notifications via Expo Push Notification API
 */

const fetch = require("node-fetch");

/**
 * Send push notification to a single user
 * @param {string} pushToken - Expo push token
 * @param {object} notification - { title, body, data }
 */
const sendPushNotification = async (pushToken, notification) => {
  // Validate Expo push token format
  if (!pushToken || !pushToken.startsWith("ExponentPushToken[")) {
    console.error(`❌ Invalid Expo push token: ${pushToken}`);
    return {success: false, error: "Invalid push token"};
  }

  const message = {
    to: pushToken,
    sound: "default",
    title: notification.title,
    body: notification.body,
    data: notification.data || {},
    priority: "high",
    channelId: "default",
  };

  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    console.log("✅ Push notification sent:", result);
    return {success: true, result: result};
  } catch (error) {
    console.error("❌ Error sending push notification:", error);
    return {success: false, error: error.message};
  }
};

/**
 * Send push notifications to multiple users
 * @param {Array} notifications - Array of {pushToken, title, body, data}
 */
const sendBatchPushNotifications = async (notifications) => {
  const messages = [];

  for (const notif of notifications) {
    // Validate Expo push token format
    if (!notif.pushToken || !notif.pushToken.startsWith("ExponentPushToken[")) {
      console.error(`❌ Invalid token skipped: ${notif.pushToken}`);
      continue;
    }

    messages.push({
      to: notif.pushToken,
      sound: "default",
      title: notif.title,
      body: notif.body,
      data: notif.data || {},
      priority: "high",
      channelId: "default",
    });
  }

  if (messages.length === 0) {
    console.log("⚠️ No valid push tokens to send");
    return [];
  }

  console.log(`📤 Attempting to send ${messages.length} notifications...`);

  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    });

    const result = await response.json();
    console.log(`✅ Sent ${messages.length} push notifications:`, result);
    return result.data || [];
  } catch (error) {
    console.error("❌ Error sending batch:", error);
    return [];
  }
};

module.exports = {
  sendPushNotification,
  sendBatchPushNotifications,
};
