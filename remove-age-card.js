const fs = require('fs');

const profilePath = 'src/screens/ProfileScreen.js';
let content = fs.readFileSync(profilePath, 'utf8');

// Eliminar el Age Card del VIEW MODE
const ageCardRegex = /\{\/\* Age Card \*\/\}\s*<View[\s\S]*?<Cake[\s\S]*?<\/View>\s*<\/View>\s*<\/View>/;

content = content.replace(ageCardRegex, '');

fs.writeFileSync(profilePath, content);
console.log('✅ Removed Age Card from ProfileScreen view mode');
