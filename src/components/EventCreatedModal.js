import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export default function EventCreatedModal({ visible, onClose, eventTitle }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          {/* Success Icon */}
          <View style={[styles.iconContainer, {
            backgroundColor: `${colors.primary}22`,
          }]}>
            <Text style={styles.successIcon}>✨</Text>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.text }]}>
            Event Created!
          </Text>

          {/* Message */}
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            Your event "{eventTitle}" has been created successfully and is now live for others to discover.
          </Text>

          {/* Button */}
          <TouchableOpacity
            style={styles.button}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <View style={[styles.buttonGlass, {
              backgroundColor: `${colors.primary}33`,
              borderColor: `${colors.primary}66`,
            }]}>
              <Text style={[styles.buttonText, { color: colors.primary }]}>
                Got it!
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    container: {
      borderRadius: 24,
      padding: 32,
      width: '100%',
      maxWidth: 400,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 10,
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 24,
    },
    successIcon: {
      fontSize: 48,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      marginBottom: 16,
      textAlign: 'center',
      letterSpacing: -0.5,
    },
    message: {
      fontSize: 16,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 32,
    },
    button: {
      width: '100%',
      borderRadius: 16,
      overflow: 'hidden',
    },
    buttonGlass: {
      borderWidth: 1,
      paddingVertical: 18,
      alignItems: 'center',
    },
    buttonText: {
      fontSize: 18,
      fontWeight: '700',
      letterSpacing: -0.2,
    },
  });
}
