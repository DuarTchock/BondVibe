const fs = require('fs');
const path = 'src/screens/EventDetailScreen.js';
let lines = fs.readFileSync(path, 'utf8').split('\n');

// Línea 1008 (índice 1007)
lines[1007] = '                    <AvatarDisplay avatar={attendee.avatar || { type: "emoji", value: attendee.emoji || "😊" }} size={36} />';

fs.writeFileSync(path, lines.join('\n'));
console.log('✅ Fixed line 1008');
