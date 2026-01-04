const fs = require('fs');

// ============================================
// 1. CREAR CONSTANTES DE IDIOMAS
// ============================================
const languageConstants = `// Event language options
export const EVENT_LANGUAGES = [
  { id: "es", label: "🇲🇽 Español", icon: "🇲🇽" },
  { id: "en", label: "🇺🇸 English", icon: "🇺🇸" },
  { id: "both", label: "🌎 Bilingual", icon: "🌎" },
];
`;

// Agregar a eventCategories.js
const categoriesPath = 'src/utils/eventCategories.js';
let categoriesContent = fs.readFileSync(categoriesPath, 'utf8');
if (!categoriesContent.includes('EVENT_LANGUAGES')) {
  categoriesContent += '\n' + languageConstants;
  fs.writeFileSync(categoriesPath, categoriesContent);
  console.log('✅ Added EVENT_LANGUAGES to eventCategories.js');
}

// ============================================
// 2. ACTUALIZAR CreateEventScreen
// ============================================
const createPath = 'src/screens/CreateEventScreen.js';
let createContent = fs.readFileSync(createPath, 'utf8');

// Agregar import de EVENT_LANGUAGES
if (!createContent.includes('EVENT_LANGUAGES')) {
  createContent = createContent.replace(
    'import { EVENT_CATEGORIES }',
    'import { EVENT_CATEGORIES, EVENT_LANGUAGES }'
  );
  
  // Agregar estado para language después de selectedCategory
  createContent = createContent.replace(
    'const [selectedCategory, setSelectedCategory] = useState("social");',
    `const [selectedCategory, setSelectedCategory] = useState("social");
  const [selectedLanguage, setSelectedLanguage] = useState("both");`
  );
  
  // Agregar language al objeto del evento (después de category)
  createContent = createContent.replace(
    'category: selectedCategory,',
    `category: selectedCategory,
        language: selectedLanguage,`
  );
  
  // Agregar dropdown de idioma después del de categoría
  createContent = createContent.replace(
    `{/* City Dropdown */}
        <SelectDropdown
          label="City *"`,
    `{/* Language Dropdown */}
        <SelectDropdown
          label="Language"
          value={selectedLanguage}
          onValueChange={setSelectedLanguage}
          options={EVENT_LANGUAGES}
          placeholder="Select language"
          type="language"
        />

        {/* City Dropdown */}
        <SelectDropdown
          label="City *"`
  );
  
  fs.writeFileSync(createPath, createContent);
  console.log('✅ Updated CreateEventScreen.js');
}

// ============================================
// 3. ACTUALIZAR EditEventScreen
// ============================================
const editPath = 'src/screens/EditEventScreen.js';
let editContent = fs.readFileSync(editPath, 'utf8');

if (!editContent.includes('EVENT_LANGUAGES')) {
  // Agregar import
  editContent = editContent.replace(
    'import { EVENT_CATEGORIES }',
    'import { EVENT_CATEGORIES, EVENT_LANGUAGES }'
  );
  
  // Agregar estado para language
  editContent = editContent.replace(
    /const \[category, setCategory\] = useState\(""\);/,
    `const [category, setCategory] = useState("");
  const [language, setLanguage] = useState("both");`
  );
  
  // Cargar language del evento existente
  editContent = editContent.replace(
    /setCategory\(eventData\.category \|\| "social"\);/,
    `setCategory(eventData.category || "social");
        setLanguage(eventData.language || "both");`
  );
  
  // Guardar language en el update
  editContent = editContent.replace(
    /category: category,/,
    `category: category,
        language: language,`
  );
  
  fs.writeFileSync(editPath, editContent);
  console.log('✅ Updated EditEventScreen.js');
}

console.log('\n🎉 Language feature base added!');
console.log('Next: Add language badge to EventDetailScreen and event cards');
