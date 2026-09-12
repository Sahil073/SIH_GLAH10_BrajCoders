import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  useUserProfile,
  GenderType,
  BloodGroupType,
  saveUserProfile,
} from "@/store/userProfileStore";
import Svg, { Path, Circle } from "react-native-svg";

const BLOOD_GROUPS: BloodGroupType[] = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
];

const COMMON_CONDITIONS = [
  "None",
  "Asthma",
  "Hypertension",
  "Diabetes",
  "Heart Arrhythmia",
  "Allergies",
  "Other",
];

export default function OnboardingHealthScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ from?: string }>();
  const isEditing = params.from === "profile";

  const { profile } = useUserProfile();

  // Local state initialized with user profile (default matching user image: 22, Female, 165cm, 58kg, B+, None)
  const [step, setStep] = useState<number>(1);
  const [age, setAge] = useState<number>(profile.age || 22);
  const [gender, setGender] = useState<GenderType>(profile.gender || "Female");
  const [heightCm, setHeightCm] = useState<number>(profile.heightCm || 165);
  const [weightKg, setWeightKg] = useState<number>(profile.weightKg || 58);
  const [bloodGroup, setBloodGroup] = useState<BloodGroupType>(profile.bloodGroup || "B+");
  const [medicalCondition, setMedicalCondition] = useState<string>(
    profile.medicalCondition || "None"
  );
  const [emergencyContactName, setEmergencyContactName] = useState<string>(
    profile.emergencyContactName || "Dr. Sharma (Guardian)"
  );
  const [emergencyContactPhone, setEmergencyContactPhone] = useState<string>(
    profile.emergencyContactPhone || "+91 98765 43210"
  );

  // BMI calculation
  const bmi = useMemo(() => {
    const heightInMeters = heightCm / 100;
    const val = weightKg / (heightInMeters * heightInMeters);
    return Number(val.toFixed(1));
  }, [heightCm, weightKg]);

  const bmiCategory = useMemo(() => {
    if (bmi < 18.5) return { label: "Underweight", color: "#F59E0B" };
    if (bmi <= 24.9) return { label: "Normal & Healthy", color: "#16A34A" };
    if (bmi <= 29.9) return { label: "Overweight", color: "#F59E0B" };
    return { label: "Obese", color: "#EF4444" };
  }, [bmi]);

  const handleNext = () => {
    if (step < 4) {
      setStep((s) => s + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((s) => s - 1);
    } else {
      if (isEditing) {
        router.back();
      } else {
        router.replace("/(auth)/sign-up");
      }
    }
  };

  const handleComplete = async () => {
    await saveUserProfile({
      age,
      gender,
      heightCm,
      weightKg,
      bloodGroup,
      medicalCondition,
      emergencyContactName: emergencyContactName.trim() || "Dr. Sharma (Guardian)",
      emergencyContactPhone: emergencyContactPhone.trim() || "+91 98765 43210",
      isCompleted: true,
    });

    if (isEditing) {
      router.replace("/(tabs)/profile");
    } else {
      router.replace("/connect-device");
    }
  };

  const handleConditionSelect = (cond: string) => {
    if (cond === "None") {
      setMedicalCondition("None");
      return;
    }

    if (medicalCondition === "None") {
      setMedicalCondition(cond);
      return;
    }

    const current = medicalCondition.split(", ").filter(Boolean);
    if (current.includes(cond)) {
      const filtered = current.filter((c) => c !== cond);
      setMedicalCondition(filtered.length > 0 ? filtered.join(", ") : "None");
    } else {
      setMedicalCondition([...current, cond].join(", "));
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F7F5F0" }}>
      {/* Top Navigation & Progress Header */}
      <View className="px-5 pt-3 pb-2">
        <View className="flex-row items-center justify-between mb-3">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleBack}
            className="w-10 h-10 rounded-full bg-white border border-[#EDE9E2] items-center justify-center"
          >
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                d="M15 18L9 12L15 6"
                stroke="#161616"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>

          <View className="items-center">
            <Text className="font-poppins-semibold text-xs text-[#8A9A90] uppercase tracking-wider">
              Step {step} of 4
            </Text>
            <Text className="font-poppins-bold text-sm text-[#161616]">
              {step === 1 && "Personal Basics"}
              {step === 2 && "Body Metrics"}
              {step === 3 && "Medical Profile"}
              {step === 4 && "Health Review"}
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setStep(4)}
            className="py-1 px-2"
          >
            <Text className="font-poppins-medium text-xs text-[#55695E]">
              {step < 4 ? "Review" : ""}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        <View className="h-1.5 w-full bg-[#E5E0D6] rounded-full overflow-hidden">
          <View
            style={{
              height: "100%",
              backgroundColor: "#214332",
              borderRadius: 9999,
              width: `${(step / 4) * 100}%`,
            }}
          />
        </View>
      </View>

      {/* Main Step Content */}
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 110, paddingTop: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <View key={step}>
          {/* STEP 1: AGE & GENDER */}
          {step === 1 && (
            <View>
              <Text className="font-poppins-bold text-[26px] text-[#161616] leading-tight mb-1">
                Tell us about yourself
              </Text>
              <Text className="font-poppins-regular text-sm text-[#55695E] mb-6">
                Your biological profile helps Sanjeevni calibrate accurate baseline algorithms.
              </Text>

              {/* Gender Selector */}
              <Text className="font-poppins-semibold text-xs uppercase tracking-wider text-[#8A9A90] mb-3">
                Gender
              </Text>
              <View className="flex-row justify-between mb-6 space-x-2.5">
                {(["Female", "Male", "Other"] as const).map((g) => {
                  const isSelected = gender === g;
                  return (
                    <TouchableOpacity
                      key={g}
                      activeOpacity={0.8}
                      onPress={() => setGender(g)}
                      className={`flex-1 py-4 px-2 rounded-2xl items-center justify-center border ${
                        isSelected
                          ? "bg-white border-[#214332]"
                          : "bg-white border-[#EDE9E2]"
                      }`}
                    >
                      <View
                        className={`w-10 h-10 rounded-full items-center justify-center mb-2 ${
                          isSelected ? "bg-[#EBF5EE]" : "bg-[#F5F2EB]"
                        }`}
                      >
                        {g === "Female" ? (
                          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                            <Circle cx="12" cy="9" r="6" stroke="#214332" strokeWidth="2" />
                            <Path d="M12 15V21M9 18H15" stroke="#214332" strokeWidth="2" strokeLinecap="round" />
                          </Svg>
                        ) : g === "Male" ? (
                          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                            <Circle cx="10" cy="14" r="6" stroke="#214332" strokeWidth="2" />
                            <Path d="M14.5 9.5L20 4M20 4H15M20 4V9" stroke="#214332" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </Svg>
                        ) : (
                          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                            <Circle cx="12" cy="12" r="6" stroke="#214332" strokeWidth="2" />
                            <Path d="M12 2V6M12 18V22" stroke="#214332" strokeWidth="2" strokeLinecap="round" />
                          </Svg>
                        )}
                      </View>
                      <Text
                        className={`font-poppins-semibold text-sm ${
                          isSelected ? "text-[#214332]" : "text-[#55695E]"
                        }`}
                      >
                        {g}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Age Selector */}
              <Text className="font-poppins-semibold text-xs uppercase tracking-wider text-[#8A9A90] mb-3">
                Age
              </Text>
              <View className="bg-white rounded-3xl p-5 border border-[#EDE9E2] mb-4 items-center">
                <View className="flex-row items-baseline justify-center mb-4">
                  <Text className="font-poppins-bold text-[52px] text-[#161616] leading-none">
                    {age}
                  </Text>
                  <Text className="font-poppins-medium text-base text-[#8A9A90] ml-2">
                    years old
                  </Text>
                </View>

                {/* Interactive Stepper Buttons */}
                <View className="flex-row items-center space-x-4">
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setAge((prev) => Math.max(10, prev - 1))}
                    className="w-14 h-14 rounded-2xl bg-[#F5F2EB] items-center justify-center border border-[#EAE6DF]"
                  >
                    <Text className="font-poppins-bold text-2xl text-[#161616] leading-none">
                      −
                    </Text>
                  </TouchableOpacity>

                  <View className="px-6 py-2 bg-[#F8F7F4] rounded-full border border-[#EAE6DF]">
                    <Text className="font-poppins-semibold text-xs text-[#55695E]">
                      Adjust age
                    </Text>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setAge((prev) => Math.min(100, prev + 1))}
                    className="w-14 h-14 rounded-2xl bg-[#214332] items-center justify-center"
                  >
                    <Text className="font-poppins-bold text-2xl text-white leading-none">
                      +
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Quick Age Presets */}
                <View className="flex-row flex-wrap justify-center gap-2 mt-5 pt-4 border-t border-[#F5F2EB] w-full">
                  {[18, 22, 25, 30, 45, 60].map((preset) => (
                    <TouchableOpacity
                      key={preset}
                      activeOpacity={0.7}
                      onPress={() => setAge(preset)}
                      className={`px-3 py-1 rounded-full border ${
                        age === preset
                          ? "bg-[#214332] border-[#214332]"
                          : "bg-white border-[#EAE6DF]"
                      }`}
                    >
                      <Text
                        className={`font-poppins-medium text-xs ${
                          age === preset ? "text-white" : "text-[#55695E]"
                        }`}
                      >
                        {preset}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* STEP 2: HEIGHT & WEIGHT */}
          {step === 2 && (
            <View>
              <Text className="font-poppins-bold text-[26px] text-[#161616] leading-tight mb-1">
                Body Measurements
              </Text>
              <Text className="font-poppins-regular text-sm text-[#55695E] mb-5">
                Needed for computing heart stroke volume, caloric burn, and fall inertia.
              </Text>

              {/* Height Stepper Card */}
              <View className="bg-white rounded-3xl p-5 border border-[#EDE9E2] mb-4">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="font-poppins-semibold text-xs uppercase tracking-wider text-[#8A9A90]">
                    Height
                  </Text>
                  <View className="flex-row items-baseline">
                    <Text className="font-poppins-bold text-3xl text-[#161616]">
                      {heightCm}
                    </Text>
                    <Text className="font-poppins-medium text-xs text-[#55695E] ml-1">
                      cm
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center justify-between mt-2">
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setHeightCm((prev) => Math.max(100, prev - 1))}
                    className="w-12 h-12 rounded-2xl bg-[#F5F2EB] items-center justify-center border border-[#EAE6DF]"
                  >
                    <Text className="font-poppins-bold text-xl text-[#161616]">
                      −
                    </Text>
                  </TouchableOpacity>

                  {/* Preset chips */}
                  <View className="flex-row flex-wrap justify-center gap-1.5 flex-1 px-3">
                    {[155, 160, 165, 170, 175, 180].map((h) => (
                      <TouchableOpacity
                        key={h}
                        activeOpacity={0.7}
                        onPress={() => setHeightCm(h)}
                        className={`px-2.5 py-1 rounded-full border ${
                          heightCm === h
                            ? "bg-[#214332] border-[#214332]"
                            : "bg-[#F8F7F4] border-[#EAE6DF]"
                        }`}
                      >
                        <Text
                          className={`font-poppins-medium text-[11px] ${
                            heightCm === h ? "text-white" : "text-[#55695E]"
                          }`}
                        >
                          {h}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setHeightCm((prev) => Math.min(230, prev + 1))}
                    className="w-12 h-12 rounded-2xl bg-[#214332] items-center justify-center"
                  >
                    <Text className="font-poppins-bold text-xl text-white">
                      +
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Weight Stepper Card */}
              <View className="bg-white rounded-3xl p-5 border border-[#EDE9E2] mb-4">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="font-poppins-semibold text-xs uppercase tracking-wider text-[#8A9A90]">
                    Weight
                  </Text>
                  <View className="flex-row items-baseline">
                    <Text className="font-poppins-bold text-3xl text-[#161616]">
                      {weightKg}
                    </Text>
                    <Text className="font-poppins-medium text-xs text-[#55695E] ml-1">
                      kg
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center justify-between mt-2">
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setWeightKg((prev) => Math.max(30, prev - 1))}
                    className="w-12 h-12 rounded-2xl bg-[#F5F2EB] items-center justify-center border border-[#EAE6DF]"
                  >
                    <Text className="font-poppins-bold text-xl text-[#161616]">
                      −
                    </Text>
                  </TouchableOpacity>

                  {/* Preset chips */}
                  <View className="flex-row flex-wrap justify-center gap-1.5 flex-1 px-3">
                    {[50, 55, 58, 65, 75, 85].map((w) => (
                      <TouchableOpacity
                        key={w}
                        activeOpacity={0.7}
                        onPress={() => setWeightKg(w)}
                        className={`px-2.5 py-1 rounded-full border ${
                          weightKg === w
                            ? "bg-[#214332] border-[#214332]"
                            : "bg-[#F8F7F4] border-[#EAE6DF]"
                        }`}
                      >
                        <Text
                          className={`font-poppins-medium text-[11px] ${
                            weightKg === w ? "text-white" : "text-[#55695E]"
                          }`}
                        >
                          {w}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setWeightKg((prev) => Math.min(200, prev + 1))}
                    className="w-12 h-12 rounded-2xl bg-[#214332] items-center justify-center"
                  >
                    <Text className="font-poppins-bold text-xl text-white">
                      +
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Dynamic BMI Card */}
              <View className="bg-[#EBF5EE] rounded-2xl p-4 border border-[#D5EBDE] flex-row items-center justify-between">
                <View>
                  <Text className="font-poppins-medium text-xs text-[#55695E]">
                    Calculated Body Mass Index
                  </Text>
                  <Text className="font-poppins-bold text-lg text-[#214332]">
                    BMI {bmi}{" "}
                    <Text
                      style={{ color: bmiCategory.color }}
                      className="font-poppins-semibold text-xs"
                    >
                      • {bmiCategory.label}
                    </Text>
                  </Text>
                </View>
                <View className="w-9 h-9 rounded-full bg-white items-center justify-center border border-[#D5EBDE]">
                  <Text className="text-base">⚖️</Text>
                </View>
              </View>
            </View>
          )}

          {/* STEP 3: BLOOD GROUP & MEDICAL CONDITION */}
          {step === 3 && (
            <View>
              <Text className="font-poppins-bold text-[26px] text-[#161616] leading-tight mb-1">
                Medical & Safety ID
              </Text>
              <Text className="font-poppins-regular text-sm text-[#55695E] mb-5">
                Sent automatically in emergency SOS beacons to paramedics even without cellular internet.
              </Text>

              {/* Blood Group Grid */}
              <Text className="font-poppins-semibold text-xs uppercase tracking-wider text-[#8A9A90] mb-3">
                Blood Group
              </Text>
              <View className="flex-row flex-wrap justify-between gap-y-2.5 mb-6">
                {BLOOD_GROUPS.map((bg) => {
                  const isSelected = bloodGroup === bg;
                  return (
                    <TouchableOpacity
                      key={bg}
                      activeOpacity={0.75}
                      onPress={() => setBloodGroup(bg)}
                      className={`w-[23%] py-3.5 rounded-2xl items-center justify-center border ${
                        isSelected
                          ? "bg-[#214332] border-[#214332]"
                          : "bg-white border-[#EDE9E2]"
                      }`}
                    >
                      <Text
                        className={`font-poppins-bold text-base ${
                          isSelected ? "text-white" : "text-[#161616]"
                        }`}
                      >
                        {bg}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Medical Conditions Selector */}
              <Text className="font-poppins-semibold text-xs uppercase tracking-wider text-[#8A9A90] mb-3">
                Known Medical Conditions
              </Text>
              <View className="flex-row flex-wrap gap-2 mb-6">
                {COMMON_CONDITIONS.map((cond) => {
                  const isSelected =
                    cond === "None"
                      ? medicalCondition === "None"
                      : medicalCondition.split(", ").includes(cond);

                  return (
                    <TouchableOpacity
                      key={cond}
                      activeOpacity={0.75}
                      onPress={() => handleConditionSelect(cond)}
                      className={`px-4 py-2.5 rounded-2xl border ${
                        isSelected
                          ? "bg-[#214332] border-[#214332]"
                          : "bg-white border-[#EDE9E2]"
                      }`}
                    >
                      <Text
                        className={`font-poppins-semibold text-xs ${
                          isSelected ? "text-white" : "text-[#55695E]"
                        }`}
                      >
                        {cond}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Emergency Contact Card */}
              <View className="bg-white rounded-3xl p-5 border border-[#EDE9E2] mb-4">
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="font-poppins-bold text-sm text-[#161616]">
                    Emergency Contact
                  </Text>
                  <View className="px-2.5 py-0.5 rounded-full bg-[#FEE2E2] border border-[#FECACA]">
                    <Text className="font-poppins-semibold text-[10px] text-[#DC2626]">
                      SOS Dispatch
                    </Text>
                  </View>
                </View>
                <Text className="font-poppins-regular text-xs text-[#55695E] mb-3">
                  Will receive automated SOS SMS and GPS beacon during high-risk cardiac or fall alerts.
                </Text>

                {/* Quick Relationship Chips */}
                <View className="flex-row flex-wrap gap-1.5 mb-3">
                  {["Guardian", "Parent", "Spouse", "Doctor", "Friend"].map((rel) => (
                    <TouchableOpacity
                      key={rel}
                      activeOpacity={0.7}
                      onPress={() => {
                        if (!emergencyContactName || emergencyContactName.includes("(")) {
                          setEmergencyContactName(`${rel}`);
                        } else {
                          setEmergencyContactName(`${emergencyContactName} (${rel})`);
                        }
                      }}
                      className="px-3 py-1 rounded-full bg-[#F5F2EB] border border-[#EAE6DF]"
                    >
                      <Text className="font-poppins-medium text-[11px] text-[#55695E]">
                        + {rel}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Contact Name Input */}
                <View className="mb-3">
                  <Text className="font-poppins-medium text-xs text-[#55695E] mb-1">
                    Contact Name & Relation
                  </Text>
                  <TextInput
                    value={emergencyContactName}
                    onChangeText={setEmergencyContactName}
                    placeholder="e.g. Dr. Sharma (Guardian)"
                    placeholderTextColor="#9CA3AF"
                    className="bg-[#F8F7F4] border border-[#EDE9E2] rounded-xl px-3.5 py-2.5 font-poppins-medium text-sm text-[#161616]"
                  />
                </View>

                {/* Contact Phone Input */}
                <View>
                  <Text className="font-poppins-medium text-xs text-[#55695E] mb-1">
                    Phone Number (SMS & Call)
                  </Text>
                  <TextInput
                    value={emergencyContactPhone}
                    onChangeText={setEmergencyContactPhone}
                    placeholder="+91 98765 43210"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                    className="bg-[#F8F7F4] border border-[#EDE9E2] rounded-xl px-3.5 py-2.5 font-poppins-medium text-sm text-[#161616]"
                  />
                </View>
              </View>
            </View>
          )}

          {/* STEP 4: EXACT SUMMARY CARD REPLICATING REFERENCE IMAGE */}
          {step === 4 && (
            <View>
              <Text className="font-poppins-bold text-[26px] text-[#161616] leading-tight mb-1">
                Review Your Profile
              </Text>
              <Text className="font-poppins-regular text-sm text-[#55695E] mb-5">
                Confirm your details. Sanjeevni will calibrate your risk detection algorithms using this baseline.
              </Text>

              {/* Exact Card from Image */}
              <View className="bg-white rounded-3xl p-6 border border-[#EDE9E2] mb-5">
                <View className="space-y-4">
                  {/* Age */}
                  <View className="flex-row justify-between items-center py-2.5 border-b border-[#F5F2EB]">
                    <Text className="font-poppins-medium text-sm text-[#55695E]">
                      Age
                    </Text>
                    <Text className="font-poppins-bold text-base text-[#161616]">
                      {age}
                    </Text>
                  </View>

                  {/* Gender */}
                  <View className="flex-row justify-between items-center py-2.5 border-b border-[#F5F2EB]">
                    <Text className="font-poppins-medium text-sm text-[#55695E]">
                      Gender
                    </Text>
                    <Text className="font-poppins-bold text-base text-[#161616]">
                      {gender}
                    </Text>
                  </View>

                  {/* Height */}
                  <View className="flex-row justify-between items-center py-2.5 border-b border-[#F5F2EB]">
                    <Text className="font-poppins-medium text-sm text-[#55695E]">
                      Height
                    </Text>
                    <Text className="font-poppins-bold text-base text-[#161616]">
                      {heightCm} cm
                    </Text>
                  </View>

                  {/* Weight */}
                  <View className="flex-row justify-between items-center py-2.5 border-b border-[#F5F2EB]">
                    <Text className="font-poppins-medium text-sm text-[#55695E]">
                      Weight
                    </Text>
                    <Text className="font-poppins-bold text-base text-[#161616]">
                      {weightKg} kg
                    </Text>
                  </View>

                  {/* Blood Group */}
                  <View className="flex-row justify-between items-center py-2.5 border-b border-[#F5F2EB]">
                    <Text className="font-poppins-medium text-sm text-[#55695E]">
                      Blood Group
                    </Text>
                    <Text className="font-poppins-bold text-base text-[#161616]">
                      {bloodGroup}
                    </Text>
                  </View>

                  {/* Medical Condition */}
                  <View className="flex-row justify-between items-center py-2.5 border-b border-[#F5F2EB]">
                    <Text className="font-poppins-medium text-sm text-[#55695E]">
                      Medical Condition
                    </Text>
                    <Text className="font-poppins-bold text-base text-[#161616]">
                      {medicalCondition}
                    </Text>
                  </View>

                  {/* Emergency Contact */}
                  <View className="flex-row justify-between items-center py-2.5">
                    <Text className="font-poppins-medium text-sm text-[#55695E]">
                      Emergency Contact
                    </Text>
                    <View className="items-end">
                      <Text className="font-poppins-bold text-base text-[#161616]">
                        {emergencyContactName || "Guardian"}
                      </Text>
                      <Text className="font-poppins-medium text-xs text-[#7A8E82]">
                        {emergencyContactPhone}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* AI Calibration Badge */}
              <View className="bg-[#EBF5EE] rounded-2xl p-4 border border-[#D5EBDE] flex-row items-center mb-2">
                <View className="w-10 h-10 rounded-full bg-white items-center justify-center mr-3 border border-[#D5EBDE]">
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M12 2L4 5.5V11.5C4 16.5 7.5 20.8 12 22C16.5 20.8 20 16.5 20 11.5V5.5L12 2Z"
                      fill="#DCFCE7"
                      stroke="#16A34A"
                      strokeWidth="1.8"
                    />
                    <Path
                      d="M9 12L11 14L15 10"
                      stroke="#16A34A"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </View>
                <View className="flex-1">
                  <Text className="font-poppins-bold text-xs text-[#214332]">
                    Baseline Calibrated
                  </Text>
                  <Text className="font-poppins-regular text-[11px] text-[#55695E]">
                    Sanjeevni AI neural model will adapt to your personal vitals.
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Bottom Action Button */}
      <View className="absolute bottom-0 left-0 right-0 p-5 bg-[#F7F5F0] border-t border-[#EDE9E2]">
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handleNext}
          className="w-full py-4 px-8 min-h-[58px] bg-[#214332] rounded-full flex-row items-center justify-center"
        >
          <Text className="font-poppins-semibold text-white text-[17px] tracking-wide">
            {step < 4 ? "Continue" : isEditing ? "Save Profile" : "Complete & Connect Wearable"}
          </Text>
          <Text className="text-white text-xl font-light ml-2">
            ›
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
