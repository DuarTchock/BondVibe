/**
 * Migration Script: Add hostConfig to existing hosts
 * Run once to migrate existing host users to new data model
 */

const admin = require("firebase-admin");

// Initialize Firebase Admin with explicit project ID
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: "bondvibe-dev", // Add this line
  });
}

const db = admin.firestore();

const migrateHostConfig = async () => {
  console.log("🚀 Starting host config migration...");

  try {
    // Get all users with role 'host'
    const hostsSnapshot = await db
      .collection("users")
      .where("role", "==", "host")
      .get();

    console.log(`📊 Found ${hostsSnapshot.size} hosts to migrate`);

    if (hostsSnapshot.empty) {
      console.log("⚠️ No hosts found to migrate");
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    // Migrate each host
    for (const doc of hostsSnapshot.docs) {
      try {
        const userData = doc.data();

        // Skip if already has hostConfig
        if (userData.hostConfig) {
          console.log(`⏭️ Skipping ${doc.id} - already has hostConfig`);
          continue;
        }

        // Add hostConfig with default values (free host)
        await doc.ref.update({
          hostConfig: {
            type: "free", // Default to free host
            canCreatePaidEvents: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        });

        console.log(
          `✅ Migrated host: ${doc.id} (${userData.fullName || userData.email})`,
        );
        successCount++;
      } catch (error) {
        console.error(`❌ Error migrating host ${doc.id}:`, error);
        errorCount++;
      }
    }

    console.log("\n📈 Migration Summary:");
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
    console.log(`   📊 Total: ${hostsSnapshot.size}`);
    console.log("\n✨ Migration complete!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
};

// Run migration
migrateHostConfig()
  .then(() => {
    console.log("👋 Exiting...");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Fatal error:", error);
    process.exit(1);
  });

module.exports = {migrateHostConfig};
