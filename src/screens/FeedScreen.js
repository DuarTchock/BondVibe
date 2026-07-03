/**
 * FeedScreen — posts from people you follow (and yourself). Entry points to
 * compose a post and to direct messages.
 */
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useFocusEffect } from "@react-navigation/native";
import Icon from "../components/Icon";
import GradientBackground from "../components/GradientBackground";
import PostCard from "../components/PostCard";
import { useTheme } from "../contexts/ThemeContext";
import { getFeed } from "../services/postService";

export default function FeedScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setPosts(await getFeed());
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const styles = createStyles(colors);
  return (
    <GradientBackground>
      <StatusBar style={isDark ? "light" : "dark"} />
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Feed</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => navigation.navigate("DMList")} hitSlop={hit}>
            <Icon name="chat" size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("CreatePost")} hitSlop={hit}>
            <Icon name="add" size={26} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => (
          <PostCard post={item} navigation={navigation} onChanged={load} />
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Icon name="community" size={40} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Follow people and share your first post to fill your feed.
              </Text>
              <TouchableOpacity
                style={[styles.cta, { backgroundColor: colors.primary }]}
                onPress={() => navigation.navigate("CreatePost")}
              >
                <Text style={styles.ctaText}>Create a post</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />
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
    title: { fontSize: 26, fontWeight: "800", letterSpacing: -0.4 },
    headerActions: { flexDirection: "row", gap: 20, alignItems: "center" },
    list: { paddingHorizontal: 16, paddingBottom: 30, flexGrow: 1 },
    empty: { alignItems: "center", marginTop: 80, paddingHorizontal: 40, gap: 14 },
    emptyText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
    cta: { borderRadius: 24, paddingHorizontal: 24, paddingVertical: 12 },
    ctaText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  });
}
