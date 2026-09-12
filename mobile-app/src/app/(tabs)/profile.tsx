import React, { useState } from "react";
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

export default function ProfileScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { user } = useUser();
  const { profile, activeUserId, isOfflineUser, updateProfile, logout } = useUserProfile();
  const { themeMode, isDark, colors, setTheme } = useTheme();
  const {
    connectionStatus,
    connectedDeviceId,
    discoveredDevices,
    totalPackets,
    startAutoConnect,
    disconnect,
  } = useBle();

  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Edit form state
  const [name, setName] = useState(profile.name || "");
  const [email, setEmail] = useState(profile.email || "");
  const [pin, setPin] = useState(profile.pin || "");
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

  const openEditModal = () => {
    setName(profile.name || "");
    setEmail(profile.email || "");
    setPin(profile.pin || "");
    setAge(String(profile.age || ""));
    setGender(profile.gender || "Other");
    setHeightCm(String(profile.heightCm || ""));
    setWeightKg(String(profile.weightKg || ""));
    setBloodGroup(profile.bloodGroup || "O+");
    setMedicalCondition(profile.medicalCondition || "");
    setEmergencyName(profile.emergencyContactName || "");
    setEmergencyPhone(profile.emergencyContactPhone || "");
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      Alert.alert("Required Field", "Please enter a valid name.");
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({
        name: name.trim(),
        email: email.trim(),
        pin: pin.trim(),
        age: parseInt(age, 10) || profile.age,
        gender,
        heightCm: parseFloat(heightCm) || profile.heightCm,
        weightKg: parseFloat(weightKg) || profile.weightKg,
        bloodGroup,
        medicalCondition: medicalCondition.trim() || "None",
        emergencyContactName: emergencyName.trim() || "Emergency Contact",
        emergencyContactPhone: emergencyPhone.trim() || "+91 98765 43210",
      });
      setIsEditModalOpen(false);
      Alert.alert("Success", "Profile and credentials updated successfully.");
    } catch (err) {
      console.warn("Failed to update profile:", err);
      Alert.alert("Error", "Could not save profile changes.");
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
        // Clerk sign out error caught if offline
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
        contentContainerStyle={{ paddingBottom: 110, paddingTop: 12 }}
        showsVerticalScrollIndicator={false}
        className="px-5"
      >
        {/* Header */}
        <View className="mb-4">
          <Text
            style={{ color: colors.textPrimary }}
            className="font-poppins-bold text-[28px]"
          >
            User Profile
          </Text>
          <Text
            style={{ color: colors.textSecondary }}
            className="font-poppins-regular text-sm mt-0.5"
          >
            Multi-user account, appearance, and hardware setup
          </Text>
        </View>

        {/* User Card */}
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
                  {isOfflineUser ? "Phone Local Storage" : "Google Account"}
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={openEditModal}
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
              Edit ›
            </Text>
          </TouchableOpacity>
        </View>

        {/* Appearance & Theme Mode Selector */}
        <View
          style={{ backgroundColor: colors.cardBg, borderColor: colors.cardBorder }}
          className="rounded-2xl p-4 mb-4 border shadow-sm"
        >
          <Text
            style={{ color: colors.textPrimary }}
            className="font-poppins-bold text-sm mb-3"
          >
            Appearance & Theme
          </Text>
          <View className="flex-row space-x-2">
            {(["light", "dark", "system"] as const).map((mode) => (
              <TouchableOpacity
                key={mode}
                activeOpacity={0.7}
                onPress={() => setTheme(mode)}
                style={{
                  backgroundColor:
                    themeMode === mode
                      ? colors.textPrimary
                      : colors.backgroundSecondary,
                  borderColor: colors.cardBorder,
                }}
                className="flex-1 py-2.5 rounded-xl border items-center justify-center"
              >
                <Text
                  style={{
                    color:
                      themeMode === mode
                        ? isDark ? "#121212" : "#FFFFFF"
                        : colors.textSecondary,
                  }}
                  className="font-poppins-semibold text-xs"
                >
                  {mode === "light"
                    ? "☀️ Light"
                    : mode === "dark"
                    ? "🌙 Dark"
                    : "⚙️ Auto"}
                </Text>
              </TouchableOpacity>
            ))}
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
              Wearable Sensor Hub
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
                {isConnected ? "BLE Connected" : "Disconnected"}
              </Text>
            </View>
          </View>

          <View
            style={{ borderColor: colors.divider }}
            className="flex-row justify-between py-2 border-b"
          >
            <Text style={{ color: colors.textSecondary }} className="font-poppins-medium text-xs">
              Device Name
            </Text>
            <Text style={{ color: colors.textPrimary }} className="font-poppins-semibold text-xs">
              {isConnected ? connectedDevice?.name || "ESP32_Sensor_Hub" : "None"}
            </Text>
          </View>

          <View
            style={{ borderColor: colors.divider }}
            className="flex-row justify-between py-2 border-b"
          >
            <Text style={{ color: colors.textSecondary }} className="font-poppins-medium text-xs">
              Device ID / MAC
            </Text>
            <Text style={{ color: colors.textMuted }} className="font-poppins-medium text-xs">
              {connectedDeviceId || "Not paired"}
            </Text>
          </View>

          <View
            style={{ borderColor: colors.divider }}
            className="flex-row justify-between py-2 border-b"
          >
            <Text style={{ color: colors.textSecondary }} className="font-poppins-medium text-xs">
              Packets Received
            </Text>
            <Text className="font-poppins-semibold text-xs text-[#16A34A]">
              {totalPackets} packets
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
              {isConnected ? "Disconnect Wearable" : "Scan & Connect Wearable ›"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Health Profile Card */}
        <View
          style={{ backgroundColor: colors.cardBg, borderColor: colors.cardBorder }}
          className="rounded-2xl p-4 mb-5 border shadow-sm"
        >
          <View className="flex-row items-center justify-between mb-3">
            <Text
              style={{ color: colors.textPrimary }}
              className="font-poppins-bold text-sm"
            >
              Personal & Medical Profile
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={openEditModal}
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
                Edit Details ›
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ borderColor: colors.divider }} className="flex-row justify-between py-2 border-b">
            <Text style={{ color: colors.textSecondary }} className="font-poppins-medium text-xs">Age</Text>
            <Text style={{ color: colors.textPrimary }} className="font-poppins-semibold text-xs">{profile.age} yrs</Text>
          </View>

          <View style={{ borderColor: colors.divider }} className="flex-row justify-between py-2 border-b">
            <Text style={{ color: colors.textSecondary }} className="font-poppins-medium text-xs">Gender</Text>
            <Text style={{ color: colors.textPrimary }} className="font-poppins-semibold text-xs">{profile.gender}</Text>
          </View>

          <View style={{ borderColor: colors.divider }} className="flex-row justify-between py-2 border-b">
            <Text style={{ color: colors.textSecondary }} className="font-poppins-medium text-xs">Height</Text>
            <Text style={{ color: colors.textPrimary }} className="font-poppins-semibold text-xs">{profile.heightCm} cm</Text>
          </View>

          <View style={{ borderColor: colors.divider }} className="flex-row justify-between py-2 border-b">
            <Text style={{ color: colors.textSecondary }} className="font-poppins-medium text-xs">Weight</Text>
            <Text style={{ color: colors.textPrimary }} className="font-poppins-semibold text-xs">{profile.weightKg} kg</Text>
          </View>

          <View style={{ borderColor: colors.divider }} className="flex-row justify-between py-2 border-b">
            <Text style={{ color: colors.textSecondary }} className="font-poppins-medium text-xs">Blood Group</Text>
            <Text style={{ color: colors.textPrimary }} className="font-poppins-bold text-xs">{profile.bloodGroup}</Text>
          </View>

          <View style={{ borderColor: colors.divider }} className="flex-row justify-between py-2 border-b">
            <Text style={{ color: colors.textSecondary }} className="font-poppins-medium text-xs">Medical Condition</Text>
            <Text style={{ color: colors.textPrimary }} className="font-poppins-semibold text-xs">{profile.medicalCondition}</Text>
          </View>

          <View className="flex-row justify-between py-2">
            <Text style={{ color: colors.textSecondary }} className="font-poppins-medium text-xs">Emergency Contact</Text>
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
              Sign Out ({isOfflineUser ? "Offline Mode" : activeUserId.split("@")[0]})
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Edit User Credentials & Information Modal */}
      <Modal
        visible={isEditModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditModalOpen(false)}
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
                  Edit Profile & Credentials
                </Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setIsEditModalOpen(false)}
                  style={{ backgroundColor: colors.backgroundSecondary }}
                  className="w-8 h-8 rounded-full items-center justify-center"
                >
                  <Text style={{ color: colors.textSecondary }} className="font-bold text-sm">✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} className="space-y-3.5">
                {/* Full Name */}
                <View>
                  <Text style={{ color: colors.textSecondary }} className="font-poppins-medium text-xs mb-1">
                    Full Name
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
                    Email / User ID
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
                  onPress={handleSaveProfile}
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
                      Save Profile & Credentials
                    </Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
