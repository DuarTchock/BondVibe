/**
 * D1 — People you met. Post-close retention: the attendee's matches with a way
 * back into chat. Works per-event (from the event) or across all events.
 */
import React, { useState, useEffect } from "react";
import Icon from "../../components/Icon";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from "react-native";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "../../services/firebase";
import { useTheme } from "../../contexts/ThemeContext";
import { MatchHeader } from "./matchUi";
import { getMyMatches, getAllMyMatches } from "../../services/matchingService";

export default function PeopleYouMetScreen({ route, navigation }) {
  const { colors } = useTheme();
  const { eventId } = route.params || {};
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const me = auth.currentUser?.uid;

  useEffect(() => {
    (async () => {
      const matches = eventId ? await getMyMatches(eventId) : await getAllMyMatches();
      const resolved = await Promise.all(
        matches.map(async (m) => {
          const otherUid = (m.users || []).find((u) => u !== me);
          const evId = m.eventId || eventId;
          let profile = {};
          if (otherUid && evId) {
            const s = await getDoc(
              doc(db, "matchProfiles", evId, "attendees", otherUid)
            );
            if (s.exists()) profile = s.data();
          }
          return { matchId: m.id, otherUid, profile };
        })
      );
      setRows(resolved);
      setLoading(false);
    })();
  }, [eventId]);

  const styles = createStyles(colors);
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <MatchHeader title="People you met" onBack={() => navigation.goBack()} />
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : rows.length === 0 ? (
        <View style={styles.empty}>
          <Icon name="heart" size={38} color={colors.textTertiary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No matches yet. Your next event could change that.
          </Text>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(r) => r.matchId}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              onPress={() =>
                navigation.navigate("MatchChat", {
                  matchId: item.matchId,
                  name: item.profile.displayName,
                })
              }
            >
              {item.profile.photoUrl ? (
                <Image source={{ uri: item.profile.photoUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.avatarInitial}>
                    {(item.profile.displayName || "?")[0].toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, { color: colors.text }]}>
                  {item.profile.displayName || "Someone"}
                </Text>
                {!!item.profile.profession && (
                  <Text style={[styles.sub, { color: colors.textSecondary }]}>
                    {item.profile.profession}
                  </Text>
                )}
              </View>
              <Icon name="forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: { flex: 1 },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      backgroundColor: colors.surface,
      borderColor: colors.borderStrong,
      borderWidth: 2,
      borderRadius: 16,
      padding: 12,
      marginBottom: 10,
    },
    avatar: { width: 52, height: 52, borderRadius: 26 },
    avatarFallback: { backgroundColor: `${colors.primary}22`, alignItems: "center", justifyContent: "center" },
    avatarInitial: { fontSize: 22, fontWeight: "800", color: colors.primary },
    name: { fontSize: 16, fontWeight: "700" },
    sub: { fontSize: 13, marginTop: 2 },
    empty: { alignItems: "center", marginTop: 60, paddingHorizontal: 40, gap: 12 },
    emptyText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  });
}
