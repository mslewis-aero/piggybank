import React from "react";
import { Stack } from "expo-router";
import { AppProvider } from "../context/AppContext";
import { Colors } from "../constants/theme";

export default function RootLayout() {
  return (
    <AppProvider>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: Colors.card },
          headerTintColor: Colors.text,
          contentStyle: { backgroundColor: Colors.background },
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
      </Stack>
    </AppProvider>
  );
}
