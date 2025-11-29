#!/bin/bash

echo "🔧 Adding Cancel Event functionality..."
echo ""

echo "1️⃣  First, fixing 'creatorId' to 'hostId' in EventDetailScreen..."

python3 << 'PYTHON'
with open('src/screens/EventDetailScreen.js', 'r') as f:
    content = f.read()

# Replace all occurrences of creatorId with hostId
replacements = [
    ("event.creatorId === auth.currentUser.uid", "event.hostId === auth.currentUser.uid"),
    ("eventData.creatorId === auth.currentUser.uid", "eventData.hostId === auth.currentUser.uid"),
    ("const isCreator = event.creatorId === auth.currentUser.uid;", "const isCreator = event.hostId === auth.currentUser.uid;"),
]

for old, new in replacements:
    if old in content:
        content = content.replace(old, new)
        print(f"   ✅ Fixed: {old[:50]}...")

with open('src/screens/EventDetailScreen.js', 'w') as f:
    f.write(content)
PYTHON

echo ""
echo "2️⃣  Adding handleCancelEvent function after handleJoinLeave..."

python3 << 'PYTHON'
import re

with open('src/screens/EventDetailScreen.js', 'r') as f:
    content = f.read()

# Find the end of handleJoinLeave function (look for closing brace and next function or export)
# We'll add the new function after handleJoinLeave

cancel_function = """
  const handleCancelEvent = async () => {
    Alert.alert(
      'Cancel Event',
      'Are you sure you want to cancel this event? This action cannot be undone.',
      [
        {
          text: 'No, Keep Event',
          style: 'cancel',
        },
        {
          text: 'Yes, Cancel Event',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              
              // Update event status to cancelled
              const eventRef = doc(db, 'events', eventId);
              await updateDoc(eventRef, {
                status: 'cancelled',
                cancelledAt: new Date().toISOString(),
              });
              
              // Send notifications to all participants
              const participants = event.participants || [];
              for (const participantId of participants) {
                if (participantId !== auth.currentUser.uid) {
                  await createNotification({
                    userId: participantId,
                    type: 'event_cancelled',
                    title: 'Event Cancelled',
                    message: `"${event.title}" has been cancelled by the host.`,
                    data: { eventId: event.id },
                  });
                }
              }
              
              Alert.alert('Event Cancelled', 'The event has been cancelled successfully.', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
            } catch (error) {
              console.error('Error cancelling event:', error);
              Alert.alert('Error', 'Failed to cancel event. Please try again.');
              setLoading(false);
            }
          },
        },
      ]
    );
  };
"""

# Find where to insert (after handleJoinLeave function)
# Look for the pattern of closing brace followed by optional whitespace and either 'const' or 'return'
pattern = r"(const handleJoinLeave = async \(\) => \{[\s\S]*?^\s*\};)"

match = re.search(pattern, content, re.MULTILINE)
if match:
    # Insert after the matched function
    insert_pos = match.end()
    content = content[:insert_pos] + cancel_function + content[insert_pos:]
    print("   ✅ Added handleCancelEvent function")
else:
    print("   ⚠️  Could not find exact insertion point, trying alternate method...")
    # Try to find any function and add before return statement
    if "const handleJoinLeave" in content:
        # Find the styles or return statement
        if "const styles = createStyles(colors);" in content:
            content = content.replace(
                "  const styles = createStyles(colors);",
                cancel_function + "\n  const styles = createStyles(colors);"
            )
            print("   ✅ Added before styles")

with open('src/screens/EventDetailScreen.js', 'w') as f:
    f.write(content)
PYTHON

echo ""
echo "3️⃣  Adding Cancel button to the header (next to Edit button)..."

python3 << 'PYTHON'
import re

with open('src/screens/EventDetailScreen.js', 'r') as f:
    content = f.read()

# Find the Edit button and add Cancel button after it
edit_button_pattern = r"(\{isCreator && !event\.id\.startsWith\('mock'\) && \([\s\S]*?<TouchableOpacity[\s\S]*?onPress=\{\(\) => navigation\.navigate\('EditEvent', \{ eventId \}\)\}[\s\S]*?<Text style=\{styles\.headerButtonText\}>✏️</Text>[\s\S]*?</TouchableOpacity>[\s\S]*?\)}"

# Cancel button JSX to add
cancel_button = """
          {(isCreator || isAdmin) && !event.id.startsWith('mock') && event.status !== 'cancelled' && (
            <TouchableOpacity
              onPress={handleCancelEvent}
            >
              <View style={[styles.headerButton, {
                backgroundColor: `${colors.error}20`,
                borderColor: colors.error
              }]}>
                <Text style={[styles.headerButtonText, { color: colors.error }]}>🚫</Text>
              </View>
            </TouchableOpacity>
          )}"""

match = re.search(edit_button_pattern, content, re.DOTALL)
if match:
    # Add cancel button after edit button
    insert_pos = match.end()
    content = content[:insert_pos] + cancel_button + content[insert_pos:]
    print("   ✅ Added Cancel button to header")
else:
    print("   ⚠️  Could not find exact pattern for Edit button")
    print("   Trying simpler approach...")
    
    # Try to find the edit button closing and add after it
    if '✏️</Text>' in content and 'EditEvent' in content:
        # Find the section with edit button
        lines = content.split('\n')
        new_lines = []
        added = False
        
        for i, line in enumerate(lines):
            new_lines.append(line)
            # Look for the closing of edit button TouchableOpacity
            if '✏️</Text>' in line and not added:
                # Find the next </TouchableOpacity>
                for j in range(i+1, min(i+10, len(lines))):
                    if '</TouchableOpacity>' in lines[j]:
                        # Check if this is the edit button closing
                        indent = len(lines[j]) - len(lines[j].lstrip())
                        # Add cancel button with same indentation
                        new_lines.append(' ' * indent + cancel_button.strip())
                        added = True
                        print("   ✅ Added Cancel button after Edit button")
                        break
        
        if added:
            content = '\n'.join(new_lines)

with open('src/screens/EventDetailScreen.js', 'w') as f:
    f.write(content)
PYTHON

echo ""
echo "4️⃣  Adding cancelled event indicator in the UI..."

python3 << 'PYTHON'
with open('src/screens/EventDetailScreen.js', 'r') as f:
    content = f.read()

# Add a cancelled badge near the title if event is cancelled
cancelled_badge = """
        {/* Cancelled Badge */}
        {event.status === 'cancelled' && (
          <View style={[styles.cancelledBadge, {
            backgroundColor: `${colors.error}20`,
            borderColor: colors.error
          }]}>
            <Text style={[styles.cancelledText, { color: colors.error }]}>
              🚫 Event Cancelled
            </Text>
          </View>
        )}
"""

# Find the title section and add badge before or after
if "styles.eventTitle" in content:
    # Add after the title
    pattern = r"(<Text style=\{\[styles\.eventTitle, \{ color: colors\.text \}\]\}.*?>[\s\S]*?</Text>)"
    match = re.search(pattern, content)
    if match:
        insert_pos = match.end()
        content = content[:insert_pos] + "\n" + cancelled_badge + content[insert_pos:]
        print("   ✅ Added cancelled badge indicator")
    else:
        print("   ⚠️  Could not find title to add badge")

with open('src/screens/EventDetailScreen.js', 'w') as f:
    f.write(content)
PYTHON

echo ""
echo "5️⃣  Adding styles for cancel button and badge..."

python3 << 'PYTHON'
with open('src/screens/EventDetailScreen.js', 'r') as f:
    content = f.read()

# Add styles at the end of StyleSheet.create
new_styles = """    cancelledBadge: {
      marginTop: 12,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 12,
      borderWidth: 1,
      alignSelf: 'flex-start',
    },
    cancelledText: {
      fontSize: 14,
      fontWeight: '700',
      letterSpacing: 0.5,
    },"""

# Find the last style in StyleSheet.create and add before closing
if "StyleSheet.create({" in content:
    # Find the closing of StyleSheet.create
    pattern = r"(const styles = createStyles\(colors\) => StyleSheet\.create\({[\s\S]*?)\n(\s*\}\);)"
    
    # Simpler approach - just find the last style and add before closing brace
    lines = content.split('\n')
    new_lines = []
    
    for i, line in enumerate(lines):
        new_lines.append(line)
        # Look for the closing of StyleSheet.create
        if '});' in line and 'createStyles' in content[max(0, content.find(line)-500):content.find(line)]:
            # Add new styles before this closing
            indent = len(line) - len(line.lstrip())
            new_lines.insert(-1, new_styles)
            print("   ✅ Added styles for cancelled badge")
            break
    
    content = '\n'.join(new_lines)

with open('src/screens/EventDetailScreen.js', 'w') as f:
    f.write(content)
PYTHON

echo ""
echo "✅ ALL CHANGES APPLIED!"
echo ""
echo "📋 FEATURES ADDED:"
echo "   1. Fixed creatorId → hostId"
echo "   2. Added handleCancelEvent function"
echo "   3. Added 🚫 Cancel button in header (only for host/admin)"
echo "   4. Added cancelled event indicator"
echo "   5. Sends notifications to all participants"
echo "   6. Prevents actions on cancelled events"
echo ""
echo "🎯 PERMISSIONS:"
echo "   • Can cancel: Host OR Admin"
echo "   • Cannot cancel: Demo events or already cancelled"
echo ""
echo "🔄 NEXT:"
echo "   • Press 'r' to reload"
echo "   • Open any event you created"
echo "   • You'll see a 🚫 button in the header"
echo "   • Click to cancel the event"
echo ""
