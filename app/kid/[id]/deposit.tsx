import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAppContext } from "../../../context/AppContext";
import { useKid } from "../../../hooks/useKid";
import { AmountInput } from "../../../components/AmountInput";
import { CategoryPicker } from "../../../components/CategoryPicker";
import { Colors, FontSize, Spacing } from "../../../constants/theme";

export default function DepositScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, dispatch } = useAppContext();
  const { kid } = useKid(id!);

  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const earningCategories = state.categories.filter(
    (c) => c.type === "earning"
  );
  const selectedCategory = state.categories.find((c) => c.id === categoryId);
  const isOther = selectedCategory?.name === "Other";
  const parsedAmount = parseFloat(amount) || 0;
  const isValid =
    parsedAmount > 0 && categoryId !== null && (!isOther || note.trim().length > 0);

  const handleSave = () => {
    if (!isValid) return;
    dispatch({
      type: "ADD_TRANSACTION",
      payload: {
        kidId: id!,
        type: "deposit",
        amount: parsedAmount,
        categoryId: categoryId!,
        note: note.trim() || undefined,
      },
    });
    router.back();
  };

  if (!kid) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Add Money to {kid.name}</Text>

      <AmountInput value={amount} onChangeText={setAmount} />

      <Text style={styles.label}>Category</Text>
      <CategoryPicker
        categories={earningCategories}
        selectedId={categoryId}
        onSelect={setCategoryId}
      />

      <Text style={styles.label}>
        Note {isOther ? "(required)" : "(optional)"}
      </Text>
      <TextInput
        style={[styles.noteInput, isOther && styles.noteRequired]}
        value={note}
        onChangeText={(t) => setNote(t.slice(0, 200))}
        placeholder={isOther ? "What was this for?" : "Add a note..."}
        placeholderTextColor={Colors.textLight}
        multiline
        maxLength={200}
      />
      <Text style={styles.charCount}>{note.length}/200</Text>

      <View style={styles.buttons}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveButton, !isValid && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!isValid}
        >
          <Text style={styles.saveText}>Add Money</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.lg,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: "bold",
    color: Colors.text,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
  },
  noteInput: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 80,
    textAlignVertical: "top",
  },
  noteRequired: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  charCount: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: "right",
    marginTop: Spacing.xs,
  },
  buttons: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  cancelButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: Colors.deposit,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveText: {
    fontSize: FontSize.md,
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
