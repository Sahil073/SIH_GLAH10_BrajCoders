import React from "react";
import Svg, { Path, Circle, Rect, G } from "react-native-svg";

interface IconProps {
  size?: number;
  color?: string;
}

// 1. Heart / Cardiac Icon
export function HeartIcon({ size = 20, color = "#DC2626" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z"
        fill={color}
      />
    </Svg>
  );
}

// 2. Pulse / Heartbeat Line Icon
export function HeartPulseIcon({ size = 20, color = "#DC2626" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2 12H6L9 4L14 20L17 12H22"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// 3. Sun / Thermal Stress Icon
export function SunIcon({ size = 20, color = "#F59E0B" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="5" stroke={color} strokeWidth="2.2" />
      <Path
        d="M12 2V4M12 20V22M4 12H2M22 12H20M19.07 4.93L17.66 6.34M6.34 17.66L4.93 19.07M19.07 19.07L17.66 17.66M6.34 6.34L4.93 4.93"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

// 4. Lungs / Respiratory SpO2 Icon
export function LungsIcon({ size = 20, color = "#2563EB" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 4V12M12 7C9.5 7 7 8 7 11V16C7 18.5 9 20 11 20C11.6 20 12 19.5 12 19V12M12 7C14.5 7 17 8 17 11V16C17 18.5 15 20 13 20C12.4 20 12 19.5 12 19V12"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// 5. Thermometer / Body Temp Icon
export function ThermometerIcon({ size = 20, color = "#EF4444" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 14.76V5C14 3.9 13.1 3 12 3C10.9 3 10 3.9 10 5V14.76C8.8 15.65 8 17.2 8 19C8 21.2 9.8 23 12 23C14.2 23 16 21.2 16 19C16 17.2 15.2 15.65 14 14.76Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="19" r="2" fill={color} />
    </Svg>
  );
}

// 6. Wind / AQI Air Quality Icon
export function WindIcon({ size = 20, color = "#64748B" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9.59 4.59A2 2 0 1 1 11 8H2M12.59 19.41A2 2 0 1 0 14 16H2M17.73 7.73A2.5 2.5 0 1 1 19.5 12H2"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// 7. Shield / Security / Fall Protection Icon
export function ShieldIcon({ size = 20, color = "#16A34A" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22S20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// 8. Shield Check Icon
export function ShieldCheckIcon({ size = 20, color = "#16A34A" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22S20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
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

// 9. Location Pin Icon
export function LocationPinIcon({ size = 20, color = "#EF4444" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 5 7 1 12 1C17 1 21 5 21 10Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="10" r="3" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

// 10. Lock / Privacy Icon
export function LockIcon({ size = 18, color = "#15803D" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x="3"
        y="11"
        width="18"
        height="11"
        rx="2"
        ry="2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M7 11V7A5 5 0 0 1 17 7V11"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// 11. Phone / Call Icon
export function PhoneCallIcon({ size = 18, color = "#FFFFFF" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 16.92V19.92C22 20.48 21.54 20.93 20.98 20.92C10.5 20.37 3.63 13.5 3.08 3.02C3.07 2.46 3.52 2 4.08 2H7.08C7.58 2 8 2.37 8.08 2.87C8.22 3.82 8.49 4.74 8.87 5.6C9.02 5.95 8.93 6.36 8.65 6.64L6.92 8.37C8.42 11.38 10.62 13.58 13.63 15.08L15.36 13.35C15.64 13.07 16.05 12.98 16.4 13.13C17.26 13.51 18.18 13.78 19.13 13.92C19.63 14 20 14.42 20 14.92V16.92Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// 12. Ambulance / First Aid Icon
export function AmbulanceIcon({ size = 20, color = "#DC2626" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 17H5C3.9 17 3 16.1 3 15V6C3 4.9 3.9 4 5 4H15L19 9V15C19 16.1 18.1 17 17 17H19Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="7.5" cy="17.5" r="2.5" stroke={color} strokeWidth="2" />
      <Circle cx="16.5" cy="17.5" r="2.5" stroke={color} strokeWidth="2" />
      <Path d="M9 8H13M11 6V10" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// 13. Stethoscope / Healthcare Icon
export function StethoscopeIcon({ size = 20, color = "#7C3AED" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4.5 3V9C4.5 12 7 14.5 10 14.5H11C14 14.5 16.5 12 16.5 9V3"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <Path
        d="M10.5 14.5V17.5C10.5 19.5 12 21 14 21C16 21 17.5 19.5 17.5 17.5V16"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <Circle cx="17.5" cy="15" r="2" fill={color} />
      <Circle cx="4.5" cy="3" r="1.5" fill={color} />
      <Circle cx="16.5" cy="3" r="1.5" fill={color} />
    </Svg>
  );
}

// 14. Family / Users Icon
export function UsersIcon({ size = 20, color = "#2563EB" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17 21V19C17 16.8 15.2 15 13 15H5C2.8 15 1 16.8 1 19V21"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2" />
      <Path
        d="M23 21V19C23 17.2 21.8 15.6 20.2 15.1"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Path
        d="M16 3.1C17.2 3.6 18 4.7 18 6C18 7.3 17.2 8.4 16 8.9"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

// 15. Trend / Line Chart Icon
export function TrendChartIcon({ size = 18, color = "#4F46E5" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M23 6L13.5 15.5L8.5 10.5L1 18"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M17 6H23V12"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// 16. Leaf / Wellness Icon
export function LeafIcon({ size = 18, color = "#16A34A" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 20A7 7 0 0 1 4 13C4 8 8 3 13 3A7 7 0 0 1 20 10C20 15 16 20 11 20Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M4 20L11 13" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// 17. Battery Icon
export function BatteryIcon({ size = 18, color = "#16A34A" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x="1"
        y="6"
        width="18"
        height="12"
        rx="2"
        ry="2"
        stroke={color}
        strokeWidth="2"
      />
      <Path d="M23 11V13" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Rect x="4" y="9" width="8" height="6" fill={color} rx="1" />
    </Svg>
  );
}

// 18. Check Circle / Success Icon
export function CheckCircleIcon({ size = 20, color = "#16A34A" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path
        d="M8 12L11 15L16 9"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// 19. Alert Triangle / Caution Icon
export function AlertTriangleIcon({ size = 20, color = "#F59E0B" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10.29 3.86L1.82 18C1.64 18.3 1.55 18.65 1.55 19C1.55 19.35 1.64 19.7 1.82 20C2 20.3 2.26 20.56 2.57 20.73C2.88 20.9 3.23 21 3.59 21H20.41C20.77 21 21.12 20.9 21.43 20.73C21.74 20.56 22 20.3 22.18 20C22.36 19.7 22.45 19.35 22.45 19C22.45 18.65 22.36 18.3 22.18 18L13.71 3.86C13.53 3.55 13.27 3.3 12.96 3.13C12.65 2.96 12.3 2.87 11.94 2.87C11.58 2.87 11.23 2.96 10.92 3.13C10.61 3.3 10.35 3.55 10.17 3.86H10.29Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M12 9V13M12 17H12.01" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

// 20. Walking / Posture Icon
export function WalkingIcon({ size = 20, color = "#16A34A" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="4" r="2" stroke={color} strokeWidth="2" />
      <Path
        d="M10 22L12 16L15 18V22M9 13L12 10L15 12L17 9M7 11L9 13L8 16"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// 21. Clock / Time Icon
export function ClockIcon({ size = 16, color = "#6B7280" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M12 6V12L16 14" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// 22. Download / Export Archive Icon
export function DownloadArchiveIcon({ size = 18, color = "#374151" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 15V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V15M7 10L12 15L17 10M12 15V3"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// 23. Lightning / Quick Simulation Icon
export function BoltIcon({ size = 18, color = "#DC2626" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M13 2L3 14H12L11 22L21 10H12L13 2Z"
        fill={color}
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// 24. Flood / Water Waves Icon
export function WavesIcon({ size = 20, color = "#0284C7" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2 6C5 4 8 8 12 6C16 4 19 8 22 6M2 12C5 10 8 14 12 12C16 10 19 14 22 12M2 18C5 16 8 20 12 18C16 16 19 20 22 18"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

// 25. Mail Icon
export function MailIcon({ size = 20, color = "#2563EB" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3 7L12 13L21 7"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// 26. Eye Icon
export function EyeIcon({ size = 20, color = "#64748B" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

// 27. Eye Off Icon
export function EyeOffIcon({ size = 20, color = "#64748B" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17.94 17.94A10.07 10.07 0 0 1 12 20C5 20 1 12 1 12A18.45 18.45 0 0 1 5.06 6.06M9.9 4.24A9.12 9.12 0 0 1 12 4C19 4 23 12 23 12A18.5 18.5 0 0 1 19.78 16.22M1 1L23 23"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14.12 14.12A3 3 0 1 1 9.88 9.88"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// 28. Info Icon
export function InfoIcon({ size = 18, color = "#2563EB" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M12 16V12M12 8H12.01" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

// 29. Play Icon
export function PlayIcon({ size = 18, color = "#16A34A" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 3L19 12L5 21V3Z"
        fill={color}
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// 30. Stop Icon
export function StopIcon({ size = 18, color = "#DC2626" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x="5"
        y="5"
        width="14"
        height="14"
        rx="2"
        fill={color}
        stroke={color}
        strokeWidth="2"
      />
    </Svg>
  );
}

// 31. Scale / Balance Icon
export function ScaleIcon({ size = 20, color = "#059669" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3V21M12 3L6 8M12 3L18 8M6 8L3 14H9L6 8ZM18 8L15 14H21L18 8Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// 32. Cloud Icon
export function CloudIcon({ size = 20, color = "#2563EB" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 10H17.26A8 8 0 1 0 6.07 14.45M18 10A5 5 0 0 1 18 20H6A6 6 0 0 1 6.07 14.45M18 10C18 7.24 15.76 5 13 5M6.07 14.45A5 5 0 0 1 6 14"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// 33. Gear / Settings Icon
export function GearIcon({ size = 18, color = "#4B5563" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
      <Path
        d="M19.4 15A1.65 1.65 0 0 0 20 16.5V18A2 2 0 0 1 18 20H16.5A1.65 1.65 0 0 0 15 19.4L14.2 20.2A2 2 0 0 1 11.4 20.2L9.8 18.6A2 2 0 0 1 9.8 15.8L10.6 15A1.65 1.65 0 0 0 10 13.5H8.5A2 2 0 0 1 6.5 11.5V10A2 2 0 0 1 8.5 8H10A1.65 1.65 0 0 0 10.6 6.5L9.8 5.7A2 2 0 0 1 9.8 2.9L11.4 1.3A2 2 0 0 1 14.2 1.3L15 2.1A1.65 1.65 0 0 0 16.5 1.5H18A2 2 0 0 1 20 3.5V5A1.65 1.65 0 0 0 19.4 6.5L20.2 7.3A2 2 0 0 1 20.2 10.1L18.6 11.7A2 2 0 0 1 15.8 11.7L15 10.9"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

// 34. Bluetooth / Sensor Connection Icon
export function BluetoothIcon({ size = 20, color = "#2563EB" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6.5 6.5L17.5 17.5L12 23V1L17.5 6.5L6.5 17.5"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// 35. Chart / Trend Line Icon
export function ChartLineIcon({ size = 20, color = "#2563EB" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 3V21H21"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M19 9L14 14L10 10L7 13"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// 36. Globe / Internationalization & Language Icon
export function GlobeIcon({ size = 20, color = "#2563EB" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path
        d="M2 12H22M12 2C14.5 4.5 16 8 16 12C16 16 14.5 19.5 12 22C9.5 19.5 8 16 8 12C8 8 9.5 4.5 12 2Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// 37. Checkmark Icon
export function CheckmarkIcon({ size = 20, color = "#16A34A" }: IconProps) {
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

