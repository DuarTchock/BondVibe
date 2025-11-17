import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Colors, Radius, Typography, Spacing, Shadows } from '../constants/DesignSystem';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

// Import Modern Screens
import ModernLoginScreen from '../screens/modern/LoginScreen';
import ModernHomeScreen from '../screens/modern/ModernHomeScreen';
import ModernEventFeed from '../screens/modern/ModernEventFeed';
import ModernProfileScreen from '../screens/modern/ModernProfileScreen';
import ModernCreateEventScreen from '../screens/modern/ModernCreateEventScreen';
import ModernAdminDashboard from '../screens/modern/ModernAdminDashboard';

// Import existing screens that haven't been modernized yet
import SearchEventsScreen from '../screens/SearchEventsScreen';
import EventDetailScreen from '../screens/EventDetailScreen';
import MyEventsScreen from '../screens/MyEventsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import EventChatScreen from '../screens/EventChatScreen';
import RequestHostScreen from '../screens/RequestHostScreen';
import LegalScreen from '../screens/LegalScreen';
import EmailVerificationScreen from '../screens/EmailVerificationScreen';
import ProfileSetupScreen from '../screens/ProfileSetupScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Custom Tab Bar Component
function ModernTabBar({ state, descriptors, navigation }) {
  return (
    <View style={styles.tabBarContainer}>
      <BlurView intensity={40} tint="dark" style={styles.tabBarBlur}>
        <View style={styles.tabBar}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            // Tab Icons
            const getIcon = () => {
              switch (route.name) {
                case 'Home':
                  return '🏠';
                case 'Explore':
                  return '🎯';
                case 'MyEvents':
                  return '📅';
                case 'Profile':
                  return '👤';
                default:
                  return '•';
              }
            };

            const getLabel = () => {
              switch (route.name) {
                case 'Home':
                  return 'Home';
                case 'Explore':
                  return 'Explore';
                case 'MyEvents':
                  return 'Events';
                case 'Profile':
                  return 'Profile';
                default:
                  return route.name;
              }
            };

            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarTestID}
                onPress={onPress}
                style={styles.tabItem}
              >
                {isFocused ? (
                  <View style={styles.tabItemActive}>
                    <LinearGradient
                      colors={['#667EEA', '#764BA2']}
                      style={styles.tabItemGradient}
                    >
                      <Text style={styles.tabIconActive}>{getIcon()}</Text>
                      <Text style={styles.tabLabelActive}>{getLabel()}</Text>
                    </LinearGradient>
                  </View>
                ) : (
                  <>
                    <Text style={styles.tabIcon}>{getIcon()}</Text>
                    <Text style={styles.tabLabel}>{getLabel()}</Text>
                  </>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}

// Bottom Tab Navigator
function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <ModernTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={ModernHomeScreen} />
      <Tab.Screen name="Explore" component={ModernEventFeed} />
      <Tab.Screen name="MyEvents" component={MyEventsScreen} />
      <Tab.Screen name="Profile" component={ModernProfileScreen} />
    </Tab.Navigator>
  );
}

// Main Navigation
export default function ModernNavigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: Colors.dark.background },
        }}
      >
        <Stack.Screen name="Login" component={ModernLoginScreen} />
        <Stack.Screen name="Legal" component={LegalScreen} />
        <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} />
        <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="EventFeed" component={ModernEventFeed} />
        <Stack.Screen name="SearchEvents" component={SearchEventsScreen} />
        <Stack.Screen name="EventDetail" component={EventDetailScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="CreateEvent" component={ModernCreateEventScreen} />
        <Stack.Screen name="EventChat" component={EventChatScreen} />
        <Stack.Screen name="RequestHost" component={RequestHostScreen} />
        <Stack.Screen name="AdminDashboard" component={ModernAdminDashboard} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    ...Shadows.xl,
  },
  tabBarBlur: {
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  tabBar: {
    flexDirection: 'row',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
  },
  tabItemActive: {
    borderRadius: Radius.md,
    overflow: 'hidden',
    ...Shadows.glow,
  },
  tabItemGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xs,
  },
  tabIcon: {
    fontSize: 24,
    marginBottom: 4,
    opacity: 0.6,
  },
  tabIconActive: {
    fontSize: 20,
  },
  tabLabel: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
    fontSize: 11,
  },
  tabLabelActive: {
    ...Typography.small,
    color: Colors.dark.text,
    fontSize: 12,
    fontWeight: '600',
  },
});
