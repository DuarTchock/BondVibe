#!/bin/bash

echo "🔧 Fixing BondVibe modal and MyEvents..."
echo ""

# 1. ADD STATE VARIABLES TO CREATEEVENTSCREEN (if missing)
echo "1️⃣  Adding state variables..."

if ! grep -q "showSuccessModal" src/screens/CreateEventScreen.js; then
  # Find line with "const [loading, setLoading]" and add after it
  sed -i.bak '/const \[loading, setLoading\] = useState(false);/a\
  const [showSuccessModal, setShowSuccessModal] = useState(false);\
  const [createdEventTitle, setCreatedEventTitle] = useState("");
' src/screens/CreateEventScreen.js
  echo "   ✅ Added state variables"
else
  echo "   ✅ State variables already present"
fi

# 2. ADD IMPORT (if missing)
echo "2️⃣  Adding EventCreatedModal import..."

if ! grep -q "import EventCreatedModal" src/screens/CreateEventScreen.js; then
  sed -i.bak "/import { useTheme } from '..\/contexts\/ThemeContext';/a\\
import EventCreatedModal from '../components/EventCreatedModal';
" src/screens/CreateEventScreen.js
  echo "   ✅ Added import"
else
  echo "   ✅ Import already present"
fi

# 3. REPLACE Alert.alert WITH MODAL (using Python for reliability)
echo "3️⃣  Replacing Alert.alert with modal trigger..."

python3 << 'PYTHON'
import re

with open('src/screens/CreateEventScreen.js', 'r') as f:
    content = f.read()

# Find and replace the Alert.alert block
old_pattern = r"console\.log\('✅ Event created with ID:', docRef\.id\);\s*Alert\.alert\(\s*'Success!',\s*'Your event has been created successfully\.',\s*\[\s*{\s*text: 'OK',\s*onPress: \(\) => navigation\.goBack\(\),\s*},\s*\]\s*\);"

new_code = """console.log('✅ Event created with ID:', docRef.id);
      
      // Show success modal
      setCreatedEventTitle(title.trim());
      setShowSuccessModal(true);"""

if re.search(old_pattern, content):
    content = re.sub(old_pattern, new_code, content, flags=re.MULTILINE)
    with open('src/screens/CreateEventScreen.js', 'w') as f:
        f.write(content)
    print("   ✅ Replaced Alert.alert with modal")
else:
    print("   ⚠️  Alert.alert pattern not found (may already be replaced)")
PYTHON

# 4. ADD MODAL COMPONENT TO JSX (if missing)
echo "4️⃣  Adding modal component to render..."

if ! grep -q "<EventCreatedModal" src/screens/CreateEventScreen.js; then
  python3 << 'PYTHON'
with open('src/screens/CreateEventScreen.js', 'r') as f:
    content = f.read()

# Find the closing tags and add modal before them
modal_component = """
      {/* Success Modal */}
      <EventCreatedModal
        visible={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          navigation.goBack();
        }}
        eventTitle={createdEventTitle}
      />
"""

# Insert modal before the final </View> that closes the main container
# Look for pattern: </ScrollView>\n    </View>\n  );\n}
if modal_component.strip() not in content:
    content = content.replace(
        '      </ScrollView>\n    </View>\n  );\n}',
        f'      </ScrollView>\n{modal_component}    </View>\n  );\n}}'
    )
    with open('src/screens/CreateEventScreen.js', 'w') as f:
        f.write(content)
    print("   ✅ Added modal component")
else:
    print("   ✅ Modal already in render")
PYTHON
else
  echo "   ✅ Modal component already present"
fi

# 5. FIX MYEVENTSSCREEN QUERY
echo "5️⃣  Fixing MyEventsScreen hosting query..."

python3 << 'PYTHON'
import re

with open('src/screens/MyEventsScreen.js', 'r') as f:
    content = f.read()

# Remove status filter and change order to desc
old_patterns = [
    # Pattern 1: with status filter and asc order
    r"const hostingQuery = query\(\s*eventsRef,\s*where\('hostId', '==', currentUser\.uid\),\s*where\('status', '==', 'active'\),\s*orderBy\('date', 'asc'\)\s*\);",
    # Pattern 2: with status filter and desc order
    r"const hostingQuery = query\(\s*eventsRef,\s*where\('hostId', '==', currentUser\.uid\),\s*where\('status', '==', 'active'\),\s*orderBy\('date', 'desc'\)\s*\);",
]

new_query = """const hostingQuery = query(
      eventsRef,
      where('hostId', '==', currentUser.uid),
      orderBy('date', 'desc')
    );"""

replaced = False
for pattern in old_patterns:
    if re.search(pattern, content):
        content = re.sub(pattern, new_query, content)
        replaced = True
        break

if replaced:
    with open('src/screens/MyEventsScreen.js', 'w') as f:
        f.write(content)
    print("   ✅ Fixed hosting query (removed status filter)")
else:
    print("   ⚠️  Query pattern not found (may already be fixed)")
PYTHON

echo ""
echo "✅ ALL FIXES APPLIED!"
echo ""
echo "📋 CHANGES:"
echo "   1. Added showSuccessModal and createdEventTitle states"
echo "   2. Added EventCreatedModal import"
echo "   3. Replaced Alert.alert with modal trigger"
echo "   4. Added modal component to JSX"
echo "   5. Removed status filter from hosting query"
echo ""
echo "🎯 NEXT STEPS:"
echo "   • Press 'r' in Expo to reload"
echo "   • Create a test event"
echo "   • Beautiful modal should appear! ✨"
echo "   • Go to My Events > Hosting"
echo "   • Your event should be there! 🎉"
echo ""
echo "📝 NOTE: If events still don't show in Hosting,"
echo "         check Firestore console for query errors"
echo ""
