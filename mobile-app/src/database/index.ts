// =============================================================================
// src/database/index.ts
// Mobile App Database access layer & safe wrapper around SQLite.
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
  upsertUserProfile as rawUpsertUserProfile,
  updateRollingBaseline as rawUpdateRollingBaseline,
  getRollingBaseline as rawGetRollingBaseline,
} from "../../databaseConnections/database";

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
 * Safe wrapper for inserting a sensor reading.
 */
export async function safeInsertReading(
  sensorType: "HR" | "TEMP" | "HUMIDITY" | "AQI" | "STEPS" | "HRV_SDNN" | "HRV_RMSSD" | "SpO2",
  value: number,
  source: string = "garment"
): Promise<void> {
  try {
    await rawInsertReading(sensorType, value, source);
  } catch (error) {
    console.warn(`[Database] Failed to insert reading (${sensorType}=${value}):`, error);
  }
}

/**
 * Safe wrapper for inserting an alert record.
 */
export async function safeInsertAlert(
  category: "CARDIAC" | "HEAT" | "RESPIRATORY" | "FALL" | "SYSTEM",
  severity: "LOW" | "MODERATE" | "HIGH" | "CRITICAL",
  message: string
): Promise<void> {
  try {
    await rawInsertAlert(category, severity, message);
    console.log(`[Database] Alert logged: [${severity}] ${category} - ${message}`);
  } catch (error) {
    console.warn(`[Database] Failed to insert alert:`, error);
  }
}

/**
 * Fetch recent alerts from SQLite.
 */
export async function fetchAlerts(limit: number = 25): Promise<any[]> {
  try {
    return await rawGetAlerts(limit);
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
 * Fetch user profile from SQLite.
 */
export async function fetchUserProfile(): Promise<any> {
  try {
    return await rawGetUserProfile();
  } catch (error) {
    console.warn("[Database] Failed to fetch user profile:", error);
    return null;
  }
}

/**
 * Upsert user profile in SQLite.
 */
export async function saveUserProfile(
  baselineValues: string,
  vulnerabilityFlags: string,
  emergencyContact: string
): Promise<void> {
  try {
    await rawUpsertUserProfile(baselineValues, vulnerabilityFlags, emergencyContact);
  } catch (error) {
    console.warn("[Database] Failed to save user profile:", error);
  }
}

export {
  rawInitDb as initDb,
  rawInsertReading as insertReading,
  rawInsertAlert as insertAlert,
  rawGetAlerts as getAlerts,
  rawAcknowledgeAlert as acknowledgeAlert,
  rawGetUserProfile as getUserProfile,
  rawUpsertUserProfile as upsertUserProfile,
  rawGetRecentReadings as getRecentReadings,
  rawGetLatestReading as getLatestReading,
  rawUpdateRollingBaseline as updateRollingBaseline,
  rawGetRollingBaseline as getRollingBaseline,
};

