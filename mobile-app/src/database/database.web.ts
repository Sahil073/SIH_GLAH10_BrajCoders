// =============================================================================
// databaseConnections/database.web.ts
// src/database/database.web.ts
// Web Browser implementation of Sanjeevni database layer.
// Replaces expo-sqlite with localStorage & in-memory store on Web,
// preventing "Worker chunk not found for expo-sqlite/web/worker.ts" errors.
// =============================================================================

export interface LocalUserProfile {
  userId?: string;
  name?: string;
  email?: string;
  pin?: string;
  age?: number;
  gender?: string;
  heightCm?: number;
  weightKg?: number;
  bloodGroup?: string;
  medicalCondition?: string;
  emergencyName?: string;
  emergencyPhone?: string;
  isLoggedIn?: boolean;
}

export function normalizeUserId(userId?: string): string {
  if (!userId || !userId.trim()) return "offline_local";
  return userId.trim().toLowerCase();
}

// In-memory & localStorage structures for Web
interface WebReading {
  id: number;
  user_id: string;
  timestamp: string;
  sensor_type: string;
  value: number;
  source: string;
  synced: number;
}

interface WebAlert {
  id: number;
  user_id: string;
  timestamp: string;
  category: string;
  severity: string;
  message: string;
  acknowledged: number;
}

interface WebArchivedSummary {
  id: number;
  user_id: string;
  sensor_type: string;
  period_date: string;
  avg_value: number;
  min_value: number;
  max_value: number;
  sample_count: number;
}

let readingIdCounter = 1;
let alertIdCounter = 1;

function getStorage<T>(key: string, defaultVal: T): T {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const item = window.localStorage.getItem(key);
      if (item) return JSON.parse(item);
    } catch {}
  }
  return defaultVal;
}

function setStorage(key: string, val: any): void {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.setItem(key, JSON.stringify(val));
    } catch {}
  }
}

/**
 * Returns mock SQLite database handle for web compatibility.
 */
export async function getDb(): Promise<any> {
  return {
    execAsync: async () => {},
    runAsync: async () => {},
    getFirstAsync: async () => null,
    getAllAsync: async (sql: string, ...params: any[]) => {
      const uid = normalizeUserId(params[0]);
      if (sql.includes("FROM readings")) {
        const readings = getStorage<WebReading[]>("sanjeevni_web_readings", []);
        return readings.filter((r) => r.user_id === uid);
      }
      if (sql.includes("FROM alerts")) {
        const alerts = getStorage<WebAlert[]>("sanjeevni_web_alerts", []);
        return alerts.filter((a) => a.user_id === uid);
      }
      return [];
    },
  };
}

export async function initDb() {
  console.log("[Web Database] Initialized localStorage backed database for web browser.");
}

export async function summarizeAndPruneOldData(
  monthsCutoff: number = 6,
  userId?: string
): Promise<{ archivedRows: number; prunedRows: number }> {
  const uid = normalizeUserId(userId);
  const cutoff = new Date(Date.now() - monthsCutoff * 30 * 24 * 60 * 60 * 1000).toISOString();
  let readings = getStorage<WebReading[]>("sanjeevni_web_readings", []);
  let summaries = getStorage<WebArchivedSummary[]>("sanjeevni_web_summaries", []);

  const toArchive = readings.filter(
    (r) => (userId ? r.user_id === uid : true) && r.timestamp < cutoff
  );

  if (toArchive.length > 0) {
    // Group by user_id + sensor_type + period_date (YYYY-MM-DD)
    const groups: Record<
      string,
      { user_id: string; sensor_type: string; date: string; vals: number[] }
    > = {};
    for (const r of toArchive) {
      const dateKey = `${r.user_id}_${r.sensor_type}_${r.timestamp.slice(0, 10)}`;
      if (!groups[dateKey]) {
        groups[dateKey] = {
          user_id: r.user_id,
          sensor_type: r.sensor_type,
          date: r.timestamp.slice(0, 10),
          vals: [],
        };
      }
      groups[dateKey].vals.push(r.value);
    }

    let nextId = summaries.length > 0 ? Math.max(...summaries.map((s) => s.id)) + 1 : 1;
    for (const g of Object.values(groups)) {
      const sum = g.vals.reduce((a, b) => a + b, 0);
      summaries.push({
        id: nextId++,
        user_id: g.user_id,
        sensor_type: g.sensor_type,
        period_date: g.date,
        avg_value: Number((sum / g.vals.length).toFixed(1)),
        min_value: Math.min(...g.vals),
        max_value: Math.max(...g.vals),
        sample_count: g.vals.length,
      });
    }

    setStorage("sanjeevni_web_summaries", summaries);
  }

  // Remove pruned readings
  readings = readings.filter(
    (r) => !((userId ? r.user_id === uid : true) && r.timestamp < cutoff)
  );
  setStorage("sanjeevni_web_readings", readings);

  return { archivedRows: toArchive.length, prunedRows: toArchive.length };
}

export async function pruneOldData(userId?: string) {
  await summarizeAndPruneOldData(6, userId);
}

export async function clearAllData(userId?: string): Promise<void> {
  const uid = normalizeUserId(userId);
  if (userId) {
    let readings = getStorage<WebReading[]>("sanjeevni_web_readings", []);
    readings = readings.filter((r) => r.user_id !== uid);
    setStorage("sanjeevni_web_readings", readings);

    let alerts = getStorage<WebAlert[]>("sanjeevni_web_alerts", []);
    alerts = alerts.filter((a) => a.user_id !== uid);
    setStorage("sanjeevni_web_alerts", alerts);

    let summaries = getStorage<WebArchivedSummary[]>("sanjeevni_web_summaries", []);
    summaries = summaries.filter((s) => s.user_id !== uid);
    setStorage("sanjeevni_web_summaries", summaries);

    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem(`sanjeevni_web_baseline_${uid}`);
    }
  } else {
    setStorage("sanjeevni_web_readings", []);
    setStorage("sanjeevni_web_alerts", []);
    setStorage("sanjeevni_web_summaries", []);
    if (typeof window !== "undefined" && window.localStorage) {
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && k.startsWith("sanjeevni_web_baseline_")) keysToRemove.push(k);
      }
      keysToRemove.forEach((k) => window.localStorage.removeItem(k));
    }
  }
}

export async function getStorageStats(userId?: string): Promise<{
  readingsCount: number;
  alertsCount: number;
  summariesCount: number;
}> {
  const uid = normalizeUserId(userId);
  const readings = getStorage<WebReading[]>("sanjeevni_web_readings", []);
  const alerts = getStorage<WebAlert[]>("sanjeevni_web_alerts", []);
  const summaries = getStorage<WebArchivedSummary[]>("sanjeevni_web_summaries", []);

  const readingsCount = userId
    ? readings.filter((r) => r.user_id === uid).length
    : readings.length;
  const alertsCount = userId
    ? alerts.filter((a) => a.user_id === uid).length
    : alerts.length;
  const summariesCount = userId
    ? summaries.filter((s) => s.user_id === uid).length
    : summaries.length;

  return { readingsCount, alertsCount, summariesCount };
}

export async function insertReading(
  sensorType: string,
  value: number,
  source: string = "garment",
  userId: string = "offline_local"
) {
  const uid = normalizeUserId(userId);
  const reading: WebReading = {
    id: readingIdCounter++,
    user_id: uid,
    timestamp: new Date().toISOString(),
    sensor_type: sensorType,
    value,
    source,
    synced: 0,
  };
  const readings = getStorage<WebReading[]>("sanjeevni_web_readings", []);
  readings.push(reading);
  if (readings.length > 500) readings.shift();
  setStorage("sanjeevni_web_readings", readings);
}

export async function getPendingReadings(userId?: string): Promise<any[]> {
  const uid = normalizeUserId(userId);
  const readings = getStorage<WebReading[]>("sanjeevni_web_readings", []);
  return readings.filter((r) => r.user_id === uid && r.synced === 0);
}

export async function markSynced(ids: number[]) {
  const idSet = new Set(ids);
  const readings = getStorage<WebReading[]>("sanjeevni_web_readings", []);
  readings.forEach((r) => {
    if (idSet.has(r.id)) r.synced = 1;
  });
  setStorage("sanjeevni_web_readings", readings);
}

export async function getLatestReading(sensorType: string, userId?: string): Promise<any> {
  const uid = normalizeUserId(userId);
  const readings = getStorage<WebReading[]>("sanjeevni_web_readings", []);
  for (let i = readings.length - 1; i >= 0; i--) {
    if (readings[i].user_id === uid && readings[i].sensor_type === sensorType) {
      return readings[i];
    }
  }
  return null;
}

export async function getRecentReadings(
  sensorType: string,
  minutes: number,
  userId?: string
): Promise<any[]> {
  const uid = normalizeUserId(userId);
  const cutoff = new Date(Date.now() - minutes * 60 * 1000).toISOString();
  const readings = getStorage<WebReading[]>("sanjeevni_web_readings", []);
  return readings.filter(
    (r) => r.user_id === uid && r.sensor_type === sensorType && r.timestamp >= cutoff
  );
}

export async function getSensorStats(sensorType: string, minutes: number = 60, userId?: string) {
  const recent = await getRecentReadings(sensorType, minutes, userId);
  if (recent.length === 0) return { avg: null, min: null, max: null, count: 0 };
  const values = recent.map((r) => r.value);
  const sum = values.reduce((a, b) => a + b, 0);
  return {
    avg: Number((sum / values.length).toFixed(1)),
    min: Math.min(...values),
    max: Math.max(...values),
    count: values.length,
  };
}

export async function getAllSensorAverages(userId?: string) {
  const [hrStats, tempStats, aqiStats, humidityStats, stepsStats] = await Promise.all([
    getSensorStats("HR", 60, userId),
    getSensorStats("TEMP", 60, userId),
    getSensorStats("AQI", 60, userId),
    getSensorStats("HUMIDITY", 60, userId),
    getSensorStats("STEPS", 60, userId),
  ]);

  const hasData =
    hrStats.count > 0 ||
    tempStats.count > 0 ||
    aqiStats.count > 0 ||
    humidityStats.count > 0 ||
    stepsStats.count > 0;

  return {
    hr: hrStats.avg,
    temp: tempStats.avg,
    aqi: aqiStats.avg,
    humidity: humidityStats.avg,
    steps: stepsStats.avg,
    hasData,
  };
}

export async function getSensorHistory(
  sensorType: string,
  limit: number = 20,
  userId?: string
): Promise<{ timestamp: string; value: number }[]> {
  const uid = normalizeUserId(userId);
  const readings = getStorage<WebReading[]>("sanjeevni_web_readings", []);
  const isMoist = sensorType === "HUMIDITY" || sensorType === "MOISTURE";
  const matched = readings
    .filter(
      (r) =>
        r.user_id === uid &&
        (isMoist
          ? r.sensor_type === "HUMIDITY" || r.sensor_type === "MOISTURE"
          : r.sensor_type === sensorType)
    )
    .slice(-limit);
  return matched.map((r) => ({ timestamp: r.timestamp, value: r.value }));
}

export async function clearReadings(sensorType?: string, userId?: string): Promise<void> {
  const uid = normalizeUserId(userId);
  let readings = getStorage<WebReading[]>("sanjeevni_web_readings", []);
  if (sensorType) {
    readings = readings.filter((r) => r.user_id !== uid || r.sensor_type !== sensorType);
  } else if (userId) {
    readings = readings.filter((r) => r.user_id !== uid);
  } else {
    readings = [];
  }
  setStorage("sanjeevni_web_readings", readings);
}

export async function insertAlert(
  category: string,
  severity: string,
  message: string,
  userId: string = "offline_local"
) {
  const uid = normalizeUserId(userId);
  const alert: WebAlert = {
    id: alertIdCounter++,
    user_id: uid,
    timestamp: new Date().toISOString(),
    category,
    severity,
    message,
    acknowledged: 0,
  };
  const alerts = getStorage<WebAlert[]>("sanjeevni_web_alerts", []);
  alerts.unshift(alert);
  if (alerts.length > 100) alerts.pop();
  setStorage("sanjeevni_web_alerts", alerts);
}

export async function getAlerts(limit: number = 20, userId?: string): Promise<any[]> {
  const uid = normalizeUserId(userId);
  const alerts = getStorage<WebAlert[]>("sanjeevni_web_alerts", []);
  return alerts.filter((a) => a.user_id === uid).slice(0, limit);
}

export async function getUnacknowledgedAlerts(userId?: string): Promise<any[]> {
  const uid = normalizeUserId(userId);
  const alerts = getStorage<WebAlert[]>("sanjeevni_web_alerts", []);
  return alerts.filter((a) => a.user_id === uid && a.acknowledged === 0);
}

export async function acknowledgeAlert(id: number) {
  const alerts = getStorage<WebAlert[]>("sanjeevni_web_alerts", []);
  const target = alerts.find((a) => a.id === id);
  if (target) target.acknowledged = 1;
  setStorage("sanjeevni_web_alerts", alerts);
}

export async function deleteAlert(id: number): Promise<void> {
  let alerts = getStorage<WebAlert[]>("sanjeevni_web_alerts", []);
  alerts = alerts.filter((a) => a.id !== id);
  setStorage("sanjeevni_web_alerts", alerts);
}

export async function clearAllAlerts(userId?: string): Promise<void> {
  const uid = normalizeUserId(userId);
  let alerts = getStorage<WebAlert[]>("sanjeevni_web_alerts", []);
  alerts = alerts.filter((a) => a.user_id !== uid);
  setStorage("sanjeevni_web_alerts", alerts);
}

export async function getUserProfile(userId: string = "offline_local"): Promise<any> {
  return await getLocalUserProfile(userId);
}

export async function saveLocalUserProfile(
  profile: LocalUserProfile,
  userId?: string
): Promise<void> {
  const uid = normalizeUserId(userId || profile.userId);
  setStorage(`sanjeevni_web_profile_${uid}`, { ...profile, userId: uid });
}

export async function getLocalUserProfile(
  userId: string = "offline_local"
): Promise<LocalUserProfile | null> {
  const uid = normalizeUserId(userId);
  return getStorage<LocalUserProfile | null>(`sanjeevni_web_profile_${uid}`, null);
}

export async function clearLocalUserProfile(userId: string = "offline_local"): Promise<void> {
  const uid = normalizeUserId(userId);
  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.removeItem(`sanjeevni_web_profile_${uid}`);
  }
}

export async function updateRollingBaseline(
  metricType: string,
  movingAverage: number,
  userId: string = "offline_local"
): Promise<void> {
  const uid = normalizeUserId(userId);
  const baselines = getStorage<Record<string, number>>(`sanjeevni_web_baseline_${uid}`, {});
  baselines[metricType] = movingAverage;
  setStorage(`sanjeevni_web_baseline_${uid}`, baselines);
}

export async function getRollingBaseline(
  metricType: string,
  userId: string = "offline_local"
): Promise<{ moving_average: number; sample_count: number } | null> {
  const uid = normalizeUserId(userId);
  const baselines = getStorage<Record<string, number>>(`sanjeevni_web_baseline_${uid}`, {});
  if (baselines[metricType] !== undefined) {
    return { moving_average: baselines[metricType], sample_count: 10 };
  }
  return null;
}

