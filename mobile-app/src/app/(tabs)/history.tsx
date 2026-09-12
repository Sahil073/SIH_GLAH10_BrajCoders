import React, { useState, useEffect, useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  METRIC_CONFIGS,
  MetricKey,
  HistoryDataset,
} from "@/data/mockHistoryData";
import { MultiMetricVitalsChart } from "@/components/history/MultiMetricVitalsChart";
import { CalendarPickerModal } from "@/components/history/CalendarPickerModal";
import { useTheme } from "@/store/themeStore";
import { useUserProfile } from "@/store/userProfileStore";
import { fetchUserVitalsHistory } from "@/database";
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

const INITIAL_EMPTY_DATASET: HistoryDataset & { hasData: boolean; totalReadingsCount: number } = {
  points: [],
  summaries: {
    hr: { key: "hr", avg: "—" as any, min: "—" as any, max: "—" as any, status: "Normal" },
    spo2: { key: "spo2", avg: "—" as any, min: "—" as any, max: "—" as any, status: "Normal" },
    temp: { key: "temp", avg: "—" as any, min: "—" as any, max: "—" as any, status: "Normal" },
    aqi: { key: "aqi", avg: "—" as any, min: "—" as any, max: "—" as any, status: "Good" },
    moisture: { key: "moisture", avg: "—" as any, min: "—" as any, max: "—" as any, status: "Normal" },
    steps: { key: "steps", avg: "—" as any, min: "—" as any, max: "—" as any, status: "Normal" },
  },
  xLabels: ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "23:59"],
  hasData: false,
  totalReadingsCount: 0,
};

export default function HistoryScreen() {
  const { colors, isDark } = useTheme();
  const { activeUserId } = useUserProfile();
  const [period, setPeriod] = useState<PeriodTab>("day");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date()); // Today's real date
  const [calendarVisible, setCalendarVisible] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dataset, setDataset] = useState<HistoryDataset & { hasData: boolean; totalReadingsCount: number }>(
    INITIAL_EMPTY_DATASET
  );

  // Load real dataset from SQLite based on active user, selected period, and date
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetchUserVitalsHistory(activeUserId, period, selectedDate)
      .then((data) => {
        if (isMounted) {
          setDataset(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.warn("[HistoryScreen] Failed to load user vitals:", err);
        if (isMounted) {
          setDataset(INITIAL_EMPTY_DATASET);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [activeUserId, period, selectedDate]);

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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 16 }}
        showsVerticalScrollIndicator={false}
        className="px-5"
      >
        {/* Top Period Segmented Switcher (Day | Week | Month) */}
        <View
          style={{
            backgroundColor: colors.cardBg,
            borderColor: colors.cardBorder,
          }}
          className="rounded-2xl p-1 border flex-row mb-4 shadow-xs"
        >
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
                style={
                  isSelected
                    ? {
                        backgroundColor: colors.backgroundSecondary,
                        borderColor: colors.cardBorder,
                      }
                    : undefined
                }
                className={`flex-1 py-2.5 rounded-xl items-center justify-center ${
                  isSelected ? "shadow-sm border" : ""
                }`}
              >
                <Text
                  style={{
                    color: isSelected ? colors.textPrimary : colors.textMuted,
                  }}
                  className="font-poppins-semibold text-xs"
                >
                  {labels[tab]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Date Selector Row (< 23 May 2025 > [📅]) */}
        <View className="flex-row items-center justify-between mb-5 px-1">
          {/* Left Arrow */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handlePrevDate}
            style={{
              backgroundColor: colors.cardBg,
              borderColor: colors.cardBorder,
            }}
            className="w-9 h-9 rounded-full items-center justify-center border shadow-xs"
          >
            <ChevronLeftIcon size={16} color={colors.textPrimary} />
          </TouchableOpacity>

          {/* Date Label in Center (Tap opens calendar) */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setCalendarVisible(true)}
            className="py-1 px-3"
          >
            <Text
              style={{ color: colors.textPrimary }}
              className="font-poppins-bold text-base text-center"
            >
              {formattedDateLabel}
            </Text>
          </TouchableOpacity>

          {/* Right Arrow & Calendar Filter Icon */}
          <View className="flex-row items-center space-x-2">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleNextDate}
              style={{
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
              }}
              className="w-9 h-9 rounded-full items-center justify-center border shadow-xs mr-2"
            >
              <ChevronRightIcon size={16} color={colors.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setCalendarVisible(true)}
              style={{
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
              }}
              className="w-9 h-9 rounded-full items-center justify-center border shadow-xs"
            >
              <CalendarDaysIcon size={18} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Single Vitals Trend Graph displaying all 6 metrics */}
        <MultiMetricVitalsChart
          points={dataset.points}
          xLabels={dataset.xLabels}
          height={210}
        />

        {/* Section Title: Daily Vitals Overview */}
        <View className="flex-row items-center justify-between mb-3 px-1">
          <Text
            style={{ color: colors.textPrimary }}
            className="font-poppins-bold text-base"
          >
            All 6 Metrics Overview
          </Text>
          <Text
            style={{ color: colors.textMuted }}
            className="font-poppins-regular text-xs"
          >
            {dataset.hasData ? `${dataset.totalReadingsCount} records` : "No Records"}
          </Text>
        </View>

        {/* Informative banner if no data points are present in SQLite */}
        {!dataset.hasData && (
          <View
            style={{
              backgroundColor: isDark ? colors.backgroundSecondary : "#F9FAFB",
              borderColor: colors.cardBorder,
            }}
            className="p-3.5 rounded-2xl border mb-3 flex-row items-center shadow-xs"
          >
            <Text className="text-base mr-2.5">ℹ️</Text>
            <Text
              style={{ color: colors.textMuted }}
              className="font-poppins-regular text-xs flex-1 leading-4"
            >
              No sensor telemetry recorded in SQLite for this timeframe. Connect wearable to sync live data.
            </Text>
          </View>
        )}

        {/* 6 Metrics Summary Cards Grid */}
        <View className="flex-row flex-wrap justify-between">
          {allKeys.map((key) => {
            const config = METRIC_CONFIGS[key];
            const summary = dataset.summaries[key];
            const hasValue = summary.avg !== ("—" as any);

            return (
              <View
                key={key}
                style={{
                  backgroundColor: colors.cardBg,
                  borderColor: colors.cardBorder,
                }}
                className="w-[48.5%] rounded-2xl p-3.5 border shadow-xs mb-3"
              >
                {/* Header row with icon & status */}
                <View className="flex-row items-center justify-between mb-2">
                  <View
                    className="w-8 h-8 rounded-full items-center justify-center"
                    style={{ backgroundColor: `${config.color}18` }}
                  >
                    {renderMetricIcon(key, config.color)}
                  </View>

                  <View
                    style={{ backgroundColor: colors.backgroundSecondary }}
                    className="px-2 py-0.5 rounded-full"
                  >
                    <Text
                      style={{ color: colors.textSecondary }}
                      className="font-poppins-medium text-[10px]"
                    >
                      {hasValue ? summary.status : "No Data"}
                    </Text>
                  </View>
                </View>

                {/* Metric label */}
                <Text
                  style={{ color: colors.textMuted }}
                  className="font-poppins-medium text-xs"
                >
                  {config.label}
                </Text>

                {/* Main value */}
                <View className="flex-row items-baseline mt-0.5">
                  <Text
                    style={{ color: colors.textPrimary }}
                    className="font-poppins-bold text-lg"
                  >
                    {summary.avg}
                  </Text>
                  {config.unit && hasValue ? (
                    <Text
                      style={{ color: colors.textSecondary }}
                      className="font-poppins-medium text-xs ml-1"
                    >
                      {config.unit}
                    </Text>
                  ) : null}
                </View>

                {/* Range stats */}
                <View
                  style={{ borderColor: colors.divider }}
                  className="flex-row items-center justify-between mt-2 pt-2 border-t"
                >
                  <Text
                    style={{ color: colors.textMuted }}
                    className="font-poppins-regular text-[10px]"
                  >
                    Min: {summary.min}
                  </Text>
                  <Text
                    style={{ color: colors.textMuted }}
                    className="font-poppins-regular text-[10px]"
                  >
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
