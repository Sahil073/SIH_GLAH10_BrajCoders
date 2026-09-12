import React from "react";
import { Redirect } from "expo-router";
import { useAuth } from "@clerk/expo";
import { useUserProfile } from "@/store/userProfileStore";

export default function Index() {
  const { isLoaded, isSignedIn } = useAuth();
  const { profile } = useUserProfile();

  // If locally logged in OR signed in via Clerk, go directly to Dashboard
  if (profile.isLoggedIn || isSignedIn) {
    return <Redirect href={"/(tabs)" as any} />;
  }

  if (!isLoaded) {
    return null;
  }

  return <Redirect href="/onboarding" />;
}

