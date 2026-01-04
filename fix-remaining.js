const fs = require('fs');

// Archivos que necesitan exactamente 1 cierre agregado
const needsClose = [
  'AdminDashboardScreen',
  'LoginScreen',
  'SignupScreen'
];

// Archivos que tienen 1 cierre de más (necesitan quitar 1)
const hasExtra = [
  'EditEventScreen',
  'StripeConnectScreen'
];

// Agregar cierre a los que les falta
needsClose.forEach(name => {
  const path = `src/screens/${name}.js`;
  let content = fs.readFileSync(path, 'utf8');
  
  // Buscar el último </View> antes de ); } o ); function
  content = content.replace(
    /<\/View>(\s*\);[\s\n]*\}[\s\n]*(?:function|const|export|$))/,
    '</GradientBackground>$1'
  );
  
  fs.writeFileSync(path, content);
  const closes = (content.match(/<\/GradientBackground>/g) || []).length;
  console.log(`${name}: closes=${closes}`);
});

// Quitar cierre extra de los que tienen de más
hasExtra.forEach(name => {
  const path = `src/screens/${name}.js`;
  let content = fs.readFileSync(path, 'utf8');
  
  // Reemplazar el primer </GradientBackground> con </View>
  content = content.replace('</GradientBackground>', '</View>');
  
  fs.writeFileSync(path, content);
  const closes = (content.match(/<\/GradientBackground>/g) || []).length;
  console.log(`${name}: closes=${closes}`);
});
