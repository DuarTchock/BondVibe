/**
 * CreatePostScreen — compose a post (text + optional photos). Photos upload to
 * Storage under the author's uid; then the post doc is written.
 */
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import Icon from "../components/Icon";
import GradientBackground from "../components/GradientBackground";
import { useTheme } from "../contexts/ThemeContext";
import { auth } from "../services/firebase";
import { createPost } from "../services/postService";
import { uploadPostImage } from "../services/storageService";

const MAX_PHOTOS = 4;

export default function CreatePostScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const [text, setText] = useState("");
  const [images, setImages] = useState([]); // local uris
  const [posting, setPosting] = useState(false);

  const pick = async () => {
    if (images.length >= MAX_PHOTOS) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow photo access to add images.");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!res.canceled && res.assets?.[0]) {
      setImages((cur) => [...cur, res.assets[0].uri].slice(0, MAX_PHOTOS));
    }
  };

  const submit = async () => {
    if (!text.trim() && images.length === 0) return;
    setPosting(true);
    try {
      const uid = auth.currentUser.uid;
      const urls = [];
      for (const uri of images) urls.push(await uploadPostImage(uid, uri));
      const r = await createPost({ text, images: urls });
      if (!r.success) throw new Error(r.error || "Failed");
      navigation.goBack();
    } catch (e) {
      Alert.alert("Couldn't post", e.message || "Please try again.");
    } finally {
      setPosting(false);
    }
  };

  const styles = createStyles(colors);
  const canPost = (text.trim() || images.length > 0) && !posting;

  return (
    <GradientBackground>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={hit}>
          <Icon name="close" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>New post</Text>
        <TouchableOpacity
          onPress={submit}
          disabled={!canPost}
          style={[styles.postBtn, { backgroundColor: colors.primary, opacity: canPost ? 1 : 0.5 }]}
        >
          {posting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.postTxt}>Post</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder="What's happening?"
          placeholderTextColor={colors.textTertiary}
          value={text}
          onChangeText={setText}
          multiline
          autoFocus
        />

        {images.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbs}>
            {images.map((uri, i) => (
              <View key={i} style={styles.thumbWrap}>
                <Image source={{ uri }} style={styles.thumb} />
                <TouchableOpacity
                  style={styles.removeThumb}
                  onPress={() => setImages((cur) => cur.filter((_, idx) => idx !== i))}
                >
                  <Icon name="close" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}

        <TouchableOpacity style={styles.addPhoto} onPress={pick} disabled={images.length >= MAX_PHOTOS}>
          <Icon name="image" size={20} color={colors.primary} />
          <Text style={[styles.addPhotoText, { color: colors.primary }]}>
            Add photo{images.length > 0 ? ` (${images.length}/${MAX_PHOTOS})` : ""}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </GradientBackground>
  );
}

const hit = { top: 10, bottom: 10, left: 10, right: 10 };

function createStyles(colors) {
  return StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingTop: 60,
      paddingBottom: 12,
    },
    title: { fontSize: 17, fontWeight: "700", color: colors.text },
    postBtn: { borderRadius: 20, paddingHorizontal: 18, paddingVertical: 8, minWidth: 64, alignItems: "center" },
    postTxt: { color: "#fff", fontSize: 15, fontWeight: "700" },
    content: { paddingHorizontal: 20, paddingBottom: 40 },
    input: { fontSize: 18, lineHeight: 25, minHeight: 120, textAlignVertical: "top" },
    thumbs: { marginTop: 12 },
    thumbWrap: { marginRight: 10 },
    thumb: { width: 100, height: 100, borderRadius: 12 },
    removeThumb: {
      position: "absolute",
      top: 4,
      right: 4,
      backgroundColor: "rgba(0,0,0,0.5)",
      borderRadius: 12,
      width: 24,
      height: 24,
      alignItems: "center",
      justifyContent: "center",
    },
    addPhoto: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 20 },
    addPhotoText: { fontSize: 15, fontWeight: "600" },
  });
}
