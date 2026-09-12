import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

// Singleton connection — reused across all functions to avoid
// race conditions between BLE writes and dashboard reads.
let dbInstance: SQLite.SQLiteDatabase | null = null;
let dbOpenPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (Platform.OS === 'web') {
    return {
      execAsync: async () => {},
      runAsync: async () => {},
      getFirstAsync: async () => null,
      getAllAsync: async () => []
    } as unknown as SQLite.SQLiteDatabase;
  }

  if (dbInstance) return dbInstance;

  if (!dbOpenPromise) {
    dbOpenPromise = SQLite.openDatabaseAsync('sanjeevni.db').then(db => {
      dbInstance = db;
      dbOpenPromise = null;
      return db;
    });
  }
  return dbOpenPromise;
}

/**
 * Normalizes user ID for consistent database indexing and multi-user isolation.
 */
export function normalizeUserId(userId?: string): string {
  if (!userId || !userId.trim()) return 'offline_local';
  return userId.trim().toLowerCase();
}

/**
 * Initializes the Sanjeevni on-device SQLite database with Schema v4 Multi-User Support.
 */
export async function initDb() {
  const db = await getDb();

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS readings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL DEFAULT 'offline_local',
      timestamp TEXT NOT NULL,
      sensor_type TEXT NOT NULL,
      value REAL NOT NULL,
      source TEXT NOT NULL,
      synced INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL DEFAULT 'offline_local',
      timestamp TEXT NOT NULL,
      category TEXT NOT NULL,
      severity TEXT CHECK(severity IN ('LOW', 'MODERATE', 'HIGH', 'CRITICAL')) NOT NULL,
      message TEXT NOT NULL,
      acknowledged INTEGER DEFAULT 0
    );
  `);

  // Ensure user_id column exists on pre-existing tables before indexing
  try {
    await db.execAsync("ALTER TABLE readings ADD COLUMN user_id TEXT NOT NULL DEFAULT 'offline_local'");
  } catch {}
  try {
    await db.execAsync("ALTER TABLE alerts ADD COLUMN user_id TEXT NOT NULL DEFAULT 'offline_local'");
  } catch {}

  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_readings_sensor_timestamp ON readings(sensor_type, timestamp);
    CREATE INDEX IF NOT EXISTS idx_readings_user_sensor_ts ON readings(user_id, sensor_type, timestamp);
    CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp);
    CREATE INDEX IF NOT EXISTS idx_alerts_user_ts ON alerts(user_id, timestamp);

    CREATE TABLE IF NOT EXISTS user_profile (
      user_id TEXT PRIMARY KEY,
      name TEXT DEFAULT 'Sanjeevni User',
      email TEXT DEFAULT 'user@sanjeevni.health',
      pin TEXT DEFAULT '',
      age INTEGER DEFAULT 25,
      gender TEXT DEFAULT 'Other',
      height_cm REAL DEFAULT 170,
      weight_kg REAL DEFAULT 65,
      blood_group TEXT DEFAULT 'O+',
      medical_condition TEXT DEFAULT 'None',
      emergency_name TEXT DEFAULT 'Emergency Contact',
      emergency_phone TEXT DEFAULT '+91 98765 43210',
      is_logged_in INTEGER DEFAULT 1,
      baseline_values TEXT,
      vulnerability_flags TEXT,
      emergency_contact TEXT
    );

    CREATE TABLE IF NOT EXISTS rolling_baseline (
      user_id TEXT NOT NULL DEFAULT 'offline_local',
      metric_type TEXT NOT NULL,
      moving_average REAL NOT NULL,
      last_updated TEXT NOT NULL,
      PRIMARY KEY (user_id, metric_type)
    );

    CREATE TABLE IF NOT EXISTS archived_summaries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL DEFAULT 'offline_local',
      sensor_type TEXT NOT NULL,
      period_date TEXT NOT NULL,
      avg_value REAL NOT NULL,
      min_value REAL NOT NULL,
      max_value REAL NOT NULL,
      sample_count INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_summaries_user_sensor ON archived_summaries(user_id, sensor_type, period_date);
  `);

  const result = await db.getFirstAsync<{user_version: number}>('PRAGMA user_version');
  const currentVersion = result ? result.user_version : 0;

  if (currentVersion < 1) {
    await db.execAsync('PRAGMA user_version = 1');
  }

  if (currentVersion < 2) {
    try {
      await db.execAsync('ALTER TABLE readings ADD COLUMN synced INTEGER DEFAULT 0');
    } catch {}
    await db.execAsync('PRAGMA user_version = 2');
  }

  if (currentVersion < 3) {
    const columns = [
      "ALTER TABLE user_profile ADD COLUMN name TEXT DEFAULT 'Sanjeevni User'",
      "ALTER TABLE user_profile ADD COLUMN email TEXT DEFAULT 'user@sanjeevni.health'",
      "ALTER TABLE user_profile ADD COLUMN pin TEXT DEFAULT ''",
      "ALTER TABLE user_profile ADD COLUMN age INTEGER DEFAULT 25",
      "ALTER TABLE user_profile ADD COLUMN gender TEXT DEFAULT 'Other'",
      "ALTER TABLE user_profile ADD COLUMN height_cm REAL DEFAULT 170",
      "ALTER TABLE user_profile ADD COLUMN weight_kg REAL DEFAULT 65",
      "ALTER TABLE user_profile ADD COLUMN blood_group TEXT DEFAULT 'O+'",
      "ALTER TABLE user_profile ADD COLUMN medical_condition TEXT DEFAULT 'None'",
      "ALTER TABLE user_profile ADD COLUMN emergency_name TEXT DEFAULT 'Emergency Contact'",
      "ALTER TABLE user_profile ADD COLUMN emergency_phone TEXT DEFAULT '+91 98765 43210'",
      "ALTER TABLE user_profile ADD COLUMN is_logged_in INTEGER DEFAULT 1",
    ];
    for (const colSql of columns) {
      try {
        await db.execAsync(colSql);
      } catch {}
    }
    await db.execAsync('PRAGMA user_version = 3');
  }

  if (currentVersion < 4) {
    // Migration to v4: Multi-User Scoping
    try {
      await db.execAsync("ALTER TABLE readings ADD COLUMN user_id TEXT NOT NULL DEFAULT 'offline_local'");
    } catch {}
    try {
      await db.execAsync("ALTER TABLE alerts ADD COLUMN user_id TEXT NOT NULL DEFAULT 'offline_local'");
    } catch {}
    try {
      await db.execAsync("CREATE INDEX IF NOT EXISTS idx_readings_user_sensor_ts ON readings(user_id, sensor_type, timestamp)");
      await db.execAsync("CREATE INDEX IF NOT EXISTS idx_alerts_user_ts ON alerts(user_id, timestamp)");
    } catch {}

    try {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS user_profile_v4 (
          user_id TEXT PRIMARY KEY,
          name TEXT DEFAULT 'Sanjeevni User',
          email TEXT DEFAULT 'user@sanjeevni.health',
          pin TEXT DEFAULT '',
          age INTEGER DEFAULT 25,
          gender TEXT DEFAULT 'Other',
          height_cm REAL DEFAULT 170,
          weight_kg REAL DEFAULT 65,
          blood_group TEXT DEFAULT 'O+',
          medical_condition TEXT DEFAULT 'None',
          emergency_name TEXT DEFAULT 'Emergency Contact',
          emergency_phone TEXT DEFAULT '+91 98765 43210',
          is_logged_in INTEGER DEFAULT 1,
          baseline_values TEXT,
          vulnerability_flags TEXT,
          emergency_contact TEXT
        );
      `);
      await db.execAsync(`
        INSERT OR IGNORE INTO user_profile_v4 (user_id, name, email, pin, age, gender, height_cm, weight_kg, blood_group, medical_condition, emergency_name, emergency_phone, is_logged_in, baseline_values, vulnerability_flags, emergency_contact)
        SELECT COALESCE(NULLIF(email, ''), 'offline_local'), name, email, pin, age, gender, height_cm, weight_kg, blood_group, medical_condition, emergency_name, emergency_phone, is_logged_in, baseline_values, vulnerability_flags, emergency_contact
        FROM user_profile;
      `);
      await db.execAsync(`
        DROP TABLE user_profile;
        ALTER TABLE user_profile_v4 RENAME TO user_profile;
      `);
    } catch {}

    await db.execAsync('PRAGMA user_version = 4');
    console.log('Database migrated to v4: multi-user schema complete.');
  }

  if (currentVersion < 5) {
    try {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS archived_summaries (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL DEFAULT 'offline_local',
          sensor_type TEXT NOT NULL,
          period_date TEXT NOT NULL,
          avg_value REAL NOT NULL,
          min_value REAL NOT NULL,
          max_value REAL NOT NULL,
          sample_count INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_summaries_user_sensor ON archived_summaries(user_id, sensor_type, period_date);
      `);
    } catch {}
    await db.execAsync('PRAGMA user_version = 5');
    console.log('Database migrated to v5: archived_summaries table initialized.');
  }
}

/**
 * Downsamples and archives raw readings older than specified months (default: 6 months / 180 days)
 * into compact daily statistical summaries (avg, min, max, count), then prunes the raw high-frequency records.
 */
export async function summarizeAndPruneOldData(
  monthsCutoff: number = 6,
  userId?: string
): Promise<{ archivedRows: number; prunedRows: number }> {
  const db = await getDb();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - monthsCutoff * 30);
  const cutoffTimestamp = cutoffDate.toISOString();

  if (userId) {
    const uid = normalizeUserId(userId);
    // 1. Rollup daily aggregates into archived_summaries
    await db.runAsync(
      `INSERT INTO archived_summaries (user_id, sensor_type, period_date, avg_value, min_value, max_value, sample_count)
       SELECT user_id, sensor_type, substr(timestamp, 1, 10) as period_date, AVG(value), MIN(value), MAX(value), COUNT(*)
       FROM readings
       WHERE timestamp < ? AND user_id = ?
       GROUP BY user_id, sensor_type, substr(timestamp, 1, 10)`,
      cutoffTimestamp,
      uid
    );

    // 2. Delete the raw records
    await db.runAsync('DELETE FROM readings WHERE timestamp < ? AND user_id = ?', cutoffTimestamp, uid);
  } else {
    await db.runAsync(
      `INSERT INTO archived_summaries (user_id, sensor_type, period_date, avg_value, min_value, max_value, sample_count)
       SELECT user_id, sensor_type, substr(timestamp, 1, 10) as period_date, AVG(value), MIN(value), MAX(value), COUNT(*)
       FROM readings
       WHERE timestamp < ?
       GROUP BY user_id, sensor_type, substr(timestamp, 1, 10)`,
      cutoffTimestamp
    );

    await db.runAsync('DELETE FROM readings WHERE timestamp < ?', cutoffTimestamp);
  }

  return { archivedRows: 0, prunedRows: 0 };
}

/**
 * Prunes raw readings older than 6 months (auto-summarizing).
 */
export async function pruneOldData(userId?: string) {
  await summarizeAndPruneOldData(6, userId);
}

/**
 * Erases all health telemetry, alerts, baselines, and summaries from the database
 * to provide a clean slate (e.g. after testing noisy prototype sensors).
 */
export async function clearAllData(userId?: string): Promise<void> {
  const db = await getDb();
  if (userId) {
    const uid = normalizeUserId(userId);
    await db.runAsync('DELETE FROM readings WHERE user_id = ?', uid);
    await db.runAsync('DELETE FROM alerts WHERE user_id = ?', uid);
    await db.runAsync('DELETE FROM archived_summaries WHERE user_id = ?', uid);
    await db.runAsync('DELETE FROM rolling_baseline WHERE user_id = ?', uid);
  } else {
    await db.runAsync('DELETE FROM readings');
    await db.runAsync('DELETE FROM alerts');
    await db.runAsync('DELETE FROM archived_summaries');
    await db.runAsync('DELETE FROM rolling_baseline');
  }
}

/**
 * Returns storage record counts for UI diagnostics.
 */
export async function getStorageStats(userId?: string): Promise<{
  readingsCount: number;
  alertsCount: number;
  summariesCount: number;
}> {
  const db = await getDb();
  const uid = normalizeUserId(userId);

  const readingsRow = await db.getFirstAsync<{ count: number }>(
    userId ? 'SELECT COUNT(*) as count FROM readings WHERE user_id = ?' : 'SELECT COUNT(*) as count FROM readings',
    ...(userId ? [uid] : [])
  );
  const alertsRow = await db.getFirstAsync<{ count: number }>(
    userId ? 'SELECT COUNT(*) as count FROM alerts WHERE user_id = ?' : 'SELECT COUNT(*) as count FROM alerts',
    ...(userId ? [uid] : [])
  );
  const summariesRow = await db.getFirstAsync<{ count: number }>(
    userId ? 'SELECT COUNT(*) as count FROM archived_summaries WHERE user_id = ?' : 'SELECT COUNT(*) as count FROM archived_summaries',
    ...(userId ? [uid] : [])
  );

  return {
    readingsCount: readingsRow?.count || 0,
    alertsCount: alertsRow?.count || 0,
    summariesCount: summariesRow?.count || 0,
  };
}

// ---------------- READINGS (USER-SCOPED) ----------------

/**
 * Insert a single reading into the unified readings table scoped to a user.
 */
export async function insertReading(
  sensorType: string,
  value: number,
  source: string = 'garment',
  userId: string = 'offline_local'
) {
  if (sensorType === 'HR' && (value <= 0 || value > 250)) return;
  if (sensorType === 'SpO2' && (value < 0 || value > 100)) return;
  if (sensorType === 'TEMP' && (value < -10 || value > 60)) return;
  if (sensorType === 'AQI' && (value < 0 || value > 1000)) return;
  if (sensorType === 'HUMIDITY' && (value < 0 || value > 100)) return;
  if (sensorType === 'MOISTURE' && (value < 0 || value > 100)) return;
  if (sensorType === 'STEPS' && (value < 0 || value > 100000)) return;
  if (sensorType === 'HRV_SDNN' && (value < 0 || value > 500)) return;
  if (sensorType === 'HRV_RMSSD' && (value < 0 || value > 500)) return;

  const db = await getDb();
  const timestamp = new Date().toISOString();
  const uid = normalizeUserId(userId);

  await db.runAsync(
    'INSERT INTO readings (user_id, timestamp, sensor_type, value, source, synced) VALUES (?, ?, ?, ?, ?, 0)',
    uid, timestamp, sensorType, value, source
  );
}

/**
 * Get all readings that haven't been backed up to the cloud for a user.
 */
export async function getPendingReadings(userId?: string): Promise<any[]> {
  const db = await getDb();
  if (userId) {
    const uid = normalizeUserId(userId);
    return db.getAllAsync('SELECT * FROM readings WHERE synced = 0 AND user_id = ?', uid);
  }
  return db.getAllAsync('SELECT * FROM readings WHERE synced = 0');
}

/**
 * Mark specific readings as successfully synced.
 */
export async function markSynced(ids: number[]) {
  if (ids.length === 0) return;
  const db = await getDb();
  const placeholders = ids.map(() => '?').join(',');
  await db.runAsync(`UPDATE readings SET synced = 1 WHERE id IN (${placeholders})`, ...ids);
}

/**
 * Fetch the latest reading for a specific sensor type and user.
 */
export async function getLatestReading(sensorType: string, userId?: string): Promise<any> {
  const db = await getDb();
  const uid = normalizeUserId(userId);
  return db.getFirstAsync(
    'SELECT * FROM readings WHERE sensor_type = ? AND user_id = ? ORDER BY timestamp DESC LIMIT 1',
    sensorType,
    uid
  );
}

/**
 * Fetch all readings for a sensor type within the last N minutes for a user.
 */
export async function getRecentReadings(sensorType: string, minutes: number, userId?: string): Promise<any[]> {
  const db = await getDb();
  const cutoff = new Date(Date.now() - minutes * 60 * 1000).toISOString();
  const uid = normalizeUserId(userId);

  return db.getAllAsync(
    'SELECT * FROM readings WHERE sensor_type = ? AND user_id = ? AND timestamp >= ? ORDER BY timestamp DESC',
    sensorType,
    uid,
    cutoff
  );
}

/**
 * Calculates historical aggregated statistics for a specific sensor and user.
 */
export async function getSensorStats(
  sensorType: string,
  userId?: string
): Promise<{
  count: number;
  avg: number;
  min: number;
  max: number;
  latest: number;
} | null> {
  const db = await getDb();
  const uid = normalizeUserId(userId);

  const row = await db.getFirstAsync<{
    count: number;
    avg: number | null;
    min: number | null;
    max: number | null;
  }>(
    'SELECT COUNT(*) as count, AVG(value) as avg, MIN(value) as min, MAX(value) as max FROM readings WHERE sensor_type = ? AND user_id = ?',
    sensorType,
    uid
  );

  if (!row || row.count === 0 || row.avg === null) {
    return null;
  }

  const latestRow = await db.getFirstAsync<{ value: number }>(
    'SELECT value FROM readings WHERE sensor_type = ? AND user_id = ? ORDER BY timestamp DESC LIMIT 1',
    sensorType,
    uid
  );

  return {
    count: row.count,
    avg: Number(row.avg.toFixed(1)),
    min: Number((row.min ?? 0).toFixed(1)),
    max: Number((row.max ?? 0).toFixed(1)),
    latest: latestRow ? latestRow.value : Number(row.avg.toFixed(1)),
  };
}

/**
 * Retrieves historical session averages for all biometric sensors scoped to a user.
 */
export async function getAllSensorAverages(userId?: string): Promise<{
  hr: number | null;
  temp: number | null;
  aqi: number | null;
  humidity: number | null;
  steps: number | null;
  hasData: boolean;
}> {
  const db = await getDb();
  const uid = normalizeUserId(userId);

  const hrStat = await getSensorStats('HR', uid);
  const tempStat = await getSensorStats('TEMP', uid);
  const aqiStat = await getSensorStats('AQI', uid);
  const humStat = (await getSensorStats('HUMIDITY', uid)) || (await getSensorStats('MOISTURE', uid));
  const stepRow = await db.getFirstAsync<{ max_steps: number | null }>(
    'SELECT MAX(value) as max_steps FROM readings WHERE sensor_type = ? AND user_id = ?',
    'STEPS',
    uid
  );

  const hasData = Boolean(hrStat || tempStat || aqiStat || humStat || stepRow?.max_steps);

  return {
    hr: hrStat ? Math.round(hrStat.avg) : null,
    temp: tempStat ? Number(tempStat.avg.toFixed(1)) : null,
    aqi: aqiStat ? Math.round(aqiStat.avg) : null,
    humidity: humStat ? Math.round(humStat.avg) : null,
    steps: stepRow?.max_steps ? Math.round(stepRow.max_steps) : null,
    hasData,
  };
}

/**
 * Retrieves recent chronological readings for a sensor type and user.
 */
export async function getSensorHistory(
  sensorType: string,
  limit: number = 20,
  userId?: string
): Promise<{ timestamp: string; value: number }[]> {
  const db = await getDb();
  const uid = normalizeUserId(userId);

  let sql = 'SELECT timestamp, value FROM readings WHERE sensor_type = ? AND user_id = ? ORDER BY timestamp DESC LIMIT ?';
  let params: any[] = [sensorType, uid, limit];

  if (sensorType === 'HUMIDITY' || sensorType === 'MOISTURE') {
    sql = "SELECT timestamp, value FROM readings WHERE (sensor_type = 'HUMIDITY' OR sensor_type = 'MOISTURE') AND user_id = ? ORDER BY timestamp DESC LIMIT ?";
    params = [uid, limit];
  }

  const rows = await db.getAllAsync<{ timestamp: string; value: number }>(sql, ...params);
  return rows.reverse();
}

/**
 * Clears readings from the database scoped to a user.
 */
export async function clearReadings(sensorType?: string, userId?: string): Promise<void> {
  const db = await getDb();
  const uid = normalizeUserId(userId);

  if (sensorType) {
    await db.runAsync('DELETE FROM readings WHERE sensor_type = ? AND user_id = ?', sensorType, uid);
  } else if (userId) {
    await db.runAsync('DELETE FROM readings WHERE user_id = ?', uid);
  } else {
    await db.runAsync('DELETE FROM readings');
  }
}

// ---------------- ALERTS (USER-SCOPED) ----------------

/**
 * Insert a new alert scoped to a user.
 */
export async function insertAlert(
  category: string,
  severity: string,
  message: string,
  userId: string = 'offline_local'
) {
  const db = await getDb();
  const timestamp = new Date().toISOString();
  const uid = normalizeUserId(userId);

  await db.runAsync(
    'INSERT INTO alerts (user_id, timestamp, category, severity, message) VALUES (?, ?, ?, ?, ?)',
    uid, timestamp, category, severity, message
  );
}

/**
 * Fetch latest alerts for a user.
 */
export async function getAlerts(limit: number = 20, userId?: string): Promise<any[]> {
  const db = await getDb();
  const uid = normalizeUserId(userId);

  return db.getAllAsync(
    'SELECT * FROM alerts WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?',
    uid,
    limit
  );
}

/**
 * Fetch unacknowledged alerts for a user.
 */
export async function getUnacknowledgedAlerts(userId?: string): Promise<any[]> {
  const db = await getDb();
  const uid = normalizeUserId(userId);

  return db.getAllAsync(
    'SELECT * FROM alerts WHERE acknowledged = 0 AND user_id = ? ORDER BY timestamp DESC',
    uid
  );
}

/**
 * Marks an alert as acknowledged.
 */
export async function acknowledgeAlert(id: number) {
  const db = await getDb();
  await db.runAsync(
    'UPDATE alerts SET acknowledged = 1 WHERE id = ?',
    id
  );
}

/**
 * Deletes a specific alert.
 */
export async function deleteAlert(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM alerts WHERE id = ?', id);
}

/**
 * Clears all alerts for a user (or globally).
 */
export async function clearAllAlerts(userId?: string): Promise<void> {
  const db = await getDb();
  if (userId) {
    const uid = normalizeUserId(userId);
    await db.runAsync('DELETE FROM alerts WHERE user_id = ?', uid);
  } else {
    await db.runAsync('DELETE FROM alerts');
  }
}

// ---------------- USER PROFILE & LOCAL CREDENTIALS (MULTI-USER) ----------------

export interface LocalUserProfile {
  userId?: string;
  name: string;
  email: string;
  pin: string;
  age: number;
  gender: string;
  heightCm: number;
  weightKg: number;
  bloodGroup: string;
  medicalCondition: string;
  emergencyName: string;
  emergencyPhone: string;
  isLoggedIn: boolean;
  baselineValues?: string;
  vulnerabilityFlags?: string;
  emergencyContact?: string;
}

/**
 * Fetch user profile row for a specific user ID.
 */
export async function getUserProfile(userId: string = 'offline_local'): Promise<any> {
  const db = await getDb();
  const uid = normalizeUserId(userId);
  return db.getFirstAsync('SELECT * FROM user_profile WHERE user_id = ? LIMIT 1', uid);
}

/**
 * Comprehensive CRUD: Save user credentials and health profile into SQLite.
 */
export async function saveLocalUserProfile(profile: LocalUserProfile, userId?: string): Promise<void> {
  const db = await getDb();
  const uid = normalizeUserId(userId || profile.userId || profile.email);

  await db.runAsync(
    `INSERT INTO user_profile (
      user_id, name, email, pin, age, gender, height_cm, weight_kg, blood_group, 
      medical_condition, emergency_name, emergency_phone, is_logged_in,
      baseline_values, vulnerability_flags, emergency_contact
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      name = excluded.name,
      email = excluded.email,
      pin = excluded.pin,
      age = excluded.age,
      gender = excluded.gender,
      height_cm = excluded.height_cm,
      weight_kg = excluded.weight_kg,
      blood_group = excluded.blood_group,
      medical_condition = excluded.medical_condition,
      emergency_name = excluded.emergency_name,
      emergency_phone = excluded.emergency_phone,
      is_logged_in = excluded.is_logged_in,
      baseline_values = excluded.baseline_values,
      vulnerability_flags = excluded.vulnerability_flags,
      emergency_contact = excluded.emergency_contact`,
    uid,
    profile.name,
    profile.email,
    profile.pin || '',
    profile.age,
    profile.gender,
    profile.heightCm,
    profile.weightKg,
    profile.bloodGroup,
    profile.medicalCondition,
    profile.emergencyName,
    profile.emergencyPhone,
    profile.isLoggedIn ? 1 : 0,
    profile.baselineValues || '',
    profile.vulnerabilityFlags || '',
    profile.emergencyPhone || ''
  );
}

/**
 * Comprehensive CRUD: Fetch local user credentials and profile for a specific user.
 */
export async function getLocalUserProfile(userId: string = 'offline_local'): Promise<LocalUserProfile | null> {
  const db = await getDb();
  const uid = normalizeUserId(userId);
  const row = await db.getFirstAsync<any>('SELECT * FROM user_profile WHERE user_id = ?', uid);
  if (!row) return null;
  return {
    userId: row.user_id,
    name: row.name || 'Sanjeevni User',
    email: row.email || (uid === 'offline_local' ? 'offline@sanjeevni.local' : uid),
    pin: row.pin || '',
    age: row.age || 25,
    gender: row.gender || 'Other',
    heightCm: row.height_cm || 170,
    weightKg: row.weight_kg || 65,
    bloodGroup: row.blood_group || 'O+',
    medicalCondition: row.medical_condition || 'None',
    emergencyName: row.emergency_name || 'Emergency Contact',
    emergencyPhone: row.emergency_phone || '+91 98765 43210',
    isLoggedIn: row.is_logged_in === 1,
    baselineValues: row.baseline_values,
    vulnerabilityFlags: row.vulnerability_flags,
    emergencyContact: row.emergency_contact,
  };
}

/**
 * Resets the user's logged-in status on logout.
 */
export async function clearLocalUserProfile(userId: string = 'offline_local'): Promise<void> {
  const db = await getDb();
  const uid = normalizeUserId(userId);
  await db.runAsync('UPDATE user_profile SET is_logged_in = 0 WHERE user_id = ?', uid);
}

// ---------------- ROLLING BASELINE (USER-SCOPED) ----------------

/**
 * Updates the AI rolling baseline for a specific metric and user.
 */
export async function updateRollingBaseline(
  metricType: string,
  movingAverage: number,
  userId: string = 'offline_local'
) {
  const db = await getDb();
  const timestamp = new Date().toISOString();
  const uid = normalizeUserId(userId);

  await db.runAsync(
    `INSERT INTO rolling_baseline (user_id, metric_type, moving_average, last_updated) 
      VALUES (?, ?, ?, ?) 
      ON CONFLICT(user_id, metric_type) 
      DO UPDATE SET moving_average=excluded.moving_average, last_updated=excluded.last_updated`,
    uid, metricType, movingAverage, timestamp
  );
}

/**
 * Fetch the current rolling baseline for a metric and user.
 */
export async function getRollingBaseline(
  metricType: string,
  userId: string = 'offline_local'
): Promise<any> {
  const db = await getDb();
  const uid = normalizeUserId(userId);
  return db.getFirstAsync(
    'SELECT * FROM rolling_baseline WHERE user_id = ? AND metric_type = ?',
    uid,
    metricType
  );
}