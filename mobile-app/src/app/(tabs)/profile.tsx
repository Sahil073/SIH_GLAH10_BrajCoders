import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth, useUser } from "@clerk/expo";
import { useRouter } from "expo-router";
import { useUserProfile, GenderType, BloodGroupType } from "@/store/userProfileStore";
import { useBle } from "@/ble";
import { useTheme } from "@/store/themeStore";
import { RawDataRecorderCard } from "@/components/common/RawDataRecorderCard";
import { clearAllHealthData, archiveAndPruneData, fetchStorageStats } from "@/database";
import { LockIcon, UsersIcon, StethoscopeIcon, SunIcon, DownloadArchiveIcon, CloudIcon, GlobeIcon } from "@/components/common/AppIcons";
import { useLanguage } from "@/i18n/languages";
import { LanguageSelectorModal } from "@/components/common/LanguageSelectorModal";

export default function ProfileScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { user } = useUser();
  const { profile, activeUserId, isOfflineUser, updateProfile, logout } = useUserProfile();
  const { isDark, colors } = useTheme();
  const {
    connectionStatus,
    connectedDeviceId,
    discoveredDevices,
    totalPackets,
    startAutoConnect,
    disconnect,
  } = useBle();

  const { currentLanguageInfo, t } = useLanguage();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);

  // Storage and data management state
  const [storageStats, setStorageStats] = useState<{
    readingsCount: number;
    alertsCount: number;
    summariesCount: number;
  }>({ readingsCount: 0, alertsCount: 0, summariesCount: 0 });
  const [isClearingData, setIsClearingData] = useState(false);
  const [isArchivingData, setIsArchivingData] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const stats = await fetchStorageStats(activeUserId);
      setStorageStats(stats);
    } catch {}
  }, [activeUserId]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const handleClearAllData = () => {
    const title = t("eraseConfirmTitle");
    const msg = t("eraseConfirmMsg");
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.confirm(`${title}\n\n${msg}`)) {
        void (async () => {
          setIsClearingData(true);
          await clearAllHealthData(activeUserId);
          await loadStats();
          setIsClearingData(false);
          alert(t("eraseSuccess"));
        })();
      }
    } else {
      Alert.alert(title, msg, [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("eraseAllTestData"),
          style: "destructive",
          onPress: async () => {
            setIsClearingData(true);
            await clearAllHealthData(activeUserId);
            await loadStats();
            setIsClearingData(false);
            Alert.alert(t("save"), t("eraseSuccess"));
          },
        },
      ]);
    }
  };

  const handleArchiveAndPrune = async () => {
    setIsArchivingData(true);
    await archiveAndPruneData(6, activeUserId);
    await loadStats();
    setIsArchivingData(false);
    const msg = t("archiveDoneMsg");
    if (Platform.OS === "web") {
      alert(msg);
    } else {
      Alert.alert(t("archiveDoneTitle"), msg);
    }
  };

  // Modal states: cleanly separated
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isBiometricsModalOpen, setIsBiometricsModalOpen] = useState(false);

  // Account form state
  const [name, setName] = useState(profile.name || "");
  const [email, setEmail] = useState(profile.email || "");
  const [pin, setPin] = useState(profile.pin || "");

  // Biometrics & Health form state
  const [age, setAge] = useState(String(profile.age || ""));
  const [gender, setGender] = useState<GenderType>(profile.gender || "Other");
  const [heightCm, setHeightCm] = useState(String(profile.heightCm || ""));
  const [weightKg, setWeightKg] = useState(String(profile.weightKg || ""));
  const [bloodGroup, setBloodGroup] = useState<BloodGroupType>(profile.bloodGroup || "O+");
  const [medicalCondition, setMedicalCondition] = useState(profile.medicalCondition || "");
  const [emergencyName, setEmergencyName] = useState(profile.emergencyContactName || "");
  const [emergencyPhone, setEmergencyPhone] = useState(profile.emergencyContactPhone || "");

  const isConnected = connectionStatus === "connected";
  const connectedDevice = discoveredDevices.find((d) => d.id === connectedDeviceId);

  const openAccountModal = () => {
    setName(profile.name || "");
    setEmail(profile.email || "");
    setPin(profile.pin || "");
    setIsAccountModalOpen(true);
  };

  const openBiometricsModal = () => {
    setAge(String(profile.age || ""));
    setGender(profile.gender || "Other");
    setHeightCm(String(profile.heightCm || ""));
    setWeightKg(String(profile.weightKg || ""));
    setBloodGroup(profile.bloodGroup || "O+");
    setMedicalCondition(profile.medicalCondition || "");
    setEmergencyName(profile.emergencyContactName || "");
    setEmergencyPhone(profile.emergencyContactPhone || "");
    setIsBiometricsModalOpen(true);
  };

  const handleSaveAccount = async () => {
    if (!name.trim()) {
      Alert.alert("Required Field", "Please enter a valid worker name.");
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({
        name: name.trim(),
        email: email.trim(),
        pin: pin.trim(),
      });
      setIsAccountModalOpen(false);
      Alert.alert("Success", "Account credentials updated successfully.");
    } catch (err) {
      console.warn("Failed to update account credentials:", err);
      Alert.alert("Error", "Could not save account changes.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveBiometrics = async () => {
    setIsSaving(true);
    try {
      await updateProfile({
        age: parseInt(age, 10) || profile.age,
        gender,
        heightCm: parseFloat(heightCm) || profile.heightCm,
        weightKg: parseFloat(weightKg) || profile.weightKg,
        bloodGroup,
        medicalCondition: medicalCondition.trim() || "None",
        emergencyContactName: emergencyName.trim() || "Emergency Contact",
        emergencyContactPhone: emergencyPhone.trim() || "+91 98765 43210",
      });
      setIsBiometricsModalOpen(false);
      Alert.alert("Success", "Health and medical profile updated successfully.");
    } catch (err) {
      console.warn("Failed to update biometrics:", err);
      Alert.alert("Error", "Could not save health profile changes.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await logout();
      try {
        await signOut();
      } catch {
        // Ignore Clerk signOut rejection if offline
      }
    } catch (err) {
      console.warn("Sign out error:", err);
    } finally {
      setIsSigningOut(false);
      router.replace("/onboarding");
    }
  };

  const displayName =
    user?.fullName ||
    `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
    profile.name ||
    (isOfflineUser ? "Offline Worker" : activeUserId.split("@")[0]);

  const displayEmail =
    user?.emailAddresses?.[0]?.emailAddress ||
    profile.email ||
    (isOfflineUser ? "offline@sanjeevni.local" : activeUserId);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 12 }}
        showsVerticalScrollIndicator={false}
        className="px-5"
      >
        {/* Header */}
        <View className="mb-4">
          <Text
            style={{ color: colors.textPrimary }}
            className="font-poppins-bold text-[28px]"
          >
            {t("userProfile")}
          </Text>
          <Text
            style={{ color: colors.textSecondary }}
            className="font-poppins-regular text-sm mt-0.5"
          >
            {t("profileSub")}
          </Text>
        </View>

        {/* User Card: Account Credentials */}
        <View
          style={{ backgroundColor: colors.cardBg, borderColor: colors.cardBorder }}
          className="rounded-2xl p-4 mb-4 border shadow-sm flex-row items-center justify-between"
        >
          <View className="flex-row items-center flex-1 mr-2">
            <View
              style={{
                backgroundColor: isDark ? colors.backgroundSecondary : "#EBF5EE",
                borderColor: colors.cardBorder,
              }}
              className="w-14 h-14 rounded-full border items-center justify-center mr-3.5"
            >
              <Text
                style={{ color: isDark ? colors.textPrimary : "#214332" }}
                className="font-poppins-bold text-xl"
              >
                {displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View className="flex-1">
              <Text
                style={{ color: colors.textPrimary }}
                className="font-poppins-bold text-base"
                numberOfLines={1}
              >
                {displayName}
              </Text>
              <Text
                style={{ color: colors.textSecondary }}
                className="font-poppins-regular text-xs"
                numberOfLines={1}
              >
                {displayEmail}
              </Text>
              <View className="flex-row items-center mt-1">
                <View
                  className={`w-2 h-2 rounded-full mr-1.5 ${
                    isOfflineUser ? "bg-amber-500" : "bg-emerald-500"
                  }`}
                />
                <Text
                  style={{ color: colors.textMuted }}
                  className="font-poppins-medium text-[10.5px]"
                >
                  {isOfflineUser ? `Phone (${t("offlineMode")})` : "Google Account"}
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={openAccountModal}
            style={{
              backgroundColor: isDark ? colors.backgroundSecondary : "#EBF5EE",
              borderColor: colors.cardBorder,
            }}
            className="px-3 py-1.5 rounded-xl border"
          >
            <Text
              style={{ color: isDark ? colors.textPrimary : "#214332" }}
              className="font-poppins-semibold text-xs"
            >
              {t("editAccount")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Offline User: Direct Sign In with Google Prompt Card */}
        {isOfflineUser && (
          <View
            style={{
              backgroundColor: isDark ? "#14281E" : "#EDF6F0",
              borderColor: isDark ? "#234735" : "#C8E3D2",
            }}
            className="rounded-2xl p-4 mb-4 border shadow-xs"
          >
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center gap-2">
                <CloudIcon size={20} color="#059669" />
                <Text
                  style={{ color: isDark ? "#A7F3D0" : "#1E3A2B" }}
                  className="font-poppins-bold text-sm"
                >
                  {t("signInGoogle")}
                </Text>
              </View>
              <View
                style={{ backgroundColor: isDark ? "#064E3B" : "#D1FAE5" }}
                className="px-2 py-0.5 rounded-full"
              >
                <Text
                  style={{ color: isDark ? "#6EE7B7" : "#065F46" }}
                  className="font-poppins-semibold text-[10px]"
                >
                  {t("cloudSync")}
                </Text>
              </View>
            </View>

            <Text
              style={{ color: isDark ? "#D1D5DB" : "#456353" }}
              className="font-poppins-regular text-xs mb-3"
            >
              {t("cloudSyncDesc")}
            </Text>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push("/(auth)/sign-in")}
              className="w-full py-3 bg-[#214332] rounded-xl items-center justify-center shadow-xs"
            >
              <Text className="font-poppins-semibold text-white text-xs tracking-wide">
                {t("signInCloudBtn")}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Language Selection Card */}
        <View
          style={{ backgroundColor: colors.cardBg, borderColor: colors.cardBorder }}
          className="rounded-2xl p-4 mb-4 border shadow-sm"
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1 mr-3">
              <View
                style={{
                  backgroundColor: isDark ? colors.backgroundSecondary : "#EBF5EE",
                  borderColor: colors.cardBorder,
                }}
                className="w-11 h-11 rounded-2xl items-center justify-center mr-3 border shrink-0"
              >
                <GlobeIcon size={20} color="#16A34A" />
              </View>
              <View className="flex-1">
                <Text
                  style={{ color: colors.textPrimary }}
                  className="font-poppins-bold text-sm"
                >
                  {t("appLanguage")}
                </Text>
                <Text
                  style={{ color: colors.textSecondary }}
                  className="font-poppins-regular text-xs mt-0.5"
                >
                  {currentLanguageInfo.name} ({currentLanguageInfo.englishName})
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => setIsLanguageModalOpen(true)}
              style={{
                backgroundColor: isDark ? colors.backgroundSecondary : "#EBF5EE",
                borderColor: colors.cardBorder,
              }}
              className="px-3.5 py-2 rounded-xl border shrink-0"
            >
              <Text
                style={{ color: isDark ? colors.textPrimary : "#214332" }}
                className="font-poppins-semibold text-xs"
              >
                {t("changeLanguage")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Connected Wearable Device Card */}
        <View
          style={{ backgroundColor: colors.cardBg, borderColor: colors.cardBorder }}
          className="rounded-2xl p-4 mb-4 border shadow-sm"
        >
          <View className="flex-row items-center justify-between mb-3">
            <Text
              style={{ color: colors.textPrimary }}
              className="font-poppins-bold text-sm"
            >
              {t("wearableSensorHub")}
            </Text>
            <View
              className={`px-2.5 py-0.5 rounded-full border ${
                isConnected
                  ? isDark ? "bg-emerald-950/60 border-emerald-800" : "bg-[#EBF5EE] border-[#D5EBDE]"
                  : isDark ? "bg-rose-950/60 border-rose-800" : "bg-rose-50 border-rose-200"
              }`}
            >
              <Text
                className={`font-poppins-semibold text-[10px] ${
                  isConnected ? "text-[#16A34A]" : "text-rose-600"
                }`}
              >
                {isConnected ? t("connectedBle") : t("disconnected")}
              </Text>
            </View>
          </View>

          <View
            style={{ borderColor: colors.divider }}
            className="flex-row justify-between py-2 border-b"
          >
            <Text style={{ color: colors.textSecondary }} className="font-poppins-medium text-xs">
              {t("deviceName")}
            </Text>
            <Text style={{ color: colors.textPrimary }} className="font-poppins-semibold text-xs">
              {isConnected ? connectedDevice?.name || "ESP32_Sensor_Hub" : t("none")}
            </Text>
          </View>

          <View
            style={{ borderColor: colors.divider }}
            className="flex-row justify-between py-2 border-b"
          >
            <Text style={{ color: colors.textSecondary }} className="font-poppins-medium text-xs">
              {t("deviceIdMac")}
            </Text>
            <Text style={{ color: colors.textMuted }} className="font-poppins-medium text-xs">
              {connectedDeviceId || t("notPaired")}
            </Text>
          </View>

          <View
            style={{ borderColor: colors.divider }}
            className="flex-row justify-between py-2 border-b"
          >
            <Text style={{ color: colors.textSecondary }} className="font-poppins-medium text-xs">
              {t("packetsReceived")}
            </Text>
            <Text className="font-poppins-semibold text-xs text-[#16A34A]">
              {totalPackets} {t("packets")}
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={async () => {
              if (isConnected) {
                await disconnect();
              } else {
                await startAutoConnect();
              }
            }}
            style={{
              backgroundColor: isDark ? colors.backgroundSecondary : "#EBF5EE",
              borderColor: colors.cardBorder,
            }}
            className="mt-3 py-2.5 rounded-xl border items-center justify-center"
          >
            <Text
              style={{ color: isDark ? colors.textPrimary : "#214332" }}
              className="font-poppins-semibold text-xs"
            >
              {isConnected ? t("disconnectWearable") : t("scanConnectWearable")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Raw Telemetry CSV Logger for Clinical / Research Ground Truth */}
        <RawDataRecorderCard />

        {/* Health Profile Card: Dedicated Biometrics */}
        <View
          style={{ backgroundColor: colors.cardBg, borderColor: colors.cardBorder }}
          className="rounded-2xl p-4 mb-5 border shadow-sm"
        >
          <View className="flex-row items-center justify-between mb-3">
            <Text
              style={{ color: colors.textPrimary }}
              className="font-poppins-bold text-sm"
            >
              {t("personalMedicalProfile")}
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={openBiometricsModal}
              style={{
                backgroundColor: isDark ? colors.backgroundSecondary : "#EBF5EE",
                borderColor: colors.cardBorder,
              }}
              className="py-1 px-2.5 rounded-lg border"
            >
              <Text
                style={{ color: isDark ? colors.textPrimary : "#214332" }}
                className="font-poppins-semibold text-[11px]"
              >
                {t("editVitals")}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ borderColor: colors.divider }} className="flex-row justify-between py-2 border-b">
            <Text style={{ color: colors.textSecondary }} className="font-poppins-medium text-xs">{t("age")}</Text>
            <Text style={{ color: colors.textPrimary }} className="font-poppins-semibold text-xs">{profile.age} {t("yrs")}</Text>
          </View>

          <View style={{ borderColor: colors.divider }} className="flex-row justify-between py-2 border-b">
            <Text style={{ color: colors.textSecondary }} className="font-poppins-medium text-xs">{t("gender")}</Text>
            <Text style={{ color: colors.textPrimary }} className="font-poppins-semibold text-xs">{profile.gender}</Text>
          </View>

          <View style={{ borderColor: colors.divider }} className="flex-row justify-between py-2 border-b">
            <Text style={{ color: colors.textSecondary }} className="font-poppins-medium text-xs">{t("height")}</Text>
            <Text style={{ color: colors.textPrimary }} className="font-poppins-semibold text-xs">{profile.heightCm} {t("cm")}</Text>
          </View>

          <View style={{ borderColor: colors.divider }} className="flex-row justify-between py-2 border-b">
            <Text style={{ color: colors.textSecondary }} className="font-poppins-medium text-xs">{t("weight")}</Text>
            <Text style={{ color: colors.textPrimary }} className="font-poppins-semibold text-xs">{profile.weightKg} {t("kg")}</Text>
          </View>

          <View style={{ borderColor: colors.divider }} className="flex-row justify-between py-2 border-b">
            <Text style={{ color: colors.textSecondary }} className="font-poppins-medium text-xs">{t("bloodGroup")}</Text>
            <Text style={{ color: colors.textPrimary }} className="font-poppins-bold text-xs">{profile.bloodGroup}</Text>
          </View>

          <View style={{ borderColor: colors.divider }} className="flex-row justify-between py-2 border-b">
            <Text style={{ color: colors.textSecondary }} className="font-poppins-medium text-xs">{t("medicalCondition")}</Text>
            <Text style={{ color: colors.textPrimary }} className="font-poppins-semibold text-xs">{profile.medicalCondition}</Text>
          </View>

          <View className="flex-row justify-between py-2">
            <Text style={{ color: colors.textSecondary }} className="font-poppins-medium text-xs">{t("emergencyContact")}</Text>
            <View className="items-end">
              <Text style={{ color: colors.textPrimary }} className="font-poppins-semibold text-xs">
                {profile.emergencyContactName}
              </Text>
              <Text style={{ color: colors.textMuted }} className="font-poppins-regular text-[11px]">
                {profile.emergencyContactPhone}
              </Text>
            </View>
          </View>
        </View>

        {/* Data Storage & Testing Diagnostics Card */}
        <View
          style={{
            backgroundColor: colors.cardBg,
            borderColor: colors.cardBorder,
          }}
          className="rounded-3xl p-5 mb-4 border shadow-xs"
        >
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-2">
              <View className="w-8 h-8 rounded-xl bg-amber-500/15 items-center justify-center">
                <DownloadArchiveIcon size={16} color="#D97706" />
              </View>
              <View>
                <Text style={{ color: colors.textPrimary }} className="font-poppins-bold text-sm">
                  {t("dataStorageRetention")}
                </Text>
                <Text style={{ color: colors.textSecondary }} className="font-poppins-regular text-[11px]">
                  {t("testingCleanupPolicy")}
                </Text>
              </View>
            </View>
          </View>

          {/* Storage Statistics Row */}
          <View
            style={{
              backgroundColor: colors.backgroundSecondary,
              borderColor: colors.cardBorder,
            }}
            className="rounded-2xl p-3.5 mb-3 border flex-row items-center justify-around"
          >
            <View className="items-center">
              <Text style={{ color: colors.textPrimary }} className="font-poppins-bold text-base">
                {storageStats.readingsCount}
              </Text>
              <Text style={{ color: colors.textSecondary }} className="font-poppins-regular text-[10px]">
                {t("rawReadings")}
              </Text>
            </View>
            <View style={{ width: 1, height: 24, backgroundColor: colors.divider }} />
            <View className="items-center">
              <Text style={{ color: colors.textPrimary }} className="font-poppins-bold text-base">
                {storageStats.alertsCount}
              </Text>
              <Text style={{ color: colors.textSecondary }} className="font-poppins-regular text-[10px]">
                {t("alertsLogged")}
              </Text>
            </View>
            <View style={{ width: 1, height: 24, backgroundColor: colors.divider }} />
            <View className="items-center">
              <Text style={{ color: colors.textPrimary }} className="font-poppins-bold text-base">
                {storageStats.summariesCount}
              </Text>
              <Text style={{ color: colors.textSecondary }} className="font-poppins-regular text-[10px]">
                {t("archived6Mo")}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="flex-row gap-2">
            <TouchableOpacity
              activeOpacity={0.8}
              disabled={isClearingData}
              onPress={handleClearAllData}
              style={{
                backgroundColor: isDark ? "#3F1B1B" : "#FEE2E2",
                borderColor: isDark ? "#7F1D1D" : "#FCA5A5",
              }}
              className="flex-1 py-2.5 rounded-xl border items-center justify-center flex-row gap-1.5"
            >
              {isClearingData ? (
                <ActivityIndicator size="small" color="#DC2626" />
              ) : (
                <>
                  <Text className="font-poppins-semibold text-xs text-[#DC2626]">
                    {t("eraseAllTestData")}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              disabled={isArchivingData}
              onPress={handleArchiveAndPrune}
              style={{
                backgroundColor: isDark ? "#1E2A38" : "#E0F2FE",
                borderColor: isDark ? "#2563EB" : "#BAE6FD",
              }}
              className="flex-1 py-2.5 rounded-xl border items-center justify-center flex-row gap-1.5"
            >
              {isArchivingData ? (
                <ActivityIndicator size="small" color="#0284C7" />
              ) : (
                <>
                  <Text style={{ color: isDark ? "#93C5FD" : "#0369A1" }} className="font-poppins-semibold text-xs">
                    {t("archiveAndPrune")}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Safety, Companion & Privacy Hub */}
        <View
          style={{
            backgroundColor: colors.cardBg,
            borderColor: colors.cardBorder,
          }}
          className="rounded-3xl p-5 mb-4 border shadow-xs"
        >
          <Text
            style={{ color: colors.textPrimary }}
            className="font-poppins-bold text-sm mb-3"
          >
            {t("safetyCompanionPrivacy")}
          </Text>

          {/* 1. Trust & Privacy */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => router.push("/trust-privacy" as any)}
            style={{ borderColor: colors.divider }}
            className="flex-row items-center justify-between py-3 border-b"
          >
            <View className="flex-row items-center flex-1 mr-2">
              <View className="w-8 h-8 rounded-xl bg-emerald-500/15 items-center justify-center mr-3">
                <LockIcon size={16} color="#15803D" />
              </View>
              <View className="flex-1">
                <Text style={{ color: colors.textPrimary }} className="font-poppins-semibold text-xs">
                  {t("trustPrivacy")}
                </Text>
                <Text style={{ color: colors.textMuted }} className="font-poppins-regular text-[11px]">
                  {t("trustPrivacySub")}
                </Text>
              </View>
            </View>
            <Text style={{ color: colors.textMuted }} className="font-poppins-semibold text-sm">›</Text>
          </TouchableOpacity>

          {/* 2. Caregiver / Family Companion */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => router.push("/caregiver-view" as any)}
            style={{ borderColor: colors.divider }}
            className="flex-row items-center justify-between py-3 border-b"
          >
            <View className="flex-row items-center flex-1 mr-2">
              <View className="w-8 h-8 rounded-xl bg-blue-500/15 items-center justify-center mr-3">
                <UsersIcon size={16} color="#2563EB" />
              </View>
              <View className="flex-1">
                <Text style={{ color: colors.textPrimary }} className="font-poppins-semibold text-xs">
                  {t("caregiverFamily")}
                </Text>
                <Text style={{ color: colors.textMuted }} className="font-poppins-regular text-[11px]">
                  {t("caregiverFamilySub")}
                </Text>
              </View>
            </View>
            <Text style={{ color: colors.textMuted }} className="font-poppins-semibold text-sm">›</Text>
          </TouchableOpacity>

          {/* 3. ASHA / PHC Companion */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => router.push("/asha-mode" as any)}
            style={{ borderColor: colors.divider }}
            className="flex-row items-center justify-between py-3 border-b"
          >
            <View className="flex-row items-center flex-1 mr-2">
              <View className="w-8 h-8 rounded-xl bg-purple-500/15 items-center justify-center mr-3">
                <StethoscopeIcon size={16} color="#7C3AED" />
              </View>
              <View className="flex-1">
                <Text style={{ color: colors.textPrimary }} className="font-poppins-semibold text-xs">
                  {t("ashaRapidResponse")}
                </Text>
                <Text style={{ color: colors.textMuted }} className="font-poppins-regular text-[11px]">
                  {t("ashaRapidResponseSub")}
                </Text>
              </View>
            </View>
            <Text style={{ color: colors.textMuted }} className="font-poppins-semibold text-sm">›</Text>
          </TouchableOpacity>

          {/* 4. Disaster Modes */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => router.push("/disaster-modes" as any)}
            className="flex-row items-center justify-between py-3"
          >
            <View className="flex-row items-center flex-1 mr-2">
              <View className="w-8 h-8 rounded-xl bg-amber-500/15 items-center justify-center mr-3">
                <SunIcon size={16} color="#D97706" />
              </View>
              <View className="flex-1">
                <Text style={{ color: colors.textPrimary }} className="font-poppins-semibold text-xs">
                  {t("disasterSpecificModes")}
                </Text>
                <Text style={{ color: colors.textMuted }} className="font-poppins-regular text-[11px]">
                  {t("disasterSpecificModesSub")}
                </Text>
              </View>
            </View>
            <Text style={{ color: colors.textMuted }} className="font-poppins-semibold text-sm">›</Text>
          </TouchableOpacity>
        </View>

        {/* Switch Account or Sign In to Another Profile */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push("/(auth)/sign-in")}
          style={{
            backgroundColor: colors.cardBg,
            borderColor: colors.cardBorder,
          }}
          className="w-full py-3.5 rounded-2xl border items-center justify-center mb-3 shadow-xs"
        >
          <Text
            style={{ color: colors.textPrimary }}
            className="font-poppins-semibold text-sm"
          >
            {t("signInDifferentAccount")}
          </Text>
        </TouchableOpacity>

        {/* Sign Out Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          disabled={isSigningOut}
          onPress={handleSignOut}
          style={{
            backgroundColor: isDark ? "#3A1717" : "#FEF2F2",
            borderColor: isDark ? "#7F1D1D" : "#FECACA",
          }}
          className="w-full py-3.5 rounded-2xl border items-center justify-center mb-6"
        >
          {isSigningOut ? (
            <ActivityIndicator size="small" color="#DC2626" />
          ) : (
            <Text className="font-poppins-semibold text-sm text-[#DC2626]">
              {t("signOut")} ({isOfflineUser ? t("offlineMode") : activeUserId.split("@")[0]})
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Modal 1: Edit Account Credentials (Name, Email, PIN) */}
      <Modal
        visible={isAccountModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsAccountModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View className="flex-1 justify-end bg-black/60">
            <View
              style={{ backgroundColor: colors.cardBg }}
              className="rounded-t-[32px] p-6 max-h-[85%]"
            >
              <View className="flex-row items-center justify-between mb-4">
                <Text
                  style={{ color: colors.textPrimary }}
                  className="font-poppins-bold text-xl"
                >
                  Edit Account Credentials
                </Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setIsAccountModalOpen(false)}
                  style={{ backgroundColor: colors.backgroundSecondary }}
                  className="w-8 h-8 rounded-full items-center justify-center"
                >
                  <Text style={{ color: colors.textSecondary }} className="font-bold text-sm">✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} className="space-y-4">
                {/* Full Name */}
                <View>
                  <Text style={{ color: colors.textSecondary }} className="font-poppins-medium text-xs mb-1">
                    Worker Full Name
                  </Text>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="Worker Name"
                    placeholderTextColor={colors.textMuted}
                    style={{
                      backgroundColor: colors.backgroundSecondary,
                      borderColor: colors.cardBorder,
                      color: colors.textPrimary,
                    }}
                    className="border rounded-xl px-3.5 py-2.5 font-poppins-medium text-sm"
                  />
                </View>

                {/* Email Address */}
                <View>
                  <Text style={{ color: colors.textSecondary }} className="font-poppins-medium text-xs mb-1">
                    Email / Account ID
                  </Text>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholder="worker@sanjeevni.health"
                    placeholderTextColor={colors.textMuted}
                    style={{
                      backgroundColor: colors.backgroundSecondary,
                      borderColor: colors.cardBorder,
                      color: colors.textPrimary,
                    }}
                    className="border rounded-xl px-3.5 py-2.5 font-poppins-medium text-sm"
                  />
                </View>

                {/* Offline PIN */}
                <View>
                  <Text style={{ color: colors.textSecondary }} className="font-poppins-medium text-xs mb-1">
                    Offline Security PIN (4-digit)
                  </Text>
                  <TextInput
                    value={pin}
                    onChangeText={setPin}
                    keyboardType="numeric"
                    maxLength={6}
                    placeholder="1234"
                    placeholderTextColor={colors.textMuted}
                    style={{
                      backgroundColor: colors.backgroundSecondary,
                      borderColor: colors.cardBorder,
                      color: colors.textPrimary,
                    }}
                    className="border rounded-xl px-3.5 py-2.5 font-poppins-medium text-sm"
                  />
                </View>

                {/* Save Button */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  disabled={isSaving}
                  onPress={handleSaveAccount}
                  style={{
                    backgroundColor: colors.textPrimary,
                    borderColor: colors.cardBorder,
                  }}
                  className="w-full py-3.5 rounded-2xl border items-center justify-center mt-3 mb-6"
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color={isDark ? "#121212" : "#FFFFFF"} />
                  ) : (
                    <Text
                      style={{ color: isDark ? "#121212" : "#FFFFFF" }}
                      className="font-poppins-semibold text-sm"
                    >
                      Save Account Credentials
                    </Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal 2: Edit Health & Medical Profile (Biometrics) */}
      <Modal
        visible={isBiometricsModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsBiometricsModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View className="flex-1 justify-end bg-black/60">
            <View
              style={{ backgroundColor: colors.cardBg }}
              className="rounded-t-[32px] p-6 max-h-[85%]"
            >
              <View className="flex-row items-center justify-between mb-4">
                <Text
                  style={{ color: colors.textPrimary }}
                  className="font-poppins-bold text-xl"
                >
                  Edit Health & Vitals Profile
                </Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setIsBiometricsModalOpen(false)}
                  style={{ backgroundColor: colors.backgroundSecondary }}
                  className="w-8 h-8 rounded-full items-center justify-center"
                >
                  <Text style={{ color: colors.textSecondary }} className="font-bold text-sm">✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} className="space-y-3.5">
                {/* Age & Blood Group */}
                <View className="flex-row space-x-3">
                  <View className="flex-1">
                    <Text style={{ color: colors.textSecondary }} className="font-poppins-medium text-xs mb-1">
                      Age (yrs)
                    </Text>
                    <TextInput
                      value={age}
                      onChangeText={setAge}
                      keyboardType="numeric"
                      placeholder="25"
                      placeholderTextColor={colors.textMuted}
                      style={{
                        backgroundColor: colors.backgroundSecondary,
                        borderColor: colors.cardBorder,
                        color: colors.textPrimary,
                      }}
                      className="border rounded-xl px-3.5 py-2.5 font-poppins-medium text-sm"
                    />
                  </View>

                  <View className="flex-1">
                    <Text style={{ color: colors.textSecondary }} className="font-poppins-medium text-xs mb-1">
                      Blood Group
                    </Text>
                    <TextInput
                      value={bloodGroup}
                      onChangeText={(val) => setBloodGroup(val as BloodGroupType)}
                      placeholder="O+"
                      placeholderTextColor={colors.textMuted}
                      style={{
                        backgroundColor: colors.backgroundSecondary,
                        borderColor: colors.cardBorder,
                        color: colors.textPrimary,
                      }}
                      className="border rounded-xl px-3.5 py-2.5 font-poppins-medium text-sm"
                    />
                  </View>
                </View>

                {/* Height & Weight */}
                <View className="flex-row space-x-3">
                  <View className="flex-1">
                    <Text style={{ color: colors.textSecondary }} className="font-poppins-medium text-xs mb-1">
                      Height (cm)
                    </Text>
                    <TextInput
                      value={heightCm}
                      onChangeText={setHeightCm}
                      keyboardType="numeric"
                      placeholder="170"
                      placeholderTextColor={colors.textMuted}
                      style={{
                        backgroundColor: colors.backgroundSecondary,
                        borderColor: colors.cardBorder,
                        color: colors.textPrimary,
                      }}
                      className="border rounded-xl px-3.5 py-2.5 font-poppins-medium text-sm"
                    />
                  </View>

                  <View className="flex-1">
                    <Text style={{ color: colors.textSecondary }} className="font-poppins-medium text-xs mb-1">
                      Weight (kg)
                    </Text>
                    <TextInput
                      value={weightKg}
                      onChangeText={setWeightKg}
                      keyboardType="numeric"
                      placeholder="65"
                      placeholderTextColor={colors.textMuted}
                      style={{
                        backgroundColor: colors.backgroundSecondary,
                        borderColor: colors.cardBorder,
                        color: colors.textPrimary,
                      }}
                      className="border rounded-xl px-3.5 py-2.5 font-poppins-medium text-sm"
                    />
                  </View>
                </View>

                {/* Medical Condition */}
                <View>
                  <Text style={{ color: colors.textSecondary }} className="font-poppins-medium text-xs mb-1">
                    Known Medical Conditions / Allergies
                  </Text>
                  <TextInput
                    value={medicalCondition}
                    onChangeText={setMedicalCondition}
                    placeholder="None / Asthma / Hypertension"
                    placeholderTextColor={colors.textMuted}
                    style={{
                      backgroundColor: colors.backgroundSecondary,
                      borderColor: colors.cardBorder,
                      color: colors.textPrimary,
                    }}
                    className="border rounded-xl px-3.5 py-2.5 font-poppins-medium text-sm"
                  />
                </View>

                {/* Emergency Contact Name */}
                <View>
                  <Text style={{ color: colors.textSecondary }} className="font-poppins-medium text-xs mb-1">
                    Emergency Contact Name
                  </Text>
                  <TextInput
                    value={emergencyName}
                    onChangeText={setEmergencyName}
                    placeholder="Dr. Sharma / Site Supervisor"
                    placeholderTextColor={colors.textMuted}
                    style={{
                      backgroundColor: colors.backgroundSecondary,
                      borderColor: colors.cardBorder,
                      color: colors.textPrimary,
                    }}
                    className="border rounded-xl px-3.5 py-2.5 font-poppins-medium text-sm"
                  />
                </View>

                {/* Emergency Contact Phone */}
                <View>
                  <Text style={{ color: colors.textSecondary }} className="font-poppins-medium text-xs mb-1">
                    Emergency Contact Phone
                  </Text>
                  <TextInput
                    value={emergencyPhone}
                    onChangeText={setEmergencyPhone}
                    keyboardType="phone-pad"
                    placeholder="+91 98765 43210"
                    placeholderTextColor={colors.textMuted}
                    style={{
                      backgroundColor: colors.backgroundSecondary,
                      borderColor: colors.cardBorder,
                      color: colors.textPrimary,
                    }}
                    className="border rounded-xl px-3.5 py-2.5 font-poppins-medium text-sm"
                  />
                </View>

                {/* Save Button */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  disabled={isSaving}
                  onPress={handleSaveBiometrics}
                  style={{
                    backgroundColor: colors.textPrimary,
                    borderColor: colors.cardBorder,
                  }}
                  className="w-full py-3.5 rounded-2xl border items-center justify-center mt-3 mb-6"
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color={isDark ? "#121212" : "#FFFFFF"} />
                  ) : (
                    <Text
                      style={{ color: isDark ? "#121212" : "#FFFFFF" }}
                      className="font-poppins-semibold text-sm"
                    >
                      Save Health Profile
                    </Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Language Selection Modal */}
      <LanguageSelectorModal
        visible={isLanguageModalOpen}
        onClose={() => setIsLanguageModalOpen(false)}
      />
    </SafeAreaView>
  );
}
