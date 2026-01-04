const fs = require('fs');
const path = 'src/screens/NotificationsScreen.js';
let content = fs.readFileSync(path, 'utf8');

// Actualizar backgroundColor y borderColor para usar isDark
content = content.replace(
  `backgroundColor: notification.read
                  ? colors.surfaceGlass
                  : \`\${colors.primary}0D\``,
  `backgroundColor: notification.read
                  ? (isDark ? "rgba(255, 255, 255, 0.04)" : "rgba(255, 255, 255, 0.85)")
                  : (isDark ? \`\${colors.primary}15\` : \`\${colors.primary}10\`)`
);

content = content.replace(
  `borderColor: notification.read
                  ? colors.border
                  : \`\${colors.primary}4D\``,
  `borderColor: notification.read
                  ? (isDark ? "rgba(255, 255, 255, 0.10)" : "rgba(0, 0, 0, 0.08)")
                  : \`\${colors.primary}4D\``
);

fs.writeFileSync(path, content);
console.log('✅ Fixed notification card colors');
