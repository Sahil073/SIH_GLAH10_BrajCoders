import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { useRouter } from "expo-router";
import { LockIcon } from "@/components/common/AppIcons";
import { useLanguage } from "@/i18n/languages";

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
    badgeBg: "#DCFCE7",
    badgeBorder: "#86EFAC",
    label: "NORMAL",
  },
  yellow: {
    color: "#D97706",
    bgSoft: "#FFFBEB",
    bgCard: "#FEFCE8",
    borderColor: "#FDE68A",
    badgeBg: "#FEF3C7",
    badgeBorder: "#FCD34D",
    label: "CAUTION",
  },
  red: {
    color: "#DC2626",
    bgSoft: "#FEF2F2",
    bgCard: "#FFF1F2",
    borderColor: "#FECDD3",
    badgeBg: "#FEE2E2",
    badgeBorder: "#FCA5A5",
    label: "RISK",
  },
};

export function StatusOrb({
  status,
  customMessage,
  onPress,
  onStatusChange,
  showSimControls = false,
}: StatusOrbProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.green;

  const localizedBadge =
    status === "green"
      ? t("statusNormal")
      : status === "yellow"
      ? t("statusWarning")
      : t("statusCritical");

  const localizedSub =
    customMessage ||
    (status === "green"
      ? t("statusNormalSub")
      : status === "yellow"
      ? t("statusWarningSub")
      : t("statusCriticalSub"));

  return (
    <View style={styles.outerContainer}>
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={onPress}
        style={[
          styles.mainCard,
          {
            backgroundColor: config.bgCard,
            borderColor: config.borderColor,
          },
        ]}
      >
        {/* Header: Status Pill & On-device Privacy Tag */}
        <View style={styles.topRow}>
          <View
            style={[
              styles.statusPill,
              {
                backgroundColor: config.badgeBg,
                borderColor: config.badgeBorder,
              },
            ]}
          >
            <View style={[styles.statusDot, { backgroundColor: config.color }]} />
            <Text style={[styles.statusPillText, { color: config.color }]}>
              {localizedBadge.toUpperCase()}
            </Text>
          </View>

          {/* Persistent On-device Privacy Tag (AGENTS.md §4.2) */}
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

        {/* Focused Single-State Body: Clear Icon + State Title & Subtitle */}
        <View style={styles.bodyRow}>
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: config.badgeBg,
                borderColor: config.borderColor,
              },
            ]}
          >
            {status === "green" && (
              <Svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <Path
                  d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                  fill="#16A34A"
                />
                <Path
                  d="m9 12 2 2 4-4"
                  stroke="#FFFFFF"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            )}

            {status === "yellow" && (
              <Svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <Path
                  d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                  fill="#D97706"
                />
                <Path
                  d="M12 9v4m0 4h.01"
                  stroke="#FFFFFF"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </Svg>
            )}

            {status === "red" && (
              <Svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <Circle cx="12" cy="12" r="10" fill="#DC2626" />
                <Path
                  d="M12 7v6m0 3h.01"
                  stroke="#FFFFFF"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
              </Svg>
            )}
          </View>

          <View style={styles.textColumn}>
            <Text style={[styles.statusTitle, { color: config.color }]}>
              {localizedBadge}
            </Text>
            <Text style={styles.statusSubtitle} numberOfLines={2}>
              {localizedSub}
            </Text>
          </View>
        </View>

        {/* Subtle Bottom State Level Indicator */}
        <View style={styles.indicatorTrack}>
          <View
            style={[
              styles.indicatorFill,
              {
                backgroundColor: config.color,
                width: status === "green" ? "33%" : status === "yellow" ? "66%" : "100%",
              },
            ]}
          />
        </View>
      </TouchableOpacity>

      {/* Optional demo controls if explicitly requested */}
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
    marginBottom: 16,
  },
  mainCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 12,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusDot: {
    width: 6.5,
    height: 6.5,
    borderRadius: 3.5,
    marginRight: 6,
  },
  statusPillText: {
    fontFamily: "Poppins-Bold",
    fontSize: 10.5,
    letterSpacing: 0.6,
  },
  privacyBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E1D8",
  },
  privacyText: {
    fontFamily: "Poppins-Medium",
    fontSize: 10.5,
    color: "#55695E",
  },
  bodyRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 10,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  textColumn: {
    flex: 1,
    justifyContent: "center",
  },
  statusTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: 17,
    letterSpacing: -0.2,
    lineHeight: 22,
    marginBottom: 2,
  },
  statusSubtitle: {
    fontFamily: "Poppins-Regular",
    fontSize: 12.5,
    color: "#475569",
    lineHeight: 17,
  },
  indicatorTrack: {
    width: "100%",
    height: 3.5,
    borderRadius: 2,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    overflow: "hidden",
  },
  indicatorFill: {
    height: "100%",
    borderRadius: 2,
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
