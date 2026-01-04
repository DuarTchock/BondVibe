const fs = require('fs');

const files = [
  'AdminDashboardScreen',
  'ConversationsScreen',
  'CreateEventScreen',
  'EditEventScreen',
  'EmailVerificationScreen',
  'EventDetailScreen',
  'HostTypeSelectionScreen',
  'LegalScreen',
  'LoginScreen',
  'MyEventsScreen',
  'NotificationsScreen',
  'PersonalityQuizScreen',
  'PersonalityResultsScreen',
  'PersonalityTestScreen',
  'SearchEventsScreen',
  'SignupScreen',
  'StripeConnectScreen',
  'WelcomeScreen'
];

files.forEach(name => {
  const path = `src/screens/${name}.js`;
  let content = fs.readFileSync(path, 'utf8');
  
  if (!content.includes('import GradientBackground')) {
    // Agregar después del último import de react-native o después de useTheme
    content = content.replace(
      /(import.*from ["']\.\.\/contexts\/ThemeContext["'];?)/,
      '$1\nimport GradientBackground from "../components/GradientBackground";'
    );
    
    // Si no encontró ThemeContext, buscar react-native
    if (!content.includes('import GradientBackground')) {
      content = content.replace(
        /(import[^;]+from ["']react-native["'];)/,
        '$1\nimport GradientBackground from "../components/GradientBackground";'
      );
    }
    
    fs.writeFileSync(path, content);
    console.log(`✅ Added import to ${name}`);
  } else {
    console.log(`⏭️  ${name} already has import`);
  }
});
