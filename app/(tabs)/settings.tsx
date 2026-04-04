import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, FontSize, Spacing } from "../../constants/theme";

export default function SettingsScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Categories</Text>

      <TouchableOpacity
        style={styles.row}
        onPress={() => router.push("/settings-categories?type=earning")}
      >
        <Ionicons name="trending-up" size={22} color={Colors.deposit} />
        <Text style={styles.rowText}>Manage Earning Categories</Text>
        <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.row}
        onPress={() => router.push("/settings-categories?type=spending")}
      >
        <Ionicons name="trending-down" size={22} color={Colors.withdrawal} />
        <Text style={styles.rowText}>Manage Spending Categories</Text>
        <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
      </TouchableOpacity>

      <Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>
        About
      </Text>

      <View style={styles.row}>
        <Text style={styles.rowText}>Version</Text>
        <Text style={styles.rowValue}>1.0.0</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Made with love for families</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    padding: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  rowText: {
    fontSize: FontSize.md,
    color: Colors.text,
    flex: 1,
  },
  rowValue: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  footer: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: Spacing.xl,
  },
  footerText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
});
