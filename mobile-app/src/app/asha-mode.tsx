import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { useTheme } from "@/store/themeStore";
import {
  HeartIcon,
  LungsIcon,
  ThermometerIcon,
  WindIcon,
  PhoneCallIcon,
  AmbulanceIcon,
  LocationPinIcon,
  ClockIcon,
} from "@/components/common/AppIcons";

interface MonitoredPerson {
  id: string;
  name: string;
  age: number;
  gender: string;
  location: string;
  riskLevel: "red" | "yellow" | "green";
  riskScore: number; // 0-100 (higher = worse)
  statusHeadline: string;
  lastUpdated: string;
  heartRate: number;
  spo2: number;
  temperature: number;
  aqi: number;
  phone: string;
  notes: string;
}

const MOCK_PATIENTS: MonitoredPerson[] = [
  {
    id: "p1",
    name: "Radhe Shyam",
    age: 58,
    gender: "Male",
    location: "Sector 4 Brick Kiln",
    riskLevel: "red",
    riskScore: 92,
    statusHeadline: "Acute heat strain & tachycardia detected (124 bpm, 38.2°C)",
    lastUpdated: "2 mins ago",
    heartRate: 124,
    spo2: 94,
    temperature: 38.2,
    aqi: 185,
    phone: "+91 98765 11111",
    notes: "Outdoor kiln worker. Advised immediate shade and cold oral rehydration.",
  },
  {
    id: "p2",
    name: "Kamla Devi",
    age: 63,
    gender: "Female",
    location: "Rampur Agricultural Field",
    riskLevel: "red",
    riskScore: 88,
    statusHeadline: "Sudden impact fall event registered. Immobility timer active.",
    lastUpdated: "5 mins ago",
    heartRate: 110,
    spo2: 96,
    temperature: 37.1,
    aqi: 140,
    phone: "+91 98765 22222",
    notes: "Fall detected by T-shirt IMU. SMS dispatched to village primary contact.",
  },
  {
    id: "p3",
    name: "Mohan Lal",
    age: 49,
    gender: "Male",
    location: "Construction Site B",
    riskLevel: "yellow",
    riskScore: 56,
    statusHeadline: "Prolonged exposure to severe dust (AQI 220). Mild SpO2 drop.",
    lastUpdated: "12 mins ago",
    heartRate: 88,
    spo2: 94,
    temperature: 37.4,
    aqi: 220,
    phone: "+91 98765 33333",
    notes: "N95 respirator advisory sent. SpO2 within tolerable monitoring bounds.",
  },
  {
    id: "p4",
    name: "Sitaram Verma",
    age: 52,
    gender: "Male",
    location: "Highway Sanitation Route",
    riskLevel: "yellow",
    riskScore: 48,
    statusHeadline: "Resting pulse elevated above baseline for past 45 minutes.",
    lastUpdated: "18 mins ago",
    heartRate: 99,
    spo2: 97,
    temperature: 37.3,
    aqi: 160,
    phone: "+91 98765 44444",
    notes: "Rest period recommended. Shift supervisor notified.",
  },
  {
    id: "p5",
    name: "Anita Kumari",
    age: 38,
    gender: "Female",
    location: "Panchayat Office",
    riskLevel: "green",
    riskScore: 12,
    statusHeadline: "All vitals in normal resting range. Healthy baseline.",
    lastUpdated: "25 mins ago",
    heartRate: 72,
    spo2: 99,
    temperature: 36.6,
    aqi: 95,
    phone: "+91 98765 55555",
    notes: "Routine check-in passed. No anomalies reported.",
  },
  {
    id: "p6",
    name: "Gopal Yadav",
    age: 44,
    gender: "Male",
    location: "Warehouse Hub",
    riskLevel: "green",
    riskScore: 10,
    statusHeadline: "Cardiovascular and thermal readings completely stable.",
    lastUpdated: "32 mins ago",
    heartRate: 74,
    spo2: 98,
    temperature: 36.5,
    aqi: 110,
    phone: "+91 98765 66666",
    notes: "Routine baseline.",
  },
];

type RiskFilter = "all" | "red" | "yellow" | "green";

export default function AshaModeScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const [activeFilter, setActiveFilter] = useState<RiskFilter>("all");
  const [selectedPerson, setSelectedPerson] = useState<MonitoredPerson | null>(null);

  // Requirement: List of all monitored people sorted by risk (Red first, then Yellow, then Green)
  const sortedAndFilteredPatients = useMemo(() => {
    // Sort by riskScore descending (highest risk first)
    const sorted = [...MOCK_PATIENTS].sort((a, b) => b.riskScore - a.riskScore);
    if (activeFilter === "all") return sorted;
    return sorted.filter((p) => p.riskLevel === activeFilter);
  }, [activeFilter]);

  const redCount = MOCK_PATIENTS.filter((p) => p.riskLevel === "red").length;
  const yellowCount = MOCK_PATIENTS.filter((p) => p.riskLevel === "yellow").length;
  const greenCount = MOCK_PATIENTS.filter((p) => p.riskLevel === "green").length;

  const getRiskColor = (level: "red" | "yellow" | "green") => {
    switch (level) {
      case "red":
        return "#EF4444";
      case "yellow":
        return "#F59E0B";
      default:
        return "#10B981";
    }
  };

  const getRiskBg = (level: "red" | "yellow" | "green") => {
    switch (level) {
      case "red":
        return "#FEE2E2";
      case "yellow":
        return "#FEF3C7";
      default:
        return "#DCFCE7";
    }
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            if (selectedPerson) {
              setSelectedPerson(null);
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
          <Text style={styles.headerTag}>COMMUNITY HEALTH PROTOCOL</Text>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            {selectedPerson ? "Patient Triage Status" : "ASHA / PHC Companion"}
          </Text>
        </View>

        <View style={styles.ashaBadge}>
          <Text style={styles.ashaBadgeText}>PHC TRIAGE</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* SCREEN 2: INDIVIDUAL PERSON STATUS VIEW */}
        {selectedPerson ? (
          <View>
            {/* Patient Header Card */}
            <View
              style={[
                styles.patientDetailCard,
                { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
              ]}
            >
              <View style={styles.patientTopRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.detailName, { color: colors.textPrimary }]}>
                    {selectedPerson.name}
                  </Text>
                  <Text style={[styles.detailSub, { color: colors.textMuted }]}>
                    {selectedPerson.gender}, {selectedPerson.age} yrs • {selectedPerson.location}
                  </Text>
                  <Text style={[styles.detailTimestamp, { color: colors.textMuted }]}>
                    Last updated: {selectedPerson.lastUpdated}
                  </Text>
                </View>

                <View
                  style={[
                    styles.detailRiskPill,
                    { backgroundColor: getRiskBg(selectedPerson.riskLevel) },
                  ]}
                >
                  <Text
                    style={[
                      styles.detailRiskText,
                      { color: getRiskColor(selectedPerson.riskLevel) },
                    ]}
                  >
                    {selectedPerson.riskLevel === "red"
                      ? "HIGH RISK"
                      : selectedPerson.riskLevel === "yellow"
                      ? "CAUTION"
                      : "NORMAL"}
                  </Text>
                </View>
              </View>

              {/* Status Headline Banner */}
              <View
                style={[
                  styles.headlineBanner,
                  {
                    backgroundColor:
                      selectedPerson.riskLevel === "red"
                        ? "#FEF2F2"
                        : selectedPerson.riskLevel === "yellow"
                        ? "#FFFBEB"
                        : "#F0FDF4",
                    borderColor: getRiskColor(selectedPerson.riskLevel),
                  },
                ]}
              >
                <Text
                  style={[
                    styles.headlineText,
                    {
                      color:
                        selectedPerson.riskLevel === "red"
                          ? "#991B1B"
                          : selectedPerson.riskLevel === "yellow"
                          ? "#92400E"
                          : "#166534",
                    },
                  ]}
                >
                  "{selectedPerson.statusHeadline}"
                </Text>
              </View>

              <Text style={[styles.notesLabel, { color: colors.textPrimary }]}>
                Clinical Notes:
              </Text>
              <Text style={[styles.notesText, { color: colors.textSecondary }]}>
                {selectedPerson.notes}
              </Text>
            </View>

            {/* Live Telemetry Grid */}
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Current Vital Telemetry
            </Text>

            <View style={styles.vitalsGrid}>
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
                <Text
                  style={[
                    styles.vitalVal,
                    {
                      color:
                        selectedPerson.heartRate > 105 ? "#EF4444" : colors.textPrimary,
                    },
                  ]}
                >
                  {selectedPerson.heartRate}{" "}
                  <Text style={styles.vitalUnit}>bpm</Text>
                </Text>
              </View>

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
                <Text
                  style={[
                    styles.vitalVal,
                    {
                      color:
                        selectedPerson.spo2 < 95 ? "#EF4444" : colors.textPrimary,
                    },
                  ]}
                >
                  {selectedPerson.spo2} <Text style={styles.vitalUnit}>%</Text>
                </Text>
              </View>

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
                <Text
                  style={[
                    styles.vitalVal,
                    {
                      color:
                        selectedPerson.temperature > 37.8 ? "#EF4444" : colors.textPrimary,
                    },
                  ]}
                >
                  {selectedPerson.temperature}{" "}
                  <Text style={styles.vitalUnit}>°C</Text>
                </Text>
              </View>

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
                <Text
                  style={[
                    styles.vitalVal,
                    {
                      color:
                        selectedPerson.aqi > 150 ? "#F59E0B" : colors.textPrimary,
                    },
                  ]}
                >
                  {selectedPerson.aqi} <Text style={styles.vitalUnit}>AQI</Text>
                </Text>
              </View>
            </View>

            {/* ASHA Direct Interventions */}
            <View style={styles.actionColumn}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleCall(selectedPerson.phone)}
                style={[styles.callPatientBtn, { flexDirection: "row", alignItems: "center", justifyContent: "center" }]}
              >
                <PhoneCallIcon size={16} color="#FFFFFF" />
                <Text style={[styles.callPatientBtnText, { marginLeft: 8 }]}>
                  Call Worker Directly ({selectedPerson.phone})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  alert(`Dispatched PHC First Responder to ${selectedPerson.location}`);
                }}
                style={[styles.dispatchBtn, { flexDirection: "row", alignItems: "center", justifyContent: "center" }]}
              >
                <AmbulanceIcon size={18} color="#FFFFFF" />
                <Text style={[styles.dispatchBtnText, { marginLeft: 8 }]}>
                  Dispatch PHC First Aid Responder
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setSelectedPerson(null)}
                style={[
                  styles.backBtn,
                  { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
                ]}
              >
                <Text style={[styles.backBtnText, { color: colors.textPrimary }]}>
                  ‹ Return to Community Roster
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* SCREEN 1: ASHA/PHC DASHBOARD - SORTED BY RISK */
          <View>
            {/* Community Overview Summary Card */}
            <View
              style={[
                styles.overviewCard,
                { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
              ]}
            >
              <Text style={[styles.overviewTitle, { color: colors.textPrimary }]}>
                Rampur Community Health Cohort
              </Text>
              <Text style={[styles.overviewSub, { color: colors.textMuted }]}>
                6 monitored active field workers • Auto-sorted by risk urgency
              </Text>

              <View style={styles.overviewStatsRow}>
                <View style={styles.statBox}>
                  <Text style={[styles.statNum, { color: "#EF4444" }]}>{redCount}</Text>
                  <Text style={styles.statLabel}>HIGH RISK</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statNum, { color: "#F59E0B" }]}>{yellowCount}</Text>
                  <Text style={styles.statLabel}>CAUTION</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statNum, { color: "#10B981" }]}>{greenCount}</Text>
                  <Text style={styles.statLabel}>NORMAL</Text>
                </View>
              </View>
            </View>

            {/* Filter Pills */}
            <View style={styles.filtersRow}>
              {(
                [
                  { key: "all", label: `All (${MOCK_PATIENTS.length})` },
                  { key: "red", label: `High Risk (${redCount})` },
                  { key: "yellow", label: `Caution (${yellowCount})` },
                  { key: "green", label: `Normal (${greenCount})` },
                ] as const
              ).map((f) => {
                const isActive = activeFilter === f.key;
                return (
                  <TouchableOpacity
                    key={f.key}
                    activeOpacity={0.8}
                    onPress={() => setActiveFilter(f.key)}
                    style={[
                      styles.filterPill,
                      isActive && styles.filterPillActive,
                      {
                        backgroundColor: isActive
                          ? "#16A34A"
                          : isDark
                          ? colors.cardBg
                          : "#F3F4F6",
                        borderColor: isActive ? "#16A34A" : colors.cardBorder,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterPillText,
                        { color: isActive ? "#FFFFFF" : colors.textSecondary },
                      ]}
                    >
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Patients List Sorted by Risk (Feature 1) */}
            <View style={styles.patientList}>
              {sortedAndFilteredPatients.map((person) => {
                const riskColor = getRiskColor(person.riskLevel);
                const riskBg = getRiskBg(person.riskLevel);

                return (
                  <TouchableOpacity
                    key={person.id}
                    activeOpacity={0.85}
                    onPress={() => setSelectedPerson(person)}
                    style={[
                      styles.personCard,
                      {
                        backgroundColor: colors.cardBg,
                        borderColor:
                          person.riskLevel === "red"
                            ? "#FCA5A5"
                            : colors.cardBorder,
                      },
                    ]}
                  >
                    <View style={styles.personHeader}>
                      <View style={styles.personInfo}>
                        <View style={styles.personNameRow}>
                          <Text
                            style={[styles.personName, { color: colors.textPrimary }]}
                          >
                            {person.name}
                          </Text>
                          <Text
                            style={[styles.personAge, { color: colors.textMuted }]}
                          >
                            ({person.age}y, {person.gender.charAt(0)})
                          </Text>
                        </View>
                        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
                          <LocationPinIcon size={12} color={colors.textMuted} />
                          <Text
                            style={[styles.personLocation, { color: colors.textMuted, marginLeft: 4 }]}
                          >
                            {person.location}
                          </Text>
                        </View>
                      </View>

                      {/* Risk Badge */}
                      <View
                        style={[styles.personRiskBadge, { backgroundColor: riskBg }]}
                      >
                        <View
                          style={[
                            styles.personRiskDot,
                            { backgroundColor: riskColor },
                          ]}
                        />
                        <Text
                          style={[styles.personRiskText, { color: riskColor }]}
                        >
                          {person.riskLevel === "red"
                            ? "CRITICAL"
                            : person.riskLevel === "yellow"
                            ? "CAUTION"
                            : "NORMAL"}
                        </Text>
                      </View>
                    </View>

                    {/* Headline and Last Updated */}
                    <Text
                      style={[styles.personHeadline, { color: colors.textSecondary }]}
                      numberOfLines={2}
                    >
                      "{person.statusHeadline}"
                    </Text>

                    <View style={styles.personFooter}>
                      <Text
                        style={[styles.personTelemetryPill, { color: colors.textMuted }]}
                      >
                        HR: {person.heartRate} bpm • SpO2: {person.spo2}% • Temp: {person.temperature}°C
                      </Text>
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <ClockIcon size={11} color={colors.textMuted} />
                        <Text
                          style={[styles.personTimestamp, { color: colors.textMuted, marginLeft: 4 }]}
                        >
                          {person.lastUpdated}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
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
  ashaBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  ashaBadgeText: {
    fontFamily: "Poppins-Bold",
    fontSize: 9.5,
    color: "#15803D",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 100,
  },
  overviewCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  overviewTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: 15,
  },
  overviewSub: {
    fontFamily: "Poppins-Regular",
    fontSize: 11.5,
    marginTop: 2,
    marginBottom: 14,
  },
  overviewStatsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
    paddingTop: 12,
  },
  statBox: {
    alignItems: "center",
    flex: 1,
  },
  statNum: {
    fontFamily: "Poppins-Bold",
    fontSize: 22,
    lineHeight: 26,
  },
  statLabel: {
    fontFamily: "Poppins-Bold",
    fontSize: 10,
    color: "#6B7280",
    letterSpacing: 0.5,
    marginTop: 2,
  },
  filtersRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
    flexWrap: "wrap",
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  filterPillActive: {},
  filterPillText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 11.5,
  },
  patientList: {
    gap: 12,
  },
  personCard: {
    borderRadius: 20,
    borderWidth: 1.2,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  personHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  personInfo: {
    flex: 1,
    marginRight: 8,
  },
  personNameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  personName: {
    fontFamily: "Poppins-Bold",
    fontSize: 15,
  },
  personAge: {
    fontFamily: "Poppins-Medium",
    fontSize: 12,
    marginLeft: 5,
  },
  personLocation: {
    fontFamily: "Poppins-Regular",
    fontSize: 11.5,
    marginTop: 1,
  },
  personRiskBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  personRiskDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  personRiskText: {
    fontFamily: "Poppins-Bold",
    fontSize: 10,
    letterSpacing: 0.5,
  },
  personHeadline: {
    fontFamily: "Poppins-Regular",
    fontSize: 12.5,
    lineHeight: 17,
    fontStyle: "italic",
    marginBottom: 10,
  },
  personFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.04)",
    paddingTop: 8,
  },
  personTelemetryPill: {
    fontFamily: "Poppins-Medium",
    fontSize: 11,
  },
  personTimestamp: {
    fontFamily: "Poppins-Regular",
    fontSize: 10.5,
  },

  // Patient Detail Screen Styles
  patientDetailCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  patientTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  detailName: {
    fontFamily: "Poppins-Bold",
    fontSize: 18,
  },
  detailSub: {
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    marginTop: 2,
  },
  detailTimestamp: {
    fontFamily: "Poppins-Medium",
    fontSize: 11,
    marginTop: 2,
  },
  detailRiskPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  detailRiskText: {
    fontFamily: "Poppins-Bold",
    fontSize: 11,
    letterSpacing: 0.5,
  },
  headlineBanner: {
    borderWidth: 1.2,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  headlineText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 13,
    lineHeight: 18,
  },
  notesLabel: {
    fontFamily: "Poppins-Bold",
    fontSize: 12,
    marginBottom: 2,
  },
  notesText: {
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    lineHeight: 17,
  },
  sectionTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: 16,
    marginBottom: 12,
  },
  vitalsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 20,
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
  actionColumn: {
    gap: 10,
  },
  callPatientBtn: {
    backgroundColor: "#16A34A",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  callPatientBtnText: {
    fontFamily: "Poppins-Bold",
    fontSize: 13.5,
    color: "#FFFFFF",
  },
  dispatchBtn: {
    backgroundColor: "#DC2626",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  dispatchBtnText: {
    fontFamily: "Poppins-Bold",
    fontSize: 13.5,
    color: "#FFFFFF",
  },
  backBtn: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  backBtnText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 13,
  },
});
