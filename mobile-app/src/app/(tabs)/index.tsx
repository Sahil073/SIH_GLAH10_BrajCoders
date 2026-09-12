import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth, useUser } from "@clerk/expo";
import { useRouter } from "expo-router";

import { useDashboardData } from "@/hooks/useDashboardData";
import { useAiRisk } from "@/store/aiStore";
import { images } from "@/constants/images";
import { MetricDetailModal } from "@/components/dashboard/MetricDetailModal";
import { MetricType } from "@/types/dashboard";
import { useTheme } from "@/store/themeStore";
import { useUserProfile } from "@/store/userProfileStore";

import { StatusOrb, TrafficLightStatus } from "@/components/dashboard/StatusOrb";
import { LiveVitalsGrid } from "@/components/dashboard/LiveVitalsGrid";
import { ESP32StatusCard } from "@/components/dashboard/ESP32StatusCard";
import { RealtimeEcgMonitor } from "@/components/dashboard/RealtimeEcgMonitor";
import { SunIcon, BoltIcon, GlobeIcon } from "@/components/common/AppIcons";
import { useLanguage } from "@/i18n/languages";
import { LanguageSelectorModal } from "@/components/common/LanguageSelectorModal";

export default function HomeScreen() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const { data, isConnected, hasHistoricalData } = useDashboardData();
  const { isDark, colors, toggleTheme } = useTheme();
  const { profile, activeUserId, isOfflineUser } = useUserProfile();
  const ai = useAiRisk();

  // State for active metric detail modal
  const [activeDetailMetric, setActiveDetailMetric] = useState<MetricType | null>(null);

  // Manual Demo Override for Traffic Light state (allows testing Green/Yellow/Red live)
  const [demoStatusOverride, setDemoStatusOverride] = useState<TrafficLightStatus | null>(null);

  // Toggle for collapsible advanced telemetry section
  const [showAdvancedTelemetry, setShowAdvancedTelemetry] = useState(false);

  // Multi-language localization hook and modal state
  const { t } = useLanguage();
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);

  // Derive Traffic Light Status according to AGENTS.md §4.2 specifications:
  // - Green: Normal / Safe
  // - Yellow: Elevated resting heart rate or thermal caution
  // - Red: Cardiac anomaly, fall detection, or high-risk distress
  const currentStatus: TrafficLightStatus = useMemo(() => {
    if (demoStatusOverride) return demoStatusOverride;

    const isRed =
      ai.risks.cardiac.level === "RISK" ||
      ai.risks.heat.level === "RISK" ||
      ai.risks.fall.detected ||
      ai.sosRecommended ||
      data.heartRate.value > 125;

    if (isRed) return "red";

    const isYellow =
      ai.risks.cardiac.level === "CAUTION" ||
      ai.risks.heat.level === "CAUTION" ||
      data.heartRate.value > 98 ||
      data.temperature.value > 37.8;

    if (isYellow) return "yellow";

    return "green";
  }, [demoStatusOverride, ai, data.heartRate.value, data.temperature.value]);

  const displayName =
    user?.fullName ||
    profile.name ||
    (isOfflineUser ? "Offline Worker" : activeUserId.split("@")[0]);

  // Current day & date
  const now = new Date();
  const dayNumber = now.getDate();
  const dayName = now.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
  const monthName = now.toLocaleDateString("en-US", { month: "short" });

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.mainWrapper}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* HEADER: Identity, Status Indicator, Privacy & Theme Toggle */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push("/(tabs)/profile")}
              style={styles.profileRow}
            >
              <View
                style={[
                  styles.avatarWrapper,
                  { borderColor: colors.cardBorder, backgroundColor: colors.cardBg },
                ]}
              >
                {user?.imageUrl ? (
                  <Image source={{ uri: user.imageUrl }} style={styles.avatarImg} />
                ) : (
                  <Image
                    source={images.mascotLogo}
                    style={styles.mascotImg}
                    resizeMode="contain"
                  />
                )}
              </View>

              <View style={styles.userInfo}>
                <Text
                  style={[styles.greetingText, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {t("hello")}, {displayName}
                </Text>

                {/* Persistent Working Offline / Connected Indicator (Feature 4 - AGENTS.md §4.2) */}
                <View style={styles.connectionBadge}>
                  <View
                    style={[
                      styles.connectionDot,
                      { backgroundColor: isConnected ? "#16A34A" : "#D97706" },
                    ]}
                  />
                  <Text
                    style={[
                      styles.connectionText,
                      { color: isConnected ? "#15803D" : "#B45309" },
                    ]}
                  >
                    {isConnected ? t("connectedBle") : t("workingOffline")}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Date Pill, Language Selector & Theme Switcher */}
            <View style={styles.headerActions}>
              <View
                style={[
                  styles.datePill,
                  { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
                ]}
              >
                <Text style={[styles.dateDay, { color: colors.textPrimary }]}>
                  {dayNumber}
                </Text>
                <Text style={[styles.dateMonth, { color: colors.textMuted }]}>
                  {monthName}
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => setIsLanguageModalOpen(true)}
                style={[
                  styles.themeButton,
                  { backgroundColor: colors.cardBg, borderColor: colors.cardBorder, marginRight: 8 },
                ]}
              >
                <GlobeIcon size={18} color="#16A34A" />
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.75}
                onPress={toggleTheme}
                style={[
                  styles.themeButton,
                  { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
                ]}
              >
                <SunIcon size={18} color="#F59E0B" />
              </TouchableOpacity>
            </View>
          </View>

          {/* ESP32 Wearable Device Card with Connect / Disconnect Button */}
          <ESP32StatusCard hasHistoricalData={hasHistoricalData} />

          {/* TOP STATUS WINDOW (Showing strictly the active state: Normal, Caution, or Risk) */}
          <StatusOrb
            status={currentStatus}
            onPress={() => router.push("/(tabs)/wellness" as any)}
          />

          {/* ITEM 3: DISASTER ALERT BANNER (Auto-activating / one-tap disaster plan) */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push("/disaster-modes" as any)}
            style={styles.disasterBanner}
          >
            <View style={styles.disasterBannerLeft}>
              <View style={styles.disasterBannerIcon}>
                <SunIcon size={18} color="#D97706" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.disasterBannerTitle}>{t("heatWaveTitle")}</Text>
                <Text style={styles.disasterBannerSub}>{t("heatWaveSub")}</Text>
              </View>
            </View>
            <Text style={styles.disasterArrow}>›</Text>
          </TouchableOpacity>

          {/* FEATURE 3: LIVE VITAL READINGS (HR, Moisture, Temperature, AQI) */}
          <LiveVitalsGrid
            heartRate={data.heartRate.value}
            moisture={data.moisture.value}
            temperature={data.temperature.value}
            aqi={data.aqi.value}
            isConnected={isConnected}
            onSelectMetric={(metric) => setActiveDetailMetric(metric)}
          />

          {/* Collapsible Section: Advanced Wearable Telemetry & ECG Oscilloscope */}
          <View style={styles.collapsibleContainer}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowAdvancedTelemetry((prev) => !prev)}
              style={[
                styles.collapsibleHeader,
                { borderColor: colors.cardBorder, backgroundColor: colors.cardBg },
              ]}
            >
              <View style={styles.collapsibleTitleRow}>
                <View style={{ marginRight: 8 }}>
                  <BoltIcon size={14} color="#D97706" />
                </View>
                <Text
                  style={[styles.collapsibleTitle, { color: colors.textPrimary }]}
                >
                  {t("oscilloscopeTitle")}
                </Text>
              </View>
              <Text style={[styles.collapsibleToggleText, { color: colors.textMuted }]}>
                {showAdvancedTelemetry ? t("hide") : t("show")}
              </Text>
            </TouchableOpacity>

            {showAdvancedTelemetry && (
              <View style={styles.advancedContent}>
                {/* Real-time 500 Hz ECG Oscilloscope Monitor */}
                <RealtimeEcgMonitor />
              </View>
            )}
          </View>
        </ScrollView>
      </View>

      {/* Metric Detail Modal */}
      {activeDetailMetric && (
        <MetricDetailModal
          visible={true}
          metricType={activeDetailMetric}
          onClose={() => setActiveDetailMetric(null)}
        />
      )}

      {/* Language Selection Modal */}
      <LanguageSelectorModal
        visible={isLanguageModalOpen}
        onClose={() => setIsLanguageModalOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  mainWrapper: {
    flex: 1,
    position: "relative",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 120, // Extra space so bottom tab nav and floating SOS don't overlap
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  avatarWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginRight: 10,
  },
  avatarImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  mascotImg: {
    width: 30,
    height: 30,
  },
  userInfo: {
    flex: 1,
  },
  greetingText: {
    fontFamily: "Poppins-Bold",
    fontSize: 15,
    lineHeight: 20,
  },
  connectionBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  connectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  connectionText: {
    fontFamily: "Poppins-Medium",
    fontSize: 11,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  datePill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    marginRight: 8,
  },
  dateDay: {
    fontFamily: "Poppins-Bold",
    fontSize: 13,
    lineHeight: 15,
  },
  dateMonth: {
    fontFamily: "Poppins-Medium",
    fontSize: 9,
    textTransform: "uppercase",
  },
  themeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  themeIcon: {
    fontSize: 15,
  },
  collapsibleContainer: {
    width: "100%",
    marginTop: 4,
  },
  collapsibleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  collapsibleTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  collapsibleIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  collapsibleTitle: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 13,
  },
  collapsibleToggleText: {
    fontFamily: "Poppins-Medium",
    fontSize: 12,
  },
  advancedContent: {
    marginTop: 12,
  },
  disasterBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFBEB",
    borderWidth: 1.2,
    borderColor: "#FDE68A",
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginBottom: 16,
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 2,
  },
  disasterBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  disasterBannerIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  disasterBannerTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: 13.5,
    color: "#92400E",
  },
  disasterBannerSub: {
    fontFamily: "Poppins-Medium",
    fontSize: 11.5,
    color: "#B45309",
    marginTop: 1,
  },
  disasterArrow: {
    fontSize: 20,
    fontFamily: "Poppins-Bold",
    color: "#B45309",
    marginLeft: 6,
  },
});
