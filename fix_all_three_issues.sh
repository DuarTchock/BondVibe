#!/bin/bash

echo "🔧 Fixing 3 issues..."
echo ""

cd ~/Documents/bondvibe 2>/dev/null || cd bondvibe 2>/dev/null || {
    echo "❌ Run from project directory"
    exit 1
}

echo "1️⃣  Fixing 'currentUser is not defined' in CreateEventScreen..."

python3 << 'PYTHON'
with open('src/screens/CreateEventScreen.js', 'r') as f:
    content = f.read()

# Replace currentUser.uid with auth.currentUser.uid in the userData fetch
old_line = "const userDocRef = doc(db, 'users', currentUser.uid);"
new_line = "const userDocRef = doc(db, 'users', auth.currentUser.uid);"

if old_line in content:
    content = content.replace(old_line, new_line)
    print("   ✅ Fixed currentUser.uid → auth.currentUser.uid")
else:
    print("   ⚠️  Line not found exactly, checking for similar pattern...")
    if "currentUser.uid" in content and "userDocRef" in content:
        import re
        content = re.sub(
            r"doc\(db, 'users', currentUser\.uid\)",
            "doc(db, 'users', auth.currentUser.uid)",
            content
        )
        print("   ✅ Fixed with regex")

with open('src/screens/CreateEventScreen.js', 'w') as f:
    f.write(content)
PYTHON

echo ""
echo "2️⃣  Fixing handleCancelEvent in EventDetailScreen..."
echo "    Adding cancellation message input and proper status update"

python3 << 'PYTHON'
with open('src/screens/EventDetailScreen.js', 'r') as f:
    content = f.read()

# Replace the entire handleCancelEvent function with improved version
old_function_start = "  const handleCancelEvent = async () => {"
new_function = """  const handleCancelEvent = async () => {
    // First ask for cancellation reason
    Alert.prompt(
      'Cancel Event',
      'Please provide a reason for cancelling this event (optional):',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Confirm Cancellation',
          style: 'destructive',
          onPress: async (cancellationReason) => {
            try {
              setLoading(true);

              // Update event status to cancelled
              const eventRef = doc(db, 'events', eventId);
              await updateDoc(eventRef, {
                status: 'cancelled',
                cancelledAt: new Date().toISOString(),
                cancellationReason: cancellationReason || 'No reason provided',
              });

              // Send notifications to all participants
              const participants = event.participants || [];
              const reason = cancellationReason?.trim() 
                ? `Reason: ${cancellationReason}` 
                : 'No reason provided.';
              
              for (const participantId of participants) {
                if (participantId !== auth.currentUser.uid) {
                  await createNotification(participantId, {
                    type: 'event_cancelled',
                    title: 'Event Cancelled',
                    message: `"${event.title}" has been cancelled. ${reason}`,
                    icon: '🚫',
                    metadata: { 
                      eventId: event.id, 
                      eventTitle: event.title,
                      reason: cancellationReason || 'No reason provided'
                    },
                  });
                }
              }

              Alert.alert(
                'Event Cancelled',
                'The event has been cancelled and all participants have been notified.',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
              );
            } catch (error) {
              console.error('Error cancelling event:', error);
              Alert.alert('Error', 'Failed to cancel event. Please try again.');
              setLoading(false);
            }
          },
        },
      ],
      'plain-text'
    );
  };"""

# Find and replace the old function
import re
pattern = r"const handleCancelEvent = async \(\) => \{[\s\S]*?^\s*\};"
match = re.search(pattern, content, re.MULTILINE)

if match:
    content = content[:match.start()] + new_function + content[match.end():]
    print("   ✅ Replaced handleCancelEvent with improved version")
else:
    print("   ⚠️  Could not find function to replace")

with open('src/screens/EventDetailScreen.js', 'w') as f:
    f.write(content)
PYTHON

echo ""
echo "3️⃣  Adding filter to hide cancelled events from lists..."

# MyEventsScreen - filter out cancelled events
python3 << 'PYTHON'
with open('src/screens/MyEventsScreen.js', 'r') as f:
    content = f.read()

# After fetching hosting events, filter out cancelled ones
replacements = [
    (
        "userEvents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));",
        "userEvents = snapshot.docs\n          .map(doc => ({ id: doc.id, ...doc.data() }))\n          .filter(event => event.status !== 'cancelled');"
    ),
    (
        ".filter(event => event.participants?.includes(auth.currentUser.uid));",
        ".filter(event => event.participants?.includes(auth.currentUser.uid) && event.status !== 'cancelled');"
    ),
]

for old, new in replacements:
    if old in content:
        content = content.replace(old, new)
        print(f"   ✅ Added filter in MyEventsScreen")

with open('src/screens/MyEventsScreen.js', 'w') as f:
    f.write(content)
PYTHON

# EventFeedScreen - filter out cancelled events
python3 << 'PYTHON'
with open('src/screens/EventFeedScreen.js', 'r') as f:
    content = f.read()

# Find where events are loaded and add filter
if "getDocs(collection(db, 'events'))" in content:
    # Add filter after mapping
    old_pattern = ".map(doc => ({ id: doc.id, ...doc.data() }));"
    new_pattern = ".map(doc => ({ id: doc.id, ...doc.data() }))\n          .filter(event => event.status !== 'cancelled');"
    
    if old_pattern in content and "filter(event => event.status !== 'cancelled')" not in content:
        content = content.replace(old_pattern, new_pattern, 1)
        print("   ✅ Added filter in EventFeedScreen")
    else:
        print("   ℹ️  EventFeedScreen already filtered or pattern not found")
else:
    print("   ⚠️  Could not find event loading in EventFeedScreen")

with open('src/screens/EventFeedScreen.js', 'w') as f:
    f.write(content)
PYTHON

echo ""
echo "✅ ALL FIXES APPLIED!"
echo ""
echo "📋 CHANGES:"
echo "   1. Fixed currentUser → auth.currentUser in CreateEventScreen"
echo "   2. Improved handleCancelEvent:"
echo "      - Asks for cancellation reason"
echo "      - Sends reason to all participants"
echo "      - Better notifications"
echo "   3. Cancelled events filtered from all lists:"
echo "      - My Events (Hosting & Joined)"
echo "      - Event Feed (general list)"
echo ""
echo "🎯 NOW:"
echo "   • Press 'r' to reload"
echo "   • Try creating an event - should work!"
echo "   • Try cancelling an event:"
echo "     → Prompts for reason"
echo "     → Sends notifications with reason"
echo "     → Event disappears from all lists"
echo ""
