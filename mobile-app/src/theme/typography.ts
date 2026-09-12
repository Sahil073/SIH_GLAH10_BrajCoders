export const fontFamilies = {
  regular: "Poppins-Regular",
  medium: "Poppins-Medium",
  semiBold: "Poppins-SemiBold",
  bold: "Poppins-Bold",
} as const;

export interface TypographyToken {
  name: string;
  role: string;
  fontSize: number;
  lineHeightMultiplier: number;
  lineHeight: number;
  fontWeight: "400" | "500" | "600" | "700";
  fontFamily: string;
}

export const typography = {
  h1: {
    name: "H1",
    role: "Page / Screen Title",
    fontSize: 32,
    lineHeightMultiplier: 1.2,
    lineHeight: 38.4,
    fontWeight: "700",
    fontFamily: fontFamilies.bold,
  },
  h2: {
    name: "H2",
    role: "Section Title",
    fontSize: 24,
    lineHeightMultiplier: 1.3,
    lineHeight: 31.2,
    fontWeight: "600",
    fontFamily: fontFamilies.semiBold,
  },
  h3: {
    name: "H3",
    role: "Card / Module Title",
    fontSize: 20,
    lineHeightMultiplier: 1.3,
    lineHeight: 26,
    fontWeight: "600",
    fontFamily: fontFamilies.semiBold,
  },
  h4: {
    name: "H4",
    role: "Subheading",
    fontSize: 16,
    lineHeightMultiplier: 1.4,
    lineHeight: 22.4,
    fontWeight: "500",
    fontFamily: fontFamilies.medium,
  },
  bodyLarge: {
    name: "Body Large",
    role: "Important content",
    fontSize: 16,
    lineHeightMultiplier: 1.6,
    lineHeight: 25.6,
    fontWeight: "400",
    fontFamily: fontFamilies.regular,
  },
  bodyMedium: {
    name: "Body Medium",
    role: "Body text",
    fontSize: 14,
    lineHeightMultiplier: 1.6,
    lineHeight: 22.4,
    fontWeight: "400",
    fontFamily: fontFamilies.regular,
  },
  bodySmall: {
    name: "Body Small",
    role: "Supporting text",
    fontSize: 13,
    lineHeightMultiplier: 1.6,
    lineHeight: 20.8,
    fontWeight: "400",
    fontFamily: fontFamilies.regular,
  },
  caption: {
    name: "Caption",
    role: "Labels, meta text",
    fontSize: 11,
    lineHeightMultiplier: 1.4,
    lineHeight: 15.4,
    fontWeight: "400",
    fontFamily: fontFamilies.regular,
  },
} as const;

export type Typography = typeof typography;

export default typography;
