export type AlertSeverity = "critical" | "warning" | "info";

export type AlertCategory = "vitals" | "environment" | "device" | "fall";

export type AlertIconType =
  | "heart"
  | "spo2"
  | "temp"
  | "aqi"
  | "humidity"
  | "fall"
  | "battery"
  | "sync"
  | "check";

/**
 * Clean Alert Record for UI and SQLite integration
 */
export interface AlertRecord {
  id: string;
  severity: AlertSeverity;
  category: AlertCategory;
  title: string;
  message: string;          // Simple, short 1-line note
  timestamp: string;        // e.g. "2m ago", "18m ago"
  iconType: AlertIconType;
  isRead: boolean;
}

/**
 * Pre-made Critical Alerts (Immediate Danger / Vitals Emergencies)
 */
export const CRITICAL_ALERTS: AlertRecord[] = [
  {
    id: "crit-1",
    severity: "critical",
    category: "vitals",
    title: "High Heart Rate",
    message: "142 BPM resting rate",
    timestamp: "2m ago",
    iconType: "heart",
    isRead: false,
  },
  {
    id: "crit-2",
    severity: "critical",
    category: "vitals",
    title: "Low Oxygen (SpO₂)",
    message: "89% blood oxygen level",
    timestamp: "12m ago",
    iconType: "spo2",
    isRead: false,
  },
  {
    id: "crit-3",
    severity: "critical",
    category: "environment",
    title: "Extreme Heat Index",
    message: "41.5°C ambient temperature",
    timestamp: "28m ago",
    iconType: "temp",
    isRead: false,
  },
  {
    id: "crit-4",
    severity: "critical",
    category: "fall",
    title: "Fall Detected",
    message: "High impact detected (3.2G)",
    timestamp: "45m ago",
    iconType: "fall",
    isRead: false,
  },
  {
    id: "crit-5",
    severity: "critical",
    category: "environment",
    title: "Hazardous Air (AQI)",
    message: "AQI 320 hazardous level",
    timestamp: "1h ago",
    iconType: "aqi",
    isRead: false,
  },
];

/**
 * Pre-made Warning Alerts (Elevated Risk / Action Required)
 */
export const WARNING_ALERTS: AlertRecord[] = [
  {
    id: "warn-1",
    severity: "warning",
    category: "environment",
    title: "High Heat Index",
    message: "38.2°C ambient temperature",
    timestamp: "18m ago",
    iconType: "temp",
    isRead: false,
  },
  {
    id: "warn-2",
    severity: "warning",
    category: "environment",
    title: "Poor Air Quality",
    message: "AQI 168 (Unhealthy)",
    timestamp: "35m ago",
    iconType: "aqi",
    isRead: false,
  },
  {
    id: "warn-3",
    severity: "warning",
    category: "vitals",
    title: "Elevated Heart Rate",
    message: "112 BPM resting rate",
    timestamp: "50m ago",
    iconType: "heart",
    isRead: false,
  },
  {
    id: "warn-4",
    severity: "warning",
    category: "environment",
    title: "High Humidity",
    message: "88% moisture level",
    timestamp: "1h ago",
    iconType: "humidity",
    isRead: false,
  },
  {
    id: "warn-5",
    severity: "warning",
    category: "vitals",
    title: "SpO₂ Fluctuation",
    message: "93% oxygen level",
    timestamp: "2h ago",
    iconType: "spo2",
    isRead: false,
  },
  {
    id: "warn-6",
    severity: "warning",
    category: "device",
    title: "Low Battery",
    message: "Wearable sensor at 15%",
    timestamp: "3h ago",
    iconType: "battery",
    isRead: false,
  },
];

/**
 * Pre-made Info Alerts (Routine Status & Normal Vitals)
 */
export const INFO_ALERTS: AlertRecord[] = [
  {
    id: "info-1",
    severity: "info",
    category: "device",
    title: "Wearable Connected",
    message: "BLE sync active (50Hz)",
    timestamp: "5m ago",
    iconType: "sync",
    isRead: true,
  },
  {
    id: "info-2",
    severity: "info",
    category: "vitals",
    title: "Heart Rate Normal",
    message: "Resting rate 72 BPM",
    timestamp: "40m ago",
    iconType: "check",
    isRead: true,
  },
  {
    id: "info-3",
    severity: "info",
    category: "environment",
    title: "Air Quality Normal",
    message: "AQI 42 (Good)",
    timestamp: "2h ago",
    iconType: "aqi",
    isRead: true,
  },
  {
    id: "info-4",
    severity: "info",
    category: "device",
    title: "AI Model Calibrated",
    message: "TFLite baseline updated",
    timestamp: "4h ago",
    iconType: "sync",
    isRead: true,
  },
  {
    id: "info-5",
    severity: "info",
    category: "vitals",
    title: "Daily Steps Reached",
    message: "8,540 steps completed",
    timestamp: "5h ago",
    iconType: "check",
    isRead: true,
  },
];

/**
 * Initial list of alerts for the Alerts tab.
 */
export const INITIAL_ALERTS: AlertRecord[] = [
  CRITICAL_ALERTS[0], // High Heart Rate (142 BPM)
  WARNING_ALERTS[0],  // High Heat Index (38.2°C)
  WARNING_ALERTS[1],  // Poor Air Quality (AQI 168)
  WARNING_ALERTS[5],  // Low Battery (15%)
  INFO_ALERTS[0],     // Wearable Connected
  INFO_ALERTS[1],     // Heart Rate Normal
];
