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
import { useTheme } from '../contexts/ThemeContext';

const CATEGORIES = ['Social', 'Sports', 'Food', 'Arts', 'Learning', 'Adventure'];

export default function EditEventScreen({ route, navigation }) {
  const { colors, isDark } = useTheme();
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

  const styles = createStyles(colors);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backButton, { color: colors.text }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Event</Text>
        <TouchableOpacity onPress={handleDelete}>
          <Text style={styles.deleteButton}>🗑️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Form fields - similar structure to CreateEventScreen */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Event Title *</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={[styles.input, {
                backgroundColor: colors.surfaceGlass,
                borderColor: colors.border,
                color: colors.text
              }]}
              value={form.title}
              onChangeText={(text) => setForm({ ...form, title: text })}
              placeholder="Coffee & Chat"
              placeholderTextColor={colors.textTertiary}
              maxLength={80}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Description *</Text>
          <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
            <TextInput
              style={[styles.input, styles.textArea, {
                backgroundColor: colors.surfaceGlass,
                borderColor: colors.border,
                color: colors.text
              }]}
              value={form.description}
              onChangeText={(text) => setForm({ ...form, description: text })}
              placeholder="Tell people what to expect..."
              placeholderTextColor={colors.textTertiary}
              multiline
              maxLength={500}
            />
          </View>
          <Text style={[styles.charCount, { color: colors.textTertiary }]}>
            {form.description.length}/500
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Category</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={styles.categoryChip}
                onPress={() => setForm({ ...form, category: cat })}
              >
                <View style={[
                  styles.categoryChipGlass,
                  {
                    backgroundColor: form.category === cat ? `${colors.primary}33` : colors.surfaceGlass,
                    borderColor: form.category === cat ? `${colors.primary}66` : colors.border
                  }
                ]}>
                  <Text style={[
                    styles.categoryChipText,
                    { color: form.category === cat ? colors.primary : colors.textSecondary }
                  ]}>
                    {cat}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.rowSection}>
          <View style={[styles.section, { flex: 1 }]}>
            <Text style={[styles.label, { color: colors.text }]}>Date *</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, {
                  backgroundColor: colors.surfaceGlass,
                  borderColor: colors.border,
                  color: colors.text
                }]}
                value={form.date}
                onChangeText={(text) => setForm({ ...form, date: text })}
                placeholder="Dec 25"
                placeholderTextColor={colors.textTertiary}
              />
            </View>
          </View>

          <View style={[styles.section, { flex: 1, marginLeft: 12 }]}>
            <Text style={[styles.label, { color: colors.text }]}>Time *</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, {
                  backgroundColor: colors.surfaceGlass,
                  borderColor: colors.border,
                  color: colors.text
                }]}
                value={form.time}
                onChangeText={(text) => setForm({ ...form, time: text })}
                placeholder="7:00 PM"
                placeholderTextColor={colors.textTertiary}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Location *</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputIcon}>📍</Text>
            <TextInput
              style={[styles.input, styles.inputWithIcon, {
                backgroundColor: colors.surfaceGlass,
                borderColor: colors.border,
                color: colors.text
              }]}
              value={form.location}
              onChangeText={(text) => setForm({ ...form, location: text })}
              placeholder="Starbucks Downtown"
              placeholderTextColor={colors.textTertiary}
            />
          </View>
        </View>

        <View style={styles.rowSection}>
          <View style={[styles.section, { flex: 1 }]}>
            <Text style={[styles.label, { color: colors.text }]}>Max People</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, {
                  backgroundColor: colors.surfaceGlass,
                  borderColor: colors.border,
                  color: colors.text
                }]}
                value={form.maxAttendees}
                onChangeText={(text) => setForm({ ...form, maxAttendees: text.replace(/[^0-9]/g, '') })}
                placeholder="10"
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={[styles.section, { flex: 1, marginLeft: 12 }]}>
            <Text style={[styles.label, { color: colors.text }]}>Price ($)</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, {
                  backgroundColor: colors.surfaceGlass,
                  borderColor: colors.border,
                  color: colors.text
                }]}
                value={form.price}
                onChangeText={(text) => setForm({ ...form, price: text.replace(/[^0-9.]/g, '') })}
                placeholder="0"
                placeholderTextColor={colors.textTertiary}
                keyboardType="decimal-pad"
              />
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={saving}
        >
          <View style={[styles.saveGlass, {
            backgroundColor: `${colors.primary}33`,
            borderColor: `${colors.primary}66`
          }]}>
            <Text style={[styles.saveButtonText, { color: colors.primary }]}>
              {saving ? 'Saving...' : '💾 Save Changes'}
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
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
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
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
      borderWidth: 1,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 15,
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
      borderWidth: 1,
      paddingVertical: 10,
      paddingHorizontal: 18,
    },
    categoryChipText: {
      fontSize: 14,
      fontWeight: '600',
    },
    saveButton: {
      borderRadius: 16,
      overflow: 'hidden',
      marginTop: 8,
    },
    saveGlass: {
      borderWidth: 1,
      paddingVertical: 16,
      alignItems: 'center',
    },
    saveButtonText: {
      fontSize: 17,
      fontWeight: '700',
      letterSpacing: -0.2,
    },
  });
}
