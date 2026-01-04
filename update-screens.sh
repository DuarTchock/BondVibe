#!/bin/bash
SCREENS=("EventDetailScreen" "SearchEventsScreen" "MyEventsScreen" "NotificationsScreen" "CreateEventScreen" "EditEventScreen" "AdminDashboardScreen" "ConversationsScreen" "EventChatScreen" "HostTypeSelectionScreen" "LegalScreen" "LoginScreen" "PersonalityQuizScreen" "PersonalityResultsScreen" "PersonalityTestScreen" "ProfileSetupScreen" "RequestHostScreen" "SignupScreen" "StripeConnectScreen" "WelcomeScreen" "ChatScreen")

for screen in "${SCREENS[@]}"; do
  FILE="src/screens/${screen}.js"
  if [ -f "$FILE" ]; then
    if ! grep -q "GradientBackground" "$FILE"; then
      sed -i '' '/^import.*from "react-native";$/a\
import GradientBackground from "../components/GradientBackground";
' "$FILE"
      echo "✅ Added import to $screen"
    fi
    sed -i '' 's/<View style={\[styles\.container, { backgroundColor: colors\.background }\]}>/<GradientBackground>/g' "$FILE"
  fi
done
echo "Done! Now manually check closing </View> tags"
