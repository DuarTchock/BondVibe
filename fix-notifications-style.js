const fs = require('fs');
const path = 'src/screens/NotificationsScreen.js';
let content = fs.readFileSync(path, 'utf8');

// Agregar borderRadius a notificationGlass
content = content.replace(
  'notificationGlass: { borderWidth: 1, padding: 16, flexDirection: "row" },',
  'notificationGlass: { borderWidth: 1, padding: 16, flexDirection: "row", borderRadius: 16 },'
);

fs.writeFileSync(path, content);
console.log('✅ Fixed notification card style');
