const fs = require('fs');

const navPath = 'src/navigation/AppNavigator.js';
let content = fs.readFileSync(navPath, 'utf8');

// Agregar un flag para saber si el usuario está siendo eliminado
// Buscar los estados y agregar uno nuevo
content = content.replace(
  'const [showUserNotFoundModal, setShowUserNotFoundModal] = useState(false);',
  `const [showUserNotFoundModal, setShowUserNotFoundModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);`
);

// Modificar la condición para no mostrar el modal si isDeleting es true
content = content.replace(
  `} else {
              console.log(
                "❌ User doc does not exist - showing modal and signing out"
              );
              setShowUserNotFoundModal(true);
              setInitialRoute("Login");
              setInitialUser(null);
              auth.signOut();
            }`,
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
            }`
);

// Exportar setIsDeleting para usarlo en ProfileScreen
// Primero, veamos si ya hay un contexto o necesitamos otra solución

fs.writeFileSync(navPath, content);
console.log('✅ Fixed delete account flow');
