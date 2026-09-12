import React from "react";
import { View } from "react-native";
import Svg, { Path, Circle, Rect, Line } from "react-native-svg";
import { WeeklyBarPoint } from "@/types/dashboard";

/**
 * Calculates a smooth cubic bezier SVG path from coordinate points.
 * Fully guarded against NaN or non-finite values to prevent Android native Skia crashes.
 */
function createSplinePath(points: { x: number; y: number }[]): string {
  if (!points || points.length === 0) return "";
  const allFinite = points.every(
    (p) => Number.isFinite(p.x) && Number.isFinite(p.y)
  );
  if (!allFinite) return "";

  if (points.length === 1) {
    return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  }
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

    if (
      !Number.isFinite(cp1x) ||
      !Number.isFinite(cp1y) ||
      !Number.isFinite(cp2x) ||
      !Number.isFinite(cp2y)
    ) {
      return "";
    }

    path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(
      1
    )} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return path;
}

/**
 * Dual Wave Chart for Blood Pressure / SpO2 Card
 * Shows two undulating smooth curves or neutral dashed baselines if data is empty.
 */
export function DualWaveChart({
  upperValues = [],
  lowerValues = [],
  height = 42,
  upperStroke = "#161616",
  lowerStroke = "#9E9B94",
}: {
  upperValues?: number[];
  lowerValues?: number[];
  height?: number;
  upperStroke?: string;
  lowerStroke?: string;
}) {
  const chartWidth = 140;
  const paddingX = 4;
  const usableWidth = chartWidth - paddingX * 2;

  const validUpper = upperValues.filter(
    (v): v is number => typeof v === "number" && Number.isFinite(v)
  );
  const validLower = lowerValues.filter(
    (v): v is number => typeof v === "number" && Number.isFinite(v)
  );

  const hasUpper = validUpper.length >= 2;
  const hasLower = validLower.length >= 2;

  let upperPath = "";
  if (hasUpper) {
    const upperMin = Math.min(...validUpper);
    const upperMax = Math.max(...validUpper);
    const range = upperMax - upperMin || 1;
    const upperPoints = validUpper.map((val, idx) => {
      const x = paddingX + (idx / (validUpper.length - 1)) * usableWidth;
      const norm = (val - upperMin) / range;
      const y = height - 8 - norm * (height - 16);
      return { x, y };
    });
    upperPath = createSplinePath(upperPoints);
  }

  let lowerPath = "";
  if (hasLower) {
    const lowerMin = Math.min(...validLower);
    const lowerMax = Math.max(...validLower);
    const range = lowerMax - lowerMin || 1;
    const lowerPoints = validLower.map((val, idx) => {
      const x = paddingX + (idx / (validLower.length - 1)) * usableWidth;
      const norm = (val - lowerMin) / range;
      const y = height - 2 - norm * (height - 18);
      return { x, y };
    });
    lowerPath = createSplinePath(lowerPoints);
  }

  return (
    <View style={{ height, width: "100%" }}>
      <Svg
        width="100%"
        height={height}
        viewBox={`0 0 ${chartWidth} ${height}`}
        preserveAspectRatio="none"
      >
        {/* Secondary lower wave or neutral dashed baseline */}
        {hasLower ? (
          <Path
            d={lowerPath}
            fill="none"
            stroke={lowerStroke}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          <Line
            x1={paddingX}
            y1={height * 0.7}
            x2={chartWidth - paddingX}
            y2={height * 0.7}
            stroke="#C4C0B6"
            strokeWidth={1.5}
            strokeDasharray="4 4"
          />
        )}

        {/* Primary upper wave or neutral dashed baseline */}
        {hasUpper ? (
          <Path
            d={upperPath}
            fill="none"
            stroke={upperStroke}
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          <Line
            x1={paddingX}
            y1={height * 0.35}
            x2={chartWidth - paddingX}
            y2={height * 0.35}
            stroke="#8A867D"
            strokeWidth={1.8}
            strokeDasharray="4 4"
          />
        )}
      </Svg>
    </View>
  );
}

/**
 * Pulse Wave Chart for Heart Rate Card
 * Crisp black pulse wave across the card, or calm baseline if waiting for signal.
 */
export function PulseWaveChart({
  values = [],
  height = 42,
  strokeColor = "#161616",
  baselineColor = "#5C6624",
}: {
  values?: number[];
  height?: number;
  strokeColor?: string;
  baselineColor?: string;
}) {
  const chartWidth = 140;
  const paddingX = 4;
  const usableWidth = chartWidth - paddingX * 2;

  const validValues = values.filter(
    (v): v is number => typeof v === "number" && Number.isFinite(v)
  );

  const hasData = validValues.length >= 2;

  let path = "";
  if (hasData) {
    const min = Math.min(...validValues);
    const max = Math.max(...validValues);
    const range = max - min || 1;

    const points = validValues.map((val, idx) => {
      const x = paddingX + (idx / (validValues.length - 1)) * usableWidth;
      const norm = (val - min) / range;
      const y = height - 5 - norm * (height - 10);
      return { x, y };
    });

    path = createSplinePath(points);
  }

  return (
    <View style={{ height, width: "100%" }}>
      <Svg
        width="100%"
        height={height}
        viewBox={`0 0 ${chartWidth} ${height}`}
        preserveAspectRatio="none"
      >
        {hasData ? (
          <Path
            d={path}
            fill="none"
            stroke={strokeColor}
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          <Line
            x1={paddingX}
            y1={height / 2}
            x2={chartWidth - paddingX}
            y2={height / 2}
            stroke={baselineColor}
            strokeWidth={1.8}
            strokeDasharray="5 4"
          />
        )}
      </Svg>
    </View>
  );
}

/**
 * 7-Day Pill Bar Chart for Sleep / Activity Card
 * 7 vertical capsules with two-tone fill matching app_ui.jpg
 */
export function PillBarChart({
  bars = [],
  height = 44,
  trackColor = "#BBD839",
  fillColor = "#161616",
}: {
  bars?: WeeklyBarPoint[];
  height?: number;
  trackColor?: string;
  fillColor?: string;
}) {
  const displayBars =
    bars.length > 0
      ? bars
      : [
          { day: "M", value: 0, maxValue: 10000 },
          { day: "T", value: 0, maxValue: 10000 },
          { day: "W", value: 0, maxValue: 10000 },
          { day: "T", value: 0, maxValue: 10000 },
          { day: "F", value: 0, maxValue: 10000 },
          { day: "S", value: 0, maxValue: 10000 },
          { day: "S", value: 0, maxValue: 10000 },
        ];

  const barWidth = 6.5;
  const barCount = displayBars.length;
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
        {displayBars.map((item, idx) => {
          const x = idx * (barWidth + spacing);
          const ratio = item.maxValue > 0 ? Math.min(Math.max(item.value / item.maxValue, 0), 1) : 0;
          const activeHeight = ratio > 0 ? Math.max(height * ratio, 6) : 0;
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
              {activeHeight > 0 && (
                <Rect
                  x={x}
                  y={activeY}
                  width={barWidth}
                  height={activeHeight}
                  rx={barWidth / 2}
                  fill={fillColor}
                />
              )}
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
  progress = 0, // 0 to 1
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
  const clamped = Math.min(Math.max(progress, 0), 1);
  const strokeDashoffset = circumference * (1 - clamped);

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
        {clamped > 0 && (
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
        )}
      </Svg>
    </View>
  );
}

/**
 * Smooth Trend Wave Chart for Temperature, AQI, Moisture, etc.
 * Renders smooth spline curve or neutral dashed line when empty.
 */
export function SmoothTrendWaveChart({
  values = [],
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

  const validValues = values.filter(
    (v): v is number => typeof v === "number" && Number.isFinite(v)
  );

  const hasData = validValues.length >= 2;

  let points: { x: number; y: number }[] = [];
  let path = "";

  if (hasData) {
    const min = Math.min(...validValues);
    const max = Math.max(...validValues);
    const range = max - min || 1;

    points = validValues.map((val, idx) => {
      const x = paddingX + (idx / (validValues.length - 1)) * usableWidth;
      const norm = (val - min) / range;
      const y = height - 6 - norm * (height - 12);
      return { x, y };
    });

    path = createSplinePath(points);
  }

  return (
    <View style={{ height, width: "100%" }}>
      <Svg
        width="100%"
        height={height}
        viewBox={`0 0 ${chartWidth} ${height}`}
        preserveAspectRatio="none"
      >
        {hasData ? (
          <>
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
          </>
        ) : (
          <Line
            x1={paddingX}
            y1={height / 2}
            x2={chartWidth - paddingX}
            y2={height / 2}
            stroke="#9E9B94"
            strokeWidth={1.8}
            strokeDasharray="4 4"
          />
        )}
      </Svg>
    </View>
  );
}
