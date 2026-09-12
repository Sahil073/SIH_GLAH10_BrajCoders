import React, { useState, useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  generateDayHistory,
  generateWeekHistory,
  generateMonthHistory,
  METRIC_CONFIGS,
  MetricKey,
} from "@/data/mockHistoryData";
import { MultiMetricVitalsChart } from "@/components/history/MultiMetricVitalsChart";
import { CalendarPickerModal } from "@/components/history/CalendarPickerModal";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarDaysIcon,
} from "@/components/history/HistoryIcons";
import {
  HeartPulseAlertIcon,
  Spo2AlertIcon,
  TempAlertIcon,
  AqiAlertIcon,
  HumidityAlertIcon,
} from "@/components/alerts/AlertIcons";
import { WalkingPersonIcon } from "@/components/dashboard/ModernDashboardIcons";

type PeriodTab = "day" | "week" | "month";

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export default function HistoryScreen() {
  const [period, setPeriod] = useState<PeriodTab>("day");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(2025, 4, 23)); // 23 May 2025 matching the user reference image
  const [calendarVisible, setCalendarVisible] = useState<boolean>(false);

  // Load dataset based on selected period and date
  const dataset = useMemo(() => {
    switch (period) {
      case "week":
        return generateWeekHistory(selectedDate);
      case "month":
        return generateMonthHistory(selectedDate);
      case "day":
      default:
        return generateDayHistory(selectedDate);
    }
  }, [period, selectedDate]);

  // Navigate date backwards/forwards
  const handlePrevDate = () => {
    const next = new Date(selectedDate);
    if (period === "day") {
      next.setDate(next.getDate() - 1);
    } else if (period === "week") {
      next.setDate(next.getDate() - 7);
    } else {
      next.setMonth(next.getMonth() - 1);
    }
    setSelectedDate(next);
  };

  const handleNextDate = () => {
    const next = new Date(selectedDate);
    if (period === "day") {
      next.setDate(next.getDate() + 1);
    } else if (period === "week") {
      next.setDate(next.getDate() + 7);
    } else {
      next.setMonth(next.getMonth() + 1);
    }
    setSelectedDate(next);
  };

  // Formatted date string matching the reference image "< 23 May 2025 >"
  const formattedDateLabel = useMemo(() => {
    const day = selectedDate.getDate();
    const month = MONTH_NAMES[selectedDate.getMonth()];
    const year = selectedDate.getFullYear();

    if (period === "day") {
      return `${day} ${month} ${year}`;
    }
    if (period === "week") {
      const end = new Date(selectedDate);
      end.setDate(end.getDate() + 6);
      return `${day} ${month} - ${end.getDate()} ${MONTH_NAMES[end.getMonth()]} ${year}`;
    }
    return `${month} ${year}`;
  }, [selectedDate, period]);

  // Metric icon helper
  const renderMetricIcon = (key: MetricKey, color: string) => {
    switch (key) {
      case "hr":
        return <HeartPulseAlertIcon size={18} color={color} />;
      case "spo2":
        return <Spo2AlertIcon size={18} color={color} />;
      case "temp":
        return <TempAlertIcon size={18} color={color} />;
      case "aqi":
        return <AqiAlertIcon size={18} color={color} />;
      case "moisture":
        return <HumidityAlertIcon size={18} color={color} />;
      case "steps":
        return <WalkingPersonIcon size={18} color={color} />;
    }
  };

  const allKeys: MetricKey[] = ["hr", "spo2", "temp", "aqi", "moisture", "steps"];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F7F5F0" }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 16 }}
        showsVerticalScrollIndicator={false}
        className="px-5"
      >
        {/* Top Period Segmented Switcher (Day | Week | Month) matching reference image */}
        <View className="bg-white/80 rounded-2xl p-1 border border-[#EDE9E2] flex-row mb-4 shadow-xs">
          {(["day", "week", "month"] as const).map((tab) => {
            const isSelected = period === tab;
            const labels = {
              day: "Day",
              week: "Week",
              month: "Month",
            };

            return (
              <TouchableOpacity
                key={tab}
                activeOpacity={0.8}
                onPress={() => setPeriod(tab)}
                className={`flex-1 py-2.5 rounded-xl items-center justify-center ${
                  isSelected ? "bg-white shadow-sm border border-[#EAE6DF]" : ""
                }`}
              >
                <Text
                  className={`font-poppins-semibold text-xs ${
                    isSelected ? "text-[#161616]" : "text-[#8A9A90]"
                  }`}
                >
                  {labels[tab]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Date Selector Row (< 23 May 2025 > [📅]) matching reference image */}
        <View className="flex-row items-center justify-between mb-5 px-1">
          {/* Left Arrow */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handlePrevDate}
            className="w-9 h-9 rounded-full bg-white items-center justify-center border border-[#EDE9E2] shadow-xs"
          >
            <ChevronLeftIcon size={16} color="#161616" />
          </TouchableOpacity>

          {/* Date Label in Center (Tap opens calendar) */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setCalendarVisible(true)}
            className="py-1 px-3"
          >
            <Text className="font-poppins-bold text-base text-[#161616] text-center">
              {formattedDateLabel}
            </Text>
          </TouchableOpacity>

          {/* Right Arrow & Calendar Filter Icon */}
          <View className="flex-row items-center space-x-2">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleNextDate}
              className="w-9 h-9 rounded-full bg-white items-center justify-center border border-[#EDE9E2] shadow-xs mr-2"
            >
              <ChevronRightIcon size={16} color="#161616" />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setCalendarVisible(true)}
              className="w-9 h-9 rounded-full bg-white items-center justify-center border border-[#EDE9E2] shadow-xs"
            >
              <CalendarDaysIcon size={18} color="#161616" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Single Vitals Trend Graph displaying all 6 metrics matching image */}
        <MultiMetricVitalsChart
          points={dataset.points}
          xLabels={dataset.xLabels}
          height={210}
        />

        {/* Section Title: Daily Vitals Overview */}
        <View className="flex-row items-center justify-between mb-3 px-1">
          <Text className="font-poppins-bold text-base text-[#161616]">
            All 6 Metrics Overview
          </Text>
          <Text className="font-poppins-regular text-xs text-[#8A9A90]">
            Average & Range
          </Text>
        </View>

        {/* 6 Metrics Summary Cards Grid */}
        <View className="flex-row flex-wrap justify-between">
          {allKeys.map((key) => {
            const config = METRIC_CONFIGS[key];
            const summary = dataset.summaries[key];

            return (
              <View
                key={key}
                className="w-[48.5%] bg-white rounded-2xl p-3.5 border border-[#EDE9E2] shadow-xs mb-3"
              >
                {/* Header row with icon & status */}
                <View className="flex-row items-center justify-between mb-2">
                  <View
                    className="w-8 h-8 rounded-full items-center justify-center"
                    style={{ backgroundColor: `${config.color}15` }}
                  >
                    {renderMetricIcon(key, config.color)}
                  </View>

                  <View className="px-2 py-0.5 rounded-full bg-[#F5F2EB]">
                    <Text className="font-poppins-medium text-[10px] text-[#55695E]">
                      {summary.status}
                    </Text>
                  </View>
                </View>

                {/* Metric label */}
                <Text className="font-poppins-medium text-xs text-[#8A9A90]">
                  {config.label}
                </Text>

                {/* Main value */}
                <View className="flex-row items-baseline mt-0.5">
                  <Text className="font-poppins-bold text-lg text-[#161616]">
                    {summary.avg}
                  </Text>
                  {config.unit ? (
                    <Text className="font-poppins-medium text-xs text-[#55695E] ml-1">
                      {config.unit}
                    </Text>
                  ) : null}
                </View>

                {/* Range stats */}
                <View className="flex-row items-center justify-between mt-2 pt-2 border-t border-[#F5F2EB]">
                  <Text className="font-poppins-regular text-[10px] text-[#9CA3AF]">
                    Min: {summary.min}
                  </Text>
                  <Text className="font-poppins-regular text-[10px] text-[#9CA3AF]">
                    Max: {summary.max}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Calendar Date Picker Modal */}
      <CalendarPickerModal
        visible={calendarVisible}
        selectedDate={selectedDate}
        onSelectDate={(newDate) => setSelectedDate(newDate)}
        onClose={() => setCalendarVisible(false)}
      />
    </SafeAreaView>
  );
}
