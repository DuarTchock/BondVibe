const fs = require('fs');

// ============================================
// 1. MEJORAR VALIDACIÓN DE CONTRASEÑA EN SignupScreen
// ============================================
const signupPath = 'src/screens/SignupScreen.js';
let signupContent = fs.readFileSync(signupPath, 'utf8');

// Agregar función de validación de contraseña
const passwordValidator = `
  // Validate password strength
  const validatePassword = (pwd) => {
    const errors = [];
    if (pwd.length < 8) errors.push("at least 8 characters");
    if (!/[A-Z]/.test(pwd)) errors.push("one uppercase letter");
    if (!/[a-z]/.test(pwd)) errors.push("one lowercase letter");
    if (!/[0-9]/.test(pwd)) errors.push("one number");
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) errors.push("one special character");
    return errors;
  };

  const handleSignup`;

signupContent = signupContent.replace(
  'const handleSignup',
  passwordValidator
);

// Actualizar validación en handleSignup
signupContent = signupContent.replace(
  `if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }`,
  `const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      Alert.alert(
        "Weak Password",
        "Password must have: " + passwordErrors.join(", ")
      );
      return;
    }`
);

// Actualizar placeholder del input de contraseña
signupContent = signupContent.replace(
  'placeholder="Password (min 6 characters)"',
  'placeholder="Password (8+ chars, upper, lower, number, symbol)"'
);

fs.writeFileSync(signupPath, signupContent);
console.log('✅ Password validation improved in SignupScreen');

// ============================================
// 2. CARGAR TÉRMINOS Y PRIVACY DESDE ARCHIVOS
// ============================================
const legalPath = 'src/screens/LegalScreen.js';
let legalContent = fs.readFileSync(legalPath, 'utf8');

// Reemplazar imports y contenido hardcodeado
legalContent = legalContent.replace(
  `import GradientBackground from "../components/GradientBackground";`,
  `import GradientBackground from "../components/GradientBackground";
import TERMS_OF_SERVICE from "../../assets/legal/terms.md";
import PRIVACY_POLICY from "../../assets/legal/privacy.md";`
);

// Eliminar las constantes TERMS_OF_SERVICE y PRIVACY_POLICY hardcodeadas
legalContent = legalContent.replace(
  /\/\/ Contenido de los documentos legales\nconst TERMS_OF_SERVICE = `[\s\S]*?`;\n\nconst PRIVACY_POLICY = `[\s\S]*?`;/,
  '// Legal documents are imported from assets/legal/'
);

fs.writeFileSync(legalPath, legalContent);
console.log('✅ LegalScreen now imports from files');

// ============================================
// 3. SIMPLIFICAR ProfileSetupScreen - Quitar Age y Bio, agregar checkbox 18+
// ============================================
const profileSetupPath = 'src/screens/ProfileSetupScreen.js';
let profileSetupContent = fs.readFileSync(profileSetupPath, 'utf8');

// Actualizar estado inicial - quitar age y bio, agregar isOver18
profileSetupContent = profileSetupContent.replace(
  `const [form, setForm] = useState({
    fullName: "",
    bio: "",
    avatar: { type: "emoji", value: "😊" },
    age: "",
    location: "",
  });`,
  `const [form, setForm] = useState({
    fullName: "",
    avatar: { type: "emoji", value: "😊" },
    location: "",
  });
  const [isOver18, setIsOver18] = useState(false);`
);

// Actualizar validación - quitar age y bio, agregar isOver18
profileSetupContent = profileSetupContent.replace(
  `// Validate required fields
    if (!form.fullName.trim()) {
      Alert.alert("Required Field", "Please enter your name to continue.");
      return;
    }

    if (!form.age.trim()) {
      Alert.alert("Required Field", "Please enter your age to continue.");
      return;
    }

    const ageNum = parseInt(form.age);
    if (isNaN(ageNum) || ageNum < 18 || ageNum > 99) {
      Alert.alert("Invalid Age", "You must be 18 or older to use BondVibe.");
      return;
    }

    if (!form.location.trim()) {
      Alert.alert("Required Field", "Please enter your location to continue.");
      return;
    }`,
  `// Validate required fields
    if (!form.fullName.trim()) {
      Alert.alert("Required Field", "Please enter your name to continue.");
      return;
    }

    if (!form.location.trim()) {
      Alert.alert("Required Field", "Please enter your location to continue.");
      return;
    }

    if (!isOver18) {
      Alert.alert("Age Requirement", "You must be 18 or older to use BondVibe.");
      return;
    }`
);

// Actualizar lo que se guarda en Firestore - quitar age y bio
profileSetupContent = profileSetupContent.replace(
  `await updateDoc(doc(db, "users", auth.currentUser.uid), {
        fullName: form.fullName.trim(),
        bio: form.bio.trim(),
        avatar: form.avatar,
        age: ageNum,
        location: form.location.trim(),
        profileCompleted: true,
        profileCompletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });`,
  `await updateDoc(doc(db, "users", auth.currentUser.uid), {
        fullName: form.fullName.trim(),
        avatar: form.avatar,
        location: form.location.trim(),
        isOver18: true,
        profileCompleted: true,
        profileCompletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });`
);

// Reemplazar el form completo con la nueva versión simplificada
const newFormSection = `{/* Form Fields */}
        <View style={styles.formSection}>
          {/* Full Name - Required */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Full Name <Text style={{ color: colors.accent }}>*</Text>
            </Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surfaceGlass,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                value={form.fullName}
                onChangeText={(text) => setForm({ ...form, fullName: text })}
                placeholder="Your name"
                placeholderTextColor={colors.textTertiary}
                maxLength={50}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Location - Required */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Location <Text style={{ color: colors.accent }}>*</Text>
            </Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surfaceGlass,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                value={form.location}
                onChangeText={(text) => setForm({ ...form, location: text })}
                placeholder="City, Country"
                placeholderTextColor={colors.textTertiary}
                maxLength={50}
              />
            </View>
          </View>

          {/* Age Confirmation Checkbox */}
          <TouchableOpacity
            style={[
              styles.ageCheckbox,
              {
                backgroundColor: colors.surfaceGlass,
                borderColor: isOver18 ? colors.primary : colors.border,
                borderWidth: isOver18 ? 2 : 1,
              },
            ]}
            onPress={() => setIsOver18(!isOver18)}
            activeOpacity={0.7}
          >
            <View style={styles.checkboxContainer}>
              <View
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: isOver18 ? colors.primary : "transparent",
                    borderColor: isOver18 ? colors.primary : colors.border,
                  },
                ]}
              >
                {isOver18 && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </View>
            <View style={styles.checkboxTextContainer}>
              <Text style={[styles.checkboxTitle, { color: colors.text }]}>
                I confirm I am 18 years or older{" "}
                <Text style={{ color: colors.accent }}>*</Text>
              </Text>
              <Text
                style={[styles.checkboxSubtitle, { color: colors.textSecondary }]}
              >
                BondVibe is only available for adults
              </Text>
            </View>
          </TouchableOpacity>
        </View>`;

// Buscar y reemplazar el form section completo
profileSetupContent = profileSetupContent.replace(
  /{\/* Form Fields \*\/}[\s\S]*?<\/View>\s*<\/View>\s*<\/View>/,
  newFormSection
);

// Agregar estilos para el checkbox de edad
profileSetupContent = profileSetupContent.replace(
  'requiredNote: {',
  `ageCheckbox: {
      borderRadius: 16,
      padding: 16,
      flexDirection: "row",
      alignItems: "flex-start",
    },
    checkboxContainer: {
      marginRight: 14,
      marginTop: 2,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 6,
      borderWidth: 2,
      alignItems: "center",
      justifyContent: "center",
    },
    checkmark: {
      color: "#FFF",
      fontSize: 14,
      fontWeight: "700",
    },
    checkboxTextContainer: {
      flex: 1,
    },
    checkboxTitle: {
      fontSize: 15,
      fontWeight: "600",
      marginBottom: 4,
    },
    checkboxSubtitle: {
      fontSize: 13,
    },
    requiredNote: {`
);

fs.writeFileSync(profileSetupPath, profileSetupContent);
console.log('✅ ProfileSetupScreen simplified - removed Age and Bio, added 18+ checkbox');

console.log('\n🎉 All improvements applied!');
console.log('\nNote: For LegalScreen to work with .md files, you need to configure metro to handle them.');
console.log('Alternative: We can load them as text strings instead.');
