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
import { auth, db } from '../services/firebase';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import Colors from '../constants/Colors';
import Sizes from '../constants/Sizes';
import { categories } from '../utils/mockEvents';

export default function CreateEventScreen({ navigation }) {
  const [userRole, setUserRole] = useState('user');
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Social');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('');
  const [location, setLocation] = useState('');
  const [price, setPrice] = useState('');
  const [maxAttendees, setMaxAttendees] = useState('');
  const [whatsIncluded, setWhatsIncluded] = useState('');

  React.useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        setUserRole(userDoc.data().role || 'user');
      }
    } catch (error) {
      console.error('Error checking role:', error);
    }
  };

  const handleCreateEvent = async () => {
    // Validations
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter an event title');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }
    if (!date || !time) {
      Alert.alert('Error', 'Please select date and time');
      return;
    }
    if (!location.trim()) {
      Alert.alert('Error', 'Please enter a location');
      return;
    }
    if (!maxAttendees || parseInt(maxAttendees) < 2) {
      Alert.alert('Error', 'Minimum 2 attendees required');
      return;
    }

    setLoading(true);

    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      const userData = userDoc.data();

      // Determine status based on role
      let status = 'pending';
      let hostType = 'community';
      
      if (userRole === 'admin') {
        status = 'published';
        hostType = 'official';
      } else if (userRole === 'verified_host') {
        status = 'published'; // or 'pending' if you want manual approval
        hostType = 'community';
      }

      const eventData = {
        title: title.trim(),
        description: description.trim(),
        category,
        date: `${date}T${time}:00`,
        duration: duration || '2 hours',
        location: location.trim(),
        price: price ? parseInt(price) : 0,
        maxAttendees: parseInt(maxAttendees),
        currentAttendees: 0,
        hostId: auth.currentUser.uid,
        hostName: userData.fullName,
        hostAvatar: userData.avatar,
        hostType,
        status,
        whatsIncluded: whatsIncluded.split(',').map(item => item.trim()).filter(item => item),
        language: ['Spanish'],
        attendees: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (status === 'published') {
        eventData.publishedAt = new Date().toISOString();
      }

      await addDoc(collection(db, 'events'), eventData);

      Alert.alert(
        'Success!',
        status === 'published' 
          ? 'Event created and published!' 
          : 'Event submitted for review. You\'ll be notified when approved.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Create event error:', error);
      Alert.alert('Error', 'Failed to create event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestHostAccess = () => {
    Alert.alert(
      'Become a Host',
      'To create events, you need to become a verified host. Would you like to request access?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request Access',
          onPress: () => navigation.navigate('RequestHost'),
        },
      ]
    );
  };

  // If user is not verified, show request screen
  if (userRole === 'user') {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.restrictedContainer}>
          <Text style={styles.restrictedEmoji}>🎯</Text>
          <Text style={styles.restrictedTitle}>Become a Host</Text>
          <Text style={styles.restrictedText}>
            Want to organize events and bring people together?
          </Text>
          <Text style={styles.restrictedSubtext}>
            Verified hosts can create and manage events on BondVibe.
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={handleRequestHostAccess}
          >
            <Text style={styles.buttonText}>Request Host Access</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backLink}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Create Event</Text>
        {userRole === 'admin' && (
          <View style={styles.adminBadge}>
            <Text style={styles.adminBadgeText}>OFFICIAL</Text>
          </View>
        )}
        {userRole === 'verified_host' && (
          <View style={styles.hostBadge}>
            <Text style={styles.hostBadgeText}>VERIFIED HOST</Text>
          </View>
        )}
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Event Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="Wine Tasting & Cheese Pairing"
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe your event..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
        />

        <Text style={styles.label}>Category *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {categories.filter(cat => cat !== 'All').map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryChip, category === cat && styles.categoryChipActive]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[styles.categoryText, category === cat && styles.categoryTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Date *</Text>
            <TextInput
              style={styles.input}
              placeholder="2025-11-20"
              value={date}
              onChangeText={setDate}
            />
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Time *</Text>
            <TextInput
              style={styles.input}
              placeholder="19:00"
              value={time}
              onChangeText={setTime}
            />
          </View>
        </View>

        <Text style={styles.label}>Duration</Text>
        <TextInput
          style={styles.input}
          placeholder="2 hours"
          value={duration}
          onChangeText={setDuration}
        />

        <Text style={styles.label}>Location *</Text>
        <TextInput
          style={styles.input}
          placeholder="Centro Histórico, Guadalajara"
          value={location}
          onChangeText={setLocation}
        />

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Price (MXN)</Text>
            <TextInput
              style={styles.input}
              placeholder="0 for free"
              value={price}
              onChangeText={setPrice}
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Max Attendees *</Text>
            <TextInput
              style={styles.input}
              placeholder="8"
              value={maxAttendees}
              onChangeText={setMaxAttendees}
              keyboardType="number-pad"
            />
          </View>
        </View>

        <Text style={styles.label}>What's Included (comma separated)</Text>
        <TextInput
          style={styles.input}
          placeholder="Wine, Cheese, Sommelier"
          value={whatsIncluded}
          onChangeText={setWhatsIncluded}
        />

        <TouchableOpacity
          style={[styles.createButton, loading && styles.buttonDisabled]}
          onPress={handleCreateEvent}
          disabled={loading}
        >
          <Text style={styles.createButtonText}>
            {loading ? 'Creating...' : 'Create Event'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  restrictedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Sizes.padding * 2,
  },
  restrictedEmoji: {
    fontSize: 80,
    marginBottom: 24,
  },
  restrictedTitle: {
    fontSize: Sizes.fontSize.xlarge,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  restrictedText: {
    fontSize: Sizes.fontSize.medium,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  restrictedSubtext: {
    fontSize: Sizes.fontSize.small,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: 32,
  },
  header: {
    padding: Sizes.padding * 2,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backLink: {
    fontSize: Sizes.fontSize.medium,
    color: Colors.primary,
    marginBottom: 12,
  },
  title: {
    fontSize: Sizes.fontSize.xlarge,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 8,
  },
  adminBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  adminBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
  },
  hostBadge: {
    backgroundColor: Colors.success,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  hostBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFF',
  },
  form: {
    padding: Sizes.padding * 2,
  },
  label: {
    fontSize: Sizes.fontSize.medium,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8F9FA',
    padding: Sizes.padding,
    borderRadius: Sizes.borderRadius,
    marginBottom: 16,
    fontSize: Sizes.fontSize.medium,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  categoryScroll: {
    marginBottom: 16,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
  },
  categoryText: {
    fontSize: Sizes.fontSize.small,
    color: Colors.text,
  },
  categoryTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    flex: 1,
    marginRight: 8,
  },
  createButton: {
    backgroundColor: Colors.primary,
    padding: Sizes.padding + 4,
    borderRadius: Sizes.borderRadius,
    alignItems: 'center',
    marginTop: 16,
  },
  button: {
    backgroundColor: Colors.primary,
    padding: Sizes.padding,
    borderRadius: Sizes.borderRadius,
    width: 250,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: Sizes.fontSize.large,
    fontWeight: '700',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: Sizes.fontSize.medium,
    fontWeight: '600',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: Colors.primary,
    fontSize: Sizes.fontSize.medium,
  },
});
