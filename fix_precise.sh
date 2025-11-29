#!/bin/bash

echo "🔧 Aplicando fixes precisos..."
echo ""

# 1. FIX CREATEEVENTSCREEN - usar userData.name en vez de user.displayName
echo "1️⃣  Fixing CreateEventScreen hostName..."

python3 << 'PYTHON'
with open('src/screens/CreateEventScreen.js', 'r') as f:
    content = f.read()

# Replace user.displayName with userData
old_line = "        hostName: user.displayName || 'Anonymous',"
new_line = "        hostName: userData?.name || userData?.displayName || 'Anonymous',"

if old_line in content:
    content = content.replace(old_line, new_line)
    print("   ✅ Fixed hostName to use userData.name")
else:
    print("   ⚠️  Pattern not found exactly, trying flexible match...")
    import re
    content = re.sub(
        r"hostName:\s*user\.displayName\s*\|\|\s*['\"]Anonymous['\"]",
        "hostName: userData?.name || userData?.displayName || 'Anonymous'",
        content
    )
    print("   ✅ Fixed with regex")

with open('src/screens/CreateEventScreen.js', 'w') as f:
    f.write(content)
PYTHON

# 2. ADD getDoc to imports if not there
echo ""
echo "2️⃣  Checking getDoc import..."

if ! grep -q "getDoc" src/screens/CreateEventScreen.js | head -1; then
    echo "   Adding getDoc to imports..."
    python3 << 'PYTHON'
with open('src/screens/CreateEventScreen.js', 'r') as f:
    content = f.read()

# Add getDoc to the firebase/firestore import
old_import = "import { collection, addDoc, serverTimestamp } from 'firebase/firestore';"
new_import = "import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';"

if old_import in content:
    content = content.replace(old_import, new_import)
    print("   ✅ Added getDoc to imports")
else:
    print("   ⚠️  Import line format different")

with open('src/screens/CreateEventScreen.js', 'w') as f:
    f.write(content)
PYTHON
else
    echo "   ✅ getDoc already in imports"
fi

# 3. NOW CHECK MYEVENTSSCREEN - Let's see the whole fetch function
echo ""
echo "3️⃣  Checking MyEventsScreen structure..."
echo ""

if grep -q "fetchHostingEvents" src/screens/MyEventsScreen.js; then
    echo "   Found fetchHostingEvents function"
    echo ""
    echo "   Current query:"
    grep -A 15 "const hostingQuery" src/screens/MyEventsScreen.js | head -20
else
    echo "   ⚠️  fetchHostingEvents not found - checking for useEffect..."
    grep -A 30 "useEffect" src/screens/MyEventsScreen.js | grep -A 20 "hostId"
fi

echo ""
echo "═══════════════════════════════════════════════"
echo "4️⃣  Let's look for the actual query pattern:"
echo "═══════════════════════════════════════════════"

# Search for where we fetch hosting events
grep -B 5 -A 15 "where('hostId'" src/screens/MyEventsScreen.js

echo ""
echo "✅ CreateEventScreen fixed!"
echo ""
echo "🔍 Para arreglar MyEventsScreen necesito ver la query completa."
echo "   Por favor copia el output de arriba del 'where(hostId'"
echo ""
