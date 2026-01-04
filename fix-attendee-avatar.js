const fs = require('fs');
const path = 'src/screens/EventDetailScreen.js';
let content = fs.readFileSync(path, 'utf8');

// Agregar import si no existe
if (!content.includes('AvatarDisplay')) {
  content = content.replace(
    /import GradientBackground from "\.\.\/components\/GradientBackground";/,
    'import GradientBackground from "../components/GradientBackground";\nimport { AvatarDisplay } from "../components/AvatarPicker";'
  );
}

// Reemplazar el renderizado del avatar
content = content.replace(
  /<Text style={styles\.attendeeEmoji}>\s*{attendee\.avatar \|\| attendee\.emoji \|\| "😊"}\s*<\/Text>/,
  '<AvatarDisplay avatar={attendee.avatar || { type: "emoji", value: attendee.emoji || "😊" }} size={36} />'
);

fs.writeFileSync(path, content);
console.log('✅ Fixed EventDetailScreen attendee avatar');
