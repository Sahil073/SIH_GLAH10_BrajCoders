import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  TextInput,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Contacts from "expo-contacts";
import Svg, { Path, Circle } from "react-native-svg";

import { useUserProfile, saveUserProfile } from "@/store/userProfileStore";
import { OnboardingIllustration } from "@/components/onboarding/OnboardingIllustration";
import { CalibrationRing } from "@/components/onboarding/CalibrationRing";

import {
  UsersIcon,
  SunIcon,
  HeartIcon,
  HeartPulseIcon,
  LeafIcon,
  LungsIcon,
  LockIcon,
} from "@/components/common/AppIcons";

// Vulnerability profiles from AGENTS.md §4.1 (icon-first, zero typing for low-literacy users)
const VULNERABILITY_OPTIONS = [
  { id: "elderly", label: "Elderly (60+)", iconType: "elderly" },
  { id: "worker", label: "Outdoor Worker", iconType: "worker" },
  { id: "cardiac", label: "Heart Condition", iconType: "cardiac" },
  { id: "maternal", label: "Maternal Care", iconType: "maternal" },
  { id: "wellness", label: "General Wellness", iconType: "wellness" },
  { id: "respiratory", label: "Asthma / Dust Sensitive", iconType: "respiratory" },
];

// Quick relationship tags for emergency contact
const RELATIONSHIPS = [
  "Son",
  "Daughter",
  "Spouse",
  "Doctor",
  "Guardian",
  "Supervisor",
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { profile, login } = useUserProfile();

  // Step 1: Welcome & Vulnerability profile
  // Step 2: Native Emergency Contact Picker
  // Step 3: 60-Second Health Calibration
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Profile selections
  const [selectedVulnerability, setSelectedVulnerability] = useState<string>("worker");
  const [emergencyName, setEmergencyName] = useState<string>(
    profile.emergencyContactName || "Ramesh Sharma (Son)"
  );
  const [emergencyPhone, setEmergencyPhone] = useState<string>(
    profile.emergencyContactPhone || "+91 98765 43210"
  );
  const [relationship, setRelationship] = useState<string>("Son");
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [tempManualName, setTempManualName] = useState("");
  const [tempManualPhone, setTempManualPhone] = useState("");
  const [calibrationCompleted, setCalibrationCompleted] = useState(false);

  // Native Emergency Contact Picker handler (AGENTS.md §4.1)
  const handlePickNativeContact = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== "granted") {
        if (Platform.OS === "web") {
          setIsManualModalOpen(true);
        } else {
          Alert.alert(
            "Contact Permission Needed",
            "Please allow contact access to pick your emergency contact directly from your address book, or enter manually.",
            [
              { text: "Enter Manually", onPress: () => setIsManualModalOpen(true) },
              { text: "Cancel", style: "cancel" },
            ]
          );
        }
        return;
      }

      // Launch Native Contact Picker
      const contact = await Contacts.presentContactPickerAsync();
      if (contact) {
        const pickedName =
          [contact.firstName, contact.lastName].filter(Boolean).join(" ") ||
          contact.name ||
          "Emergency Contact";
        const pickedPhone =
          contact.phoneNumbers?.[0]?.number ||
          contact.phoneNumbers?.[0]?.digits ||
          "+91 98765 43210";

        setEmergencyName(`${pickedName} (${relationship})`);
        setEmergencyPhone(pickedPhone);
      }
    } catch (err) {
      console.warn("Native contact picker error:", err);
      setIsManualModalOpen(true);
    }
  };

  const handleRelationshipSelect = (rel: string) => {
    setRelationship(rel);
    // Update name with new relationship tag
    const baseName = emergencyName.replace(/\s*\([^)]*\)/, "").trim() || "Contact";
    setEmergencyName(`${baseName} (${rel})`);
  };

  const handleSaveManualContact = () => {
    if (tempManualName.trim()) {
      setEmergencyName(
        `${tempManualName.trim()} (${relationship})`
      );
    }
    if (tempManualPhone.trim()) {
      setEmergencyPhone(tempManualPhone.trim());
    }
    setIsManualModalOpen(false);
  };

  const handleCalibrationComplete = useCallback(
    async (stats: { baselineBpm: number; restingVariance: number; calibratedAt: string }) => {
      setCalibrationCompleted(true);
      await saveUserProfile({
        emergencyContactName: emergencyName,
        emergencyContactPhone: emergencyPhone,
        medicalCondition: selectedVulnerability,
        isCompleted: true,
      });
    },
    [emergencyName, emergencyPhone, selectedVulnerability]
  );

  const handleFinishOnboarding = async () => {
    await login(
      profile.email || "offline@sanjeevni.local",
      profile.name || "Worker",
      profile.pin || ""
    );
    await saveUserProfile({
      emergencyContactName: emergencyName,
      emergencyContactPhone: emergencyPhone,
      medicalCondition: selectedVulnerability,
      isCompleted: true,
      isLoggedIn: true,
    });
    router.replace("/(tabs)");
  };

  const handleContinueOffline = async () => {
    await login();
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "space-between",
          paddingHorizontal: 24,
          paddingTop: 8,
          paddingBottom: 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* TOP BRAND BAR */}
        <View className="flex-row items-center justify-between py-1">
          <View className="flex-row items-center">
            <View className="w-8 h-8 rounded-full bg-[#1E3A2B] items-center justify-center mr-2">
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M12 2L4 5V11C4 16.5 7.5 20.8 12 22C16.5 20.8 20 16.5 20 11V5L12 2Z"
                  fill="#4D8365"
                />
                <Path
                  d="M12 7V17M7 12H17"
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </Svg>
            </View>
            <Text className="font-poppins-bold text-[22px] text-[#1E3A2B] tracking-tight">
              sanjeevni
            </Text>
          </View>

          {/* Privacy badge: Plain-language Edge AI promise (AGENTS.md §4.7) */}
          <View className="flex-row items-center bg-[#F4F1EA] px-2.5 py-1 rounded-full border border-[#E8E2D7]">
            <View style={{ marginRight: 4 }}>
              <LockIcon size={12} color="#55695E" />
            </View>
            <Text className="font-poppins-medium text-[11px] text-[#55695E]">
              100% On-Device
            </Text>
          </View>
        </View>

        {/* HERO ILLUSTRATION SECTION (Matches reference image aesthetic) */}
        <View className="items-center justify-center my-2">
          {step === 3 ? (
            <CalibrationRing onComplete={handleCalibrationComplete} />
          ) : (
            <OnboardingIllustration step={step} />
          )}
        </View>

        {/* THREE-DOT PAGINATION INDICATOR (Matching sample image: ○ ○ ●) */}
        <View className="flex-row items-center justify-center my-3 space-x-2">
          <View
            className={`w-2.5 h-2.5 rounded-full ${
              step === 1 ? "bg-[#101C16]" : "border border-[#101C16] bg-transparent"
            }`}
          />
          <View
            className={`w-2.5 h-2.5 rounded-full mx-1.5 ${
              step === 2 ? "bg-[#101C16]" : "border border-[#101C16] bg-transparent"
            }`}
          />
          <View
            className={`w-2.5 h-2.5 rounded-full ${
              step === 3 ? "bg-[#101C16]" : "border border-[#101C16] bg-transparent"
            }`}
          />
        </View>

        {/* DYNAMIC CONTENT FOR EACH STEP */}
        {step === 1 && (
          <View className="items-center px-1">
            {/* Bold Headline */}
            <Text className="font-poppins-bold text-[28px] leading-[34px] text-[#101C16] text-center">
              Your AI Health{"\n"}Companion
            </Text>

            {/* Subtitle */}
            <Text className="font-poppins-regular text-[14.5px] leading-[22px] text-[#55695E] text-center mt-2.5 px-2">
              Continuous, disaster-resilient health monitoring that learns your body's rhythm and protects you offline.
            </Text>

            {/* Quick Profile Cards (AGENTS.md §4.1 - low literacy tap-a-picture) */}
            <View className="w-full mt-5">
              <Text className="font-poppins-semibold text-xs text-[#8A9A90] uppercase tracking-wider mb-2 text-center">
                Select Your Care Focus
              </Text>
              <View className="flex-row flex-wrap justify-between gap-y-2">
                {VULNERABILITY_OPTIONS.map((item) => {
                  const isSelected = selectedVulnerability === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      activeOpacity={0.75}
                      onPress={() => setSelectedVulnerability(item.id)}
                      className={`w-[48.5%] py-2.5 px-3 rounded-2xl border flex-row items-center ${
                        isSelected
                          ? "bg-[#EBF5EE] border-[#214332]"
                          : "bg-[#FAFAFA] border-[#EDE8E0]"
                      }`}
                    >
                      <View style={{ marginRight: 8 }}>
                        {item.iconType === "elderly" && (
                          <UsersIcon size={18} color={isSelected ? "#1E3A2B" : "#4A5D52"} />
                        )}
                        {item.iconType === "worker" && (
                          <SunIcon size={18} color={isSelected ? "#D97706" : "#6B7280"} />
                        )}
                        {item.iconType === "cardiac" && (
                          <HeartIcon size={18} color={isSelected ? "#DC2626" : "#EF4444"} />
                        )}
                        {item.iconType === "maternal" && (
                          <HeartPulseIcon size={18} color={isSelected ? "#DB2777" : "#EC4899"} />
                        )}
                        {item.iconType === "wellness" && (
                          <LeafIcon size={18} color={isSelected ? "#16A34A" : "#22C55E"} />
                        )}
                        {item.iconType === "respiratory" && (
                          <LungsIcon size={18} color={isSelected ? "#0284C7" : "#38BDF8"} />
                        )}
                      </View>
                      <Text
                        numberOfLines={1}
                        className={`font-poppins-semibold text-xs flex-1 ${
                          isSelected ? "text-[#1E3A2B]" : "text-[#4A5D52]"
                        }`}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {step === 2 && (
          <View className="items-center px-1">
            {/* Bold Headline */}
            <Text className="font-poppins-bold text-[28px] leading-[34px] text-[#101C16] text-center">
              Emergency Contact
            </Text>

            {/* Subtitle */}
            <Text className="font-poppins-regular text-[14px] leading-[21px] text-[#55695E] text-center mt-2 px-2">
              Dispatches automated SOS SMS with your GPS location during cardiac anomalies or falls — works without internet.
            </Text>

            {/* Native Contact Picker Button (AGENTS.md §4.1: Native picker, never manual phone typing) */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handlePickNativeContact}
              className="w-full mt-4 py-3.5 px-5 bg-[#F2FAF5] border border-[#CDE5D6] rounded-2xl flex-row items-center justify-center shadow-xs"
            >
              <Text className="text-[20px] mr-2.5">📱</Text>
              <Text className="font-poppins-semibold text-[15px] text-[#1E3A2B]">
                Pick from Phone Contacts
              </Text>
            </TouchableOpacity>

            {/* Selected Contact Card */}
            <View className="w-full bg-[#FAF9F5] border border-[#E9E4DA] rounded-2xl p-4 mt-3">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className="w-10 h-10 rounded-full bg-[#214332] items-center justify-center mr-3">
                    <Text className="font-poppins-bold text-sm text-white">
                      {emergencyName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text
                      numberOfLines={1}
                      className="font-poppins-bold text-[15px] text-[#161616]"
                    >
                      {emergencyName}
                    </Text>
                    <Text className="font-poppins-medium text-xs text-[#607469]">
                      {emergencyPhone}
                    </Text>
                  </View>
                </View>

                {/* Edit Button */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    setTempManualName(emergencyName.replace(/\s*\([^)]*\)/, ""));
                    setTempManualPhone(emergencyPhone);
                    setIsManualModalOpen(true);
                  }}
                  className="px-2.5 py-1 bg-white rounded-lg border border-[#DDD7CC]"
                >
                  <Text className="font-poppins-medium text-[11px] text-[#214332]">
                    Edit
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Relationship Chips */}
              <View className="mt-3 pt-3 border-t border-[#EAE5DC]">
                <Text className="font-poppins-medium text-[11px] text-[#788B80] mb-2">
                  Relation to you:
                </Text>
                <View className="flex-row flex-wrap gap-1.5">
                  {RELATIONSHIPS.map((rel) => {
                    const isRelActive = relationship === rel;
                    return (
                      <TouchableOpacity
                        key={rel}
                        activeOpacity={0.7}
                        onPress={() => handleRelationshipSelect(rel)}
                        className={`px-3 py-1 rounded-full border ${
                          isRelActive
                            ? "bg-[#214332] border-[#214332]"
                            : "bg-white border-[#E0DBD0]"
                        }`}
                      >
                        <Text
                          className={`font-poppins-semibold text-[11px] ${
                            isRelActive ? "text-white" : "text-[#55695E]"
                          }`}
                        >
                          {rel}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          </View>
        )}

        {step === 3 && (
          <View className="items-center px-1">
            {/* Bold Headline */}
            <Text className="font-poppins-bold text-[28px] leading-[34px] text-[#101C16] text-center">
              {calibrationCompleted ? "Baseline Locked In" : "Calibrating Your Normal"}
            </Text>

            {/* Subtitle strictly following AGENTS.md §4.1: "We're learning what's normal for your body" */}
            <Text className="font-poppins-regular text-[14px] leading-[21px] text-[#55695E] text-center mt-2 px-3">
              {calibrationCompleted
                ? "Your resting vitals are calibrated. Sanjeevni will now filter false alarms and guard your health."
                : "We’re learning what’s normal for your body. Just sit comfortably and relax for a moment."}
            </Text>

            {/* Calibration details card */}
            <View className="w-full bg-[#F5F8F6] border border-[#DCEBE2] rounded-2xl p-4 mt-4 flex-row items-center justify-between">
              <View className="flex-1 pr-2">
                <Text className="font-poppins-bold text-xs text-[#214332]">
                  Edge AI Personalization
                </Text>
                <Text className="font-poppins-regular text-[11px] text-[#55695E] mt-0.5">
                  Cardiac rhythm z-scores, heat index limits, and fall gates tailored to you.
                </Text>
              </View>
              <View className="w-8 h-8 rounded-full bg-[#E2F2E8] items-center justify-center">
                <Text className="text-base">🧬</Text>
              </View>
            </View>
          </View>
        )}

        {/* BOTTOM ACTION BUTTON SECTION (Matches reference image pill button) */}
        <View className="w-full mt-6">
          {/* Main Rounded Pill Action Button */}
          {step === 1 && (
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => setStep(2)}
              className="w-full py-4 min-h-[56px] bg-[#101C16] rounded-full items-center justify-center shadow-lg shadow-black/20"
            >
              <Text className="font-poppins-bold text-white text-[16px] tracking-widest uppercase">
                START
              </Text>
            </TouchableOpacity>
          )}

          {step === 2 && (
            <View className="space-y-2.5">
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => setStep(3)}
                className="w-full py-4 min-h-[56px] bg-[#101C16] rounded-full items-center justify-center shadow-lg shadow-black/20"
              >
                <Text className="font-poppins-bold text-white text-[16px] tracking-widest uppercase">
                  NEXT
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setStep(1)}
                className="w-full py-2 items-center justify-center"
              >
                <Text className="font-poppins-medium text-xs text-[#7A8E82]">
                  ‹ Back to Welcome
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 3 && (
            <View className="space-y-2.5">
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={handleFinishOnboarding}
                className={`w-full py-4 min-h-[56px] rounded-full items-center justify-center shadow-lg ${
                  calibrationCompleted
                    ? "bg-[#214332] shadow-[#214332]/30"
                    : "bg-[#101C16] shadow-black/20"
                }`}
              >
                <Text className="font-poppins-bold text-white text-[16px] tracking-widest uppercase">
                  {calibrationCompleted ? "ENTER SANJEEVNI ›" : "START MONITORING ›"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setStep(2)}
                className="w-full py-2 items-center justify-center"
              >
                <Text className="font-poppins-medium text-xs text-[#7A8E82]">
                  ‹ Back to Contact Picker
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Secondary Options: Sign In & Continue Offline (on step 1) */}
          {step === 1 && (
            <View className="mt-3">
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => router.push("/(auth)/sign-in")}
                className="w-full py-2.5 items-center justify-center"
              >
                <Text className="font-poppins-medium text-[13.5px] text-[#214332]">
                  Sign In to Existing Account
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.75}
                onPress={handleContinueOffline}
                className="w-full py-1.5 items-center justify-center"
              >
                <Text className="font-poppins-medium text-[12px] text-[#7A8E82] underline">
                  Continue Offline (BLE Direct)
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Manual Emergency Contact Modal (Fallback when permissions denied or on web/emulator) */}
      <Modal
        visible={isManualModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsManualModalOpen(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-5">
          <View className="bg-white rounded-3xl p-6 w-full max-w-sm">
            <Text className="font-poppins-bold text-lg text-[#161616] mb-1">
              Emergency Contact Info
            </Text>
            <Text className="font-poppins-regular text-xs text-[#55695E] mb-4">
              Enter the guardian or relative to receive automated offline SOS dispatches.
            </Text>

            <Text className="font-poppins-medium text-xs text-[#7A8E82] mb-1">
              Contact Name
            </Text>
            <TextInput
              value={tempManualName}
              onChangeText={setTempManualName}
              placeholder="e.g. Ramesh Sharma"
              placeholderTextColor="#9CA3AF"
              className="bg-[#F8F7F4] border border-[#E5E0D5] rounded-xl px-3.5 py-2.5 font-poppins-medium text-sm text-[#161616] mb-3"
            />

            <Text className="font-poppins-medium text-xs text-[#7A8E82] mb-1">
              Phone Number
            </Text>
            <TextInput
              value={tempManualPhone}
              onChangeText={setTempManualPhone}
              placeholder="+91 98765 43210"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
              className="bg-[#F8F7F4] border border-[#E5E0D5] rounded-xl px-3.5 py-2.5 font-poppins-medium text-sm text-[#161616] mb-5"
            />

            <View className="flex-row space-x-2">
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setIsManualModalOpen(false)}
                className="flex-1 py-3 rounded-xl bg-[#F5F2EB] items-center justify-center mr-2"
              >
                <Text className="font-poppins-semibold text-sm text-[#55695E]">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleSaveManualContact}
                className="flex-1 py-3 rounded-xl bg-[#214332] items-center justify-center"
              >
                <Text className="font-poppins-semibold text-sm text-white">
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
