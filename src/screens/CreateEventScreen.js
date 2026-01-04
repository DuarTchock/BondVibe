import React, { useState, useEffect } from "react";
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
  Modal,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  writeBatch,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "../services/firebase";
import { useTheme } from "../contexts/ThemeContext";
import GradientBackground from "../components/GradientBackground";
import EventCreatedModal from "../components/EventCreatedModal";
import SelectDropdown from "../components/SelectDropdown";
import EventImagePicker from "../components/EventImagePicker";
import Icon from "../components/Icon";
import { EVENT_CATEGORIES, EVENT_LANGUAGES } from "../utils/eventCategories";
import { LOCATIONS } from "../utils/locations";
import { uploadEventImages } from "../services/storageService";
import DateTimePicker from "@react-native-community/datetimepicker";

// Recurrence options
const RECURRENCE_OPTIONS = [
  { id: "none", label: "One-time" },
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "biweekly", label: "Biweekly" },
  { id: "monthly", label: "Monthly" },
];

export default function CreateEventScreen({ navigation }) {
  const { colors, isDark } = useTheme();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("social");
  const [selectedLanguage, setSelectedLanguage] = useState("both");
  const [selectedCity, setSelectedCity] = useState("tulum");

  // Initialize with tomorrow's date and default time
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(19, 0, 0, 0); // 7 PM

  const [eventDate, setEventDate] = useState(tomorrow);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempDate, setTempDate] = useState(tomorrow);

  // Recurrence state
  const [recurrenceType, setRecurrenceType] = useState("none");
  const [recurrenceEndDate, setRecurrenceEndDate] = useState(() => {
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 3);
    return endDate;
  });
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [tempEndDate, setTempEndDate] = useState(() => {
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 3);
    return endDate;
  });

  const [locationDetail, setLocationDetail] = useState("");
  const [maxPeople, setMaxPeople] = useState("");
  const [isFree, setIsFree] = useState(true);
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [eventImages, setEventImages] = useState([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdEventTitle, setCreatedEventTitle] = useState("");
  const [createdEventsCount, setCreatedEventsCount] = useState(1);

  // User profile state for Stripe validation
  const [userProfile, setUserProfile] = useState(null);

  // Filter out "all" from locations for create event
  const cityOptions = LOCATIONS.filter((loc) => loc.id !== "all");

  // Load user profile on mount
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data());
        }
      } catch (error) {
        console.error("Error loading user profile:", error);
      }
    };

    loadUserProfile();
  }, []);

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

  // Get city label from id
  const getCityLabel = (cityId) => {
    const city = LOCATIONS.find((loc) => loc.id === cityId);
    return city?.label || cityId;
  };

  // Date picker handlers
  const onDateChange = (event, selectedDate) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
      if (event.type === "set" && selectedDate) {
        setEventDate(selectedDate);
      }
    } else {
      if (selectedDate) {
        setTempDate(selectedDate);
      }
    }
  };

  const confirmDateSelection = () => {
    setEventDate(tempDate);
    setShowDatePicker(false);
  };

  // Time picker handlers
  const onTimeChange = (event, selectedTime) => {
    if (Platform.OS === "android") {
      setShowTimePicker(false);
      if (event.type === "set" && selectedTime) {
        const newDate = new Date(eventDate);
        newDate.setHours(selectedTime.getHours());
        newDate.setMinutes(selectedTime.getMinutes());
        setEventDate(newDate);
      }
    } else {
      if (selectedTime) {
        setTempDate(selectedTime);
      }
    }
  };

  const confirmTimeSelection = () => {
    const newDate = new Date(eventDate);
    newDate.setHours(tempDate.getHours());
    newDate.setMinutes(tempDate.getMinutes());
    setEventDate(newDate);
    setShowTimePicker(false);
  };

  // End date picker handlers
  const onEndDateChange = (event, selectedDate) => {
    if (Platform.OS === "android") {
      setShowEndDatePicker(false);
      if (event.type === "set" && selectedDate) {
        setRecurrenceEndDate(selectedDate);
      }
    } else {
      if (selectedDate) {
        setTempEndDate(selectedDate);
      }
    }
  };

  const confirmEndDateSelection = () => {
    setRecurrenceEndDate(tempEndDate);
    setShowEndDatePicker(false);
  };

  // Handle price change with Stripe validation
  const handlePriceChange = (priceText) => {
    const priceNumber = parseInt(priceText) || 0;

    if (priceNumber > 0) {
      const canCreatePaid = userProfile?.hostConfig?.canCreatePaidEvents;

      if (!canCreatePaid) {
        Alert.alert(
          "Stripe Account Required",
          "To create paid events, you need to connect your Stripe account first.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Connect Stripe",
              onPress: () => navigation.navigate("StripeConnect"),
            },
          ]
        );
        return;
      }
    }

    setPrice(priceText);
  };

  // Generate recurring event dates
  const generateRecurringDates = (startDate, endDate, type) => {
    const dates = [];
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));

      switch (type) {
        case "daily":
          currentDate.setDate(currentDate.getDate() + 1);
          break;
        case "weekly":
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case "biweekly":
          currentDate.setDate(currentDate.getDate() + 14);
          break;
        case "monthly":
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
        default:
          return dates;
      }
    }

    return dates;
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
    if (!locationDetail.trim()) {
      Alert.alert(
        "Missing Information",
        "Please enter a specific venue or address."
      );
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

    // Validate paid events require Stripe
    const eventPrice = parseInt(price) || 0;
    if (eventPrice > 0) {
      const canCreatePaid = userProfile?.hostConfig?.canCreatePaidEvents;
      if (!canCreatePaid) {
        Alert.alert(
          "Cannot Create Paid Event",
          "You need to connect and verify your Stripe account before creating paid events.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Go to Stripe Settings",
              onPress: () => navigation.navigate("StripeConnect"),
            },
          ]
        );
        return;
      }
    }

    // Validate datetime is in the future
    if (eventDate <= new Date()) {
      Alert.alert(
        "Invalid Date/Time",
        "Event must be scheduled for a future date and time."
      );
      return;
    }

    // Validate recurrence end date
    if (recurrenceType !== "none" && recurrenceEndDate <= eventDate) {
      Alert.alert(
        "Invalid End Date",
        "Recurrence end date must be after the first event date."
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

      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Error", "You must be logged in to create an event.");
        setLoading(false);
        return;
      }

      // Build full location string: "Venue, City"
      const fullLocation = `${locationDetail.trim()}, ${getCityLabel(
        selectedCity
      )}`;

      // Generate recurrence group ID if recurring
      const recurrenceGroupId =
        recurrenceType !== "none"
          ? `recurrence_${Date.now()}_${Math.random()
              .toString(36)
              .substr(2, 9)}`
          : null;

      // Get all dates for recurring events
      const eventDates =
        recurrenceType !== "none"
          ? generateRecurringDates(eventDate, recurrenceEndDate, recurrenceType)
          : [eventDate];

      console.log(`📅 Creating ${eventDates.length} event(s)...`);

      // Limit to prevent too many events
      if (eventDates.length > 52) {
        Alert.alert(
          "Too Many Events",
          "You can create a maximum of 52 recurring events at once."
        );
        setLoading(false);
        return;
      }

      // Base event data
      const baseEventData = {
        title: title.trim(),
        description: description.trim(),
        category: selectedCategory,
        language: selectedLanguage,
        city: selectedCity,
        location: fullLocation,
        maxPeople: parseInt(maxPeople),
        price: isFree ? 0 : parseFloat(price),
        currency: "MXN",
        hostName: userData?.name || userData?.displayName || "Anonymous",
        creatorId: user.uid,
        createdBy: user.uid,
        attendees: [],
        participantCount: 0,
        status: "active",
        isRecurring: recurrenceType !== "none",
        recurrenceType: recurrenceType !== "none" ? recurrenceType : null,
        recurrenceGroupId: recurrenceGroupId,
        recurrenceEndDate:
          recurrenceType !== "none" ? recurrenceEndDate.toISOString() : null,
      };

      // Create events
      if (eventDates.length === 1) {
        const eventData = {
          ...baseEventData,
          date: eventDates[0].toISOString(),
          images: [], // Will be updated after upload
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        const eventDocRef = await addDoc(collection(db, "events"), eventData);

        // Upload images if any
        if (eventImages.length > 0) {
          console.log(`📸 Uploading ${eventImages.length} images...`);
          try {
            const imageUrls = await uploadEventImages(
              eventDocRef.id,
              eventImages
            );
            await updateDoc(eventDocRef, { images: imageUrls });
            console.log("✅ Images uploaded and saved to event");
          } catch (imageError) {
            console.error("⚠️ Error uploading images:", imageError);
            // Event was created, just images failed - don't block
            Alert.alert(
              "Partial Success",
              "Event created but images could not be uploaded. You can add them later by editing the event."
            );
          }
        }
      } else {
        // For recurring events, only add images to the first event
        const batchSize = 500;
        let firstEventId = null;

        for (let i = 0; i < eventDates.length; i += batchSize) {
          const batch = writeBatch(db);
          const chunk = eventDates.slice(i, i + batchSize);

          chunk.forEach((date, index) => {
            const eventRef = doc(collection(db, "events"));
            if (i === 0 && index === 0) {
              firstEventId = eventRef.id;
            }
            const eventData = {
              ...baseEventData,
              date: date.toISOString(),
              images: [], // Will be updated for first event
              eventIndex: i + index + 1,
              totalInSeries: eventDates.length,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            batch.set(eventRef, eventData);
          });

          await batch.commit();
        }

        // Upload images for first recurring event
        if (eventImages.length > 0 && firstEventId) {
          console.log(
            `📸 Uploading ${eventImages.length} images for first recurring event...`
          );
          try {
            const imageUrls = await uploadEventImages(
              firstEventId,
              eventImages
            );
            await updateDoc(doc(db, "events", firstEventId), {
              images: imageUrls,
            });
            console.log("✅ Images uploaded for first recurring event");
          } catch (imageError) {
            console.error("⚠️ Error uploading images:", imageError);
          }
        }
      }

      setCreatedEventTitle(title.trim());
      setCreatedEventsCount(eventDates.length);
      setShowSuccessModal(true);
    } catch (error) {
      console.error("❌ Error creating event:", error);
      Alert.alert("Error", "Failed to create event. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // iOS Date Picker Modal
  const renderIOSDatePicker = () => (
    <Modal
      visible={showDatePicker}
      transparent
      animationType="slide"
      onRequestClose={() => setShowDatePicker(false)}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.pickerModal,
            { backgroundColor: isDark ? "#1a1a2e" : "#ffffff" },
          ]}
        >
          <View style={styles.pickerHeader}>
            <TouchableOpacity onPress={() => setShowDatePicker(false)}>
              <Text
                style={[styles.pickerCancel, { color: colors.textSecondary }]}
              >
                Cancel
              </Text>
            </TouchableOpacity>
            <Text style={[styles.pickerTitle, { color: colors.text }]}>
              Select Date
            </Text>
            <TouchableOpacity onPress={confirmDateSelection}>
              <Text style={[styles.pickerDone, { color: colors.primary }]}>
                Done
              </Text>
            </TouchableOpacity>
          </View>
          <DateTimePicker
            value={tempDate}
            mode="date"
            display="spinner"
            onChange={onDateChange}
            minimumDate={new Date()}
            textColor={colors.text}
            themeVariant={isDark ? "dark" : "light"}
            style={styles.iosPicker}
          />
        </View>
      </View>
    </Modal>
  );

  // iOS Time Picker Modal
  const renderIOSTimePicker = () => (
    <Modal
      visible={showTimePicker}
      transparent
      animationType="slide"
      onRequestClose={() => setShowTimePicker(false)}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.pickerModal,
            { backgroundColor: isDark ? "#1a1a2e" : "#ffffff" },
          ]}
        >
          <View style={styles.pickerHeader}>
            <TouchableOpacity onPress={() => setShowTimePicker(false)}>
              <Text
                style={[styles.pickerCancel, { color: colors.textSecondary }]}
              >
                Cancel
              </Text>
            </TouchableOpacity>
            <Text style={[styles.pickerTitle, { color: colors.text }]}>
              Select Time
            </Text>
            <TouchableOpacity onPress={confirmTimeSelection}>
              <Text style={[styles.pickerDone, { color: colors.primary }]}>
                Done
              </Text>
            </TouchableOpacity>
          </View>
          <DateTimePicker
            value={tempDate}
            mode="time"
            display="spinner"
            onChange={onTimeChange}
            textColor={colors.text}
            themeVariant={isDark ? "dark" : "light"}
            style={styles.iosPicker}
          />
        </View>
      </View>
    </Modal>
  );

  // iOS End Date Picker Modal
  const renderIOSEndDatePicker = () => (
    <Modal
      visible={showEndDatePicker}
      transparent
      animationType="slide"
      onRequestClose={() => setShowEndDatePicker(false)}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.pickerModal,
            { backgroundColor: isDark ? "#1a1a2e" : "#ffffff" },
          ]}
        >
          <View style={styles.pickerHeader}>
            <TouchableOpacity onPress={() => setShowEndDatePicker(false)}>
              <Text
                style={[styles.pickerCancel, { color: colors.textSecondary }]}
              >
                Cancel
              </Text>
            </TouchableOpacity>
            <Text style={[styles.pickerTitle, { color: colors.text }]}>
              Select End Date
            </Text>
            <TouchableOpacity onPress={confirmEndDateSelection}>
              <Text style={[styles.pickerDone, { color: colors.primary }]}>
                Done
              </Text>
            </TouchableOpacity>
          </View>
          <DateTimePicker
            value={tempEndDate}
            mode="date"
            display="spinner"
            onChange={onEndDateChange}
            minimumDate={eventDate}
            textColor={colors.text}
            themeVariant={isDark ? "dark" : "light"}
            style={styles.iosPicker}
          />
        </View>
      </View>
    </Modal>
  );

  const styles = createStyles(colors);

  return (
    <GradientBackground>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="back" size={28} color={colors.text} type="ui" />
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

        {/* Event Images */}
        <EventImagePicker
          images={eventImages}
          onImagesChange={setEventImages}
        />

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

        {/* Category Dropdown */}
        <SelectDropdown
          label="Category *"
          value={selectedCategory}
          onValueChange={setSelectedCategory}
          options={EVENT_CATEGORIES}
          placeholder="Select a category"
          type="category"
        />

        {/* Language Dropdown */}
        <SelectDropdown
          label="Language"
          value={selectedLanguage}
          onValueChange={setSelectedLanguage}
          options={EVENT_LANGUAGES}
          placeholder="Select language"
          type="language"
        />

        {/* City Dropdown */}
        <SelectDropdown
          label="City *"
          value={selectedCity}
          onValueChange={setSelectedCity}
          options={cityOptions}
          placeholder="Select a city"
          type="location"
        />

        {/* Specific Location/Venue */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>
            Venue / Address *
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
            <Icon
              name="location"
              size={20}
              color={colors.textSecondary}
              type="ui"
              style={{ marginRight: 12 }}
            />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="e.g., Beach Club XYZ, Calle 10..."
              placeholderTextColor={colors.textTertiary}
              value={locationDetail}
              onChangeText={setLocationDetail}
            />
          </View>
        </View>

        {/* Recurrence Type */}
        <SelectDropdown
          label="Event Frequency"
          value={recurrenceType}
          onValueChange={setRecurrenceType}
          options={RECURRENCE_OPTIONS}
          placeholder="Select frequency"
        />

        {/* Date and Time */}
        <View style={styles.row}>
          <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
            <Text style={[styles.label, { color: colors.text }]}>
              {recurrenceType !== "none" ? "Start Date *" : "Date *"}
            </Text>
            <TouchableOpacity
              style={[
                styles.pickerButton,
                {
                  backgroundColor: colors.surfaceGlass,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => {
                setTempDate(eventDate);
                setShowDatePicker(true);
              }}
            >
              <Text style={[styles.pickerText, { color: colors.text }]}>
                {formatDate(eventDate)}
              </Text>
              <Icon
                name="calendar"
                size={20}
                color={colors.textSecondary}
                type="ui"
              />
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
              onPress={() => {
                setTempDate(eventDate);
                setShowTimePicker(true);
              }}
            >
              <Text style={[styles.pickerText, { color: colors.text }]}>
                {formatTime(eventDate)}
              </Text>
              <Icon
                name="clock"
                size={20}
                color={colors.textSecondary}
                type="ui"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Recurrence End Date */}
        {recurrenceType !== "none" && (
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.text }]}>
              Repeat Until *
            </Text>
            <TouchableOpacity
              style={[
                styles.pickerButton,
                {
                  backgroundColor: colors.surfaceGlass,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => {
                setTempEndDate(recurrenceEndDate);
                setShowEndDatePicker(true);
              }}
            >
              <Text style={[styles.pickerText, { color: colors.text }]}>
                {formatDate(recurrenceEndDate)}
              </Text>
              <Icon
                name="calendar"
                size={20}
                color={colors.textSecondary}
                type="ui"
              />
            </TouchableOpacity>
            <Text style={[styles.helperText, { color: colors.textTertiary }]}>
              {recurrenceType === "daily" && "Events will be created daily"}
              {recurrenceType === "weekly" &&
                "Events will be created every week"}
              {recurrenceType === "biweekly" &&
                "Events will be created every 2 weeks"}
              {recurrenceType === "monthly" &&
                "Events will be created every month"}
            </Text>
          </View>
        )}

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
              <Icon
                name="gift"
                size={20}
                color={isFree ? colors.primary : colors.text}
                type="ui"
              />
              <Text
                style={[
                  styles.toggleLabel,
                  { color: isFree ? colors.primary : colors.text },
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
              <Icon
                name="dollar"
                size={20}
                color={!isFree ? colors.primary : colors.text}
                type="ui"
              />
              <Text
                style={[
                  styles.toggleLabel,
                  { color: !isFree ? colors.primary : colors.text },
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
              <Icon
                name="users"
                size={20}
                color={colors.textSecondary}
                type="ui"
                style={{ marginRight: 12 }}
              />
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
                  backgroundColor: colors.surfaceGlass,
                  borderColor: colors.border,
                  opacity: isFree ? 0.5 : 1,
                },
              ]}
            >
              <Icon
                name="dollar"
                size={20}
                color={colors.textSecondary}
                type="ui"
                style={{ marginRight: 12 }}
              />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder={isFree ? "0" : "100"}
                placeholderTextColor={colors.textTertiary}
                value={isFree ? "0" : price}
                onChangeText={handlePriceChange}
                keyboardType="numeric"
                editable={!isFree}
              />
            </View>
          </View>
        </View>

        {/* Payment info badge */}
        {!isFree && price && parseInt(price) > 0 && (
          <View
            style={[
              styles.infoBadge,
              { backgroundColor: `${colors.primary}15` },
            ]}
          >
            <Text style={[styles.infoText, { color: colors.primary }]}>
              💰 You'll receive 95% of each ticket sale. BondVibe takes 5%
              platform fee.
            </Text>
          </View>
        )}

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
            {recurrenceType !== "none" &&
              "\n• Recurring events create independent instances"}
          </Text>
        </View>

        {/* Create Button */}
        <TouchableOpacity
          style={[styles.createButton, { opacity: loading ? 0.7 : 1 }]}
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
                <Icon name="plus" size={20} color={colors.primary} type="ui" />
                <Text style={[styles.createText, { color: colors.primary }]}>
                  {recurrenceType !== "none"
                    ? "Create Recurring Events"
                    : "Create Event"}
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
        eventsCount={createdEventsCount}
      />

      {/* iOS Pickers */}
      {Platform.OS === "ios" && renderIOSDatePicker()}
      {Platform.OS === "ios" && renderIOSTimePicker()}
      {Platform.OS === "ios" && renderIOSEndDatePicker()}

      {/* Android Pickers */}
      {Platform.OS === "android" && showDatePicker && (
        <DateTimePicker
          value={eventDate}
          mode="date"
          display="default"
          onChange={onDateChange}
          minimumDate={new Date()}
        />
      )}
      {Platform.OS === "android" && showTimePicker && (
        <DateTimePicker
          value={eventDate}
          mode="time"
          display="default"
          onChange={onTimeChange}
        />
      )}
      {Platform.OS === "android" && showEndDatePicker && (
        <DateTimePicker
          value={recurrenceEndDate}
          mode="date"
          display="default"
          onChange={onEndDateChange}
          minimumDate={eventDate}
        />
      )}
    </GradientBackground>
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
    headerTitle: { fontSize: 20, fontWeight: "700", letterSpacing: -0.3 },
    scrollView: { flex: 1 },
    content: { padding: 20, paddingBottom: 40 },
    field: { marginBottom: 20 },
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
    input: { flex: 1, fontSize: 16, paddingVertical: 16 },
    textAreaWrapper: { borderWidth: 1, borderRadius: 16, padding: 16 },
    textArea: { fontSize: 16, minHeight: 100 },
    charCount: { fontSize: 12, marginTop: 8, textAlign: "right" },
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
    toggleLabel: { fontSize: 16, fontWeight: "600" },
    row: { flexDirection: "row", marginBottom: 20 },
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
    helperText: { fontSize: 13, marginTop: 8, fontStyle: "italic" },
    infoBadge: {
      padding: 12,
      borderRadius: 10,
      marginTop: -8,
      marginBottom: 20,
    },
    infoText: { fontSize: 13, lineHeight: 19 },
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
      gap: 8,
    },
    createText: { fontSize: 18, fontWeight: "700", letterSpacing: -0.2 },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "flex-end",
    },
    pickerModal: {
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingBottom: 34,
    },
    pickerHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: "rgba(255,255,255,0.1)",
    },
    pickerTitle: { fontSize: 17, fontWeight: "600" },
    pickerCancel: { fontSize: 16 },
    pickerDone: { fontSize: 16, fontWeight: "600" },
    iosPicker: { height: 200 },
  });
}
