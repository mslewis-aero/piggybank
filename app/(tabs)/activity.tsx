import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors, FontSize, Spacing } from "../../constants/theme";

export default function ActivityScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Activity Log</Text>
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
