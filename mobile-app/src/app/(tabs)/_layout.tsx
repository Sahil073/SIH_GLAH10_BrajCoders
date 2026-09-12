import React from "react";
import { Tabs } from "expo-router";
import { UniversalNavBar } from "@/components/navigation/UniversalNavBar";

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <UniversalNavBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="alerts" options={{ title: "Alerts" }} />
      <Tabs.Screen name="sos" options={{ title: "SOS" }} />
      <Tabs.Screen name="history" options={{ title: "History" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
