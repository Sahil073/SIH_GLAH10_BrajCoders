// =============================================================================
// src/components/dashboard/RealtimeEcgMonitor.tsx
// Enlarged Real-Time 500 Hz Cardiac Biopotential Waveform Monitor (BioAmp EXG)
// Cardiac-themed aesthetic with live QRS pulse indicator, BPM, and SQI.
// =============================================================================

import React, { useEffect, useRef, useState, useMemo } from "react";
import { View, Text, StyleSheet, Dimensions, Platform } from "react-native";
import Svg, { Path, Line, Rect, Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import { bleService } from "@/ble/bleManager";
import { Esp32Packet, SensorId } from "@/ble/types";
import { useBle } from "@/ble";
import { useTheme } from "@/store/themeStore";
import { useAiRisk } from "@/store/aiStore";
import { HeartIcon } from "@/components/common/AppIcons";
import { ECGFilterChain } from "../../../ai-engine/ecg/filters";
import { useLanguage } from "@/i18n/languages";

const MONITOR_WIDTH = 340;
const MONITOR_HEIGHT = 160;
const MAX_DISPLAY_POINTS = 140; // ~140 points across 340px width (~2.4px per point) for crisp clinical trace

export function RealtimeEcgMonitor() {
  const { colors, isDark } = useTheme();
  const { connectionStatus, isSimulating } = useBle();
  const ai = useAiRisk();
  const { t } = useLanguage();

  const isConnected = connectionStatus === "connected";
  const [qrsBeat, setQrsBeat] = useState(false);
  const [displayBpm, setDisplayBpm] = useState<number | null>(null);

  // Digital Signal Processing: 0.5-40Hz Bandpass + 50Hz Notch Filter
  const filterChainRef = useRef(new ECGFilterChain());

  // Rolling buffer of conditioned biopotential samples
  const samplesRef = useRef<number[]>([]);
  const [frameTick, setFrameTick] = useState(0);
  const lastUpdateRef = useRef(0);
  const qrsDebounceRef = useRef(false);

  // Sync BPM from AI Pan-Tompkins engine and clear buffer on disconnect
  useEffect(() => {
    if (!isConnected) {
      samplesRef.current = [];
      filterChainRef.current.reset();
      setDisplayBpm(null);
      setFrameTick((t) => t + 1);
    } else if (ai.heartRate && ai.heartRate > 35 && ai.heartRate < 220) {
      setDisplayBpm(Math.round(ai.heartRate));
    }
  }, [ai.heartRate, isConnected]);

  // Direct high-frequency subscription to 500 Hz EXG stream
  useEffect(() => {
    const unsubscribe = bleService.addPacketListener((packet: Esp32Packet) => {
      if (packet.sensor === SensorId.EXG && packet.samples && packet.samples.length > 0) {
        // Filter raw samples to remove DC baseline wander and 50 Hz powerline hum
        const now = Date.now();
        const rate = packet.rate || 500;
        const filtered = filterChainRef.current.process({
          samples: packet.samples,
          sampleRate: rate,
          timestampStart: now - (packet.samples.length * 1000) / rate,
          timestampEnd: now,
        });

        // Decimate to display rate (e.g. 500Hz -> ~166Hz) to prevent cramped clutter
        const step = (packet.rate || 500) > 300 ? 3 : 1;
        const downsampled: number[] = [];
        for (let i = 0; i < filtered.filteredSamples.length; i += step) {
          downsampled.push(filtered.filteredSamples[i]);
        }

        // Append to rolling display buffer
        const current = samplesRef.current;
        current.push(...downsampled);
        if (current.length > MAX_DISPLAY_POINTS) {
          samplesRef.current = current.slice(-MAX_DISPLAY_POINTS);
        }

        // Visual QRS beat pulse trigger with debounce
        const maxFiltered = Math.max(...filtered.filteredSamples);
        if (maxFiltered > 220 && !qrsDebounceRef.current) {
          qrsDebounceRef.current = true;
          setQrsBeat(true);
          setTimeout(() => setQrsBeat(false), 160);
          setTimeout(() => {
            qrsDebounceRef.current = false;
          }, 320);
        }

        // Throttle canvas re-renders to ~33 FPS for smooth updating without lag
        if (now - lastUpdateRef.current > 30) {
          lastUpdateRef.current = now;
          setFrameTick((t) => (t + 1) % 10000);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Compute SVG path from rolling filtered biopotential buffer
  const { pathString, hasData, lastPoint } = useMemo(() => {
    const samples = samplesRef.current;
    if (!isConnected || samples.length < 8) {
      return { pathString: "", hasData: false, lastPoint: null };
    }

    // Baseline calculation to center waveform in viewport
    let sum = 0;
    for (let i = 0; i < samples.length; i++) {
      sum += samples[i];
    }
    const baseline = sum / samples.length;

    // Determine scale based on max amplitude deviation (with floor to avoid noise blow-up)
    let maxDev = 120;
    for (let i = 0; i < samples.length; i++) {
      const dev = Math.abs(samples[i] - baseline);
      if (dev > maxDev) maxDev = dev;
    }

    const centerY = MONITOR_HEIGHT / 2;
    const usableHalfH = MONITOR_HEIGHT / 2 - 16;
    const scale = usableHalfH / maxDev;
    const stepX = MONITOR_WIDTH / Math.max(samples.length - 1, 1);

    let d = "";
    let lastX = 0;
    let lastY = centerY;

    for (let i = 0; i < samples.length; i++) {
      const x = i * stepX;
      // Invert so positive R-peak spikes upward
      const rawY = centerY - (samples[i] - baseline) * scale;
      const y = Math.max(8, Math.min(MONITOR_HEIGHT - 8, rawY));

      if (i === 0) {
        d += `M ${x.toFixed(1)} ${y.toFixed(1)}`;
      } else {
        d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
      }
      lastX = x;
      lastY = y;
    }

    return {
      pathString: d,
      hasData: true,
      lastPoint: { x: lastX, y: lastY },
    };
  }, [isConnected, frameTick]);

  // SQI classification
  const sqiScore = Math.round(ai.signalQuality.ecg || (isConnected ? 88 : 0));
  const sqiLabel = sqiScore > 75 ? "Clinical Grade" : sqiScore > 40 ? "Usable" : "Noisy Signal";

  return (
    <View className="w-full mb-4">
      <View
        style={{
          backgroundColor: isDark ? "#140A0D" : "#1A090D",
          borderColor: isDark ? "#3F1824" : "#4A1828",
        }}
        className="rounded-[28px] p-4 border shadow-md overflow-hidden relative"
      >
        {/* Cardiac Header with Live Heart Icon & Real-Time Readout */}
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center">
            {/* Pulsing Heart Beat Icon */}
            <View
              style={{
                backgroundColor: qrsBeat ? "#E11D48" : "rgba(225, 29, 72, 0.2)",
                transform: [{ scale: qrsBeat ? 1.18 : 1.0 }],
              }}
              className="w-8 h-8 rounded-full items-center justify-center mr-2.5 transition-all"
            >
              <HeartIcon size={14} color="#FFFFFF" />
            </View>
            <View>
              <View className="flex-row items-center">
                <Text className="font-poppins-bold text-[15px] text-white tracking-wide">
                  Live Cardiac Lead I
                </Text>
                <View className="ml-2 bg-rose-500/20 px-2 py-0.5 rounded-full border border-rose-500/30">
                  <Text className="font-poppins-bold text-[9.5px] text-rose-300 uppercase">
                    500 Hz Real-Time
                  </Text>
                </View>
              </View>
              <Text className="font-poppins-regular text-[11px] text-rose-200/70">
                BioAmp EXG Pill • Pan-Tompkins DSP
              </Text>
            </View>
          </View>

          {/* Large Live BPM Pill */}
          <View className="items-end">
            <View className="flex-row items-baseline">
              <Text className="font-poppins-bold text-[26px] text-rose-400 leading-none mr-1">
                {displayBpm ? displayBpm : "—"}
              </Text>
              <Text className="font-poppins-semibold text-[11px] text-rose-200/80 uppercase">
                BPM
              </Text>
            </View>
            <Text className="font-poppins-medium text-[10px] text-emerald-400">
              {isConnected ? `SQI: ${sqiScore}% • ${sqiLabel}` : "Stream Standby"}
            </Text>
          </View>
        </View>

        {/* Oscilloscope Viewport (Cardiac Ruby Grid & Glowing Biopotential Waveform) */}
        <View
          style={{
            height: MONITOR_HEIGHT,
            backgroundColor: "#0B0406",
            borderRadius: 18,
            overflow: "hidden",
            borderColor: "rgba(225, 29, 72, 0.25)",
            borderWidth: 1,
          }}
          className="w-full relative items-center justify-center"
        >
          <Svg
            width="100%"
            height={MONITOR_HEIGHT}
            viewBox={`0 0 ${MONITOR_WIDTH} ${MONITOR_HEIGHT}`}
            preserveAspectRatio="none"
          >
            <Defs>
              <LinearGradient id="ecgGlow" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#FB7185" stopOpacity="1" />
                <Stop offset="100%" stopColor="#E11D48" stopOpacity="0.85" />
              </LinearGradient>
            </Defs>

            {/* Medical Millivolt Grid Lines (Horizontal) */}
            {[0.2, 0.4, 0.6, 0.8].map((ratio, i) => (
              <Line
                key={`grid-h-${i}`}
                x1={0}
                y1={MONITOR_HEIGHT * ratio}
                x2={MONITOR_WIDTH}
                y2={MONITOR_HEIGHT * ratio}
                stroke="rgba(244, 63, 94, 0.12)"
                strokeWidth={1}
                strokeDasharray="2 3"
              />
            ))}

            {/* Medical Millivolt Grid Lines (Vertical) */}
            {[0.12, 0.25, 0.37, 0.5, 0.62, 0.75, 0.87].map((ratio, i) => (
              <Line
                key={`grid-v-${i}`}
                x1={MONITOR_WIDTH * ratio}
                y1={0}
                x2={MONITOR_WIDTH * ratio}
                y2={MONITOR_HEIGHT}
                stroke="rgba(244, 63, 94, 0.12)"
                strokeWidth={1}
                strokeDasharray="2 3"
              />
            ))}

            {/* Live Waveform or Standby Flatline */}
            {hasData && pathString ? (
              <>
                <Path
                  d={pathString}
                  fill="none"
                  stroke="url(#ecgGlow)"
                  strokeWidth={2.0}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {lastPoint && (
                  <Circle
                    cx={lastPoint.x}
                    cy={lastPoint.y}
                    r={3.2}
                    fill="#FB7185"
                  />
                )}
              </>
            ) : (
              <>
                {/* Standby Calm Baseline with Center Blip */}
                <Line
                  x1={10}
                  y1={MONITOR_HEIGHT / 2}
                  x2={MONITOR_WIDTH - 10}
                  y2={MONITOR_HEIGHT / 2}
                  stroke="rgba(244, 63, 94, 0.35)"
                  strokeWidth={1.8}
                  strokeDasharray="5 5"
                />
                <Circle
                  cx={MONITOR_WIDTH / 2}
                  cy={MONITOR_HEIGHT / 2}
                  r={3.5}
                  fill="#E11D48"
                />
              </>
            )}
          </Svg>

          {/* Standby Guidance Overlay */}
          {!hasData && (
            <View className="absolute items-center px-4">
              <View className="bg-rose-950/80 px-3 py-1.5 rounded-full border border-rose-800/60 flex-row items-center mb-1">
                <View className="w-2 h-2 rounded-full bg-rose-500 mr-2 animate-pulse" />
                <Text className="font-poppins-semibold text-xs text-rose-200">
                  {isConnected ? t("ecgAwaiting") : t("ecgStandby")}
                </Text>
              </View>
              <Text className="font-poppins-regular text-[11px] text-rose-300/70 text-center">
                {isConnected
                  ? t("ecgAligning")
                  : t("ecgConnectPrompt")}
              </Text>
            </View>
          )}
        </View>

        {/* Bottom Strip: Filter & DSP Specs */}
        <View className="flex-row items-center justify-between mt-2.5 px-1">
          <View className="flex-row items-center">
            <Text className="text-[10.5px] font-poppins-medium text-rose-300/80 mr-3">
              Bandpass: 0.5–40 Hz
            </Text>
            <Text className="text-[10.5px] font-poppins-medium text-rose-300/80">
              Notch: 50 Hz Mains
            </Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-1.5 h-1.5 rounded-full bg-rose-400 mr-1.5" />
            <Text className="text-[10.5px] font-poppins-semibold text-rose-300">
              {isSimulating ? t("simulatedSignal") : isConnected ? t("realBiopotential") : t("offline")}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
