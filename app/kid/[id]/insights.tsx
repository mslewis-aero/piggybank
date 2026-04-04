import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useKid } from "../../../hooks/useKid";
import { useInsights } from "../../../hooks/useInsights";
import { InsightChart } from "../../../components/InsightChart";
import { EmptyState } from "../../../components/EmptyState";
import { Colors, FontSize, Spacing, getAvatarEmoji } from "../../../constants/theme";
import { CategoryType } from "../../../types";

export default function InsightsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { kid } = useKid(id!);
  const [tab, setTab] = useState<CategoryType>("earning");
  const items = useInsights(id!, tab);

  if (!kid) return null;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.avatar}>{getAvatarEmoji(kid.avatarId)}</Text>
        <Text style={styles.name}>{kid.name}'s Insights</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === "earning" && styles.tabActive]}
          onPress={() => setTab("earning")}
        >
          <Text
            style={[
              styles.tabText,
              tab === "earning" && styles.tabTextActive,
            ]}
          >
            Earnings
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === "spending" && styles.tabActive]}
          onPress={() => setTab("spending")}
        >
          <Text
            style={[
              styles.tabText,
              tab === "spending" && styles.tabTextActive,
            ]}
          >
            Spending
          </Text>
        </TouchableOpacity>
      </View>

      {items.length > 0 ? (
        <InsightChart items={items} />
      ) : (
        <EmptyState
          emoji={tab === "earning" ? "💰" : "🛍️"}
          title={`No ${tab === "earning" ? "earnings" : "spending"} recorded yet!`}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
  },
  avatar: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  name: {
    fontSize: FontSize.xl,
    fontWeight: "bold",
    color: Colors.text,
  },
  tabs: {
    flexDirection: "row",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.border,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm + 2,
    borderRadius: 10,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: Colors.card,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  tabTextActive: {
    color: Colors.text,
    fontWeight: "700",
  },
});
