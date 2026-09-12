import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import Svg, { Path, Circle } from "react-native-svg";
import { useTheme } from "@/store/themeStore";
import { useDashboardData } from "@/hooks/useDashboardData";
import {
  SunIcon,
  WindIcon,
  WavesIcon,
  LungsIcon,
  ShieldIcon,
  ClockIcon,
} from "@/components/common/AppIcons";

type DisasterTab = "heat" | "aqi" | "flood";

export default function DisasterModesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const initialTab = (params.mode as DisasterTab) || "heat";
  const [activeTab, setActiveTab] = useState<DisasterTab>(initialTab);
  const { colors, isDark } = useTheme();
  const { data } = useDashboardData();

  const tempVal = data.temperature.value > 0 ? Math.round(data.temperature.value) : 34;
  const aqiVal = data.aqi.value > 0 ? Math.round(data.aqi.value) : 165;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: "#F7FAF8" }]}>
      {/* Top Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d="M15 18L9 12L15 6"
              stroke="#161616"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTag}>DISASTER RESILIENCE</Text>
          <Text style={styles.headerTitle}>Disaster-Specific Modes</Text>
        </View>

        <View style={{ width: 40 }} />
      </View>

      {/* Tab Switcher (Heat Wave, Air Quality, Flood / Cyclone) */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveTab("heat")}
          style={[
            styles.tabItem,
            activeTab === "heat" && styles.tabItemActiveHeat,
          ]}
        >
          <View style={{ marginBottom: 2 }}>
            <SunIcon size={16} color={activeTab === "heat" ? "#D97706" : "#78716C"} />
          </View>
          <Text
            style={[
              styles.tabText,
              activeTab === "heat" && styles.tabTextActive,
            ]}
          >
            Heat Wave
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveTab("aqi")}
          style={[
            styles.tabItem,
            activeTab === "aqi" && styles.tabItemActiveAqi,
          ]}
        >
          <View style={{ marginBottom: 2 }}>
            <WindIcon size={16} color={activeTab === "aqi" ? "#4F46E5" : "#78716C"} />
          </View>
          <Text
            style={[
              styles.tabText,
              activeTab === "aqi" && styles.tabTextActive,
            ]}
          >
            Air Quality
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveTab("flood")}
          style={[
            styles.tabItem,
            activeTab === "flood" && styles.tabItemActiveFlood,
          ]}
        >
          <View style={{ marginBottom: 2 }}>
            <WavesIcon size={16} color={activeTab === "flood" ? "#0284C7" : "#78716C"} />
          </View>
          <Text
            style={[
              styles.tabText,
              activeTab === "flood" && styles.tabTextActive,
            ]}
          >
            Flood/Cyclone
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* TAB 1: HEAT WAVE MODE (AGENTS.md §4.3) */}
        {activeTab === "heat" && (
          <View>
            {/* Active Alert Banner */}
            <View style={styles.heatAlertCard}>
              <View style={styles.alertHeaderRow}>
                <View style={styles.heatIconBadge}>
                  <SunIcon size={20} color="#D97706" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.heatAlertTitle}>Heat Wave Alert Active</Text>
                  <Text style={styles.heatAlertSub}>
                    Extreme heat index of {tempVal + 6}°C predicted today
                  </Text>
                </View>
              </View>
            </View>

            {/* Daily Work Schedule Plan (Actionable transformation for outdoor labor) */}
            <View style={styles.sectionCard}>
              <Text style={styles.cardHeader}>Best Hours to Work Outside Today</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginVertical: 6 }}>
                <ClockIcon size={16} color="#059669" />
                <Text style={styles.scheduleText}>
                  Before 10:00 AM • After 5:00 PM
                </Text>
              </View>
              <Text style={styles.scheduleNote}>
                Peak sun exposure hours (11:30 AM – 4:00 PM) carry extreme risk of heat exhaustion and cardiac strain.
              </Text>

              {/* Hours timeline visual */}
              <View style={styles.timelineRow}>
                <View style={[styles.timeChip, { backgroundColor: "#DCFCE7", borderColor: "#86EFAC" }]}>
                  <Text style={[styles.timeChipLabel, { color: "#166534" }]}>6am - 10am</Text>
                  <Text style={[styles.timeChipStatus, { color: "#15803D" }]}>Safe Work</Text>
                </View>
                <View style={[styles.timeChip, { backgroundColor: "#FEE2E2", borderColor: "#FCA5A5" }]}>
                  <Text style={[styles.timeChipLabel, { color: "#991B1B" }]}>11am - 4pm</Text>
                  <Text style={[styles.timeChipStatus, { color: "#DC2626" }]}>Stay Shaded</Text>
                </View>
                <View style={[styles.timeChip, { backgroundColor: "#DCFCE7", borderColor: "#86EFAC" }]}>
                  <Text style={[styles.timeChipLabel, { color: "#166534" }]}>After 5pm</Text>
                  <Text style={[styles.timeChipStatus, { color: "#15803D" }]}>Safe Work</Text>
                </View>
              </View>
            </View>

            {/* "What to Do" Action Card (AGENTS.md §4.3) */}
            <View style={styles.actionCard}>
              <View style={styles.actionHeaderRow}>
                <ShieldIcon size={20} color="#15803D" />
                <Text style={[styles.actionCardTitle, { marginLeft: 8 }]}>Heat Wave: What to Do</Text>
              </View>

              <View style={styles.bulletItem}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>
                  <Text style={styles.boldText}>Drink ORS / Salt-Water:</Text> Drink at least 500ml of water with a pinch of salt or ORS every 90 minutes.
                </Text>
              </View>

              <View style={styles.bulletItem}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>
                  <Text style={styles.boldText}>Watch Warning Signs:</Text> Muscle cramps, dizziness, or lack of sweating mean immediate heat exhaustion.
                </Text>
              </View>

              <View style={styles.bulletItem}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>
                  <Text style={styles.boldText}>Immediate First Step:</Text> Move to shade, loosen clothing, and apply wet cloth to the neck and forehead.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* TAB 2: AIR QUALITY MODE (AGENTS.md §4.3) */}
        {activeTab === "aqi" && (
          <View>
            <View style={styles.aqiAlertCard}>
              <View style={styles.alertHeaderRow}>
                <View style={styles.aqiIconBadge}>
                  <WindIcon size={20} color="#4F46E5" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.aqiAlertTitle}>Air Quality Advisory Active</Text>
                  <Text style={styles.aqiAlertSub}>
                    Current AQI: {aqiVal} (Unhealthy for Sensitive Groups)
                  </Text>
                </View>
              </View>
            </View>

            {/* Best / Worst Hours for Outdoor Exposure */}
            <View style={styles.sectionCard}>
              <Text style={styles.cardHeader}>Outdoor Exposure Windows</Text>
              <Text style={styles.scheduleText}>
                🏃 Best hours for outside walking: 1:00 PM – 4:00 PM
              </Text>
              <Text style={styles.scheduleNote}>
                Early morning temperature inversion traps toxic particulate matter (PM2.5) near ground level. Avoid morning runs.
              </Text>
            </View>

            {/* Action Card */}
            <View style={styles.actionCard}>
              <View style={styles.actionHeaderRow}>
                <View style={{ marginRight: 8 }}>
                  <LungsIcon size={18} color="#4F46E5" />
                </View>
                <Text style={styles.actionCardTitle}>Air Quality: What to Do</Text>
              </View>

              <View style={styles.bulletItem}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>
                  <Text style={styles.boldText}>Wear a Mask Outdoors:</Text> Use an N95 or clean multi-layer cloth mask if working near traffic or dust.
                </Text>
              </View>

              <View style={styles.bulletItem}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>
                  <Text style={styles.boldText}>Asthma / Chronic Care:</Text> Keep prescribed rescue inhaler accessible; wear your Sanjeevni sensor.
                </Text>
              </View>

              <View style={styles.bulletItem}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>
                  <Text style={styles.boldText}>Ventilate In Midday:</Text> Open windows between 12 PM – 3 PM when solar mixing dilutes stagnant smoke.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* TAB 3: FLOOD / CYCLONE ADVISORY (AGENTS.md §4.3) */}
        {activeTab === "flood" && (
          <View>
            <View style={styles.floodAlertCard}>
              <View style={styles.alertHeaderRow}>
                <View style={styles.floodIconBadge}>
                  <WavesIcon size={20} color="#0284C7" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.floodAlertTitle}>IMD / NDMA Flood Advisory</Text>
                  <Text style={styles.floodAlertSub}>
                    District Flash Flood Warning • Lowland Inundation
                  </Text>
                </View>
              </View>
            </View>

            {/* Personalized Note for Vulnerable Users */}
            <View style={styles.vulnerableCard}>
              <Text style={styles.vulnerableTitle}>Personal Care Note</Text>
              <Text style={styles.vulnerableText}>
                A flood alert is active in your district. If you have chronic conditions, keep your emergency contact informed of your shelter location today.
              </Text>
            </View>

            {/* Action Card */}
            <View style={styles.actionCard}>
              <View style={styles.actionHeaderRow}>
                <View style={{ marginRight: 8 }}>
                  <ShieldIcon size={18} color="#DC2626" />
                </View>
                <Text style={styles.actionCardTitle}>Flood Safety: What to Do</Text>
              </View>

              <View style={styles.bulletItem}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>
                  <Text style={styles.boldText}>Boil All Drinking Water:</Text> Flood runoff contaminates municipal and borewell water. Boil for 5 minutes.
                </Text>
              </View>

              <View style={styles.bulletItem}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>
                  <Text style={styles.boldText}>Avoid Flood Currents:</Text> 6 inches of moving water can knock an adult off their feet; avoid walking through drains.
                </Text>
              </View>

              <View style={styles.bulletItem}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>
                  <Text style={styles.boldText}>Keep Phone & Medic Bag Elevated:</Text> Seal vital medications, identity cards, and phone in plastic ziplocks.
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EAE6DE",
    backgroundColor: "#FFFFFF",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F4F1EA",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleWrap: {
    alignItems: "center",
  },
  headerTag: {
    fontFamily: "Poppins-Bold",
    fontSize: 10,
    letterSpacing: 1,
    color: "#214332",
  },
  headerTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: 16,
    color: "#161616",
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EAE6DE",
  },
  tabItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 14,
    marginHorizontal: 3,
    backgroundColor: "#F7F5F0",
    borderWidth: 1,
    borderColor: "#EDE7DC",
  },
  tabItemActiveHeat: {
    backgroundColor: "#FEF3C7",
    borderColor: "#FDE68A",
  },
  tabItemActiveAqi: {
    backgroundColor: "#E0F2FE",
    borderColor: "#BAE6FD",
  },
  tabItemActiveFlood: {
    backgroundColor: "#E0E7FF",
    borderColor: "#C7D2FE",
  },
  tabIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  tabText: {
    fontFamily: "Poppins-Medium",
    fontSize: 12,
    color: "#55695E",
  },
  tabTextActive: {
    fontFamily: "Poppins-Bold",
    color: "#161616",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
  },
  heatAlertCard: {
    backgroundColor: "#FFFBEB",
    borderWidth: 1.5,
    borderColor: "#FDE68A",
    borderRadius: 22,
    padding: 16,
    marginBottom: 16,
  },
  alertHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  heatIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  heatAlertTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: 16,
    color: "#92400E",
  },
  heatAlertSub: {
    fontFamily: "Poppins-Medium",
    fontSize: 12.5,
    color: "#B45309",
    marginTop: 2,
  },
  aqiAlertCard: {
    backgroundColor: "#F0F9FF",
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
    borderRadius: 22,
    padding: 16,
    marginBottom: 16,
  },
  aqiIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E0F2FE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  aqiAlertTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: 16,
    color: "#0369A1",
  },
  aqiAlertSub: {
    fontFamily: "Poppins-Medium",
    fontSize: 12.5,
    color: "#0284C7",
    marginTop: 2,
  },
  floodAlertCard: {
    backgroundColor: "#EEF2FF",
    borderWidth: 1.5,
    borderColor: "#C7D2FE",
    borderRadius: 22,
    padding: 16,
    marginBottom: 16,
  },
  floodIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E0E7FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  floodAlertTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: 16,
    color: "#3730A3",
  },
  floodAlertSub: {
    fontFamily: "Poppins-Medium",
    fontSize: 12.5,
    color: "#4338CA",
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#EDE7DC",
    padding: 18,
    marginBottom: 16,
  },
  cardHeader: {
    fontFamily: "Poppins-Bold",
    fontSize: 15,
    color: "#161616",
    marginBottom: 4,
  },
  scheduleText: {
    fontFamily: "Poppins-Bold",
    fontSize: 16,
    color: "#214332",
    marginBottom: 6,
  },
  scheduleNote: {
    fontFamily: "Poppins-Regular",
    fontSize: 12.5,
    color: "#55695E",
    lineHeight: 18,
    marginBottom: 12,
  },
  timelineRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  timeChip: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    marginHorizontal: 3,
  },
  timeChipLabel: {
    fontFamily: "Poppins-Bold",
    fontSize: 11,
  },
  timeChipStatus: {
    fontFamily: "Poppins-Medium",
    fontSize: 10,
    marginTop: 1,
  },
  actionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "#214332",
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  actionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  actionIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  actionCardTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: 16,
    color: "#214332",
  },
  bulletItem: {
    flexDirection: "row",
    marginBottom: 12,
  },
  bulletDot: {
    fontSize: 16,
    color: "#214332",
    marginRight: 8,
    lineHeight: 20,
  },
  bulletText: {
    flex: 1,
    fontFamily: "Poppins-Regular",
    fontSize: 13,
    color: "#2D3748",
    lineHeight: 19,
  },
  boldText: {
    fontFamily: "Poppins-Bold",
    color: "#1A202C",
  },
  vulnerableCard: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECDD3",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  vulnerableTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: 14,
    color: "#B91C1C",
    marginBottom: 4,
  },
  vulnerableText: {
    fontFamily: "Poppins-Medium",
    fontSize: 12.5,
    color: "#991B1B",
    lineHeight: 18,
  },
});
