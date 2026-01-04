const fs = require('fs');

const profilePath = 'src/screens/ProfileScreen.js';
let content = fs.readFileSync(profilePath, 'utf8');

// Quitar el botón Delete Account de donde está actualmente
content = content.replace(
  `{/* Delete Account Button */}
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => setShowDeleteModal(true)}
            >
              <View style={styles.deleteGlass}>
                <Trash2 size={20} color="#EF4444" strokeWidth={2} />
                <Text style={styles.deleteButtonText}>Delete Account</Text>
              </View>
            </TouchableOpacity>

            {/* Logout Button */}`,
  `{/* Logout Button */}`
);

// Agregar Delete Account después del Logout, con más separación y estilo más sutil
content = content.replace(
  `{/* Logout Button */}
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={() => setShowLogoutModal(true)}
            >
              <View style={styles.logoutGlass}>
                <LogOut size={20} color="#EF4444" strokeWidth={2} />
                <Text style={styles.logoutButtonText}>Logout</Text>
              </View>
            </TouchableOpacity>`,
  `{/* Logout Button */}
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={() => setShowLogoutModal(true)}
            >
              <View style={styles.logoutGlass}>
                <LogOut size={20} color="#EF4444" strokeWidth={2} />
                <Text style={styles.logoutButtonText}>Logout</Text>
              </View>
            </TouchableOpacity>

            {/* Delete Account - Subtle link at bottom */}
            <TouchableOpacity
              style={styles.deleteAccountLink}
              onPress={() => setShowDeleteModal(true)}
            >
              <Text style={[styles.deleteAccountText, { color: colors.textTertiary }]}>
                Delete Account
              </Text>
            </TouchableOpacity>`
);

// Actualizar estilos - quitar deleteButton y deleteGlass, agregar estilo sutil
content = content.replace(
  `deleteButton: { marginBottom: 12 },
    deleteGlass: {
      backgroundColor: "rgba(239, 68, 68, 0.08)",
      borderWidth: 1,
      borderColor: "rgba(239, 68, 68, 0.2)",
      borderRadius: 16,
      paddingVertical: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    deleteButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: "#EF4444",
      letterSpacing: -0.1,
    },
    logoutButton: { marginBottom: 20 },`,
  `logoutButton: { marginBottom: 32 },
    deleteAccountLink: {
      alignItems: "center",
      paddingVertical: 16,
      marginBottom: 20,
    },
    deleteAccountText: {
      fontSize: 14,
      fontWeight: "500",
    },`
);

fs.writeFileSync(profilePath, content);
console.log('✅ Moved Delete Account to bottom as subtle link');
