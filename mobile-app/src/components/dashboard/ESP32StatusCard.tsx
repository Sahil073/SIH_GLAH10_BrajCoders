import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useBle } from "@/ble";
import { useTheme } from "@/store/themeStore";

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
        label: "Connected",
      };
    }
    if (isBusy) {
      return {
        dotBg: "bg-amber-500",
        pillBg: isDark ? "bg-amber-950/60 border-amber-800" : "bg-amber-50 border-amber-200",
        textColor: isDark ? "text-amber-300" : "text-amber-700",
        label: isScanning ? "Scanning..." : "Connecting...",
      };
    }
    return {
      dotBg: "bg-rose-500",
      pillBg: isDark ? "bg-rose-950/60 border-rose-800" : "bg-rose-50 border-rose-200",
      textColor: isDark ? "text-rose-300" : "text-rose-700",
      label: "Disconnected",
    };
  };

  const badge = getStatusBadge();

  return (
    <View className="px-6 mb-5">
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
              className="w-11 h-11 rounded-2xl items-center justify-center mr-3 border"
            >
              {isBusy ? (
                <ActivityIndicator size="small" color="#D97706" />
              ) : (
                <Text className="text-xl">
                  {isConnected ? "📡" : "🔌"}
                </Text>
              )}
            </View>

            <View className="flex-1">
              <View className="flex-row items-center">
                <Text
                  style={{ color: colors.textPrimary }}
                  className="font-poppins-bold text-[15px] leading-snug"
                >
                  {isConnected
                    ? connectedDevice?.name || "ESP32 Sensor Hub"
                    : "ESP32 Wearable"}
                </Text>
                <View
                  className={`ml-2 px-2 py-0.5 rounded-full border flex-row items-center ${badge.pillBg}`}
                >
                  <View className={`w-1.5 h-1.5 rounded-full mr-1 ${badge.dotBg}`} />
                  <Text className={`font-poppins-semibold text-[10px] ${badge.textColor}`}>
                    {badge.label}
                  </Text>
                </View>
              </View>

              <Text
                style={{ color: colors.textSecondary }}
                className="font-poppins-regular text-[11.5px] mt-0.5"
              >
                {isConnected
                  ? `Telemetry active • ${totalPackets} packets received`
                  : hasHistoricalData
                  ? "Offline • Showing SQLite past session averages"
                  : "No Bluetooth connection • Real-time stream idle"}
              </Text>
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
            className="px-3 py-2 rounded-xl border items-center justify-center"
          >
            <Text
              style={{
                color: isConnected ? colors.textSecondary : isDark ? "#121212" : "#FFFFFF",
              }}
              className="font-poppins-semibold text-[11px]"
            >
              {isConnected ? "Disconnect" : isBusy ? "Connecting..." : "Connect"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
