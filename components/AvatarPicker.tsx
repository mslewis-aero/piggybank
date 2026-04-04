import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Avatars, Colors, Spacing } from "../constants/theme";

interface AvatarPickerProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

export function AvatarPicker({ selectedId, onSelect }: AvatarPickerProps) {
  return (
    <View style={styles.grid}>
      {Avatars.map((avatar) => (
        <TouchableOpacity
          key={avatar.id}
          style={[
            styles.item,
            selectedId === avatar.id && styles.selected,
          ]}
          onPress={() => onSelect(avatar.id)}
        >
          <Text style={styles.emoji}>{avatar.emoji}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  item: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selected: {
    borderColor: Colors.primary,
    backgroundColor: "#E8FAF8",
  },
  emoji: {
    fontSize: 28,
  },
});
