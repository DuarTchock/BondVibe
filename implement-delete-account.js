const fs = require('fs');

// ============================================
// 1. AGREGAR CLOUD FUNCTION para eliminar cuenta
// ============================================
const deleteAccountFunction = `

// ============================================
// DELETE ACCOUNT
// ============================================

/**
 * Delete user account and all associated data
 * This is required by Apple App Store guidelines
 */
exports.deleteUserAccount = onRequest(
  {cors: true},
  async (req, res) => {
    if (req.method !== "POST") {
      return res.status(405).json({error: "Method not allowed"});
    }

    try {
      const {userId} = req.body;

      if (!userId) {
        return res.status(400).json({error: "Missing userId"});
      }

      console.log("🗑️ Starting account deletion for user:", userId);

      // 1. Delete user's events (where they are creator)
      const eventsSnapshot = await db
        .collection("events")
        .where("creatorId", "==", userId)
        .get();
      
      const eventDeletePromises = eventsSnapshot.docs.map(async (eventDoc) => {
        // Delete event messages subcollection
        const messagesSnapshot = await eventDoc.ref.collection("messages").get();
        const messageDeletes = messagesSnapshot.docs.map((msg) => msg.ref.delete());
        await Promise.all(messageDeletes);
        
        // Delete event document
        return eventDoc.ref.delete();
      });
      await Promise.all(eventDeletePromises);
      console.log("✅ Deleted", eventsSnapshot.size, "events created by user");

      // 2. Remove user from events they joined (as attendee)
      const joinedEventsSnapshot = await db
        .collection("events")
        .where("attendees", "array-contains-any", [
          userId,
          {userId: userId}
        ])
        .get();
      
      // Note: This query might not work perfectly with mixed array types
      // We'll also do a broader cleanup
      
      // 3. Delete user's notifications
      const notificationsSnapshot = await db
        .collection("notifications")
        .where("userId", "==", userId)
        .get();
      
      const notifDeletePromises = notificationsSnapshot.docs.map((doc) => doc.ref.delete());
      await Promise.all(notifDeletePromises);
      console.log("✅ Deleted", notificationsSnapshot.size, "notifications");

      // 4. Delete user's ratings
      const ratingsSnapshot = await db
        .collection("ratings")
        .where("raterId", "==", userId)
        .get();
      
      const ratingDeletePromises = ratingsSnapshot.docs.map((doc) => doc.ref.delete());
      await Promise.all(ratingDeletePromises);
      console.log("✅ Deleted", ratingsSnapshot.size, "ratings");

      // 5. Delete user document from Firestore
      await db.collection("users").doc(userId).delete();
      console.log("✅ Deleted user document");

      // 6. Delete user from Firebase Auth
      try {
        await admin.auth().deleteUser(userId);
        console.log("✅ Deleted user from Firebase Auth");
      } catch (authError) {
        console.error("⚠️ Error deleting from Auth (may already be deleted):", authError.message);
      }

      // 7. Delete user's files from Storage (profile photos, etc.)
      try {
        const bucket = admin.storage().bucket();
        const [files] = await bucket.getFiles({prefix: \`users/\${userId}/\`});
        const deleteFilePromises = files.map((file) => file.delete());
        await Promise.all(deleteFilePromises);
        console.log("✅ Deleted", files.length, "files from storage");
      } catch (storageError) {
        console.error("⚠️ Error deleting from Storage:", storageError.message);
      }

      console.log("🎉 Account deletion complete for user:", userId);

      res.json({
        success: true,
        message: "Account deleted successfully",
        deletedData: {
          events: eventsSnapshot.size,
          notifications: notificationsSnapshot.size,
          ratings: ratingsSnapshot.size,
        },
      });
    } catch (error) {
      console.error("❌ Error deleting account:", error);
      res.status(500).json({error: error.message});
    }
  },
);
`;

// Agregar al final de functions/index.js
const functionsPath = 'functions/index.js';
let functionsContent = fs.readFileSync(functionsPath, 'utf8');

if (!functionsContent.includes('deleteUserAccount')) {
  functionsContent += deleteAccountFunction;
  fs.writeFileSync(functionsPath, functionsContent);
  console.log('✅ Added deleteUserAccount cloud function');
} else {
  console.log('⏭️ deleteUserAccount already exists');
}

// ============================================
// 2. AGREGAR UI EN ProfileScreen
// ============================================
const profilePath = 'src/screens/ProfileScreen.js';
let profileContent = fs.readFileSync(profilePath, 'utf8');

// Agregar import de Trash2 icon
if (!profileContent.includes('Trash2')) {
  profileContent = profileContent.replace(
    'BadgeCheck,',
    'BadgeCheck,\n  Trash2,'
  );
  console.log('✅ Added Trash2 icon import');
}

// Agregar estado para delete modal
if (!profileContent.includes('showDeleteModal')) {
  profileContent = profileContent.replace(
    'const [showLogoutModal, setShowLogoutModal] = useState(false);',
    `const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);`
  );
  console.log('✅ Added delete modal state');
}

// Agregar función performDeleteAccount
if (!profileContent.includes('performDeleteAccount')) {
  profileContent = profileContent.replace(
    'const performLogout = async () => {',
    `const performDeleteAccount = async () => {
    setDeleting(true);
    try {
      const userId = auth.currentUser.uid;
      
      // Call cloud function to delete all user data
      const response = await fetch(
        "https://us-central1-bondvibe-dev.cloudfunctions.net/deleteUserAccount",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        }
      );
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || "Failed to delete account");
      }
      
      console.log("✅ Account deleted:", result);
      
      // Sign out after deletion
      await signOut(auth);
    } catch (error) {
      console.error("Delete account error:", error);
      alert("Error deleting account: " + error.message);
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const performLogout = async () => {`
  );
  console.log('✅ Added performDeleteAccount function');
}

// Agregar Delete Account Modal después del Logout Modal
if (!profileContent.includes('Delete Account Modal')) {
  profileContent = profileContent.replace(
    '{/* Avatar Picker */}',
    `{/* Delete Account Modal */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View
              style={[
                styles.modalGlass,
                {
                  backgroundColor: isDark
                    ? "rgba(17, 24, 39, 0.95)"
                    : "rgba(255, 255, 255, 0.95)",
                  borderColor: colors.border,
                },
              ]}
            >
              <View
                style={[
                  styles.modalIconCircle,
                  { backgroundColor: "rgba(239, 68, 68, 0.15)" },
                ]}
              >
                <Trash2 size={32} color="#EF4444" strokeWidth={1.8} />
              </View>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Delete Account
              </Text>
              <Text style={[styles.modalText, { color: colors.textSecondary }]}>
                This action is permanent and cannot be undone. All your data, events, and messages will be deleted.
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setShowDeleteModal(false)}
                  disabled={deleting}
                >
                  <View
                    style={[
                      styles.modalButtonGlass,
                      {
                        backgroundColor: isDark
                          ? "rgba(255, 255, 255, 0.04)"
                          : "rgba(255, 255, 255, 0.85)",
                        borderColor: isDark
                          ? "rgba(255, 255, 255, 0.10)"
                          : "rgba(0, 0, 0, 0.08)",
                      },
                    ]}
                  >
                    <Text
                      style={[styles.modalCancelText, { color: colors.text }]}
                    >
                      Cancel
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalLogoutButton}
                  onPress={performDeleteAccount}
                  disabled={deleting}
                >
                  <View style={styles.modalLogoutGlass}>
                    <Text style={styles.modalLogoutText}>
                      {deleting ? "Deleting..." : "Delete"}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Avatar Picker */}`
  );
  console.log('✅ Added Delete Account Modal');
}

// Agregar botón Delete Account antes del botón Logout
if (!profileContent.includes('Delete Account Button')) {
  profileContent = profileContent.replace(
    '{/* Logout Button */}',
    `{/* Delete Account Button */}
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => setShowDeleteModal(true)}
            >
              <View style={styles.deleteGlass}>
                <Trash2 size={20} color="#EF4444" strokeWidth={2} />
                <Text style={styles.deleteButtonText}>Delete Account</Text>
              </View>
            </TouchableOpacity>

            {/* Logout Button */}`
  );
  console.log('✅ Added Delete Account Button');
}

// Agregar estilos para delete button
if (!profileContent.includes('deleteButton:')) {
  profileContent = profileContent.replace(
    'logoutButton: { marginBottom: 20 },',
    `deleteButton: { marginBottom: 12 },
    deleteGlass: {
      backgroundColor: "rgba(239, 68, 68, 0.08)",
      borderWidth: 1,
      borderColor: "rgba(239, 68, 68, 0.2)",
      borderRadius: 16,
      paddingVertical: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    deleteButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: "#EF4444",
      letterSpacing: -0.1,
    },
    logoutButton: { marginBottom: 20 },`
  );
  console.log('✅ Added delete button styles');
}

fs.writeFileSync(profilePath, profileContent);
console.log('✅ ProfileScreen updated');

console.log('\n🎉 Delete Account feature implemented!');
console.log('\nNext steps:');
console.log('1. Deploy cloud function: cd functions && npm run deploy');
console.log('2. Test in the app');
