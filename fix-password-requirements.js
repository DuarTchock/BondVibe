const fs = require('fs');

const signupPath = 'src/screens/SignupScreen.js';
let content = fs.readFileSync(signupPath, 'utf8');

// Agregar componente de requisitos de contraseña después del input de password
const passwordRequirementsUI = `
              {/* Password Requirements */}
              <View style={styles.passwordRequirements}>
                <View style={styles.requirementRow}>
                  <Text style={[styles.requirementIcon, { color: password.length >= 8 ? "#34C759" : colors.textTertiary }]}>
                    {password.length >= 8 ? "✓" : "○"}
                  </Text>
                  <Text style={[styles.requirementText, { color: password.length >= 8 ? "#34C759" : colors.textTertiary }]}>
                    At least 8 characters
                  </Text>
                </View>
                <View style={styles.requirementRow}>
                  <Text style={[styles.requirementIcon, { color: /[A-Z]/.test(password) ? "#34C759" : colors.textTertiary }]}>
                    {/[A-Z]/.test(password) ? "✓" : "○"}
                  </Text>
                  <Text style={[styles.requirementText, { color: /[A-Z]/.test(password) ? "#34C759" : colors.textTertiary }]}>
                    One uppercase letter
                  </Text>
                </View>
                <View style={styles.requirementRow}>
                  <Text style={[styles.requirementIcon, { color: /[a-z]/.test(password) ? "#34C759" : colors.textTertiary }]}>
                    {/[a-z]/.test(password) ? "✓" : "○"}
                  </Text>
                  <Text style={[styles.requirementText, { color: /[a-z]/.test(password) ? "#34C759" : colors.textTertiary }]}>
                    One lowercase letter
                  </Text>
                </View>
                <View style={styles.requirementRow}>
                  <Text style={[styles.requirementIcon, { color: /[0-9]/.test(password) ? "#34C759" : colors.textTertiary }]}>
                    {/[0-9]/.test(password) ? "✓" : "○"}
                  </Text>
                  <Text style={[styles.requirementText, { color: /[0-9]/.test(password) ? "#34C759" : colors.textTertiary }]}>
                    One number
                  </Text>
                </View>
                <View style={styles.requirementRow}>
                  <Text style={[styles.requirementIcon, { color: /[!@#$%^&*(),.?":{}|<>]/.test(password) ? "#34C759" : colors.textTertiary }]}>
                    {/[!@#$%^&*(),.?":{}|<>]/.test(password) ? "✓" : "○"}
                  </Text>
                  <Text style={[styles.requirementText, { color: /[!@#$%^&*(),.?":{}|<>]/.test(password) ? "#34C759" : colors.textTertiary }]}>
                    One special character (!@#$%...)
                  </Text>
                </View>
              </View>

              <View`;

// Insertar después del input de password y antes del confirm password
content = content.replace(
  `<View
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
                  placeholder="Confirm Password"`,
  `${passwordRequirementsUI}
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
                  placeholder="Confirm Password"`
);

// Simplificar el placeholder del password
content = content.replace(
  'placeholder="Password (8+ chars, upper, lower, number, symbol)"',
  'placeholder="Create a password"'
);

// Agregar estilos para los requisitos
content = content.replace(
  'loginLink: { alignItems: "center", paddingVertical: 12 },',
  `passwordRequirements: {
      marginBottom: 16,
      paddingHorizontal: 4,
    },
    requirementRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 6,
    },
    requirementIcon: {
      fontSize: 12,
      marginRight: 8,
      width: 16,
    },
    requirementText: {
      fontSize: 12,
    },
    loginLink: { alignItems: "center", paddingVertical: 12 },`
);

fs.writeFileSync(signupPath, content);
console.log('✅ Added visible password requirements');
