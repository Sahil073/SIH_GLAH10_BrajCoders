import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  GestureResponderEvent,
  LayoutChangeEvent,
} from "react-native";
import Svg, { Path, Circle, Rect, Defs, LinearGradient, Stop } from "react-native-svg";
import { ChartLineIcon } from "@/components/common/AppIcons";
import { useLanguage } from "@/i18n/languages";

interface InteractiveDetailChartProps {
  values: number[];
  timestamps: string[];
  yAxisLabels: (number | string)[];
  initialSelectedIndex?: number;
  onPointSelected?: (index: number, value: number, timestamp: string) => void;
  height?: number;
}

/**
 * Generates cubic bezier spline path string from points
 */
function createSplinePath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i !== points.length - 2 ? points[i + 2] : p2;

    const cp1x = p1.x + (p2.x - p0.x) / 5.5;
    const cp1y = p1.y + (p2.y - p0.y) / 5.5;
    const cp2x = p2.x - (p3.x - p0.x) / 5.5;
    const cp2y = p2.y - (p3.y - p1.y) / 5.5;

    path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(
      1
    )} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return path;
}

export function InteractiveDetailChart({
  values,
  timestamps,
  yAxisLabels,
  initialSelectedIndex = 5,
  onPointSelected,
  height = 190,
}: InteractiveDetailChartProps) {
  const { t } = useLanguage();
  const [selectedIndex, setSelectedIndex] = useState<number>(
    Math.min(initialSelectedIndex, Math.max(0, values.length - 1))
  );
  const [containerWidth, setContainerWidth] = useState<number>(310);

  const handleLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    if (width > 0) {
      setContainerWidth(width);
    }
  };

  if (values.length === 0) {
    return (
      <View
        onLayout={handleLayout}
        style={{ height, width: "100%" }}
        className="items-center justify-center rounded-2xl border border-dashed border-[#D1D5DB] bg-[#F9FAFB] px-4"
      >
        <View className="mb-1.5">
          <ChartLineIcon size={24} color="#9CA3AF" />
        </View>
        <Text className="font-poppins-semibold text-xs text-[#161616]">
          {t("awaitingSensorData")}
        </Text>
        <Text className="font-poppins-regular text-[11px] text-[#86837C] text-center mt-0.5">
          {t("connectWearableForTrend")}
        </Text>
      </View>
    );
  }

  // Handle single-point series by duplicating to draw a clean steady line
  const displayValues = values.length === 1 ? [values[0], values[0]] : values;
  const displayTimestamps =
    timestamps.length === 1 ? [timestamps[0], timestamps[0]] : timestamps;

  // Extract numeric Y-axis bounds if present to anchor vertical scaling
  const numericLabels = yAxisLabels
    .map((l) => (typeof l === "number" ? l : parseFloat(String(l))))
    .filter((n) => Number.isFinite(n));

  let chartMin = Math.min(...displayValues);
  let chartMax = Math.max(...displayValues);

  if (numericLabels.length >= 2) {
    const yAxisMin = Math.min(...numericLabels);
    const yAxisMax = Math.max(...numericLabels);
    chartMin = Math.min(chartMin, yAxisMin);
    chartMax = Math.max(chartMax, yAxisMax);
  }

  // Minimum domain spread to prevent division by zero or compressed flatlines
  if (chartMax - chartMin < 8) {
    const center = (chartMax + chartMin) / 2;
    chartMin = center - 8;
    chartMax = center + 8;
  }
  const range = chartMax - chartMin;

  // Chart interior metrics
  const chartWidth = containerWidth;
  const paddingX = 14;
  const paddingY = 18;
  const usableWidth = chartWidth - paddingX * 2;
  const usableHeight = height - paddingY * 2;

  // Compute coordinate points
  const points: { x: number; y: number }[] = displayValues.map((val, idx) => {
    const x = paddingX + (idx / Math.max(1, displayValues.length - 1)) * usableWidth;
    const norm = (val - chartMin) / range;
    const y = height - paddingY - norm * usableHeight;
    return { x, y };
  });

  const curvePath = createSplinePath(points);

  // Closed area path for gradient fill below curve
  const firstPoint = points[0] ?? { x: 0, y: height };
  const lastPoint = points[points.length - 1] ?? { x: chartWidth, y: height };
  const areaPath = `${curvePath} L ${lastPoint.x.toFixed(1)} ${height} L ${firstPoint.x.toFixed(
    1
  )} ${height} Z`;

  const clampedIndex = Math.min(selectedIndex, Math.max(0, displayValues.length - 1));
  const activePoint = points[clampedIndex] ?? points[0];
  const activeValue = displayValues[clampedIndex] ?? displayValues[0];

  // Handle touch scrubber
  const handleTouch = (e: GestureResponderEvent) => {
    const touchX = e.nativeEvent.locationX;
    let closestIndex = 0;
    let closestDist = Infinity;

    points.forEach((pt, idx) => {
      const dist = Math.abs(pt.x - touchX);
      if (dist < closestDist) {
        closestDist = dist;
        closestIndex = idx;
      }
    });

    setSelectedIndex(closestIndex);
    if (onPointSelected && values[closestIndex] !== undefined) {
      const ts = timestamps[closestIndex % timestamps.length] ?? "";
      onPointSelected(closestIndex, values[closestIndex], ts);
    }
  };

  return (
    <View className="w-full my-3">
      <View className="flex-row items-stretch">
        {/* Left Y-Axis Labels */}
        <View className="justify-between items-end pr-3.5 py-2 w-10">
          {yAxisLabels.map((lbl, idx) => (
            <Text
              key={`y-lbl-${idx}`}
              className="font-poppins-regular text-[11.5px] text-[#9A9892]"
            >
              {lbl}
            </Text>
          ))}
        </View>

        {/* Chart Canvas Area */}
        <View
          className="flex-1 relative"
          onLayout={handleLayout}
          onStartShouldSetResponder={() => true}
          onResponderGrant={handleTouch}
          onResponderMove={handleTouch}
        >
          <Svg width={chartWidth} height={height}>
            <Defs>
              <LinearGradient id="detailChartGradient" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#D4F056" stopOpacity={0.4} />
                <Stop offset="100%" stopColor="#F7F5F0" stopOpacity={0.0} />
              </LinearGradient>
            </Defs>

            {/* Gradient Area Fill Under Curve */}
            <Path d={areaPath} fill="url(#detailChartGradient)" />

            {/* Smooth Curve Path */}
            <Path
              d={curvePath}
              fill="none"
              stroke="#161616"
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Active Vertical Scrubber Bar (Lime Highlight Bar from reference) */}
            {activePoint && (
              <Rect
                x={activePoint.x - 3.5}
                y={activePoint.y}
                width={7}
                height={Math.max(0, height - activePoint.y)}
                rx={3.5}
                fill="#D4F056"
                opacity={0.7}
              />
            )}

            {/* Active Circular Point Marker */}
            {activePoint && (
              <Circle
                cx={activePoint.x}
                cy={activePoint.y}
                r={5.5}
                fill="#FFFFFF"
                stroke="#161616"
                strokeWidth={2.5}
              />
            )}
          </Svg>

          {/* Floating Tooltip Pill (Showing selected value above point) */}
          {activePoint && (
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                left: Math.max(0, Math.min(activePoint.x - 22, chartWidth - 44)),
                top: Math.max(0, activePoint.y - 32),
              }}
              className="bg-[#161616] px-2.5 py-0.5 rounded-full items-center justify-center shadow-xs"
            >
              <Text className="font-poppins-bold text-[11px] text-white leading-tight">
                {activeValue}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* X-Axis Timestamps Row */}
      <View className="flex-row justify-between pl-10 pr-2 mt-3">
        {timestamps.map((ts, idx) => {
          // Map timestamps proportionally across points
          const isSelected =
            timestamps.length <= 4
              ? Math.floor((selectedIndex / Math.max(1, values.length - 1)) * (timestamps.length - 1)) === idx
              : selectedIndex === idx;

          return (
            <TouchableOpacity
              key={`ts-${idx}`}
              activeOpacity={0.7}
              onPress={() => {
                const targetPointIdx = Math.floor(
                  (idx / Math.max(1, timestamps.length - 1)) * (values.length - 1)
                );
                setSelectedIndex(targetPointIdx);
              }}
            >
              <Text
                className={`text-[11.5px] ${
                  isSelected
                    ? "font-poppins-bold text-[#161616]"
                    : "font-poppins-regular text-[#9A9892]"
                }`}
              >
                {ts}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
