import React from "react";
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { Kid } from "../types";
import { Colors, FontSize, Spacing, getAvatarEmoji } from "../constants/theme";
import { formatCurrency } from "../utils/currency";
import { useKidBalance } from "../hooks/useKid";

interface KidCardProps {
  kid: Kid;
  onPress: () => void;
}

export function KidCard({ kid, onPress }: KidCardProps) {
  const balance = useKidBalance(kid.id);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.avatar}>{getAvatarEmoji(kid.avatarId)}</Text>
      <Text style={styles.name} numberOfLines={1}>
        {kid.name}
      </Text>
      <Text
        style={[
          styles.balance,
          { color: balance < 0 ? Colors.withdrawal : Colors.text },
        ]}
      >
        {formatCurrency(balance)}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: Spacing.lg,
    alignItems: "center",
    flex: 1,
    margin: Spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  avatar: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  name: {
    fontSize: FontSize.lg,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  balance: {
    fontSize: FontSize.xl,
    fontWeight: "bold",
  },
});
