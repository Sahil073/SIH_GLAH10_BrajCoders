import { colors, colorTokens } from "./colors";
import { typography, fontFamilies } from "./typography";

export { colors, colorTokens } from "./colors";
export type { Colors, ColorTokens } from "./colors";

export { typography, fontFamilies } from "./typography";
export type { Typography, TypographyToken } from "./typography";

export const theme = {
  colors,
  colorTokens,
  typography,
  fontFamilies,
} as const;

export type Theme = typeof theme;

export default theme;
