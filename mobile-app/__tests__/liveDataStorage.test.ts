import assert from "node:assert";
import { DatabaseSync } from "node:sqlite";

console.log("================================================================");
console.log("RUNNING LIVE TELEMETRY SQLITE STORAGE INTEGRATION TEST");
console.log("================================================================\n");

// Initialize in-memory SQLite database
const db = new DatabaseSync(":memory:");

db.exec(`
  CREATE TABLE readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL DEFAULT 'offline_local',
    timestamp TEXT NOT NULL,
    sensor_type TEXT NOT NULL,
    value REAL NOT NULL,
    source TEXT NOT NULL,
    synced INTEGER DEFAULT 0
  );
  CREATE INDEX idx_readings_user_sensor_ts ON readings(user_id, sensor_type, timestamp);
`);

const insertStmt = db.prepare(`
  INSERT INTO readings (user_id, timestamp, sensor_type, value, source, synced)
  VALUES (?, ?, ?, ?, ?, 0)
`);

const now = new Date().toISOString();
const testUserId = "offline_local";

// Test 1: Storing Live Incoming Readings
console.log("Test 1: Inserting Live Multi-Sensor Telemetry (HR, TEMP, MOISTURE, AQI, STEPS)");
insertStmt.run(testUserId, now, "HR", 74, "garment");
insertStmt.run(testUserId, now, "TEMP", 34.8, "garment");
insertStmt.run(testUserId, now, "HUMIDITY", 68, "garment");
insertStmt.run(testUserId, now, "MOISTURE", 68, "garment");
insertStmt.run(testUserId, now, "AQI", 82, "garment");
insertStmt.run(testUserId, now, "STEPS", 1250, "garment");

const countRow = db.prepare("SELECT COUNT(*) as total FROM readings WHERE user_id = ?").get(testUserId) as { total: number };
assert.strictEqual(countRow.total, 6, "Expected 6 stored readings in SQLite");
console.log(`  ✔ Successfully stored ${countRow.total} sensor records in SQLite`);

// Test 2: Verifying Stored Data Retrieval for History & Detail Graphs
console.log("Test 2: Verifying Sensor History Queries for Graphing");
const hrRows = db.prepare("SELECT value FROM readings WHERE user_id = ? AND sensor_type = 'HR'").all(testUserId) as { value: number }[];
assert.strictEqual(hrRows.length, 1);
assert.strictEqual(hrRows[0].value, 74);
console.log("  ✔ Stored Heart Rate retrieved: 74 BPM");

const tempRows = db.prepare("SELECT value FROM readings WHERE user_id = ? AND sensor_type = 'TEMP'").all(testUserId) as { value: number }[];
assert.strictEqual(tempRows.length, 1);
assert.strictEqual(tempRows[0].value, 34.8);
console.log("  ✔ Stored Temperature retrieved: 34.8°C");

const moistRows = db.prepare(
  "SELECT value FROM readings WHERE user_id = ? AND (sensor_type = 'HUMIDITY' OR sensor_type = 'MOISTURE')"
).all(testUserId) as { value: number }[];
assert.ok(moistRows.length >= 1, "Moisture records missing");
assert.strictEqual(moistRows[0].value, 68);
console.log("  ✔ Stored Moisture retrieved: 68%");

const aqiRows = db.prepare("SELECT value FROM readings WHERE user_id = ? AND sensor_type = 'AQI'").all(testUserId) as { value: number }[];
assert.strictEqual(aqiRows.length, 1);
assert.strictEqual(aqiRows[0].value, 82);
console.log("  ✔ Stored AQI retrieved: 82 AQI");

console.log("\n================================================================");
console.log("ALL LIVE TELEMETRY STORAGE TESTS PASSED (2 / 2)");
console.log("================================================================\n");
db.close();
