const fs = require('fs');

const path = 'functions/index.js';
let content = fs.readFileSync(path, 'utf8');

// Eliminar trailing spaces
content = content.replace(/[ \t]+$/gm, '');

// Remover variable no usada joinedEventsSnapshot
content = content.replace(
  /\/\/ 2\. Remove user from events they joined[\s\S]*?\/\/ Note: This query might not work perfectly with mixed array types\s*\n\s*\/\/ We'll also do a broader cleanup\s*\n/,
  ''
);

// Agregar trailing comma después de {userId: userId}
content = content.replace(
  '{userId: userId}',
  '{userId: userId},'
);

fs.writeFileSync(path, content);
console.log('✅ Fixed ESLint errors');
