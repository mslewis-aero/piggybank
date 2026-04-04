import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useKid } from "../../../hooks/useKid";
import { useKidTransactions } from "../../../hooks/useTransactions";
import { useAppContext } from "../../../context/AppContext";
import { TransactionRow } from "../../../components/TransactionRow";
import { EmptyState } from "../../../components/EmptyState";
import { Colors, FontSize, Spacing, getAvatarEmoji } from "../../../constants/theme";
import { formatCurrency } from "../../../utils/currency";

export default function KidDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { kid, balance } = useKid(id!);
  const recentTransactions = useKidTransactions(id!, 10);
  const { state } = useAppContext();

  if (!kid) {
    return (
      <View style={styles.container}>
        <Text style={{ padding: 20 }}>Kid not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={recentTransactions}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => router.push(`/edit-kid/${kid.id}`)}
              >
                <Text style={styles.avatar}>{getAvatarEmoji(kid.avatarId)}</Text>
              </TouchableOpacity>
              <Text style={styles.name}>{kid.name}</Text>
              <Text style={styles.age}>Age {kid.age}</Text>
              <Text
                style={[
                  styles.balance,
                  { color: balance < 0 ? Colors.withdrawal : Colors.text },
                ]}
              >
                {formatCurrency(balance)}
              </Text>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.depositButton]}
                onPress={() => router.push(`/kid/${kid.id}/deposit`)}
              >
                <Text style={styles.actionButtonText}>+ Add Money</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.withdrawalButton]}
                onPress={() => router.push(`/kid/${kid.id}/withdrawal`)}
              >
                <Text style={styles.actionButtonText}>- Remove Money</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.insightsLink}
              onPress={() => router.push(`/kid/${kid.id}/insights`)}
            >
              <Text style={styles.insightsText}>View Insights</Text>
            </TouchableOpacity>

            {recentTransactions.length > 0 && (
              <Text style={styles.sectionTitle}>Recent Activity</Text>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <TransactionRow
            transaction={item}
            category={state.categories.find(
              (c) => c.id === item.categoryId
            )}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            emoji="\u{1F4DD}"
            title="No transactions yet"
            subtitle="Add or remove money to get started"
          />
        }
        ListFooterComponent={
          recentTransactions.length >= 10 ? (
            <TouchableOpacity
              style={styles.seeAll}
              onPress={() => router.push("/activity")}
            >
              <Text style={styles.seeAllText}>See All Activity</Text>
            </TouchableOpacity>
          ) : null
        }
      />
    </View>
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
    backgroundColor: Colors.card,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    fontSize: 64,
    marginBottom: Spacing.sm,
  },
  name: {
    fontSize: FontSize.xl,
    fontWeight: "bold",
    color: Colors.text,
  },
  age: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  balance: {
    fontSize: FontSize.balance,
    fontWeight: "bold",
    marginTop: Spacing.sm,
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  actionButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: 12,
    alignItems: "center",
  },
  depositButton: {
    backgroundColor: Colors.deposit,
  },
  withdrawalButton: {
    backgroundColor: Colors.withdrawal,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: FontSize.md,
    fontWeight: "700",
  },
  insightsLink: {
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  insightsText: {
    fontSize: FontSize.md,
    color: Colors.primary,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: "600",
    color: Colors.text,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  seeAll: {
    padding: Spacing.lg,
    alignItems: "center",
  },
  seeAllText: {
    color: Colors.primary,
    fontSize: FontSize.md,
    fontWeight: "600",
  },
});
