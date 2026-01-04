const fs = require('fs');
const path = 'src/screens/EventDetailScreen.js';
let content = fs.readFileSync(path, 'utf8');

// 1. Agregar borderRadius a infoGlass
content = content.replace(
  `infoGlass: {
      borderWidth: 1,
      padding: 16,
      flexDirection: "row",
      alignItems: "center",
    },`,
  `infoGlass: {
      borderWidth: 1,
      padding: 16,
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 16,
    },`
);

// 2. Actualizar los colores de las info cards (hay 3)
content = content.replace(
  /backgroundColor: colors\.surfaceGlass,\s*borderColor: colors\.border,/g,
  `backgroundColor: isDark ? "rgba(255, 255, 255, 0.04)" : "rgba(255, 255, 255, 0.85)",
                  borderColor: isDark ? "rgba(255, 255, 255, 0.10)" : "rgba(0, 0, 0, 0.08)",`
);

fs.writeFileSync(path, content);
console.log('✅ Fixed EventDetailScreen card styles');
