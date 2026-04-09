import React from "react";
import { View, Text, TouchableOpacity, FlatList, Alert, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppContext } from "../context/AppContext";
import { useTheme } from "../context/ThemeContext";
import { EmptyState } from "../components/EmptyState";
import { ThemeColors, FontSize, Spacing, getAvatarEmoji } from "../constants/theme";

const TWELVE_MONTHS_MS = 365 * 24 * 60 * 60 * 1000;

export default function RecentlyDeletedScreen() {
  const { state, dispatch } = useAppContext();
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const cutoff = new Date(Date.now() - TWELVE_MONTHS_MS).toISOString();

  const deletedKids = state.kids.filter(
    (k) => k.deletedAt && k.deletedAt > cutoff
  );
  const deletedCategories = state.categories.filter(
    (c) => c.deletedAt && c.deletedAt > cutoff
  );

  const hasItems = deletedKids.length > 0 || deletedCategories.length > 0;

  const handleRestoreKid = (id: string, name: string) => {
    Alert.alert("Restore", `Restore ${name}'s piggy bank?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Restore",
        onPress: () => dispatch({ type: "RESTORE_KID", payload: { id } }),
      },
    ]);
  };

  const handleRestoreCategory = (id: string, name: string) => {
    Alert.alert("Restore", `Restore the "${name}" category?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Restore",
        onPress: () => dispatch({ type: "RESTORE_CATEGORY", payload: { id } }),
      },
    ]);
  };

  if (!hasItems) {
    return (
      <View style={styles.container}>
        <EmptyState
          emoji="🗑️"
          title="Nothing here"
          subtitle="Deleted items will appear here for 12 months"
        />
      </View>
    );
  }

  const data = [
    ...deletedKids.map((k) => ({ type: "kid" as const, item: k })),
    ...deletedCategories.map((c) => ({ type: "category" as const, item: c })),
  ];

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        keyExtractor={(d) => d.item.id}
        renderItem={({ item: d }) => {
          if (d.type === "kid") {
            const kid = d.item;
            return (
              <View style={styles.row}>
                <Text style={styles.emoji}>{getAvatarEmoji(kid.avatarId)}</Text>
                <View style={styles.details}>
                  <Text style={styles.name}>{kid.name}</Text>
                  <Text style={styles.meta}>
                    Deleted {new Date(kid.deletedAt!).toLocaleDateString()}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleRestoreKid(kid.id, kid.name)}>
                  <Ionicons name="refresh" size={22} color={colors.primary} />
                </TouchableOpacity>
              </View>
            );
          } else {
            const cat = d.item;
            return (
              <View style={styles.row}>
                <Text style={styles.emoji}>{cat.emoji || "?"}</Text>
                <View style={styles.details}>
                  <Text style={styles.name}>{cat.name}</Text>
                  <Text style={styles.meta}>
                    Deleted {new Date(cat.deletedAt!).toLocaleDateString()}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleRestoreCategory(cat.id, cat.name)}>
                  <Ionicons name="refresh" size={22} color={colors.primary} />
                </TouchableOpacity>
              </View>
            );
          }
        }}
      />
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: Spacing.md,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      padding: Spacing.md,
      borderRadius: 12,
      marginBottom: Spacing.sm,
    },
    emoji: {
      fontSize: 28,
      marginRight: Spacing.sm,
    },
    details: {
      flex: 1,
    },
    name: {
      fontSize: FontSize.md,
      fontWeight: "600",
      color: colors.text,
    },
    meta: {
      fontSize: FontSize.xs,
      color: colors.textSecondary,
      marginTop: 2,
    },
  });
