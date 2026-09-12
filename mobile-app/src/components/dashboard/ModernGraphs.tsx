import React from "react";
import { View } from "react-native";
import Svg, { Path, Circle, Rect } from "react-native-svg";
import { WeeklyBarPoint } from "@/types/dashboard";

/**
 * Calculates a smooth cubic bezier SVG path from coordinate points.
 */
function createSplinePath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i !== points.length - 2 ? points[i + 2] : p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p0.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(
      1
    )} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return path;
}

/**
 * Dual Wave Chart for Blood Pressure / SpO2 Card
 * Shows two undulating smooth sine curves (primary dark, secondary muted)
 */
export function DualWaveChart({
  upperValues = [35, 48, 40, 56, 44, 52, 38, 46],
  lowerValues = [18, 30, 24, 34, 26, 32, 22, 28],
  height = 42,
}: {
  upperValues?: number[];
  lowerValues?: number[];
  height?: number;
}) {
  const chartWidth = 140;
  const paddingX = 4;
  const usableWidth = chartWidth - paddingX * 2;

  // Normalize upper curve
  const upperMin = 20;
  const upperMax = 70;
  const upperPoints = upperValues.map((val, idx) => {
    const x = paddingX + (idx / (upperValues.length - 1)) * usableWidth;
    const norm = (val - upperMin) / (upperMax - upperMin);
    const y = height - 6 - norm * (height - 12);
    return { x, y };
  });

  // Normalize lower curve
  const lowerMin = 10;
  const lowerMax = 50;
  const lowerPoints = lowerValues.map((val, idx) => {
    const x = paddingX + (idx / (lowerValues.length - 1)) * usableWidth;
    const norm = (val - lowerMin) / (lowerMax - lowerMin);
    const y = height - 2 - norm * (height - 14);
    return { x, y };
  });

  const upperPath = createSplinePath(upperPoints);
  const lowerPath = createSplinePath(lowerPoints);

  return (
    <View style={{ height, width: "100%" }}>
      <Svg
        width="100%"
        height={height}
        viewBox={`0 0 ${chartWidth} ${height}`}
        preserveAspectRatio="none"
      >
        {/* Secondary lower wave */}
        <Path
          d={lowerPath}
          fill="none"
          stroke="#9E9B94"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Primary upper wave */}
        <Path
          d={upperPath}
          fill="none"
          stroke="#161616"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

/**
 * Pulse Wave Chart for Heart Rate Card
 * Crisp black pulse wave across the vibrant lime card
 */
export function PulseWaveChart({
  values = [40, 36, 52, 44, 40, 68, 38, 56, 35, 48],
  height = 42,
}: {
  values?: number[];
  height?: number;
}) {
  const chartWidth = 140;
  const paddingX = 4;
  const usableWidth = chartWidth - paddingX * 2;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values.map((val, idx) => {
    const x = paddingX + (idx / (values.length - 1)) * usableWidth;
    const norm = (val - min) / range;
    const y = height - 5 - norm * (height - 10);
    return { x, y };
  });

  const path = createSplinePath(points);

  return (
    <View style={{ height, width: "100%" }}>
      <Svg
        width="100%"
        height={height}
        viewBox={`0 0 ${chartWidth} ${height}`}
        preserveAspectRatio="none"
      >
        <Path
          d={path}
          fill="none"
          stroke="#161616"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

/**
 * 7-Day Pill Bar Chart for Sleep / Activity Card
 * 7 vertical capsules with two-tone fill matching app_ui.jpg
 */
export function PillBarChart({
  bars,
  height = 44,
  trackColor = "#BBD839",
  fillColor = "#161616",
}: {
  bars: WeeklyBarPoint[];
  height?: number;
  trackColor?: string;
  fillColor?: string;
}) {
  const barWidth = 6.5;
  const barCount = bars.length;
  const totalSvgWidth = 130;
  const spacing = (totalSvgWidth - barWidth * barCount) / (barCount - 1);

  return (
    <View style={{ height, width: "100%", justifyContent: "center" }}>
      <Svg
        width="100%"
        height={height}
        viewBox={`0 0 ${totalSvgWidth} ${height}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {bars.map((item, idx) => {
          const x = idx * (barWidth + spacing);
          const ratio = Math.min(Math.max(item.value / item.maxValue, 0.2), 0.95);
          const activeHeight = height * ratio;
          const activeY = height - activeHeight;

          return (
            <React.Fragment key={`bar-${idx}`}>
              {/* Full height background track */}
              <Rect
                x={x}
                y={0}
                width={barWidth}
                height={height}
                rx={barWidth / 2}
                fill={trackColor}
              />
              {/* Dark active bottom fill capsule */}
              <Rect
                x={x}
                y={activeY}
                width={barWidth}
                height={activeHeight}
                rx={barWidth / 2}
                fill={fillColor}
              />
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

/**
 * Donut / Radial Progress Arc Chart for Calories / AQI Card
 * Modern circular arc gauge matching app_ui.jpg
 */
export function DonutArcChart({
  progress = 0.58, // 0 to 1
  size = 54,
  trackColor = "#DDD9D1",
  activeColor = "#161616",
  strokeWidth = 9,
}: {
  progress?: number;
  size?: number;
  trackColor?: string;
  activeColor?: string;
  strokeWidth?: number;
}) {
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - Math.min(Math.max(progress, 0.05), 1));

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background Track Circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Active Dark Arc Segment */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={activeColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>
    </View>
  );
}

/**
 * Smooth Trend Wave Chart for Temperature, AQI, Moisture, etc.
 * Supports configurable stroke color, stroke width, and optional inflection markers
 */
export function SmoothTrendWaveChart({
  values = [30, 42, 38, 50, 45, 55, 48, 52],
  height = 42,
  strokeColor = "#161616",
  strokeWidth = 2.2,
  showDots = false,
  dotRadius = 2.5,
}: {
  values?: number[];
  height?: number;
  strokeColor?: string;
  strokeWidth?: number;
  showDots?: boolean;
  dotRadius?: number;
}) {
  const chartWidth = 140;
  const paddingX = 4;
  const usableWidth = chartWidth - paddingX * 2;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values.map((val, idx) => {
    const x = paddingX + (idx / (values.length - 1)) * usableWidth;
    const norm = (val - min) / range;
    const y = height - 6 - norm * (height - 12);
    return { x, y };
  });

  const path = createSplinePath(points);

  return (
    <View style={{ height, width: "100%" }}>
      <Svg
        width="100%"
        height={height}
        viewBox={`0 0 ${chartWidth} ${height}`}
        preserveAspectRatio="none"
      >
        <Path
          d={path}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {showDots &&
          [0, Math.floor(points.length / 2), points.length - 1].map((idx) => {
            const pt = points[idx];
            if (!pt) return null;
            return (
              <Circle
                key={`pt-${idx}`}
                cx={pt.x}
                cy={pt.y}
                r={dotRadius}
                fill={strokeColor}
              />
            );
          })}
      </Svg>
    </View>
  );
}

