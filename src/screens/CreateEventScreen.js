import React, { useState, useRef } from "react";
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
} from "react-native";
import { StatusBar } from "expo-status-bar";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
} from "firebase/firestore";
import { auth, db } from "../services/firebase";
import { useTheme } from "../contexts/ThemeContext";
import EventCreatedModal from "../components/EventCreatedModal";
import { EVENT_CATEGORIES } from "../utils/eventCategories";
import DateTimePicker from "@react-native-community/datetimepicker";

const categories = EVENT_CATEGORIES;

export default function CreateEventScreen({ navigation }) {
  const { colors, isDark } = useTheme();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("social");

  // Initialize with tomorrow's date and default time
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(19, 0, 0, 0); // 7 PM

  const [eventDate, setEventDate] = useState(tomorrow);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [location, setLocation] = useState("");
  const [maxPeople, setMaxPeople] = useState("");
  const [isFree, setIsFree] = useState(true);
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdEventTitle, setCreatedEventTitle] = useState("");

  const formatDate = (date) => {
    const options = { month: "short", day: "numeric", year: "numeric" };
    return date.toLocaleDateString("en-US", options);
  };

  const formatTime = (date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const hour12 = hours % 12 || 12;
    const minutesStr = minutes.toString().padStart(2, "0");
    return `${hour12}:${minutesStr} ${ampm}`;
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setEventDate(selectedDate);
    }
  };

  const onTimeChange = (event, selectedDate) => {
    setShowTimePicker(false);
    if (selectedDate) {
      setEventDate(selectedDate);
    }
  };

  const handleCreateEvent = async () => {
    console.log("✨ Create Event clicked");

    // Validation
    if (!title.trim()) {
      Alert.alert("Missing Information", "Please enter an event title.");
      return;
    }
    if (!description.trim()) {
      Alert.alert("Missing Information", "Please enter an event description.");
      return;
    }
    if (!location.trim()) {
      Alert.alert("Missing Information", "Please enter a location.");
      return;
    }
    if (!maxPeople || parseInt(maxPeople) < 2) {
      Alert.alert("Invalid Max People", "Maximum people must be at least 2.");
      return;
    }
    if (!isFree && (!price || parseFloat(price) <= 0)) {
      Alert.alert(
        "Invalid Price",
        "Please enter a valid price greater than 0, or mark the event as free."
      );
      return;
    }

    // Validate datetime is in the future
    if (eventDate <= new Date()) {
      Alert.alert(
        "Invalid Date/Time",
        "Event must be scheduled for a future date and time."
      );
      return;
    }

    setLoading(true);
    console.log("📅 Creating event...");

    try {
      // Fetch user data for hostName
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.data();
      console.log("👤 User data:", userData?.name);

      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Error", "You must be logged in to create an event.");
        setLoading(false);
        return;
      }

      const eventData = {
        title: title.trim(),
        description: description.trim(),
        category: selectedCategory,
        date: eventDate.toISOString(),
        location: location.trim(),
        maxPeople: parseInt(maxPeople),
        price: isFree ? 0 : parseFloat(price),
        currency: "MXN",
        hostName: userData?.name || userData?.displayName || "Anonymous",
        creatorId: user.uid,
        attendees: [],
        participantCount: 0,
        status: "active",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      console.log("💾 Saving event:", eventData);
      const docRef = await addDoc(collection(db, "events"), eventData);
      console.log("✅ Event created with ID:", docRef.id);

      // Show success modal
      setCreatedEventTitle(title.trim());
      setShowSuccessModal(true);
    } catch (error) {
      console.error("❌ Error creating event:", error);
      Alert.alert("Error", "Failed to create event. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const styles = createStyles(colors);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={[styles.backIcon, { color: colors.text }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Create Event
        </Text>
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
          <View
            style={[
              styles.inputWrapper,
              {
                backgroundColor: colors.surfaceGlass,
                borderColor: colors.border,
              },
            ]}
          >
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
          <Text style={[styles.label, { color: colors.text }]}>
            Description *
          </Text>
          <View
            style={[
              styles.textAreaWrapper,
              {
                backgroundColor: colors.surfaceGlass,
                borderColor: colors.border,
              },
            ]}
          >
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
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryButton,
                  {
                    backgroundColor:
                      selectedCategory === cat.id
                        ? `${colors.primary}33`
                        : colors.surfaceGlass,
                    borderColor:
                      selectedCategory === cat.id
                        ? colors.primary
                        : colors.border,
                    borderWidth: selectedCategory === cat.id ? 2 : 1,
                  },
                ]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                <Text
                  style={[
                    styles.categoryLabel,
                    {
                      color:
                        selectedCategory === cat.id
                          ? colors.primary
                          : colors.text,
                    },
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Date and Time - Native Pickers */}
        <View style={styles.row}>
          <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
            <Text style={[styles.label, { color: colors.text }]}>Date *</Text>
            <TouchableOpacity
              style={[
                styles.pickerButton,
                {
                  backgroundColor: colors.surfaceGlass,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={[styles.pickerText, { color: colors.text }]}>
                {formatDate(eventDate)}
              </Text>
              <Text style={styles.pickerIcon}>📅</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.field, { flex: 1, marginLeft: 8 }]}>
            <Text style={[styles.label, { color: colors.text }]}>Time *</Text>
            <TouchableOpacity
              style={[
                styles.pickerButton,
                {
                  backgroundColor: colors.surfaceGlass,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={[styles.pickerText, { color: colors.text }]}>
                {formatTime(eventDate)}
              </Text>
              <Text style={styles.pickerIcon}>🕐</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* DateTimePicker Modals */}
        {showDatePicker && (
          <DateTimePicker
            value={eventDate}
            mode="date"
            display="default"
            onChange={onDateChange}
            minimumDate={new Date()}
          />
        )}

        {showTimePicker && (
          <DateTimePicker
            value={eventDate}
            mode="time"
            display="default"
            onChange={onTimeChange}
          />
        )}

        {/* Location */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>Location *</Text>
          <View
            style={[
              styles.inputWrapper,
              {
                backgroundColor: colors.surfaceGlass,
                borderColor: colors.border,
              },
            ]}
          >
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

        {/* Free/Paid Toggle */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>Event Type</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                {
                  backgroundColor: isFree
                    ? `${colors.primary}33`
                    : colors.surfaceGlass,
                  borderColor: isFree ? colors.primary : colors.border,
                  borderWidth: isFree ? 2 : 1,
                },
              ]}
              onPress={() => {
                setIsFree(true);
                setPrice("");
              }}
            >
              <Text style={styles.toggleEmoji}>🎁</Text>
              <Text
                style={[
                  styles.toggleLabel,
                  {
                    color: isFree ? colors.primary : colors.text,
                  },
                ]}
              >
                Free
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toggleButton,
                {
                  backgroundColor: !isFree
                    ? `${colors.primary}33`
                    : colors.surfaceGlass,
                  borderColor: !isFree ? colors.primary : colors.border,
                  borderWidth: !isFree ? 2 : 1,
                },
              ]}
              onPress={() => setIsFree(false)}
            >
              <Text style={styles.toggleEmoji}>💵</Text>
              <Text
                style={[
                  styles.toggleLabel,
                  {
                    color: !isFree ? colors.primary : colors.text,
                  },
                ]}
              >
                Paid
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Max People and Price */}
        <View style={styles.row}>
          <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
            <Text style={[styles.label, { color: colors.text }]}>
              Max People
            </Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: colors.surfaceGlass,
                  borderColor: colors.border,
                },
              ]}
            >
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
            <Text style={[styles.label, { color: colors.text }]}>
              {isFree ? "Price" : "Price (MXN) *"}
            </Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: isFree
                    ? colors.surfaceGlass
                    : colors.surfaceGlass,
                  borderColor: colors.border,
                  opacity: isFree ? 0.5 : 1,
                },
              ]}
            >
              <Text style={styles.inputIcon}>$</Text>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder={isFree ? "0" : "100"}
                placeholderTextColor={colors.textTertiary}
                value={isFree ? "0" : price}
                onChangeText={setPrice}
                keyboardType="numeric"
                editable={!isFree}
              />
            </View>
          </View>
        </View>

        {/* Tips */}
        <View
          style={[
            styles.tipsCard,
            {
              backgroundColor: `${colors.primary}11`,
              borderColor: `${colors.primary}33`,
            },
          ]}
        >
          <Text style={[styles.tipsTitle, { color: colors.primary }]}>
            💡 Tips for great events
          </Text>
          <Text style={[styles.tipsText, { color: colors.textSecondary }]}>
            • Be specific about the vibe{"\n"}• Choose public, accessible
            locations{"\n"}• Set clear expectations
          </Text>
        </View>

        {/* Create Button */}
        <TouchableOpacity
          style={[
            styles.createButton,
            {
              opacity: loading ? 0.7 : 1,
            },
          ]}
          onPress={handleCreateEvent}
          disabled={loading}
        >
          <View
            style={[
              styles.createGlass,
              {
                backgroundColor: `${colors.primary}33`,
                borderColor: `${colors.primary}66`,
              },
            ]}
          >
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

      {/* Success Modal */}
      <EventCreatedModal
        visible={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          navigation.goBack();
        }}
        eventTitle={createdEventTitle}
      />
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingTop: 60,
      paddingBottom: 16,
    },
    backButton: { width: 40, height: 40, justifyContent: "center" },
    backIcon: { fontSize: 28 },
    headerTitle: { fontSize: 20, fontWeight: "700", letterSpacing: -0.3 },
    scrollView: { flex: 1 },
    content: { padding: 20, paddingBottom: 40 },
    field: { marginBottom: 24 },
    label: {
      fontSize: 16,
      fontWeight: "700",
      marginBottom: 12,
      letterSpacing: -0.2,
    },
    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
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
    charCount: { fontSize: 12, marginTop: 8, textAlign: "right" },
    categoryGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
    categoryButton: {
      flex: 1,
      minWidth: "30%",
      paddingVertical: 16,
      paddingHorizontal: 12,
      borderRadius: 16,
      alignItems: "center",
    },
    categoryEmoji: { fontSize: 24, marginBottom: 4 },
    categoryLabel: { fontSize: 14, fontWeight: "600" },
    toggleRow: { flexDirection: "row", gap: 12 },
    toggleButton: {
      flex: 1,
      paddingVertical: 16,
      paddingHorizontal: 12,
      borderRadius: 16,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      gap: 8,
    },
    toggleEmoji: { fontSize: 20 },
    toggleLabel: { fontSize: 16, fontWeight: "600" },
    row: { flexDirection: "row", marginBottom: 24 },
    pickerButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderWidth: 1,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    pickerText: { fontSize: 16, flex: 1 },
    pickerIcon: { fontSize: 20, marginLeft: 8 },
    tipsCard: {
      borderWidth: 1,
      borderRadius: 16,
      padding: 20,
      marginBottom: 24,
    },
    tipsTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
    tipsText: { fontSize: 14, lineHeight: 22 },
    createButton: { borderRadius: 16, overflow: "hidden", marginTop: 8 },
    createGlass: {
      borderWidth: 1,
      paddingVertical: 18,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    createIcon: { fontSize: 20, marginRight: 8 },
    createText: { fontSize: 18, fontWeight: "700", letterSpacing: -0.2 },
  });
}
