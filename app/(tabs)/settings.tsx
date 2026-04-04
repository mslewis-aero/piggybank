import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors, FontSize } from "../../constants/theme";

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Settings</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontSize: FontSize.lg,
    color: Colors.textSecondary,
  },
});
