const fs = require('fs');

const files = [
  'AdminDashboardScreen',
  'ConversationsScreen', 
  'CreateEventScreen',
  'EditEventScreen',
  'EmailVerificationScreen',
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
  
  // Buscar el patrón: </View> seguido de ); y } que indica fin del return
  // Reemplazar el último </View> antes de ); del return principal
  
  // Estrategia: buscar </View>\n  );\n} o </View>\n);\n}
  content = content.replace(
    /(<\/View>)(\s*\);\s*\}\s*function createStyles)/,
    '</GradientBackground>$2'
  );
  
  // Alternativa si no tiene createStyles
  content = content.replace(
    /(<\/View>)(\s*\);\s*\}\s*const styles)/,
    '</GradientBackground>$2'
  );
  
  // Otra alternativa común
  content = content.replace(
    /(<\/View>)(\s*\);\s*\}\s*$)/m,
    '</GradientBackground>$2'
  );
  
  fs.writeFileSync(path, content);
  
  // Verificar
  const updated = fs.readFileSync(path, 'utf8');
  const closes = (updated.match(/<\/GradientBackground>/g) || []).length;
  console.log(`${name}: closes=${closes}`);
});
