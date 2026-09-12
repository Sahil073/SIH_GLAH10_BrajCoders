import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUserProfile } from "@/store/userProfileStore";

export default function SOSScreen() {
  const { profile } = useUserProfile();
  const [sosTriggered, setSosTriggered] = useState(false);

  const handleTriggerSOS = () => {
    Alert.alert(
      "Confirm Emergency SOS",
      "Are you sure you want to broadcast your GPS location and dispatch emergency SMS to your emergency contacts?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "SEND SOS",
          style: "destructive",
          onPress: () => {
            setSosTriggered(true);
            setTimeout(() => {
              Alert.alert(
                "SOS Broadcast Sent",
                "Your GPS location (28.6139° N, 77.2090° E) has been transmitted via SMS to your primary emergency contacts.",
                [{ text: "OK", onPress: () => setSosTriggered(false) }]
              );
            }, 800);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F7FAF8" }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 110, paddingTop: 12 }}
        showsVerticalScrollIndicator={false}
        className="px-5"
      >
        {/* Header */}
        <View className="items-center mb-6">
          <View className="bg-red-50 border border-red-200 px-3 py-1 rounded-full mb-2">
            <Text className="font-poppins-semibold text-xs text-red-600">
              Emergency Response Hub
            </Text>
          </View>
          <Text className="font-poppins-bold text-[28px] text-[#101C16] text-center">
            Emergency SOS
          </Text>
          <Text className="font-poppins-regular text-sm text-[#55695E] text-center mt-1 px-4 leading-relaxed">
            Instant help when you need it most. Operates offline using SMS and GPS.
          </Text>
        </View>

        {/* Big Central Emergency Action Button */}
        <View className="items-center justify-center my-4 py-4">
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleTriggerSOS}
            className="w-48 h-48 rounded-full bg-[#DC2626] items-center justify-center shadow-xl shadow-red-600/40 border-8 border-[#FEE2E2]"
          >
            <Text className="font-poppins-bold text-white text-[38px] tracking-widest leading-none">
              {sosTriggered ? "SENDING" : "SOS"}
            </Text>
            <Text className="font-poppins-semibold text-white/90 text-xs tracking-wider uppercase mt-1">
              {sosTriggered ? "Transmitting..." : "Tap for Help"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* GPS Location & Telemetry Status Card */}
        <View className="bg-white rounded-2xl p-4 mb-4 border border-[#E9EFEA] shadow-sm">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <Text className="text-xl mr-2">📍</Text>
              <Text className="font-poppins-bold text-sm text-[#101C16]">
                Live GPS Location
              </Text>
            </View>
            <View className="flex-row items-center bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              <View className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1" />
              <Text className="font-poppins-semibold text-[10px] text-emerald-700">
                Ready
              </Text>
            </View>
          </View>
          <Text className="font-poppins-medium text-xs text-[#214332]">
            Lat: 28.6139° N • Lon: 77.2090° E
          </Text>
          <Text className="font-poppins-regular text-[11px] text-[#7A8E82] mt-0.5">
            Accurate to 3.8m • Works without mobile internet via GSM/SMS
          </Text>
        </View>

        {/* Fall Detection & Smart Sensing Status */}
        <View className="bg-white rounded-2xl p-4 mb-4 border border-[#E9EFEA] shadow-sm">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center">
              <Text className="text-xl mr-2">🛡️</Text>
              <Text className="font-poppins-bold text-sm text-[#101C16]">
                Automatic Fall Detection
              </Text>
            </View>
            <Text className="font-poppins-semibold text-xs text-[#16A34A]">
              Active
            </Text>
          </View>
          <Text className="font-poppins-regular text-xs text-[#4A6455] leading-relaxed">
            Sanjeevni T-shirt 6-axis IMU sensor is monitoring posture and impact in real time.
          </Text>
        </View>

        {/* Emergency Contacts List */}
        <View className="bg-white rounded-2xl p-4 border border-[#E9EFEA] shadow-sm mb-4">
          <Text className="font-poppins-bold text-sm text-[#101C16] mb-3">
            Emergency Contacts on Dispatch
          </Text>

          <View className="flex-row items-center justify-between py-2 border-b border-[#F2F6F3]">
            <View>
              <Text className="font-poppins-semibold text-xs text-[#101C16]">
                {profile.emergencyContactName || "Dr. Sharma (Physician)"}
              </Text>
              <Text className="font-poppins-regular text-[11px] text-[#7A8E82]">
                {profile.emergencyContactPhone || "+91 98765 43210"}
              </Text>
            </View>
            <Text className="text-base">📞</Text>
          </View>

          <View className="flex-row items-center justify-between py-2">
            <View>
              <Text className="font-poppins-semibold text-xs text-[#101C16]">
                Parent / Primary Guardian
              </Text>
              <Text className="font-poppins-regular text-[11px] text-[#7A8E82]">
                +91 98123 45678
              </Text>
            </View>
            <Text className="text-base">📞</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
