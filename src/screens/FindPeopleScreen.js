/**
 * FindPeopleScreen — search people by @handle or name (spec 10 §5). Each result
 * opens their public profile, where Message / Follow already live (BUG 14).
 */
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useTranslation } from "react-i18next";
import GradientBackground from "../components/GradientBackground";
import Icon from "../components/Icon";
import UserSearchField from "../components/UserSearchField";
import { useTheme } from "../contexts/ThemeContext";
import { TYPE, SPACING } from "../constants/theme-tokens";

const hit = { top: 10, bottom: 10, left: 10, right: 10 };

export default function FindPeopleScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();

  return (
    <GradientBackground>
      <StatusBar style={isDark ? "light" : "dark"} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={hit}>
          <Icon name="back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={[TYPE.titleLg, { color: colors.text }]}>{t("findPeople.title")}</Text>
        <View style={{ width: 26 }} />
      </View>
      <View style={styles.body}>
        <Text style={[TYPE.caption, styles.hint, { color: colors.textSecondary }]}>
          {t("findPeople.hint")}
        </Text>
        <UserSearchField
          autoFocus
          placeholder={t("userSearch.placeholder")}
          onSelect={(u) => navigation.navigate("UserProfile", { userId: u.uid })}
          maxHeight={9999}
        />
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.screen,
    paddingTop: 60,
    paddingBottom: SPACING.md,
  },
  body: { paddingHorizontal: SPACING.screen },
  hint: { marginBottom: SPACING.sm },
});
