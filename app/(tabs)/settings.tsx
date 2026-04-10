import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Keyboard } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useAppContext } from "../../context/AppContext";
import { getManualAddress, setManualAddress } from "../../utils/discovery";
import { ThemeColors, ThemeMode, FontSize, Spacing } from "../../constants/theme";

const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { mode: "light", label: "Light", icon: "sunny" },
  { mode: "dark", label: "Dark", icon: "moon" },
  { mode: "system", label: "System", icon: "phone-portrait-outline" },
];

const SYNC_DISPLAY: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap; color: (c: ThemeColors) => string }> = {
  idle: { label: "Not synced", icon: "cloud-outline", color: (c) => c.textLight },
  syncing: { label: "Syncing...", icon: "sync-outline", color: (c) => c.primary },
  synced: { label: "Synced", icon: "checkmark-circle", color: (c) => c.deposit },
  offline: { label: "Offline", icon: "cloud-offline-outline", color: (c) => c.textSecondary },
};

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, themeMode, setThemeMode } = useTheme();
  const { syncStatus, triggerSync } = useAppContext();
  const styles = makeStyles(colors);
  const sync = SYNC_DISPLAY[syncStatus] || SYNC_DISPLAY.idle;

  const [serverAddr, setServerAddr] = useState("");
  const [addrLoaded, setAddrLoaded] = useState(false);

  useEffect(() => {
    getManualAddress().then((addr) => {
      setServerAddr(addr);
      setAddrLoaded(true);
    });
  }, []);

  const handleSaveAddress = () => {
    Keyboard.dismiss();
    setManualAddress(serverAddr).then(() => {
      triggerSync();
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Sync</Text>

      <View style={styles.row}>
        <Ionicons name={sync.icon} size={22} color={sync.color(colors)} />
        <Text style={styles.rowText}>{sync.label}</Text>
      </View>

      <View style={styles.serverRow}>
        <TextInput
          style={styles.serverInput}
          value={serverAddr}
          onChangeText={setServerAddr}
          placeholder="Server IP (e.g. 192.168.1.100)"
          placeholderTextColor={colors.textLight}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          returnKeyType="done"
          onSubmitEditing={handleSaveAddress}
        />
        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveAddress}>
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>
        Appearance
      </Text>

      <View style={styles.themeRow}>
        {THEME_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.mode}
            style={[
              styles.themeOption,
              themeMode === opt.mode && styles.themeOptionActive,
            ]}
            onPress={() => setThemeMode(opt.mode)}
          >
            <Ionicons
              name={opt.icon}
              size={22}
              color={themeMode === opt.mode ? "#FFFFFF" : colors.textSecondary}
            />
            <Text
              style={[
                styles.themeLabel,
                themeMode === opt.mode && styles.themeLabelActive,
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>
        Categories
      </Text>

      <TouchableOpacity
        style={styles.row}
        onPress={() => router.push("/settings-categories?type=earning")}
      >
        <Ionicons name="trending-up" size={22} color={colors.deposit} />
        <Text style={styles.rowText}>Manage Earning Categories</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.row}
        onPress={() => router.push("/settings-categories?type=spending")}
      >
        <Ionicons name="trending-down" size={22} color={colors.withdrawal} />
        <Text style={styles.rowText}>Manage Spending Categories</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
      </TouchableOpacity>

      <Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>
        Data
      </Text>

      <TouchableOpacity
        style={styles.row}
        onPress={() => router.push("/settings-recently-deleted")}
      >
        <Ionicons name="trash-outline" size={22} color={colors.withdrawal} />
        <Text style={styles.rowText}>Recently Deleted</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
      </TouchableOpacity>

      <Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>
        About
      </Text>

      <View style={styles.row}>
        <Text style={styles.rowText}>Version</Text>
        <Text style={styles.rowValue}>1.0.0</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Made with love for families</Text>
      </View>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: Spacing.md,
    },
    sectionTitle: {
      fontSize: FontSize.sm,
      fontWeight: "700",
      color: colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: Spacing.sm,
      marginTop: Spacing.md,
      paddingHorizontal: Spacing.sm,
    },
    serverRow: {
      flexDirection: "row",
      gap: Spacing.sm,
      marginBottom: Spacing.sm,
    },
    serverInput: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: Spacing.md,
      fontSize: FontSize.md,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    saveBtn: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingHorizontal: Spacing.lg,
      justifyContent: "center",
      alignItems: "center",
    },
    saveBtnText: {
      color: "#FFFFFF",
      fontSize: FontSize.md,
      fontWeight: "600",
    },
    themeRow: {
      flexDirection: "row",
      gap: Spacing.sm,
    },
    themeOption: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: Spacing.xs,
      backgroundColor: colors.card,
      padding: Spacing.md,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.border,
    },
    themeOptionActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    themeLabel: {
      fontSize: FontSize.sm,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    themeLabelActive: {
      color: "#FFFFFF",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      padding: Spacing.md,
      borderRadius: 12,
      marginBottom: Spacing.sm,
      gap: Spacing.sm,
    },
    rowText: {
      fontSize: FontSize.md,
      color: colors.text,
      flex: 1,
    },
    rowValue: {
      fontSize: FontSize.md,
      color: colors.textSecondary,
    },
    footer: {
      flex: 1,
      justifyContent: "flex-end",
      alignItems: "center",
      paddingBottom: Spacing.xl,
    },
    footerText: {
      fontSize: FontSize.sm,
      color: colors.textSecondary,
    },
  });
