export type MetricKey = "hr" | "spo2" | "temp" | "aqi" | "moisture" | "steps";

export interface MetricMeta {
  key: MetricKey;
  label: string;
  shortLabel: string;
  unit: string;
  color: string;
  normalRange: string;
  decimals: number;
}

export const METRIC_CONFIGS: Record<MetricKey, MetricMeta> = {
  hr: {
    key: "hr",
    label: "Heart Rate",
    shortLabel: "HR",
    unit: "BPM",
    color: "#E11D48", // Rose Red
    normalRange: "60 - 100 BPM",
    decimals: 0,
  },
  spo2: {
    key: "spo2",
    label: "Blood Oxygen",
    shortLabel: "SpO₂",
    unit: "%",
    color: "#0284C7", // Sky Blue
    normalRange: "95 - 100 %",
    decimals: 1,
  },
  temp: {
    key: "temp",
    label: "Temperature",
    shortLabel: "Temp",
    unit: "°C",
    color: "#F59E0B", // Amber / Warm Yellow
    normalRange: "36.1 - 37.2 °C",
    decimals: 1,
  },
  aqi: {
    key: "aqi",
    label: "Air Quality",
    shortLabel: "AQI",
    unit: "",
    color: "#8B5CF6", // Purple
    normalRange: "0 - 50 Good",
    decimals: 0,
  },
  moisture: {
    key: "moisture",
    label: "Humidity",
    shortLabel: "Moist",
    unit: "%",
    color: "#0D9488", // Teal
    normalRange: "30 - 60 %",
    decimals: 0,
  },
  steps: {
    key: "steps",
    label: "Step Activity",
    shortLabel: "Steps",
    unit: "steps",
    color: "#16A34A", // Emerald
    normalRange: "8,000+ daily",
    decimals: 0,
  },
};

export interface HistoryPoint {
  timeLabel: string;
  timestamp: number;
  raw: Record<MetricKey, number>;
  norm: Record<MetricKey, number>; // 0 to 100 scale for chart plotting
}

export interface MetricSummary {
  key: MetricKey;
  avg: number;
  min: number;
  max: number;
  status: "Normal" | "Elevated" | "Optimal" | "Good";
}

export interface HistoryDataset {
  points: HistoryPoint[];
  summaries: Record<MetricKey, MetricSummary>;
  xLabels: string[];
}

/**
 * Normalizes raw metric value into standard 0 - 100 Y-axis scale
 */
export function normalizeMetric(key: MetricKey, val: number): number {
  switch (key) {
    case "hr": // 40 - 160 BPM
      return Math.max(0, Math.min(100, ((val - 40) / 120) * 100));
    case "spo2": // 80 - 100 %
      return Math.max(0, Math.min(100, ((val - 80) / 20) * 100));
    case "temp": // 34 - 42 °C
      return Math.max(0, Math.min(100, ((val - 34) / 8) * 100));
    case "aqi": // 0 - 250
      return Math.max(0, Math.min(100, (val / 250) * 100));
    case "moisture": // 0 - 100 %
      return Math.max(0, Math.min(100, val));
    case "steps": // 0 - 12,000 steps
      return Math.max(0, Math.min(100, (val / 12000) * 100));
  }
}

/**
 * Generates realistic 24-hour vitals and environmental history data
 * (Ready to be wired up with SQLite: `SELECT * FROM vitals WHERE ...`)
 */
export function generateDayHistory(selectedDate: Date): HistoryDataset {
  const seed = selectedDate.getDate() + selectedDate.getMonth() * 31;
  const timeSlots = [
    "00:00",
    "02:00",
    "04:00",
    "06:00",
    "08:00",
    "10:00",
    "12:00",
    "14:00",
    "16:00",
    "18:00",
    "20:00",
    "22:00",
    "24:00",
  ];

  const points: HistoryPoint[] = timeSlots.map((timeLabel, index) => {
    // Deterministic organic curve variations based on time of day
    const hour = index * 2;
    const diurnalFactor = Math.sin(((hour - 6) / 24) * Math.PI * 2);
    const noise = Math.sin(seed + index) * 0.5;

    const hr = Math.round(70 + diurnalFactor * 16 + noise * 6);
    const spo2 = Number((98.2 - Math.abs(noise) * 1.2 + (diurnalFactor < 0 ? 0.3 : -0.2)).toFixed(1));
    const temp = Number((36.6 + diurnalFactor * 0.4 + noise * 0.15).toFixed(1));
    const aqi = Math.round(42 + (hour >= 8 && hour <= 19 ? 35 : 12) + noise * 8);
    const moisture = Math.round(58 - diurnalFactor * 14 + noise * 5);
    const steps = Math.round(Math.max(0, index * 650 + diurnalFactor * 800));

    const raw: Record<MetricKey, number> = { hr, spo2, temp, aqi, moisture, steps };
    const norm: Record<MetricKey, number> = {
      hr: normalizeMetric("hr", hr),
      spo2: normalizeMetric("spo2", spo2),
      temp: normalizeMetric("temp", temp),
      aqi: normalizeMetric("aqi", aqi),
      moisture: normalizeMetric("moisture", moisture),
      steps: normalizeMetric("steps", steps),
    };

    return {
      timeLabel,
      timestamp: selectedDate.getTime() + index * 7200000,
      raw,
      norm,
    };
  });

  const summaries = computeSummaries(points);

  return {
    points,
    summaries,
    xLabels: ["00:00", "06:00", "12:00", "18:00", "24:00"],
  };
}

/**
 * Generates 7-day vitals history
 */
export function generateWeekHistory(selectedDate: Date): HistoryDataset {
  const seed = selectedDate.getDate() + selectedDate.getMonth() * 31;
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const points: HistoryPoint[] = days.map((timeLabel, index) => {
    const noise = Math.sin(seed + index * 2) * 0.7;

    const hr = Math.round(72 + noise * 5);
    const spo2 = Number((98.1 + noise * 0.4).toFixed(1));
    const temp = Number((36.7 + noise * 0.2).toFixed(1));
    const aqi = Math.round(48 + noise * 14);
    const moisture = Math.round(52 + noise * 8);
    const steps = Math.round(8200 + noise * 1500);

    const raw: Record<MetricKey, number> = { hr, spo2, temp, aqi, moisture, steps };
    const norm: Record<MetricKey, number> = {
      hr: normalizeMetric("hr", hr),
      spo2: normalizeMetric("spo2", spo2),
      temp: normalizeMetric("temp", temp),
      aqi: normalizeMetric("aqi", aqi),
      moisture: normalizeMetric("moisture", moisture),
      steps: normalizeMetric("steps", steps),
    };

    return {
      timeLabel,
      timestamp: selectedDate.getTime() + index * 86400000,
      raw,
      norm,
    };
  });

  const summaries = computeSummaries(points);

  return {
    points,
    summaries,
    xLabels: days,
  };
}

/**
 * Generates 30-day (month) vitals history
 */
export function generateMonthHistory(selectedDate: Date): HistoryDataset {
  const seed = selectedDate.getMonth() * 31;
  const weeks = ["W1", "W2", "W3", "W4"];

  const points: HistoryPoint[] = weeks.map((timeLabel, index) => {
    const noise = Math.sin(seed + index * 3) * 0.6;

    const hr = Math.round(73 + noise * 4);
    const spo2 = Number((98.0 + noise * 0.3).toFixed(1));
    const temp = Number((36.6 + noise * 0.15).toFixed(1));
    const aqi = Math.round(45 + noise * 12);
    const moisture = Math.round(54 + noise * 6);
    const steps = Math.round(8500 + noise * 1200);

    const raw: Record<MetricKey, number> = { hr, spo2, temp, aqi, moisture, steps };
    const norm: Record<MetricKey, number> = {
      hr: normalizeMetric("hr", hr),
      spo2: normalizeMetric("spo2", spo2),
      temp: normalizeMetric("temp", temp),
      aqi: normalizeMetric("aqi", aqi),
      moisture: normalizeMetric("moisture", moisture),
      steps: normalizeMetric("steps", steps),
    };

    return {
      timeLabel,
      timestamp: selectedDate.getTime() + index * 7 * 86400000,
      raw,
      norm,
    };
  });

  const summaries = computeSummaries(points);

  return {
    points,
    summaries,
    xLabels: weeks,
  };
}

function computeSummaries(points: HistoryPoint[]): Record<MetricKey, MetricSummary> {
  const keys: MetricKey[] = ["hr", "spo2", "temp", "aqi", "moisture", "steps"];
  const result = {} as Record<MetricKey, MetricSummary>;

  keys.forEach((k) => {
    const values = points.map((p) => p.raw[k]);
    const avg = values.reduce((acc, v) => acc + v, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    let status: MetricSummary["status"] = "Normal";
    if (k === "hr" && avg > 85) status = "Elevated";
    if (k === "spo2" && avg >= 98) status = "Optimal";
    if (k === "aqi" && avg < 50) status = "Good";

    result[k] = {
      key: k,
      avg: Number(avg.toFixed(METRIC_CONFIGS[k].decimals)),
      min,
      max,
      status,
    };
  });

  return result;
}
