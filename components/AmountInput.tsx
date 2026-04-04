import React from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { Colors, FontSize, Spacing } from "../constants/theme";

interface AmountInputProps {
  value: string;
  onChangeText: (text: string) => void;
}

export function AmountInput({ value, onChangeText }: AmountInputProps) {
  const handleChange = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, "");
    const parts = cleaned.split(".");
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;
    onChangeText(cleaned);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.dollar}>$</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={handleChange}
        keyboardType="decimal-pad"
        placeholder="0.00"
        placeholderTextColor={Colors.textLight}
        maxLength={8}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
  },
  dollar: {
    fontSize: FontSize.balance,
    fontWeight: "bold",
    color: Colors.text,
    marginRight: Spacing.xs,
  },
  input: {
    fontSize: FontSize.balance,
    fontWeight: "bold",
    color: Colors.text,
    minWidth: 120,
    textAlign: "center",
  },
});
