const fs = require('fs');

// Leer los archivos de términos y privacy
const termsContent = fs.readFileSync('assets/legal/terms.md', 'utf8');
const privacyContent = fs.readFileSync('assets/legal/privacy.md', 'utf8');

// Crear archivo con las constantes exportadas
const legalConstantsFile = `// Auto-generated from assets/legal/*.md
// DO NOT EDIT - Edit the .md files instead

export const TERMS_OF_SERVICE = \`${termsContent.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;

export const PRIVACY_POLICY = \`${privacyContent.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;
`;

fs.writeFileSync('src/utils/legalContent.js', legalConstantsFile);
console.log('✅ Created src/utils/legalContent.js');

// Actualizar LegalScreen para importar desde legalContent.js
const legalPath = 'src/screens/LegalScreen.js';
let legalContent = fs.readFileSync(legalPath, 'utf8');

// Quitar imports de .md que no funcionan
legalContent = legalContent.replace(
  `import TERMS_OF_SERVICE from "../../assets/legal/terms.md";
import PRIVACY_POLICY from "../../assets/legal/privacy.md";`,
  `import { TERMS_OF_SERVICE, PRIVACY_POLICY } from "../utils/legalContent";`
);

fs.writeFileSync(legalPath, legalContent);
console.log('✅ Updated LegalScreen imports');
