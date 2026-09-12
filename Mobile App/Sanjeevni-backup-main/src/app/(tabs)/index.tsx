import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth, useUser } from "@clerk/expo";
import { useRouter } from "expo-router";

import { useDashboardData } from "@/hooks/useDashboardData";
import { images } from "@/constants/images";
import {
  DualWaveChart,
  PulseWaveChart,
  PillBarChart,
  SmoothTrendWaveChart,
} from "@/components/dashboard/ModernGraphs";
import {
  HeartPulseIcon,
  DropletIcon,
  ThermometerIcon,
  CloudIcon,
  MoistureIcon,
  WalkingPersonIcon,
} from "@/components/dashboard/ModernDashboardIcons";
import { ShieldCheckIcon } from "@/components/dashboard/DashboardIcons";
import { MetricDetailModal } from "@/components/dashboard/MetricDetailModal";
import { MetricType } from "@/types/dashboard";

export default function HomeScreen() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const { data } = useDashboardData();

  const [statusDetailsOpen, setStatusDetailsOpen] = useState<boolean>(false);
  const [activeDetailMetric, setActiveDetailMetric] = useState<MetricType | null>(null);

  // Dynamic current day & date
  const now = new Date();
  const dayNumber = now.getDate();
  const dayName = now.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();

  if (!isLoaded || !isSignedIn) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header Row: User Avatar */}
        <View className="flex-row items-center justify-between px-6 pt-2 pb-4">
          {/* User Profile Avatar */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push("/(tabs)/profile")}
            className="w-11 h-11 rounded-full overflow-hidden border border-[#EDE9E2] items-center justify-center bg-[#EDEAE4]"
          >
            {user?.imageUrl ? (
              <Image
                source={{ uri: user.imageUrl }}
                className="w-11 h-11 rounded-full"
              />
            ) : (
              <Image
                source={images.mascotLogo}
                className="w-8 h-8 rounded-full"
                resizeMode="contain"
              />
            )}
          </TouchableOpacity>
        </View>

        {/* Health Overview Title & Live Day / Date Widget */}
        <View className="flex-row items-start justify-between px-6 mb-5">
          <View>
            <Text className="font-poppins-bold text-[33px] text-[#161616] leading-[38px]">
              Health
            </Text>
            <Text className="font-poppins-bold text-[33px] text-[#161616] leading-[38px]">
              overview
            </Text>
          </View>

          {/* Live Day & Date Pill */}
          <View className="bg-[#EDEAE3] rounded-2xl p-1">
            <View className="bg-white rounded-xl px-3.5 py-2 items-center justify-center min-w-[54px] shadow-xs">
              <Text className="font-poppins-bold text-[18px] text-[#161616] leading-none">
                {dayNumber}
              </Text>
              <Text className="font-poppins-bold text-[9.5px] text-[#86837C] tracking-wider mt-1">
                {dayName}
              </Text>
            </View>
          </View>
        </View>

        {/* Section: Overall Status (Interactive Modern Card matching design) */}
        <View className="px-6 mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="font-poppins-bold text-[17px] text-[#161616]">
              Overall Status
            </Text>
            <View className="flex-row items-center bg-[#EBF5EE] px-2.5 py-1 rounded-full border border-[#D5EBDE]">
              <View className="w-2 h-2 rounded-full bg-[#16A34A] mr-1.5" />
              <Text className="font-poppins-semibold text-[11px] text-[#16A34A]">
                Optimal
              </Text>
            </View>
          </View>

          {/* Interactive Overall Status Card with vibrant modern styling */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => setStatusDetailsOpen((prev) => !prev)}
            className="bg-[#EAF7EE] rounded-[26px] p-5 border border-[#CFECD7]"
            style={styles.cardShadow}
          >
            <View className="flex-row items-center">
              {/* Vibrant Shield Check Icon Badge Container */}
              <View className="w-14 h-14 rounded-2xl bg-white items-center justify-center mr-4 border border-[#C6EAD2] shadow-xs">
                <ShieldCheckIcon size={40} />
              </View>

              {/* Status Content */}
              <View className="flex-1">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Text className="font-poppins-bold text-[20px] text-[#14532D] tracking-wide leading-tight">
                      {data.overallStatus.title}
                    </Text>
                    <View className="ml-2 bg-[#DCFCE7] px-2 py-0.5 rounded-full border border-[#BBF7D0]">
                      <Text className="font-poppins-semibold text-[10px] text-[#15803D]">
                        ● Stable
                      </Text>
                    </View>
                  </View>
                  <View className="bg-white/80 px-2 py-0.5 rounded-full border border-[#C6EAD2]">
                    <Text className="font-poppins-medium text-[10.5px] text-[#15803D]">
                      {statusDetailsOpen ? "Hide ▲" : "Info ▼"}
                    </Text>
                  </View>
                </View>
                <Text className="font-poppins-semibold text-[14px] text-[#1E3A2B] mt-1">
                  {data.overallStatus.subtitle}
                </Text>
                <Text className="font-poppins-regular text-[12.5px] text-[#4A6455] mt-0.5 leading-snug">
                  {data.overallStatus.description}
                </Text>
              </View>
            </View>

            {/* Interactive Expanded Diagnostic Breakdown with Colorful Badges */}
            {statusDetailsOpen && (
              <View className="mt-4 pt-3.5 border-t border-[#D5EBDE]">
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center">
                    <View className="w-6 h-6 rounded-full bg-[#DCFCE7] items-center justify-center mr-2">
                      <Text className="text-[11px]">⚡</Text>
                    </View>
                    <Text className="font-poppins-medium text-[12.5px] text-[#1E3A2B]">
                      On-Device AI Detection
                    </Text>
                  </View>
                  <View className="bg-[#DCFCE7] px-2.5 py-0.5 rounded-full border border-[#BBF7D0]">
                    <Text className="font-poppins-semibold text-[10.5px] text-[#15803D]">
                      TensorFlow Lite Active
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center">
                    <View className="w-6 h-6 rounded-full bg-[#E0F2FE] items-center justify-center mr-2">
                      <Text className="text-[11px]">👕</Text>
                    </View>
                    <Text className="font-poppins-medium text-[12.5px] text-[#1E3A2B]">
                      BLE Wearable T-Shirt
                    </Text>
                  </View>
                  <View className="bg-[#E0F2FE] px-2.5 py-0.5 rounded-full border border-[#BAE6FD]">
                    <Text className="font-poppins-semibold text-[10.5px] text-[#0284C7]">
                      Connected • Synced
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <View className="w-6 h-6 rounded-full bg-[#F3E8FF] items-center justify-center mr-2">
                      <Text className="text-[11px]">🛡️</Text>
                    </View>
                    <Text className="font-poppins-medium text-[12.5px] text-[#1E3A2B]">
                      Health Risk Level
                    </Text>
                  </View>
                  <View className="bg-[#F3E8FF] px-2.5 py-0.5 rounded-full border border-[#E9D5FF]">
                    <Text className="font-poppins-semibold text-[10.5px] text-[#7E22CE]">
                      Low Risk (0 Anomalies)
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Section: My health (6 Cards Grid with Dedicated Modern Graphs) */}
        <View className="px-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="font-poppins-bold text-[16px] text-[#161616]">
              My health
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push("/(tabs)/history")}
            >
              <Text className="font-poppins-medium text-[12px] text-[#86837C]">
                View all ›
              </Text>
            </TouchableOpacity>
          </View>

          {/* 6 Cards Grid (2x3) */}
          <View className="space-y-3.5">
            {/* Row 1: Heart Rate & SpO2 */}
            <View className="flex-row justify-between mb-3.5">
              {/* Card 1: Heart Rate (Vibrant Lime #D2EE4D) */}
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => setActiveDetailMetric("heart_rate")}
                className="flex-1 bg-[#D2EE4D] rounded-[26px] p-4 mr-2 justify-between"
                style={styles.cardShadow}
              >
                <View className="flex-row items-center mb-1">
                  <View className="w-7 h-7 rounded-full bg-white items-center justify-center mr-2 shadow-xs">
                    <HeartPulseIcon size={15} color="#161616" />
                  </View>
                  <Text className="font-poppins-semibold text-[13px] text-[#161616]">
                    Heart rate
                  </Text>
                </View>

                <View className="my-1.5">
                  <PulseWaveChart height={42} />
                </View>

                <View className="flex-row items-baseline mt-1">
                  <Text className="font-poppins-bold text-[24px] text-[#161616] leading-none">
                    {data.heartRate.value}
                  </Text>
                  <Text className="font-poppins-semibold text-[11px] text-[#3E4A10] ml-1.5 uppercase">
                    {data.heartRate.unit}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Card 2: SpO2 (Warm Sand #ECE8E1) */}
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => setActiveDetailMetric("spo2")}
                className="flex-1 bg-[#ECE8E1] rounded-[26px] p-4 ml-2 justify-between"
                style={styles.cardShadow}
              >
                <View className="flex-row items-center mb-1">
                  <View className="w-7 h-7 rounded-full bg-white items-center justify-center mr-2 shadow-xs">
                    <DropletIcon size={15} color="#161616" />
                  </View>
                  <Text className="font-poppins-semibold text-[13px] text-[#161616]">
                    SpO₂
                  </Text>
                </View>

                <View className="my-1.5">
                  <DualWaveChart
                    upperValues={[38, 48, 42, 54, 46, 52, 40, 48]}
                    lowerValues={[22, 32, 26, 36, 28, 34, 24, 30]}
                    height={42}
                  />
                </View>

                <View className="flex-row items-baseline mt-1">
                  <Text className="font-poppins-bold text-[24px] text-[#161616] leading-none">
                    {data.spo2.value}
                  </Text>
                  <Text className="font-poppins-medium text-[12px] text-[#86837C] ml-1">
                    {data.spo2.unit}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Row 2: AQI & Temperature */}
            <View className="flex-row justify-between mb-3.5">
              {/* Card 3: AQI (Warm Sand #ECE8E1) */}
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => setActiveDetailMetric("aqi")}
                className="flex-1 bg-[#ECE8E1] rounded-[26px] p-4 mr-2 justify-between"
                style={styles.cardShadow}
              >
                <View className="flex-row items-center mb-1">
                  <View className="w-7 h-7 rounded-full bg-white items-center justify-center mr-2 shadow-xs">
                    <CloudIcon size={15} color="#161616" />
                  </View>
                  <Text className="font-poppins-semibold text-[13px] text-[#161616]">
                    AQI
                  </Text>
                </View>

                <View className="my-1.5">
                  <SmoothTrendWaveChart
                    values={data.aqi.history}
                    height={42}
                    strokeColor="#161616"
                    strokeWidth={2.2}
                  />
                </View>

                <View className="flex-row items-baseline mt-1">
                  <Text className="font-poppins-bold text-[24px] text-[#161616] leading-none">
                    {data.aqi.value}
                  </Text>
                  <Text className="font-poppins-medium text-[12px] text-[#86837C] ml-1.5">
                    {data.aqi.statusLabel}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Card 4: Temperature (Vibrant Lime #D2EE4D) */}
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => setActiveDetailMetric("temperature")}
                className="flex-1 bg-[#D2EE4D] rounded-[26px] p-4 ml-2 justify-between"
                style={styles.cardShadow}
              >
                <View className="flex-row items-center mb-1">
                  <View className="w-7 h-7 rounded-full bg-white items-center justify-center mr-2 shadow-xs">
                    <ThermometerIcon size={15} color="#161616" />
                  </View>
                  <Text className="font-poppins-semibold text-[13px] text-[#161616]">
                    Temperature
                  </Text>
                </View>

                <View className="my-1.5">
                  <SmoothTrendWaveChart
                    values={data.temperature.history}
                    height={42}
                    strokeColor="#161616"
                    strokeWidth={2.2}
                    showDots={true}
                  />
                </View>

                <View className="flex-row items-baseline mt-1">
                  <Text className="font-poppins-bold text-[24px] text-[#161616] leading-none">
                    {data.temperature.value}
                  </Text>
                  <Text className="font-poppins-semibold text-[12px] text-[#3E4A10] ml-1">
                    {data.temperature.unit}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Row 3: Moisture & Step Activity */}
            <View className="flex-row justify-between">
              {/* Card 5: Moisture (Vibrant Lime #D2EE4D) */}
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => setActiveDetailMetric("moisture")}
                className="flex-1 bg-[#D2EE4D] rounded-[26px] p-4 mr-2 justify-between"
                style={styles.cardShadow}
              >
                <View className="flex-row items-center mb-1">
                  <View className="w-7 h-7 rounded-full bg-white items-center justify-center mr-2 shadow-xs">
                    <MoistureIcon size={15} color="#161616" />
                  </View>
                  <Text className="font-poppins-semibold text-[13px] text-[#161616]">
                    Moisture
                  </Text>
                </View>

                <View className="my-1.5">
                  <SmoothTrendWaveChart
                    values={data.moisture.history}
                    height={42}
                    strokeColor="#161616"
                    strokeWidth={2.2}
                  />
                </View>

                <View className="flex-row items-baseline mt-1">
                  <Text className="font-poppins-bold text-[24px] text-[#161616] leading-none">
                    {data.moisture.value}{data.moisture.unit}
                  </Text>
                  <Text className="font-poppins-semibold text-[11px] text-[#3E4A10] ml-1.5">
                    {data.moisture.statusLabel}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Card 6: Step Activity (Warm Sand #ECE8E1) */}
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => setActiveDetailMetric("activity")}
                className="flex-1 bg-[#ECE8E1] rounded-[26px] p-4 ml-2 justify-between"
                style={styles.cardShadow}
              >
                <View className="flex-row items-center mb-1">
                  <View className="w-7 h-7 rounded-full bg-white items-center justify-center mr-2 shadow-xs">
                    <WalkingPersonIcon size={15} color="#161616" />
                  </View>
                  <Text className="font-poppins-semibold text-[13px] text-[#161616]">
                    Activity
                  </Text>
                </View>

                <View className="my-1.5">
                  <PillBarChart
                    bars={data.activity.weeklyBars}
                    height={44}
                    trackColor="#DDD9D1"
                    fillColor="#161616"
                  />
                </View>

                <View className="flex-row items-baseline mt-1">
                  <Text className="font-poppins-bold text-[22px] text-[#161616] leading-none">
                    {data.activity.steps.toLocaleString()}
                  </Text>
                  <Text className="font-poppins-medium text-[12px] text-[#86837C] ml-1.5">
                    {data.activity.unit}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Full Screen Metric Detail Modal */}
      <MetricDetailModal
        visible={activeDetailMetric !== null}
        metricType={activeDetailMetric}
        onClose={() => setActiveDetailMetric(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F7F5F0",
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 110, // Generous offset for UniversalNavBar
  },
  cardShadow: {
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
      default: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
    }),
  },
});
