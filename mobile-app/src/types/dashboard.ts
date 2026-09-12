export type HealthStatusLevel = "NORMAL" | "WARNING" | "CRITICAL";

export interface SparklinePoint {
  timestamp: string | number;
  value: number;
}

export interface OverallStatusData {
  status: HealthStatusLevel;
  title: string;
  subtitle: string;
  description: string;
}

export interface HeartRateData {
  value: number;
  unit: string;
  history: SparklinePoint[];
}

export interface SpO2Data {
  value: number;
  unit: string;
  history: SparklinePoint[];
}

export interface BloodPressureData {
  systolic: number;
  diastolic: number;
  unit: string;
  historyUpper: number[];
  historyLower: number[];
}

export interface WeeklyBarPoint {
  day: string;
  value: number;
  maxValue: number;
}

export interface SleepData {
  hours: number;
  unit: string;
  weeklyBars: WeeklyBarPoint[];
}

export interface CaloriesData {
  value: number;
  unit: string;
  goal: number;
}

export interface TemperatureData {
  value: number;
  unit: string;
  history: number[];
}

export interface AqiData {
  value: number;
  statusLabel: string;
  history: number[];
}

export interface MoistureData {
  value: number;
  unit: string;
  statusLabel: string;
  history: number[];
}

export interface HeatIndexData {
  value: number;
  unit: string;
  statusLabel: string;
}

export interface ActivityData {
  steps: number;
  unit: string;
  weeklyBars: WeeklyBarPoint[];
}

export interface MedicationItem {
  id: string;
  name: string;
  dosage: string;
  count: number;
  dueTime: string;
}

export interface AppointmentData {
  label: string;
  dayNumber: string;
  dayName: string;
  doctor: string;
  time: string;
}

export interface LatestAlertData {
  id: string;
  title: string;
  message: string;
  subtext: string;
  isActive: boolean;
}

export interface DashboardData {
  overallStatus: OverallStatusData;
  heartRate: HeartRateData;
  spo2: SpO2Data;
  bloodPressure: BloodPressureData;
  sleep: SleepData;
  calories: CaloriesData;
  temperature: TemperatureData;
  aqi: AqiData;
  moisture: MoistureData;
  heatIndex: HeatIndexData;
  activity: ActivityData;
  appointment: AppointmentData;
  medications: MedicationItem[];
  latestAlert: LatestAlertData;
}

/**
 * SQLite Schema Blueprint for future SQLite integration:
 */
export interface VitalsSqliteRow {
  id: number;
  timestamp: number;
  heart_rate: number;
  spo2: number;
  systolic?: number;
  diastolic?: number;
  sleep_hours?: number;
  calories?: number;
  temperature: number;
  aqi: number;
  moisture?: number;
  heat_index: number;
}

export type MetricType =
  | "heart_rate"
  | "spo2"
  | "aqi"
  | "temperature"
  | "moisture"
  | "activity";

export type TimeframeKey = "Hourly" | "Daily" | "Monthly" | "Yearly";

export interface MetricTimeframeData {
  timestamps: string[];
  values: number[];
  average: number;
  minimum: number;
  maximum: number;
  selectedIndex: number;
}

export interface MetricDetailPayload {
  id: MetricType;
  title: string;
  currentValue: number | string;
  unit: string;
  statusLabel: string;
  yAxisLabels: (number | string)[];
  timeframes: Record<TimeframeKey, MetricTimeframeData>;
}


