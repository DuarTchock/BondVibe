#!/bin/bash

echo "🔧 Fixing missing 'doc' import and adding cancel feature..."
echo ""

echo "1️⃣  Adding 'doc' to imports in CreateEventScreen..."

python3 << 'PYTHON'
with open('src/screens/CreateEventScreen.js', 'r') as f:
    content = f.read()

# Check current import
import_line = [line for line in content.split('\n') if 'firebase/firestore' in line and 'import' in line][0]
print(f"   Current import: {import_line}")

# Add doc if missing
if 'doc' not in import_line:
    # Add doc to the import
    new_import = import_line.replace(
        'from \'firebase/firestore\';',
        ', doc from \'firebase/firestore\';'
    ).replace(
        'from "firebase/firestore";',
        ', doc from "firebase/firestore";'
    )
    
    content = content.replace(import_line, new_import)
    print(f"   ✅ Fixed: {new_import}")
else:
    print("   ✅ 'doc' already in imports")

with open('src/screens/CreateEventScreen.js', 'w') as f:
    f.write(content)
PYTHON

echo ""
echo "2️⃣  Checking EventDetailScreen for cancel functionality..."
echo ""

if [ -f "src/screens/EventDetailScreen.js" ]; then
    echo "   ✅ EventDetailScreen exists"
    
    # Check if cancel functionality exists
    if grep -q "cancelEvent\|deleteEvent" src/screens/EventDetailScreen.js; then
        echo "   ✅ Cancel functionality already exists"
    else
        echo "   ❌ Cancel functionality NOT found"
        echo "   📝 Need to add cancel event button"
    fi
else
    echo "   ❌ EventDetailScreen.js NOT FOUND"
    echo "   Need to create it first"
fi

echo ""
echo "3️⃣  Let me check what screens exist..."
ls -la src/screens/*.js | grep -i event

echo ""
echo "✅ Import fix applied!"
echo ""
echo "🎯 NEXT:"
echo "   • Press 'r' to reload"
echo "   • Try creating an event - should work now!"
echo ""
echo "📋 PARA CANCELAR EVENTOS:"
echo "   Necesitamos saber:"
echo "   1. ¿Existe EventDetailScreen.js?"
echo "   2. ¿Cómo se ve actualmente?"
echo ""
echo "Ejecuta esto para ver:"
echo "   ls -la src/screens/ | grep -i detail"
echo ""
