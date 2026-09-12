import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Svg, { Path, Circle } from "react-native-svg";
import { useTheme } from "@/store/themeStore";
import {
  HeartIcon,
  LungsIcon,
  ThermometerIcon,
  WindIcon,
  BatteryIcon,
  PhoneCallIcon,
} from "@/components/common/AppIcons";

interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  age: number;
  status: "green" | "yellow" | "red";
  statusText: string;
  lastSeen: string;
  heartRate: number;
  spo2: number;
  temperature: number;
  aqi: number;
  battery: number;
}

const MOCK_FAMILY: FamilyMember[] = [
  {
    id: "1",
    name: "Ramesh Sharma",
    relationship: "Father",
    age: 68,
    status: "red",
    statusText: "Cardiac exertion detected during afternoon walk",
    lastSeen: "4 mins ago",
    heartRate: 118,
    spo2: 95,
    temperature: 37.9,
    aqi: 168,
    battery: 78,
  },
  {
    id: "2",
    name: "Sunita Sharma",
    relationship: "Mother",
    age: 64,
    status: "green",
    statusText: "Resting comfortably indoors. All vitals normal.",
    lastSeen: "12 mins ago",
    heartRate: 72,
    spo2: 98,
    temperature: 36.6,
    aqi: 112,
    battery: 91,
  },
  {
    id: "3",
    name: "Priya Sharma",
    relationship: "Daughter",
    age: 18,
    status: "green",
    statusText: "Active in school. Baseline healthy.",
    lastSeen: "35 mins ago",
    heartRate: 76,
    spo2: 99,
    temperature: 36.5,
    aqi: 120,
    battery: 84,
  },
];

const MOCK_ALERTS = [
  {
    id: "a1",
    title: "Cardiac Exertion Alert",
    member: "Ramesh Sharma (Father)",
    time: "4 mins ago",
    severity: "red",
    desc: "Heart rate exceeded 115 bpm threshold for >5 mins. SMS check-in sent.",
  },
  {
    id: "a2",
    title: "Heat Wave Hydration Prompt",
    member: "Sunita Sharma (Mother)",
    time: "2 hours ago",
    severity: "yellow",
    desc: "Local temperature reached 41°C. Hydration reminder acknowledged.",
  },
];

export default function CaregiverViewScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);

  const getStatusColor = (status: "green" | "yellow" | "red") => {
    switch (status) {
      case "red":
        return "#EF4444";
      case "yellow":
        return "#F59E0B";
      default:
        return "#10B981";
    }
  };

  const getStatusBadgeBg = (status: "green" | "yellow" | "red") => {
    switch (status) {
      case "red":
        return "#FEE2E2";
      case "yellow":
        return "#FEF3C7";
      default:
        return "#DCFCE7";
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            if (selectedMember) {
              setSelectedMember(null);
            } else {
              router.back();
            }
          }}
          style={[
            styles.backButton,
            { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
          ]}
        >
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path
              d="M15 18L9 12L15 6"
              stroke={colors.textPrimary}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTag}>FAMILY COMPANION</Text>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            {selectedMember ? `${selectedMember.name}` : "Caregiver Dashboard"}
          </Text>
        </View>

        <View style={styles.syncBadge}>
          <View style={styles.syncDot} />
          <Text style={styles.syncText}>SYNCED</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* VIEW 1: INDIVIDUAL FAMILY MEMBER STATUS (MIRRORED HOME STATUS) */}
        {selectedMember ? (
          <View>
            {/* Mirrored Status Header Card */}
            <View
              style={[
                styles.mirroredCard,
                { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
              ]}
            >
              <View style={styles.mirroredTopRow}>
                <View>
                  <Text style={[styles.mirroredName, { color: colors.textPrimary }]}>
                    {selectedMember.name} ({selectedMember.relationship})
                  </Text>
                  <Text style={[styles.mirroredSub, { color: colors.textMuted }]}>
                    Age: {selectedMember.age} • Last seen: {selectedMember.lastSeen}
                  </Text>
                </View>
                <View
                  style={[
                    styles.mirroredStatusPill,
                    { backgroundColor: getStatusBadgeBg(selectedMember.status) },
                  ]}
                >
                  <Text
                    style={[
                      styles.mirroredStatusText,
                      { color: getStatusColor(selectedMember.status) },
                    ]}
                  >
                    {selectedMember.status.toUpperCase()} STATUS
                  </Text>
                </View>
              </View>

              {/* Mirrored Big Status Orb Banner */}
              <View
                style={[
                  styles.orbBanner,
                  {
                    backgroundColor:
                      selectedMember.status === "red"
                        ? "#FEF2F2"
                        : selectedMember.status === "yellow"
                        ? "#FFFBEB"
                        : "#F0FDF4",
                    borderColor: getStatusColor(selectedMember.status),
                  },
                ]}
              >
                <View
                  style={[
                    styles.orbDot,
                    { backgroundColor: getStatusColor(selectedMember.status) },
                  ]}
                />
                <Text
                  style={[
                    styles.orbSentence,
                    {
                      color:
                        selectedMember.status === "red"
                          ? "#991B1B"
                          : selectedMember.status === "yellow"
                          ? "#92400E"
                          : "#166534",
                    },
                  ]}
                >
                  "{selectedMember.statusText}"
                </Text>
              </View>

              {/* Hardware & Privacy Mirror Indicator */}
              <View style={[styles.hardwareRow, { flexDirection: "row", alignItems: "center" }]}>
                <BatteryIcon size={14} color="#16A34A" />
                <Text style={[styles.hardwareText, { color: colors.textMuted, marginLeft: 6 }]}>
                  Wearable Battery: {selectedMember.battery}% • BLE Direct Sync
                </Text>
              </View>
            </View>

            {/* Mirrored Live Vitals Grid */}
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Live Vital Readings
            </Text>

            <View style={styles.vitalsGrid}>
              {/* Heart Rate */}
              <View
                style={[
                  styles.vitalCard,
                  { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
                ]}
              >
                <HeartIcon size={22} color="#DC2626" />
                <Text style={[styles.vitalLabel, { color: colors.textMuted }]}>
                  Heart Rate
                </Text>
                <Text style={[styles.vitalVal, { color: colors.textPrimary }]}>
                  {selectedMember.heartRate}{" "}
                  <Text style={styles.vitalUnit}>bpm</Text>
                </Text>
              </View>

              {/* SpO2 */}
              <View
                style={[
                  styles.vitalCard,
                  { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
                ]}
              >
                <LungsIcon size={22} color="#2563EB" />
                <Text style={[styles.vitalLabel, { color: colors.textMuted }]}>
                  Blood Oxygen
                </Text>
                <Text style={[styles.vitalVal, { color: colors.textPrimary }]}>
                  {selectedMember.spo2} <Text style={styles.vitalUnit}>%</Text>
                </Text>
              </View>

              {/* Temperature */}
              <View
                style={[
                  styles.vitalCard,
                  { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
                ]}
              >
                <ThermometerIcon size={22} color="#EF4444" />
                <Text style={[styles.vitalLabel, { color: colors.textMuted }]}>
                  Skin Temp
                </Text>
                <Text style={[styles.vitalVal, { color: colors.textPrimary }]}>
                  {selectedMember.temperature}{" "}
                  <Text style={styles.vitalUnit}>°C</Text>
                </Text>
              </View>

              {/* AQI */}
              <View
                style={[
                  styles.vitalCard,
                  { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
                ]}
              >
                <WindIcon size={22} color="#64748B" />
                <Text style={[styles.vitalLabel, { color: colors.textMuted }]}>
                  Ambient AQI
                </Text>
                <Text style={[styles.vitalVal, { color: colors.textPrimary }]}>
                  {selectedMember.aqi} <Text style={styles.vitalUnit}>AQI</Text>
                </Text>
              </View>
            </View>

            {/* Quick Actions for Family Member */}
            <View style={styles.caregiverActionRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.callButton, { flexDirection: "row", alignItems: "center", justifyContent: "center" }]}
              >
                <PhoneCallIcon size={16} color="#FFFFFF" />
                <Text style={[styles.callButtonText, { marginLeft: 8 }]}>Call {selectedMember.relationship}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setSelectedMember(null)}
                style={[
                  styles.backToListButton,
                  { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
                ]}
              >
                <Text style={[styles.backToListText, { color: colors.textPrimary }]}>
                  ‹ All Family Members
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* VIEW 2: MULTIPLE FAMILY MEMBER MONITORING LIST */
          <View>
            <View style={styles.listHeaderRow}>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  Monitored Family Members
                </Text>
                <Text style={[styles.sectionSub, { color: colors.textMuted }]}>
                  3 profiles linked via on-device sync
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                style={[
                  styles.addMemberBtn,
                  { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
                ]}
              >
                <Text style={[styles.addMemberText, { color: colors.textPrimary }]}>
                  + Add Member
                </Text>
              </TouchableOpacity>
            </View>

            {/* Family Members Cards */}
            <View style={styles.memberList}>
              {MOCK_FAMILY.map((member) => {
                const badgeBg = getStatusBadgeBg(member.status);
                const statusColor = getStatusColor(member.status);

                return (
                  <TouchableOpacity
                    key={member.id}
                    activeOpacity={0.85}
                    onPress={() => setSelectedMember(member)}
                    style={[
                      styles.memberCard,
                      { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
                    ]}
                  >
                    <View style={styles.memberCardTop}>
                      <View style={styles.memberInfoLeft}>
                        <View
                          style={[
                            styles.avatarCircle,
                            { backgroundColor: `${statusColor}18` },
                          ]}
                        >
                          <Text style={[styles.avatarInitial, { color: statusColor }]}>
                            {member.name.charAt(0)}
                          </Text>
                        </View>

                        <View>
                          <View style={styles.nameRow}>
                            <Text
                              style={[styles.memberName, { color: colors.textPrimary }]}
                            >
                              {member.name}
                            </Text>
                            <Text
                              style={[styles.memberRel, { color: colors.textMuted }]}
                            >
                              • {member.relationship}
                            </Text>
                          </View>
                          <Text
                            style={[styles.memberLastSeen, { color: colors.textMuted }]}
                          >
                            Last seen: {member.lastSeen}
                          </Text>
                        </View>
                      </View>

                      {/* Status Light */}
                      <View style={[styles.statusBadge, { backgroundColor: badgeBg }]}>
                        <View
                          style={[styles.statusDot, { backgroundColor: statusColor }]}
                        />
                        <Text style={[styles.statusText, { color: statusColor }]}>
                          {member.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    {/* Conversational Status line */}
                    <Text
                      style={[styles.memberStatusText, { color: colors.textSecondary }]}
                      numberOfLines={1}
                    >
                      "{member.statusText}"
                    </Text>

                    {/* Vitals Summary Pill Row */}
                    <View style={styles.memberStatsPillRow}>
                      <Text style={[styles.memberPillText, { color: colors.textMuted }]}>
                        HR: {member.heartRate} bpm
                      </Text>
                      <Text style={[styles.memberPillText, { color: colors.textMuted }]}>
                        SpO2: {member.spo2}%
                      </Text>
                      <Text style={[styles.memberPillText, { color: colors.textMuted }]}>
                        Temp: {member.temperature}°C
                      </Text>
                      <Text style={[styles.memberPillText, { color: colors.textMuted }]}>
                        Bat: {member.battery}%
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Risk-Level Push Notifications Section */}
            <View style={styles.alertsHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Recent Risk Notifications
              </Text>
              <Text style={[styles.sectionSub, { color: colors.textMuted }]}>
                Real-time safety events
              </Text>
            </View>

            <View style={styles.alertsList}>
              {MOCK_ALERTS.map((alert) => (
                <View
                  key={alert.id}
                  style={[
                    styles.alertCard,
                    { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
                  ]}
                >
                  <View style={styles.alertHeaderRow}>
                    <View style={styles.alertTitleRow}>
                      <View
                        style={[
                          styles.alertDot,
                          {
                            backgroundColor:
                              alert.severity === "red" ? "#EF4444" : "#F59E0B",
                          },
                        ]}
                      />
                      <Text
                        style={[styles.alertTitle, { color: colors.textPrimary }]}
                      >
                        {alert.title}
                      </Text>
                    </View>
                    <Text style={[styles.alertTime, { color: colors.textMuted }]}>
                      {alert.time}
                    </Text>
                  </View>

                  <Text style={[styles.alertMember, { color: colors.textSecondary }]}>
                    {alert.member}
                  </Text>
                  <Text
                    style={[styles.alertDesc, { color: colors.textMuted }]}
                  >
                    {alert.desc}
                  </Text>
                </View>
              ))}
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
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleWrap: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerTag: {
    fontFamily: "Poppins-Bold",
    fontSize: 9.5,
    color: "#16A34A",
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: 16,
  },
  syncBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  syncDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#16A34A",
    marginRight: 4,
  },
  syncText: {
    fontFamily: "Poppins-Bold",
    fontSize: 9.5,
    color: "#15803D",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    paddingTop: 8,
  },
  listHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: 16,
  },
  sectionSub: {
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    marginTop: 1,
  },
  addMemberBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  addMemberText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 12,
  },
  memberList: {
    gap: 12,
    marginBottom: 24,
  },
  memberCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  memberCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  memberInfoLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  avatarInitial: {
    fontFamily: "Poppins-Bold",
    fontSize: 17,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  memberName: {
    fontFamily: "Poppins-Bold",
    fontSize: 14.5,
  },
  memberRel: {
    fontFamily: "Poppins-Medium",
    fontSize: 12,
    marginLeft: 4,
  },
  memberLastSeen: {
    fontFamily: "Poppins-Regular",
    fontSize: 11,
    marginTop: 1,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusText: {
    fontFamily: "Poppins-Bold",
    fontSize: 10,
    letterSpacing: 0.5,
  },
  memberStatusText: {
    fontFamily: "Poppins-Regular",
    fontSize: 12.5,
    fontStyle: "italic",
    marginBottom: 10,
  },
  memberStatsPillRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.04)",
    paddingTop: 8,
  },
  memberPillText: {
    fontFamily: "Poppins-Medium",
    fontSize: 11,
  },
  alertsHeaderRow: {
    marginBottom: 12,
  },
  alertsList: {
    gap: 10,
  },
  alertCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  alertHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  alertTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  alertDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 6,
  },
  alertTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: 13,
  },
  alertTime: {
    fontFamily: "Poppins-Regular",
    fontSize: 11,
  },
  alertMember: {
    fontFamily: "Poppins-Medium",
    fontSize: 11.5,
    marginBottom: 4,
  },
  alertDesc: {
    fontFamily: "Poppins-Regular",
    fontSize: 11.5,
    lineHeight: 16,
  },

  // Mirrored View Styles
  mirroredCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    marginBottom: 18,
  },
  mirroredTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  mirroredName: {
    fontFamily: "Poppins-Bold",
    fontSize: 17,
  },
  mirroredSub: {
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    marginTop: 2,
  },
  mirroredStatusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  mirroredStatusText: {
    fontFamily: "Poppins-Bold",
    fontSize: 11,
    letterSpacing: 0.5,
  },
  orbBanner: {
    borderWidth: 1.2,
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  orbDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  orbSentence: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  hardwareRow: {
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
    paddingTop: 8,
  },
  hardwareText: {
    fontFamily: "Poppins-Regular",
    fontSize: 11.5,
  },
  vitalsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginVertical: 12,
    gap: 10,
  },
  vitalCard: {
    width: "48%",
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  vitalLabel: {
    fontFamily: "Poppins-Medium",
    fontSize: 11,
    marginTop: 6,
  },
  vitalVal: {
    fontFamily: "Poppins-Bold",
    fontSize: 18,
    marginTop: 2,
  },
  vitalUnit: {
    fontFamily: "Poppins-Regular",
    fontSize: 11,
  },
  caregiverActionRow: {
    marginTop: 14,
    gap: 10,
  },
  callButton: {
    backgroundColor: "#16A34A",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  callButtonText: {
    fontFamily: "Poppins-Bold",
    fontSize: 14,
    color: "#FFFFFF",
  },
  backToListButton: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  backToListText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 13,
  },
});
