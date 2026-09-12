# Database Subsystem — On-Device SQLite Storage

This directory implements the local, zero-cloud SQLite persistence layer for the Sanjeevni mobile application using `expo-sqlite`. It stores real-time physiological vitals, security alerts, emergency contact configurations, and personal baseline statistics directly on the mobile device.

---

## Directory Layout

```text
databaseConnections/
├── database.ts                      # Core SQLite engine, Schema v4 migrations, CRUD & pruning
├── database.web.ts                  # Web-safe mock fallback for browser execution
├── __tests__/
│   └── databaseSchema.test.ts       # 12-test automated verification suite
└── README.md                        # This specification
```

---

## Database Architecture (Schema v4)

Database file name: `sanjeevni.db`

### Tables & Indices

#### 1. `readings`
Stores continuous, downsampled vital telemetry and sensor metrics streamed from the ESP32.

```sql
CREATE TABLE IF NOT EXISTS readings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL DEFAULT 'offline_local',
  timestamp TEXT NOT NULL,
  sensor_type TEXT NOT NULL,
  value REAL NOT NULL,
  source TEXT NOT NULL,
  synced INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_readings_sensor_timestamp 
  ON readings(sensor_type, timestamp);
CREATE INDEX IF NOT EXISTS idx_readings_user_sensor_ts 
  ON readings(user_id, sensor_type, timestamp);
```

- `sensor_type`: Standardized identifiers (`HEART_RATE`, `ECG_SQI`, `HRV_RMSSD`, `TEMPERATURE`, `HUMIDITY`, `HEAT_INDEX`, `AQI_RAW`, `SKIN_MOISTURE`, `MOTION_MAGNITUDE`, `STEP_COUNT`).
- `source`: Origin marker (`hardware_ble`, `ai_engine`, or `simulation`).
- `synced`: 0 = local only, 1 = synced (reserved for future optional manual exports).

#### 2. `alerts`
Stores critical physiological thresholds, fall events, and environmental hazard triggers.

```sql
CREATE TABLE IF NOT EXISTS alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL DEFAULT 'offline_local',
  timestamp TEXT NOT NULL,
  category TEXT NOT NULL,
  severity TEXT CHECK(severity IN ('LOW', 'MODERATE', 'HIGH', 'CRITICAL')) NOT NULL,
  message TEXT NOT NULL,
  acknowledged INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp);
CREATE INDEX IF NOT EXISTS idx_alerts_user_ts ON alerts(user_id, timestamp);
```

#### 3. `user_profile`
Persists the active user's demographic parameters, emergency contact details, and baseline vulnerability flags.

```sql
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
```

#### 4. `rolling_baseline`
Maintains running statistical aggregates (Welford's online mean and variance) for individual user baseline calibration.

```sql
CREATE TABLE IF NOT EXISTS rolling_baseline (
  user_id TEXT NOT NULL,
  metric TEXT NOT NULL,
  mean REAL NOT NULL,
  variance REAL NOT NULL,
  count INTEGER NOT NULL,
  last_updated TEXT NOT NULL,
  PRIMARY KEY (user_id, metric)
);
```

---

## Data Lifecycle & Retention

To prevent unbounded flash memory growth on wearable mobile hosts:

1. **7-Day Rolling Pruning (`pruneOldReadings`)**:
   Deletes raw high-frequency `readings` older than 7 days based on ISO-8601 timestamps:
   ```sql
   DELETE FROM readings WHERE timestamp < datetime('now', '-7 days');
   ```
2. **6-Month Rollup Downsampling (`rollupHistoricalData`)**:
   Rolls up historical data into hourly averages before purging long-term raw records.
3. **Multi-User Isolation (`normalizeUserId`)**:
   Every query filters strictly by `user_id`. When unauthenticated or in offline guest mode, defaults to `'offline_local'`.

---

## Testing & Verification

The database layer includes 12 automated unit tests covering table creation, bounded enum constraints, index efficiency, CRUD operations, multi-user partitioning, and retention pruning:

```bash
# Run from workspace root:
npm run test:db

# Or run directly inside mobile-app:
npx tsx databaseConnections/__tests__/databaseSchema.test.ts
```

