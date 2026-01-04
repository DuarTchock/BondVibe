const fs = require('fs');

// ============================================
// 1. AGREGAR BADGE DE IDIOMA EN EventDetailScreen
// ============================================
const detailPath = 'src/screens/EventDetailScreen.js';
let detailContent = fs.readFileSync(detailPath, 'utf8');

if (!detailContent.includes('event.language')) {
  // Agregar badge de idioma después del badge de rating
  detailContent = detailContent.replace(
    /{event\.averageRating > 0 && \(/,
    `{event.language && event.language !== "both" && (
              <View
                style={[
                  styles.languageBadge,
                  { backgroundColor: "rgba(100, 100, 255, 0.15)" },
                ]}
              >
                <Text style={styles.languageBadgeText}>
                  {event.language === "es" ? "🇲🇽 Español" : "🇺🇸 English"}
                </Text>
              </View>
            )}
            {event.language === "both" && (
              <View
                style={[
                  styles.languageBadge,
                  { backgroundColor: "rgba(100, 200, 100, 0.15)" },
                ]}
              >
                <Text style={styles.languageBadgeText}>🌎 Bilingual</Text>
              </View>
            )}
            {event.averageRating > 0 && (`
  );
  
  // Agregar estilos para el badge de idioma
  detailContent = detailContent.replace(
    /ratingBadgeText: \{ fontSize: 12, fontWeight: "700", color: "#FFD700" \},/,
    `ratingBadgeText: { fontSize: 12, fontWeight: "700", color: "#FFD700" },
    languageBadge: {
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: "rgba(100, 100, 255, 0.3)",
    },
    languageBadgeText: { fontSize: 12, fontWeight: "600", color: "#FFFFFF" },`
  );
  
  fs.writeFileSync(detailPath, detailContent);
  console.log('✅ Added language badge to EventDetailScreen');
}

// ============================================
// 2. AGREGAR FILTROS EN SearchEventsScreen
// ============================================
const searchPath = 'src/screens/SearchEventsScreen.js';
let searchContent = fs.readFileSync(searchPath, 'utf8');

if (!searchContent.includes('priceFilter')) {
  // Agregar import de EVENT_LANGUAGES si no existe
  if (!searchContent.includes('EVENT_LANGUAGES')) {
    searchContent = searchContent.replace(
      'import { EVENT_CATEGORIES }',
      'import { EVENT_CATEGORIES, EVENT_LANGUAGES }'
    );
  }
  
  // Agregar estados para filtros después de otros estados
  searchContent = searchContent.replace(
    /const \[selectedCategory, setSelectedCategory\] = useState\("all"\);/,
    `const [selectedCategory, setSelectedCategory] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all"); // all, free, paid
  const [languageFilter, setLanguageFilter] = useState("all"); // all, es, en, both`
  );
  
  // Actualizar la lógica de filtrado
  searchContent = searchContent.replace(
    /let filtered = upcomingEvents;/,
    `let filtered = upcomingEvents;
    
    // Price filter
    if (priceFilter === "free") {
      filtered = filtered.filter(e => !e.price || e.price === 0);
    } else if (priceFilter === "paid") {
      filtered = filtered.filter(e => e.price && e.price > 0);
    }
    
    // Language filter
    if (languageFilter !== "all") {
      filtered = filtered.filter(e => e.language === languageFilter || e.language === "both" || !e.language);
    }`
  );
  
  fs.writeFileSync(searchPath, searchContent);
  console.log('✅ Added filter states to SearchEventsScreen');
}

console.log('\n🎉 Badges and filter states added!');
console.log('Next: Add filter UI to SearchEventsScreen');
