const fs = require('fs');

const searchPath = 'src/screens/SearchEventsScreen.js';
let content = fs.readFileSync(searchPath, 'utf8');

// Insertar filtros entre Category Filter y Results Header
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

content = content.replace(
  /(\{\/\* Category Filter \*\/[\s\S]*?type="category"\s*\/>)\s*(\{\/\* Results Header \*\/)/,
  `$1
${filterUI}
        $2`
);

fs.writeFileSync(searchPath, content);
console.log('✅ Filter UI added');
