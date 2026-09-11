# Sanjeevni — Database Architecture & Offline Networking Documentation

> **Last Updated:** 11 September 2026  
> **Source Files:** [`src/database.ts`](file:///c:/Users/as/Desktop/Sanjeevni/src/database.ts) · [`src/utils/network.ts`](file:///c:/Users/as/Desktop/Sanjeevni/src/utils/network.ts)  
> **Database Engine:** [expo-sqlite](https://docs.expo.dev/versions/v57.0.0/sdk/sqlite/) (SQLite 3, on-device)  
> **DB File Name:** `sanjeevni.db`

---

## Table of Contents

1. [Architectural Overview](#1-architectural-overview)
2. [Technology Stack & Dependencies](#2-technology-stack--dependencies)
3. [Connection Management — The Singleton Pattern](#3-connection-management--the-singleton-pattern)
4. [Schema Initialization & Versioning](#4-schema-initialization--versioning)
5. [Table Schemas (ERD)](#5-table-schemas-erd)
6. [Complete Function Reference](#6-complete-function-reference)
7. [Data Validation & Quality Guards](#7-data-validation--quality-guards)
8. [Networking & Offline Resilience](#8-networking--offline-resilience)
9. [Integration Guide for Teammates](#9-integration-guide-for-teammates)
10. [App Lifecycle & Data Flow](#10-app-lifecycle--data-flow)
11. [Web Platform Compatibility](#11-web-platform-compatibility)
12. [Schema Migration Strategy](#12-schema-migration-strategy)
13. [Troubleshooting & Known Issues](#13-troubleshooting--known-issues)

---

## 1. Architectural Overview

The core USP (Unique Selling Proposition) of Sanjeevni is **Offline-First Resilience**. The entire data layer is built on-device using SQLite so the app functions during natural disasters (heat waves, floods) when cloud connectivity is completely lost.

### Design Principles

| Principle | Implementation |
|---|---|
| **Offline-First** | All data is written to local SQLite first; cloud sync is opportunistic |
| **Zero-Crash Guarantee** | Web platform gets a mock DB; network failures trigger graceful fallbacks |
| **Single Source of Truth** | One singleton DB connection prevents race conditions between BLE writes and UI reads |
| **Data Quality** | Input validation rejects physiologically impossible sensor values before storage |
| **Privacy by Design** | All health data stays on-device; sync is opt-in and simulated for now |

### Key Feature: Airplane Mode Resilience

Sanjeevni does not crash when the internet drops. Using `@react-native-community/netinfo`, the app detects network loss instantly.
- **Graceful API Fallbacks:** If the OpenWeather/AQI API is unreachable, the app seamlessly falls back to reading on-garment hardware sensors (DHT22/MQ135) without user disruption.

### Key Feature: Offline SMS SOS

If the AI detects a critical anomaly (e.g., a fall or severe cardiac event) while offline, Sanjeevni bypasses the internet entirely. It uses `expo-sms` to hook directly into the cellular network and send a text message to a pre-configured emergency contact.

---

## 2. Technology Stack & Dependencies

| Package | Version | Purpose |
|---|---|---|
| `expo-sqlite` | SDK 57 | On-device SQLite database engine |
| `@react-native-community/netinfo` | Latest | Real-time network connectivity detection |
| `expo-sms` | SDK 57 | Offline SMS for SOS emergency messages |
| `react-native` | Via Expo | `Platform.OS` check for web mock |

### File Map

```
src/
├── database.ts          ← All SQLite operations (this doc covers)
├── utils/
│   └── network.ts       ← Offline networking, SOS, sync logic
├── app/
│   ├── _layout.tsx      ← Calls initDb() on app boot, gates UI until ready
│   ├── index.tsx        ← Dashboard: reads sensor data, simulates BLE
│   ├── debug.tsx        ← Database debug/inspection screen
│   └── explore.tsx      ← Explore screen
└── types.d.ts           ← CSS module type declarations
```

---

## 3. Connection Management — The Singleton Pattern

**File:** [`src/database.ts`](file:///c:/Users/as/Desktop/Sanjeevni/src/database.ts) — Lines 1–24

To prevent race conditions (which occur when the ESP32 hardware tries to write data at the same millisecond the dashboard tries to read it), the database uses a **Singleton Connection** pattern.

```typescript
let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase>
```

### How It Works

1. **First call:** Opens `sanjeevni.db` via `SQLite.openDatabaseAsync()` and caches the connection in `dbInstance`.
2. **Subsequent calls:** Returns the cached connection instantly — no re-opening.
3. **Web platform:** Returns a mock object (see [Section 11](#11-web-platform-compatibility)) to prevent crashes during browser-based UI testing.

### Return Type

| Platform | Returns |
|---|---|
| Android / iOS | `SQLite.SQLiteDatabase` (real connection to `sanjeevni.db`) |
| Web | Mock object cast as `SQLite.SQLiteDatabase` |

> ⚠️ **Important:** Every database function in this file calls `getDb()` internally. You never need to call `getDb()` yourself — just import and call the helper functions directly.

---

## 4. Schema Initialization & Versioning

**Function:** `initDb()`  
**File:** [`src/database.ts`](file:///c:/Users/as/Desktop/Sanjeevni/src/database.ts) — Lines 29–90  
**Called from:** [`src/app/_layout.tsx`](file:///c:/Users/as/Desktop/Sanjeevni/src/app/_layout.tsx) — Line 17

### Boot Sequence

```
App Launch
  └─ _layout.tsx renders
       └─ useEffect calls initDb()
            ├─ CREATE TABLE IF NOT EXISTS (all 4 tables + indexes)  ← ALWAYS runs
            ├─ Check PRAGMA user_version
            │   ├─ If < 1 → set to 1, log "v1 schema"
            │   └─ If ≥ 1 → log "already up to date"
            └─ setDbReady(true) → children mount → UI renders
```

### Critical Design Decision

The `CREATE TABLE IF NOT EXISTS` statements run **unconditionally on every app launch**, regardless of `user_version`. This is intentional:
- `IF NOT EXISTS` makes them idempotent (safe to run repeatedly — no-ops if tables exist).
- Prevents the `no such table` crash if the DB file exists but is empty/corrupt.
- The `PRAGMA user_version` is now only used for **tracking migration state**, not for gating table creation.

> ⚠️ **Dual-Location Migration Pattern:** The schema lives in two places — the `CREATE TABLE IF NOT EXISTS` block (for fresh installs) and the versioned `if (currentVersion < N)` block (for existing users). Both blocks have cross-reference comments reminding you to update the other when making changes. Always keep them in sync.

### UI Gating

In [`_layout.tsx`](file:///c:/Users/as/Desktop/Sanjeevni/src/app/_layout.tsx), the layout returns `null` (blank screen) until `initDb()` resolves:

```typescript
const [dbReady, setDbReady] = useState(false);

useEffect(() => {
  initDb()
    .then(() => setDbReady(true))
    .catch((err) => console.error('Database init failed:', err));
}, []);

if (!dbReady) return null;  // No UI until DB is ready
```

This ensures **no screen can query the database before the tables exist**.

---

## 5. Table Schemas (ERD)

### 5.1 `readings` — Unified Sensor Time-Series

The central table. Every physiological and environmental sensor value flows here.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Auto-incrementing unique ID |
| `timestamp` | `TEXT` | `NOT NULL` | ISO 8601 UTC string (e.g., `2026-09-11T09:15:30.000Z`) |
| `sensor_type` | `TEXT` | `NOT NULL` | Metric key: `'HR'`, `'SpO2'`, `'TEMP'`, `'AQI'`, `'HUMIDITY'`, `'STEPS'`, `'HRV_SDNN'`, `'HRV_RMSSD'` |
| `value` | `REAL` | `NOT NULL` | Numeric value (see units below) |
| `source` | `TEXT` | `NOT NULL` | Data origin: `'garment'` or `'api'` |
| `synced` | `INTEGER` | `DEFAULT 0` | Cloud sync flag: `0` = pending, `1` = synced |

**Indexes:**
- `idx_readings_sensor_timestamp` — Composite index on `(sensor_type, timestamp)` for ultra-fast dashboard queries

**Unit Conventions:**

| sensor_type | Unit | Valid Range | Source |
|---|---|---|---|
| `HR` | bpm (beats per minute) | 1–250 | ESP32 garment (ECG) |
| `SpO2` | % (percentage) | 0–100 | ESP32 garment (PPG) |
| `TEMP` | °C (Celsius) | -10–60 | ESP32 garment (DHT22) |
| `AQI` | ppm (parts per million) | 0–1000 | API or garment (MQ135) |
| `HUMIDITY` | % (relative humidity) | 0–100 | ESP32 garment (DHT22) |
| `STEPS` | count (cumulative steps) | 0–100,000 | ESP32 garment (MPU6050 pedometer) |
| `HRV_SDNN` | ms (milliseconds) | 0–500 | ESP32 garment (ECG R-R intervals) |
| `HRV_RMSSD` | ms (milliseconds) | 0–500 | ESP32 garment (ECG R-R intervals) |

**Retention Policy:** Raw readings older than 7 days are auto-pruned by `pruneOldData()` on app startup.

---

### 5.2 `alerts` — AI Emergency Events

Stores every emergency event flagged by the AI engine.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Auto-incrementing unique ID |
| `timestamp` | `TEXT` | `NOT NULL` | ISO 8601 UTC string |
| `category` | `TEXT` | `NOT NULL` | Alert type: e.g., `'Cardiac Risk'`, `'Heat Stress'`, `'Fall Detected'` |
| `severity` | `TEXT` | `CHECK(IN ('LOW','MODERATE','HIGH','CRITICAL')) NOT NULL` | Strict enum — DB rejects any other value |
| `message` | `TEXT` | `NOT NULL` | Human-readable description |
| `acknowledged` | `INTEGER` | `DEFAULT 0` | `0` = active, `1` = user dismissed |

**Indexes:**
- `idx_alerts_timestamp` — On `(timestamp)` for fast alert history queries

**Retention Policy:** Alerts are kept **indefinitely** to build a permanent health record for doctors.

**Severity Enum (strictly enforced at DB level):**

| Severity | Meaning | Example |
|---|---|---|
| `LOW` | Informational, no action needed | Slight temp elevation |
| `MODERATE` | Monitor closely | HR slightly elevated |
| `HIGH` | Intervention recommended | SpO2 dropped below 92% |
| `CRITICAL` | Immediate action — triggers SOS | Cardiac arrest suspected |

---

### 5.3 `user_profile` — Single-Row Settings

Stores the user's vulnerability flags and emergency contact. **Enforced at the DB level to only ever have 1 row.**

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INTEGER` | `PRIMARY KEY CHECK(id = 1)` | Hard-locked to 1 — prevents multiple rows |
| `baseline_values` | `TEXT` | Nullable | JSON string of personal baselines |
| `vulnerability_flags` | `TEXT` | Nullable | JSON string of medical conditions/flags |
| `emergency_contact` | `TEXT` | Nullable | Phone number for SOS SMS |

**Retention Policy:** Kept indefinitely — one persistent profile row.

---

### 5.4 `rolling_baseline` — AI Personalization Engine

Built specifically for the AI engine. Stores a running moving average per metric so the AI can detect *personalized* anomalies.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `metric_type` | `TEXT` | `PRIMARY KEY` | Metric key: `'HR'`, `'SpO2'`, etc. (one row per metric) |
| `moving_average` | `REAL` | `NOT NULL` | Current moving average value |
| `last_updated` | `TEXT` | `NOT NULL` | ISO 8601 UTC timestamp of last update |

**Upsert Strategy:** Uses `ON CONFLICT(metric_type) DO UPDATE` — automatically overwrites the old baseline.

**Retention Policy:** Kept indefinitely alongside alerts.

---

## 6. Complete Function Reference

### 6.1 Database Connection & Setup

#### `getDb()`

```typescript
export async function getDb(): Promise<SQLite.SQLiteDatabase>
```

| | |
|---|---|
| **Purpose** | Returns the singleton database connection |
| **Parameters** | None |
| **Returns** | `Promise<SQLite.SQLiteDatabase>` |
| **Called by** | Every other database function internally |
| **Side effects** | Creates `sanjeevni.db` file on first call (Android/iOS) |

---

#### `initDb()`

```typescript
export async function initDb(): Promise<void>
```

| | |
|---|---|
| **Purpose** | Creates all 4 tables, indexes, and sets schema version |
| **Parameters** | None |
| **Returns** | `Promise<void>` |
| **Called from** | `_layout.tsx` `useEffect` on app boot |
| **Idempotent** | ✅ Yes — safe to call multiple times |
| **Console output** | `"Database initialized successfully with v1 schema."` or `"Database schema is already up to date."` |

---

#### `pruneOldData()`

```typescript
export async function pruneOldData(): Promise<void>
```

| | |
|---|---|
| **Purpose** | Deletes raw readings older than 7 days to prevent phone storage bloat |
| **Parameters** | None |
| **Returns** | `Promise<void>` |
| **SQL** | `DELETE FROM readings WHERE timestamp < ?` (7 days ago in ISO format) |
| **Called from** | `index.tsx` `useEffect` on screen mount |
| **Console output** | `"Pruned readings older than 2026-09-04T..."` |

---

### 6.2 Sensor Readings (CRUD)

#### `insertReading(sensorType, value, source?)`

```typescript
export async function insertReading(
  sensorType: string,   // 'HR' | 'SpO2' | 'TEMP' | 'AQI'
  value: number,        // The numeric sensor value
  source?: string       // Default: 'garment'
): Promise<void>
```

| | |
|---|---|
| **Purpose** | Validates and inserts a single sensor reading |
| **Timestamp** | Auto-generated as `new Date().toISOString()` (UTC) |
| **synced** | Defaults to `0` (not yet synced to cloud) |
| **Validation** | HR must be 1–250, SpO2 must be 0–100 (see [Section 7](#7-data-validation--quality-guards)) |
| **On invalid data** | Logs warning and **silently returns** (does NOT throw) |

**Usage:**
```typescript
import { insertReading } from '../database';

await insertReading('HR', 72, 'garment');     // From ESP32 BLE
await insertReading('AQI', 140, 'api');        // From weather API
await insertReading('TEMP', 37.2);             // source defaults to 'garment'
```

---

#### `getLatestReading(sensorType)`

```typescript
export async function getLatestReading(
  sensorType: string    // 'HR' | 'SpO2' | 'TEMP' | 'AQI'
): Promise<any>         // Returns the row object or null
```

| | |
|---|---|
| **Purpose** | Gets the most recent reading for a given sensor |
| **SQL** | `SELECT * ... ORDER BY timestamp DESC LIMIT 1` |
| **Returns** | `{ id, timestamp, sensor_type, value, source, synced }` or `null` |
| **Used by** | Dashboard to display current vital signs |

**Usage:**
```typescript
import { getLatestReading } from '../database';

const latest = await getLatestReading('HR');
if (latest) {
  console.log(`Current HR: ${latest.value} bpm at ${latest.timestamp}`);
}
```

---

#### `getRecentReadings(sensorType, minutes)`

```typescript
export async function getRecentReadings(
  sensorType: string,   // 'HR' | 'SpO2' | 'TEMP' | 'AQI'
  minutes: number       // Look-back window in minutes
): Promise<any[]>       // Array of row objects
```

| | |
|---|---|
| **Purpose** | Fetches historical readings within the last N minutes |
| **SQL** | `SELECT * ... WHERE timestamp >= ? ORDER BY timestamp DESC` |
| **Returns** | Array of `{ id, timestamp, sensor_type, value, source, synced }` |
| **Used by** | AI engine for trend analysis, dashboard for trend graphs |

**Usage:**
```typescript
import { getRecentReadings } from '../database';

// Get last 10 minutes of SpO2 data for AI analysis
const recentSpO2 = await getRecentReadings('SpO2', 10);
console.log(`Got ${recentSpO2.length} readings`);
```

---

#### `getPendingReadings()`

```typescript
export async function getPendingReadings(): Promise<any[]>
```

| | |
|---|---|
| **Purpose** | Gets all readings that haven't been synced to the cloud yet |
| **SQL** | `SELECT * FROM readings WHERE synced = 0` |
| **Returns** | Array of unsynced reading row objects |
| **Used by** | `syncPendingReadings()` in `network.ts` |

---

#### `markSynced(ids)`

```typescript
export async function markSynced(
  ids: number[]         // Array of reading IDs to mark as synced
): Promise<void>
```

| | |
|---|---|
| **Purpose** | Marks specific readings as successfully uploaded to the cloud |
| **SQL** | `UPDATE readings SET synced = 1 WHERE id IN (...)` |
| **Guard** | Returns immediately if `ids` is empty (no query executed) |
| **Used by** | `syncPendingReadings()` in `network.ts` |

---

### 6.3 Alerts & Emergencies

#### `insertAlert(category, severity, message)`

```typescript
export async function insertAlert(
  category: string,     // e.g., 'Cardiac Risk', 'Heat Stress', 'Fall Detected'
  severity: string,     // MUST be: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'
  message: string       // Human-readable description
): Promise<void>
```

| | |
|---|---|
| **Purpose** | Records an AI-detected emergency event |
| **Timestamp** | Auto-generated as UTC ISO string |
| **DB Constraint** | SQLite will **reject** any severity not in the enum — the INSERT will throw |
| **acknowledged** | Defaults to `0` (active/unacknowledged) |

**Usage:**
```typescript
import { insertAlert } from '../database';

// AI detected dangerously low SpO2
await insertAlert('Cardiac Risk', 'HIGH', 'SpO2 dropped below 90% for 3 minutes');

// ❌ This will THROW — 'MEDIUM' is not a valid severity
await insertAlert('Heat Stress', 'MEDIUM', 'Temperature elevated');
```

> ⚠️ **Valid severity values are strictly enforced:** `'LOW'`, `'MODERATE'`, `'HIGH'`, `'CRITICAL'`. Any other string will cause a SQLite constraint violation error.

---

#### `getAlerts(limit?)`

```typescript
export async function getAlerts(
  limit?: number        // Default: 20
): Promise<any[]>
```

| | |
|---|---|
| **Purpose** | Fetches recent alerts for the Alert History screen |
| **SQL** | `SELECT * FROM alerts ORDER BY timestamp DESC LIMIT ?` |
| **Returns** | Array of `{ id, timestamp, category, severity, message, acknowledged }` |

**Usage:**
```typescript
import { getAlerts } from '../database';

const alerts = await getAlerts(50);  // Last 50 alerts
const activeAlerts = alerts.filter(a => a.acknowledged === 0);
```

---

#### `acknowledgeAlert(id)`

```typescript
export async function acknowledgeAlert(
  id: number            // The alert's row ID
): Promise<void>
```

| | |
|---|---|
| **Purpose** | Marks an alert as dismissed by the user |
| **SQL** | `UPDATE alerts SET acknowledged = 1 WHERE id = ?` |
| **Side effect** | Stops the SOS countdown for that alert |

**Usage:**
```typescript
import { acknowledgeAlert } from '../database';

// User taps "Dismiss" on alert #42
await acknowledgeAlert(42);
```

---

### 6.4 User Profile & Settings

#### `getUserProfile()`

```typescript
export async function getUserProfile(): Promise<any>
```

| | |
|---|---|
| **Purpose** | Fetches the single user profile row |
| **SQL** | `SELECT * FROM user_profile LIMIT 1` |
| **Returns** | `{ id: 1, baseline_values, vulnerability_flags, emergency_contact }` or `null` |
| **Used by** | SOS flow (to get emergency contact), Settings screen |

---

#### `upsertUserProfile(baselineValues, vulnerabilityFlags, emergencyContact)`

```typescript
export async function upsertUserProfile(
  baselineValues: string,       // JSON string of baseline values
  vulnerabilityFlags: string,   // JSON string of medical conditions
  emergencyContact: string      // Phone number for SOS SMS
): Promise<void>
```

| | |
|---|---|
| **Purpose** | Creates or updates the user profile (auto-detects which) |
| **Logic** | Calls `getUserProfile()` first — if exists → UPDATE, else → INSERT |
| **Guarantees** | Only 1 profile row can ever exist (enforced by `CHECK(id = 1)`) |

**Usage:**
```typescript
import { upsertUserProfile } from '../database';

await upsertUserProfile(
  JSON.stringify({ hr: 72, spo2: 98 }),           // baseline values
  JSON.stringify({ elderly: true, cardiac: false }), // vulnerability flags
  '+919876543210'                                     // emergency contact
);
```

---

### 6.5 AI Personalization (Rolling Baseline)

#### `updateRollingBaseline(metricType, movingAverage)`

```typescript
export async function updateRollingBaseline(
  metricType: string,   // 'HR' | 'SpO2' | etc.
  movingAverage: number  // New moving average value
): Promise<void>
```

| | |
|---|---|
| **Purpose** | Updates (or creates) the AI's personalized baseline for a metric |
| **SQL** | `INSERT ... ON CONFLICT(metric_type) DO UPDATE` (upsert) |
| **Timestamp** | Auto-generated as UTC ISO string |

**Usage:**
```typescript
import { updateRollingBaseline } from '../database';

// AI recalculated the user's baseline HR after 24 hours of data
await updateRollingBaseline('HR', 74.5);
```

---

#### `getRollingBaseline(metricType)`

```typescript
export async function getRollingBaseline(
  metricType: string    // 'HR' | 'SpO2' | etc.
): Promise<any>
```

| | |
|---|---|
| **Purpose** | Fetches the current personalized baseline for AI comparison |
| **SQL** | `SELECT * FROM rolling_baseline WHERE metric_type = ?` |
| **Returns** | `{ metric_type, moving_average, last_updated }` or `null` |

**Usage:**
```typescript
import { getRollingBaseline, getLatestReading } from '../database';

const baseline = await getRollingBaseline('HR');
const current = await getLatestReading('HR');

if (baseline && current) {
  const deviation = Math.abs(current.value - baseline.moving_average);
  if (deviation > 20) {
    console.log('ANOMALY: HR deviates significantly from personal baseline');
  }
}
```

---

## 7. Data Validation & Quality Guards

**Location:** [`src/database.ts`](file:///c:/Users/as/Desktop/Sanjeevni/src/database.ts) — Lines 112–121

`insertReading()` includes input validation to prevent garbage data from triggering false AI alerts:

| Sensor | Validation Rule | On Failure |
|---|---|---|
| `HR` | Must be `> 0` AND `≤ 250` | `console.warn` + silent return (no insert) |
| `SpO2` | Must be `≥ 0` AND `≤ 100` | `console.warn` + silent return (no insert) |
| `TEMP` | Must be `≥ -10` AND `≤ 60` | `console.warn` + silent return (no insert) |
| `AQI` | Must be `≥ 0` AND `≤ 1000` | `console.warn` + silent return (no insert) |
| `HUMIDITY` | Must be `≥ 0` AND `≤ 100` | `console.warn` + silent return (no insert) |
| `STEPS` | Must be `≥ 0` AND `≤ 100,000` | `console.warn` + silent return (no insert) |
| `HRV_SDNN` | Must be `≥ 0` AND `≤ 500` | `console.warn` + silent return (no insert) |
| `HRV_RMSSD` | Must be `≥ 0` AND `≤ 500` | `console.warn` + silent return (no insert) |

### Why Silent Return (Not Throw)?

Invalid sensor readings from hardware are common (e.g., sensor disconnected, finger removed from pulse-ox). Throwing an exception would crash the BLE data pipeline. Instead, the invalid reading is silently dropped and logged to console for debugging.

### Severity Enum Validation

The `alerts` table enforces severity values at the **database constraint level**:

```sql
severity TEXT CHECK(severity IN ('LOW', 'MODERATE', 'HIGH', 'CRITICAL')) NOT NULL
```

If you pass an invalid severity string to `insertAlert()`, SQLite will throw a constraint violation error. This is intentional — alerts are critical safety events and must have valid severity levels.

---

## 8. Networking & Offline Resilience

**File:** [`src/utils/network.ts`](file:///c:/Users/as/Desktop/Sanjeevni/src/utils/network.ts)

### 8.1 `isOnline()`

```typescript
export async function isOnline(): Promise<boolean>
```

Uses `@react-native-community/netinfo` to check both `isConnected` AND `isInternetReachable`. Returns `true` only when the device has full internet access.

---

### 8.2 `sendSOS(contact, message)`

```typescript
export async function sendSOS(
  contact: string,   // Phone number
  message: string    // Emergency message text
): Promise<void>
```

| Feature | Detail |
|---|---|
| **Mechanism** | Uses `expo-sms` — bypasses internet entirely via cellular network |
| **Cooldown** | 5-minute debounce prevents spamming (max 1 SMS per 5 min) |
| **Cooldown reset** | Call `resetSosCooldown()` when an alert is acknowledged |
| **Fallback** | If SMS unavailable, logs error (does not throw) |

---

### 8.3 `syncPendingReadings()`

```typescript
export async function syncPendingReadings(): Promise<void>
```

| Feature | Detail |
|---|---|
| **Trigger** | Automatically called via `NetInfo.addEventListener` when internet is restored |
| **Flow** | `getPendingReadings()` → upload to cloud API → `markSynced(ids)` |
| **Cloud API** | Currently simulated (placeholder for hospital sync endpoint) |
| **Error handling** | Catches and logs errors; will retry on next connectivity event |

---

### 8.4 `getEnvironmentalData(sensorReading)`

```typescript
export async function getEnvironmentalData(
  sensorReading: number  // Local reading from ESP32 MQ135 sensor
): Promise<{ aqi: number; source: string }>
```

| Scenario | Behavior |
|---|---|
| **Online + API succeeds** | Uses API data, saves with `source: 'api'` |
| **Online + API fails** | Falls back to local sensor, saves with `source: 'garment'` |
| **Offline** | Uses local sensor immediately, saves with `source: 'garment'` |

**The user never notices the switch.** The dashboard displays whichever value was available.

---

### 8.5 `resetSosCooldown()`

```typescript
export function resetSosCooldown(): void
```

Resets the SOS 5-minute cooldown timer. Call this when a user acknowledges an alert to allow a new SOS to be sent immediately if another critical event occurs.

---

### 8.6 Auto-Sync Listener

```typescript
// Runs automatically on module import — no setup needed
NetInfo.addEventListener(state => {
  if (state.isConnected && state.isInternetReachable) {
    syncPendingReadings();
  }
});
```

This listener fires every time the network state changes. When connectivity is restored after an outage, it automatically begins uploading all unsynced readings.

---

## 9. Integration Guide for Teammates

### 9.1 For the Hardware / Bluetooth Team

When you receive a Bluetooth packet from the ESP32 garment, simply call:

```typescript
import { insertReading } from '../database';

// Called inside your BLE onCharacteristicChanged handler:

// ECG Pipeline outputs
await insertReading('HR', 72, 'garment');           // Heart Rate (bpm)
await insertReading('HRV_SDNN', 45.2, 'garment');   // HRV SDNN (ms)
await insertReading('HRV_RMSSD', 38.7, 'garment');  // HRV RMSSD (ms)

// PPG Pipeline output
await insertReading('SpO2', 97, 'garment');          // Blood Oxygen (%)

// Motion Pipeline output (MPU6050)
await insertReading('STEPS', 3420, 'garment');       // Step count (cumulative)

// Environment Pipeline outputs (DHT22 + MQ135)
await insertReading('TEMP', 36.8, 'garment');        // Temperature (°C)
await insertReading('HUMIDITY', 62.5, 'garment');    // Relative Humidity (%)
await insertReading('AQI', 140, 'garment');          // Air Quality (ppm) — or 'api' if from API
```

**Things to know:**
- You do NOT need to generate timestamps — `insertReading` handles that automatically.
- You do NOT need to write any SQL — just call the function.
- Invalid values are **silently rejected** with a console warning — no crash:

| Sensor | Valid Range |
|---|---|
| `HR` | 1 – 250 bpm |
| `HRV_SDNN` | 0 – 500 ms |
| `HRV_RMSSD` | 0 – 500 ms |
| `SpO2` | 0 – 100 % |
| `STEPS` | 0 – 100,000 |
| `TEMP` | -10 – 60 °C |
| `HUMIDITY` | 0 – 100 % |
| `AQI` | 0 – 1000 ppm |

- The `source` parameter defaults to `'garment'` so you can omit it for hardware readings.

---

### 9.2 For the AI / Machine Learning Team

**Reading historical data for analysis:**

```typescript
import { getRecentReadings, getLatestReading, getRollingBaseline } from '../database';

// Get the last 10 minutes of heart rate data
const hrHistory = await getRecentReadings('HR', 10);

// Get the current SpO2 value
const currentSpO2 = await getLatestReading('SpO2');

// Get the user's personalized HR baseline
const hrBaseline = await getRollingBaseline('HR');
```

**Writing alerts when anomalies are detected:**

```typescript
import { insertAlert } from '../database';

// Your AI detected a dangerous pattern
await insertAlert(
  'Cardiac Risk',     // category
  'CRITICAL',         // severity — MUST be LOW/MODERATE/HIGH/CRITICAL
  'Heart rate dropped below 40 bpm for 2 consecutive minutes'
);
```

**Updating the rolling baseline after recalculation:**

```typescript
import { updateRollingBaseline } from '../database';

// After processing 24h of data, update the personalized baseline
const newAvgHR = calculateMovingAverage(hrHistory);
await updateRollingBaseline('HR', newAvgHR);
```

---

### 9.3 For the UI / Frontend Team

**Displaying current vitals on dashboard:**

```typescript
import { getLatestReading } from '../database';

const hr = await getLatestReading('HR');
const spo2 = await getLatestReading('SpO2');

// hr.value = 72, hr.timestamp = "2026-09-11T09:15:30.000Z"
// spo2.value = 98, spo2.timestamp = "2026-09-11T09:15:31.000Z"
```

**Displaying alert history:**

```typescript
import { getAlerts, acknowledgeAlert } from '../database';

const alerts = await getAlerts(20);  // Most recent 20

// When user taps "Dismiss":
await acknowledgeAlert(alerts[0].id);
```

**Managing user settings/profile:**

```typescript
import { getUserProfile, upsertUserProfile } from '../database';

// Read current profile
const profile = await getUserProfile();

// Save updated profile from settings form
await upsertUserProfile(
  JSON.stringify(baselineValues),
  JSON.stringify(vulnerabilityFlags),
  emergencyPhoneNumber
);
```

---

### 9.4 For the SOS / Emergency Response Team

**Triggering an offline SOS:**

```typescript
import { getUserProfile } from '../database';
import { sendSOS } from '../utils/network';

const profile = await getUserProfile();
if (profile?.emergency_contact) {
  await sendSOS(
    profile.emergency_contact,
    'EMERGENCY: Sanjeevni detected a critical cardiac event. Immediate assistance required.'
  );
}
```

**Resetting cooldown after alert dismissal:**

```typescript
import { acknowledgeAlert } from '../database';
import { resetSosCooldown } from '../utils/network';

await acknowledgeAlert(alertId);
resetSosCooldown();  // Allow new SOS if needed
```

---

## 10. App Lifecycle & Data Flow

### Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     APP LAUNCH                          │
│  _layout.tsx → initDb() → CREATE TABLES → setDbReady   │
└───────────────────────┬─────────────────────────────────┘
                        │
          ┌─────────────┴─────────────┐
          ▼                           ▼
┌──────────────────┐       ┌──────────────────────┐
│   BLE PIPELINE   │       │   DASHBOARD (UI)     │
│                  │       │                      │
│ ESP32 Garment    │       │ useEffect (2s poll)  │
│   ↓              │       │   ↓                  │
│ insertReading()  │       │ getLatestReading()   │
│   ↓              │       │   ↓                  │
│ [readings table] ├──────►│ Display vitals       │
└──────────────────┘       └──────────────────────┘
          │
          ▼
┌──────────────────┐       ┌──────────────────────┐
│   AI ENGINE      │       │   ALERT SYSTEM       │
│                  │       │                      │
│ getRecent        │       │ insertAlert()        │
│ Readings()       │       │   ↓                  │
│   ↓              │       │ [alerts table]       │
│ Analyze trends   │──────►│   ↓                  │
│   ↓              │       │ getAlerts()          │
│ updateRolling    │       │   ↓                  │
│ Baseline()       │       │ Alert History UI     │
└──────────────────┘       └───────┬──────────────┘
                                   │
                                   ▼
                          ┌──────────────────────┐
                          │   SOS SYSTEM         │
                          │                      │
                          │ getUserProfile()     │
                          │   ↓                  │
                          │ sendSOS() via SMS    │
                          │ (5-min cooldown)     │
                          └──────────────────────┘

┌──────────────────────────────────────────────────┐
│              BACKGROUND SYNC                     │
│                                                  │
│ NetInfo detects connectivity restored            │
│   ↓                                              │
│ getPendingReadings() → upload → markSynced()     │
└──────────────────────────────────────────────────┘
```

### Polling Interval

The dashboard in [`index.tsx`](file:///c:/Users/as/Desktop/Sanjeevni/src/app/index.tsx) polls `getLatestReading()` every **2 seconds** via `setInterval`:

```typescript
useEffect(() => {
  pruneOldData();
  loadData();
  const interval = setInterval(loadData, 2000);
  return () => clearInterval(interval);
}, []);
```

---

## 11. Web Platform Compatibility

**Location:** [`src/database.ts`](file:///c:/Users/as/Desktop/Sanjeevni/src/database.ts) — Lines 9–17

When running in a web browser (e.g., `expo start --web`), SQLite is not natively available. The `getDb()` function detects `Platform.OS === 'web'` and returns a mock object:

```typescript
return {
  execAsync: async () => {},         // No-op
  runAsync: async () => {},          // No-op
  getFirstAsync: async () => null,   // Always returns null
  getAllAsync: async () => []         // Always returns empty array
} as unknown as SQLite.SQLiteDatabase;
```

**What this means:**
- The UI renders without crashing on web.
- All database reads return empty/null data — vitals show `'--'`.
- All database writes are silently discarded.
- This is **intentional** — web is for rapid UI testing only, not production use.

---

## 12. Schema Migration Strategy

The database uses SQLite's `PRAGMA user_version` for versioning. Current version: **1**.

### How to Add a Future Migration (e.g., v2)

1. In `initDb()`, after the existing version check, add:

```typescript
if (currentVersion < 2) {
  await db.execAsync(`
    -- Add new columns or tables here
    ALTER TABLE readings ADD COLUMN confidence REAL DEFAULT 1.0;
    PRAGMA user_version = 2;
  `);
  console.log('Migrated to v2 schema.');
}
```

2. The `CREATE TABLE IF NOT EXISTS` block at the top should also be updated to include the new column for fresh installs.

### Rules for Migrations

| Rule | Reason |
|---|---|
| Always use `IF NOT EXISTS` for new tables | Idempotent — safe to re-run |
| Use `ALTER TABLE ADD COLUMN` for new columns | SQLite doesn't support `IF NOT EXISTS` for columns — wrap in try/catch |
| Never delete/rename columns | SQLite doesn't support `DROP COLUMN` prior to v3.35 |
| Increment `PRAGMA user_version` in each migration block | Ensures migrations only run once |
| Keep migrations in sequential `if (currentVersion < N)` blocks | They chain: v0→v1→v2 on fresh install |

---

## 13. Troubleshooting & Known Issues

### Error: `no such table: readings`

**Cause:** The database file exists but the tables were never created (e.g., a previous `initDb()` was interrupted, or the app was force-killed during first launch).

**Fix (already applied):** The `CREATE TABLE IF NOT EXISTS` statements now run unconditionally on every app launch, regardless of `user_version`. If you still see this error:

1. Clear app data: **Settings → Apps → Sanjeevni → Clear Data**
2. Or uninstall and reinstall the app
3. Or delete `sanjeevni.db` from the device

### Error: `Untyped function calls may not accept type arguments`

**Cause:** The `getDb()` function was returning `Promise<any>`, so TypeScript couldn't verify that `db.getFirstAsync<T>()` accepts type arguments.

**Fix (already applied):** Changed return type to `Promise<SQLite.SQLiteDatabase>` and typed `dbInstance` as `SQLite.SQLiteDatabase | null`.

### Error: `CHECK constraint failed` when inserting alert

**Cause:** You passed an invalid severity string. Only `'LOW'`, `'MODERATE'`, `'HIGH'`, `'CRITICAL'` are accepted.

**Fix:** Use one of the four valid severity values. These are case-sensitive.

### Dashboard shows `'--'` for all vitals

**Cause (Web):** Expected behavior on web platform — the mock DB returns null for all queries.

**Cause (Mobile):** No readings have been inserted yet. Use the "Simulate BLE" button on the dashboard to generate test data.

### SOS not sending

**Possible causes:**
- SMS not available on device/emulator (`SMS.isAvailableAsync()` returns false)
- 5-minute cooldown is active — wait or call `resetSosCooldown()`
- No emergency contact saved — call `upsertUserProfile()` first
