const fs = require('fs');

const editPath = 'src/screens/EditEventScreen.js';
let content = fs.readFileSync(editPath, 'utf8');

// 1. Agregar import de EVENT_LANGUAGES
if (!content.includes('EVENT_LANGUAGES')) {
  content = content.replace(
    /import \{ EVENT_CATEGORIES \}/,
    'import { EVENT_CATEGORIES, EVENT_LANGUAGES }'
  );
  console.log('✅ Added EVENT_LANGUAGES import');
}

// 2. Agregar estado para language
if (!content.includes('const [language, setLanguage]')) {
  content = content.replace(
    /const \[category, setCategory\] = useState\(""\);/,
    `const [category, setCategory] = useState("");
  const [language, setLanguage] = useState("both");`
  );
  console.log('✅ Added language state');
}

// 3. Cargar language del evento existente (buscar donde se carga category)
if (!content.includes('setLanguage(eventData.language')) {
  content = content.replace(
    /setCategory\(eventData\.category \|\| "social"\);/,
    `setCategory(eventData.category || "social");
        setLanguage(eventData.language || "both");`
  );
  console.log('✅ Added language loading');
}

// 4. Guardar language en el update
if (!content.includes('language: language,') && !content.includes('language,')) {
  content = content.replace(
    /category: category,/,
    `category: category,
        language: language,`
  );
  console.log('✅ Added language to save');
}

fs.writeFileSync(editPath, content);
console.log('✅ EditEventScreen updated');
