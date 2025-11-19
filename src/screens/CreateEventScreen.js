import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { useTheme } from '../contexts/ThemeContext';

const CATEGORIES = [
  { id: 'social', label: 'Social', emoji: '🎉' },
  { id: 'sports', label: 'Sports', emoji: '⚽' },
  { id: 'food', label: 'Food', emoji: '🍕' },
  { id: 'arts', label: 'Arts', emoji: '🎨' },
  { id: 'learning', label: 'Learning', emoji: '📚' },
  { id: 'adventure', label: 'Adventure', emoji: '🏔️' },
];

export default function CreateEventScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const dateInputRef = useRef(null);
  const timeInputRef = useRef(null);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('social');
  
  // Initialize with tomorrow's date and default time
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(19, 0, 0, 0); // 7 PM
  
  const [dateValue, setDateValue] = useState(tomorrow.toISOString().split('T')[0]); // YYYY-MM-DD
  const [timeValue, setTimeValue] = useState('19:00'); // HH:MM
  
  const [location, setLocation] = useState('');
  const [maxPeople, setMaxPeople] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const handleCreateEvent = async () => {
    console.log('✨ Create Event clicked');

    // Validation
    if (!title.trim()) {
      Alert.alert('Missing Information', 'Please enter an event title.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Missing Information', 'Please enter an event description.');
      return;
    }
    if (!location.trim()) {
      Alert.alert('Missing Information', 'Please enter a location.');
      return;
    }
    if (!maxPeople || parseInt(maxPeople) < 2) {
      Alert.alert('Invalid Max People', 'Maximum people must be at least 2.');
      return;
    }
    if (!price || parseFloat(price) < 0) {
      Alert.alert('Invalid Price', 'Please enter a valid price (0 for free events).');
      return;
    }

    // Combine date and time
    const eventDateTime = new Date(`${dateValue}T${timeValue}:00`);

    // Validate datetime is in the future
    if (eventDateTime <= new Date()) {
      Alert.alert('Invalid Date/Time', 'Event must be scheduled for a future date and time.');
      return;
    }

    setLoading(true);
    console.log('📅 Creating event...');

    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'You must be logged in to create an event.');
        setLoading(false);
        return;
      }

      const eventData = {
        title: title.trim(),
        description: description.trim(),
        category: selectedCategory,
        date: eventDateTime.toISOString(),
        location: location.trim(),
        maxPeople: parseInt(maxPeople),
        price: parseFloat(price),
        currency: 'MXN',
        hostId: user.uid,
        hostName: user.displayName || 'Anonymous',
        participants: [user.uid],
        participantCount: 1,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      console.log('💾 Saving event:', eventData);
      const docRef = await addDoc(collection(db, 'events'), eventData);
      console.log('✅ Event created with ID:', docRef.id);

      Alert.alert(
        'Success!',
        'Your event has been created successfully.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('❌ Error creating event:', error);
      Alert.alert('Error', 'Failed to create event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const styles = createStyles(colors);

  // Get minimum date (today) in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={[styles.backIcon, { color: colors.text }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Create Event</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>Title *</Text>
          <View style={[styles.inputWrapper, {
            backgroundColor: colors.surfaceGlass,
            borderColor: colors.border
          }]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="What's your event called?"
              placeholderTextColor={colors.textTertiary}
              value={title}
              onChangeText={setTitle}
            />
          </View>
        </View>

        {/* Description */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>Description *</Text>
          <View style={[styles.textAreaWrapper, {
            backgroundColor: colors.surfaceGlass,
            borderColor: colors.border
          }]}>
            <TextInput
              style={[styles.textArea, { color: colors.text }]}
              placeholder="Describe your event..."
              placeholderTextColor={colors.textTertiary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
          <Text style={[styles.charCount, { color: colors.textTertiary }]}>
            {description.length}/500
          </Text>
        </View>

        {/* Category */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>Category</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryButton, {
                  backgroundColor: selectedCategory === cat.id ? `${colors.primary}33` : colors.surfaceGlass,
                  borderColor: selectedCategory === cat.id ? colors.primary : colors.border,
                  borderWidth: selectedCategory === cat.id ? 2 : 1,
                }]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                <Text style={[styles.categoryLabel, {
                  color: selectedCategory === cat.id ? colors.primary : colors.text
                }]}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Date and Time - Web Native Inputs with Custom Icons */}
        <View style={styles.row}>
          <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
            <Text style={[styles.label, { color: colors.text }]}>Date *</Text>
            <TouchableOpacity
              style={[styles.pickerButton, {
                backgroundColor: colors.surfaceGlass,
                borderColor: colors.border
              }]}
              onPress={() => dateInputRef.current?.showPicker()}
            >
              <Text style={[styles.pickerText, { color: colors.text }]}>
                {formatDate(dateValue)}
              </Text>
              <Text style={styles.pickerIcon}>📅</Text>
              <input
                ref={dateInputRef}
                type="date"
                value={dateValue}
                min={today}
                onChange={(e) => setDateValue(e.target.value)}
                style={{
                  position: 'absolute',
                  opacity: 0,
                  width: 0,
                  height: 0,
                  pointerEvents: 'none',
                }}
              />
            </TouchableOpacity>
          </View>

          <View style={[styles.field, { flex: 1, marginLeft: 8 }]}>
            <Text style={[styles.label, { color: colors.text }]}>Time *</Text>
            <TouchableOpacity
              style={[styles.pickerButton, {
                backgroundColor: colors.surfaceGlass,
                borderColor: colors.border
              }]}
              onPress={() => timeInputRef.current?.showPicker()}
            >
              <Text style={[styles.pickerText, { color: colors.text }]}>
                {formatTime(timeValue)}
              </Text>
              <Text style={styles.pickerIcon}>🕐</Text>
              <input
                ref={timeInputRef}
                type="time"
                value={timeValue}
                onChange={(e) => setTimeValue(e.target.value)}
                style={{
                  position: 'absolute',
                  opacity: 0,
                  width: 0,
                  height: 0,
                  pointerEvents: 'none',
                }}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Location */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>Location *</Text>
          <View style={[styles.inputWrapper, {
            backgroundColor: colors.surfaceGlass,
            borderColor: colors.border
          }]}>
            <Text style={styles.inputIcon}>📍</Text>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Where will it be?"
              placeholderTextColor={colors.textTertiary}
              value={location}
              onChangeText={setLocation}
            />
          </View>
        </View>

        {/* Max People and Price */}
        <View style={styles.row}>
          <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
            <Text style={[styles.label, { color: colors.text }]}>Max People</Text>
            <View style={[styles.inputWrapper, {
              backgroundColor: colors.surfaceGlass,
              borderColor: colors.border
            }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="20"
                placeholderTextColor={colors.textTertiary}
                value={maxPeople}
                onChangeText={setMaxPeople}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={[styles.field, { flex: 1, marginLeft: 8 }]}>
            <Text style={[styles.label, { color: colors.text }]}>Price (MXN)</Text>
            <View style={[styles.inputWrapper, {
              backgroundColor: colors.surfaceGlass,
              borderColor: colors.border
            }]}>
              <Text style={styles.inputIcon}>$</Text>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="100"
                placeholderTextColor={colors.textTertiary}
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Tips */}
        <View style={[styles.tipsCard, {
          backgroundColor: `${colors.primary}11`,
          borderColor: `${colors.primary}33`
        }]}>
          <Text style={[styles.tipsTitle, { color: colors.primary }]}>💡 Tips for great events</Text>
          <Text style={[styles.tipsText, { color: colors.textSecondary }]}>
            • Be specific about the vibe{'\n'}
            • Choose public, accessible locations{'\n'}
            • Set clear expectations
          </Text>
        </View>

        {/* Create Button */}
        <TouchableOpacity
          style={[styles.createButton, {
            opacity: loading ? 0.7 : 1
          }]}
          onPress={handleCreateEvent}
          disabled={loading}
        >
          <View style={[styles.createGlass, {
            backgroundColor: `${colors.primary}33`,
            borderColor: `${colors.primary}66`
          }]}>
            {loading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <Text style={styles.createIcon}>✨</Text>
                <Text style={[styles.createText, { color: colors.primary }]}>
                  Create Event
                </Text>
              </>
            )}
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 60,
      paddingBottom: 16,
    },
    backButton: { width: 40, height: 40, justifyContent: 'center' },
    backIcon: { fontSize: 28 },
    headerTitle: { fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
    scrollView: { flex: 1 },
    content: { padding: 20, paddingBottom: 40 },
    field: { marginBottom: 24 },
    label: { fontSize: 16, fontWeight: '700', marginBottom: 12, letterSpacing: -0.2 },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderRadius: 16,
      paddingHorizontal: 16,
    },
    inputIcon: { fontSize: 20, marginRight: 12 },
    input: { flex: 1, fontSize: 16, paddingVertical: 16 },
    textAreaWrapper: {
      borderWidth: 1,
      borderRadius: 16,
      padding: 16,
    },
    textArea: { fontSize: 16, minHeight: 100 },
    charCount: { fontSize: 12, marginTop: 8, textAlign: 'right' },
    categoryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    categoryButton: {
      flex: 1,
      minWidth: '30%',
      paddingVertical: 16,
      paddingHorizontal: 12,
      borderRadius: 16,
      alignItems: 'center',
    },
    categoryEmoji: { fontSize: 24, marginBottom: 4 },
    categoryLabel: { fontSize: 14, fontWeight: '600' },
    row: { flexDirection: 'row', marginBottom: 24 },
    pickerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 16,
      position: 'relative',
      cursor: 'pointer',
    },
    pickerText: { fontSize: 16, flex: 1 },
    pickerIcon: { fontSize: 20, marginLeft: 8 },
    tipsCard: {
      borderWidth: 1,
      borderRadius: 16,
      padding: 20,
      marginBottom: 24,
    },
    tipsTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
    tipsText: { fontSize: 14, lineHeight: 22 },
    createButton: { borderRadius: 16, overflow: 'hidden', marginTop: 8 },
    createGlass: {
      borderWidth: 1,
      paddingVertical: 18,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    createIcon: { fontSize: 20, marginRight: 8 },
    createText: { fontSize: 18, fontWeight: '700', letterSpacing: -0.2 },
  });
}
