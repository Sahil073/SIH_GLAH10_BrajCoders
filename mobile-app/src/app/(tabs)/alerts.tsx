import React, { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  AlertRecord,
  AlertSeverity,
  AlertCategory,
  AlertIconType,
  INITIAL_ALERTS,
} from "@/data/mockAlertsData";
import { fetchAlerts, ackAlert } from "@/database";
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
  const [alerts, setAlerts] = useState<AlertRecord[]>(INITIAL_ALERTS);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadAlerts = useCallback(async () => {
    try {
      const dbAlerts = await fetchAlerts(30);
      if (dbAlerts && dbAlerts.length > 0) {
        const mapped: AlertRecord[] = dbAlerts.map((row: any) => {
          let iconType: AlertIconType = "heart";
          let category: AlertCategory = "vitals";
          if (row.category === "HEAT") {
            iconType = "temp";
            category = "environment";
          } else if (row.category === "RESPIRATORY") {
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
          const timeStr = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

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
      }
    } catch (e) {
      console.warn("Failed to load alerts from DB:", e);
    }
  }, []);

  useEffect(() => {
    loadAlerts();
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F7F5F0" }}>
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
        {/* Simple Minimal Header */}
        <View className="mb-5">
          <Text className="font-poppins-bold text-[28px] text-[#161616]">
            Alerts
          </Text>
          <Text className="font-poppins-regular text-xs text-[#8A9A90] mt-0.5">
            Real-time health & safety stream
          </Text>
        </View>

        {/* Empty State */}
        {alerts.length === 0 ? (
          <View className="bg-white rounded-2xl p-8 items-center justify-center border border-[#EDE9E2] mt-6">
            <View className="w-12 h-12 rounded-full bg-emerald-50 items-center justify-center mb-3">
              <ShieldSafeIcon size={24} color="#16A34A" />
            </View>
            <Text className="font-poppins-medium text-sm text-[#161616]">
              No Alerts
            </Text>
            <Text className="font-poppins-regular text-xs text-[#8A9A90] mt-1 text-center">
              All health and environmental vitals are within normal range.
            </Text>
          </View>
        ) : (
          /* Simple, Clean Alert Cards without any dots */
          <View className="space-y-2.5">
            {alerts.map((alert) => {
              const isCritical = alert.severity === "critical";
              const isWarning = alert.severity === "warning";

              const iconBg = isCritical
                ? "bg-red-50"
                : isWarning
                ? "bg-amber-50"
                : "bg-blue-50";

              return (
                <TouchableOpacity
                  key={alert.id}
                  activeOpacity={0.7}
                  onPress={() => handlePressAlert(alert.id)}
                  className={`bg-white rounded-2xl p-3.5 border ${alert.isRead ? "border-[#EDE9E2] opacity-70" : "border-[#D6D2C4]"} mb-2.5 flex-row items-center justify-between shadow-xs`}
                >
                  {/* Left: Icon & Text */}
                  <View className="flex-row items-center flex-1 mr-3">
                    <View
                      className={`w-10 h-10 rounded-full ${iconBg} items-center justify-center mr-3`}
                    >
                      {getAlertIcon(alert.iconType, alert.severity, 18)}
                    </View>

                    <View className="flex-1">
                      <Text className="font-poppins-medium text-sm text-[#161616]">
                        {alert.title}
                      </Text>
                      <Text className="font-poppins-regular text-xs text-[#6B7280] mt-0.5">
                        {alert.message}
                      </Text>
                    </View>
                  </View>

                  {/* Right: Timestamp only (No dots) */}
                  <View className="items-end justify-center pl-1">
                    <Text className="font-poppins-regular text-[11px] text-[#9E9B94]">
                      {alert.timestamp}
                    </Text>
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
