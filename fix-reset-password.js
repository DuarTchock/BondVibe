const fs = require('fs');

const loginPath = 'src/screens/LoginScreen.js';
let content = fs.readFileSync(loginPath, 'utf8');

// 1. Agregar función handleResetPassword después de handleSignupClick
content = content.replace(
  `const handleSignupClick = () => {
    console.log("✅ Sign Up clicked - navigating");
    setErrorModal({ ...errorModal, visible: false });
    setTimeout(() => navigation.navigate("Signup"), 100);
  };
  const handleSimpleModalClose`,
  `const handleSignupClick = () => {
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
  };

  const handleSimpleModalClose`
);

// 2. Agregar "Forgot Password?" link después del botón Login
// Buscar el patrón actual
content = content.replace(
  /<TouchableOpacity\s+style={styles\.signupLink}\s+onPress={\(\) => navigation\.navigate\("Signup"\)}\s*>/,
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

// 3. Agregar orText style si no existe
if (!content.includes('orText:')) {
  content = content.replace(
    'forgotPasswordText: { fontSize: 14, fontWeight: "600" },',
    `forgotPasswordText: { fontSize: 14, fontWeight: "600" },
    orText: { textAlign: "center", fontSize: 14, marginVertical: 12 },`
  );
}

fs.writeFileSync(loginPath, content);
console.log('✅ Added handleResetPassword function and Forgot Password link');
