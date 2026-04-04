import React from "react";
import {
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
} from "react-native";
import { Category } from "../types";
import { Colors, FontSize, Spacing } from "../constants/theme";

interface CategoryPickerProps {
  categories: Category[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function CategoryPicker({
  categories,
  selectedId,
  onSelect,
}: CategoryPickerProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {categories.map((cat) => (
        <TouchableOpacity
          key={cat.id}
          style={[
            styles.chip,
            selectedId === cat.id && styles.chipSelected,
          ]}
          onPress={() => onSelect(cat.id)}
        >
          <Text style={styles.chipEmoji}>{cat.emoji}</Text>
          <Text
            style={[
              styles.chipText,
              selectedId === cat.id && styles.chipTextSelected,
            ]}
          >
            {cat.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipEmoji: {
    fontSize: 16,
    marginRight: Spacing.xs,
  },
  chipText: {
    fontSize: FontSize.sm,
    color: Colors.text,
  },
  chipTextSelected: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
