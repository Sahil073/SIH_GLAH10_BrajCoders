// =============================================================================
// databaseConnections/__tests__/databaseSchema.test.ts
// Verifies Sanjeevni SQLite schema, tables, indexes, constraints, and queries
// =============================================================================

import assert from 'node:assert';
import { DatabaseSync } from 'node:sqlite';

console.log('================================================================');
console.log('RUNNING SANJEEVNI DATABASE & SQLITE SCHEMA TEST SUITE');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// Test 1: Initialize Schema, Tables, and Indexes
// -----------------------------------------------------------------------------
console.log('Test 1: Schema, Tables, and Indexes Initialization');
const db = new DatabaseSync(':memory:');

db.exec(`
  CREATE TABLE IF NOT EXISTS readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    sensor_type TEXT NOT NULL,
    value REAL NOT NULL,
    source TEXT NOT NULL,
    synced INTEGER DEFAULT 0
  );

  CREATE INDEX IF NOT EXISTS idx_readings_sensor_timestamp ON readings(sensor_type, timestamp);

  CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    category TEXT NOT NULL,
    severity TEXT CHECK(severity IN ('LOW', 'MODERATE', 'HIGH', 'CRITICAL')) NOT NULL,
    message TEXT NOT NULL,
    acknowledged INTEGER DEFAULT 0
  );

  CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp);

  CREATE TABLE IF NOT EXISTS user_profile (
    id INTEGER PRIMARY KEY CHECK(id = 1),
    baseline_values TEXT,
    vulnerability_flags TEXT,
    emergency_contact TEXT
  );

  CREATE TABLE IF NOT EXISTS rolling_baseline (
    metric_type TEXT PRIMARY KEY,
    moving_average REAL NOT NULL,
    last_updated TEXT NOT NULL
  );
`);
console.log('  ✔ Tables (readings, alerts, user_profile, rolling_baseline) created successfully');

// -----------------------------------------------------------------------------
// Test 2: Readings Insertion and Retrieval
// -----------------------------------------------------------------------------
console.log('Test 2: Readings Insertion and Queries');
{
  const now = new Date().toISOString();
  const insertStmt = db.prepare(
    'INSERT INTO readings (timestamp, sensor_type, value, source, synced) VALUES (?, ?, ?, ?, 0)'
  );

  insertStmt.run(now, 'HR', 75.5, 'garment');
  insertStmt.run(now, 'TEMP', 36.6, 'garment');
  insertStmt.run(now, 'AQI', 45, 'garment');

  const rows = db.prepare('SELECT * FROM readings WHERE synced = 0').all() as any[];
  assert.strictEqual(rows.length, 3, 'Should have inserted 3 readings');
  assert.strictEqual(rows[0].sensor_type, 'HR');
  assert.strictEqual(rows[0].value, 75.5);

  // Test markSynced
  db.prepare('UPDATE readings SET synced = 1 WHERE id = ?').run(rows[0].id);
  const pending = db.prepare('SELECT * FROM readings WHERE synced = 0').all() as any[];
  assert.strictEqual(pending.length, 2, 'Should have 2 unsynced readings remaining');
  console.log('  ✔ Readings table operations & sync flags verified');
}

// -----------------------------------------------------------------------------
// Test 3: Alerts Table & Strict Severity Constraint
// -----------------------------------------------------------------------------
console.log('Test 3: Alerts Table & Severity Enum Constraints');
{
  const alertStmt = db.prepare(
    'INSERT INTO alerts (timestamp, category, severity, message) VALUES (?, ?, ?, ?)'
  );

  // Valid alerts
  alertStmt.run(new Date().toISOString(), 'CARDIAC', 'CRITICAL', 'Tachycardia detected: HR 145 BPM');
  alertStmt.run(new Date().toISOString(), 'HEAT', 'MODERATE', 'Heat index reached Caution: 38°C');
  alertStmt.run(new Date().toISOString(), 'FALL', 'CRITICAL', 'Fall impact detected at worker location');

  const alerts = db.prepare('SELECT * FROM alerts ORDER BY timestamp DESC').all() as any[];
  assert.strictEqual(alerts.length, 3);
  assert.strictEqual(alerts[0].category, 'FALL');

  // Verify CHECK constraint on severity
  assert.throws(() => {
    alertStmt.run(new Date().toISOString(), 'SYSTEM', 'INVALID_SEVERITY', 'Should fail check');
  }, /CHECK constraint failed/, 'Invalid severity must throw CHECK constraint error');

  // Acknowledge alert
  db.prepare('UPDATE alerts SET acknowledged = 1 WHERE id = ?').run(alerts[0].id);
  const acked = db.prepare('SELECT acknowledged FROM alerts WHERE id = ?').get(alerts[0].id) as any;
  assert.strictEqual(acked.acknowledged, 1);
  console.log('  ✔ Alerts table severity constraints and acknowledge flow verified');
}

// -----------------------------------------------------------------------------
// Test 4: Single-User Profile Enforcement (id = 1)
// -----------------------------------------------------------------------------
console.log('Test 4: Single-User Profile Constraint');
{
  db.prepare(
    'INSERT INTO user_profile (id, baseline_values, vulnerability_flags, emergency_contact) VALUES (1, ?, ?, ?)'
  ).run('{"restingHR": 72}', '["asthma"]', '+91-9876543210');

  const profile = db.prepare('SELECT * FROM user_profile LIMIT 1').get() as any;
  assert.strictEqual(profile.emergency_contact, '+91-9876543210');

  // Attempting to insert a second user row with id = 2 must fail CHECK(id = 1)
  assert.throws(() => {
    db.prepare(
      'INSERT INTO user_profile (id, baseline_values, vulnerability_flags, emergency_contact) VALUES (2, ?, ?, ?)'
    ).run('{}', '[]', '+1234567890');
  }, /CHECK constraint failed/, 'Multiple user profiles must be rejected by CHECK(id = 1)');
  console.log('  ✔ Single-profile constraint CHECK(id = 1) verified');
}

// -----------------------------------------------------------------------------
// Test 5: Rolling Baseline Upsert (ON CONFLICT DO UPDATE)
// -----------------------------------------------------------------------------
console.log('Test 5: Rolling Baseline Upsert');
{
  const upsertStmt = db.prepare(`
    INSERT INTO rolling_baseline (metric_type, moving_average, last_updated) 
    VALUES (?, ?, ?) 
    ON CONFLICT(metric_type) 
    DO UPDATE SET moving_average=excluded.moving_average, last_updated=excluded.last_updated
  `);

  upsertStmt.run('HR', 72.0, new Date().toISOString());
  let baseline = db.prepare('SELECT * FROM rolling_baseline WHERE metric_type = ?').get('HR') as any;
  assert.strictEqual(baseline.moving_average, 72.0);

  // Update
  upsertStmt.run('HR', 74.5, new Date().toISOString());
  baseline = db.prepare('SELECT * FROM rolling_baseline WHERE metric_type = ?').get('HR') as any;
  assert.strictEqual(baseline.moving_average, 74.5);
  console.log('  ✔ Rolling baseline ON CONFLICT DO UPDATE verified');
}

// -----------------------------------------------------------------------------
// Test 6: 7-Day Data Pruning
// -----------------------------------------------------------------------------
console.log('Test 6: 7-Day Data Pruning');
{
  const insertStmt = db.prepare(
    'INSERT INTO readings (timestamp, sensor_type, value, source) VALUES (?, ?, ?, ?)'
  );

  const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

  insertStmt.run(tenDaysAgo, 'TEMP', 37.0, 'garment');
  insertStmt.run(twoDaysAgo, 'TEMP', 36.8, 'garment');

  const sevenDaysCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  db.prepare('DELETE FROM readings WHERE timestamp < ?').run(sevenDaysCutoff);

  const remaining = db.prepare('SELECT * FROM readings WHERE sensor_type = ?').all('TEMP') as any[];
  // Original 1 reading from Test 2 + 1 reading from twoDaysAgo = 2 readings
  assert.strictEqual(remaining.length, 2);
  console.log('  ✔ Pruning correctly deleted readings older than 7 days');
}

// -----------------------------------------------------------------------------
// Test 7: Sensor Statistics & Averages (AVG, MIN, MAX, COUNT)
// -----------------------------------------------------------------------------
console.log('Test 7: Sensor Statistics and Aggregate Averages');
{
  const insertStmt = db.prepare(
    'INSERT INTO readings (timestamp, sensor_type, value, source) VALUES (?, ?, ?, ?)'
  );
  const now = new Date().toISOString();
  insertStmt.run(now, 'HR', 80.0, 'garment');
  insertStmt.run(now, 'HR', 90.0, 'garment');
  insertStmt.run(now, 'HR', 70.0, 'garment');

  const stats = db.prepare(`
    SELECT 
      AVG(value) as avgValue,
      MIN(value) as minValue,
      MAX(value) as maxValue,
      COUNT(*) as count
    FROM readings
    WHERE sensor_type = ?
  `).get('HR') as any;

  assert.ok(stats.count >= 3, 'Must have at least 3 HR readings');
  assert.strictEqual(stats.minValue, 70.0, 'Min value must match');
  assert.strictEqual(stats.maxValue, 90.0, 'Max value must match');
  console.log(`  ✔ Sensor aggregate statistics verified: count=${stats.count}, avg=${stats.avgValue?.toFixed(1)}`);
}

// -----------------------------------------------------------------------------
// Test 8: Sensor History with Timestamp Ordering & Limit
// -----------------------------------------------------------------------------
console.log('Test 8: Sensor History with Timestamp Ordering and Limit');
{
  const history = db.prepare(`
    SELECT id, timestamp, value 
    FROM readings 
    WHERE sensor_type = ? 
    ORDER BY timestamp DESC, id DESC 
    LIMIT 2
  `).all('HR') as any[];

  assert.strictEqual(history.length, 2, 'Should limit history to 2 rows');
  assert.ok(history[0].value > 0, 'Value should be positive');
  console.log('  ✔ Sensor history query with LIMIT verified');
}

// -----------------------------------------------------------------------------
// Test 9: Alert Deletion and Bulk Clear CRUD
// -----------------------------------------------------------------------------
console.log('Test 9: Alert Deletion and Bulk Clear CRUD');
{
  const alertsBefore = db.prepare('SELECT COUNT(*) as count FROM alerts').get() as any;
  assert.ok(alertsBefore.count > 0, 'Alerts should exist');

  // Single alert delete
  const firstAlert = db.prepare('SELECT id FROM alerts LIMIT 1').get() as any;
  db.prepare('DELETE FROM alerts WHERE id = ?').run(firstAlert.id);
  const checkDeleted = db.prepare('SELECT * FROM alerts WHERE id = ?').get(firstAlert.id);
  assert.strictEqual(checkDeleted, undefined, 'Deleted alert should not be found');

  // Clear all alerts
  db.prepare('DELETE FROM alerts').run();
  const alertsAfter = db.prepare('SELECT COUNT(*) as count FROM alerts').get() as any;
  assert.strictEqual(alertsAfter.count, 0, 'All alerts should be cleared');
  console.log('  ✔ Alert delete and clear operations verified');
}

// -----------------------------------------------------------------------------
// Test 10: Rich User Profile CRUD & Local Session State
// -----------------------------------------------------------------------------
console.log('Test 10: Rich User Profile Schema and Local Session Persistence');
{
  // Drop and recreate user_profile with full schema for isolated test
  db.exec(`
    DROP TABLE IF EXISTS user_profile;
    CREATE TABLE user_profile (
      id INTEGER PRIMARY KEY CHECK(id = 1),
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

  // Insert complete profile
  db.prepare(`
    INSERT INTO user_profile (
      id, name, email, pin, age, gender, height_cm, weight_kg, blood_group,
      medical_condition, emergency_name, emergency_phone, is_logged_in
    ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `).run(
    'Shubham Jain',
    'shubham@sanjeevni.health',
    '9988',
    24,
    'Male',
    175,
    70,
    'B+',
    'Asthma',
    'Supervisor Rajesh',
    '+91 99999 88888'
  );

  let profile = db.prepare('SELECT * FROM user_profile WHERE id = 1').get() as any;
  assert.strictEqual(profile.name, 'Shubham Jain');
  assert.strictEqual(profile.email, 'shubham@sanjeevni.health');
  assert.strictEqual(profile.pin, '9988');
  assert.strictEqual(profile.age, 24);
  assert.strictEqual(profile.blood_group, 'B+');
  assert.strictEqual(profile.is_logged_in, 1);

  // Update profile
  db.prepare('UPDATE user_profile SET age = 25, weight_kg = 72 WHERE id = 1').run();
  profile = db.prepare('SELECT age, weight_kg FROM user_profile WHERE id = 1').get() as any;
  assert.strictEqual(profile.age, 25);
  assert.strictEqual(profile.weight_kg, 72);

  // Logout (reset session flag)
  db.prepare('UPDATE user_profile SET is_logged_in = 0 WHERE id = 1').run();
  profile = db.prepare('SELECT is_logged_in FROM user_profile WHERE id = 1').get() as any;
  assert.strictEqual(profile.is_logged_in, 0);
  console.log('  ✔ Rich User Profile CRUD and offline session persistence verified');
}

// -----------------------------------------------------------------------------
// Test 11: Multi-User Data Isolation (Schema v4 Migration)
// -----------------------------------------------------------------------------
console.log('Test 11: Multi-User Data Isolation (Schema v4 Partitioning)');
{
  // Upgrade schema to v4 multi-user partitioning
  db.exec(`
    -- Readings with user_id
    DROP TABLE IF EXISTS readings_v4;
    CREATE TABLE readings_v4 (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL DEFAULT 'offline_local',
      timestamp TEXT NOT NULL,
      sensor_type TEXT NOT NULL,
      value REAL NOT NULL,
      source TEXT NOT NULL,
      synced INTEGER DEFAULT 0
    );
    CREATE INDEX idx_readings_v4_user_sensor_ts ON readings_v4(user_id, sensor_type, timestamp);

    -- Alerts with user_id
    DROP TABLE IF EXISTS alerts_v4;
    CREATE TABLE alerts_v4 (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL DEFAULT 'offline_local',
      timestamp TEXT NOT NULL,
      category TEXT NOT NULL,
      severity TEXT CHECK(severity IN ('LOW', 'MODERATE', 'HIGH', 'CRITICAL')) NOT NULL,
      message TEXT NOT NULL,
      acknowledged INTEGER DEFAULT 0
    );
    CREATE INDEX idx_alerts_v4_user_ts ON alerts_v4(user_id, timestamp);

    -- Multi-user profiles keyed by user_id
    DROP TABLE IF EXISTS user_profile_v4;
    CREATE TABLE user_profile_v4 (
      user_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      pin TEXT,
      age INTEGER,
      gender TEXT,
      height_cm REAL,
      weight_kg REAL,
      blood_group TEXT,
      medical_condition TEXT,
      emergency_name TEXT,
      emergency_phone TEXT,
      is_logged_in INTEGER DEFAULT 1
    );

    -- Multi-user rolling baseline with composite primary key
    DROP TABLE IF EXISTS rolling_baseline_v4;
    CREATE TABLE rolling_baseline_v4 (
      user_id TEXT NOT NULL DEFAULT 'offline_local',
      metric_type TEXT NOT NULL,
      moving_average REAL NOT NULL,
      last_updated TEXT NOT NULL,
      PRIMARY KEY (user_id, metric_type)
    );
  `);

  const now = new Date().toISOString();

  // 1. Insert readings for shubham1, shubham2, and offline_local
  const insertReading = db.prepare(
    'INSERT INTO readings_v4 (user_id, timestamp, sensor_type, value, source) VALUES (?, ?, ?, ?, ?)'
  );
  insertReading.run('shubham1@gmail.com', now, 'HR', 72.0, 'wearable');
  insertReading.run('shubham1@gmail.com', now, 'SPO2', 98.0, 'wearable');
  insertReading.run('shubham2@gmail.com', now, 'HR', 110.0, 'wearable');
  insertReading.run('shubham2@gmail.com', now, 'SPO2', 92.0, 'wearable');
  insertReading.run('offline_local', now, 'HR', 65.0, 'phone_offline');
  insertReading.run('offline_local', now, 'SPO2', 99.0, 'phone_offline');

  // Verify readings partition
  const u1Readings = db.prepare('SELECT * FROM readings_v4 WHERE user_id = ?').all('shubham1@gmail.com') as any[];
  assert.strictEqual(u1Readings.length, 2);
  assert.strictEqual(u1Readings.find((r: any) => r.sensor_type === 'HR').value, 72.0);

  const u2Readings = db.prepare('SELECT * FROM readings_v4 WHERE user_id = ?').all('shubham2@gmail.com') as any[];
  assert.strictEqual(u2Readings.length, 2);
  assert.strictEqual(u2Readings.find((r: any) => r.sensor_type === 'HR').value, 110.0);

  const offReadings = db.prepare('SELECT * FROM readings_v4 WHERE user_id = ?').all('offline_local') as any[];
  assert.strictEqual(offReadings.length, 2);
  assert.strictEqual(offReadings.find((r: any) => r.sensor_type === 'HR').value, 65.0);

  // 2. Insert alerts for each user
  const insertAlert = db.prepare(
    'INSERT INTO alerts_v4 (user_id, timestamp, category, severity, message) VALUES (?, ?, ?, ?, ?)'
  );
  insertAlert.run('shubham1@gmail.com', now, 'CARDIAC', 'MODERATE', 'Slight tachycardia for Shubham1');
  insertAlert.run('shubham2@gmail.com', now, 'HEAT', 'CRITICAL', 'Heat stress danger for Shubham2');
  insertAlert.run('offline_local', now, 'FALL', 'LOW', 'Minor stumble offline');

  const u1Alerts = db.prepare('SELECT * FROM alerts_v4 WHERE user_id = ?').all('shubham1@gmail.com') as any[];
  assert.strictEqual(u1Alerts.length, 1);
  assert.strictEqual(u1Alerts[0].category, 'CARDIAC');

  const u2Alerts = db.prepare('SELECT * FROM alerts_v4 WHERE user_id = ?').all('shubham2@gmail.com') as any[];
  assert.strictEqual(u2Alerts.length, 1);
  assert.strictEqual(u2Alerts[0].category, 'HEAT');

  const offAlerts = db.prepare('SELECT * FROM alerts_v4 WHERE user_id = ?').all('offline_local') as any[];
  assert.strictEqual(offAlerts.length, 1);
  assert.strictEqual(offAlerts[0].category, 'FALL');

  // 3. User Profiles isolated by user_id
  const insertProfile = db.prepare(
    'INSERT INTO user_profile_v4 (user_id, name, email, age) VALUES (?, ?, ?, ?)'
  );
  insertProfile.run('shubham1@gmail.com', 'Shubham One', 'shubham1@gmail.com', 24);
  insertProfile.run('shubham2@gmail.com', 'Shubham Two', 'shubham2@gmail.com', 29);
  insertProfile.run('offline_local', 'Offline Phone User', 'offline_local', 35);

  const p1 = db.prepare('SELECT * FROM user_profile_v4 WHERE user_id = ?').get('shubham1@gmail.com') as any;
  assert.strictEqual(p1.name, 'Shubham One');
  assert.strictEqual(p1.age, 24);

  const p2 = db.prepare('SELECT * FROM user_profile_v4 WHERE user_id = ?').get('shubham2@gmail.com') as any;
  assert.strictEqual(p2.name, 'Shubham Two');
  assert.strictEqual(p2.age, 29);

  // 4. Multi-user Rolling Baseline with composite PK (user_id, metric_type)
  const insertBaseline = db.prepare(
    'INSERT INTO rolling_baseline_v4 (user_id, metric_type, moving_average, last_updated) VALUES (?, ?, ?, ?)'
  );
  insertBaseline.run('shubham1@gmail.com', 'HR', 71.5, now);
  insertBaseline.run('shubham2@gmail.com', 'HR', 108.2, now);
  insertBaseline.run('offline_local', 'HR', 64.8, now);

  const b1 = db.prepare('SELECT * FROM rolling_baseline_v4 WHERE user_id = ? AND metric_type = ?').get('shubham1@gmail.com', 'HR') as any;
  assert.strictEqual(b1.moving_average, 71.5);

  const b2 = db.prepare('SELECT * FROM rolling_baseline_v4 WHERE user_id = ? AND metric_type = ?').get('shubham2@gmail.com', 'HR') as any;
  assert.strictEqual(b2.moving_average, 108.2);

  // 5. Verify isolated delete: clearing user 1's alerts leaves user 2 and offline intact
  db.prepare('DELETE FROM alerts_v4 WHERE user_id = ?').run('shubham1@gmail.com');
  const u1AlertsAfter = db.prepare('SELECT * FROM alerts_v4 WHERE user_id = ?').all('shubham1@gmail.com') as any[];
  assert.strictEqual(u1AlertsAfter.length, 0);

  const u2AlertsAfter = db.prepare('SELECT * FROM alerts_v4 WHERE user_id = ?').all('shubham2@gmail.com') as any[];
  assert.strictEqual(u2AlertsAfter.length, 1);

  const offAlertsAfter = db.prepare('SELECT * FROM alerts_v4 WHERE user_id = ?').all('offline_local') as any[];
  assert.strictEqual(offAlertsAfter.length, 1);

  console.log('  ✔ Complete Multi-User isolation (readings, alerts, profiles, baselines) verified');
}

console.log('\n================================================================');
console.log('ALL DATABASE TESTS PASSED (11 / 11)');
console.log('================================================================\n');

