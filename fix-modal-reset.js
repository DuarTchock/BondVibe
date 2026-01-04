const fs = require('fs');

const loginPath = 'src/screens/LoginScreen.js';
let content = fs.readFileSync(loginPath, 'utf8');

// 1. Agregar función handleResetPassword después de handleSignupClick
if (!content.includes('handleResetPassword')) {
  content = content.replace(
    `const handleSimpleModalClose = () => {`,
    `const handleResetPassword = async () => {
    console.log("🔑 Reset Password clicked");
    setErrorModal({ ...errorModal, visible: false });
    
    if (!email.trim()) {
      setErrorModal({
        visible: true,
        title: "Email Required",
        message: "Please enter your email address first, then try again.",
        showSignup: false,
      });
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email.trim());
      setErrorModal({
        visible: true,
        title: "Reset Email Sent",
        message: "Check your inbox for a link to reset your password. Don't forget to check your spam folder.",
        showSignup: false,
      });
    } catch (error) {
      console.error("Reset password error:", error);
      if (error.code === "auth/user-not-found") {
        setErrorModal({
          visible: true,
          title: "Email Not Found",
          message: "No account exists with this email address.",
          showSignup: false,
        });
      } else {
        setErrorModal({
          visible: true,
          title: "Error",
          message: "Failed to send reset email. Please try again.",
          showSignup: false,
        });
      }
    }
  };

  const handleSimpleModalClose = () => {`
  );
  console.log('✅ Added handleResetPassword function');
}

// 2. Reemplazar el modal completo con la versión de 3 botones
const oldModal = `<View style={styles.modalButtons}>
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
                          backgroundColor: \`\${colors.primary}33\`,
                          borderColor: \`\${colors.primary}66\`,
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
                </View>`;

const newModal = `<View style={styles.modalButtonsColumn}>
                  <TouchableOpacity
                    style={styles.modalFullButton}
                    onPress={handleSignupClick}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.modalButtonGlass,
                        {
                          backgroundColor: \`\${colors.primary}33\`,
                          borderColor: \`\${colors.primary}66\`,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.modalButtonText,
                          { color: colors.primary },
                        ]}
                      >
                        Create Account
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalFullButton}
                    onPress={handleResetPassword}
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
                        Reset Password
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalFullButton}
                    onPress={handleCancel}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[styles.modalLinkText, { color: colors.textSecondary }]}
                    >
                      Cancel
                    </Text>
                  </TouchableOpacity>
                </View>`;

content = content.replace(oldModal, newModal);
console.log('✅ Updated modal with 3 buttons');

fs.writeFileSync(loginPath, content);
console.log('✅ LoginScreen updated');
