export const Colors = {
  primary: "#4ECDC4",
  primaryDark: "#3DBDB5",
  deposit: "#2ECC71",
  withdrawal: "#E74C3C",
  background: "#F8F9FA",
  card: "#FFFFFF",
  text: "#2D3436",
  textSecondary: "#636E72",
  textLight: "#B2BEC3",
  border: "#DFE6E9",
  shadow: "#00000010",
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const FontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 32,
  balance: 36,
} as const;

export const Avatars = [
  { id: "bear", emoji: "🐻" },
  { id: "bunny", emoji: "🐰" },
  { id: "cat", emoji: "🐱" },
  { id: "dog", emoji: "🐶" },
  { id: "fox", emoji: "🦊" },
  { id: "owl", emoji: "🦉" },
  { id: "penguin", emoji: "🐧" },
  { id: "panda", emoji: "🐼" },
  { id: "rocket", emoji: "🚀" },
  { id: "star", emoji: "⭐" },
  { id: "rainbow", emoji: "🌈" },
  { id: "unicorn", emoji: "🦄" },
  { id: "dino", emoji: "🦕" },
  { id: "robot", emoji: "🤖" },
  { id: "butterfly", emoji: "🦋" },
  { id: "lion", emoji: "🦁" },
] as const;

export const getAvatarEmoji = (avatarId: string): string => {
  return Avatars.find((a) => a.id === avatarId)?.emoji ?? "🐻";
};
