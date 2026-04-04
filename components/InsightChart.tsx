import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { PieChart } from "react-native-chart-kit";
import { InsightItem } from "../hooks/useInsights";
import { Colors, FontSize, Spacing } from "../constants/theme";
import { formatCurrency } from "../utils/currency";

const CHART_COLORS = [
  "#4ECDC4",
  "#FF6B6B",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
  "#DDA0DD",
  "#98D8C8",
  "#F7DC6F",
  "#BB8FCE",
  "#85C1E9",
];

interface InsightChartProps {
  items: InsightItem[];
}

export function InsightChart({ items }: InsightChartProps) {
  const screenWidth = Dimensions.get("window").width;

  const chartData = items.map((item, index) => ({
    name: item.categoryName,
    amount: item.total,
    color: CHART_COLORS[index % CHART_COLORS.length],
    legendFontColor: Colors.text,
    legendFontSize: 13,
  }));

  return (
    <View>
      <PieChart
        data={chartData}
        width={screenWidth - Spacing.lg * 2}
        height={200}
        chartConfig={{
          color: () => Colors.text,
        }}
        accessor="amount"
        backgroundColor="transparent"
        paddingLeft="0"
        absolute={false}
      />

      <View style={styles.list}>
        {items.map((item, index) => (
          <View key={item.categoryId} style={styles.listItem}>
            <View style={styles.listLeft}>
              <View
                style={[
                  styles.colorDot,
                  {
                    backgroundColor:
                      CHART_COLORS[index % CHART_COLORS.length],
                  },
                ]}
              />
              <Text style={styles.rank}>#{index + 1}</Text>
              <Text style={styles.emoji}>{item.emoji}</Text>
              <Text style={styles.categoryName}>{item.categoryName}</Text>
            </View>
            <View style={styles.listRight}>
              <Text style={styles.total}>{formatCurrency(item.total)}</Text>
              <Text style={styles.percentage}>({item.percentage}%)</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    marginTop: Spacing.md,
  },
  listItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  listLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Spacing.sm,
  },
  rank: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: "600",
    marginRight: Spacing.sm,
    width: 24,
  },
  emoji: {
    fontSize: 18,
    marginRight: Spacing.xs,
  },
  categoryName: {
    fontSize: FontSize.md,
    color: Colors.text,
  },
  listRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  total: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.text,
  },
  percentage: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
});
