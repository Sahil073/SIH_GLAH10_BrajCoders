// =============================================================================
// src/database/index.ts
// Mobile App Database access layer & safe wrapper around SQLite.
// Supports multi-user isolation (Google accounts vs Offline BLE Direct).
// =============================================================================

import {
  initDb as rawInitDb,
  pruneOldData as rawPruneOldData,
  insertReading as rawInsertReading,
  getPendingReadings as rawGetPendingReadings,
  markSynced as rawMarkSynced,
  getLatestReading as rawGetLatestReading,
  getRecentReadings as rawGetRecentReadings,
  insertAlert as rawInsertAlert,
  getAlerts as rawGetAlerts,
  acknowledgeAlert as rawAcknowledgeAlert,
  getUserProfile as rawGetUserProfile,
  updateRollingBaseline as rawUpdateRollingBaseline,
  getRollingBaseline as rawGetRollingBaseline,
  getSensorStats as rawGetSensorStats,
  getAllSensorAverages as rawGetAllSensorAverages,
  getSensorHistory as rawGetSensorHistory,
  clearReadings as rawClearReadings,
  deleteAlert as rawDeleteAlert,
  clearAllAlerts as rawClearAllAlerts,
  clearAllData as rawClearAllData,
  summarizeAndPruneOldData as rawSummarizeAndPruneOldData,
  getStorageStats as rawGetStorageStats,
  saveLocalUserProfile as rawSaveLocalUserProfile,
  getLocalUserProfile as rawGetLocalUserProfile,
  clearLocalUserProfile as rawClearLocalUserProfile,
  normalizeUserId,
  LocalUserProfile,
} from "../../databaseConnections/database";

export { normalizeUserId, LocalUserProfile };

let isDbInitialized = false;

/**
 * Safe initializer for the on-device SQLite database.
 * Automatically runs table setup and migrations.
 */
export async function initDatabase(): Promise<boolean> {
  try {
    await rawInitDb();
    await rawPruneOldData();
    isDbInitialized = true;
    console.log("[Database] Sanjeevni SQLite database initialized & pruned.");
    return true;
  } catch (error) {
    console.error("[Database] Failed to initialize SQLite database:", error);
    return false;
  }
}

/**
 * Safe wrapper for inserting a sensor reading scoped to a user.
 */
export type AllowedSensorType =
  | "HR"
  | "TEMP"
  | "HUMIDITY"
  | "MOISTURE"
  | "AQI"
  | "STEPS"
  | "HRV_SDNN"
  | "HRV_RMSSD"
  | "SpO2"
  | (string & {});

export async function safeInsertReading(
  sensorType: AllowedSensorType,
  value: number,
  source: string = "garment",
  userId: string = "offline_local"
): Promise<void> {
  try {
    await rawInsertReading(sensorType, value, source, userId);
  } catch (error) {
    console.warn(`[Database] Failed to insert reading (${sensorType}=${value}):`, error);
  }
}

/**
 * Safe wrapper for inserting an alert record scoped to a user.
 */
export async function safeInsertAlert(
  category: "CARDIAC" | "HEAT" | "RESPIRATORY" | "FALL" | "VITALS" | "SYSTEM" | string,
  severity: "LOW" | "MODERATE" | "HIGH" | "CRITICAL",
  message: string,
  userId: string = "offline_local"
): Promise<void> {
  try {
    await rawInsertAlert(category, severity, message, userId);
    console.log(`[Database] Alert logged for [${userId}]: [${severity}] ${category} - ${message}`);
  } catch (error) {
    console.warn(`[Database] Failed to insert alert:`, error);
  }
}

/**
 * Fetch recent alerts from SQLite scoped to a user.
 */
export async function fetchAlerts(limit: number = 25, userId?: string): Promise<any[]> {
  try {
    return await rawGetAlerts(limit, userId);
  } catch (error) {
    console.warn("[Database] Failed to fetch alerts:", error);
    return [];
  }
}

/**
 * Acknowledge an alert by ID.
 */
export async function ackAlert(id: number): Promise<void> {
  try {
    await rawAcknowledgeAlert(id);
  } catch (error) {
    console.warn(`[Database] Failed to acknowledge alert ${id}:`, error);
  }
}

/**
 * Delete a specific alert by ID.
 */
export async function removeAlert(id: number): Promise<void> {
  try {
    await rawDeleteAlert(id);
  } catch (error) {
    console.warn(`[Database] Failed to delete alert ${id}:`, error);
  }
}

/**
 * Clear all alerts from SQLite for a user (or all).
 */
export async function removeAllAlerts(userId?: string): Promise<void> {
  try {
    await rawClearAllAlerts(userId);
  } catch (error) {
    console.warn("[Database] Failed to clear alerts:", error);
  }
}

/**
 * Fetch historical session averages for all key biometric sensors scoped to a user.
 */
export async function fetchAllSensorAverages(userId?: string) {
  try {
    return await rawGetAllSensorAverages(userId);
  } catch (error) {
    console.warn("[Database] Failed to fetch sensor averages:", error);
    return { hr: null, temp: null, aqi: null, humidity: null, steps: null, hasData: false };
  }
}

/**
 * Fetch chronological readings for a sensor for accurate charting scoped to a user.
 */
export async function fetchSensorHistory(sensorType: string, limit: number = 20, userId?: string) {
  try {
    return await rawGetSensorHistory(sensorType, limit, userId);
  } catch (error) {
    console.warn(`[Database] Failed to fetch history for ${sensorType}:`, error);
    return [];
  }
}

/**
 * Clear raw readings for a sensor type or all readings scoped to a user.
 */
export async function truncateReadings(sensorType?: string, userId?: string): Promise<void> {
  try {
    await rawClearReadings(sensorType, userId);
  } catch (error) {
    console.warn("[Database] Failed to clear readings:", error);
  }
}

/**
 * Erase all health readings, alerts, baselines, and summaries from the database
 * to provide a clean slate (e.g. after testing noisy prototype sensors).
 */
export async function clearAllHealthData(userId?: string): Promise<void> {
  try {
    await rawClearAllData(userId);
    console.log(`[Database] All health telemetry erased for [${userId || "all"}].`);
  } catch (error) {
    console.warn("[Database] Failed to clear all health data:", error);
  }
}

/**
 * Downsamples readings older than cutoff months (default 6) into daily summaries and prunes raw data.
 */
export async function archiveAndPruneData(
  monthsCutoff: number = 6,
  userId?: string
): Promise<{ archivedRows: number; prunedRows: number }> {
  try {
    const res = await rawSummarizeAndPruneOldData(monthsCutoff, userId);
    console.log(`[Database] Archived and pruned records older than ${monthsCutoff} months.`);
    return res;
  } catch (error) {
    console.warn("[Database] Failed to archive and prune data:", error);
    return { archivedRows: 0, prunedRows: 0 };
  }
}

/**
 * Fetch storage record statistics for UI display and diagnostics.
 */
export async function fetchStorageStats(userId?: string): Promise<{
  readingsCount: number;
  alertsCount: number;
  summariesCount: number;
}> {
  try {
    return await rawGetStorageStats(userId);
  } catch (error) {
    console.warn("[Database] Failed to fetch storage stats:", error);
    return { readingsCount: 0, alertsCount: 0, summariesCount: 0 };
  }
}

/**
 * Persist user health profile and credentials into SQLite scoped by user ID.
 */
export async function persistLocalUserProfile(profile: LocalUserProfile, userId?: string): Promise<void> {
  try {
    await rawSaveLocalUserProfile(profile, userId);
  } catch (error) {
    console.warn("[Database] Failed to save user profile:", error);
  }
}

/**
 * Fetch local user health profile and credentials from SQLite scoped by user ID.
 */
export async function fetchLocalUserProfile(userId: string = "offline_local"): Promise<LocalUserProfile | null> {
  try {
    return await rawGetLocalUserProfile(userId);
  } catch (error) {
    console.warn("[Database] Failed to fetch user profile:", error);
    return null;
  }
}

/**
 * Clear local user logged-in status from SQLite.
 */
export async function resetLocalUserProfile(userId: string = "offline_local"): Promise<void> {
  try {
    await rawClearLocalUserProfile(userId);
  } catch (error) {
    console.warn("[Database] Failed to reset user profile:", error);
  }
}

/**
 * Fetch rolling baseline for AI calibration scoped to a user.
 */
export async function fetchRollingBaseline(metricType: string, userId: string = "offline_local"): Promise<any> {
  try {
    return await rawGetRollingBaseline(metricType, userId);
  } catch (error) {
    console.warn(`[Database] Failed to fetch baseline for ${metricType}:`, error);
    return null;
  }
}

/**
 * Persist updated rolling baseline for AI calibration scoped to a user.
 */
export async function persistRollingBaseline(
  metricType: string,
  movingAverage: number,
  userId: string = "offline_local"
): Promise<void> {
  try {
    await rawUpdateRollingBaseline(metricType, movingAverage, userId);
  } catch (error) {
    console.warn(`[Database] Failed to update baseline for ${metricType}:`, error);
  }
}

export { fetchUserVitalsHistory } from "./vitalsHistory";
