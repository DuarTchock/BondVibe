import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import all screens
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import EventFeedScreen from '../screens/EventFeedScreen';
import ProfileScreen from '../screens/ProfileScreen';
import CreateEventScreen from '../screens/CreateEventScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import SearchEventsScreen from '../screens/SearchEventsScreen';
import EventDetailScreen from '../screens/EventDetailScreen';
import MyEventsScreen from '../screens/MyEventsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import EventChatScreen from '../screens/EventChatScreen';
import RequestHostScreen from '../screens/RequestHostScreen';
import LegalScreen from '../screens/LegalScreen';
import EmailVerificationScreen from '../screens/EmailVerificationScreen';
import ProfileSetupScreen from '../screens/ProfileSetupScreen';
import EditEventScreen from '../screens/EditEventScreen';
import SafetyCenterScreen from '../screens/SafetyCenterScreen';
import ReportScreen from '../screens/ReportScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0B0F1A' },
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Legal" component={LegalScreen} />
        <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} />
        <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="EventFeed" component={EventFeedScreen} />
        <Stack.Screen name="SearchEvents" component={SearchEventsScreen} />
        <Stack.Screen name="EventDetail" component={EventDetailScreen} />
        <Stack.Screen name="EditEvent" component={EditEventScreen} />
        <Stack.Screen name="MyEvents" component={MyEventsScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="CreateEvent" component={CreateEventScreen} />
        <Stack.Screen name="EventChat" component={EventChatScreen} />
        <Stack.Screen name="RequestHost" component={RequestHostScreen} />
        <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="SafetyCenter" component={SafetyCenterScreen} />
        <Stack.Screen name="Report" component={ReportScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
