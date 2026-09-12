// =============================================================================
// src/components/dashboard/AIRiskBanner.tsx
// Displays real-time on-device AI decision engine risks, cardiac & heat status,
// fall detection alerts, and emergency SOS recommendation actions.
// =============================================================================

import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useAiRisk } from "@/store/aiStore";
import { RiskLevel } from "../../../ai-engine/types";
import {
  WarningTriangleIcon,
  CriticalShieldIcon,
  HeartPulseAlertIcon,
  TempAlertIcon,
  FallAlertIcon,
  AqiAlertIcon,
  ShieldSafeIcon,
} from "@/components/alerts/AlertIcons";

function getRiskBadgeColor(level: RiskLevel): { bg: string; text: string; border: string } {
  switch (level) {
    case "RISK":
      return { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" };
    case "CAUTION":
      return { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" };
    case "NORMAL":
    default:
      return { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" };
  }
}

export function AIRiskBanner() {
  const router = useRouter();
  const ai = useAiRisk();
  const [dismissedSos, setDismissedSos] = useState<boolean>(false);

  const isEmergency = (ai.sosRecommended || ai.risks.fall.detected) && !dismissedSos;
  const isCaution =
    ai.risks.cardiac.level === "CAUTION" ||
    ai.risks.heat.level === "CAUTION" ||
    ai.risks.respiratory.level === "CAUTION";

  return (
    <View className="px-6 mb-5">
      {/* Emergency SOS Banner if triggered by AI engine */}
      {isEmergency && (
        <View className="bg-rose-600 rounded-2xl p-4 mb-3 shadow-md border border-rose-700">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-2">
              <View className="w-8 h-8 rounded-full bg-white/20 items-center justify-center">
                <CriticalShieldIcon size={20} color="#FFFFFF" />
              </View>
              <Text className="font-poppins-bold text-[15px] text-white tracking-wide">
                EMERGENCY SOS TRIGGERED
              </Text>
            </View>
            <View className="bg-white/20 px-2 py-0.5 rounded-md">
              <Text className="font-poppins-bold text-[10px] text-white uppercase">
                AI GATE VERIFIED
              </Text>
            </View>
          </View>

          <Text className="font-poppins-regular text-xs text-white/90 mb-3">
            {ai.risks.fall.detected
              ? "Critical fall event detected by wearable accelerometer. False-alarm gate confirmed persistence."
              : ai.risks.cardiac.evidence[0] ||
                "Sustained critical physiological risk detected. Immediate attention recommended."}
          </Text>

          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push("/(tabs)/sos")}
              className="flex-1 bg-white py-2.5 rounded-xl items-center justify-center shadow-xs"
            >
              <Text className="font-poppins-bold text-xs text-rose-700">
                Open Emergency SOS
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setDismissedSos(true)}
              className="px-3.5 py-2.5 rounded-xl bg-black/20 items-center justify-center"
            >
              <Text className="font-poppins-medium text-xs text-white/90">
                Dismiss
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Main AI Health Assessment Card */}
      <View className="bg-white rounded-2xl p-4 border border-[#EDE9E2] shadow-xs">
        {/* Header Row */}
        <View className="flex-row items-center justify-between pb-3 border-b border-[#F4F1EA]">
          <View className="flex-row items-center gap-2">
            <View className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <Text className="font-poppins-bold text-xs text-[#161616] tracking-wide uppercase">
              On-Device AI Engine
            </Text>
          </View>

          <View className="flex-row items-center gap-1.5 bg-[#F7F5F0] px-2.5 py-1 rounded-full">
            <Text className="font-poppins-medium text-[10px] text-[#78756E]">
              {ai.status === "ready" ? "ACTIVE DSP" : "CALIBRATING"}
            </Text>
          </View>
        </View>

        {/* 4 Risk Badges Grid */}
        <View className="flex-row items-center justify-between pt-3 gap-2">
          {/* Cardiac Risk */}
          {(() => {
            const colors = getRiskBadgeColor(ai.risks.cardiac.level);
            return (
              <View
                className={`flex-1 ${colors.bg} ${colors.border} border rounded-xl p-2 items-center justify-center`}
              >
                <HeartPulseAlertIcon size={16} color="#DC2626" />
                <Text className="font-poppins-medium text-[10px] text-[#555] mt-1">
                  Cardiac
                </Text>
                <Text className={`font-poppins-bold text-[10px] ${colors.text}`}>
                  {ai.risks.cardiac.level}
                </Text>
              </View>
            );
          })()}

          {/* Heat Risk */}
          {(() => {
            const colors = getRiskBadgeColor(ai.risks.heat.level);
            return (
              <View
                className={`flex-1 ${colors.bg} ${colors.border} border rounded-xl p-2 items-center justify-center`}
              >
                <TempAlertIcon size={16} color="#EA580C" />
                <Text className="font-poppins-medium text-[10px] text-[#555] mt-1">
                  Heat
                </Text>
                <Text className={`font-poppins-bold text-[10px] ${colors.text}`}>
                  {ai.risks.heat.level}
                </Text>
              </View>
            );
          })()}

          {/* Respiratory Risk */}
          {(() => {
            const colors = getRiskBadgeColor(ai.risks.respiratory.level);
            return (
              <View
                className={`flex-1 ${colors.bg} ${colors.border} border rounded-xl p-2 items-center justify-center`}
              >
                <AqiAlertIcon size={16} color="#0284C7" />
                <Text className="font-poppins-medium text-[10px] text-[#555] mt-1">
                  Air / Resp
                </Text>
                <Text className={`font-poppins-bold text-[10px] ${colors.text}`}>
                  {ai.risks.respiratory.level}
                </Text>
              </View>
            );
          })()}

          {/* Fall Risk */}
          {(() => {
            const isFallen = ai.risks.fall.detected;
            return (
              <View
                className={`flex-1 ${
                  isFallen
                    ? "bg-rose-50 border-rose-300"
                    : "bg-emerald-50 border-emerald-200"
                } border rounded-xl p-2 items-center justify-center`}
              >
                <FallAlertIcon
                  size={16}
                  color={isFallen ? "#DC2626" : "#16A34A"}
                />
                <Text className="font-poppins-medium text-[10px] text-[#555] mt-1">
                  Motion
                </Text>
                <Text
                  className={`font-poppins-bold text-[10px] ${
                    isFallen ? "text-rose-700" : "text-emerald-700"
                  }`}
                >
                  {isFallen ? "FALL" : "STABLE"}
                </Text>
              </View>
            );
          })()}
        </View>

        {/* Dynamic Evidence Subtitle */}
        <View className="mt-2.5 pt-2 border-t border-[#F4F1EA] flex-row items-center justify-between">
          <Text
            className="font-poppins-regular text-[10.5px] text-[#86837C] flex-1 mr-2"
            numberOfLines={1}
          >
            {ai.heartRate
              ? `Pan-Tompkins HR: ${ai.heartRate.toFixed(0)} BPM • Motion: ${ai.motion.state}`
              : "Awaiting continuous biopotential stream for Pan-Tompkins calculation..."}
          </Text>

          {ai.hrv?.rmssd ? (
            <Text className="font-poppins-medium text-[10px] text-[#161616]">
              HRV: {ai.hrv.rmssd.toFixed(1)}ms
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

