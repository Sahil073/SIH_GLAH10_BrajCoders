import "../../global.css";
import { useEffect } from "react";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { ClerkProvider } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";

const publishableKey =
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ||
  "pk_test_ZmFpci1ncml6emx5LTQyMTMuY2xlcmsuYWNjb3VudHMuZGV2JA";


import { initDatabase } from "@/database";
import { aiBridge } from "@/services/aiBridge";
import { InAppNotificationBanner } from "@/components/common/InAppNotificationBanner";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    "Poppins-Regular": require("../../assets/fonts/Poppins-Regular.ttf"),
    "Poppins-Medium": require("../../assets/fonts/Poppins-Medium.ttf"),
    "Poppins-SemiBold": require("../../assets/fonts/Poppins-SemiBold.ttf"),
    "Poppins-Bold": require("../../assets/fonts/Poppins-Bold.ttf"),
  });

  useEffect(() => {
    // Initialize offline on-device SQLite DB and start AI Bridge
    initDatabase().catch((e) => console.error("Database init error:", e));
    aiBridge.start();

    return () => {
      aiBridge.stop();
    };
  }, []);

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="connect-device" />
        <Stack.Screen name="onboarding-health" />
        <Stack.Screen name="disaster-modes" />
        <Stack.Screen name="caregiver-view" />
        <Stack.Screen name="trust-privacy" />
        <Stack.Screen name="asha-mode" />
        <Stack.Screen name="(tabs)" />
      </Stack>
      <InAppNotificationBanner />
    </ClerkProvider>
  );
}
