const fs = require('fs');

// ============================================
// 1. AGREGAR DROPDOWN EN EditEventScreen
// ============================================
const editPath = 'src/screens/EditEventScreen.js';
let editContent = fs.readFileSync(editPath, 'utf8');

if (!editContent.includes('Language Dropdown')) {
  // Buscar el dropdown de categoría y agregar el de idioma después
  editContent = editContent.replace(
    /(<SelectDropdown\s+label="Category[^>]*>[\s\S]*?<\/SelectDropdown>|<SelectDropdown[^>]*label="Category[^>]*\/>)/,
    `$1

        {/* Language Dropdown */}
        <SelectDropdown
          label="Language"
          value={language}
          onValueChange={setLanguage}
          options={EVENT_LANGUAGES}
          placeholder="Select language"
          type="language"
        />`
  );
  
  fs.writeFileSync(editPath, editContent);
  console.log('✅ Added language dropdown to EditEventScreen');
}

// ============================================
// 2. AGREGAR UI DE FILTROS EN SearchEventsScreen
// ============================================
const searchPath = 'src/screens/SearchEventsScreen.js';
let searchContent = fs.readFileSync(searchPath, 'utf8');

if (!searchContent.includes('priceFilter') || !searchContent.includes('Price Filter UI')) {
  // Agregar los botones de filtro después de las categorías
  const filterUI = `
        {/* Price & Language Filters */}
        <View style={styles.filtersRow}>
          <View style={styles.filterGroup}>
            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Price</Text>
            <View style={styles.filterButtons}>
              {[
                { id: "all", label: "All" },
                { id: "free", label: "Free" },
                { id: "paid", label: "Paid" },
              ].map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.filterButton,
                    {
                      backgroundColor: priceFilter === option.id
                        ? colors.primary
                        : (isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.85)"),
                      borderColor: priceFilter === option.id
                        ? colors.primary
                        : (isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)"),
                    },
                  ]}
                  onPress={() => setPriceFilter(option.id)}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      { color: priceFilter === option.id ? "#FFFFFF" : colors.text },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.filterGroup}>
            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Language</Text>
            <View style={styles.filterButtons}>
              {[
                { id: "all", label: "All" },
                { id: "es", label: "🇲🇽" },
                { id: "en", label: "🇺🇸" },
              ].map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.filterButton,
                    {
                      backgroundColor: languageFilter === option.id
                        ? colors.primary
                        : (isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.85)"),
                      borderColor: languageFilter === option.id
                        ? colors.primary
                        : (isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)"),
                    },
                  ]}
                  onPress={() => setLanguageFilter(option.id)}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      { color: languageFilter === option.id ? "#FFFFFF" : colors.text },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>`;

  // Buscar donde termina el ScrollView de categorías
  searchContent = searchContent.replace(
    /(<\/ScrollView>\s*<\/View>\s*)({\s*\/\*\s*Events List|<FlatList|<ScrollView(?!.*Categories))/,
    `</ScrollView>
        ${filterUI}
      </View>

      $2`
  );
  
  // Agregar estilos para los filtros
  if (!searchContent.includes('filtersRow')) {
    searchContent = searchContent.replace(
      /(\s*}\);?\s*}\s*$)/,
      `
    filtersRow: {
      flexDirection: "row",
      paddingHorizontal: 24,
      marginBottom: 16,
      gap: 16,
    },
    filterGroup: {
      flex: 1,
    },
    filterLabel: {
      fontSize: 12,
      fontWeight: "600",
      marginBottom: 8,
    },
    filterButtons: {
      flexDirection: "row",
      gap: 8,
    },
    filterButton: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
    },
    filterButtonText: {
      fontSize: 13,
      fontWeight: "600",
    },
$1`
    );
  }
  
  fs.writeFileSync(searchPath, searchContent);
  console.log('✅ Added filter UI to SearchEventsScreen');
}

console.log('\n🎉 Language UI complete!');
