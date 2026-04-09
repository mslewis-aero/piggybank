import React from "react";
import { Stack } from "expo-router";
import { AppProvider } from "../context/AppContext";
import { ThemeProvider, useTheme } from "../context/ThemeContext";

function ThemedStack() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="add-kid"
        options={{
          title: "Add Piggy Bank",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="edit-kid/[id]"
        options={{
          title: "Edit Piggy Bank",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="kid/[id]/index"
        options={{ title: "Piggy Bank" }}
      />
      <Stack.Screen
        name="kid/[id]/deposit"
        options={{
          title: "Add Money",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="kid/[id]/withdrawal"
        options={{
          title: "Remove Money",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="kid/[id]/insights"
        options={{ title: "Insights" }}
      />
      <Stack.Screen
        name="settings-categories"
        options={{
          title: "Manage Categories",
        }}
      />
      <Stack.Screen
        name="settings-recently-deleted"
        options={{
          title: "Recently Deleted",
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AppProvider>
        <ThemedStack />
      </AppProvider>
    </ThemeProvider>
  );
}
