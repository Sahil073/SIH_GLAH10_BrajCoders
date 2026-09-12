import React from "react";
import { View } from "react-native";
import Svg, { Path, Circle } from "react-native-svg";

interface IconProps {
  size?: number;
  color?: string;
}

/**
 * Circular Search Button Icon for Top Bar
 */
export function SearchIcon({ size = 18, color = "#161616" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2.2" />
      <Path
        d="M20 20L16.5 16.5"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

/**
 * Circular Bell Button Icon for Top Bar
 */
export function BellIcon({ size = 18, color = "#161616" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 0 0 6 8C6 15 3 17 3 17H21S18 15 18 8Z"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M13.7 21A2 2 0 0 1 10.3 21"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

/**
 * Blood Pressure / Droplet Icon
 */
export function BloodPressureIcon({ size = 16, color = "#161616" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2.7L6.5 9.5C4.5 12 4.5 15.5 6.5 18C8.5 20.5 12 21.5 14.5 20C17.5 18 19 14.5 17.5 11L12 2.7Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="10.5" cy="14.5" r="2.5" stroke={color} strokeWidth="1.5" />
    </Svg>
  );
}

/**
 * Heart Rate Pulse Icon
 */
export function HeartPulseIcon({ size = 16, color = "#161616" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8.5 12H10.5L12 9.5L13.5 14L14.8 12H16"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Sleep Moon Icon
 */
export function MoonIcon({ size = 16, color = "#161616" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Flame / Calories Icon
 */
export function FlameIcon({ size = 16, color = "#161616" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8.5 14.5C8.5 17.5 10 19.5 12.5 19.5C15 19.5 16.5 17.5 16.5 14.5C16.5 11 13 8.5 12 4.5C10 8 8.5 11 8.5 14.5Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Clock Icon for Appointment / Medication Due Time
 */
export function ClockIcon({ size = 14, color = "#161616" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path
        d="M12 7V12L15 14"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Capsule Pill Icon with Counter Badge for Medication Section
 */
export function MedicationPillBadge({ count = 30 }: { count?: number }) {
  return (
    <View className="relative w-12 h-12 items-center justify-center">
      {/* Soft Grey Circle Base */}
      <View className="w-11 h-11 rounded-full bg-[#EDE9E2] items-center justify-center">
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Path
            d="M10.5 4.5L4.5 10.5C2.5 12.5 2.5 15.5 4.5 17.5C6.5 19.5 9.5 19.5 11.5 17.5L17.5 11.5C19.5 9.5 19.5 6.5 17.5 4.5C15.5 2.5 12.5 2.5 10.5 4.5Z"
            stroke="#161616"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M8.5 14.5L14.5 8.5"
            stroke="#161616"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </Svg>
      </View>
      {/* Overlapping Black Counter Circle */}
      <View className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-[#161616] items-center justify-center border-2 border-white">
        <View className="items-center justify-center">
          <Svg width={10} height={10} viewBox="0 0 10 10">
            <Path
              d="M2 5H8M5 2V8"
              stroke="#FFFFFF"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </Svg>
        </View>
      </View>
    </View>
  );
}

/**
 * Three Vertical Dots Icon
 */
export function MoreDotsIcon({ size = 16, color = "#9E9B94" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="5" r="1.8" fill={color} />
      <Circle cx="12" cy="12" r="1.8" fill={color} />
      <Circle cx="12" cy="19" r="1.8" fill={color} />
    </Svg>
  );
}

/**
 * Droplet Icon for SpO2 Card
 */
export function DropletIcon({ size = 16, color = "#161616" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Thermometer Icon for Temperature Card
 */
export function ThermometerIcon({ size = 16, color = "#161616" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="11.5" cy="17.5" r="2" fill={color} />
      <Path d="M11.5 12V15.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

/**
 * Cloud Icon for AQI Card
 */
export function CloudIcon({ size = 16, color = "#161616" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Moisture / Humidity Droplet Icon
 */
export function MoistureIcon({ size = 16, color = "#161616" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8.5 14C9.5 13 11 13 12 14C13 15 14.5 15 15.5 14"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </Svg>
  );
}

/**
 * Walking Human Figure Icon for Step Activity Card
 */
export function WalkingPersonIcon({ size = 16, color = "#161616" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="4" r="2" stroke={color} strokeWidth="2" />
      <Path
        d="M9 11.5L11.5 9H13.5L15.5 11.5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 9V14L9.5 20.5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 14L14.5 20.5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

