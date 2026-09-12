import React from "react";
import { Redirect } from "expo-router";
import { useAuth } from "@clerk/expo";
import { useUserProfile } from "@/store/userProfileStore";

export default function Index() {
  const { isLoaded, isSignedIn } = useAuth();
  const { profile } = useUserProfile();

  if (!isLoaded) {
    return null;
  }

  if (!isSignedIn) {
    return <Redirect href="/onboarding" />;
  }

  if (!profile.isCompleted) {
    return <Redirect href="/onboarding-health" />;
  }

  return <Redirect href={"/(tabs)" as any} />;
}
