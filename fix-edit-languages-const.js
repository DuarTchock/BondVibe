const fs = require('fs');

const editPath = 'src/screens/EditEventScreen.js';
let content = fs.readFileSync(editPath, 'utf8');

// Agregar EVENT_LANGUAGES como constante local después de CATEGORIES
if (!content.includes('const EVENT_LANGUAGES')) {
  content = content.replace(
    /const CATEGORIES = \[\s*"Social",/,
    `const CATEGORIES = [
  "Social",`
  );
  
  // Buscar el cierre del array CATEGORIES y agregar EVENT_LANGUAGES después
  content = content.replace(
    /(const CATEGORIES = \[[\s\S]*?\];)/,
    `$1

const EVENT_LANGUAGES = [
  { id: "es", label: "🇲🇽 Español" },
  { id: "en", label: "🇺🇸 English" },
  { id: "both", label: "�� Bilingual" },
];`
  );
  
  console.log('✅ Added EVENT_LANGUAGES constant');
}

fs.writeFileSync(editPath, content);
console.log('✅ EditEventScreen fixed');
