const fs = require('fs');

const editPath = 'src/screens/EditEventScreen.js';
let content = fs.readFileSync(editPath, 'utf8');

// Verificar que tenemos el import de EVENT_LANGUAGES
if (!content.includes('EVENT_LANGUAGES')) {
  content = content.replace(
    /import \{ EVENT_CATEGORIES \}/,
    'import { EVENT_CATEGORIES, EVENT_LANGUAGES }'
  );
  console.log('✅ Added EVENT_LANGUAGES import');
}

// Agregar language al estado inicial del form si no existe
if (!content.includes('language:') || content.match(/language:/g).length < 2) {
  content = content.replace(
    /category: "Social",/,
    `category: "Social",
    language: "both",`
  );
  console.log('✅ Added language to initial form state');
}

// Agregar carga de language desde el evento
if (!content.includes('language: data.language')) {
  content = content.replace(
    /category: data\.category \|\| "Social",/,
    `category: data.category || "Social",
          language: data.language || "both",`
  );
  console.log('✅ Added language loading from event');
}

// Agregar language al guardar si no existe
if (!content.includes('language: form.language')) {
  content = content.replace(
    /category: form\.category,/,
    `category: form.category,
        language: form.language,`
  );
  console.log('✅ Added language to save');
}

// Agregar UI de Language después de Category
if (!content.includes('{/* Language */}')) {
  content = content.replace(
    /({\s*\/\*\s*Category\s*\*\/}[\s\S]*?<\/ScrollView>\s*<\/View>)/,
    `$1

        {/* Language */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>Language</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {EVENT_LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.id}
                style={styles.categoryChip}
                onPress={() => setForm({ ...form, language: lang.id })}
              >
                <View
                  style={[
                    styles.categoryChipGlass,
                    {
                      backgroundColor:
                        form.language === lang.id
                          ? \`\${colors.primary}33\`
                          : colors.surfaceGlass,
                      borderColor:
                        form.language === lang.id
                          ? colors.primary
                          : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      {
                        color:
                          form.language === lang.id
                            ? colors.primary
                            : colors.text,
                      },
                    ]}
                  >
                    {lang.label}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>`
  );
  console.log('✅ Added language UI to EditEventScreen');
}

fs.writeFileSync(editPath, content);
console.log('✅ EditEventScreen complete');
