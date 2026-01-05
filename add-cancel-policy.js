const fs = require('fs');

const filePath = 'src/screens/CreateEventScreen.js';
let content = fs.readFileSync(filePath, 'utf8');

// Buscar el infoBadge y agregar después de él el cancellation policy
const searchText = `<Text style={[styles.infoText, { color: colors.primary }]}>
              💰 You'll receive 100% of each ticket sale. Platform and
              processing fees are added at checkout.
            </Text>
          </View>
        )}

        {/* Tips */}`;

const replaceWith = `<Text style={[styles.infoText, { color: colors.primary }]}>
              💰 You'll receive 100% of each ticket sale. Platform and
              processing fees are added at checkout.
            </Text>
            
            {/* Cancellation Policy Disclosure */}
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

if (content.includes(searchText)) {
  content = content.replace(searchText, replaceWith);
  fs.writeFileSync(filePath, content);
  console.log('✅ Added Cancellation Policy component to CreateEventScreen.js');
} else {
  console.log('❌ Could not find insertion point. Searching for alternative...');
  
  // Try alternative search
  const altSearch = `processing fees are added at checkout.
            </Text>
          </View>
        )}

        {/* Tips */}`;
  
  if (content.includes(altSearch)) {
    const altReplace = `processing fees are added at checkout.
            </Text>
            
            {/* Cancellation Policy Disclosure */}
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
    
    content = content.replace(altSearch, altReplace);
    fs.writeFileSync(filePath, content);
    console.log('✅ Added Cancellation Policy component (alternative method)');
  } else {
    console.log('❌ Could not find any insertion point');
  }
}
