const fs = require('fs');

const screens = [
  'AdminDashboardScreen',
  'ChatScreen', 
  'EditEventScreen',
  'EmailVerificationScreen',
  'EventChatScreen',
  'EventDetailScreen',
  'ProfileSetupScreen',
  'RequestHostScreen',
  'StripeConnectScreen'
];

screens.forEach(screen => {
  const file = `src/screens/${screen}.js`;
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Agregar import si no existe
    if (!content.includes('GradientBackground')) {
      content = content.replace(
        /from "react-native";/,
        'from "react-native";\nimport GradientBackground from "../components/GradientBackground";'
      );
    }
    
    // Reemplazar View con backgroundColor por GradientBackground
    content = content.replace(
      /<View style={\[styles\.container, \{ backgroundColor: colors\.background \}\]}>/g,
      '<GradientBackground>'
    );
    
    fs.writeFileSync(file, content);
    console.log(`✅ Updated ${screen}`);
  }
});

console.log('\n⚠️  Ahora revisa el </View> final de cada archivo manualmente');
