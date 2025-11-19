import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { collection, addDoc } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { useTheme } from '../contexts/ThemeContext';

const CATEGORIES = ['Social', 'Sports', 'Food', 'Arts', 'Learning', 'Adventure'];

export default function CreateEventScreen({ navigation }) {
  const { colors, isDark } = useTheme();
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
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!form.title.trim() || !form.description.trim() || !form.location.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setCreating(true);
    try {
      await addDoc(collection(db, 'events'), {
        ...form,
        maxAttendees: parseInt(form.maxAttendees) || 10,
        price: parseFloat(form.price) || 0,
        creatorId: auth.currentUser.uid,
        status: 'published',
        attendees: [],
        createdAt: new Date().toISOString(),
      });
      Alert.alert('Success', 'Event created!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error creating event:', error);
      Alert.alert('Error', 'Failed to create event');
    } finally {
      setCreating(false);
    }
  };

  const styles = createStyles(colors);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backButton, { color: colors.text }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Create Event</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
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

        {/* Description */}
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

        {/* Category */}
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

        {/* Date & Time */}
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

        {/* Location */}
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

        {/* Max Attendees & Price */}
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

        {/* Create Button */}
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreate}
          disabled={creating}
        >
          <View style={[styles.createGlass, {
            backgroundColor: `${colors.primary}33`,
            borderColor: `${colors.primary}66`
          }]}>
            <Text style={[styles.createButtonText, { color: colors.primary }]}>
              {creating ? 'Creating...' : '✨ Create Event'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={[styles.infoGlass, {
            backgroundColor: `${colors.secondary}1A`,
            borderColor: `${colors.secondary}33`
          }]}>
            <Text style={styles.infoIcon}>💡</Text>
            <View style={styles.infoContent}>
              <Text style={[styles.infoTitle, { color: colors.secondary }]}>
                Tips for great events
              </Text>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                • Be specific about the vibe{'\n'}
                • Choose public, accessible locations{'\n'}
                • Set clear expectations
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
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
    createButton: {
      borderRadius: 16,
      overflow: 'hidden',
      marginBottom: 20,
    },
    createGlass: {
      borderWidth: 1,
      paddingVertical: 16,
      alignItems: 'center',
    },
    createButtonText: {
      fontSize: 17,
      fontWeight: '700',
      letterSpacing: -0.2,
    },
    infoCard: {
      borderRadius: 16,
      overflow: 'hidden',
    },
    infoGlass: {
      borderWidth: 1,
      padding: 16,
      flexDirection: 'row',
    },
    infoIcon: {
      fontSize: 24,
      marginRight: 12,
    },
    infoContent: {
      flex: 1,
    },
    infoTitle: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 8,
      letterSpacing: -0.1,
    },
    infoText: {
      fontSize: 12,
      lineHeight: 18,
    },
  });
}
