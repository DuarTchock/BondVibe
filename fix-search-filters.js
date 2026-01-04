const fs = require('fs');

const searchPath = 'src/screens/SearchEventsScreen.js';
let content = fs.readFileSync(searchPath, 'utf8');

// 1. Agregar estados para filtros
if (!content.includes('priceFilter')) {
  content = content.replace(
    'const [selectedLocation, setSelectedLocation] = useState("all");',
    `const [selectedLocation, setSelectedLocation] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [languageFilter, setLanguageFilter] = useState("all");`
  );
  console.log('✅ Added filter states');
}

// 2. Agregar filtros a las dependencias del useEffect
if (!content.includes('priceFilter, languageFilter')) {
  content = content.replace(
    '}, [searchQuery, selectedCategory, selectedLocation, events]);',
    '}, [searchQuery, selectedCategory, selectedLocation, priceFilter, languageFilter, events]);'
  );
  console.log('✅ Added filter dependencies');
}

// 3. Agregar lógica de filtrado después del filtro de categoría
if (!content.includes('Price filter')) {
  content = content.replace(
    /if \(selectedCategory !== "all"\) \{[\s\S]*?console\.log\(\s*`🏷️ Filtering by category[^`]*`\s*\);?\s*\}/,
    `if (selectedCategory !== "all") {
      filtered = filtered.filter((event) => {
        const normalizedEventCategory = event.category?.toLowerCase().trim();
        return normalizedEventCategory === selectedCategory;
      });
      console.log(
        \`🏷️ Filtering by category: \${selectedCategory}, found: \${filtered.length}\`
      );
    }

    // Price filter
    if (priceFilter === "free") {
      filtered = filtered.filter(e => !e.price || e.price === 0);
      console.log(\`💰 Filtering free events, found: \${filtered.length}\`);
    } else if (priceFilter === "paid") {
      filtered = filtered.filter(e => e.price && e.price > 0);
      console.log(\`💰 Filtering paid events, found: \${filtered.length}\`);
    }

    // Language filter
    if (languageFilter !== "all") {
      filtered = filtered.filter(e => 
        e.language === languageFilter || 
        e.language === "both" || 
        !e.language
      );
      console.log(\`🌐 Filtering by language: \${languageFilter}, found: \${filtered.length}\`);
    }`
  );
  console.log('✅ Added filter logic');
}

fs.writeFileSync(searchPath, content);
console.log('✅ SearchEventsScreen filters logic added');
