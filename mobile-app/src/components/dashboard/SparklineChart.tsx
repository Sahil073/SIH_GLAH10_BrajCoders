import React from "react";
import { View } from "react-native";
import Svg, { Path, Circle } from "react-native-svg";
import { SparklinePoint } from "@/types/dashboard";

interface SparklineChartProps {
  data: SparklinePoint[] | number[];
  height?: number;
  strokeColor?: string;
  strokeWidth?: number;
  showDots?: boolean;
  dotRadius?: number;
}

export function SparklineChart({
  data,
  height = 36,
  strokeColor = "#374151",
  strokeWidth = 1.8,
  showDots = true,
  dotRadius = 2.5,
}: SparklineChartProps) {
  if (!data || data.length === 0) {
    return <View style={{ height }} />;
  }

  // Extract raw numerical values
  const values = data.map((item) =>
    typeof item === "number" ? item : item.value
  );

  const chartWidth = 140; // Internal coordinate width for viewBox
  const chartHeight = height;

  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  // Vertical padding inside graph so dots and peaks don't get cut off
  const paddingY = 6;
  const usableHeight = chartHeight - paddingY * 2;

  // Calculate coordinates for each data point
  const points: { x: number; y: number }[] = values.map((val, index) => {
    const x =
      values.length > 1
        ? (index / (values.length - 1)) * (chartWidth - 10) + 5
        : chartWidth / 2;
    // Invert Y coordinate for SVG
    const normalizedY = (val - minVal) / range;
    const y = chartHeight - paddingY - normalizedY * usableHeight;
    return { x, y };
  });

  // Build a smooth cubic bezier SVG path connecting the points
  let pathD = "";
  if (points.length > 0) {
    pathD = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = i > 0 ? points[i - 1] : points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = i !== points.length - 2 ? points[i + 2] : p2;

      // Catmull-Rom to Cubic Bezier control points calculation
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      pathD += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(
        1
      )} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
  }

  // Dots shown on key points (first, middle peak/trough, and end) to match reference UI exactly
  const dotIndices = [0, 2, 4, 6, points.length - 1].filter(
    (idx) => idx >= 0 && idx < points.length
  );

  return (
    <View style={{ height, width: "100%" }}>
      <Svg
        width="100%"
        height={height}
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        preserveAspectRatio="none"
      >
        {/* Smooth trend curve */}
        <Path
          d={pathD}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Vertex dots matching the reference app_ui.jpg style */}
        {showDots &&
          dotIndices.map((idx) => {
            const pt = points[idx];
            if (!pt) return null;
            return (
              <Circle
                key={`dot-${idx}`}
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
