import React, { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  AlertRecord,
  AlertSeverity,
  AlertCategory,
  AlertIconType,
  INITIAL_ALERTS,
} from "@/data/mockAlertsData";
import { fetchAlerts, ackAlert, removeAlert, removeAllAlerts } from "@/database";
import { useUserProfile } from "@/store/userProfileStore";
import { useTheme } from "@/store/themeStore";
import {
  CriticalShieldIcon,
  WarningTriangleIcon,
  InfoCircleIcon,
  HeartPulseAlertIcon,
  Spo2AlertIcon,
  TempAlertIcon,
  AqiAlertIcon,
  HumidityAlertIcon,
  FallAlertIcon,
  BatteryAlertIcon,
  SyncAlertIcon,
  CheckCircleAlertIcon,
  ShieldSafeIcon,
} from "@/components/alerts/AlertIcons";

/**
 * Returns a simple SVG icon for the alert
 */
function getAlertIcon(iconType: AlertIconType, severity: AlertSeverity, size = 18) {
  const iconColor =
    severity === "critical"
      ? "#EF4444"
      : severity === "warning"
      ? "#F59E0B"
      : "#3B82F6";

  switch (iconType) {
    case "heart":
      return <HeartPulseAlertIcon size={size} color={iconColor} />;
    case "spo2":
      return <Spo2AlertIcon size={size} color={iconColor} />;
    case "temp":
      return <TempAlertIcon size={size} color={iconColor} />;
    case "aqi":
      return <AqiAlertIcon size={size} color={iconColor} />;
    case "humidity":
      return <HumidityAlertIcon size={size} color={iconColor} />;
    case "fall":
      return <FallAlertIcon size={size} color={iconColor} />;
    case "battery":
      return <BatteryAlertIcon size={size} color={iconColor} />;
    case "sync":
      return <SyncAlertIcon size={size} color={iconColor} />;
    case "check":
      return <CheckCircleAlertIcon size={size} color={iconColor} />;
    default:
      if (severity === "critical") {
        return <CriticalShieldIcon size={size} color={iconColor} />;
      }
      if (severity === "warning") {
        return <WarningTriangleIcon size={size} color={iconColor} />;
      }
      return <InfoCircleIcon size={size} color={iconColor} />;
  }
}

export default function AlertsScreen() {
  const { activeUserId } = useUserProfile();
  const { colors, isDark } = useTheme();

  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadAlerts = useCallback(async () => {
    try {
      const dbAlerts = await fetchAlerts(50, activeUserId);
      if (dbAlerts && dbAlerts.length > 0) {
        const mapped: AlertRecord[] = dbAlerts.map((row: any) => {
          let iconType: AlertIconType = "heart";
          let category: AlertCategory = "vitals";
          if (row.category === "HEAT") {
            iconType = "temp";
            category = "environment";
          } else if (row.category === "RESPIRATORY" || row.category === "AQI") {
            iconType = "aqi";
            category = "environment";
          } else if (row.category === "FALL") {
            iconType = "fall";
            category = "fall";
          }

          let severity: AlertSeverity = "info";
          if (row.severity === "CRITICAL" || row.severity === "HIGH") severity = "critical";
          else if (row.severity === "MODERATE") severity = "warning";

          const date = new Date(row.timestamp);
          const timeStr = isNaN(date.getTime())
            ? row.timestamp
            : `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

          return {
            id: String(row.id),
            title: row.category,
            message: row.message,
            severity,
            category,
            iconType,
            timestamp: timeStr,
            isRead: Boolean(row.acknowledged),
          };
        });
        setAlerts(mapped);
      } else {
        setAlerts([]);
      }
    } catch (e) {
      console.warn("Failed to load alerts from DB:", e);
    }
  }, [activeUserId]);

  useEffect(() => {
    void loadAlerts();
    const interval = setInterval(loadAlerts, 3000);
    return () => clearInterval(interval);
  }, [loadAlerts]);

  const handlePressAlert = async (id: string) => {
    const numId = Number(id);
    if (!isNaN(numId)) {
      await ackAlert(numId);
    }
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isRead: true } : a))
    );
  };

  const handleDeleteAlert = async (id: string) => {
    const numId = Number(id);
    if (!isNaN(numId)) {
      await removeAlert(numId);
    }
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const handleClearAll = async () => {
    Alert.alert(
      "Clear All Alerts",
      `Are you sure you want to dismiss all alerts for ${activeUserId}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            await removeAllAlerts(activeUserId);
            setAlerts([]);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 110, paddingTop: 16 }}
        showsVerticalScrollIndicator={false}
        className="px-5"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await loadAlerts();
              setRefreshing(false);
            }}
          />
        }
      >
        {/* Header with Title and Clear All Action */}
        <View className="flex-row items-center justify-between mb-5">
          <View>
            <Text
              style={{ color: colors.textPrimary }}
              className="font-poppins-bold text-[28px]"
            >
              Alerts
            </Text>
            <Text
              style={{ color: colors.textSecondary }}
              className="font-poppins-regular text-xs mt-0.5"
            >
              {activeUserId === "offline_local"
                ? "Phone offline alerts"
                : `Alerts for ${activeUserId}`}
            </Text>
          </View>

          {alerts.length > 0 && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleClearAll}
              className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900"
            >
              <Text className="font-poppins-semibold text-xs text-rose-600 dark:text-rose-400">
                Clear All
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Empty State */}
        {alerts.length === 0 ? (
          <View
            style={{
              backgroundColor: colors.cardBg,
              borderColor: colors.cardBorder,
            }}
            className="rounded-2xl p-8 items-center justify-center border mt-6 shadow-xs"
          >
            <View className="w-12 h-12 rounded-full bg-emerald-500/10 items-center justify-center mb-3">
              <ShieldSafeIcon size={24} color="#16A34A" />
            </View>
            <Text
              style={{ color: colors.textPrimary }}
              className="font-poppins-medium text-sm"
            >
              No Active Alerts
            </Text>
            <Text
              style={{ color: colors.textSecondary }}
              className="font-poppins-regular text-xs mt-1 text-center"
            >
              All health and environmental vitals are within safe thresholds.
            </Text>
          </View>
        ) : (
          /* Clean Alert Cards with Read/Unread State & Dismiss Action */
          <View className="space-y-2.5">
            {alerts.map((alert) => {
              const isCritical = alert.severity === "critical";
              const isWarning = alert.severity === "warning";

              const iconBg = isCritical
                ? "bg-red-50 dark:bg-red-950/40"
                : isWarning
                ? "bg-amber-50 dark:bg-amber-950/40"
                : "bg-blue-50 dark:bg-blue-950/40";

              return (
                <TouchableOpacity
                  key={alert.id}
                  activeOpacity={0.8}
                  onPress={() => handlePressAlert(alert.id)}
                  style={{
                    backgroundColor: colors.cardBg,
                    borderColor: alert.isRead ? colors.cardBorder : isDark ? "#4B5563" : "#D6D2C4",
                  }}
                  className={`rounded-2xl p-3.5 border ${
                    alert.isRead ? "opacity-75" : ""
                  } mb-2.5 flex-row items-center justify-between shadow-xs`}
                >
                  {/* Left: Icon & Text */}
                  <View className="flex-row items-center flex-1 mr-2">
                    <View
                      className={`w-10 h-10 rounded-full ${iconBg} items-center justify-center mr-3`}
                    >
                      {getAlertIcon(alert.iconType, alert.severity, 18)}
                    </View>

                    <View className="flex-1">
                      <View className="flex-row items-center">
                        <Text
                          style={{ color: colors.textPrimary }}
                          className="font-poppins-semibold text-sm"
                        >
                          {alert.title}
                        </Text>
                        {!alert.isRead && (
                          <View className="w-1.5 h-1.5 rounded-full bg-rose-500 ml-1.5" />
                        )}
                      </View>
                      <Text
                        style={{ color: colors.textSecondary }}
                        className="font-poppins-regular text-xs mt-0.5"
                      >
                        {alert.message}
                      </Text>
                    </View>
                  </View>

                  {/* Right: Timestamp & Dismiss Button */}
                  <View className="items-end justify-center pl-2">
                    <Text
                      style={{ color: colors.textMuted }}
                      className="font-poppins-regular text-[11px] mb-1"
                    >
                      {alert.timestamp}
                    </Text>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={(e) => {
                        e.stopPropagation();
                        void handleDeleteAlert(alert.id);
                      }}
                      style={{
                        backgroundColor: colors.backgroundSecondary,
                        borderColor: colors.cardBorder,
                      }}
                      className="px-2 py-0.5 rounded-md border"
                    >
                      <Text
                        style={{ color: colors.textSecondary }}
                        className="font-poppins-medium text-[10px]"
                      >
                        Dismiss
                      </Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
