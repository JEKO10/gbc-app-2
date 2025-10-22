export const theme = {
  colors: {
    background: "#f5f7fb",
    surface: "#ffffff",
    primary: "#2563eb",
    primaryDark: "#1d4ed8",
    accent: "#10b981",
    warning: "#f97316",
    success: "#22c55e",
    danger: "#ef4444",
    text: "#111827",
    muted: "#6b7280",
    border: "#e5e7eb",
    subtle: "#cbd5f5",
  },
  spacing: {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 24,
    xl: 32,
  },
  radii: {
    sm: 10,
    md: 16,
    lg: 24,
  },
  shadow: {
    card: {
      shadowColor: "#111827",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.06,
      shadowRadius: 18,
      elevation: 4,
    },
  },
} as const;

export type Theme = typeof theme;
