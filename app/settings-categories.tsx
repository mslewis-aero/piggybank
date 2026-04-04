import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAppContext } from "../context/AppContext";
import { UNDELETABLE_CATEGORY_IDS } from "../utils/defaults";
import { Colors, FontSize, Spacing } from "../constants/theme";
import { CategoryType } from "../types";

export default function ManageCategoriesScreen() {
  const { state, dispatch } = useAppContext();
  const params = useLocalSearchParams<{ type: string }>();
  const type = (params.type ?? "earning") as CategoryType;

  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("");
  const [showForm, setShowForm] = useState(false);

  const categories = state.categories.filter((c) => c.type === type);
  const title = type === "earning" ? "Earning Categories" : "Spending Categories";

  const handleAdd = () => {
    if (!newName.trim()) return;
    dispatch({
      type: "ADD_CATEGORY",
      payload: {
        name: newName.trim(),
        type,
        emoji: newEmoji || (type === "earning" ? "\u{1F4B0}" : "\u{1F6D2}"),
      },
    });
    setNewName("");
    setNewEmoji("");
    setShowForm(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (UNDELETABLE_CATEGORY_IDS.includes(id)) return;

    const transactionCount = state.transactions.filter(
      (t) => t.categoryId === id
    ).length;

    const message =
      transactionCount > 0
        ? `This will delete "${name}" and reassign ${transactionCount} transaction(s) to "Other". Continue?`
        : `Delete "${name}"?`;

    Alert.alert("Delete Category", message, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => dispatch({ type: "DELETE_CATEGORY", payload: { id } }),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>

      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isUndeletable = UNDELETABLE_CATEGORY_IDS.includes(item.id);
          return (
            <View style={styles.row}>
              <Text style={styles.emoji}>{item.emoji}</Text>
              <Text style={styles.name}>{item.name}</Text>
              {isUndeletable ? (
                <Text style={styles.locked}>Required</Text>
              ) : (
                <TouchableOpacity
                  onPress={() => handleDelete(item.id, item.name)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color={Colors.withdrawal}
                  />
                </TouchableOpacity>
              )}
            </View>
          );
        }}
        ListFooterComponent={
          <View>
            {showForm ? (
              <View style={styles.form}>
                <View style={styles.formRow}>
                  <TextInput
                    style={styles.emojiInput}
                    value={newEmoji}
                    onChangeText={(t) => setNewEmoji(t.slice(0, 2))}
                    placeholder="\u{1F600}"
                    placeholderTextColor={Colors.textLight}
                    textAlign="center"
                  />
                  <TextInput
                    style={styles.nameInput}
                    value={newName}
                    onChangeText={(t) => setNewName(t.slice(0, 30))}
                    placeholder="Category name"
                    placeholderTextColor={Colors.textLight}
                    autoFocus
                  />
                </View>
                <View style={styles.formButtons}>
                  <TouchableOpacity
                    onPress={() => {
                      setShowForm(false);
                      setNewName("");
                      setNewEmoji("");
                    }}
                  >
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.addBtn,
                      !newName.trim() && styles.addBtnDisabled,
                    ]}
                    onPress={handleAdd}
                    disabled={!newName.trim()}
                  >
                    <Text style={styles.addBtnText}>Add</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addCategory}
                onPress={() => setShowForm(true)}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={22}
                  color={Colors.primary}
                />
                <Text style={styles.addCategoryText}>Add Category</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.md,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    padding: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.sm,
  },
  emoji: {
    fontSize: 22,
    marginRight: Spacing.sm,
  },
  name: {
    fontSize: FontSize.md,
    color: Colors.text,
    flex: 1,
  },
  locked: {
    fontSize: FontSize.xs,
    color: Colors.textLight,
    fontStyle: "italic",
  },
  form: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  formRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  emojiInput: {
    width: 50,
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: Spacing.sm,
    fontSize: 22,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  nameInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: Spacing.sm,
    fontSize: FontSize.md,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  formButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Spacing.md,
    marginTop: Spacing.md,
    alignItems: "center",
  },
  cancelText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  addBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
  },
  addBtnDisabled: {
    opacity: 0.5,
  },
  addBtnText: {
    color: "#FFFFFF",
    fontSize: FontSize.md,
    fontWeight: "600",
  },
  addCategory: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  addCategoryText: {
    fontSize: FontSize.md,
    color: Colors.primary,
    fontWeight: "600",
  },
});
