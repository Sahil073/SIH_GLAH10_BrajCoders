import { useState, useEffect, useCallback } from "react";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import {
  fetchLocalUserProfile,
  persistLocalUserProfile,
  resetLocalUserProfile,
  normalizeUserId,
} from "@/database";

export type GenderType = "Female" | "Male" | "Other";
export type BloodGroupType = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";

export interface UserHealthProfile {
  userId: string;
  name: string;
  email: string;
  pin: string;
  age: number;
  gender: GenderType;
  heightCm: number;
  weightKg: number;
  bloodGroup: BloodGroupType;
  medicalCondition: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  isCompleted: boolean;
  isLoggedIn: boolean;
}

export const DEFAULT_OFFLINE_PROFILE: UserHealthProfile = {
  userId: "offline_local",
  name: "Offline Worker",
  email: "offline@sanjeevni.local",
  pin: "",
  age: 25,
  gender: "Male",
  heightCm: 172,
  weightKg: 68,
  bloodGroup: "B+",
  medicalCondition: "None",
  emergencyContactName: "Site Supervisor",
  emergencyContactPhone: "+91 98765 43210",
  isCompleted: true,
  isLoggedIn: true,
};

const ACTIVE_USER_KEY = "sanjeevni_active_user_id_v4";
const PROFILE_KEY_PREFIX = "sanjeevni_profile_v4_";

let activeUserId = "offline_local";
let cachedProfile: UserHealthProfile = { ...DEFAULT_OFFLINE_PROFILE };
const listeners: Set<(profile: UserHealthProfile) => void> = new Set();

function notifyListeners() {
  listeners.forEach((listener) => listener(cachedProfile));
}

export function getActiveUserId(): string {
  return activeUserId;
}

export function setActiveUserId(uid: string): void {
  activeUserId = normalizeUserId(uid);
}

/**
 * Persists user health profile & credentials scoped to their user ID.
 */
export async function saveUserProfile(
  profile: Partial<UserHealthProfile>,
  userId?: string
): Promise<void> {
  const uid = normalizeUserId(userId || profile.userId || activeUserId);
  activeUserId = uid;

  cachedProfile = {
    ...cachedProfile,
    ...profile,
    userId: uid,
  };
  notifyListeners();

  try {
    const json = JSON.stringify(cachedProfile);
    const storageKey = PROFILE_KEY_PREFIX + uid;

    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(storageKey, json);
        window.localStorage.setItem(ACTIVE_USER_KEY, uid);
      }
    } else {
      await SecureStore.setItemAsync(storageKey, json);
      await SecureStore.setItemAsync(ACTIVE_USER_KEY, uid);
    }

    // Sync into user-scoped SQLite user_profile table
    await persistLocalUserProfile(
      {
        userId: uid,
        name: cachedProfile.name,
        email: cachedProfile.email,
        pin: cachedProfile.pin,
        age: cachedProfile.age,
        gender: cachedProfile.gender,
        heightCm: cachedProfile.heightCm,
        weightKg: cachedProfile.weightKg,
        bloodGroup: cachedProfile.bloodGroup,
        medicalCondition: cachedProfile.medicalCondition,
        emergencyName: cachedProfile.emergencyContactName,
        emergencyPhone: cachedProfile.emergencyContactPhone,
        isLoggedIn: cachedProfile.isLoggedIn,
      },
      uid
    );
  } catch (error) {
    console.warn("[userProfileStore] Failed to persist user profile:", error);
  }
}

/**
 * Loads user health profile from SecureStore/SQLite for the current active user or specified user.
 */
export async function loadUserProfile(targetUserId?: string): Promise<UserHealthProfile> {
  try {
    let uid = targetUserId ? normalizeUserId(targetUserId) : activeUserId;

    // If no target user specified, check last active user ID from SecureStore
    if (!targetUserId) {
      let storedActiveUid: string | null = null;
      if (Platform.OS === "web") {
        if (typeof window !== "undefined" && window.localStorage) {
          storedActiveUid = window.localStorage.getItem(ACTIVE_USER_KEY);
        }
      } else {
        storedActiveUid = await SecureStore.getItemAsync(ACTIVE_USER_KEY);
      }
      if (storedActiveUid) {
        uid = normalizeUserId(storedActiveUid);
      }
    }

    activeUserId = uid;
    const storageKey = PROFILE_KEY_PREFIX + uid;

    let json: string | null = null;
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.localStorage) {
        json = window.localStorage.getItem(storageKey);
      }
    } else {
      json = await SecureStore.getItemAsync(storageKey);
    }

    if (json) {
      const parsed = JSON.parse(json) as UserHealthProfile;
      cachedProfile = {
        ...DEFAULT_OFFLINE_PROFILE,
        ...parsed,
        userId: uid,
      };
      notifyListeners();
      return cachedProfile;
    }

    // Fallback: Check SQLite user_profile table for this user
    const dbProfile = await fetchLocalUserProfile(uid);
    if (dbProfile) {
      cachedProfile = {
        userId: uid,
        name: dbProfile.name || (uid === "offline_local" ? "Offline Worker" : uid.split("@")[0]),
        email: dbProfile.email || (uid === "offline_local" ? "offline@sanjeevni.local" : uid),
        pin: dbProfile.pin || "",
        age: dbProfile.age || 25,
        gender: (dbProfile.gender as GenderType) || "Male",
        heightCm: dbProfile.heightCm || 170,
        weightKg: dbProfile.weightKg || 65,
        bloodGroup: (dbProfile.bloodGroup as BloodGroupType) || "O+",
        medicalCondition: dbProfile.medicalCondition || "None",
        emergencyContactName: dbProfile.emergencyName || "Site Supervisor",
        emergencyContactPhone: dbProfile.emergencyPhone || "+91 98765 43210",
        isCompleted: true,
        isLoggedIn: dbProfile.isLoggedIn,
      };
      notifyListeners();
      return cachedProfile;
    }

    // Initialize fresh profile for this user ID
    const initialName = uid === "offline_local" ? "Offline Worker" : uid.split("@")[0];
    const initialEmail = uid === "offline_local" ? "offline@sanjeevni.local" : uid;

    cachedProfile = {
      ...DEFAULT_OFFLINE_PROFILE,
      userId: uid,
      name: initialName,
      email: initialEmail,
      isLoggedIn: true,
    };
    notifyListeners();
    return cachedProfile;
  } catch (err) {
    console.warn("[userProfileStore] Error loading user profile:", err);
    return cachedProfile;
  }
}

/**
 * Hook to reactively consume and update user health profile across screens.
 */
export function useUserProfile() {
  const [profile, setProfile] = useState<UserHealthProfile>(cachedProfile);

  useEffect(() => {
    void loadUserProfile();

    const listener = (newProfile: UserHealthProfile) => {
      setProfile(newProfile);
    };
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  }, []);

  const updateProfile = useCallback(
    async (updates: Partial<UserHealthProfile>, targetUserId?: string) => {
      await saveUserProfile(updates, targetUserId);
    },
    []
  );

  const logout = useCallback(async () => {
    const uid = activeUserId;
    await resetLocalUserProfile(uid);

    try {
      if (Platform.OS === "web") {
        if (typeof window !== "undefined" && window.localStorage) {
          window.localStorage.removeItem(ACTIVE_USER_KEY);
        }
      } else {
        await SecureStore.deleteItemAsync(ACTIVE_USER_KEY);
      }
    } catch {}

    cachedProfile = {
      ...cachedProfile,
      isLoggedIn: false,
    };
    notifyListeners();
  }, []);

  const login = useCallback(
    async (email?: string, name?: string, pin?: string) => {
      const uid = email && email.trim() ? normalizeUserId(email) : "offline_local";
      activeUserId = uid;

      // Load existing profile for this user or create fresh
      const existing = await loadUserProfile(uid);

      const updated: UserHealthProfile = {
        ...existing,
        userId: uid,
        email: email || existing.email,
        name: name || existing.name,
        pin: pin !== undefined ? pin : existing.pin,
        isLoggedIn: true,
        isCompleted: true,
      };

      await saveUserProfile(updated, uid);
    },
    []
  );

  const switchAccount = useCallback(async (targetUserId: string) => {
    await loadUserProfile(targetUserId);
  }, []);

  return {
    profile,
    activeUserId,
    isOfflineUser: profile.userId === "offline_local",
    updateProfile,
    login,
    logout,
    switchAccount,
  };
}
