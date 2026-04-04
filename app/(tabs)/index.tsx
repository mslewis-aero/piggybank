import React from "react";
import { View, FlatList, TouchableOpacity, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useAppContext } from "../../context/AppContext";
import { KidCard } from "../../components/KidCard";
import { EmptyState } from "../../components/EmptyState";
import { Colors, Spacing, FontSize } from "../../constants/theme";

export default function HomeScreen() {
  const { state, isLoaded } = useAppContext();
  const router = useRouter();

  if (!isLoaded) return null;

  if (state.kids.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          emoji="\u{1F437}"
          title="Add your first piggy bank!"
          subtitle="Tap the + button to get started"
        />
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push("/add-kid")}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={state.kids}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <KidCard
            kid={item}
            onPress={() => router.push(`/kid/${item.id}`)}
          />
        )}
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/add-kid")}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  grid: {
    padding: Spacing.sm,
  },
  fab: {
    position: "absolute",
    right: Spacing.lg,
    bottom: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  fabText: {
    fontSize: FontSize.xl,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
});
