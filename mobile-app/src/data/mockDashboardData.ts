import { DashboardData } from "@/types/dashboard";

/**
 * Hardcoded initial dashboard data strictly matching prompt_material/app_ui.jpg
 * while preserving all Sanjeevni health sensors for offline SQLite hydration.
 */
export const initialDashboardData: DashboardData = {
  overallStatus: {
    status: "NORMAL",
    title: "NORMAL",
    subtitle: "You are stable",
    description: "All vitals are in normal range.",
  },
  appointment: {
    label: "Upcoming appointment",
    dayNumber: "13",
    dayName: "WED",
    doctor: "Dr. Minoz",
    time: "9:00am",
  },
  medications: [
    {
      id: "med-1",
      name: "Sertraline 100mg",
      dosage: "Take one tablet once a day",
      count: 30,
      dueTime: "9:00am",
    },
    {
      id: "med-2",
      name: "Sanjeevni AI Guard",
      dosage: "Continuous Wearable BLE Sync",
      count: 1,
      dueTime: "Real-time",
    },
  ],
  bloodPressure: {
    systolic: 102,
    diastolic: 80,
    unit: "mmHg",
    historyUpper: [40, 52, 45, 60, 48, 55, 42, 49],
    historyLower: [20, 32, 28, 38, 30, 35, 24, 30],
  },
  heartRate: {
    value: 72,
    unit: "BPM",
    history: [
      { timestamp: "09:35", value: 45 },
      { timestamp: "09:36", value: 40 },
      { timestamp: "09:37", value: 55 },
      { timestamp: "09:38", value: 48 },
      { timestamp: "09:39", value: 44 },
      { timestamp: "09:40", value: 65 },
      { timestamp: "09:41", value: 42 },
      { timestamp: "09:42", value: 58 },
      { timestamp: "09:43", value: 38 },
      { timestamp: "09:44", value: 46 },
    ],
  },
  sleep: {
    hours: 9,
    unit: "Hours",
    weeklyBars: [
      { day: "Mon", value: 7.5, maxValue: 10 },
      { day: "Tue", value: 6.0, maxValue: 10 },
      { day: "Wed", value: 8.5, maxValue: 10 },
      { day: "Thu", value: 7.0, maxValue: 10 },
      { day: "Fri", value: 9.0, maxValue: 10 },
      { day: "Sat", value: 8.0, maxValue: 10 },
      { day: "Sun", value: 9.2, maxValue: 10 },
    ],
  },
  calories: {
    value: 342,
    unit: "Kcal",
    goal: 600,
  },
  spo2: {
    value: 98,
    unit: "%",
    history: [
      { timestamp: "09:35", value: 98 },
      { timestamp: "09:36", value: 98.2 },
      { timestamp: "09:37", value: 97.8 },
      { timestamp: "09:38", value: 98.5 },
      { timestamp: "09:39", value: 97.9 },
      { timestamp: "09:40", value: 98.1 },
      { timestamp: "09:41", value: 98.6 },
    ],
  },
  temperature: {
    value: 36.6,
    unit: "°C",
    history: [36.4, 36.5, 36.5, 36.7, 36.6, 36.8, 36.6, 36.6],
  },
  aqi: {
    value: 42,
    statusLabel: "Good",
    history: [38, 44, 40, 45, 41, 46, 42, 42],
  },
  moisture: {
    value: 48,
    unit: "%",
    statusLabel: "Normal",
    history: [45, 50, 47, 52, 48, 54, 46, 48],
  },
  heatIndex: {
    value: 28,
    unit: "°C",
    statusLabel: "Normal",
  },
  activity: {
    steps: 4320,
    unit: "Steps",
    weeklyBars: [
      { day: "M", value: 4100, maxValue: 6000 },
      { day: "T", value: 3800, maxValue: 6000 },
      { day: "W", value: 5200, maxValue: 6000 },
      { day: "T", value: 4500, maxValue: 6000 },
      { day: "F", value: 5600, maxValue: 6000 },
      { day: "S", value: 4900, maxValue: 6000 },
      { day: "S", value: 4320, maxValue: 6000 },
    ],
  },
  latestAlert: {
    id: "alert-default",
    title: "Latest Alert",
    message: "No active alerts",
    subtext: "You're doing great!",
    isActive: false,
  },
};
