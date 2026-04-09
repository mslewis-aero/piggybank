import React from "react";
import { View, FlatList, TouchableOpacity, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useAppContext } from "../../context/AppContext";
import { useTheme } from "../../context/ThemeContext";
import { useActiveKids } from "../../hooks/useFiltered";
import { KidCard } from "../../components/KidCard";
import { EmptyState } from "../../components/EmptyState";
import { ThemeColors, Spacing, FontSize } from "../../constants/theme";

export default function HomeScreen() {
  const { isLoaded } = useAppContext();
  const kids = useActiveKids();
  const { colors } = useTheme();
  const router = useRouter();
  const styles = makeStyles(colors);

  if (!isLoaded) return null;

  if (kids.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          emoji="🐷"
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
        data={kids}
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

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
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
      backgroundColor: colors.primary,
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
