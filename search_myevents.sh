#!/bin/bash

echo "🔍 Buscando estructura de MyEventsScreen..."
echo ""

echo "═══════════════════════════════════════════════"
echo "1️⃣  Buscando 'Hosting' en el código:"
echo "═══════════════════════════════════════════════"
grep -n "Hosting" src/screens/MyEventsScreen.js
echo ""

echo "═══════════════════════════════════════════════"
echo "2️⃣  Buscando queries con 'query(' de Firestore:"
echo "═══════════════════════════════════════════════"
grep -A 10 "query(" src/screens/MyEventsScreen.js
echo ""

echo "═══════════════════════════════════════════════"
echo "3️⃣  Buscando useEffect hooks:"
echo "═══════════════════════════════════════════════"
grep -B 3 -A 20 "useEffect" src/screens/MyEventsScreen.js | head -50
echo ""

echo "═══════════════════════════════════════════════"
echo "4️⃣  Mostrando las primeras 100 líneas del archivo:"
echo "═══════════════════════════════════════════════"
head -100 src/screens/MyEventsScreen.js
echo ""

echo "═══════════════════════════════════════════════"
echo "5️⃣  Buscando donde se setean los eventos:"
echo "═══════════════════════════════════════════════"
grep -n "setHostingEvents\|setJoinedEvents" src/screens/MyEventsScreen.js
echo ""
