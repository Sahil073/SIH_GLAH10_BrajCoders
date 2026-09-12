import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth, useUser } from "@clerk/expo";
import { useRouter } from "expo-router";
import { useUserProfile } from "@/store/userProfileStore";

export default function ProfileScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { user } = useUser();
  const { profile } = useUserProfile();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await signOut();
    } catch (err) {
      console.warn("Sign out error:", err);
    } finally {
      setIsSigningOut(false);
      router.replace("/onboarding");
    }
  };

  const fullName = user?.fullName || `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Sanjeevni User";
  const email = user?.emailAddresses?.[0]?.emailAddress || "user@sanjeevni.health";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F7FAF8" }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 110, paddingTop: 12 }}
        showsVerticalScrollIndicator={false}
        className="px-5"
      >
        {/* Header */}
        <View className="mb-4">
          <Text className="font-poppins-bold text-[28px] text-[#101C16]">
            User Profile
          </Text>
          <Text className="font-poppins-regular text-sm text-[#55695E] mt-0.5">
            Settings, emergency details, and wearable management
          </Text>
        </View>

        {/* User Card */}
        <View className="bg-white rounded-2xl p-4 mb-4 border border-[#E9EFEA] shadow-sm flex-row items-center">
          <View className="w-14 h-14 rounded-full bg-[#EBF5EE] border border-[#D5EBDE] items-center justify-center mr-3.5">
            <Text className="font-poppins-bold text-xl text-[#214332]">
              {fullName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="font-poppins-bold text-base text-[#101C16]">
              {fullName}
            </Text>
            <Text className="font-poppins-regular text-xs text-[#7A8E82]">
              {email}
            </Text>
          </View>
        </View>

        {/* Connected Wearable Device Card */}
        <View className="bg-white rounded-2xl p-4 mb-4 border border-[#E9EFEA] shadow-sm">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="font-poppins-bold text-sm text-[#101C16]">
              Connected Wearable
            </Text>
            <View className="bg-[#EBF5EE] px-2.5 py-0.5 rounded-full border border-[#D5EBDE]">
              <Text className="font-poppins-semibold text-[10px] text-[#16A34A]">
                BLE Connected
              </Text>
            </View>
          </View>

          <View className="flex-row justify-between py-1.5 border-b border-[#F2F6F3]">
            <Text className="font-poppins-medium text-xs text-[#55695E]">Device</Text>
            <Text className="font-poppins-semibold text-xs text-[#101C16]">
              SANJEEVNI_TSHIRT
            </Text>
          </View>

          <View className="flex-row justify-between py-1.5 border-b border-[#F2F6F3]">
            <Text className="font-poppins-medium text-xs text-[#55695E]">MAC Address</Text>
            <Text className="font-poppins-medium text-xs text-[#7A8E82]">
              1A:2B:3C:4D:5E:6F
            </Text>
          </View>

          <View className="flex-row justify-between py-1.5 border-b border-[#F2F6F3]">
            <Text className="font-poppins-medium text-xs text-[#55695E]">Battery Level</Text>
            <Text className="font-poppins-semibold text-xs text-[#16A34A]">
              84% (6 hours remaining)
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push("/connect-device")}
            className="mt-3 py-2 rounded-xl bg-[#EBF5EE] items-center justify-center"
          >
            <Text className="font-poppins-semibold text-xs text-[#214332]">
              Re-scan or Switch Device ›
            </Text>
          </TouchableOpacity>
        </View>

        {/* Health Profile Card (Matching Onboarding Questions) */}
        <View className="bg-white rounded-2xl p-4 mb-5 border border-[#E9EFEA] shadow-sm">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="font-poppins-bold text-sm text-[#101C16]">
              Personal & Medical Profile
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push("/onboarding-health?from=profile" as any)}
              className="py-1 px-2.5 rounded-lg bg-[#EBF5EE]"
            >
              <Text className="font-poppins-semibold text-[11px] text-[#214332]">
                Edit Profile ›
              </Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row justify-between py-1.5 border-b border-[#F2F6F3]">
            <Text className="font-poppins-medium text-xs text-[#55695E]">Age</Text>
            <Text className="font-poppins-semibold text-xs text-[#101C16]">
              {profile.age}
            </Text>
          </View>

          <View className="flex-row justify-between py-1.5 border-b border-[#F2F6F3]">
            <Text className="font-poppins-medium text-xs text-[#55695E]">Gender</Text>
            <Text className="font-poppins-semibold text-xs text-[#101C16]">
              {profile.gender}
            </Text>
          </View>

          <View className="flex-row justify-between py-1.5 border-b border-[#F2F6F3]">
            <Text className="font-poppins-medium text-xs text-[#55695E]">Height</Text>
            <Text className="font-poppins-semibold text-xs text-[#101C16]">
              {profile.heightCm} cm
            </Text>
          </View>

          <View className="flex-row justify-between py-1.5 border-b border-[#F2F6F3]">
            <Text className="font-poppins-medium text-xs text-[#55695E]">Weight</Text>
            <Text className="font-poppins-semibold text-xs text-[#101C16]">
              {profile.weightKg} kg
            </Text>
          </View>

          <View className="flex-row justify-between py-1.5 border-b border-[#F2F6F3]">
            <Text className="font-poppins-medium text-xs text-[#55695E]">Blood Group</Text>
            <Text className="font-poppins-bold text-xs text-[#101C16]">
              {profile.bloodGroup}
            </Text>
          </View>

          <View className="flex-row justify-between py-1.5 border-b border-[#F2F6F3]">
            <Text className="font-poppins-medium text-xs text-[#55695E]">Medical Condition</Text>
            <Text className="font-poppins-semibold text-xs text-[#101C16]">
              {profile.medicalCondition}
            </Text>
          </View>

          <View className="flex-row justify-between py-1.5">
            <Text className="font-poppins-medium text-xs text-[#55695E]">Emergency Contact</Text>
            <View className="items-end">
              <Text className="font-poppins-semibold text-xs text-[#101C16]">
                {profile.emergencyContactName || "Dr. Sharma (Guardian)"}
              </Text>
              <Text className="font-poppins-regular text-[11px] text-[#7A8E82]">
                {profile.emergencyContactPhone || "+91 98765 43210"}
              </Text>
            </View>
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          disabled={isSigningOut}
          onPress={handleSignOut}
          className="w-full py-3.5 rounded-2xl bg-red-50 border border-red-200 items-center justify-center mb-6"
        >
          {isSigningOut ? (
            <ActivityIndicator size="small" color="#DC2626" />
          ) : (
            <Text className="font-poppins-semibold text-sm text-[#DC2626]">
              Sign Out
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
