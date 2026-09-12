import { useState, useEffect, useCallback } from "react";
import { useColorScheme } from "react-native";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export type ThemeMode = "light" | "dark" | "system";

export interface ThemePalette {
  isDark: boolean;
  background: string;
  backgroundSecondary: string;
  cardBg: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  divider: string;
  limeCard: string;
  limeCardText: string;
  limeCardSub: string;
  sandCard: string;
  sandCardText: string;
  sandCardSub: string;
  statusOptimalBg: string;
  statusOptimalBorder: string;
  statusOptimalText: string;
}

export const LIGHT_PALETTE: ThemePalette = {
  isDark: false,
  background: "#F7FAF8",
  backgroundSecondary: "#FFFFFF",
  cardBg: "#FFFFFF",
  cardBorder: "#E8E4DC",
  textPrimary: "#161616",
  textSecondary: "#55695E",
  textMuted: "#86837C",
  divider: "#F0EDE6",
  limeCard: "#D2EE4D",
  limeCardText: "#161616",
  limeCardSub: "#3E4A10",
  sandCard: "#ECE8E1",
  sandCardText: "#161616",
  sandCardSub: "#86837C",
  statusOptimalBg: "#EAF7EE",
  statusOptimalBorder: "#CFECD7",
  statusOptimalText: "#14532D",
};

export const DARK_PALETTE: ThemePalette = {
  isDark: true,
  background: "#0D110F",
  backgroundSecondary: "#141A16",
  cardBg: "#17201B",
  cardBorder: "#27362E",
  textPrimary: "#F3F7F4",
  textSecondary: "#9EB0A5",
  textMuted: "#718378",
  divider: "#202C25",
  limeCard: "#B4D033",
  limeCardText: "#111804",
  limeCardSub: "#2C3B0B",
  sandCard: "#222B26",
  sandCardText: "#F0F4F1",
  sandCardSub: "#96A59A",
  statusOptimalBg: "#162B1F",
  statusOptimalBorder: "#214A32",
  statusOptimalText: "#86EFAC",
};

const THEME_STORAGE_KEY = "sanjeevni_theme_mode_pref";

let currentMode: ThemeMode = "light";
const listeners: Set<(mode: ThemeMode) => void> = new Set();

function notifyThemeListeners() {
  listeners.forEach((fn) => fn(currentMode));
}

export async function setStoredThemeMode(mode: ThemeMode): Promise<void> {
  currentMode = mode;
  notifyThemeListeners();
  try {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(THEME_STORAGE_KEY, mode);
      }
    } else {
      await SecureStore.setItemAsync(THEME_STORAGE_KEY, mode);
    }
  } catch (e) {
    console.warn("Failed to persist theme mode:", e);
  }
}

export async function loadStoredThemeMode(): Promise<ThemeMode> {
  try {
    let val: string | null = null;
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.localStorage) {
        val = window.localStorage.getItem(THEME_STORAGE_KEY);
      }
    } else {
      val = await SecureStore.getItemAsync(THEME_STORAGE_KEY);
    }
    if (val === "light" || val === "dark" || val === "system") {
      currentMode = val;
      notifyThemeListeners();
      return val;
    }
  } catch (e) {
    console.warn("Failed to load theme mode:", e);
  }
  return currentMode;
}

export function useTheme() {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>(currentMode);

  useEffect(() => {
    void loadStoredThemeMode();
    const listener = (newMode: ThemeMode) => setMode(newMode);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const isDark =
    mode === "dark" || (mode === "system" && systemScheme === "dark");

  const colors = isDark ? DARK_PALETTE : LIGHT_PALETTE;

  const toggleTheme = useCallback(async () => {
    const nextMode: ThemeMode = isDark ? "light" : "dark";
    await setStoredThemeMode(nextMode);
  }, [isDark]);

  const setTheme = useCallback(async (newMode: ThemeMode) => {
    await setStoredThemeMode(newMode);
  }, []);

  return {
    themeMode: mode,
    isDark,
    colors,
    toggleTheme,
    setTheme,
  };
}

