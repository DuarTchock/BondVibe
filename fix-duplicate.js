const fs = require('fs');
const path = 'src/screens/EventDetailScreen.js';
let content = fs.readFileSync(path, 'utf8');

// Reemplazar la línea duplicada
content = content.replace(
  /<AvatarDisplay avatar={attendee\.avatar \|\| attendee\.emoji \|\| "😊"} size={36} \/><AvatarDisplay avatar={attendee\.avatar \|\| { type: "emoji", value: attendee\.emoji \|\| "😊" }} size={36} \/>/g,
  '<AvatarDisplay avatar={attendee.avatar || { type: "emoji", value: attendee.emoji || "😊" }} size={36} />'
);

fs.writeFileSync(path, content);
console.log('✅ Fixed duplicate AvatarDisplay');
