import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../services/firebase';

const CATEGORIES = ['Social', 'Sports', 'Food', 'Arts', 'Learning', 'Adventure'];

export default function EditEventScreen({ route, navigation }) {
  const { eventId } = route.params;
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Social',
    date: '',
    time: '',
    location: '',
    maxAttendees: '',
    price: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadEvent();
  }, []);

  const loadEvent = async () => {
    try {
      const eventDoc = await getDoc(doc(db, 'events', eventId));
      if (eventDoc.exists()) {
        const data = eventDoc.data();
        setForm({
          title: data.title || '',
          description: data.description || '',
          category: data.category || 'Social',
          date: data.date || '',
          time: data.time || '',
          location: data.location || '',
          maxAttendees: data.maxAttendees?.toString() || '',
          price: data.price?.toString() || '',
        });
      }
    } catch (error) {
      console.error('Error loading event:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.description.trim() || !form.location.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      await updateDoc(doc(db, 'events', eventId), {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        date: form.date.trim(),
        time: form.time.trim(),
        location: form.location.trim(),
        maxAttendees: parseInt(form.maxAttendees) || 10,
        price: parseFloat(form.price) || 0,
        updatedAt: new Date().toISOString(),
      });
      
      Alert.alert('Success', 'Event updated!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error updating event:', error);
      Alert.alert('Error', 'Failed to update event');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Event',
      'Are you sure? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'events', eventId));
              Alert.alert('Deleted', 'Event deleted successfully', [
                { text: 'OK', onPress: () => navigation.navigate('Home') }
              ]);
            } catch (error) {
              console.error('Error deleting event:', error);
              Alert.alert('Error', 'Failed to delete event');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF3EA5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Event</Text>
        <TouchableOpacity onPress={handleDelete}>
          <Text style={styles.deleteButton}>🗑️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <View style={styles.section}>
          <Text style={styles.label}>Event Title *</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={form.title}
              onChangeText={(text) => setForm({ ...form, title: text })}
              placeholder="Coffee & Chat"
              placeholderTextColor="#64748B"
              maxLength={80}
            />
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Description *</Text>
          <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={form.description}
              onChangeText={(text) => setForm({ ...form, description: text })}
              placeholder="Tell people what to expect..."
              placeholderTextColor="#64748B"
              multiline
              maxLength={500}
            />
          </View>
          <Text style={styles.charCount}>{form.description.length}/500</Text>
        </View>

        {/* Category */}
        <View style={styles.section}>
          <Text style={styles.label}>Category</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  form.category === cat && styles.categoryChipActive
                ]}
                onPress={() => setForm({ ...form, category: cat })}
              >
                <View style={[
                  styles.categoryChipGlass,
                  form.category === cat && styles.categoryChipGlassActive
                ]}>
                  <Text style={[
                    styles.categoryChipText,
                    form.category === cat && styles.categoryChipTextActive
                  ]}>
                    {cat}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Date & Time */}
        <View style={styles.rowSection}>
          <View style={[styles.section, { flex: 1 }]}>
            <Text style={styles.label}>Date *</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={form.date}
                onChangeText={(text) => setForm({ ...form, date: text })}
                placeholder="Dec 25"
                placeholderTextColor="#64748B"
              />
            </View>
          </View>

          <View style={[styles.section, { flex: 1, marginLeft: 12 }]}>
            <Text style={styles.label}>Time *</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={form.time}
                onChangeText={(text) => setForm({ ...form, time: text })}
                placeholder="7:00 PM"
                placeholderTextColor="#64748B"
              />
            </View>
          </View>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.label}>Location *</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputIcon}>📍</Text>
            <TextInput
              style={[styles.input, styles.inputWithIcon]}
              value={form.location}
              onChangeText={(text) => setForm({ ...form, location: text })}
              placeholder="Starbucks Downtown"
              placeholderTextColor="#64748B"
            />
          </View>
        </View>

        {/* Max Attendees & Price */}
        <View style={styles.rowSection}>
          <View style={[styles.section, { flex: 1 }]}>
            <Text style={styles.label}>Max People</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={form.maxAttendees}
                onChangeText={(text) => setForm({ ...form, maxAttendees: text.replace(/[^0-9]/g, '') })}
                placeholder="10"
                placeholderTextColor="#64748B"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={[styles.section, { flex: 1, marginLeft: 12 }]}>
            <Text style={styles.label}>Price ($)</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={form.price}
                onChangeText={(text) => setForm({ ...form, price: text.replace(/[^0-9.]/g, '') })}
                placeholder="0"
                placeholderTextColor="#64748B"
                keyboardType="decimal-pad"
              />
            </View>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={saving}
        >
          <View style={styles.saveGlass}>
            <Text style={styles.saveButtonText}>
              {saving ? 'Saving...' : '💾 Save Changes'}
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F1A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0B0F1A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    fontSize: 28,
    color: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F1F5F9',
    letterSpacing: -0.3,
  },
  deleteButton: {
    fontSize: 22,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 20,
  },
  rowSection: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F1F5F9',
    marginBottom: 10,
    letterSpacing: -0.1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#F1F5F9',
  },
  inputWithIcon: {
    paddingLeft: 0,
  },
  inputIcon: {
    fontSize: 18,
    marginLeft: 16,
    marginRight: 8,
  },
  textAreaWrapper: {},
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  charCount: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'right',
    marginTop: 6,
  },
  categoryScroll: {
    gap: 8,
  },
  categoryChip: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  categoryChipGlass: {
    backgroundColor: 'rgba(17, 24, 39, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  categoryChipActive: {},
  categoryChipGlassActive: {
    backgroundColor: 'rgba(255, 62, 165, 0.2)',
    borderColor: 'rgba(255, 62, 165, 0.4)',
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
  categoryChipTextActive: {
    color: '#FF3EA5',
  },
  saveButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
  },
  saveGlass: {
    backgroundColor: 'rgba(255, 62, 165, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 62, 165, 0.4)',
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FF3EA5',
    letterSpacing: -0.2,
  },
});
