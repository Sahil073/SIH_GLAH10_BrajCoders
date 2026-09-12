import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { useAiRisk } from "@/store/aiStore";
import { useTheme } from "@/store/themeStore";
import { useDashboardData } from "@/hooks/useDashboardData";
import {
  HeartIcon,
  SunIcon,
  LungsIcon,
  WalkingIcon,
  TrendChartIcon,
} from "@/components/common/AppIcons";

interface WellnessDashboardProps {
  onSwitchToCharts?: () => void;
}

export const WellnessDashboard: React.FC<WellnessDashboardProps> = ({
  onSwitchToCharts,
}) => {
  const { colors, isDark } = useTheme();
  const ai = useAiRisk();
  const { data } = useDashboardData();

  // Helper to map risk levels to colors & scores
  const getRiskColor = (level: "NORMAL" | "CAUTION" | "RISK") => {
    switch (level) {
      case "RISK":
        return "#EF4444";
      case "CAUTION":
        return "#F59E0B";
      default:
        return "#10B981";
    }
  };

  const getRiskScore = (level: "NORMAL" | "CAUTION" | "RISK") => {
    switch (level) {
      case "RISK":
        return 88;
      case "CAUTION":
        return 52;
      default:
        return 14;
    }
  };

  const renderCategoryIcon = (id: string, color: string) => {
    switch (id) {
      case "cardiac":
        return <HeartIcon size={22} color={color} />;
      case "heat":
        return <SunIcon size={22} color={color} />;
      case "respiratory":
        return <LungsIcon size={22} color={color} />;
      case "fall":
        return <WalkingIcon size={22} color={color} />;
      default:
        return <HeartIcon size={22} color={color} />;
    }
  };

  const categories = [
    {
      id: "cardiac",
      name: "Cardiac Health",
      level: ai.risks.cardiac.level,
      score: getRiskScore(ai.risks.cardiac.level),
      color: getRiskColor(ai.risks.cardiac.level),
      plainLanguage:
        ai.risks.cardiac.level === "NORMAL"
          ? "Resting heart rate in baseline range (64-78 bpm). No arrhythmia detected."
          : ai.risks.cardiac.level === "CAUTION"
          ? "Slightly elevated resting pulse. Stay hydrated and rest."
          : "Elevated tachycardia detected. Cease heavy labor.",
    },
    {
      id: "heat",
      name: "Heat Strain",
      level: ai.risks.heat.level,
      score: getRiskScore(ai.risks.heat.level),
      color: getRiskColor(ai.risks.heat.level),
      plainLanguage:
        ai.risks.heat.level === "NORMAL"
          ? "Skin temperature normal (35.6°C). Thermal stress index low."
          : ai.risks.heat.level === "CAUTION"
          ? "Warm ambient exposure detected. Drink water every 20 minutes."
          : "Heat exhaustion threshold reached. Seek immediate shade.",
    },
    {
      id: "respiratory",
      name: "Respiratory & AQI",
      level: ai.risks.respiratory.level,
      score: getRiskScore(ai.risks.respiratory.level),
      color: getRiskColor(ai.risks.respiratory.level),
      plainLanguage:
        ai.risks.respiratory.level === "NORMAL"
          ? "Oxygen saturation steady at 98%. Ambient dust exposure within limits."
          : ai.risks.respiratory.level === "CAUTION"
          ? "Moderate PM2.5 detected outdoors. Consider wearing an N95 mask."
          : "Severe particulate matter alert. SpO2 dip detected.",
    },
    {
      id: "fall",
      name: "Posture & Stability",
      level: ai.risks.fall.detected ? "RISK" : "NORMAL",
      score: ai.risks.fall.detected ? 95 : 8,
      color: ai.risks.fall.detected ? "#EF4444" : "#10B981",
      plainLanguage: ai.risks.fall.detected
        ? "Impact detected! Immobilization timer active."
        : "Stable gait and posture. No fall or sudden impact incidents.",
    },
  ];

  return (
    <View style={styles.container}>
      {/* 1. DAILY WELLNESS SUMMARY CARD */}
      <View
        style={[
          styles.summaryCard,
          { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
        ]}
      >
        <View style={styles.summaryHeaderRow}>
          <View style={styles.summaryBadge}>
            <Text style={styles.summaryBadgeText}>TODAY'S WELLNESS REPORT</Text>
          </View>
          <Text style={[styles.summaryTimeText, { color: colors.textMuted }]}>
            On-Device Engine • 9:41 AM
          </Text>
        </View>

        <Text style={[styles.summaryHeadline, { color: colors.textPrimary }]}>
          "Today was a stable, low-stress day. Your resting heart rate stayed close to your healthy baseline."
        </Text>

        <View style={styles.summaryStatsRow}>
          <View style={styles.statPill}>
            <Text style={styles.statPillLabel}>Avg Heart Rate</Text>
            <Text style={[styles.statPillValue, { color: colors.textPrimary }]}>
              {data.heartRate.value > 0 ? `${Math.round(data.heartRate.value)} bpm` : "72 bpm"}
            </Text>
          </View>

          <View style={styles.statPill}>
            <Text style={styles.statPillLabel}>Blood Oxygen</Text>
            <Text style={[styles.statPillValue, { color: colors.textPrimary }]}>
              {data.spo2.value > 0 ? `${Math.round(data.spo2.value)}%` : "98%"}
            </Text>
          </View>

          <View style={styles.statPill}>
            <Text style={styles.statPillLabel}>Thermal Stress</Text>
            <Text style={[styles.statPillValue, { color: "#10B981" }]}>
              Minimal
            </Text>
          </View>
        </View>
      </View>

      {/* 2. FOUR CATEGORY RISK GAUGES */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Four Category Risk Gauges
        </Text>
        <Text style={[styles.sectionSub, { color: colors.textMuted }]}>
          Real-time on-device safety scoring
        </Text>
      </View>

      <View style={styles.gaugesGrid}>
        {categories.map((cat) => {
          const radius = 32;
          const strokeWidth = 6;
          const circumference = 2 * Math.PI * radius;
          const offset = circumference - (circumference * cat.score) / 100;

          return (
            <View
              key={cat.id}
              style={[
                styles.gaugeCard,
                { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
              ]}
            >
              <View style={styles.gaugeTopRow}>
                {/* SVG Ring Gauge */}
                <View style={styles.ringWrapper}>
                  <Svg width={76} height={76} viewBox="0 0 76 76">
                    <Circle
                      cx={38}
                      cy={38}
                      r={radius}
                      stroke="#E5E7EB"
                      strokeWidth={strokeWidth}
                      fill="none"
                    />
                    <Circle
                      cx={38}
                      cy={38}
                      r={radius}
                      stroke={cat.color}
                      strokeWidth={strokeWidth}
                      strokeDasharray={circumference}
                      strokeDashoffset={offset}
                      strokeLinecap="round"
                      fill="none"
                      transform="rotate(-90 38 38)"
                    />
                  </Svg>
                  <View style={styles.ringCenterTextWrap}>
                    {renderCategoryIcon(cat.id, cat.color)}
                  </View>
                </View>

                {/* Status and Title */}
                <View style={styles.gaugeInfo}>
                  <View style={styles.gaugeTitleRow}>
                    <Text
                      style={[styles.gaugeName, { color: colors.textPrimary }]}
                      numberOfLines={1}
                    >
                      {cat.name}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.levelBadge,
                      { backgroundColor: `${cat.color}18`, borderColor: `${cat.color}40` },
                    ]}
                  >
                    <View
                      style={[styles.levelDot, { backgroundColor: cat.color }]}
                    />
                    <Text style={[styles.levelText, { color: cat.color }]}>
                      {cat.level === "NORMAL" ? "SAFE / LOW RISK" : cat.level}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Plain-language explanation */}
              <View style={styles.explanationBox}>
                <Text style={[styles.explanationText, { color: colors.textSecondary }]}>
                  {cat.plainLanguage}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* 3. WEEKLY TREND SUMMARY */}
      <View
        style={[
          styles.weeklyCard,
          { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
        ]}
      >
        <View style={styles.weeklyHeader}>
          <View style={styles.weeklyIconWrap}>
            <TrendChartIcon size={20} color="#4F46E5" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.weeklyTitle, { color: colors.textPrimary }]}>
              Weekly Trend Summary
            </Text>
            <Text style={[styles.weeklySub, { color: colors.textMuted }]}>
              Past 7 Days Pattern Analysis
            </Text>
          </View>
        </View>

        <View style={styles.weeklyBullets}>
          <View style={styles.bulletRow}>
            <Text style={styles.bulletSymbol}>•</Text>
            <Text style={[styles.bulletText, { color: colors.textSecondary }]}>
              <Text style={{ fontWeight: "700", color: colors.textPrimary }}>
                Cardiac Baseline:{" "}
              </Text>
              Resting pulse improved by 3 bpm compared to last week. Steady circadian rhythm.
            </Text>
          </View>

          <View style={styles.bulletRow}>
            <Text style={styles.bulletSymbol}>•</Text>
            <Text style={[styles.bulletText, { color: colors.textSecondary }]}>
              <Text style={{ fontWeight: "700", color: colors.textPrimary }}>
                Heat Stress Exposure:{" "}
              </Text>
              2 brief heat advisories triggered on Tuesday & Thursday afternoon. Recovery time was under 18 minutes.
            </Text>
          </View>

          <View style={styles.bulletRow}>
            <Text style={styles.bulletSymbol}>•</Text>
            <Text style={[styles.bulletText, { color: colors.textSecondary }]}>
              <Text style={{ fontWeight: "700", color: colors.textPrimary }}>
                Air Quality Resilience:{" "}
              </Text>
              Average AQI exposure was 142 (Moderate). SpO2 maintained above 97% throughout.
            </Text>
          </View>
        </View>

        {onSwitchToCharts && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onSwitchToCharts}
            style={styles.exploreChartsButton}
          >
            <Text style={styles.exploreChartsText}>
              View Detailed 6-Metric Historical Charts ›
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  summaryCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  summaryHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  summaryBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  summaryBadgeText: {
    fontFamily: "Poppins-Bold",
    fontSize: 10,
    color: "#15803D",
    letterSpacing: 0.5,
  },
  summaryTimeText: {
    fontFamily: "Poppins-Medium",
    fontSize: 10.5,
  },
  summaryHeadline: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 14.5,
    lineHeight: 22,
    marginBottom: 14,
    fontStyle: "italic",
  },
  summaryStatsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 12,
  },
  statPill: {
    flex: 1,
  },
  statPillLabel: {
    fontFamily: "Poppins-Regular",
    fontSize: 11,
    color: "#9CA3AF",
  },
  statPillValue: {
    fontFamily: "Poppins-Bold",
    fontSize: 13.5,
    marginTop: 2,
  },
  sectionHeader: {
    marginBottom: 12,
    paddingHorizontal: 2,
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
  gaugesGrid: {
    gap: 12,
    marginBottom: 18,
  },
  gaugeCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  gaugeTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  ringWrapper: {
    width: 76,
    height: 76,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginRight: 14,
  },
  ringCenterTextWrap: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  gaugeInfo: {
    flex: 1,
  },
  gaugeTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  gaugeName: {
    fontFamily: "Poppins-Bold",
    fontSize: 14.5,
  },
  levelBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 10,
    borderWidth: 1,
  },
  levelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  levelText: {
    fontFamily: "Poppins-Bold",
    fontSize: 10,
    letterSpacing: 0.5,
  },
  explanationBox: {
    marginTop: 10,
    backgroundColor: "rgba(0, 0, 0, 0.02)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  explanationText: {
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    lineHeight: 17,
  },
  weeklyCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  weeklyHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  weeklyIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  weeklyTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: 15,
  },
  weeklySub: {
    fontFamily: "Poppins-Regular",
    fontSize: 11.5,
  },
  weeklyBullets: {
    gap: 10,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  bulletSymbol: {
    color: "#4F46E5",
    fontSize: 16,
    lineHeight: 18,
    marginRight: 8,
  },
  bulletText: {
    fontFamily: "Poppins-Regular",
    fontSize: 12.5,
    lineHeight: 18,
    flex: 1,
  },
  exploreChartsButton: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 12,
    alignItems: "center",
  },
  exploreChartsText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 12.5,
    color: "#4F46E5",
  },
});
