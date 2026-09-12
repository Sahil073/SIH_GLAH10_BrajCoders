// =============================================================================
// src/components/common/RawDataRecorderCard.tsx
// Interactive Raw Telemetry Recorder & CSV Exporter Card.
// Allows clinical researchers & engineers to capture ground-truth 500 Hz EXG
// and motion data directly to downloadable CSV files.
// =============================================================================

import React, { useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useRawRecorder } from "@/hooks/useRawRecorder";
import { useBle } from "@/ble";
import { useTheme } from "@/store/themeStore";

function formatSeconds(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return "0 KB";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function RawDataRecorderCard() {
  const { colors, isDark } = useTheme();
  const { connectionStatus } = useBle();
  const {
    isRecording,
    sampleCount,
    elapsedSeconds,
    lastSavedFileUri,
    fileSizeBytes,
    startRecording,
    stopRecording,
    exportSession,
    clearSession,
  } = useRawRecorder();

  const [isProcessing, setIsProcessing] = useState(false);
  const isConnected = connectionStatus === "connected";

  const handleToggleRecord = async () => {
    if (isRecording) {
      setIsProcessing(true);
      try {
        const fileUri = await stopRecording();
        if (fileUri) {
          Alert.alert(
            "Raw Session Finalized",
            `Successfully captured ${sampleCount.toLocaleString()} raw samples (${formatBytes(fileSizeBytes)}). You can now export the CSV.`
          );
        }
      } catch (err) {
        console.warn("Failed to stop recording:", err);
      } finally {
        setIsProcessing(false);
      }
    } else {
      if (!isConnected) {
        Alert.alert(
          "Wearable Disconnected",
          "Please connect the Sanjeevni wearable via Bluetooth first so raw packets can be captured.",
          [{ text: "OK" }]
        );
        return;
      }
      setIsProcessing(true);
      try {
        await startRecording();
      } catch (err) {
        console.warn("Failed to start recording:", err);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleExport = async () => {
    setIsProcessing(true);
    try {
      const success = await exportSession();
      if (!success) {
        Alert.alert("Notice", "Sharing is not available or was dismissed.");
      }
    } catch (err) {
      console.warn("Export error:", err);
      Alert.alert("Export Error", "Could not export CSV file.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View
      style={{
        backgroundColor: colors.cardBg,
        borderColor: isRecording ? (isDark ? "#065F46" : "#10B981") : colors.cardBorder,
      }}
      className="rounded-2xl p-4 mb-4 border shadow-sm"
    >
      {/* Header Row */}
      <View className="flex-row items-center justify-between mb-2.5">
        <View className="flex-row items-center gap-2">
          <Text className="text-xl">🧪</Text>
          <View>
            <Text
              style={{ color: colors.textPrimary }}
              className="font-poppins-bold text-sm"
            >
              Raw Telemetry CSV Logger
            </Text>
            <Text
              style={{ color: colors.textMuted }}
              className="font-poppins-regular text-[11px]"
            >
              Ground-truth 500 Hz EXG & Motion
            </Text>
          </View>
        </View>

        {/* Status Badge */}
        <View
          style={{
            backgroundColor: isRecording
              ? isDark ? "#1C3829" : "#DCFCE7"
              : lastSavedFileUri
              ? isDark ? "#1E293B" : "#F1F5F9"
              : colors.backgroundSecondary,
            borderColor: isRecording
              ? "#16A34A"
              : lastSavedFileUri
              ? "#64748B"
              : colors.cardBorder,
          }}
          className="px-2.5 py-1 rounded-full border flex-row items-center gap-1.5"
        >
          <View
            className={`w-2 h-2 rounded-full ${
              isRecording ? "bg-emerald-500 animate-pulse" : "bg-gray-400"
            }`}
          />
          <Text
            style={{
              color: isRecording
                ? "#16A34A"
                : lastSavedFileUri
                ? isDark ? "#94A3B8" : "#475569"
                : colors.textMuted,
            }}
            className="font-poppins-bold text-[10px] uppercase tracking-wide"
          >
            {isRecording ? "Logging Live" : lastSavedFileUri ? "Ready to Export" : "Idle"}
          </Text>
        </View>
      </View>

      {/* Metrics Row: Elapsed Time & Samples Recorded */}
      <View
        style={{
          backgroundColor: colors.backgroundSecondary,
          borderColor: colors.cardBorder,
        }}
        className="rounded-xl p-3 mb-3 border flex-row justify-between items-center"
      >
        <View>
          <Text
            style={{ color: colors.textMuted }}
            className="font-poppins-medium text-[10.5px]"
          >
            Session Duration
          </Text>
          <Text
            style={{ color: colors.textPrimary }}
            className="font-poppins-bold text-base"
          >
            {formatSeconds(elapsedSeconds)}
          </Text>
        </View>

        <View className="items-center">
          <Text
            style={{ color: colors.textMuted }}
            className="font-poppins-medium text-[10.5px]"
          >
            Raw Samples
          </Text>
          <Text
            style={{ color: colors.textPrimary }}
            className="font-poppins-bold text-base"
          >
            {sampleCount.toLocaleString()}
          </Text>
        </View>

        <View className="items-end">
          <Text
            style={{ color: colors.textMuted }}
            className="font-poppins-medium text-[10.5px]"
          >
            File Size
          </Text>
          <Text
            style={{ color: colors.textPrimary }}
            className="font-poppins-bold text-base"
          >
            {formatBytes(fileSizeBytes)}
          </Text>
        </View>
      </View>

      {/* Description */}
      <Text
        style={{ color: colors.textSecondary }}
        className="font-poppins-regular text-xs leading-[18px] mb-3"
      >
        Captures full raw 128-sample biopotential arrays (500 Hz), 3-axis acceleration vectors (100 Hz), and environmental metrics without downsampling.
      </Text>

      {/* Action Buttons */}
      <View className="space-y-2">
        {/* Record / Stop Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          disabled={isProcessing}
          onPress={handleToggleRecord}
          style={{
            backgroundColor: isRecording ? "#DC2626" : "#214332",
          }}
          className="w-full py-3 rounded-xl items-center justify-center flex-row shadow-sm"
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text className="font-poppins-semibold text-white text-xs tracking-wide">
              {isRecording ? "⏹️ Stop Session & Save CSV" : "⏺️ Start Raw Recording Session"}
            </Text>
          )}
        </TouchableOpacity>

        {/* Export Button if session file exists */}
        {Boolean(lastSavedFileUri && !isRecording) && (
          <View className="flex-row space-x-2 mt-2">
            <TouchableOpacity
              activeOpacity={0.8}
              disabled={isProcessing}
              onPress={handleExport}
              style={{
                backgroundColor: isDark ? colors.backgroundSecondary : "#EDF6F0",
                borderColor: isDark ? "#2A4535" : "#BBE2C8",
              }}
              className="flex-1 py-2.5 rounded-xl border items-center justify-center flex-row shadow-xs"
            >
              <Text
                style={{ color: isDark ? "#A7F3D0" : "#1B5E20" }}
                className="font-poppins-semibold text-xs"
              >
                📤 Export / Share CSV
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={clearSession}
              style={{
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.cardBorder,
              }}
              className="px-4 py-2.5 rounded-xl border items-center justify-center"
            >
              <Text style={{ color: colors.textMuted }} className="font-poppins-medium text-xs">
                Reset
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

