import React, { useState, useEffect, useMemo } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import { MetricType, TimeframeKey } from "@/types/dashboard";
import { getMetricDetail } from "@/data/metricDetailData";
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

interface MetricDetailModalProps {
  visible: boolean;
  metricType: MetricType | null;
  onClose: () => void;
}

/**
 * Returns icon for the status pill based on metric type
 */
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

export function MetricDetailModal({
  visible,
  metricType,
  onClose,
}: MetricDetailModalProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeframeKey>("Hourly");
  const [liveInspectedValue, setLiveInspectedValue] = useState<number | string | null>(null);
  const [liveHourlyValues, setLiveHourlyValues] = useState<number[]>([]);

  // Base detail derived purely from metricType
  const baseDetail = useMemo(
    () => (metricType ? getMetricDetail(metricType) : null),
    [metricType]
  );

  // Reset inspected value and live values when metric changes or modal opens
  const handleClose = () => {
    setLiveInspectedValue(null);
    setSelectedTimeframe("Hourly");
    onClose();
  };

  // Per-minute dynamic data update simulation (SQLite / BLE sensor streaming point)
  useEffect(() => {
    if (!visible || !metricType || !baseDetail) return;

    // Simulation tick: appends live sensor values every 60 seconds
    const interval = setInterval(() => {
      setLiveHourlyValues((prev) => {
        const baseValues = baseDetail.timeframes.Hourly.values;
        const currentList = prev.length > 0 ? prev : baseValues;
        const lastVal = currentList[currentList.length - 1] ?? 70;
        const delta = (Math.random() - 0.48) * (metricType === "activity" ? 25 : 1.5);
        const newVal = Math.round((lastVal + delta) * 10) / 10;
        return [...currentList.slice(1), newVal];
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [visible, metricType, baseDetail]);

  if (!visible || !metricType || !baseDetail) {
    return null;
  }

  const detail = baseDetail;
  const rawTimeframe = detail.timeframes[selectedTimeframe];
  // If hourly and we have live streamed values, use them
  const values =
    selectedTimeframe === "Hourly" && liveHourlyValues.length > 0
      ? liveHourlyValues
      : rawTimeframe.values;

  // Dynamically compute summary stats from the active values
  const sum = values.reduce((a, b) => a + b, 0);
  const average = Math.round((sum / values.length) * 10) / 10;
  const minimum = Math.round(Math.min(...values) * 10) / 10;
  const maximum = Math.round(Math.max(...values) * 10) / 10;

  const displayValue =
    liveInspectedValue !== null
      ? liveInspectedValue
      : selectedTimeframe === "Hourly" && liveHourlyValues.length > 0
      ? liveHourlyValues[liveHourlyValues.length - 1]
      : detail.currentValue;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Header Bar: Back Button & Notification Bell */}
          <View className="flex-row items-center justify-between px-6 pt-2 pb-5">
            {/* Circular Back Button */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleClose}
              className="w-11 h-11 rounded-full bg-white items-center justify-center border border-[#EDE9E2] shadow-xs"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M15 19L8 12L15 5"
                  stroke="#161616"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>

            {/* Circular Bell Button */}
            <TouchableOpacity
              activeOpacity={0.7}
              className="w-11 h-11 rounded-full bg-white items-center justify-center border border-[#EDE9E2] shadow-xs"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <BellIcon size={18} color="#161616" />
            </TouchableOpacity>
          </View>

          {/* Metric Title */}
          <View className="px-6 mb-2">
            <Text className="font-poppins-bold text-[32px] text-[#161616] leading-tight">
              {detail.title}
            </Text>
          </View>

          {/* Current Value & Status Pill Row */}
          <View className="flex-row items-center justify-between px-6 mb-6">
            {/* Big Value + Unit */}
            <View className="flex-row items-baseline">
              <Text className="font-poppins-bold text-[44px] text-[#161616] leading-none">
                {displayValue}
              </Text>
              <Text className="font-poppins-regular text-[13px] text-[#86837C] ml-2">
                {detail.unit}
              </Text>
            </View>

            {/* Status Pill Badge matching reference design */}
            <View className="bg-[#D4F056] rounded-full pl-1 pr-3.5 py-1 flex-row items-center">
              <View className="w-6 h-6 rounded-full bg-[#161616] items-center justify-center mr-1.5">
                {getMetricPillIcon(metricType)}
              </View>
              <Text className="font-poppins-semibold text-[12px] text-[#161616]">
                {detail.statusLabel}
              </Text>
            </View>
          </View>

          {/* Interactive Chart with Y-Axis, Curve, Gradient Fill & Scrubber */}
          <View className="px-5 mb-6">
            <InteractiveDetailChart
              values={values}
              timestamps={rawTimeframe.timestamps}
              yAxisLabels={detail.yAxisLabels}
              initialSelectedIndex={rawTimeframe.selectedIndex}
              onPointSelected={(_idx, val) => {
                setLiveInspectedValue(val);
              }}
              height={190}
            />
          </View>

          {/* Summary Stats Card (3 Columns: Average, Minimum, Maximum) */}
          <View className="mx-6 bg-transparent border-t border-b border-[#EAE6DF] py-5 my-2">
            <View className="flex-row items-center justify-between">
              {/* Average Column */}
              <View className="flex-1 items-center">
                <Text className="font-poppins-medium text-[12px] text-[#86837C]">
                  Average
                </Text>
                <Text className="font-poppins-bold text-[28px] text-[#161616] leading-none my-1">
                  {average}
                </Text>
                <Text className="font-poppins-regular text-[11px] text-[#86837C] uppercase">
                  {detail.unit}
                </Text>
              </View>

              {/* Vertical Divider */}
              <View className="w-[1px] h-10 bg-[#EAE6DF]" />

              {/* Minimum Column */}
              <View className="flex-1 items-center">
                <Text className="font-poppins-medium text-[12px] text-[#86837C]">
                  Minimum
                </Text>
                <Text className="font-poppins-bold text-[28px] text-[#161616] leading-none my-1">
                  {minimum}
                </Text>
                <Text className="font-poppins-regular text-[11px] text-[#86837C] uppercase">
                  {detail.unit}
                </Text>
              </View>

              {/* Vertical Divider */}
              <View className="w-[1px] h-10 bg-[#EAE6DF]" />

              {/* Maximum Column */}
              <View className="flex-1 items-center">
                <Text className="font-poppins-medium text-[12px] text-[#86837C]">
                  Maximum
                </Text>
                <Text className="font-poppins-bold text-[28px] text-[#161616] leading-none my-1">
                  {maximum}
                </Text>
                <Text className="font-poppins-regular text-[11px] text-[#86837C] uppercase">
                  {detail.unit}
                </Text>
              </View>
            </View>
          </View>

          {/* Bottom Timeframe Capsule Selector: Hourly | Daily | Monthly | Yearly */}
          <View className="mx-6 mt-6 mb-8">
            <View className="bg-[#EDEAE3] rounded-full p-1.5 flex-row items-center justify-between">
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
                      className={`flex-1 items-center justify-center py-2.5 rounded-full ${
                        isActive ? "bg-[#161616] shadow-xs" : "bg-transparent"
                      }`}
                    >
                      <Text
                        className={`text-[12px] ${
                          isActive
                            ? "font-poppins-semibold text-white"
                            : "font-poppins-medium text-[#86837C]"
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F7F5F0",
  },
  scrollContent: {
    paddingBottom: 40,
  },
});
