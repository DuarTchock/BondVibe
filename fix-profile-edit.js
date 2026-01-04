const fs = require('fs');

const profilePath = 'src/screens/ProfileScreen.js';
let content = fs.readFileSync(profilePath, 'utf8');

// 1. Quitar bio y age del editForm inicial
content = content.replace(
  `const [editForm, setEditForm] = useState({
    fullName: "",
    bio: "",
    avatar: null,
    age: "",
    location: "",
  });`,
  `const [editForm, setEditForm] = useState({
    fullName: "",
    avatar: null,
    location: "",
  });`
);

// 2. Quitar bio y age del loadProfile
content = content.replace(
  `setEditForm({
          fullName: data.fullName || "",
          bio: data.bio || "",
          avatar: avatarData || { type: "emoji", value: "😊" },
          age: data.age?.toString() || "",
          location: data.location || "",
        });`,
  `setEditForm({
          fullName: data.fullName || "",
          avatar: avatarData || { type: "emoji", value: "😊" },
          location: data.location || "",
        });`
);

// 3. Quitar bio y age del handleSave
content = content.replace(
  `await updateDoc(doc(db, "users", auth.currentUser.uid), {
        fullName: editForm.fullName.trim(),
        bio: editForm.bio.trim(),
        avatar: editForm.avatar,
        age: parseInt(editForm.age) || 0,
        location: editForm.location.trim(),
        updatedAt: new Date().toISOString(),
      });`,
  `await updateDoc(doc(db, "users", auth.currentUser.uid), {
        fullName: editForm.fullName.trim(),
        avatar: editForm.avatar,
        location: editForm.location.trim(),
        updatedAt: new Date().toISOString(),
      });`
);

// 4. Eliminar el campo Bio del formulario de edición
content = content.replace(
  /<View style={styles\.inputGroup}>\s*<Text style={\[styles\.inputLabel, { color: colors\.text }\]}>\s*Bio\s*<\/Text>\s*<TextInput[\s\S]*?style={\[[\s\S]*?styles\.input,[\s\S]*?styles\.textArea,[\s\S]*?\]}[\s\S]*?value={editForm\.bio}[\s\S]*?onChangeText={\(text\) =>[\s\S]*?setEditForm\({ \.\.\.editForm, bio: text }\)[\s\S]*?}[\s\S]*?placeholder="Tell us about yourself\.\.\."[\s\S]*?placeholderTextColor={colors\.textTertiary}[\s\S]*?multiline[\s\S]*?maxLength={200}[\s\S]*?\/>\s*<Text[\s\S]*?style={\[styles\.charCount[\s\S]*?\]}[\s\S]*?>[\s\S]*?{editForm\.bio\.length}\/200[\s\S]*?<\/Text>\s*<\/View>/g,
  ''
);

// 5. Eliminar el campo Age del formulario (está en inputRow con Location)
content = content.replace(
  /<View style={styles\.inputRow}>\s*<View style={\[styles\.inputGroup, { flex: 1 }\]}>\s*<Text style={\[styles\.inputLabel, { color: colors\.text }\]}>\s*Age\s*<\/Text>\s*<TextInput[\s\S]*?value={editForm\.age}[\s\S]*?onChangeText={\(text\) =>[\s\S]*?setEditForm\({[\s\S]*?\.\.\.editForm,[\s\S]*?age: text\.replace\(\/\[^0-9\]\/g, ""\),[\s\S]*?\}\)[\s\S]*?}[\s\S]*?placeholder="25"[\s\S]*?placeholderTextColor={colors\.textTertiary}[\s\S]*?keyboardType="numeric"[\s\S]*?maxLength={2}[\s\S]*?\/>\s*<\/View>\s*<View style={\[styles\.inputGroup, { flex: 2, marginLeft: 12 }\]}>/,
  `<View style={styles.inputGroup}>`
);

// 6. Eliminar el cierre extra del inputRow después de Location
content = content.replace(
  /<\/View>\s*<\/View>\s*<\/View>\s*<View style={styles\.formActions}>/,
  `</View>

            <View style={styles.formActions}>`
);

fs.writeFileSync(profilePath, content);
console.log('✅ Removed Bio and Age from ProfileScreen edit mode');
