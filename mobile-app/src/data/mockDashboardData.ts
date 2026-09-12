import { DashboardData } from "@/types/dashboard";

/**
 * Hardcoded initial dashboard data strictly matching prompt_material/app_ui.jpg
 * while preserving all Sanjeevni health sensors for offline SQLite hydration.
 */
export const initialDashboardData: DashboardData = {
  overallStatus: {
    status: "NORMAL",
    title: "STANDBY",
    subtitle: "ESP32 Disconnected",
    description: "Connect wearable to stream real-time biometric telemetry.",
  },
  appointment: {
    label: "Wearable Sync",
    dayNumber: "--",
    dayName: "OFFLINE",
    doctor: "Sanjeevni Hub",
    time: "--",
  },
  medications: [],
  bloodPressure: {
    systolic: 0,
    diastolic: 0,
    unit: "mmHg",
    historyUpper: [],
    historyLower: [],
  },
  heartRate: {
    value: 0,
    unit: "BPM",
    history: [],
  },
  sleep: {
    hours: 0,
    unit: "Hours",
    weeklyBars: [],
  },
  calories: {
    value: 0,
    unit: "Kcal",
    goal: 500,
  },
  spo2: {
    value: 0,
    unit: "%",
    history: [],
  },
  temperature: {
    value: 0,
    unit: "°C",
    history: [],
  },
  aqi: {
    value: 0,
    statusLabel: "--",
    history: [],
  },
  moisture: {
    value: 0,
    unit: "%",
    statusLabel: "--",
    history: [],
  },
  heatIndex: {
    value: 0,
    unit: "°C",
    statusLabel: "--",
  },
  activity: {
    steps: 0,
    unit: "Steps",
    weeklyBars: [
      { day: "M", value: 0, maxValue: 6000 },
      { day: "T", value: 0, maxValue: 6000 },
      { day: "W", value: 0, maxValue: 6000 },
      { day: "T", value: 0, maxValue: 6000 },
      { day: "F", value: 0, maxValue: 6000 },
      { day: "S", value: 0, maxValue: 6000 },
      { day: "S", value: 0, maxValue: 6000 },
    ],
  },
  latestAlert: {
    id: "alert-default",
    title: "Telemetry Status",
    message: "No active alerts",
    subtext: "System ready for telemetry",
    isActive: false,
  },
};

