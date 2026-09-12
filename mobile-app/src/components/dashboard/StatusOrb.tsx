import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { useRouter } from "expo-router";
import { LockIcon } from "@/components/common/AppIcons";

export type TrafficLightStatus = "green" | "yellow" | "red";

interface StatusOrbProps {
  status: TrafficLightStatus;
  customMessage?: string;
  onPress?: () => void;
  onStatusChange?: (status: TrafficLightStatus) => void;
  showSimControls?: boolean;
}

const STATUS_CONFIG = {
  green: {
    color: "#16A34A",
    bgSoft: "#EBF7EE",
    bgCard: "#F0FDF4",
    borderColor: "#BBF7D0",
    glowColor: "rgba(22, 163, 74, 0.15)",
    label: "ALL NORMAL",
    badgeBg: "#DCFCE7",
    defaultSentence: "You’re doing fine. Stay hydrated, it’s a hot afternoon.",
    subtext: "Heart rhythm, skin temperature, and oxygen saturation are steady.",
  },
  yellow: {
    color: "#D97706",
    bgSoft: "#FFFBEB",
    bgCard: "#FEFCE8",
    borderColor: "#FDE68A",
    glowColor: "rgba(217, 119, 6, 0.15)",
    label: "CAUTION DETECTED",
    badgeBg: "#FEF3C7",
    defaultSentence: "Your heart rate is a bit high for resting. Sit somewhere shaded for a few minutes.",
    subtext: "Elevated pulse or thermal index detected. Take a brief resting pause.",
  },
  red: {
    color: "#DC2626",
    bgSoft: "#FEF2F2",
    bgCard: "#FFF1F2",
    borderColor: "#FECDD3",
    glowColor: "rgba(220, 38, 38, 0.15)",
    label: "NEEDS ATTENTION",
    badgeBg: "#FEE2E2",
    defaultSentence: "This doesn’t look normal. Please sit down and consider calling for help.",
    subtext: "Arrhythmia anomaly or impact shock recorded. Check on user immediately.",
  },
};

export function StatusOrb({
  status,
  customMessage,
  onPress,
  onStatusChange,
  showSimControls = true,
}: StatusOrbProps) {
  const router = useRouter();
  const config = STATUS_CONFIG[status];
  const headline = customMessage || config.defaultSentence;

  return (
    <View style={styles.outerContainer}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        style={[
          styles.mainCard,
          {
            backgroundColor: config.bgCard,
            borderColor: config.borderColor,
          },
        ]}
      >
        {/* Top Tag & Privacy Badge Row */}
        <View style={styles.topTagRow}>
          <View
            style={[
              styles.trafficBadge,
              { backgroundColor: config.badgeBg, borderColor: config.borderColor },
            ]}
          >
            <View style={[styles.statusDot, { backgroundColor: config.color }]} />
            <Text style={[styles.statusBadgeText, { color: config.color }]}>
              {config.label}
            </Text>
          </View>

          {/* Persistent On-device Privacy Badge (AGENTS.md §4.2) */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => router.push("/trust-privacy" as any)}
            style={styles.privacyBadge}
          >
            <View style={{ marginRight: 4 }}>
              <LockIcon size={12} color="#15803D" />
            </View>
            <Text style={styles.privacyText}>On-device ›</Text>
          </TouchableOpacity>
        </View>

        {/* Central Orb & Icon Visual */}
        <View style={styles.orbCenterSection}>
          <View
            style={[
              styles.orbOuterGlow,
              { backgroundColor: config.glowColor, borderColor: config.borderColor },
            ]}
          >
            <View style={[styles.orbInnerCircle, { backgroundColor: config.color }]}>
              {status === "green" && (
                <Svg width="34" height="34" viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M12 2L4 5.5V11.5C4 16.5 7.5 20.8 12 22C16.5 20.8 20 16.5 20 11.5V5.5L12 2Z"
                    fill="#DCFCE7"
                  />
                  <Path
                    d="M9 12L11 14L15 10"
                    stroke="#15803D"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              )}

              {status === "yellow" && (
                <Svg width="34" height="34" viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M12 9V13M12 17H12.01M10.29 3.86L1.82 18C1.64 18.3 1.55 18.65 1.55 19C1.55 19.35 1.64 19.7 1.82 20C2 20.3 2.26 20.56 2.57 20.73C2.88 20.9 3.23 21 3.59 21H20.41C20.77 21 21.12 20.9 21.43 20.73C21.74 20.56 22 20.3 22.18 20C22.36 19.7 22.45 19.35 22.45 19C22.45 18.65 22.36 18.3 22.18 18L13.71 3.86C13.53 3.55 13.27 3.3 12.96 3.13C12.65 2.96 12.3 2.87 11.94 2.87C11.58 2.87 11.23 2.96 10.92 3.13C10.61 3.3 10.35 3.55 10.17 3.86H10.29Z"
                    stroke="#FFFFFF"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              )}

              {status === "red" && (
                <Svg width="34" height="34" viewBox="0 0 24 24" fill="none">
                  <Circle cx="12" cy="12" r="10" fill="#FEE2E2" />
                  <Path
                    d="M12 7V13M12 16H12.01"
                    stroke="#DC2626"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </Svg>
              )}
            </View>
          </View>
        </View>

        {/* Plain-Language Status Sentence (AGENTS.md §4.2) */}
        <Text style={[styles.statusSentence, { color: config.color }]}>
          “{headline}”
        </Text>

        <Text style={styles.statusSubtext}>{config.subtext}</Text>
      </TouchableOpacity>

      {/* Demo Selector Pills for Judges & Mentors */}
      {showSimControls && onStatusChange && (
        <View style={styles.simRow}>
          <Text style={styles.simLabel}>Demo State:</Text>
          {(["green", "yellow", "red"] as TrafficLightStatus[]).map((st) => (
            <TouchableOpacity
              key={st}
              onPress={() => onStatusChange(st)}
              style={[
                styles.simPill,
                status === st && {
                  backgroundColor: STATUS_CONFIG[st].badgeBg,
                  borderColor: STATUS_CONFIG[st].borderColor,
                },
              ]}
            >
              <View
                style={[
                  styles.simDot,
                  { backgroundColor: STATUS_CONFIG[st].color },
                ]}
              />
              <Text
                style={[
                  styles.simText,
                  status === st && {
                    color: STATUS_CONFIG[st].color,
                    fontFamily: "Poppins-Bold",
                  },
                ]}
              >
                {st === "green" ? "Normal" : st === "yellow" ? "Caution" : "Risk"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    width: "100%",
    marginBottom: 18,
  },
  mainCard: {
    borderRadius: 28,
    borderWidth: 1.5,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  topTagRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 12,
  },
  trafficBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 4.5,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  statusBadgeText: {
    fontFamily: "Poppins-Bold",
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  privacyBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E1D8",
  },
  privacyLock: {
    fontSize: 10,
    marginRight: 4,
  },
  privacyText: {
    fontFamily: "Poppins-Medium",
    fontSize: 10.5,
    color: "#55695E",
  },
  orbCenterSection: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
  },
  orbOuterGlow: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  orbInnerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  statusSentence: {
    fontFamily: "Poppins-Bold",
    fontSize: 18,
    lineHeight: 25,
    textAlign: "center",
    marginTop: 4,
    paddingHorizontal: 8,
  },
  statusSubtext: {
    fontFamily: "Poppins-Regular",
    fontSize: 12.5,
    color: "#55695E",
    textAlign: "center",
    marginTop: 4,
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  simRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    paddingHorizontal: 10,
  },
  simLabel: {
    fontFamily: "Poppins-Medium",
    fontSize: 11,
    color: "#8A9A90",
    marginRight: 6,
  },
  simPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#EDE7DD",
    backgroundColor: "#FAF8F5",
    marginHorizontal: 3,
  },
  simDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  simText: {
    fontFamily: "Poppins-Regular",
    fontSize: 10.5,
    color: "#55695E",
  },
});
