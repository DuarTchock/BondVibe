#!/bin/bash

echo "🔍 Examining EventDetailScreen..."
echo ""

echo "═══════════════════════════════════════════════"
echo "1️⃣  Checking imports and user role detection:"
echo "═══════════════════════════════════════════════"
head -30 src/screens/EventDetailScreen.js
echo ""

echo "═══════════════════════════════════════════════"
echo "2️⃣  Checking if event data is loaded:"
echo "═══════════════════════════════════════════════"
grep -n "useState\|event\|hostId" src/screens/EventDetailScreen.js | head -20
echo ""

echo "═══════════════════════════════════════════════"
echo "3️⃣  Checking existing buttons/actions:"
echo "═══════════════════════════════════════════════"
grep -n "TouchableOpacity\|onPress\|Button" src/screens/EventDetailScreen.js | head -20
echo ""

echo "═══════════════════════════════════════════════"
echo "4️⃣  Looking at the main render/return section:"
echo "═══════════════════════════════════════════════"
grep -A 50 "return (" src/screens/EventDetailScreen.js | head -60
echo ""
