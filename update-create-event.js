const fs = require('fs');

const filePath = 'src/screens/CreateEventScreen.js';
let content = fs.readFileSync(filePath, 'utf8');

// Buscar el texto actual del 95% y reemplazarlo con el nuevo contenido
const oldText = `<Text style={[styles.infoText, { color: colors.primary }]}>
              💰 You'll receive 95% of each ticket sale. BondVibe takes 5% platform fee.
            </Text>`;

const newText = `<Text style={[styles.infoText, { color: colors.primary }]}>
              💰 You'll receive 100% of each ticket sale. Platform and processing fees are added at checkout.
            </Text>
            
            {/* Refund Policy Disclosure */}
            <View style={[styles.refundPolicyCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.border }]}>
              <Text style={[styles.refundPolicyTitle, { color: colors.text }]}>
                📋 Cancellation Policy
              </Text>
              <Text style={[styles.refundPolicyText, { color: colors.textSecondary }]}>
                Your attendees will be subject to the following refund policy:
              </Text>
              <View style={styles.refundPolicyItem}>
                <Text style={[styles.refundPolicyBullet, { color: colors.primary }]}>•</Text>
                <Text style={[styles.refundPolicyItemText, { color: colors.textSecondary }]}>
                  7+ days before: 100% refund (minus fees)
                </Text>
              </View>
              <View style={styles.refundPolicyItem}>
                <Text style={[styles.refundPolicyBullet, { color: colors.primary }]}>•</Text>
                <Text style={[styles.refundPolicyItemText, { color: colors.textSecondary }]}>
                  3-7 days before: 50% refund (minus fees)
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
                  If you cancel: 100% refund to attendees (minus fees)
                </Text>
              </View>
            </View>`;

content = content.replace(oldText, newText);

// Agregar estilos para el refund policy card
const stylesInsertPoint = 'infoText: {';
const newStyles = `refundPolicyCard: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  refundPolicyTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },
  refundPolicyText: {
    fontSize: 12,
    marginBottom: 12,
    lineHeight: 18,
  },
  refundPolicyItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  refundPolicyBullet: {
    fontSize: 14,
    marginRight: 8,
    marginTop: 1,
  },
  refundPolicyItemText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
  },
  ${stylesInsertPoint}`;

content = content.replace(stylesInsertPoint, newStyles);

fs.writeFileSync(filePath, content);
console.log('✅ Updated CreateEventScreen.js with refund policy disclosure');
