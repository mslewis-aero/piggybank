import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import * as Crypto from "expo-crypto";
import { useAppContext } from "../context/AppContext";
import { AvatarPicker } from "../components/AvatarPicker";
import { Colors, FontSize, Spacing, Avatars } from "../constants/theme";

export default function AddKidScreen() {
  const { dispatch } = useAppContext();
  const router = useRouter();

  const [name, setName] = useState("");
  const [age, setAge] = useState("5");
  const [avatarId, setAvatarId] = useState<string>(Avatars[0].id);

  const ageNum = parseInt(age, 10);
  const isValid = name.trim().length > 0 && ageNum >= 1 && ageNum <= 17;

  const handleSave = () => {
    if (!isValid) return;
    dispatch({
      type: "ADD_KID",
      payload: {
        id: Crypto.randomUUID(),
        name: name.trim(),
        age: ageNum,
        avatarId,
      },
    });
    router.back();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Add a Piggy Bank</Text>

      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={(t) => setName(t.slice(0, 20))}
        placeholder="Kid's name"
        placeholderTextColor={Colors.textLight}
        autoFocus
      />

      <Text style={styles.label}>Age</Text>
      <TextInput
        style={styles.input}
        value={age}
        onChangeText={(t) => {
          const cleaned = t.replace(/[^0-9]/g, "").slice(0, 2);
          setAge(cleaned);
        }}
        keyboardType="number-pad"
        placeholder="5"
        placeholderTextColor={Colors.textLight}
      />

      <Text style={styles.label}>Choose an Avatar</Text>
      <AvatarPicker selectedId={avatarId} onSelect={setAvatarId} />

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
          <Text style={styles.saveText}>Save</Text>
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
    marginBottom: Spacing.lg,
    textAlign: "center",
  },
  label: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
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
    backgroundColor: Colors.primary,
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
