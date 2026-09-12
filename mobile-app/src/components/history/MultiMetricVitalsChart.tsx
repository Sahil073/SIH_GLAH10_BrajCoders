import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  GestureResponderEvent,
  LayoutChangeEvent,
} from "react-native";
import Svg, {
  Path,
  Circle,
  Line,
  G,
} from "react-native-svg";
import {
  HistoryPoint,
  MetricKey,
  METRIC_CONFIGS,
} from "@/data/mockHistoryData";
import { useTheme } from "@/store/themeStore";

interface MultiMetricVitalsChartProps {
  points: HistoryPoint[];
  xLabels: string[];
  height?: number;
}

/**
 * Creates smooth bezier curves connecting data points
 */
function createSplinePath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;

  let path = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = i > 0 ? pts[i - 1] : pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = i !== pts.length - 2 ? pts[i + 2] : p2;

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

export function MultiMetricVitalsChart({
  points,
  xLabels,
  height = 220,
}: MultiMetricVitalsChartProps) {
  const { colors, isDark } = useTheme();
  const [containerWidth, setContainerWidth] = useState<number>(340);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(
    Math.floor(points.length / 2)
  );

  // Toggle active metrics on the chart
  const [activeMetrics, setActiveMetrics] = useState<Record<MetricKey, boolean>>({
    hr: true,
    spo2: true,
    temp: true,
    aqi: false,
    moisture: false,
    steps: false,
  });

  const toggleMetric = (key: MetricKey) => {
    setActiveMetrics((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const allKeys: MetricKey[] = ["hr", "spo2", "temp", "aqi", "moisture", "steps"];

  // Chart dimensions & layout
  const paddingLeft = 10;
  const paddingRight = 10;
  const paddingTop = 15;
  const paddingBottom = 30;
  const yAxisWidth = 32;

  const chartAreaWidth = Math.max(containerWidth - yAxisWidth - paddingRight, 100);
  const chartAreaHeight = Math.max(height - paddingTop - paddingBottom, 80);

  // Coordinate scales
  const getX = (index: number) => {
    if (points.length <= 1) return yAxisWidth + chartAreaWidth / 2;
    return yAxisWidth + (index / (points.length - 1)) * chartAreaWidth;
  };

  const getY = (normValue: number) => {
    const clamped = Math.max(0, Math.min(100, normValue));
    return paddingTop + chartAreaHeight - (clamped / 100) * chartAreaHeight;
  };

  const yTicks = [100, 75, 50, 25, 0];

  const handleTouch = (evt: GestureResponderEvent) => {
    const touchX = evt.nativeEvent.locationX;
    const relativeX = touchX - yAxisWidth;
    if (relativeX < 0 || relativeX > chartAreaWidth) return;

    const ratio = relativeX / chartAreaWidth;
    const rawIdx = Math.round(ratio * (points.length - 1));
    const clampedIdx = Math.max(0, Math.min(points.length - 1, rawIdx));
    setSelectedIndex(clampedIdx);
  };

  const handleLayout = (evt: LayoutChangeEvent) => {
    const width = evt.nativeEvent.layout.width;
    if (width > 0 && Math.abs(width - containerWidth) > 5) {
      setContainerWidth(width);
    }
  };

  const selectedPoint =
    selectedIndex !== null && points[selectedIndex] ? points[selectedIndex] : null;

  if (points.length < 2) {
    return (
      <View
        onLayout={handleLayout}
        style={{
          backgroundColor: colors.cardBg,
          borderColor: colors.cardBorder,
        }}
        className="rounded-3xl p-5 border shadow-sm mb-5"
      >
        <View className="w-full flex-row items-center justify-between mb-3">
          <Text
            style={{ color: colors.textPrimary }}
            className="font-poppins-bold text-[17px]"
          >
            Vitals Trend
          </Text>
          <View
            style={{ backgroundColor: colors.backgroundSecondary }}
            className="px-2.5 py-1 rounded-full border border-gray-200 dark:border-gray-800"
          >
            <Text
              style={{ color: colors.textMuted }}
              className="font-poppins-medium text-[10.5px]"
            >
              No Live Session
            </Text>
          </View>
        </View>

        <View
          style={{
            borderColor: isDark ? "#2A3830" : "#E5E7EB",
            backgroundColor: isDark ? colors.backgroundSecondary : "#F9FAFB",
          }}
          className="w-full py-8 px-4 rounded-2xl border border-dashed items-center justify-center"
        >
          <Text className="text-2xl mb-2">📈</Text>
          <Text
            style={{ color: colors.textPrimary }}
            className="font-poppins-semibold text-sm text-center"
          >
            Not Enough Data Points
          </Text>
          <Text
            style={{ color: colors.textMuted }}
            className="font-poppins-regular text-xs text-center mt-1 max-w-[260px]"
          >
            Connect the Sanjeevni wearable to record continuous vitals for this time period.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View
      onLayout={handleLayout}
      style={{
        backgroundColor: colors.cardBg,
        borderColor: colors.cardBorder,
      }}
      className="rounded-3xl p-4.5 border shadow-sm mb-5"
    >
      {/* Title & Legend Row */}
      <View className="mb-2">
        <Text
          style={{ color: colors.textPrimary }}
          className="font-poppins-bold text-[17px]"
        >
          Vitals Trend
        </Text>

        {/* Legend row with interactive toggles */}
        <View className="flex-row flex-wrap items-center mt-2.5 gap-x-3 gap-y-1.5">
          {allKeys.map((key) => {
            const config = METRIC_CONFIGS[key];
            const isActive = activeMetrics[key];

            return (
              <TouchableOpacity
                key={key}
                activeOpacity={0.7}
                onPress={() => toggleMetric(key)}
                className="flex-row items-center py-0.5"
              >
                <View
                  className="w-2.5 h-2.5 rounded-full mr-1.5"
                  style={{
                    backgroundColor: isActive ? config.color : isDark ? "#374151" : "#D1D5DB",
                  }}
                />
                <Text
                  style={{
                    color: isActive ? colors.textPrimary : colors.textMuted,
                  }}
                  className="font-poppins-medium text-xs"
                >
                  {config.shortLabel}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* SVG Multi-Line Chart Canvas */}
      <View
        onStartShouldSetResponder={() => true}
        onResponderGrant={handleTouch}
        onResponderMove={handleTouch}
        className="relative my-2"
      >
        <Svg width={containerWidth} height={height}>
          {/* Horizontal Grid lines and Y-Axis numbers */}
          {yTicks.map((val) => {
            const y = getY(val);
            return (
              <G key={val}>
                <Line
                  x1={yAxisWidth}
                  y1={y}
                  x2={containerWidth - paddingRight}
                  y2={y}
                  stroke={isDark ? "#243129" : "#F3F4F6"}
                  strokeWidth="1"
                />
              </G>
            );
          })}

          {/* Left Y-Axis Vertical Axis Line */}
          <Line
            x1={yAxisWidth}
            y1={paddingTop}
            x2={yAxisWidth}
            y2={paddingTop + chartAreaHeight}
            stroke={isDark ? "#324338" : "#E5E7EB"}
            strokeWidth="1.2"
          />

          {/* Bottom X-Axis Horizontal Axis Line */}
          <Line
            x1={yAxisWidth}
            y1={paddingTop + chartAreaHeight}
            x2={containerWidth - paddingRight}
            y2={paddingTop + chartAreaHeight}
            stroke={isDark ? "#324338" : "#E5E7EB"}
            strokeWidth="1.2"
          />

          {/* Render Curve and Data Points for each Active Metric */}
          {allKeys.map((key) => {
            if (!activeMetrics[key]) return null;
            const config = METRIC_CONFIGS[key];

            const coords = points.map((p, idx) => ({
              x: getX(idx),
              y: getY(p.norm[key]),
            }));

            const pathString = createSplinePath(coords);

            return (
              <G key={key}>
                {/* Spline Path */}
                <Path
                  d={pathString}
                  fill="none"
                  stroke={config.color}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Circular Data Point Markers matching design image */}
                {coords.map((c, i) => (
                  <Circle
                    key={i}
                    cx={c.x}
                    cy={c.y}
                    r={selectedIndex === i ? 4 : 2.5}
                    fill={config.color}
                    stroke="#FFFFFF"
                    strokeWidth={selectedIndex === i ? 2 : 1}
                  />
                ))}
              </G>
            );
          })}

          {/* Active touch vertical cursor indicator */}
          {selectedIndex !== null && (
            <Line
              x1={getX(selectedIndex)}
              y1={paddingTop}
              x2={getX(selectedIndex)}
              y2={paddingTop + chartAreaHeight}
              stroke="#6B7280"
              strokeWidth="1.5"
              strokeDasharray="3,3"
            />
          )}
        </Svg>

        {/* Y-Axis Label overlays (HTML text for crisp typography) */}
        <View
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: paddingBottom,
            width: yAxisWidth,
            justifyContent: "space-between",
            paddingTop: paddingTop - 8,
          }}
          pointerEvents="none"
        >
          {yTicks.map((val) => (
            <Text
              key={val}
              className="font-poppins-medium text-[10px] text-[#9CA3AF] text-right pr-2"
            >
              {val}
            </Text>
          ))}
        </View>

        {/* X-Axis Labels Row */}
        <View
          style={{
            position: "absolute",
            left: yAxisWidth,
            right: paddingRight,
            bottom: 4,
            flexDirection: "row",
            justifyContent: "space-between",
          }}
          pointerEvents="none"
        >
          {xLabels.map((lbl, idx) => (
            <Text
              key={idx}
              className="font-poppins-regular text-[10px] text-[#9CA3AF]"
            >
              {lbl}
            </Text>
          ))}
        </View>
      </View>

      {/* Selected Time Scrubbed Values Bar */}
      {selectedPoint && (
        <View
          style={{
            backgroundColor: colors.backgroundSecondary,
            borderColor: colors.cardBorder,
          }}
          className="rounded-2xl p-3 border mt-1"
        >
          <View className="flex-row items-center justify-between mb-2">
            <Text
              style={{ color: colors.textPrimary }}
              className="font-poppins-semibold text-xs"
            >
              {selectedPoint.timeLabel} Record
            </Text>
            <Text
              style={{ color: colors.textMuted }}
              className="font-poppins-regular text-[11px]"
            >
              Touch anywhere to inspect
            </Text>
          </View>

          {/* Values Grid */}
          <View className="flex-row flex-wrap gap-y-2">
            {allKeys.map((key) => {
              if (!activeMetrics[key]) return null;
              const config = METRIC_CONFIGS[key];
              const val = selectedPoint.raw[key];

              return (
                <View key={key} className="w-1/3 flex-row items-center pr-2">
                  <View
                    className="w-2 h-2 rounded-full mr-1.5"
                    style={{ backgroundColor: config.color }}
                  />
                  <Text
                    style={{ color: colors.textSecondary }}
                    className="font-poppins-regular text-xs"
                  >
                    {config.shortLabel}:{" "}
                    <Text
                      style={{ color: colors.textPrimary }}
                      className="font-poppins-bold"
                    >
                      {val} {config.unit}
                    </Text>
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}
