const fs = require('fs');

const navPath = 'src/navigation/AppNavigator.js';
let content = fs.readFileSync(navPath, 'utf8');

// Revertir el cambio anterior y usar una solución más simple
// Simplemente usar un timeout para verificar el flag
content = content.replace(
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
            }`,
  `} else {
              // Check if account is being intentionally deleted
              AsyncStorage.getItem("@account_deleting").then((isDeletingAccount) => {
                if (isDeletingAccount === "true") {
                  console.log("🗑️ Account deletion completed, skipping modal");
                  AsyncStorage.removeItem("@account_deleting");
                } else {
                  console.log(
                    "❌ User doc does not exist - showing modal and signing out"
                  );
                  setShowUserNotFoundModal(true);
                }
              });
              setInitialRoute("Login");
              setInitialUser(null);
              auth.signOut();
            }`
);

fs.writeFileSync(navPath, content);
console.log('✅ Fixed async issue');
