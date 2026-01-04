const fs = require('fs');

const loginPath = 'src/screens/LoginScreen.js';
let content = fs.readFileSync(loginPath, 'utf8');

// 1. Cambiar el mensaje del modal de error
content = content.replace(
  'Account Not Found',
  'Login Failed'
);

content = content.replace(
  'No account exists with this email or the password is incorrect. Would you like to create an account?',
  'The email or password is incorrect. Would you like to create an account or reset your password?'
);

// 2. Agregar botón "Reset Password" al modal (cambiar de 2 a 3 botones)
content = content.replace(
  `<View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={handleCancel}
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
                    <Text style={[styles.modalCancelText, { color: colors.text }]}>
                      Cancel
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalSignupButton}
                  onPress={handleSignUp}
                >
                  <View
                    style={[
                      styles.modalSignupGlass,
                      {
                        backgroundColor: \`\${colors.primary}33\`,
                        borderColor: \`\${colors.primary}66\`,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.modalSignupText, { color: colors.primary }]}
                    >
                      Sign Up
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>`,
  `<View style={styles.modalButtonsColumn}>
                <TouchableOpacity
                  style={styles.modalFullButton}
                  onPress={handleSignUp}
                >
                  <View
                    style={[
                      styles.modalSignupGlass,
                      {
                        backgroundColor: \`\${colors.primary}33\`,
                        borderColor: \`\${colors.primary}66\`,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.modalSignupText, { color: colors.primary }]}
                    >
                      Create Account
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalFullButton}
                  onPress={handleResetPassword}
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
                    <Text style={[styles.modalCancelText, { color: colors.text }]}>
                      Reset Password
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalFullButton}
                  onPress={handleCancel}
                >
                  <Text style={[styles.modalLinkText, { color: colors.textSecondary }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>`
);

// 3. Agregar import de sendPasswordResetEmail
content = content.replace(
  'import { signInWithEmailAndPassword } from "firebase/auth";',
  'import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";'
);

// 4. Agregar función handleResetPassword después de handleSignUp
content = content.replace(
  `const handleSignUp = () => {
    console.log("✅ Sign Up clicked - navigating");
    setErrorModal({ ...errorModal, visible: false });
    setTimeout(() => navigation.navigate("Signup"), 100);
  };`,
  `const handleSignUp = () => {
    console.log("✅ Sign Up clicked - navigating");
    setErrorModal({ ...errorModal, visible: false });
    setTimeout(() => navigation.navigate("Signup"), 100);
  };

  const handleResetPassword = async () => {
    console.log("🔑 Reset Password clicked");
    setErrorModal({ ...errorModal, visible: false });
    
    if (!email.trim()) {
      Alert.alert("Email Required", "Please enter your email address first.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email.trim());
      Alert.alert(
        "Reset Email Sent",
        "Check your inbox for a link to reset your password. Don't forget to check your spam folder.",
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error("Reset password error:", error);
      if (error.code === "auth/user-not-found") {
        Alert.alert("Email Not Found", "No account exists with this email address.");
      } else {
        Alert.alert("Error", "Failed to send reset email. Please try again.");
      }
    }
  };`
);

// 5. Agregar "Forgot Password?" link debajo del botón de Login
content = content.replace(
  `<TouchableOpacity
              style={styles.signupLink}
              onPress={() => navigation.navigate("Signup")}
            >`,
  `<TouchableOpacity
              style={styles.forgotPassword}
              onPress={handleResetPassword}
            >
              <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>
                Forgot Password?
              </Text>
            </TouchableOpacity>

            <Text style={[styles.orText, { color: colors.textTertiary }]}>or</Text>

            <TouchableOpacity
              style={styles.signupLink}
              onPress={() => navigation.navigate("Signup")}
            >`
);

// 6. Agregar estilos
content = content.replace(
  'modalButtons: { flexDirection: "row", gap: 12, width: "100%" },',
  `modalButtons: { flexDirection: "row", gap: 12, width: "100%" },
    modalButtonsColumn: { width: "100%", gap: 12 },
    modalFullButton: { width: "100%" },
    modalLinkText: { fontSize: 15, fontWeight: "500", textAlign: "center", paddingVertical: 8 },
    forgotPassword: { alignItems: "center", marginTop: 16, marginBottom: 8 },
    forgotPasswordText: { fontSize: 14, fontWeight: "600" },
    orText: { textAlign: "center", fontSize: 14, marginVertical: 12 },`
);

fs.writeFileSync(loginPath, content);
console.log('✅ Added Forgot Password and improved error modal');
