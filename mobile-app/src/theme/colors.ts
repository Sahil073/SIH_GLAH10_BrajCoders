export const colors = {
  // Primary Lingua Brand Colors
  primary: {
    purple: "#6C4EF5",
    deepPurple: "#5B3BF6",
    blue: "#4D8BFF",
    green: "#21C16B",
  },

  // Semantic Status Colors
  semantic: {
    success: "#21C16B",
    warning: "#FFC800",
    streak: "#FF8A00",
    error: "#FF4D4F",
    info: "#4D8BFF",
  },

  // Neutral Theme Colors
  neutral: {
    textPrimary: "#0D132B",
    textSecondary: "#6B7280",
    border: "#E5E7EB",
    surface: "#F6F7FB",
    background: "#FFFFFF",
  },
} as const;

// Flattened mapping for Tailwind configuration and direct token usage
export const colorTokens = {
  // Brand
  "lingua-purple": colors.primary.purple,
  "lingua-deep-purple": colors.primary.deepPurple,
  "lingua-blue": colors.primary.blue,
  "lingua-green": colors.primary.green,

  // Semantic
  success: colors.semantic.success,
  warning: colors.semantic.warning,
  streak: colors.semantic.streak,
  error: colors.semantic.error,
  info: colors.semantic.info,

  // Neutrals
  "text-primary": colors.neutral.textPrimary,
  "text-secondary": colors.neutral.textSecondary,
  "border-neutral": colors.neutral.border,
  border: colors.neutral.border,
  surface: colors.neutral.surface,
  background: colors.neutral.background,
} as const;

export type Colors = typeof colors;
export type ColorTokens = typeof colorTokens;

export default colors;
