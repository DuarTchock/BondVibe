import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-r';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import Colors from '../constants/Colors';
import Sizes from '../constants/Sizes';

export default function EditEventScreen({ route, navigation }) {
  const { event } = route.params;
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [formData, setFormData] = useState({
    title: event.title || '',
    description: event.description || '',
    location: event.location || '',
    price: (event.price || 0).toString(),
    maxAttendees: (event.maxAttendees || 10).toString(),
  });

  const handleUpdate = () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      Alert.alert('Error', 'Title and description are required');
      return;
    }

    if (!formData.location.trim()) {
      Alert.alert('Error', 'Location is required');
      return;
    }

    setShowConfirmModal(true);
  };

  const executeUpdate = async () => {
    console.log('🚀 Starting update process...');
    setShowConfirmModal(false);
    setLoading(true);
    
    try {
      const eventRef = doc(db, 'events', event.id);
      const updates = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        location: formData.location.trim(),
        price: parseFloat(formData.price) || 0,
        maxAttendees: parseInt(formData.maxAttendees) || 10,
        updatedAt: new Date().toISOString(),
      };

      console.log('📝 Updating event:', event.id);
      
      await updateDoc(eventRef, updates);

      console.log('✅ Update successful!');

      Alert.alert('Success', 'Event updated successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('❌ Error updating event:', error);
      Alert.alert('Error', 'Failed to update event: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* CONFIRMATION MODAL */}
      <Modal
        visible={showConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Event</Text>
            <Text style={styles.modalText}>
              Are you sure you want to update this event?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={executeUpdate}
              >
                <Text style={styles.modalConfirmText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Event</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            Editing: <Text style={styles.infoHighlight}>{event.title}</Text>
          </Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Event Title *</Text>
          <TextInput
            style={styles.input}
            value={formData.title}
            onChangeText={(text) => setFormData({ ...formData, title: text })}
            placeholder="e.g., Coffee Morning Meetup"
            maxLength={100}
            placeholderTextColor={Colors.textLight}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            placeholder="Describe your event..."
            multiline
            maxLength={500}
            placeholderTextColor={Colors.textLight}
          />
          <Text style={styles.charCount}>{formData.description.length}/500</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Location *</Text>
          <TextInput
            style={styles.input}
            value={formData.location}
            onChangeText={(text) => setFormData({ ...formData, location: text })}
            placeholder="e.g., Starbucks Centro"
            maxLength={100}
            placeholderTextColor={Colors.textLight}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Price (MXN)</Text>
          <TextInput
            style={styles.input}
            value={formData.price}
            onChangeText={(text) => setFormData({ ...formData, price: text.replace(/[^0-9.]/g, '') })}
            placeholder="0"
            keyboardType="numeric"
            placeholderTextColor={Colors.textLight}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Max Attendees</Text>
          <TextInput
            style={styles.input}
            value={formData.maxAttendees}
            onChangeText={(text) => setFormData({ ...formData, maxAttendees: text.replace(/[^0-9]/g, '') })}
            placeholder="10"
            keyboardType="numeric"
            placeholderTextColor={Colors.textLight}
          />
        </View>

        <View style={styles.noteCard}>
          <Text style={styles.noteIcon}>ℹ️</Text>
          <Text style={styles.noteText}>
            Changes to date, category, and other settings require creating a new event.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.updateButton, loading && styles.buttonDisabled]}
          onPress={handleUpdate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.updateButtonText}>Update Event</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderRadius: Sizes.borderRadius,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: Sizes.fontSize.large,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalText: {
    fontSize: Sizes.fontSize.medium,
    color: Colors.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: Colors.border,
    padding: 12,
    borderRadius: Sizes.borderRadius,
    marginRight: 8,
    alignItems: 'center',
  },
  modalCancelText: {
    color: Colors.text,
    fontSize: Sizes.fontSize.medium,
    fontWeight: '600',
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: Sizes.borderRadius,
    marginLeft: 8,
    alignItems: 'center',
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontSize: Sizes.fontSize.medium,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: Sizes.padding * 2,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    fontSize: Sizes.fontSize.medium,
    color: Colors.primary,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: Sizes.fontSize.large,
    fontWeight: 'bold',
    color: Colors.text,
  },
  content: {
    padding: Sizes.padding * 2,
  },
  infoCard: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: Sizes.borderRadius,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  infoText: {
    fontSize: Sizes.fontSize.medium,
    color: Colors.text,
  },
  infoHighlight: {
    fontWeight: 'bold',
    color: Colors.primary,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: Sizes.fontSize.medium,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Sizes.borderRadius,
    padding: 12,
    fontSize: Sizes.fontSize.medium,
    color: Colors.text,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: Sizes.fontSize.small,
    color: Colors.textLight,
    textAlign: 'right',
    marginTop: 4,
  },
  noteCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF9E6',
    padding: 12,
    borderRadius: Sizes.borderRadius,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
  },
  noteIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  noteText: {
    flex: 1,
    fontSize: Sizes.fontSize.small,
    color: Colors.text,
    lineHeight: 20,
  },
  updateButton: {
    backgroundColor: Colors.primary,
    padding: Sizes.padding + 4,
    borderRadius: Sizes.borderRadius,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: Sizes.fontSize.large,
    fontWeight: '700',
  },
});
