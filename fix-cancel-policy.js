const fs = require('fs');

const filePath = 'src/screens/CreateEventScreen.js';
let content = fs.readFileSync(filePath, 'utf8');

// Buscar dónde termina el texto de "processing fees are added at checkout"
const searchText = `processing fees are added at checkout.
            </Text>
          </View>
        )}
        {/* Tips */}`;

const replaceWith = `processing fees are added at checkout.
            </Text>
            
            {/* Refund Policy Disclosure */}
            <View style={[styles.refundPolicyCard, { backgroundColor: \`\${colors.primary}11\`, borderColor: \`\${colors.primary}33\` }]}>
              <Text style={[styles.refundPolicyTitle, { color: colors.text }]}>
                📋 Cancellation Policy for Attendees
              </Text>
              <View style={styles.refundPolicyItem}>
                <Text style={[styles.refundPolicyBullet, { color: colors.primary }]}>•</Text>
                <Text style={[styles.refundPolicyItemText, { color: colors.textSecondary }]}>
                  7+ days before: 100% ticket refund
                </Text>
              </View>
              <View style={styles.refundPolicyItem}>
                <Text style={[styles.refundPolicyBullet, { color: colors.primary }]}>•</Text>
                <Text style={[styles.refundPolicyItemText, { color: colors.textSecondary }]}>
                  3-7 days before: 50% ticket refund
                </Text>
              </View>
              <View style={styles.refundPolicyItem}>
                <Text style={[styles.refundPolicyBullet, { color: colors.primary }]}>•</Text>
                <Text style={[styles.refundPolicyItemText, { color: colors.textSecondary }]}>
                  Less than 3 days: No refund
                </Text>
              </View>
              <View style={styles.refundPolicyItem}>
                <Text style={[styles.refundPolicyBullet, { color: colors.secondary }]}>•</Text>
                <Text style={[styles.refundPolicyItemText, { color: colors.textSecondary }]}>
                  If you cancel: 100% refund to attendees
                </Text>
              </View>
              <Text style={[styles.refundPolicyNote, { color: colors.textTertiary }]}>
                Service and processing fees are non-refundable.
              </Text>
            </View>
          </View>
        )}
        {/* Tips */}`;

content = content.replace(searchText, replaceWith);

// Verificar si los estilos ya existen
if (!content.includes('refundPolicyNote:')) {
  // Agregar estilo faltante
  const styleInsert = `refundPolicyItemText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
  },`;
  
  const newStyle = `refundPolicyItemText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
  },
  refundPolicyNote: {
    fontSize: 11,
    marginTop: 8,
    fontStyle: "italic",
  },`;
  
  content = content.replace(styleInsert, newStyle);
}

fs.writeFileSync(filePath, content);
console.log('✅ Added cancellation policy disclosure to CreateEventScreen.js');
