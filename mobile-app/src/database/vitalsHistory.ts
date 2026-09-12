// =============================================================================
// src/database/vitalsHistory.ts
// Real SQLite query service for User Vitals History.
// Replaces static mock random-walk data with actual wearable telemetry.
// =============================================================================

import { getDb, normalizeUserId } from "../../databaseConnections/database";
import {
  HistoryDataset,
  HistoryPoint,
  MetricKey,
  MetricSummary,
  normalizeMetric,
} from "../data/mockHistoryData";

export interface DBReadingRow {
  timestamp: string;
  sensor_type: string;
  value: number;
}

const METRIC_TYPE_MAP: Record<string, MetricKey> = {
  HR: "hr",
  hr: "hr",
  SpO2: "spo2",
  SPO2: "spo2",
  spo2: "spo2",
  TEMP: "temp",
  temp: "temp",
  AQI: "aqi",
  aqi: "aqi",
  HUMIDITY: "moisture",
  humidity: "moisture",
  moisture: "moisture",
  STEPS: "steps",
  steps: "steps",
};

const ALL_METRICS: MetricKey[] = ["hr", "spo2", "temp", "aqi", "moisture", "steps"];

function getMetricStatus(key: MetricKey, avg: number): MetricSummary["status"] {
  switch (key) {
    case "hr":
      if (avg < 50 || avg > 110) return "Elevated";
      if (avg >= 60 && avg <= 85) return "Optimal";
      return "Normal";
    case "spo2":
      if (avg < 92) return "Elevated";
      if (avg >= 96) return "Optimal";
      return "Normal";
    case "temp":
      if (avg > 37.8 || avg < 35.5) return "Elevated";
      return "Normal";
    case "aqi":
      if (avg <= 50) return "Good";
      if (avg <= 100) return "Normal";
      return "Elevated";
    case "moisture":
      if (avg >= 30 && avg <= 60) return "Optimal";
      return "Normal";
    case "steps":
      if (avg >= 8000) return "Optimal";
      return "Normal";
    default:
      return "Normal";
  }
}

const EMPTY_SUMMARIES: Record<MetricKey, MetricSummary> = {
  hr: { key: "hr", avg: "—" as any, min: "—" as any, max: "—" as any, status: "Normal" },
  spo2: { key: "spo2", avg: "—" as any, min: "—" as any, max: "—" as any, status: "Normal" },
  temp: { key: "temp", avg: "—" as any, min: "—" as any, max: "—" as any, status: "Normal" },
  aqi: { key: "aqi", avg: "—" as any, min: "—" as any, max: "—" as any, status: "Good" },
  moisture: { key: "moisture", avg: "—" as any, min: "—" as any, max: "—" as any, status: "Normal" },
  steps: { key: "steps", avg: "—" as any, min: "—" as any, max: "—" as any, status: "Normal" },
};

/**
 * Computes timestamp boundaries for a given view period and target date.
 */
function getPeriodBoundaries(
  period: "day" | "week" | "month",
  targetDate: Date
): { startIso: string; endIso: string; startMs: number; endMs: number } {
  const start = new Date(targetDate);
  const end = new Date(targetDate);

  if (period === "day") {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (period === "week") {
    start.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
  } else {
    // month
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    end.setMonth(end.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
  }

  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
    startMs: start.getTime(),
    endMs: end.getTime(),
  };
}

/**
 * Queries SQLite and structures real sensor telemetry for the History Screen.
 * If fewer than 2 data points exist for the user, returns empty points and hasData = false.
 */
export async function fetchUserVitalsHistory(
  userId: string,
  period: "day" | "week" | "month",
  targetDate: Date
): Promise<HistoryDataset & { hasData: boolean; totalReadingsCount: number }> {
  try {
    const db = await getDb();
    const uid = normalizeUserId(userId);
    const { startIso, endIso, startMs, endMs } = getPeriodBoundaries(period, targetDate);

    // Fetch chronological readings scoped to the active user
    const rows = await db.getAllAsync<DBReadingRow>(
      `SELECT timestamp, sensor_type, value 
       FROM readings 
       WHERE user_id = ? AND timestamp >= ? AND timestamp <= ? 
       ORDER BY timestamp ASC`,
      uid,
      startIso,
      endIso
    );

    if (!rows || rows.length < 2) {
      // Not enough data points to form a real trajectory
      const defaultLabels =
        period === "day"
          ? ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "23:59"]
          : period === "week"
          ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
          : ["W1", "W2", "W3", "W4"];

      return {
        points: [],
        summaries: { ...EMPTY_SUMMARIES },
        xLabels: defaultLabels,
        hasData: false,
        totalReadingsCount: rows ? rows.length : 0,
      };
    }

    // 1. Compute summary statistics (min, max, avg) from real stored rows per metric
    const metricStats: Record<
      MetricKey,
      { values: number[]; sum: number; min: number; max: number }
    > = {
      hr: { values: [], sum: 0, min: Infinity, max: -Infinity },
      spo2: { values: [], sum: 0, min: Infinity, max: -Infinity },
      temp: { values: [], sum: 0, min: Infinity, max: -Infinity },
      aqi: { values: [], sum: 0, min: Infinity, max: -Infinity },
      moisture: { values: [], sum: 0, min: Infinity, max: -Infinity },
      steps: { values: [], sum: 0, min: Infinity, max: -Infinity },
    };

    for (const row of rows) {
      const key = METRIC_TYPE_MAP[row.sensor_type];
      if (key && Number.isFinite(row.value)) {
        metricStats[key].values.push(row.value);
        metricStats[key].sum += row.value;
        if (row.value < metricStats[key].min) metricStats[key].min = row.value;
        if (row.value > metricStats[key].max) metricStats[key].max = row.value;
      }
    }

    const summaries: Record<MetricKey, MetricSummary> = { ...EMPTY_SUMMARIES };
    for (const key of ALL_METRICS) {
      const st = metricStats[key];
      if (st.values.length > 0) {
        const avg = st.sum / st.values.length;
        const decimals = key === "temp" || key === "spo2" ? 1 : 0;
        summaries[key] = {
          key,
          avg: Number(avg.toFixed(decimals)),
          min: Number(st.min.toFixed(decimals)),
          max: Number(st.max.toFixed(decimals)),
          status: getMetricStatus(key, avg),
        };
      }
    }

    // 2. Bucketize readings into chronological chart points
    const bucketCount = period === "day" ? 12 : period === "week" ? 7 : 10;
    const bucketDurationMs = (endMs - startMs) / bucketCount;

    const buckets: {
      timestamp: number;
      label: string;
      metrics: Record<MetricKey, number[]>;
    }[] = [];

    for (let i = 0; i < bucketCount; i++) {
      const bStart = startMs + i * bucketDurationMs;
      const bCenter = bStart + bucketDurationMs / 2;
      const centerDate = new Date(bCenter);

      let label = "";
      if (period === "day") {
        const hh = String(centerDate.getHours()).padStart(2, "0");
        const mm = String(centerDate.getMinutes()).padStart(2, "0");
        label = `${hh}:${mm}`;
      } else if (period === "week") {
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        label = days[centerDate.getDay()];
      } else {
        label = `${centerDate.getDate()} ${centerDate.toLocaleString("default", { month: "short" })}`;
      }

      buckets.push({
        timestamp: bCenter,
        label,
        metrics: {
          hr: [],
          spo2: [],
          temp: [],
          aqi: [],
          moisture: [],
          steps: [],
        },
      });
    }

    // Assign each row to its bucket
    for (const row of rows) {
      const rowMs = new Date(row.timestamp).getTime();
      const key = METRIC_TYPE_MAP[row.sensor_type];
      if (!key || !Number.isFinite(row.value)) continue;

      let bIdx = Math.floor((rowMs - startMs) / bucketDurationMs);
      if (bIdx < 0) bIdx = 0;
      if (bIdx >= bucketCount) bIdx = bucketCount - 1;

      buckets[bIdx].metrics[key].push(row.value);
    }

    // 3. Build HistoryPoints with forward filling for empty buckets
    const lastKnownRaw: Record<MetricKey, number> = {
      hr: summaries.hr.avg !== ("—" as any) ? (summaries.hr.avg as number) : 72,
      spo2: summaries.spo2.avg !== ("—" as any) ? (summaries.spo2.avg as number) : 98,
      temp: summaries.temp.avg !== ("—" as any) ? (summaries.temp.avg as number) : 36.6,
      aqi: summaries.aqi.avg !== ("—" as any) ? (summaries.aqi.avg as number) : 45,
      moisture: summaries.moisture.avg !== ("—" as any) ? (summaries.moisture.avg as number) : 48,
      steps: summaries.steps.avg !== ("—" as any) ? (summaries.steps.avg as number) : 0,
    };

    const points: HistoryPoint[] = buckets.map((b) => {
      const raw: Record<MetricKey, number> = { ...lastKnownRaw };
      const norm: Record<MetricKey, number> = {
        hr: 0,
        spo2: 0,
        temp: 0,
        aqi: 0,
        moisture: 0,
        steps: 0,
      };

      for (const key of ALL_METRICS) {
        const arr = b.metrics[key];
        if (arr.length > 0) {
          const avg = arr.reduce((acc, v) => acc + v, 0) / arr.length;
          raw[key] = Math.round(avg * 10) / 10;
          lastKnownRaw[key] = raw[key];
        }
        norm[key] = normalizeMetric(key, raw[key]);
      }

      return {
        timeLabel: b.label,
        timestamp: b.timestamp,
        raw,
        norm,
      };
    });

    const xLabels = points.map((p) => p.timeLabel);

    return {
      points,
      summaries,
      xLabels,
      hasData: true,
      totalReadingsCount: rows.length,
    };
  } catch (error) {
    console.warn("[vitalsHistory] Error fetching vitals history from SQLite:", error);
    return {
      points: [],
      summaries: { ...EMPTY_SUMMARIES },
      xLabels: [],
      hasData: false,
      totalReadingsCount: 0,
    };
  }
}

