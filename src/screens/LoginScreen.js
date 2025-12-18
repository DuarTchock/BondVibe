import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../services/firebase";
import { useTheme } from "../contexts/ThemeContext";
import SuccessModal from "../components/SuccessModal";

export default function LoginScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorModal, setErrorModal] = useState({
    visible: false,
    title: "",
    message: "",
    showSignup: false,
  });

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorModal({
        visible: true,
        title: "Missing Information",
        message: "Please fill in all fields to continue.",
        showSignup: false,
      });
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      let user = userCredential.user;

      // ← NUEVO: Reload user to get fresh emailVerified status
      console.log("🔄 Reloading user to get fresh emailVerified status...");
      await user.reload();
      user = auth.currentUser; // Get the refreshed user object

      console.log("✅ Login successful:", user.uid);
      console.log(
        "📧 Email verified in Auth (after reload):",
        user.emailVerified
      );

      // Sync emailVerified from Firebase Auth to Firestore
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();

          // If emailVerified status in Firestore doesn't match Firebase Auth, update it
          if (userData.emailVerified !== user.emailVerified) {
            console.log(
              "🔄 Syncing emailVerified to Firestore:",
              user.emailVerified
            );
            await updateDoc(userDocRef, {
              emailVerified: user.emailVerified,
            });
            console.log("✅ Firestore emailVerified updated");
          }
        }
      } catch (syncError) {
        console.error(
          "⚠️ Error syncing emailVerified to Firestore:",
          syncError
        );
        // Don't block login if sync fails
      }

      // AppNavigator will handle navigation based on user state
      setLoading(false);
    } catch (error) {
      console.log("Login error:", error);
      console.log("Error code:", error.code);

      setLoading(false);

      // Mensajes de error amigables con modal
      if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/invalid-credential" ||
        error.code === "auth/wrong-password"
      ) {
        setErrorModal({
          visible: true,
          title: "Account Not Found",
          message:
            "No account exists with this email or the password is incorrect. Would you like to create an account?",
          showSignup: true,
        });
      } else if (error.code === "auth/invalid-email") {
        setErrorModal({
          visible: true,
          title: "Invalid Email",
          message: "Please enter a valid email address.",
          showSignup: false,
        });
      } else if (error.code === "auth/too-many-requests") {
        setErrorModal({
          visible: true,
          title: "Too Many Attempts",
          message: "Too many failed login attempts. Please try again later.",
          showSignup: false,
        });
      } else {
        setErrorModal({
          visible: true,
          title: "Login Failed",
          message: error.message,
          showSignup: false,
        });
      }
      return;
    }
  };

  const handleCancel = () => {
    console.log("❌ Cancel clicked - closing modal");
    setErrorModal({ ...errorModal, visible: false });
  };

  const handleSignupClick = () => {
    console.log("✅ Sign Up clicked - navigating");
    setErrorModal({ ...errorModal, visible: false });
    setTimeout(() => navigation.navigate("Signup"), 100);
  };

  const handleSimpleModalClose = () => {
    console.log("✅ Modal closed");
    setErrorModal({ ...errorModal, visible: false });
  };

  const styles = createStyles(colors);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.logo}>🎪</Text>
          <Text style={[styles.title, { color: colors.text }]}>BondVibe</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Connect through shared experiences
          </Text>
        </View>

        <View style={styles.form}>
          <View
            style={[
              styles.inputWrapper,
              {
                backgroundColor: colors.surfaceGlass,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={styles.inputIcon}>📧</Text>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Email"
              placeholderTextColor={colors.textTertiary}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View
            style={[
              styles.inputWrapper,
              {
                backgroundColor: colors.surfaceGlass,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={styles.inputIcon}>🔒</Text>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Password"
              placeholderTextColor={colors.textTertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={loading}
          >
            <View
              style={[
                styles.loginGlass,
                {
                  backgroundColor: `${colors.primary}33`,
                  borderColor: `${colors.primary}66`,
                },
              ]}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={[styles.loginText, { color: colors.primary }]}>
                  Log In
                </Text>
              )}
            </View>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View
              style={[styles.dividerLine, { backgroundColor: colors.border }]}
            />
            <Text style={[styles.dividerText, { color: colors.textTertiary }]}>
              or
            </Text>
            <View
              style={[styles.dividerLine, { backgroundColor: colors.border }]}
            />
          </View>

          <TouchableOpacity
            style={styles.signupButton}
            onPress={() => navigation.navigate("Signup")}
          >
            <View
              style={[
                styles.signupGlass,
                {
                  backgroundColor: colors.surfaceGlass,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.signupText, { color: colors.text }]}>
                Don't have an account?{" "}
                <Text style={{ color: colors.primary, fontWeight: "700" }}>
                  Sign Up
                </Text>
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal con dos botones para "Account Not Found" */}
      {errorModal.showSignup && (
        <Modal
          visible={errorModal.visible}
          transparent={true}
          animationType="fade"
          onRequestClose={handleCancel}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={styles.modalBackdrop}
              activeOpacity={1}
              onPress={handleCancel}
            />
            <View
              style={[styles.modalContent, { backgroundColor: colors.surface }]}
            >
              <Text style={styles.modalEmoji}>❌</Text>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {errorModal.title}
              </Text>
              <Text
                style={[styles.modalMessage, { color: colors.textSecondary }]}
              >
                {errorModal.message}
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={handleCancel}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.modalButtonGlass,
                      {
                        backgroundColor: colors.surfaceGlass,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.modalButtonText, { color: colors.text }]}
                    >
                      Cancel
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={handleSignupClick}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.modalButtonGlass,
                      {
                        backgroundColor: `${colors.primary}33`,
                        borderColor: `${colors.primary}66`,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.modalButtonText,
                        { color: colors.primary },
                      ]}
                    >
                      Sign Up
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Modal simple para otros errores */}
      {!errorModal.showSignup && (
        <SuccessModal
          visible={errorModal.visible}
          onClose={handleSimpleModalClose}
          title={errorModal.title}
          message={errorModal.message}
          emoji="❌"
        />
      )}
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: { flex: 1 },
    content: { flex: 1, justifyContent: "center", paddingHorizontal: 24 },
    header: { alignItems: "center", marginBottom: 48 },
    logo: { fontSize: 72, marginBottom: 16 },
    title: {
      fontSize: 32,
      fontWeight: "700",
      marginBottom: 8,
      letterSpacing: -0.5,
    },
    subtitle: { fontSize: 15, textAlign: "center" },
    form: { width: "100%", maxWidth: 400, alignSelf: "center" },
    inputWrapper: {
      borderWidth: 1,
      borderRadius: 16,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      marginBottom: 16,
    },
    inputIcon: { fontSize: 20, marginRight: 12 },
    input: { flex: 1, fontSize: 16, paddingVertical: 16 },
    loginButton: { borderRadius: 16, overflow: "hidden", marginBottom: 20 },
    loginGlass: { borderWidth: 1, paddingVertical: 16, alignItems: "center" },
    loginText: { fontSize: 17, fontWeight: "700", letterSpacing: -0.2 },
    divider: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
    dividerLine: { flex: 1, height: 1 },
    dividerText: { marginHorizontal: 16, fontSize: 14 },
    signupButton: { borderRadius: 16, overflow: "hidden" },
    signupGlass: { borderWidth: 1, paddingVertical: 16, alignItems: "center" },
    signupText: { fontSize: 15 },

    // Modal personalizado
    modalOverlay: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.6)",
    },
    modalBackdrop: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    modalContent: {
      width: "90%",
      maxWidth: 400,
      borderRadius: 24,
      padding: 32,
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.3,
      shadowRadius: 30,
      elevation: 20,
    },
    modalEmoji: { fontSize: 72, marginBottom: 20 },
    modalTitle: {
      fontSize: 24,
      fontWeight: "700",
      marginBottom: 12,
      textAlign: "center",
      letterSpacing: -0.4,
    },
    modalMessage: {
      fontSize: 15,
      textAlign: "center",
      lineHeight: 22,
      marginBottom: 28,
    },
    modalButtons: { flexDirection: "row", gap: 12, width: "100%" },
    modalButton: { flex: 1, borderRadius: 16, overflow: "hidden" },
    modalButtonGlass: {
      borderWidth: 1,
      paddingVertical: 14,
      alignItems: "center",
    },
    modalButtonText: { fontSize: 16, fontWeight: "700" },
  });
}
