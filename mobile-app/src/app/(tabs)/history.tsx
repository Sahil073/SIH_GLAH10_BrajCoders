import React, { useState, useEffect, useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
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
import { WellnessDashboard } from "@/components/wellness/WellnessDashboard";
import { LeafIcon, TrendChartIcon, InfoIcon } from "@/components/common/AppIcons";

type PeriodTab = "day" | "week" | "month";
type HistoryViewMode = "wellness" | "charts";

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
  const [viewMode, setViewMode] = useState<HistoryViewMode>("wellness");
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
        {/* Top-Level Mode Switcher: Personal Wellness vs Historical Charts */}
        <View
          style={[
            styles.modeSwitcherContainer,
            {
              backgroundColor: isDark ? colors.backgroundSecondary : "#EEF2EF",
              borderColor: colors.cardBorder,
            },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setViewMode("wellness")}
            style={[
              styles.modeSwitcherBtn,
              viewMode === "wellness" && [
                styles.modeSwitcherBtnActive,
                {
                  backgroundColor: colors.cardBg,
                  borderColor: colors.cardBorder,
                },
              ],
            ]}
          >
            <View style={{ marginRight: 6 }}>
              <LeafIcon
                size={16}
                color={viewMode === "wellness" ? "#16A34A" : colors.textMuted}
              />
            </View>
            <Text
              style={[
                styles.modeSwitcherText,
                {
                  color: viewMode === "wellness" ? colors.textPrimary : colors.textMuted,
                },
              ]}
            >
              Personal Wellness
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setViewMode("charts")}
            style={[
              styles.modeSwitcherBtn,
              viewMode === "charts" && [
                styles.modeSwitcherBtnActive,
                {
                  backgroundColor: colors.cardBg,
                  borderColor: colors.cardBorder,
                },
              ],
            ]}
          >
            <View style={{ marginRight: 6 }}>
              <TrendChartIcon
                size={16}
                color={viewMode === "charts" ? "#4F46E5" : colors.textMuted}
              />
            </View>
            <Text
              style={[
                styles.modeSwitcherText,
                {
                  color: viewMode === "charts" ? colors.textPrimary : colors.textMuted,
                },
              ]}
            >
              Historical Charts
            </Text>
          </TouchableOpacity>
        </View>

        {/* 1. PERSONAL WELLNESS DASHBOARD VIEW */}
        {viewMode === "wellness" ? (
          <WellnessDashboard onSwitchToCharts={() => setViewMode("charts")} />
        ) : (
          /* 2. DETAILED HISTORICAL CHARTS VIEW */
          <>
            {/* Top Period Segmented Switcher (Day | Week | Month) */}
            <View
              style={[
                styles.periodSwitcherContainer,
                {
                  backgroundColor: colors.cardBg,
                  borderColor: colors.cardBorder,
                },
              ]}
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
                    style={[
                      styles.periodBtn,
                      isSelected && [
                        styles.periodBtnActive,
                        {
                          backgroundColor: colors.backgroundSecondary,
                          borderColor: colors.cardBorder,
                        },
                      ],
                    ]}
                  >
                    <Text
                      style={[
                        styles.periodText,
                        {
                          color: isSelected ? colors.textPrimary : colors.textMuted,
                        },
                      ]}
                    >
                      {labels[tab]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Date Selector Row (< 23 May 2025 > [📅]) */}
            <View style={styles.dateNavRow}>
              {/* Left Arrow */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handlePrevDate}
                style={[
                  styles.navArrowBtn,
                  {
                    backgroundColor: colors.cardBg,
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                <ChevronLeftIcon size={16} color={colors.textPrimary} />
              </TouchableOpacity>

              {/* Date Label in Center (Tap opens calendar) */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setCalendarVisible(true)}
                style={styles.dateLabelBtn}
              >
                <Text
                  style={[
                    styles.dateLabelText,
                    { color: colors.textPrimary },
                  ]}
                >
                  {formattedDateLabel}
                </Text>
              </TouchableOpacity>

              {/* Right Arrow & Calendar Filter Icon */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleNextDate}
                  style={[
                    styles.navArrowBtn,
                    {
                      backgroundColor: colors.cardBg,
                      borderColor: colors.cardBorder,
                    },
                  ]}
                >
                  <ChevronRightIcon size={16} color={colors.textPrimary} />
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setCalendarVisible(true)}
                  style={[
                    styles.navArrowBtn,
                    {
                      backgroundColor: colors.cardBg,
                      borderColor: colors.cardBorder,
                    },
                  ]}
                >
                  <CalendarDaysIcon size={18} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Single Vitals Trend Graph displaying all 6 metrics */}
            <MultiMetricVitalsChart
              points={dataset.points}
          xLabels={dataset.xLabels}
          summaries={dataset.summaries}
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
            <View style={{ marginRight: 10 }}>
              <InfoIcon size={18} color={colors.textMuted} />
            </View>
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
        </>
      )}
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

const styles = StyleSheet.create({
  modeSwitcherContainer: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 4,
    flexDirection: "row",
    marginBottom: 16,
  },
  modeSwitcherBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 14,
  },
  modeSwitcherBtnActive: {
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  modeSwitcherIcon: {
    fontSize: 13,
    marginRight: 6,
  },
  modeSwitcherText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 12,
  },
  periodSwitcherContainer: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 4,
    flexDirection: "row",
    marginBottom: 16,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  periodBtnActive: {
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  periodText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 12,
  },
  dateNavRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  navArrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dateLabelBtn: {
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  dateLabelText: {
    fontFamily: "Poppins-Bold",
    fontSize: 16,
    textAlign: "center",
  },
});
