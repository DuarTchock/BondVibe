import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export default function SuccessModal({ visible, onClose, title, message, emoji = '🎉' }) {
  const { colors } = useTheme();
  
  useEffect(() => {
    if (visible) {
      console.log('✅ SuccessModal is now visible');
    }
  }, [visible]);

  const handleClose = () => {
    console.log('👋 SuccessModal closing...');
    onClose();
  };

  const styles = createStyles(colors);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={handleClose}
        />
        
        <View style={[styles.modal, { backgroundColor: colors.surface }]}>
          <View style={styles.content}>
            <Text style={styles.emoji}>{emoji}</Text>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            <Text style={[styles.message, { color: colors.textSecondary }]}>
              {message}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={handleClose}
            activeOpacity={0.8}
          >
            <View style={[styles.buttonGlass, {
              backgroundColor: `${colors.primary}33`,
              borderColor: `${colors.primary}66`
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
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    backdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    modal: {
      width: '90%',
      maxWidth: 400,
      borderRadius: 24,
      padding: 32,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.3,
      shadowRadius: 30,
      elevation: 20,
      alignItems: 'center',
      zIndex: 1000,
    },
    content: {
      alignItems: 'center',
      marginBottom: 28,
      width: '100%',
    },
    emoji: {
      fontSize: 72,
      marginBottom: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      marginBottom: 12,
      textAlign: 'center',
      letterSpacing: -0.4,
    },
    message: {
      fontSize: 15,
      textAlign: 'center',
      lineHeight: 22,
      paddingHorizontal: 10,
    },
    button: {
      width: '100%',
      borderRadius: 16,
      overflow: 'hidden',
    },
    buttonGlass: {
      borderWidth: 1,
      paddingVertical: 16,
      alignItems: 'center',
    },
    buttonText: {
      fontSize: 17,
      fontWeight: '700',
      letterSpacing: -0.2,
    },
  });
}
