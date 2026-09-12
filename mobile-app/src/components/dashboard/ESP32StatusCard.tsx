import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useBle } from "@/ble";
import { useTheme } from "@/store/themeStore";
import { BluetoothIcon } from "@/components/common/AppIcons";
import { useLanguage } from "@/i18n/languages";

interface ESP32StatusCardProps {
  hasHistoricalData?: boolean;
}

export function ESP32StatusCard({ hasHistoricalData = false }: ESP32StatusCardProps) {
  const {
    connectionStatus,
    connectedDeviceId,
    discoveredDevices,
    totalPackets,
    startAutoConnect,
    disconnect,
  } = useBle();

  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  const connectedDevice = discoveredDevices.find(
    (d) => d.id === connectedDeviceId
  );

  const isConnected = connectionStatus === "connected";
  const isScanning = connectionStatus === "scanning";
  const isConnecting = connectionStatus === "connecting";
  const isBusy = isScanning || isConnecting;

  const handleAction = async () => {
    if (isConnected) {
      await disconnect();
    } else {
      await startAutoConnect();
    }
  };

  const getStatusBadge = () => {
    if (isConnected) {
      return {
        dotBg: "bg-emerald-500",
        pillBg: isDark ? "bg-emerald-950/60 border-emerald-800" : "bg-emerald-50 border-emerald-200",
        textColor: isDark ? "text-emerald-300" : "text-emerald-700",
        label: t("connected"),
      };
    }
    if (isBusy) {
      return {
        dotBg: "bg-amber-500",
        pillBg: isDark ? "bg-amber-950/60 border-amber-800" : "bg-amber-50 border-amber-200",
        textColor: isDark ? "text-amber-300" : "text-amber-700",
        label: isScanning ? t("scanning") : t("connecting"),
      };
    }
    return {
      dotBg: "bg-rose-500",
      pillBg: isDark ? "bg-rose-950/60 border-rose-800" : "bg-rose-50 border-rose-200",
      textColor: isDark ? "text-rose-300" : "text-rose-700",
      label: t("disconnected"),
    };
  };

  const badge = getStatusBadge();

  return (
    <View className="mb-4">
      <View
        style={{
          backgroundColor: colors.cardBg,
          borderColor: colors.cardBorder,
        }}
        className="rounded-[24px] p-4 border shadow-xs"
      >
        <View className="flex-row items-center justify-between">
          {/* Left: Device Icon & Information */}
          <View className="flex-row items-center flex-1 mr-3">
            <View
              style={{
                backgroundColor: isDark ? colors.backgroundSecondary : isConnected ? "#EBF5EE" : "#F4F1EA",
                borderColor: colors.cardBorder,
              }}
              className="w-11 h-11 rounded-2xl items-center justify-center mr-3 border shrink-0"
            >
              {isBusy ? (
                <ActivityIndicator size="small" color="#D97706" />
              ) : (
                <BluetoothIcon
                  size={20}
                  color={isConnected ? "#16A34A" : isDark ? "#9CA3AF" : "#6B7280"}
                />
              )}
            </View>

            <View className="flex-1 justify-center">
              {/* Device Title */}
              <Text
                style={{ color: colors.textPrimary }}
                className="font-poppins-bold text-[14.5px] leading-tight"
                numberOfLines={1}
              >
                {isConnected
                  ? connectedDevice?.name || t("esp32SensorHub")
                  : t("esp32Wearable")}
              </Text>

              {/* Status Badge Pill & Telemetry Subtext */}
              <View className="flex-row items-center mt-1">
                <View
                  className={`px-2 py-0.5 rounded-full border flex-row items-center shrink-0 ${badge.pillBg}`}
                >
                  <View className={`w-1.5 h-1.5 rounded-full mr-1 ${badge.dotBg}`} />
                  <Text className={`font-poppins-semibold text-[10px] ${badge.textColor}`}>
                    {badge.label}
                  </Text>
                </View>

                <Text
                  style={{ color: colors.textSecondary }}
                  className="font-poppins-regular text-[11px] ml-2 flex-1"
                  numberOfLines={1}
                >
                  {isConnected
                    ? `${t("telemetryActive")} • ${totalPackets} ${t("packets")}`
                    : hasHistoricalData
                    ? t("offlineMode")
                    : t("streamIdle")}
                </Text>
              </View>
            </View>
          </View>

          {/* Right: Connect / Reconnect / Disconnect Button */}
          <TouchableOpacity
            activeOpacity={0.75}
            disabled={isBusy}
            onPress={handleAction}
            style={{
              backgroundColor: isConnected ? colors.backgroundSecondary : colors.textPrimary,
              borderColor: colors.cardBorder,
            }}
            className="px-3.5 py-2 rounded-xl border items-center justify-center shrink-0 min-w-[78px]"
          >
            <Text
              style={{
                color: isConnected ? colors.textSecondary : isDark ? "#121212" : "#FFFFFF",
              }}
              className="font-poppins-semibold text-[11px]"
            >
              {isConnected
                ? t("disconnect")
                : isBusy
                ? t("connecting")
                : t("connect")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
