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

console.log('\n================================================================');
console.log('ALL DATABASE TESTS PASSED (6 / 6)');
console.log('================================================================\n');

