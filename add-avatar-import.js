const fs = require('fs');
const path = 'src/screens/EventDetailScreen.js';
let content = fs.readFileSync(path, 'utf8');

// Agregar import de AvatarDisplay después de GradientBackground
if (!content.includes('AvatarDisplay')) {
  content = content.replace(
    /import GradientBackground from "\.\.\/components\/GradientBackground";/,
    'import GradientBackground from "../components/GradientBackground";\nimport { AvatarDisplay } from "../components/AvatarPicker";'
  );
  fs.writeFileSync(path, content);
  console.log('✅ Added AvatarDisplay import');
} else {
  console.log('⏭️ AvatarDisplay already imported');
}
