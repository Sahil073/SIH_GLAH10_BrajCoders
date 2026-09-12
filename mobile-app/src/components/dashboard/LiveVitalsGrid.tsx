import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Svg, { Path, Circle } from "react-native-svg";
import { MetricType } from "@/types/dashboard";
import { useLanguage } from "@/i18n/languages";

interface LiveVitalsGridProps {
  heartRate: number;
  moisture: number;
  temperature: number;
  aqi: number;
  isConnected: boolean;
  onSelectMetric?: (metric: MetricType) => void;
}

export function LiveVitalsGrid({
  heartRate,
  moisture,
  temperature,
  aqi,
  isConnected,
  onSelectMetric,
}: LiveVitalsGridProps) {
  const { t } = useLanguage();
  const hrVal = heartRate > 0 ? `${Math.round(heartRate)}` : "--";
  const moistVal = moisture > 0 ? `${Math.round(moisture)}%` : "--";
  const tempVal = temperature > 0 ? `${temperature.toFixed(1)}°C` : "--";
  const aqiVal = aqi > 0 ? `${Math.round(aqi)}` : "--";

  const vitals = [
    {
      key: "heart_rate" as MetricType,
      title: t("heartRate"),
      value: hrVal,
      unit: t("bpm"),
      status: heartRate > 100 ? t("high") : heartRate >= 55 ? t("normal") : t("resting"),
      statusColor: heartRate > 100 ? "#DC2626" : "#16A34A",
      bgColor: "#FFF5F5",
      borderColor: "#FED7D7",
      iconColor: "#E11D48",
      renderIcon: () => (
        <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
            fill="#E11D48"
          />
        </Svg>
      ),
    },
    {
      key: "moisture" as MetricType,
      title: t("skinMoisture"),
      value: moistVal,
      unit: "%",
      status: moisture > 75 ? t("high") : moisture >= 25 ? t("optimal") : moisture > 0 ? t("dry") : t("normal"),
      statusColor: moisture > 75 ? "#D97706" : moisture >= 25 ? "#0D9488" : "#64748B",
      bgColor: "#F0FDFA",
      borderColor: "#99F6E4",
      iconColor: "#0D9488",
      renderIcon: () => (
        <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"
            fill="#0D9488"
          />
        </Svg>
      ),
    },
    {
      key: "temperature" as MetricType,
      title: t("temperature"),
      value: tempVal,
      unit: t("skin"),
      status: temperature > 38 ? t("fever") : t("comfortable"),
      statusColor: temperature > 38 ? "#DC2626" : "#D97706",
      bgColor: "#FFFBEB",
      borderColor: "#FDE68A",
      iconColor: "#D97706",
      renderIcon: () => (
        <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <Path
            d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"
            fill="#D97706"
          />
        </Svg>
      ),
    },
    {
      key: "aqi" as MetricType,
      title: t("airQuality"),
      value: aqiVal,
      unit: "AQI",
      status: aqi <= 50 ? t("optimal") : aqi <= 100 ? t("normal") : t("high"),
      statusColor: aqi > 100 ? "#DC2626" : "#059669",
      bgColor: "#ECFDF5",
      borderColor: "#A7F3D0",
      iconColor: "#059669",
      renderIcon: () => (
        <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <Path
            d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z"
            fill="#059669"
          />
        </Svg>
      ),
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Live Vital Readings</Text>
        <Text style={styles.secondaryNote}>
          {isConnected ? "Live Stream (BLE)" : "Cached Baseline"}
        </Text>
      </View>

      <View style={styles.grid}>
        {vitals.map((v) => (
          <TouchableOpacity
            key={v.key}
            activeOpacity={0.8}
            onPress={() => onSelectMetric && onSelectMetric(v.key)}
            style={[
              styles.vitalCard,
              { backgroundColor: v.bgColor, borderColor: v.borderColor },
            ]}
          >
            <View style={styles.cardTopRow}>
              <View style={styles.iconCircle}>{v.renderIcon()}</View>
              <View
                style={[
                  styles.statusTag,
                  { backgroundColor: "#FFFFFF", borderColor: v.borderColor },
                ]}
              >
                <Text style={[styles.statusTagText, { color: v.statusColor }]}>
                  {v.status}
                </Text>
              </View>
            </View>

            <Text style={styles.cardTitle}>{v.title}</Text>

            <View style={styles.valueRow}>
              <Text style={styles.cardValue}>{v.value}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: 16,
    color: "#161616",
  },
  secondaryNote: {
    fontFamily: "Poppins-Medium",
    fontSize: 11,
    color: "#8A9A90",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  vitalCard: {
    width: "48.5%",
    borderRadius: 22,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1.5,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statusTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 0.8,
  },
  statusTagText: {
    fontFamily: "Poppins-Bold",
    fontSize: 9.5,
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
  cardTitle: {
    fontFamily: "Poppins-Medium",
    fontSize: 12,
    color: "#607469",
    marginBottom: 2,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  cardValue: {
    fontFamily: "Poppins-Bold",
    fontSize: 22,
    lineHeight: 26,
    color: "#101C16",
  },
});
