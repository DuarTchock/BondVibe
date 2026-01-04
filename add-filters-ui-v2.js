const fs = require('fs');

const searchPath = 'src/screens/SearchEventsScreen.js';
let content = fs.readFileSync(searchPath, 'utf8');

// Agregar filtros después de Category Filter y antes de Results Header
if (!content.includes('Price & Language Filters')) {
  content = content.replace(
    `{/* Category Filter */}
        <FilterChips
          label="Categories"
          value={selectedCategory}
          onValueChange={handleCategoryChange}
          options={categoryOptions}
          type="category"
        />
        {/* Results Header */}`,
    `{/* Category Filter */}
        <FilterChips
          label="Categories"
          value={selectedCategory}
          onValueChange={handleCategoryChange}
          options={categoryOptions}
          type="category"
        />
        
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
        </View>

        {/* Results Header */}`
  );
  console.log('✅ Added filter UI');
}

// Agregar estilos si no existen
if (!content.includes('filtersRow:')) {
  content = content.replace(
    'emptyState: {',
    `filtersRow: {
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
      gap: 6,
    },
    filterButton: {
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 8,
      borderWidth: 1,
    },
    filterButtonText: {
      fontSize: 12,
      fontWeight: "600",
    },
    emptyState: {`
  );
  console.log('✅ Added filter styles');
}

fs.writeFileSync(searchPath, content);
console.log('✅ SearchEventsScreen complete');
