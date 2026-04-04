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
  { id: "bear", emoji: "\u{1F43B}" },
  { id: "bunny", emoji: "\u{1F430}" },
  { id: "cat", emoji: "\u{1F431}" },
  { id: "dog", emoji: "\u{1F436}" },
  { id: "fox", emoji: "\u{1F98A}" },
  { id: "owl", emoji: "\u{1F989}" },
  { id: "penguin", emoji: "\u{1F427}" },
  { id: "panda", emoji: "\u{1F43C}" },
  { id: "rocket", emoji: "\u{1F680}" },
  { id: "star", emoji: "\u2B50" },
  { id: "rainbow", emoji: "\u{1F308}" },
  { id: "unicorn", emoji: "\u{1F984}" },
  { id: "dino", emoji: "\u{1F995}" },
  { id: "robot", emoji: "\u{1F916}" },
  { id: "butterfly", emoji: "\u{1F98B}" },
  { id: "lion", emoji: "\u{1F981}" },
] as const;

export const getAvatarEmoji = (avatarId: string): string => {
  return Avatars.find((a) => a.id === avatarId)?.emoji ?? "\u{1F43B}";
};
