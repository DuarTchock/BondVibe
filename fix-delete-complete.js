const fs = require('fs');

// 1. Actualizar ProfileScreen para setear un flag antes de eliminar
const profilePath = 'src/screens/ProfileScreen.js';
let profileContent = fs.readFileSync(profilePath, 'utf8');

// Agregar import de AsyncStorage si no existe
if (!profileContent.includes("import AsyncStorage")) {
  profileContent = profileContent.replace(
    'import { StatusBar } from "expo-status-bar";',
    `import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";`
  );
}

// Agregar el flag antes de eliminar
profileContent = profileContent.replace(
  `const performDeleteAccount = async () => {
    setDeleting(true);
    try {
      const userId = auth.currentUser.uid;`,
  `const performDeleteAccount = async () => {
    setDeleting(true);
    try {
      // Set flag to prevent "user not found" modal
      await AsyncStorage.setItem("@account_deleting", "true");
      const userId = auth.currentUser.uid;`
);

fs.writeFileSync(profilePath, profileContent);
console.log('✅ Updated ProfileScreen');

// 2. Actualizar AppNavigator para verificar el flag
const navPath = 'src/navigation/AppNavigator.js';
let navContent = fs.readFileSync(navPath, 'utf8');

// Modificar la lógica cuando el doc no existe
navContent = navContent.replace(
  `} else {
              // Only show modal if not intentionally deleting account
              if (!isDeleting) {
                console.log(
                  "❌ User doc does not exist - showing modal and signing out"
                );
                setShowUserNotFoundModal(true);
              } else {
                console.log("🗑️ Account deletion in progress, skipping modal");
                setIsDeleting(false);
              }
              setInitialRoute("Login");
              setInitialUser(null);
              auth.signOut();
            }`,
  `} else {
              // Check if account is being intentionally deleted
              const isDeletingAccount = await AsyncStorage.getItem("@account_deleting");
              if (isDeletingAccount === "true") {
                console.log("🗑️ Account deletion completed, skipping modal");
                await AsyncStorage.removeItem("@account_deleting");
              } else {
                console.log(
                  "❌ User doc does not exist - showing modal and signing out"
                );
                setShowUserNotFoundModal(true);
              }
              setInitialRoute("Login");
              setInitialUser(null);
              auth.signOut();
            }`
);

// Quitar el isDeleting state que ya no necesitamos
navContent = navContent.replace(
  `const [showUserNotFoundModal, setShowUserNotFoundModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);`,
  `const [showUserNotFoundModal, setShowUserNotFoundModal] = useState(false);`
);

fs.writeFileSync(navPath, navContent);
console.log('✅ Updated AppNavigator');
