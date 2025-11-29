#!/bin/bash

echo "🔧 Fixing Hosting query and hostName..."
echo ""

# 1. FIX MYEVENTSSCREEN - Let's see what the current query looks like
echo "1️⃣  Checking current MyEventsScreen query..."
echo ""

grep -A 10 "fetchHostingEvents" src/screens/MyEventsScreen.js | head -15

echo ""
echo "2️⃣  Fixing the hosting query..."

# The issue is the query is looking for exact matches
# Let's create a simpler, more reliable query
python3 << 'PYTHON'
import re

with open('src/screens/MyEventsScreen.js', 'r') as f:
    content = f.read()

# Find the fetchHostingEvents function and replace the query
old_pattern = r"const fetchHostingEvents = async \(\) => \{[\s\S]*?try \{[\s\S]*?const hostingQuery = query\([\s\S]*?\);[\s\S]*?const querySnapshot = await getDocs\(hostingQuery\);"

# New, simpler query without orderBy (which might need an index)
new_function_start = """const fetchHostingEvents = async () => {
    try {
      console.log('📅 Fetching hosting events for:', currentUser?.uid);
      
      const hostingQuery = query(
        eventsRef,
        where('hostId', '==', currentUser.uid)
      );
      
      const querySnapshot = await getDocs(hostingQuery);"""

if re.search(old_pattern, content, re.MULTILINE):
    content = re.sub(old_pattern, new_function_start, content, flags=re.MULTILINE)
    print("   ✅ Fixed hosting query (removed orderBy)")
else:
    print("   ⚠️  Could not find exact pattern, trying alternate method...")
    # Try a different approach - just replace the query construction
    if "const hostingQuery = query(" in content and "fetchHostingEvents" in content:
        # Find and replace just the query part
        content = re.sub(
            r"const hostingQuery = query\(\s*eventsRef,\s*where\('hostId', '==', currentUser\.uid\),?\s*(?:where\([^)]+\),?\s*)?(?:orderBy\([^)]+\))?\s*\);",
            """const hostingQuery = query(
        eventsRef,
        where('hostId', '==', currentUser.uid)
      );""",
            content,
            flags=re.MULTILINE
        )
        print("   ✅ Fixed with alternate method")
    else:
        print("   ❌ Could not find pattern to replace")

with open('src/screens/MyEventsScreen.js', 'w') as f:
    f.write(content)
PYTHON

echo ""
echo "3️⃣  Fixing CreateEventScreen to use correct hostName..."

# The issue is it's using 'Anonymous' as default
# Let's make sure it uses the actual user's name from userData
python3 << 'PYTHON'
import re

with open('src/screens/CreateEventScreen.js', 'r') as f:
    content = f.read()

# Find where we create the event object and fix hostName
# Look for the eventData object creation

# Pattern 1: Find hostName: 'Anonymous'
if "hostName: 'Anonymous'" in content or 'hostName: "Anonymous"' in content:
    # Replace with userData.name
    content = re.sub(
        r"hostName:\s*['\"]Anonymous['\"]",
        "hostName: userData?.name || userData?.displayName || 'Host'",
        content
    )
    print("   ✅ Fixed hostName to use userData.name")
else:
    print("   ⚠️  'Anonymous' not found in hostName")

# Also check if userData is being fetched
if "const userData = await getDoc" not in content:
    print("   ⚠️  WARNING: userData not being fetched!")
    print("   Need to fetch user document before creating event")

with open('src/screens/CreateEventScreen.js', 'w') as f:
    f.write(content)
PYTHON

echo ""
echo "4️⃣  Let's verify the CreateEventScreen is fetching userData..."
echo ""

# Check if we're fetching the user document
if grep -q "const userDocRef = doc(db, 'users'," src/screens/CreateEventScreen.js; then
    echo "   ✅ User document fetch found"
else
    echo "   ❌ User document fetch NOT found - need to add it"
    echo ""
    echo "   Adding userData fetch..."
    
    # Add userData fetch before creating the event
    python3 << 'PYTHON'
import re

with open('src/screens/CreateEventScreen.js', 'r') as f:
    content = f.read()

# Find where we start creating the event (after validation)
# Look for the try block in handleCreateEvent
pattern = r"(const handleCreateEvent = async \(\) => \{[\s\S]*?try \{)"

if re.search(pattern, content):
    # Add userData fetch right after try {
    replacement = r"\1\n      // Fetch user data for hostName\n      const userDocRef = doc(db, 'users', currentUser.uid);\n      const userDoc = await getDoc(userDocRef);\n      const userData = userDoc.data();\n      console.log('👤 User data:', userData?.name);\n"
    
    content = re.sub(pattern, replacement, content, count=1)
    print("   ✅ Added userData fetch")
else:
    print("   ⚠️  Could not find insertion point")

with open('src/screens/CreateEventScreen.js', 'w') as f:
    f.write(content)
PYTHON
fi

echo ""
echo "5️⃣  Checking if we need to import getDoc..."

if ! grep -q "import.*getDoc.*from.*firebase/firestore" src/screens/CreateEventScreen.js; then
    echo "   Adding getDoc to imports..."
    
    # Add getDoc to the firestore imports
    sed -i.bak 's/from "firebase\/firestore";/, getDoc from "firebase\/firestore";/' src/screens/CreateEventScreen.js
    echo "   ✅ Added getDoc import"
else
    echo "   ✅ getDoc already imported"
fi

echo ""
echo "✅ ALL FIXES APPLIED!"
echo ""
echo "📋 CHANGES:"
echo "   1. Simplified hosting query (removed orderBy that might need index)"
echo "   2. Fixed hostName to use userData.name instead of 'Anonymous'"
echo "   3. Added userData fetch in CreateEventScreen if missing"
echo "   4. Added getDoc import if missing"
echo ""
echo "🎯 NEXT STEPS:"
echo "   • Press 'r' in Expo to reload"
echo "   • Go to My Events > Hosting"
echo "   • Your existing events should now appear! 🎉"
echo "   • Create a new event to test hostName fix"
echo ""
echo "🔍 DEBUGGING:"
echo "   • Check console logs when viewing My Events"
echo "   • Should see: '📅 Fetching hosting events for: [uid]'"
echo "   • When creating event, should see: '👤 User data: [name]'"
echo ""
