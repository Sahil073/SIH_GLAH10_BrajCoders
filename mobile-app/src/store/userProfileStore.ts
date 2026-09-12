import { useState, useEffect, useCallback } from "react";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export type GenderType = "Female" | "Male" | "Other";
export type BloodGroupType = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";

export interface UserHealthProfile {
  age: number;
  gender: GenderType;
  heightCm: number;
  weightKg: number;
  bloodGroup: BloodGroupType;
  medicalCondition: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  isCompleted: boolean;
}

/**
 * Baseline profile initialized with standard reference values (matching user reference image)
 */
export const DEFAULT_USER_PROFILE: UserHealthProfile = {
  age: 22,
  gender: "Female",
  heightCm: 165,
  weightKg: 58,
  bloodGroup: "B+",
  medicalCondition: "None",
  emergencyContactName: "Dr. Sharma (Guardian)",
  emergencyContactPhone: "+91 98765 43210",
  isCompleted: false,
};

const STORAGE_KEY = "sanjeevni_user_health_profile_v1";

// In-memory cache for fast synchronous access
let cachedProfile: UserHealthProfile = { ...DEFAULT_USER_PROFILE };
const listeners: Set<(profile: UserHealthProfile) => void> = new Set();

function notifyListeners() {
  listeners.forEach((listener) => listener(cachedProfile));
}

/**
 * Persists user health profile to SecureStore (with fallback for web)
 */
export async function saveUserProfile(profile: UserHealthProfile): Promise<void> {
  cachedProfile = { ...profile };
  notifyListeners();

  try {
    const json = JSON.stringify(profile);
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, json);
      }
    } else {
      await SecureStore.setItemAsync(STORAGE_KEY, json);
    }
  } catch (error) {
    console.warn("Failed to persist user profile to SecureStore:", error);
  }
}

/**
 * Loads user health profile from SecureStore
 */
export async function loadUserProfile(): Promise<UserHealthProfile> {
  try {
    let json: string | null = null;
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.localStorage) {
        json = window.localStorage.getItem(STORAGE_KEY);
      }
    } else {
      json = await SecureStore.getItemAsync(STORAGE_KEY);
    }

    if (json) {
      const parsed = JSON.parse(json) as UserHealthProfile;
      cachedProfile = { ...DEFAULT_USER_PROFILE, ...parsed };
      notifyListeners();
      return cachedProfile;
    }
  } catch (error) {
    console.warn("Failed to load user profile from SecureStore:", error);
  }
  return cachedProfile;
}

/**
 * Hook to reactively consume and update user health profile across screens
 */
export function useUserProfile() {
  const [profile, setProfile] = useState<UserHealthProfile>(cachedProfile);

  useEffect(() => {
    // Initial load
    void loadUserProfile();

    // Subscribe to updates
    const listener = (newProfile: UserHealthProfile) => {
      setProfile(newProfile);
    };
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  }, []);

  const updateProfile = useCallback(async (updates: Partial<UserHealthProfile>) => {
    const next = { ...cachedProfile, ...updates };
    await saveUserProfile(next);
  }, []);

  return {
    profile,
    updateProfile,
  };
}
