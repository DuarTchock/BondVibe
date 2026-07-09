/**
 * A3 + A4 — Match profile. Prefilled from the user's account; the attendee sets
 * bio, interests, what they're looking for (contextual to the event's match
 * types), an icebreaker and visibility, then saves an opt-in profile.
 */
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import { doc, getDoc } from "firebase/firestore";
import { useTranslation } from "react-i18next";
import { db } from "../../services/firebase";
import { useTheme } from "../../contexts/ThemeContext";
import { MatchHeader, PrimaryButton, Chip } from "./matchUi";
import {
  saveMatchProfile,
  getMyMatchProfile,
  MATCH_TYPE_COLORS,
  VISIBILITY_OPTIONS,
} from "../../services/matchingService";

export default function MatchProfileScreen({ route, navigation }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { eventId, eventTitle } = route.params || {};
  const VIS_LABELS = {
    everyone: t("matching.profile.visEveryone"),
    same_gender: t("matching.profile.visSameGender"),
    opposite_gender: t("matching.profile.visOppositeGender"),
    organizer: t("matching.profile.visOrganizer"),
    hidden: t("matching.profile.visHiddenForNow"),
  };

  const [types, setTypes] = useState([]);
  const [bio, setBio] = useState("");
  const [profession, setProfession] = useState("");
  const [interests, setInterests] = useState("");
  const [lookingFor, setLookingFor] = useState([]);
  const [icebreaker, setIcebreaker] = useState("");
  const [visibility, setVisibility] = useState("everyone");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      // Event match types drive the "looking for" chips; existing profile prefills.
      const [eSnap, existing] = await Promise.all([
        getDoc(doc(db, "events", eventId)),
        getMyMatchProfile(eventId),
      ]);
      const t = eSnap.exists() ? eSnap.data()?.matching?.types || [] : [];
      setTypes(t);
      if (existing) {
        setBio(existing.bio || "");
        setProfession(existing.profession || "");
        setInterests((existing.interests || []).join(", "));
        setLookingFor(existing.lookingFor?.length ? existing.lookingFor : t);
        setIcebreaker(existing.icebreaker || "");
        setVisibility(existing.visibility || "everyone");
      } else {
        setLookingFor(t);
      }
    })();
  }, [eventId]);

  const toggleLookingFor = (t) =>
    setLookingFor((cur) =>
      cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]
    );

  const onSave = async () => {
    // BUG 11: a match profile must say what you're looking for.
    if (lookingFor.length === 0) {
      Alert.alert(t("matching.profile.pickLookingForTitle"), t("matching.profile.pickLookingForMsg"));
      return;
    }
    setSaving(true);
    const res = await saveMatchProfile(eventId, {
      bio: bio.trim(),
      profession: profession.trim(),
      interests: interests
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      lookingFor,
      icebreaker: icebreaker.trim(),
      visibility,
      available: true,
    });
    setSaving(false);
    if (!res.success) {
      Alert.alert(t("matching.profile.couldntSaveTitle"), res.error || t("matching.profile.tryAgain"));
      return;
    }
    navigation.replace("MatchGrid", { eventId, eventTitle });
  };

  const styles = createStyles(colors);
  const field = (label, value, setter, opts = {}) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, opts.multiline && styles.textarea]}
        value={value}
        onChangeText={setter}
        placeholder={opts.placeholder}
        placeholderTextColor={colors.textTertiary}
        multiline={opts.multiline}
      />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <MatchHeader title={t("matching.profile.title")} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {field(t("matching.profile.shortBio"), bio, setBio, {
          placeholder: t("matching.profile.bioPlaceholder"),
          multiline: true,
        })}
        {field(t("matching.profile.profession"), profession, setProfession, {
          placeholder: t("matching.profile.professionPlaceholder"),
        })}
        {field(t("matching.profile.interests"), interests, setInterests, {
          placeholder: t("matching.profile.interestsPlaceholder"),
        })}

        <Text style={styles.label}>{t("matching.profile.lookingForLabel")}</Text>
        <View style={styles.chips}>
          {(types.length ? types : ["friend", "professional", "romantic"]).map((t) => {
            const c = MATCH_TYPE_COLORS[t] || {};
            return (
              <Chip
                key={t}
                label={t[0].toUpperCase() + t.slice(1)}
                selected={lookingFor.includes(t)}
                onPress={() => toggleLookingFor(t)}
                fg={c.fg}
                bg={c.bg}
              />
            );
          })}
        </View>

        {field(t("matching.profile.icebreaker"), icebreaker, setIcebreaker, {
          placeholder: t("matching.profile.icebreakerPlaceholder"),
          multiline: true,
        })}

        <Text style={styles.label}>{t("matching.profile.whoCanSee")}</Text>
        <View style={styles.chips}>
          {VISIBILITY_OPTIONS.map((v) => (
            <Chip
              key={v}
              label={VIS_LABELS[v]}
              selected={visibility === v}
              onPress={() => setVisibility(v)}
            />
          ))}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <PrimaryButton label={t("matching.profile.saveAndSee")} onPress={onSave} loading={saving} />
      </View>
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: { flex: 1 },
    content: { paddingHorizontal: 24, paddingBottom: 24 },
    field: { marginBottom: 18 },
    label: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 10,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceGlass,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.text,
    },
    textarea: { minHeight: 72, textAlignVertical: "top" },
    chips: { flexDirection: "row", flexWrap: "wrap", marginBottom: 10 },
    footer: { paddingHorizontal: 24, paddingBottom: 28, paddingTop: 8 },
  });
}
