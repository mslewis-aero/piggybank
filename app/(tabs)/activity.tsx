import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useAppContext } from "../../context/AppContext";
import { useAllTransactions } from "../../hooks/useTransactions";
import { TransactionRow } from "../../components/TransactionRow";
import { EmptyState } from "../../components/EmptyState";
import { Colors, FontSize, Spacing, getAvatarEmoji } from "../../constants/theme";

function formatDateHeader(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const txDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (txDate.getTime() === today.getTime()) return "Today";
  if (txDate.getTime() === yesterday.getTime()) return "Yesterday";
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

interface DateSection {
  title: string;
  data: ReturnType<typeof useAllTransactions>;
}

export default function ActivityScreen() {
  const { state } = useAppContext();
  const [kidFilter, setKidFilter] = useState<string | undefined>(undefined);
  const transactions = useAllTransactions(kidFilter);

  const sections = useMemo(() => {
    const groups: DateSection[] = [];
    let currentDate = "";
    for (const t of transactions) {
      const dateKey = t.createdAt.split("T")[0];
      if (dateKey !== currentDate) {
        currentDate = dateKey;
        groups.push({ title: formatDateHeader(t.createdAt), data: [] });
      }
      groups[groups.length - 1].data.push(t);
    }
    return groups;
  }, [transactions]);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterBar}
      >
        <TouchableOpacity
          style={[
            styles.filterChip,
            !kidFilter && styles.filterChipActive,
          ]}
          onPress={() => setKidFilter(undefined)}
        >
          <Text
            style={[
              styles.filterText,
              !kidFilter && styles.filterTextActive,
            ]}
          >
            All Kids
          </Text>
        </TouchableOpacity>
        {state.kids.map((kid) => (
          <TouchableOpacity
            key={kid.id}
            style={[
              styles.filterChip,
              kidFilter === kid.id && styles.filterChipActive,
            ]}
            onPress={() =>
              setKidFilter(kidFilter === kid.id ? undefined : kid.id)
            }
          >
            <Text style={styles.filterEmoji}>
              {getAvatarEmoji(kid.avatarId)}
            </Text>
            <Text
              style={[
                styles.filterText,
                kidFilter === kid.id && styles.filterTextActive,
              ]}
            >
              {kid.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {transactions.length === 0 ? (
        <EmptyState
          emoji="\u{1F4CB}"
          title="No activity yet"
          subtitle="Transactions will appear here"
        />
      ) : (
        <FlatList
          data={sections}
          keyExtractor={(item) => item.title}
          renderItem={({ item: section }) => (
            <View>
              <Text style={styles.dateHeader}>{section.title}</Text>
              {section.data.map((t) => {
                const kid = state.kids.find((k) => k.id === t.kidId);
                return (
                  <TransactionRow
                    key={t.id}
                    transaction={t}
                    category={state.categories.find(
                      (c) => c.id === t.categoryId
                    )}
                    showKidName={!kidFilter ? kid?.name : undefined}
                  />
                );
              })}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  filterBar: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterEmoji: {
    fontSize: 16,
    marginRight: Spacing.xs,
  },
  filterText: {
    fontSize: FontSize.sm,
    color: Colors.text,
  },
  filterTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  dateHeader: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
  },
});
