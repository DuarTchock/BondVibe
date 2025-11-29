#!/bin/bash

echo "🔧 Fixing field name mismatch..."
echo ""

echo "PROBLEMA ENCONTRADO:"
echo "   • MyEventsScreen busca: 'creatorId'"
echo "   • CreateEventScreen guarda: 'hostId'"
echo "   • ❌ No coinciden!"
echo ""

echo "1️⃣  Cambiando 'creatorId' a 'hostId' en MyEventsScreen..."

python3 << 'PYTHON'
with open('src/screens/MyEventsScreen.js', 'r') as f:
    content = f.read()

# Replace creatorId with hostId
old_query = """        const hostingQuery = query(
          collection(db, 'events'),
          where('creatorId', '==', auth.currentUser.uid)
        );"""

new_query = """        const hostingQuery = query(
          collection(db, 'events'),
          where('hostId', '==', auth.currentUser.uid)
        );"""

if old_query in content:
    content = content.replace(old_query, new_query)
    print("   ✅ Changed 'creatorId' to 'hostId'")
else:
    # Try with single quotes
    old_query_alt = """        const hostingQuery = query(
          collection(db, 'events'),
          where('creatorId', '==', auth.currentUser.uid)
        );"""
    
    if 'creatorId' in content:
        content = content.replace("'creatorId'", "'hostId'")
        print("   ✅ Replaced all occurrences of 'creatorId' with 'hostId'")
    else:
        print("   ⚠️  Pattern not found")

with open('src/screens/MyEventsScreen.js', 'w') as f:
    f.write(content)
PYTHON

echo ""
echo "2️⃣  También necesitamos cambiar 'attendees' a 'participants'..."
echo "    (CreateEventScreen usa 'participants', no 'attendees')"
echo ""

python3 << 'PYTHON'
with open('src/screens/MyEventsScreen.js', 'r') as f:
    content = f.read()

# Replace attendees with participants in the joined events section
replacements = [
    ("event.attendees?.includes(auth.currentUser.uid)", "event.participants?.includes(auth.currentUser.uid)"),
    ("event.attendees?.length || 0", "event.participantCount || event.participants?.length || 0"),
    ("event.maxAttendees", "event.maxPeople"),
]

for old, new in replacements:
    if old in content:
        content = content.replace(old, new)
        print(f"   ✅ Replaced: {old[:40]}...")

with open('src/screens/MyEventsScreen.js', 'w') as f:
    f.write(content)
PYTHON

echo ""
echo "✅ TODOS LOS FIXES APLICADOS!"
echo ""
echo "📋 CAMBIOS:"
echo "   1. creatorId → hostId"
echo "   2. attendees → participants"
echo "   3. maxAttendees → maxPeople"
echo ""
echo "🎯 AHORA:"
echo "   • Presiona 'r' en Expo"
echo "   • Ve a My Events > Hosting"
echo "   • ¡Deberías ver tus eventos! 🎉"
echo ""
echo "📝 RESUMEN DEL PROBLEMA:"
echo "   MyEventsScreen buscaba campos que no existían:"
echo "   - Buscaba 'creatorId' pero guardamos 'hostId'"
echo "   - Buscaba 'attendees' pero guardamos 'participants'"
echo "   - Buscaba 'maxAttendees' pero guardamos 'maxPeople'"
echo ""
