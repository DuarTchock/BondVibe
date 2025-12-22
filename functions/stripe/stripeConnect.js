/**
 * Stripe Connect Cloud Functions
 * Handles host onboarding and account management
 */

const {onRequest} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const {defineSecret} = require("firebase-functions/params");

// Define secrets
const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");
// const stripeConnectClientId = defineSecret("STRIPE_CONNECT_CLIENT_ID");

// Initialize Stripe (will be done inside functions)
let stripe;

const db = admin.firestore();

/**
 * Create a Stripe Connect Standard Account for a host
 * Called when host selects "Paid Events" option
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

      const {userId, email, fullName} = req.body;

      if (!userId || !email) {
        return res.status(400).json({error: "Missing required fields"});
      }

      // Check if user exists and is a host
      const userDoc = await db.collection("users").doc(userId).get();
      if (!userDoc.exists) {
        return res.status(404).json({error: "User not found"});
      }

      const userData = userDoc.data();
      if (userData.role !== "host") {
        return res.status(403).json({error: "User is not a host"});
      }

      // Check if already has account
      if (userData.stripeConnect?.accountId) {
        return res.status(400).json({
          error: "User already has a Stripe Connect account",
          accountId: userData.stripeConnect.accountId,
        });
      }

      console.log(`Creating Stripe Connect account for user: ${userId}`);

      // Create Stripe Connect Account (Standard)
      const account = await stripe.accounts.create({
        type: "standard",
        email: email,
        metadata: {
          userId: userId,
          platform: "bondvibe",
          fullName: fullName || "",
        },
      });

      console.log(`✅ Created Stripe account: ${account.id}`);

      // Save to Firestore
      await db
        .collection("users")
        .doc(userId)
        .update({
          "hostConfig.type": "paid",
          "hostConfig.canCreatePaidEvents": false,
          "hostConfig.updatedAt": new Date().toISOString(),
          "stripeConnect": {
            accountId: account.id,
            status: "pending",
            onboardingCompleted: false,
            chargesEnabled: false,
            payoutsEnabled: false,
            detailsSubmitted: false,
            lastUpdated: new Date().toISOString(),
          },
        });

      console.log(`✅ Saved to Firestore for user: ${userId}`);

      res.json({
        success: true,
        accountId: account.id,
        message: "Stripe Connect account created successfully",
      });
    } catch (error) {
      console.error("❌ Error creating Stripe Connect account:", error);
      res.status(500).json({
        error: error.message,
        details: "Failed to create Stripe Connect account",
      });
    }
  },
);

/**
 * Generate Stripe onboarding URL for host
 * Returns a URL that expires in 5 minutes
 */
exports.createAccountLink = onRequest(
  {cors: true, secrets: [stripeSecretKey]},
  async (req, res) => {
    if (req.method !== "POST") {
      return res.status(405).json({error: "Method not allowed"});
    }

    try {
      if (!stripe) {
        stripe = require("stripe")(stripeSecretKey.value());
      }

      const {userId} = req.body;

      if (!userId) {
        return res.status(400).json({error: "Missing userId"});
      }

      // Get user's Stripe account
      const userDoc = await db.collection("users").doc(userId).get();
      if (!userDoc.exists) {
        return res.status(404).json({error: "User not found"});
      }

      const userData = userDoc.data();
      const accountId = userData.stripeConnect?.accountId;

      if (!accountId) {
        return res.status(400).json({
          error: "No Stripe account found. Create account first.",
        });
      }

      console.log(`Creating account link for account: ${accountId}`);

      // Create account link
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: "http://localhost:19006/stripe/connect/refresh",
        return_url: "http://localhost:19006/stripe/connect/return",
        type: "account_onboarding",
      });

      console.log(`✅ Account link created: ${accountLink.url}`);

      // Save URL to Firestore (expires in 5 minutes)
      await db.collection("users").doc(userId).update({
        "stripeConnect.onboardingUrl": accountLink.url,
        "stripeConnect.lastUpdated": new Date().toISOString(),
      });

      res.json({
        success: true,
        url: accountLink.url,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      });
    } catch (error) {
      console.error("❌ Error creating account link:", error);
      res.status(500).json({
        error: error.message,
        details: "Failed to create account link",
      });
    }
  },
);

/**
 * Check Stripe account status and update Firestore
 * Returns current status of the connected account
 */
exports.getAccountStatus = onRequest(
  {cors: true, secrets: [stripeSecretKey]},
  async (req, res) => {
    if (req.method !== "POST") {
      return res.status(405).json({error: "Method not allowed"});
    }

    try {
      if (!stripe) {
        stripe = require("stripe")(stripeSecretKey.value());
      }

      const {userId} = req.body;

      if (!userId) {
        return res.status(400).json({error: "Missing userId"});
      }

      const userDoc = await db.collection("users").doc(userId).get();
      if (!userDoc.exists) {
        return res.status(404).json({error: "User not found"});
      }

      const userData = userDoc.data();
      const accountId = userData.stripeConnect?.accountId;

      if (!accountId) {
        return res.status(404).json({error: "No Stripe account found"});
      }

      console.log(`Checking status for account: ${accountId}`);

      // Retrieve account from Stripe
      const account = await stripe.accounts.retrieve(accountId);

      console.log(
        `Account status - charges: ${account.charges_enabled}, payouts: ${account.payouts_enabled}`,
      );

      // Determine if host can create paid events
      const canCreatePaidEvents =
        account.charges_enabled &&
        account.payouts_enabled &&
        account.details_submitted;

      // Update Firestore
      await db
        .collection("users")
        .doc(userId)
        .update({
          "hostConfig.canCreatePaidEvents": canCreatePaidEvents,
          "stripeConnect.status": account.charges_enabled ?
            "active" :
            "pending",
          "stripeConnect.chargesEnabled": account.charges_enabled,
          "stripeConnect.payoutsEnabled": account.payouts_enabled,
          "stripeConnect.detailsSubmitted": account.details_submitted,
          "stripeConnect.onboardingCompleted": account.details_submitted,
          "stripeConnect.lastUpdated": new Date().toISOString(),
        });

      console.log(`✅ Updated status for user: ${userId}`);

      res.json({
        success: true,
        accountId: accountId,
        status: account.charges_enabled ? "active" : "pending",
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
        canCreatePaidEvents: canCreatePaidEvents,
      });
    } catch (error) {
      console.error("❌ Error getting account status:", error);
      res.status(500).json({
        error: error.message,
        details: "Failed to get account status",
      });
    }
  },
);

/**
 * Stripe webhook handler
 * Listens for account.updated events to keep Firestore in sync
 */
exports.stripeConnectWebhook = onRequest(
  {cors: true, secrets: [stripeSecretKey]},
  async (req, res) => {
    if (req.method !== "POST") {
      return res.status(405).json({error: "Method not allowed"});
    }

    try {
      if (!stripe) {
        stripe = require("stripe")(stripeSecretKey.value());
      }

      const event = req.body;

      console.log(`📨 Received webhook event: ${event.type}`);

      // Handle account.updated event
      if (event.type === "account.updated") {
        const account = event.data.object;

        console.log(`Webhook - Account updated: ${account.id}`);

        // Find user with this account
        const usersSnapshot = await db
          .collection("users")
          .where("stripeConnect.accountId", "==", account.id)
          .get();

        if (usersSnapshot.empty) {
          console.log(`⚠️ No user found for account: ${account.id}`);
          return res.status(404).json({error: "User not found"});
        }

        const userDoc = usersSnapshot.docs[0];
        const canCreatePaidEvents =
          account.charges_enabled &&
          account.payouts_enabled &&
          account.details_submitted;

        await userDoc.ref.update({
          "hostConfig.canCreatePaidEvents": canCreatePaidEvents,
          "stripeConnect.status": account.charges_enabled ?
            "active" :
            "pending",
          "stripeConnect.chargesEnabled": account.charges_enabled,
          "stripeConnect.payoutsEnabled": account.payouts_enabled,
          "stripeConnect.detailsSubmitted": account.details_submitted,
          "stripeConnect.onboardingCompleted": account.details_submitted,
          "stripeConnect.lastUpdated": new Date().toISOString(),
        });

        console.log(`✅ Webhook - Updated user: ${userDoc.id}`);
      }

      res.json({received: true});
    } catch (error) {
      console.error("❌ Error processing webhook:", error);
      res.status(500).json({
        error: error.message,
        details: "Webhook processing failed",
      });
    }
  },
);
