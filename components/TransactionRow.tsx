import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Transaction, Category } from "../types";
import { Colors, FontSize, Spacing } from "../constants/theme";
import { formatSignedCurrency } from "../utils/currency";

interface TransactionRowProps {
  transaction: Transaction;
  category: Category | undefined;
  showKidName?: string;
}

export function TransactionRow({
  transaction,
  category,
  showKidName,
}: TransactionRowProps) {
  const isDeposit = transaction.type === "deposit";
  const date = new Date(transaction.createdAt);
  const dateStr = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Text style={styles.emoji}>{category?.emoji ?? "?"}</Text>
        <View style={styles.details}>
          <Text style={styles.categoryName}>
            {category?.name ?? "Unknown"}
          </Text>
          {showKidName && (
            <Text style={styles.kidName}>{showKidName}</Text>
          )}
          {transaction.note ? (
            <Text style={styles.note} numberOfLines={1}>
              {transaction.note}
            </Text>
          ) : null}
        </View>
      </View>
      <View style={styles.right}>
        <Text
          style={[
            styles.amount,
            { color: isDeposit ? Colors.deposit : Colors.withdrawal },
          ]}
        >
          {formatSignedCurrency(transaction.amount, transaction.type)}
        </Text>
        <Text style={styles.date}>{dateStr}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  emoji: {
    fontSize: 24,
    marginRight: Spacing.sm,
  },
  details: {
    flex: 1,
  },
  categoryName: {
    fontSize: FontSize.md,
    fontWeight: "500",
    color: Colors.text,
  },
  kidName: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  note: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  right: {
    alignItems: "flex-end",
    marginLeft: Spacing.sm,
  },
  amount: {
    fontSize: FontSize.md,
    fontWeight: "700",
  },
  date: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
