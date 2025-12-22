/**
 * STRIPE CONNECT FUNCTIONS
 * Handles Stripe Connect account creation, onboarding, and status checks
 * Updated: Auto-updates canCreatePaidEvents flag when account is active
 */

const {onRequest} = require("firebase-functions/v2/https");
const {defineSecret} = require("firebase-functions/params");
const admin = require("firebase-admin");

// Define Stripe secret
const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");

// Initialize Stripe (done per-function)
let stripe;

/**
 * CREATE STRIPE CONNECT ACCOUNT
 * Creates an Express Connect account for hosts
 */
exports.createConnectAccount = onRequest(
  {cors: true, secrets: [stripeSecretKey]},
  async (req, res) => {
    if (req.method !== "POST") {
      return res.status(405).json({error: "Method not allowed"});
    }

    try {
      // Initialize Stripe
      if (!stripe) {
        stripe = require("stripe")(stripeSecretKey.value());
      }

      const {userId, email} = req.body;

      if (!userId || !email) {
        return res.status(400).json({error: "Missing required fields"});
      }

      console.log("📤 Creating Stripe Connect account for:", userId);

      // Create Express account
      const account = await stripe.accounts.create({
        type: "express",
        country: "MX",
        email: email,
        capabilities: {
          card_payments: {requested: true},
          transfers: {requested: true},
        },
        business_type: "individual",
        business_profile: {
          product_description: "Event hosting and experiences",
        },
      });

      console.log("✅ Stripe account created:", account.id);

      // Update Firestore
      await admin.firestore().collection("users").doc(userId).update({
        "stripeConnect.accountId": account.id,
        "stripeConnect.status": "pending",
        "stripeConnect.chargesEnabled": account.charges_enabled,
        "stripeConnect.payoutsEnabled": account.payouts_enabled,
        "stripeConnect.detailsSubmitted": account.details_submitted,
        "stripeConnect.onboardingCompleted": false,
        "stripeConnect.lastUpdated":
          admin.firestore.FieldValue.serverTimestamp(),
        "hostConfig.type": "paid", // Upgrade to paid when creating Stripe
        "hostConfig.updatedAt": admin.firestore.FieldValue.serverTimestamp(),
      });

      res.json({
        success: true,
        accountId: account.id,
      });
    } catch (error) {
      console.error("❌ Error creating Connect account:", error);
      res.status(500).json({
        error: error.message || "Failed to create Connect account",
      });
    }
  },
);

/**
 * CREATE ACCOUNT LINK (Onboarding)
 * Generates onboarding link for Stripe Connect
 */
exports.createAccountLink = onRequest(
  {cors: true, secrets: [stripeSecretKey]},
  async (req, res) => {
    if (req.method !== "POST") {
      return res.status(405).json({error: "Method not allowed"});
    }

    try {
      // Initialize Stripe
      if (!stripe) {
        stripe = require("stripe")(stripeSecretKey.value());
      }

      const {userId} = req.body;

      if (!userId) {
        return res.status(400).json({error: "Missing userId"});
      }

      console.log("📤 Getting account link for:", userId);

      // Get user's Stripe account ID
      const userDoc = await admin
        .firestore()
        .collection("users")
        .doc(userId)
        .get();

      const accountId = userDoc.data()?.stripeConnect?.accountId;

      if (!accountId) {
        return res.status(404).json({
          error: "No Stripe account found. Create account first.",
        });
      }

      // Create account link
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: "https://bondvibe-dev.firebaseapp.com/stripe/refresh",
        return_url: "https://bondvibe-dev.firebaseapp.com/stripe/return",
        type: "account_onboarding",
      });

      console.log("✅ Account link created");

      // Update onboarding URL in Firestore
      await admin.firestore().collection("users").doc(userId).update({
        "stripeConnect.onboardingUrl": accountLink.url,
        "stripeConnect.lastUpdated":
          admin.firestore.FieldValue.serverTimestamp(),
      });

      res.json({
        success: true,
        url: accountLink.url,
      });
    } catch (error) {
      console.error("❌ Error getting account link:", error);
      res.status(500).json({
        error: error.message || "Failed to get account link",
      });
    }
  },
);

/**
 * GET ACCOUNT STATUS (UPDATED)
 * Checks Stripe account status and updates Firestore
 * NOW INCLUDES: Auto-update of canCreatePaidEvents flag
 */
exports.getAccountStatus = onRequest(
  {cors: true, secrets: [stripeSecretKey]},
  async (req, res) => {
    if (req.method !== "POST") {
      return res.status(405).json({error: "Method not allowed"});
    }

    try {
      // Initialize Stripe
      if (!stripe) {
        stripe = require("stripe")(stripeSecretKey.value());
      }

      const {userId} = req.body;

      if (!userId) {
        return res.status(400).json({error: "Missing userId"});
      }

      console.log("📤 Checking account status for:", userId);

      // Get user's Stripe account ID
      const userDoc = await admin
        .firestore()
        .collection("users")
        .doc(userId)
        .get();

      const accountId = userDoc.data()?.stripeConnect?.accountId;

      if (!accountId) {
        return res.status(404).json({
          error: "No Stripe account found",
        });
      }

      // Retrieve account from Stripe
      const account = await stripe.accounts.retrieve(accountId);

      console.log("✅ Account status retrieved:", {
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
      });

      // ✅ NEW: Determine if account is fully active
      const isFullyActive =
        account.charges_enabled && account.details_submitted;

      // ✅ NEW: Determine status
      let status = "pending";
      if (isFullyActive) {
        status = "active";
      } else if (account.details_submitted && !account.charges_enabled) {
        status = "restricted";
      }

      // ✅ UPDATED: Build update object with canCreatePaidEvents
      const updateData = {
        "stripeConnect.status": status,
        "stripeConnect.chargesEnabled": account.charges_enabled,
        "stripeConnect.payoutsEnabled": account.payouts_enabled,
        "stripeConnect.detailsSubmitted": account.details_submitted,
        "stripeConnect.onboardingCompleted": account.details_submitted,
        "stripeConnect.lastUpdated":
          admin.firestore.FieldValue.serverTimestamp(),
      };

      // ✅ NEW: Auto-update canCreatePaidEvents when account is active
      if (isFullyActive) {
        updateData["hostConfig.canCreatePaidEvents"] = true;
        updateData["hostConfig.type"] = "paid";
        updateData["hostConfig.updatedAt"] =
          admin.firestore.FieldValue.serverTimestamp();
        console.log(
          "✅ Setting canCreatePaidEvents = true (account fully active)",
        );
      } else {
        // Account not ready - ensure flag is false
        updateData["hostConfig.canCreatePaidEvents"] = false;
        console.log(
          "⏳ Setting canCreatePaidEvents = false (account not ready)",
        );
      }

      // Update Firestore
      await admin
        .firestore()
        .collection("users")
        .doc(userId)
        .update(updateData);

      console.log(`✅ Account status: ${status}`);

      res.json({
        success: true,
        status: status,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
        canCreatePaidEvents: isFullyActive, // ✅ NEW: Return flag status
      });
    } catch (error) {
      console.error("❌ Error checking account status:", error);
      res.status(500).json({
        error: error.message || "Failed to check account status",
      });
    }
  },
);

/**
 * STRIPE CONNECT WEBHOOK (OPTIONAL)
 * Handles automatic updates when Stripe sends account.updated events
 * Uncomment to enable instant updates without manual refresh
 */
exports.stripeConnectWebhook = onRequest(
  {cors: true, secrets: [stripeSecretKey]},
  async (req, res) => {
    if (req.method !== "POST") {
      return res.status(405).json({error: "Method not allowed"});
    }

    try {
      // Initialize Stripe
      if (!stripe) {
        stripe = require("stripe")(stripeSecretKey.value());
      }

      const sig = req.headers["stripe-signature"];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!webhookSecret) {
        console.log("⚠️ Webhook secret not configured");
        return res.status(400).json({error: "Webhook not configured"});
      }

      // Verify webhook signature
      let event;
      try {
        event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
      } catch (err) {
        console.error("❌ Webhook signature verification failed:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      console.log("📨 Webhook received:", event.type);

      // Handle account.updated event
      if (event.type === "account.updated") {
        const account = event.data.object;

        // Find user with this Stripe account
        const usersRef = admin.firestore().collection("users");
        const snapshot = await usersRef
          .where("stripeConnect.accountId", "==", account.id)
          .limit(1)
          .get();

        if (!snapshot.empty) {
          const userId = snapshot.docs[0].id;
          const isFullyActive =
            account.charges_enabled && account.details_submitted;

          const updateData = {
            "stripeConnect.status": isFullyActive ? "active" : "pending",
            "stripeConnect.chargesEnabled": account.charges_enabled,
            "stripeConnect.payoutsEnabled": account.payouts_enabled,
            "stripeConnect.detailsSubmitted": account.details_submitted,
            "stripeConnect.onboardingCompleted": account.details_submitted,
            "stripeConnect.lastUpdated":
              admin.firestore.FieldValue.serverTimestamp(),
            "hostConfig.canCreatePaidEvents": isFullyActive,
            "hostConfig.type": "paid",
            "hostConfig.updatedAt":
              admin.firestore.FieldValue.serverTimestamp(),
          };

          await usersRef.doc(userId).update(updateData);
          console.log(
            `✅ Auto-updated account ${account.id} for user ${userId}`,
          );
        } else {
          console.log(`⚠️ No user found for account ${account.id}`);
        }
      }

      res.json({received: true});
    } catch (error) {
      console.error("❌ Webhook error:", error);
      res.status(500).json({error: error.message});
    }
  },
);
