const fs = require('fs');

// ============ LOGIN SCREEN ============
const loginPath = 'src/screens/LoginScreen.js';
let loginContent = fs.readFileSync(loginPath, 'utf8');

// Agregar import de Eye y EyeOff
if (!loginContent.includes('Eye,')) {
  loginContent = loginContent.replace(
    'import BondVibeLogo from "../components/BondVibeLogo";',
    `import BondVibeLogo from "../components/BondVibeLogo";
import { Eye, EyeOff } from "lucide-react-native";`
  );
}

// Agregar estado para mostrar/ocultar contraseña
loginContent = loginContent.replace(
  'const [loading, setLoading] = useState(false);',
  `const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);`
);

// Modificar el campo de contraseña para incluir el toggle
loginContent = loginContent.replace(
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
                  placeholder="Password"
                  placeholderTextColor={colors.textTertiary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
              </View>`,
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
                  placeholder="Password"
                  placeholderTextColor={colors.textTertiary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  {showPassword ? (
                    <EyeOff size={20} color={colors.textTertiary} />
                  ) : (
                    <Eye size={20} color={colors.textTertiary} />
                  )}
                </TouchableOpacity>
              </View>`
);

// Agregar estilo para eyeButton
loginContent = loginContent.replace(
  'inputIcon: { fontSize: 20, marginRight: 12 },',
  `inputIcon: { fontSize: 20, marginRight: 12 },
    eyeButton: { padding: 8, marginLeft: 4 },`
);

fs.writeFileSync(loginPath, loginContent);
console.log('✅ Updated LoginScreen with password toggle');

// ============ SIGNUP SCREEN ============
const signupPath = 'src/screens/SignupScreen.js';
let signupContent = fs.readFileSync(signupPath, 'utf8');

// Agregar import de Eye y EyeOff
if (!signupContent.includes('Eye,')) {
  signupContent = signupContent.replace(
    'import BondVibeLogo from "../components/BondVibeLogo";',
    `import BondVibeLogo from "../components/BondVibeLogo";
import { Eye, EyeOff } from "lucide-react-native";`
  );
}

// Agregar estados para mostrar/ocultar contraseñas
signupContent = signupContent.replace(
  'const [showSuccess, setShowSuccess] = useState(false);',
  `const [showSuccess, setShowSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);`
);

// Modificar el campo de contraseña
signupContent = signupContent.replace(
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
                  placeholder="Create a password"
                  placeholderTextColor={colors.textTertiary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  returnKeyType="next"
                />
              </View>`,
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
                  placeholder="Create a password"
                  placeholderTextColor={colors.textTertiary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  returnKeyType="next"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  {showPassword ? (
                    <EyeOff size={20} color={colors.textTertiary} />
                  ) : (
                    <Eye size={20} color={colors.textTertiary} />
                  )}
                </TouchableOpacity>
              </View>`
);

// Modificar el campo de confirmar contraseña
signupContent = signupContent.replace(
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
                  placeholder="Confirm Password"
                  placeholderTextColor={colors.textTertiary}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  returnKeyType="done"
                  onSubmitEditing={handleSignup}
                />
              </View>`,
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
                  placeholder="Confirm Password"
                  placeholderTextColor={colors.textTertiary}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleSignup}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeButton}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} color={colors.textTertiary} />
                  ) : (
                    <Eye size={20} color={colors.textTertiary} />
                  )}
                </TouchableOpacity>
              </View>`
);

// Agregar estilo para eyeButton
signupContent = signupContent.replace(
  'inputIcon: { fontSize: 20, marginRight: 12 },',
  `inputIcon: { fontSize: 20, marginRight: 12 },
    eyeButton: { padding: 8, marginLeft: 4 },`
);

fs.writeFileSync(signupPath, signupContent);
console.log('✅ Updated SignupScreen with password toggle');
