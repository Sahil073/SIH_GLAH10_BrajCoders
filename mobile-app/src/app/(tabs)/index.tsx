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
import { AIRiskBanner } from "@/components/dashboard/AIRiskBanner";
import { ESP32StatusCard } from "@/components/dashboard/ESP32StatusCard";
import { MetricType } from "@/types/dashboard";

import { useTheme } from "@/store/themeStore";
import { useUserProfile } from "@/store/userProfileStore";

export default function HomeScreen() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const { data, isConnected, hasHistoricalData } = useDashboardData();
  const { isDark, colors, toggleTheme } = useTheme();
  const { profile, activeUserId, isOfflineUser } = useUserProfile();

  const [statusDetailsOpen, setStatusDetailsOpen] = useState<boolean>(false);
  const [activeDetailMetric, setActiveDetailMetric] = useState<MetricType | null>(null);

  // Dynamic current day & date
  const now = new Date();
  const dayNumber = now.getDate();
  const dayName = now.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();

  const displayName =
    user?.fullName ||
    profile.name ||
    (isOfflineUser ? "Offline Worker" : activeUserId.split("@")[0]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header Row: User Avatar, Account Identity & Theme Toggle */}
        <View className="flex-row items-center justify-between px-6 pt-2 pb-4">
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push("/(tabs)/profile")}
            className="flex-row items-center flex-1 mr-3"
          >
            <View
              style={{ borderColor: colors.cardBorder, backgroundColor: colors.cardBg }}
              className="w-11 h-11 rounded-full overflow-hidden border items-center justify-center mr-3"
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
            </View>
            <View className="flex-1">
              <Text
                style={{ color: colors.textPrimary }}
                className="font-poppins-bold text-sm leading-tight"
                numberOfLines={1}
              >
                {displayName}
              </Text>
              <View className="flex-row items-center mt-0.5">
                <View
                  className={`w-1.5 h-1.5 rounded-full mr-1 ${
                    isOfflineUser ? "bg-amber-500" : "bg-emerald-500"
                  }`}
                />
                <Text
                  style={{ color: colors.textSecondary }}
                  className="font-poppins-medium text-[10.5px]"
                  numberOfLines={1}
                >
                  {isOfflineUser ? "Offline Phone Data" : activeUserId}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Theme Toggle Button (☀️ / 🌙) */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={toggleTheme}
            style={{
              backgroundColor: colors.cardBg,
              borderColor: colors.cardBorder,
            }}
            className="w-10 h-10 rounded-full border items-center justify-center shadow-xs"
          >
            <Text className="text-base">{isDark ? "☀️" : "🌙"}</Text>
          </TouchableOpacity>
        </View>

        {/* Health Overview Title & Live Day / Date Widget */}
        <View className="flex-row items-start justify-between px-6 mb-5">
          <View>
            <Text
              style={{ color: colors.textPrimary }}
              className="font-poppins-bold text-[33px] leading-[38px]"
            >
              Health
            </Text>
            <Text
              style={{ color: colors.textPrimary }}
              className="font-poppins-bold text-[33px] leading-[38px]"
            >
              overview
            </Text>
          </View>

          {/* Live Day & Date Pill */}
          <View
            style={{ backgroundColor: colors.cardBg, borderColor: colors.cardBorder }}
            className="rounded-2xl p-1 border"
          >
            <View
              style={{ backgroundColor: colors.backgroundSecondary }}
              className="rounded-xl px-3.5 py-2 items-center justify-center min-w-[54px] shadow-xs"
            >
              <Text
                style={{ color: colors.textPrimary }}
                className="font-poppins-bold text-[18px] leading-none"
              >
                {dayNumber}
              </Text>
              <Text
                style={{ color: colors.textMuted }}
                className="font-poppins-bold text-[9.5px] tracking-wider mt-1"
              >
                {dayName}
              </Text>
            </View>
          </View>
        </View>

        {/* Real-Time On-Device AI Risk Assessment & Emergency SOS Banner */}
        <AIRiskBanner />

        {/* ESP32 Bluetooth Low Energy Connection Status & Telemetry Card */}
        <ESP32StatusCard hasHistoricalData={hasHistoricalData} />

        {/* Section: Overall Status (Interactive Modern Card matching design) */}
        <View className="px-6 mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text
              style={{ color: colors.textPrimary }}
              className="font-poppins-bold text-[17px]"
            >
              Overall Status
            </Text>
            <View
              className={`flex-row items-center px-2.5 py-1 rounded-full border ${
                isConnected
                  ? "bg-[#EBF5EE] border-[#D5EBDE]"
                  : hasHistoricalData
                  ? "bg-[#FEF3C7] border-[#FDE68A]"
                  : "bg-[#F3F4F6] border-[#E5E7EB]"
              }`}
            >
              <View
                className={`w-2 h-2 rounded-full mr-1.5 ${
                  isConnected
                    ? "bg-[#16A34A]"
                    : hasHistoricalData
                    ? "bg-[#D97706]"
                    : "bg-[#9CA3AF]"
                }`}
              />
              <Text
                className={`font-poppins-semibold text-[11px] ${
                  isConnected
                    ? "text-[#16A34A]"
                    : hasHistoricalData
                    ? "text-[#B45309]"
                    : "text-[#6B7280]"
                }`}
              >
                {isConnected
                  ? "Optimal"
                  : hasHistoricalData
                  ? "Offline Avg"
                  : "Standby"}
              </Text>
            </View>
          </View>

          {/* Interactive Overall Status Card with vibrant modern styling */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => setStatusDetailsOpen((prev) => !prev)}
            className="rounded-[26px] p-5 border"
            style={[
              styles.cardShadow,
              {
                backgroundColor: colors.statusOptimalBg,
                borderColor: colors.statusOptimalBorder,
              },
            ]}
          >
            <View className="flex-row items-center">
              {/* Vibrant Shield Check Icon Badge Container */}
              <View
                style={{
                  backgroundColor: colors.backgroundSecondary,
                  borderColor: colors.statusOptimalBorder,
                }}
                className="w-14 h-14 rounded-2xl items-center justify-center mr-4 border shadow-xs"
              >
                <ShieldCheckIcon size={40} />
              </View>

              {/* Status Content */}
              <View className="flex-1">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Text
                      style={{ color: colors.statusOptimalText }}
                      className="font-poppins-bold text-[20px] tracking-wide leading-tight"
                    >
                      {data.overallStatus.title}
                    </Text>
                    <View
                      className={`ml-2 px-2 py-0.5 rounded-full border ${
                        isConnected
                          ? "bg-[#DCFCE7] border-[#BBF7D0]"
                          : hasHistoricalData
                          ? "bg-[#FEF9C3] border-[#FEF08A]"
                          : "bg-[#F3F4F6] border-[#E5E7EB]"
                      }`}
                    >
                      <Text
                        className={`font-poppins-semibold text-[10px] ${
                          isConnected
                            ? "text-[#15803D]"
                            : hasHistoricalData
                            ? "text-[#A16207]"
                            : "text-[#6B7280]"
                        }`}
                      >
                        {isConnected
                          ? "● Stable"
                          : hasHistoricalData
                          ? "● SQLite"
                          : "○ Offline"}
                      </Text>
                    </View>
                  </View>
                  <View
                    style={{
                      backgroundColor: colors.backgroundSecondary,
                      borderColor: colors.statusOptimalBorder,
                    }}
                    className="px-2 py-0.5 rounded-full border"
                  >
                    <Text
                      style={{ color: colors.statusOptimalText }}
                      className="font-poppins-medium text-[10.5px]"
                    >
                      {statusDetailsOpen ? "Hide ▲" : "Info ▼"}
                    </Text>
                  </View>
                </View>
                <Text
                  style={{ color: colors.statusOptimalText }}
                  className="font-poppins-semibold text-[14px] mt-1"
                >
                  {data.overallStatus.subtitle}
                </Text>
                <Text
                  style={{ color: colors.textSecondary }}
                  className="font-poppins-regular text-[12.5px] mt-0.5 leading-snug"
                >
                  {data.overallStatus.description}
                </Text>
              </View>
            </View>

            {/* Interactive Expanded Diagnostic Breakdown with Colorful Badges */}
            {statusDetailsOpen && (
              <View
                style={{ borderColor: colors.statusOptimalBorder }}
                className="mt-4 pt-3.5 border-t"
              >
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center">
                    <View className="w-6 h-6 rounded-full bg-[#DCFCE7] items-center justify-center mr-2">
                      <Text className="text-[11px]">⚡</Text>
                    </View>
                    <Text
                      style={{ color: colors.textPrimary }}
                      className="font-poppins-medium text-[12.5px]"
                    >
                      On-Device AI Detection
                    </Text>
                  </View>
                  <View className="bg-[#DCFCE7] px-2.5 py-0.5 rounded-full border border-[#BBF7D0]">
                    <Text className="font-poppins-semibold text-[10.5px] text-[#15803D]">
                      DSP Engine Active
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center">
                    <View className="w-6 h-6 rounded-full bg-[#E0F2FE] items-center justify-center mr-2">
                      <Text className="text-[11px]">👕</Text>
                    </View>
                    <Text
                      style={{ color: colors.textPrimary }}
                      className="font-poppins-medium text-[12.5px]"
                    >
                      BLE Wearable T-Shirt
                    </Text>
                  </View>
                  <View
                    className={`px-2.5 py-0.5 rounded-full border ${
                      isConnected
                        ? "bg-[#E0F2FE] border-[#BAE6FD]"
                        : "bg-[#F3F4F6] border-[#E5E7EB]"
                    }`}
                  >
                    <Text
                      className={`font-poppins-semibold text-[10.5px] ${
                        isConnected ? "text-[#0284C7]" : "text-[#6B7280]"
                      }`}
                    >
                      {isConnected ? "Connected • Synced" : "Disconnected"}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <View className="w-6 h-6 rounded-full bg-[#F3E8FF] items-center justify-center mr-2">
                      <Text className="text-[11px]">🛡️</Text>
                    </View>
                    <Text
                      style={{ color: colors.textPrimary }}
                      className="font-poppins-medium text-[12.5px]"
                    >
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
            <Text
              style={{ color: colors.textPrimary }}
              className="font-poppins-bold text-[16px]"
            >
              My health
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push("/(tabs)/history")}
            >
              <Text
                style={{ color: colors.textMuted }}
                className="font-poppins-medium text-[12px]"
              >
                View all ›
              </Text>
            </TouchableOpacity>
          </View>

          {/* 6 Cards Grid (2x3) */}
          <View className="space-y-3.5">
            {/* Row 1: Heart Rate & SpO2 */}
            <View className="flex-row justify-between mb-3.5">
              {/* Card 1: Heart Rate (Vibrant Lime) */}
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => setActiveDetailMetric("heart_rate")}
                className="flex-1 rounded-[26px] p-4 mr-2 justify-between"
                style={[styles.cardShadow, { backgroundColor: colors.limeCard }]}
              >
                <View className="flex-row items-center mb-1 justify-between">
                  <View className="flex-row items-center">
                    <View
                      style={{
                        backgroundColor: isDark ? "rgba(0,0,0,0.18)" : "#FFFFFF",
                      }}
                      className="w-7 h-7 rounded-full items-center justify-center mr-2 shadow-xs"
                    >
                      <HeartPulseIcon size={15} color={colors.limeCardText} />
                    </View>
                    <Text
                      style={{ color: colors.limeCardText }}
                      className="font-poppins-semibold text-[13px]"
                    >
                      Heart rate
                    </Text>
                  </View>
                  {!isConnected && hasHistoricalData && (
                    <Text
                      style={{
                        color: colors.limeCardSub,
                        backgroundColor: isDark ? "rgba(0,0,0,0.2)" : "#C5E138",
                      }}
                      className="font-poppins-medium text-[9px] px-1.5 py-0.5 rounded-md"
                    >
                      Past Avg
                    </Text>
                  )}
                </View>

                <View className="my-1.5">
                  <PulseWaveChart
                    values={data.heartRate.history.map((h) => h.value)}
                    height={42}
                    strokeColor={colors.limeCardText}
                  />
                </View>

                <View className="flex-row items-baseline mt-1">
                  <Text
                    style={{ color: colors.limeCardText }}
                    className="font-poppins-bold text-[24px] leading-none"
                  >
                    {data.heartRate.value > 0 ? data.heartRate.value : "--"}
                  </Text>
                  <Text
                    style={{ color: colors.limeCardSub }}
                    className="font-poppins-semibold text-[11px] ml-1.5 uppercase"
                  >
                    {data.heartRate.unit}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Card 2: SpO2 (Warm Sand) */}
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => setActiveDetailMetric("spo2")}
                className="flex-1 rounded-[26px] p-4 ml-2 justify-between border"
                style={[
                  styles.cardShadow,
                  {
                    backgroundColor: colors.sandCard,
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                <View className="flex-row items-center mb-1 justify-between">
                  <View className="flex-row items-center">
                    <View
                      style={{ backgroundColor: colors.backgroundSecondary }}
                      className="w-7 h-7 rounded-full items-center justify-center mr-2 shadow-xs"
                    >
                      <DropletIcon size={15} color={colors.sandCardText} />
                    </View>
                    <Text
                      style={{ color: colors.sandCardText }}
                      className="font-poppins-semibold text-[13px]"
                    >
                      SpO₂
                    </Text>
                  </View>
                  {!isConnected && hasHistoricalData && (
                    <Text
                      style={{
                        color: colors.sandCardSub,
                        backgroundColor: colors.backgroundSecondary,
                      }}
                      className="font-poppins-medium text-[9px] px-1.5 py-0.5 rounded-md"
                    >
                      Past Avg
                    </Text>
                  )}
                </View>

                <View className="my-1.5">
                  <DualWaveChart
                    upperValues={data.spo2.history.map((h) => h.value)}
                    lowerValues={data.spo2.history.map((h) => Math.max(0, h.value - 10))}
                    height={42}
                    upperStroke={colors.sandCardText}
                  />
                </View>

                <View className="flex-row items-baseline mt-1">
                  <Text
                    style={{ color: colors.sandCardText }}
                    className="font-poppins-bold text-[24px] leading-none"
                  >
                    {data.spo2.value > 0 ? data.spo2.value : "--"}
                  </Text>
                  <Text
                    style={{ color: colors.sandCardSub }}
                    className="font-poppins-medium text-[12px] ml-1"
                  >
                    {data.spo2.unit}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Row 2: AQI & Temperature */}
            <View className="flex-row justify-between mb-3.5">
              {/* Card 3: AQI (Warm Sand) */}
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => setActiveDetailMetric("aqi")}
                className="flex-1 rounded-[26px] p-4 mr-2 justify-between border"
                style={[
                  styles.cardShadow,
                  {
                    backgroundColor: colors.sandCard,
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                <View className="flex-row items-center mb-1 justify-between">
                  <View className="flex-row items-center">
                    <View
                      style={{ backgroundColor: colors.backgroundSecondary }}
                      className="w-7 h-7 rounded-full items-center justify-center mr-2 shadow-xs"
                    >
                      <CloudIcon size={15} color={colors.sandCardText} />
                    </View>
                    <Text
                      style={{ color: colors.sandCardText }}
                      className="font-poppins-semibold text-[13px]"
                    >
                      AQI
                    </Text>
                  </View>
                  {!isConnected && hasHistoricalData && (
                    <Text
                      style={{
                        color: colors.sandCardSub,
                        backgroundColor: colors.backgroundSecondary,
                      }}
                      className="font-poppins-medium text-[9px] px-1.5 py-0.5 rounded-md"
                    >
                      Past Avg
                    </Text>
                  )}
                </View>

                <View className="my-1.5">
                  <SmoothTrendWaveChart
                    values={data.aqi.history}
                    height={42}
                    strokeColor={colors.sandCardText}
                    strokeWidth={2.2}
                  />
                </View>

                <View className="flex-row items-baseline mt-1">
                  <Text
                    style={{ color: colors.sandCardText }}
                    className="font-poppins-bold text-[24px] leading-none"
                  >
                    {data.aqi.value > 0 ? data.aqi.value : "--"}
                  </Text>
                  <Text
                    style={{ color: colors.sandCardSub }}
                    className="font-poppins-medium text-[12px] ml-1.5"
                  >
                    {data.aqi.statusLabel}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Card 4: Temperature (Vibrant Lime) */}
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => setActiveDetailMetric("temperature")}
                className="flex-1 rounded-[26px] p-4 ml-2 justify-between"
                style={[styles.cardShadow, { backgroundColor: colors.limeCard }]}
              >
                <View className="flex-row items-center mb-1 justify-between">
                  <View className="flex-row items-center">
                    <View
                      style={{
                        backgroundColor: isDark ? "rgba(0,0,0,0.18)" : "#FFFFFF",
                      }}
                      className="w-7 h-7 rounded-full items-center justify-center mr-2 shadow-xs"
                    >
                      <ThermometerIcon size={15} color={colors.limeCardText} />
                    </View>
                    <Text
                      style={{ color: colors.limeCardText }}
                      className="font-poppins-semibold text-[13px]"
                    >
                      Temperature
                    </Text>
                  </View>
                  {!isConnected && hasHistoricalData && (
                    <Text
                      style={{
                        color: colors.limeCardSub,
                        backgroundColor: isDark ? "rgba(0,0,0,0.2)" : "#C5E138",
                      }}
                      className="font-poppins-medium text-[9px] px-1.5 py-0.5 rounded-md"
                    >
                      Past Avg
                    </Text>
                  )}
                </View>

                <View className="my-1.5">
                  <SmoothTrendWaveChart
                    values={data.temperature.history}
                    height={42}
                    strokeColor={colors.limeCardText}
                    strokeWidth={2.2}
                    showDots={data.temperature.history.length >= 3}
                  />
                </View>

                <View className="flex-row items-baseline mt-1">
                  <Text
                    style={{ color: colors.limeCardText }}
                    className="font-poppins-bold text-[24px] leading-none"
                  >
                    {data.temperature.value > 0 ? data.temperature.value : "--"}
                  </Text>
                  <Text
                    style={{ color: colors.limeCardSub }}
                    className="font-poppins-semibold text-[12px] ml-1"
                  >
                    {data.temperature.unit}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Row 3: Moisture & Step Activity */}
            <View className="flex-row justify-between">
              {/* Card 5: Moisture (Vibrant Lime) */}
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => setActiveDetailMetric("moisture")}
                className="flex-1 rounded-[26px] p-4 mr-2 justify-between"
                style={[styles.cardShadow, { backgroundColor: colors.limeCard }]}
              >
                <View className="flex-row items-center mb-1 justify-between">
                  <View className="flex-row items-center">
                    <View
                      style={{
                        backgroundColor: isDark ? "rgba(0,0,0,0.18)" : "#FFFFFF",
                      }}
                      className="w-7 h-7 rounded-full items-center justify-center mr-2 shadow-xs"
                    >
                      <MoistureIcon size={15} color={colors.limeCardText} />
                    </View>
                    <Text
                      style={{ color: colors.limeCardText }}
                      className="font-poppins-semibold text-[13px]"
                    >
                      Moisture
                    </Text>
                  </View>
                  {!isConnected && hasHistoricalData && (
                    <Text
                      style={{
                        color: colors.limeCardSub,
                        backgroundColor: isDark ? "rgba(0,0,0,0.2)" : "#C5E138",
                      }}
                      className="font-poppins-medium text-[9px] px-1.5 py-0.5 rounded-md"
                    >
                      Past Avg
                    </Text>
                  )}
                </View>

                <View className="my-1.5">
                  <SmoothTrendWaveChart
                    values={data.moisture.history}
                    height={42}
                    strokeColor={colors.limeCardText}
                    strokeWidth={2.2}
                  />
                </View>

                <View className="flex-row items-baseline mt-1">
                  <Text
                    style={{ color: colors.limeCardText }}
                    className="font-poppins-bold text-[24px] leading-none"
                  >
                    {data.moisture.value > 0 ? `${data.moisture.value}${data.moisture.unit}` : "--"}
                  </Text>
                  <Text
                    style={{ color: colors.limeCardSub }}
                    className="font-poppins-semibold text-[11px] ml-1.5"
                  >
                    {data.moisture.statusLabel}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Card 6: Step Activity (Warm Sand) */}
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => setActiveDetailMetric("activity")}
                className="flex-1 rounded-[26px] p-4 ml-2 justify-between border"
                style={[
                  styles.cardShadow,
                  {
                    backgroundColor: colors.sandCard,
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                <View className="flex-row items-center mb-1 justify-between">
                  <View className="flex-row items-center">
                    <View
                      style={{ backgroundColor: colors.backgroundSecondary }}
                      className="w-7 h-7 rounded-full items-center justify-center mr-2 shadow-xs"
                    >
                      <WalkingPersonIcon size={15} color={colors.sandCardText} />
                    </View>
                    <Text
                      style={{ color: colors.sandCardText }}
                      className="font-poppins-semibold text-[13px]"
                    >
                      Activity
                    </Text>
                  </View>
                  {!isConnected && hasHistoricalData && (
                    <Text
                      style={{
                        color: colors.sandCardSub,
                        backgroundColor: colors.backgroundSecondary,
                      }}
                      className="font-poppins-medium text-[9px] px-1.5 py-0.5 rounded-md"
                    >
                      Past Avg
                    </Text>
                  )}
                </View>

                <View className="my-1.5">
                  <PillBarChart
                    bars={data.activity.weeklyBars}
                    height={44}
                    trackColor={isDark ? "#2A3630" : "#DDD9D1"}
                    fillColor={colors.sandCardText}
                  />
                </View>

                <View className="flex-row items-baseline mt-1">
                  <Text
                    style={{ color: colors.sandCardText }}
                    className="font-poppins-bold text-[22px] leading-none"
                  >
                    {data.activity.steps > 0 ? data.activity.steps.toLocaleString() : "--"}
                  </Text>
                  <Text
                    style={{ color: colors.sandCardSub }}
                    className="font-poppins-medium text-[12px] ml-1.5"
                  >
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
