import Svg, { Path, Circle, Defs, LinearGradient, Stop } from "react-native-svg";

interface IconProps {
  size?: number;
  color?: string;
}

/**
 * Hamburger Menu Icon (Top Left in app_ui.jpg)
 */
export function HamburgerMenuIcon({ size = 24, color = "#1F2937" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 6H20M4 12H20M4 18H20"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Notification Bell Icon (Top Right in app_ui.jpg)
 */
export function NotificationBellIcon({ size = 24, color = "#1F2937" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 0 0 6 8C6 15 3 17 3 17H21S18 15 18 8Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M13.73 21A2 2 0 0 1 10.27 21"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Solid Shield with Checkmark Icon for Overall Status Card
 */
export function ShieldCheckIcon({
  size = 52,
  fillColor,
  strokeColor = "#15803D",
  checkColor = "#FFFFFF",
}: {
  size?: number;
  fillColor?: string;
  strokeColor?: string;
  checkColor?: string;
}) {
  // Height is slightly taller than width
  const height = (size * 58) / 50;
  const useGrad = !fillColor;

  return (
    <Svg width={size} height={height} viewBox="0 0 50 58" fill="none">
      <Defs>
        <LinearGradient id="shieldEmeraldGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#22C55E" />
          <Stop offset="100%" stopColor="#15803D" />
        </LinearGradient>
      </Defs>
      {/* Vibrant filled shield */}
      <Path
        d="M25 2L5 9V26C5 39.5 13.5 50.5 25 56C36.5 50.5 45 39.5 45 26V9L25 2Z"
        fill={useGrad ? "url(#shieldEmeraldGrad)" : fillColor}
        stroke={strokeColor}
        strokeWidth="1.5"
      />
      {/* Crisp checkmark */}
      <Path
        d="M16 28.5L22.5 35L34 22"
        stroke={checkColor}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Heart Icon for Heart Rate Card
 */
export function HeartIcon({ size = 18, color = "#4B5563" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Droplet Icon for SpO2 Card
 */
export function DropletIcon({ size = 18, color = "#4B5563" }: IconProps) {
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
export function ThermometerIcon({ size = 18, color = "#4B5563" }: IconProps) {
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
export function CloudIcon({ size = 18, color = "#4B5563" }: IconProps) {
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
 * Sun / Heat Icon for Heat Index Card
 */
export function SunHeatIcon({ size = 18, color = "#4B5563" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="4.5" stroke={color} strokeWidth="2" />
      <Path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

/**
 * Activity Sun/Gear Icon for Activity Card header
 */
export function ActivityIcon({ size = 18, color = "#4B5563" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="4" stroke={color} strokeWidth="1.8" />
      <Path
        d="M12 2V4M12 20V22M2 12H4M20 12H22M4.93 4.93L6.34 6.34M17.66 17.66L19.07 19.07M4.93 19.07L6.34 17.66M17.66 6.34L19.07 4.93"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

/**
 * Walking Human Figure Icon for Activity Card value
 */
export function WalkingPersonIcon({ size = 32, color = "#374151" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Head */}
      <Circle cx="12" cy="4" r="2.2" stroke={color} strokeWidth="2" />
      {/* Torso & Legs */}
      <Path
        d="M8.5 12L11 8.5H13.5L16 11.5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 8.5V14L9 21"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 14L15 21"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Circular Checkmark Icon for Latest Alert Card
 */
export function CheckCircleIcon({ size = 28, color = "#374151" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path
        d="M8 12.5L10.8 15.3L16.2 9.5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
