import React from "react";
import Svg, { Path, Circle, Rect } from "react-native-svg";

interface IconProps {
  size?: number;
  color?: string;
}

/**
 * Critical Alert Shield Icon
 */
export function CriticalShieldIcon({ size = 20, color = "#EF4444" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2L4 5.5V11.5C4 16.5 7.5 20.8 12 22C16.5 20.8 20 16.5 20 11.5V5.5L12 2Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 8V12"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <Circle cx="12" cy="16" r="1.2" fill={color} />
    </Svg>
  );
}

/**
 * Warning Triangle Icon
 */
export function WarningTriangleIcon({ size = 20, color = "#F59E0B" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10.29 3.86L1.82 18A2 2 0 0 0 3.55 21H20.45A2 2 0 0 0 22.18 18L13.71 3.86A2 2 0 0 0 10.29 3.86Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 9V13"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Circle cx="12" cy="17" r="1.2" fill={color} />
    </Svg>
  );
}

/**
 * Info Circle Icon
 */
export function InfoCircleIcon({ size = 20, color = "#0284C7" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path
        d="M12 11V16"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Circle cx="12" cy="8" r="1.2" fill={color} />
    </Svg>
  );
}

/**
 * Heart Rate Pulse Icon for Vitals
 */
export function HeartPulseAlertIcon({ size = 18, color = "#EF4444" }: IconProps) {
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
 * SpO2 Droplet Icon
 */
export function Spo2AlertIcon({ size = 18, color = "#0284C7" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="14" r="2.5" stroke={color} strokeWidth="1.5" />
    </Svg>
  );
}

/**
 * Thermometer Icon for Heat and Temperature
 */
export function TempAlertIcon({ size = 18, color = "#EA580C" }: IconProps) {
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
 * Cloud / Particulate Icon for AQI
 */
export function AqiAlertIcon({ size = 18, color = "#78350F" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M8 15h8M7 12h10" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

/**
 * Humidity / Moisture Icon
 */
export function HumidityAlertIcon({ size = 18, color = "#0D9488" }: IconProps) {
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
 * Sudden Fall / Motion Alert Icon
 */
export function FallAlertIcon({ size = 18, color = "#DC2626" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="16" cy="4" r="2" stroke={color} strokeWidth="2" />
      <Path
        d="M18 10L14 12L10 9L6 11"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M13 13L11 19L7 21"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M5 16L3 21"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

/**
 * Battery Alert Icon
 */
export function BatteryAlertIcon({ size = 18, color = "#D97706" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x="2"
        y="6"
        width="17"
        height="12"
        rx="2"
        stroke={color}
        strokeWidth="2"
      />
      <Path
        d="M21 10V14"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Rect x="5" y="9" width="4" height="6" rx="1" fill={color} />
    </Svg>
  );
}

/**
 * Bluetooth / Sync Icon
 */
export function SyncAlertIcon({ size = 18, color = "#2563EB" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6.5 6.5L17.5 17.5L12 23V1L17.5 6.5L6.5 17.5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Check Circle Icon for Resolved / Normal Status
 */
export function CheckCircleAlertIcon({ size = 18, color = "#16A34A" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path
        d="M8.5 12.5L11 15L15.5 9.5"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Small Chevron Right for cards
 */
export function ChevronRightIcon({ size = 14, color = "#9E9B94" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 18L15 12L9 6"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Checkmark Icon for dismissing / acknowledging
 */
export function CheckmarkIcon({ size = 14, color = "#161616" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17L4 12"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Shield Safe Status Icon
 */
export function ShieldSafeIcon({ size = 20, color = "#16A34A" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2L4 5.5V11.5C4 16.5 7.5 20.8 12 22C16.5 20.8 20 16.5 20 11.5V5.5L12 2Z"
        fill="#DCFCE7"
        stroke={color}
        strokeWidth="1.8"
      />
      <Path
        d="M9 12L11 14L15 10"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
