// =============================================================================
// src/components/dashboard/MetricDetailModal.tsx
// Displays real-time dynamic biometric details, historical trend from SQLite,
// live BLE packet updates, and interactive scrubber for each health card.
// Replaces static mock data with 100% dynamic sensor telemetry.
// =============================================================================

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import { MetricType, TimeframeKey } from "@/types/dashboard";
import { InteractiveDetailChart } from "@/components/dashboard/InteractiveDetailChart";
import {
  HeartPulseIcon,
  DropletIcon,
  ThermometerIcon,
  CloudIcon,
  MoistureIcon,
  WalkingPersonIcon,
  BellIcon,
} from "@/components/dashboard/ModernDashboardIcons";

import { useDashboardData } from "@/hooks/useDashboardData";
import { useBle } from "@/ble";
import { useAiRisk } from "@/store/aiStore";
import { useUserProfile } from "@/store/userProfileStore";
import { useTheme } from "@/store/themeStore";
import { fetchSensorHistory } from "@/database";
import { SensorId, Esp32Packet } from "@/ble/types";
import { bleService } from "@/ble/bleManager";

interface MetricDetailModalProps {
  visible: boolean;
  metricType: MetricType | null;
  onClose: () => void;
}

interface MetricMetaConfig {
  title: string;
  unit: string;
  dbSensorType: string;
  defaultYAxis: (number | string)[];
  pillBgColor: string;
}

const METRIC_CONFIGS: Record<MetricType, MetricMetaConfig> = {
  heart_rate: {
    title: "Heart rate",
    unit: "BPM",
    dbSensorType: "HR",
    defaultYAxis: [120, 100, 80, 60, 40],
    pillBgColor: "#EF4444",
  },
  spo2: {
    title: "Blood Oxygen",
    unit: "%",
    dbSensorType: "SpO2",
    defaultYAxis: [100, 98, 96, 94, 92],
    pillBgColor: "#0284C7",
  },
  temperature: {
    title: "Body Temperature",
    unit: "°C",
    dbSensorType: "TEMP",
    defaultYAxis: [40, 38, 36, 34],
    pillBgColor: "#F59E0B",
  },
  aqi: {
    title: "Air Quality Index",
    unit: "AQI",
    dbSensorType: "AQI",
    defaultYAxis: [150, 100, 50, 0],
    pillBgColor: "#8B5CF6",
  },
  moisture: {
    title: "Skin Moisture",
    unit: "%",
    dbSensorType: "HUMIDITY",
    defaultYAxis: [100, 75, 50, 25, 0],
    pillBgColor: "#0D9488",
  },
  activity: {
    title: "Step Activity",
    unit: "steps",
    dbSensorType: "STEPS",
    defaultYAxis: [10000, 7500, 5000, 2500, 0],
    pillBgColor: "#16A34A",
  },
};

function getMetricPillIcon(type: MetricType) {
  switch (type) {
    case "heart_rate":
      return <HeartPulseIcon size={13} color="#FFFFFF" />;
    case "spo2":
      return <DropletIcon size={13} color="#FFFFFF" />;
    case "temperature":
      return <ThermometerIcon size={13} color="#FFFFFF" />;
    case "aqi":
      return <CloudIcon size={13} color="#FFFFFF" />;
    case "moisture":
      return <MoistureIcon size={13} color="#FFFFFF" />;
    case "activity":
      return <WalkingPersonIcon size={13} color="#FFFFFF" />;
    default:
      return <HeartPulseIcon size={13} color="#FFFFFF" />;
  }
}

function normalizeMetricType(type: any): MetricType | null {
  if (!type) return null;
  if (type === "heartRate" || type === "heart_rate" || type === "hr") return "heart_rate";
  if (type === "spo2" || type === "oximeter") return "spo2";
  if (type === "temperature" || type === "temp") return "temperature";
  if (type === "aqi" || type === "airQuality") return "aqi";
  if (type === "moisture" || type === "humidity") return "moisture";
  if (type === "activity" || type === "steps") return "activity";
  return type as MetricType;
}

export function MetricDetailModal({
  visible,
  metricType: rawMetricType,
  onClose,
}: MetricDetailModalProps) {
  const metricType = normalizeMetricType(rawMetricType);
  const { colors, isDark } = useTheme();
  const { activeUserId } = useUserProfile();
  const { data } = useDashboardData();
  const { connectionStatus, sensorData } = useBle();
  const ai = useAiRisk();

  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeframeKey>("Hourly");
  const [liveInspectedValue, setLiveInspectedValue] = useState<number | string | null>(null);
  const [dynamicValues, setDynamicValues] = useState<number[]>([]);
  const [dynamicTimestamps, setDynamicTimestamps] = useState<string[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(true);

  const isConnected = connectionStatus === "connected";
  const config = metricType ? METRIC_CONFIGS[metricType] : null;

  // Resolve current dynamic value based on incoming data packets
  const dynamicCurrentValue = useMemo(() => {
    if (!metricType) return "—";

    switch (metricType) {
      case "heart_rate": {
        if (ai.heartRate && ai.heartRate > 0) return Math.round(ai.heartRate);
        if (data.heartRate.value > 0) return data.heartRate.value;
        return dynamicValues.length > 0 ? dynamicValues[dynamicValues.length - 1] : "—";
      }
      case "spo2": {
        if (data.spo2.value > 0) return data.spo2.value;
        return dynamicValues.length > 0 ? dynamicValues[dynamicValues.length - 1] : "—";
      }
      case "temperature": {
        if (sensorData.dht.temperature > 0) return Number(sensorData.dht.temperature.toFixed(1));
        if (data.temperature.value > 0) return data.temperature.value;
        return dynamicValues.length > 0 ? dynamicValues[dynamicValues.length - 1] : "—";
      }
      case "aqi": {
        if (data.aqi.value > 0) return data.aqi.value;
        return dynamicValues.length > 0 ? dynamicValues[dynamicValues.length - 1] : "—";
      }
      case "moisture": {
        if (data.moisture.value > 0) return data.moisture.value;
        return dynamicValues.length > 0 ? dynamicValues[dynamicValues.length - 1] : "—";
      }
      case "activity": {
        if (data.activity.steps > 0) return data.activity.steps;
        return dynamicValues.length > 0 ? dynamicValues[dynamicValues.length - 1] : "—";
      }
      default:
        return "—";
    }
  }, [metricType, ai.heartRate, data, sensorData, dynamicValues]);

  // Compute dynamic clinical status
  const dynamicStatusLabel = useMemo(() => {
    if (dynamicCurrentValue === "—") return isConnected ? "Measuring..." : "No Data";

    const num = typeof dynamicCurrentValue === "number" ? dynamicCurrentValue : parseFloat(String(dynamicCurrentValue));
    if (isNaN(num)) return "Normal";

    switch (metricType) {
      case "heart_rate":
        if (num > 100) return "Elevated";
        if (num < 55) return "Low";
        return "Normal";
      case "spo2":
        if (num < 95) return "Caution";
        return "Optimal";
      case "temperature":
        if (num > 37.8) return "Elevated";
        return "Normal";
      case "aqi":
        if (num > 100) return "Hazardous";
        if (num > 50) return "Moderate";
        return "Good";
      case "moisture":
        return "Normal";
      case "activity":
        return "Active";
      default:
        return "Normal";
    }
  }, [dynamicCurrentValue, metricType, isConnected]);

  // Load real history from SQLite whenever modal opens or metric changes
  useEffect(() => {
    if (!visible || !metricType || !config) return;

    let isMounted = true;
    setIsLoadingHistory(true);
    setLiveInspectedValue(null);

    fetchSensorHistory(config.dbSensorType, 20, activeUserId)
      .then((rows) => {
        if (!isMounted) return;
        if (rows && rows.length > 0) {
          const vals = rows.map((r) => r.value);
          const tss = rows.map((r) => {
            const d = new Date(r.timestamp);
            return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          });
          setDynamicValues(vals);
          setDynamicTimestamps(tss);
        } else {
          setDynamicValues([]);
          setDynamicTimestamps([]);
        }
        setIsLoadingHistory(false);
      })
      .catch((err) => {
        console.warn("[MetricDetailModal] Failed to load sensor history:", err);
        if (isMounted) {
          setDynamicValues([]);
          setDynamicTimestamps([]);
          setIsLoadingHistory(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [visible, metricType, activeUserId]);

  // Live BLE packet subscription: appends new incoming data point in real time
  useEffect(() => {
    if (!visible || !metricType || !config) return;

    const unsubscribe = bleService.addPacketListener((packet: Esp32Packet) => {
      let incomingVal: number | null = null;

      if (metricType === "heart_rate" && packet.sensor === SensorId.EXG) {
        if (ai.heartRate && ai.heartRate > 0) incomingVal = Math.round(ai.heartRate);
      } else if (metricType === "temperature" && packet.sensor === SensorId.DHT11) {
        if (packet.data.temperature > 0) incomingVal = Number(packet.data.temperature.toFixed(1));
      } else if (metricType === "aqi" && packet.sensor === SensorId.MQ135) {
        if (packet.data.raw > 0) {
          incomingVal = Math.max(15, Math.min(500, Math.round((packet.data.raw / 3800) * 160)));
        }
      } else if (metricType === "moisture" && packet.sensor === SensorId.SOIL_MOISTURE) {
        if (packet.data.raw > 0) {
          incomingVal = Math.max(0, Math.min(100, Math.round((packet.data.raw / 4095) * 100)));
        }
      }

      if (incomingVal !== null && Number.isFinite(incomingVal)) {
        const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        setDynamicValues((prev) => [...prev.slice(-24), incomingVal!]);
        setDynamicTimestamps((prev) => [...prev.slice(-24), timeStr]);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [visible, metricType, config, ai.heartRate]);

  const handleClose = () => {
    setLiveInspectedValue(null);
    setSelectedTimeframe("Hourly");
    onClose();
  };

  if (!visible || !metricType || !config) {
    return null;
  }

  // Calculate real statistical metrics
  const hasValues = dynamicValues.length > 0;
  const average = hasValues
    ? Math.round((dynamicValues.reduce((a, b) => a + b, 0) / dynamicValues.length) * 10) / 10
    : "—";
  const minimum = hasValues ? Math.round(Math.min(...dynamicValues) * 10) / 10 : "—";
  const maximum = hasValues ? Math.round(Math.max(...dynamicValues) * 10) / 10 : "—";

  const displayValue = liveInspectedValue !== null ? liveInspectedValue : dynamicCurrentValue;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Header Bar: Back Button & Live Pulse */}
          <View className="flex-row items-center justify-between px-6 pt-2 pb-5">
            {/* Circular Back Button */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleClose}
              style={{
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
              }}
              className="w-11 h-11 rounded-full items-center justify-center border shadow-xs"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M15 19L8 12L15 5"
                  stroke={colors.textPrimary}
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>

            {/* Live Telemetry Indicator Badge */}
            <View
              style={{
                backgroundColor: isConnected ? (isDark ? "#122A1A" : "#ECFDF5") : colors.backgroundSecondary,
                borderColor: isConnected ? "#10B981" : colors.cardBorder,
              }}
              className="px-3 py-1.5 rounded-full border flex-row items-center gap-1.5"
            >
              <View
                className={`w-2 h-2 rounded-full ${
                  isConnected ? "bg-emerald-500 animate-pulse" : "bg-gray-400"
                }`}
              />
              <Text
                style={{ color: isConnected ? "#16A34A" : colors.textMuted }}
                className="font-poppins-semibold text-[11px]"
              >
                {isConnected ? "Live Telemetry" : "Stored SQLite"}
              </Text>
            </View>
          </View>

          {/* Metric Title */}
          <View className="px-6 mb-2">
            <Text
              style={{ color: colors.textPrimary }}
              className="font-poppins-bold text-[32px] leading-tight"
            >
              {config.title}
            </Text>
          </View>

          {/* Current Value & Status Pill Row */}
          <View className="flex-row items-center justify-between px-6 mb-6">
            {/* Big Value + Unit */}
            <View className="flex-row items-baseline">
              <Text
                style={{ color: colors.textPrimary }}
                className="font-poppins-bold text-[44px] leading-none"
              >
                {displayValue}
              </Text>
              {displayValue !== "—" && (
                <Text
                  style={{ color: colors.textSecondary }}
                  className="font-poppins-regular text-[13px] ml-2"
                >
                  {config.unit}
                </Text>
              )}
            </View>

            {/* Status Pill Badge */}
            <View
              style={{
                backgroundColor: isDark ? colors.backgroundSecondary : "#D4F056",
                borderColor: colors.cardBorder,
              }}
              className="rounded-full pl-1 pr-3.5 py-1 flex-row items-center border"
            >
              <View
                style={{ backgroundColor: config.pillBgColor }}
                className="w-6 h-6 rounded-full items-center justify-center mr-1.5"
              >
                {getMetricPillIcon(metricType)}
              </View>
              <Text
                style={{ color: isDark ? colors.textPrimary : "#161616" }}
                className="font-poppins-semibold text-[12px]"
              >
                {dynamicStatusLabel}
              </Text>
            </View>
          </View>

          {/* Interactive Chart with Dynamic Data Points */}
          <View className="px-5 mb-6">
            {isLoadingHistory ? (
              <View
                style={{
                  height: 190,
                  backgroundColor: colors.cardBg,
                  borderColor: colors.cardBorder,
                }}
                className="rounded-2xl border items-center justify-center"
              >
                <ActivityIndicator size="small" color={colors.textPrimary} />
                <Text
                  style={{ color: colors.textMuted }}
                  className="font-poppins-medium text-xs mt-2"
                >
                  Loading user readings...
                </Text>
              </View>
            ) : (
              <InteractiveDetailChart
                values={dynamicValues}
                timestamps={
                  dynamicTimestamps.length > 0
                    ? dynamicTimestamps
                    : ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"]
                }
                yAxisLabels={config.defaultYAxis}
                initialSelectedIndex={Math.max(0, dynamicValues.length - 1)}
                onPointSelected={(_idx, val) => {
                  setLiveInspectedValue(val);
                }}
                height={190}
              />
            )}
          </View>

          {/* Summary Stats Card (3 Columns: Average, Minimum, Maximum) */}
          <View
            style={{ borderColor: colors.divider }}
            className="mx-6 border-t border-b py-5 my-2"
          >
            <View className="flex-row items-center justify-between">
              {/* Average Column */}
              <View className="flex-1 items-center">
                <Text
                  style={{ color: colors.textSecondary }}
                  className="font-poppins-medium text-[12px]"
                >
                  Average
                </Text>
                <Text
                  style={{ color: colors.textPrimary }}
                  className="font-poppins-bold text-[28px] leading-none my-1"
                >
                  {average}
                </Text>
                {average !== "—" && (
                  <Text
                    style={{ color: colors.textMuted }}
                    className="font-poppins-regular text-[11px] uppercase"
                  >
                    {config.unit}
                  </Text>
                )}
              </View>

              {/* Vertical Divider */}
              <View style={{ backgroundColor: colors.divider }} className="w-[1px] h-10" />

              {/* Minimum Column */}
              <View className="flex-1 items-center">
                <Text
                  style={{ color: colors.textSecondary }}
                  className="font-poppins-medium text-[12px]"
                >
                  Minimum
                </Text>
                <Text
                  style={{ color: colors.textPrimary }}
                  className="font-poppins-bold text-[28px] leading-none my-1"
                >
                  {minimum}
                </Text>
                {minimum !== "—" && (
                  <Text
                    style={{ color: colors.textMuted }}
                    className="font-poppins-regular text-[11px] uppercase"
                  >
                    {config.unit}
                  </Text>
                )}
              </View>

              {/* Vertical Divider */}
              <View style={{ backgroundColor: colors.divider }} className="w-[1px] h-10" />

              {/* Maximum Column */}
              <View className="flex-1 items-center">
                <Text
                  style={{ color: colors.textSecondary }}
                  className="font-poppins-medium text-[12px]"
                >
                  Maximum
                </Text>
                <Text
                  style={{ color: colors.textPrimary }}
                  className="font-poppins-bold text-[28px] leading-none my-1"
                >
                  {maximum}
                </Text>
                {maximum !== "—" && (
                  <Text
                    style={{ color: colors.textMuted }}
                    className="font-poppins-regular text-[11px] uppercase"
                  >
                    {config.unit}
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Timeframe Capsule Selector: Hourly | Daily | Monthly | Yearly */}
          <View className="mx-6 mt-6 mb-8">
            <View
              style={{
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.cardBorder,
              }}
              className="rounded-full p-1.5 flex-row items-center justify-between border"
            >
              {(["Hourly", "Daily", "Monthly", "Yearly"] as TimeframeKey[]).map(
                (timeframe) => {
                  const isActive = selectedTimeframe === timeframe;
                  return (
                    <TouchableOpacity
                      key={timeframe}
                      activeOpacity={0.7}
                      onPress={() => {
                        setSelectedTimeframe(timeframe);
                        setLiveInspectedValue(null);
                      }}
                      style={{
                        backgroundColor: isActive ? colors.textPrimary : "transparent",
                      }}
                      className="flex-1 items-center justify-center py-2.5 rounded-full"
                    >
                      <Text
                        style={{
                          color: isActive
                            ? isDark ? "#121212" : "#FFFFFF"
                            : colors.textSecondary,
                        }}
                        className={`text-[12px] ${
                          isActive ? "font-poppins-semibold" : "font-poppins-medium"
                        }`}
                      >
                        {timeframe}
                      </Text>
                    </TouchableOpacity>
                  );
                }
              )}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
