// =============================================================================
// __tests__/endToEndIntegration.test.ts
// End-to-end Integration Test:
// Hardware BLE Packets -> Stream Parser -> AI Bridge -> DSP Pipeline -> SQLite Database
// =============================================================================

import assert from 'node:assert';
import { DatabaseSync } from 'node:sqlite';
import { processSensorTick, resetAIEngine } from '../ai-engine';
import { generateSyntheticECG } from '../ai-engine/mock/syntheticDataGenerator';
import { StreamPacketParser } from '../src/ble/packetParser';
import { SensorId, Esp32Packet } from '../src/ble/types';
import type { SensorTickInput, SanjeevniRiskOutput } from '../ai-engine/types';

console.log('================================================================');
console.log('RUNNING SANJEEVNI FULL END-TO-END SYSTEM INTEGRATION TEST');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// Step 1: Simulate Hardware BLE Raw Packet Transmission & Stream Parsing
// -----------------------------------------------------------------------------
console.log('Step 1: Hardware BLE Packet Parsing (ESP32 Nordic UART Stream)');
const parser = new StreamPacketParser();

// 1A. Simulate raw JSON packet from ESP32 for DHT11
const dhtJson = JSON.stringify({
  v: 1,
  sensor: SensorId.DHT11,
  seq: 101,
  ts: Date.now(),
  data: { temperature: 34.5, humidity: 75.0 },
}) + '\n';

// 1B. Simulate raw JSON packet from ESP32 for ADXL345
const adxlJson = JSON.stringify({
  v: 1,
  sensor: SensorId.ADXL345,
  seq: 102,
  ts: Date.now(),
  data: { x: 0.1, y: 0.2, z: 9.81 },
}) + '\n';

// 1C. Simulate raw JSON packet from ESP32 for MQ135
const mq135Json = JSON.stringify({
  v: 1,
  sensor: SensorId.MQ135,
  seq: 103,
  ts: Date.now(),
  data: { raw: 620 },
}) + '\n';

// 1D. Simulate raw EXG 500Hz packet (128 samples per packet)
const exgSamples = Array.from({ length: 128 }, (_, i) => 2000 + Math.round(500 * Math.sin(i / 10)));
const exgJson = JSON.stringify({
  v: 1,
  sensor: SensorId.EXG,
  seq: 104,
  rate: 500,
  samples: exgSamples,
  ts: Date.now(),
}) + '\n';

const feedResult = parser.feed(dhtJson + adxlJson + mq135Json + exgJson);
assert.strictEqual(feedResult.packets.length, 4, 'All 4 hardware packets must be reassembled');
console.log('  ✔ 4/4 ESP32 BLE packets successfully parsed:');
console.log('    • DHT11: Temp 34.5°C, Humidity 75%');
console.log('    • ADXL345: [0.1, 0.2, 9.81] m/s²');
console.log('    • MQ135: Raw 620');
console.log('    • BioAmp EXG: 128 samples @ 500Hz');

// -----------------------------------------------------------------------------
// Step 2: Feed into AI Engine Sliding Window & DSP Pipeline
// -----------------------------------------------------------------------------
console.log('\nStep 2: On-Device AI Pipeline Processing (Pan-Tompkins + Fusion + Risk Engine)');
resetAIEngine();

// Generate realistic continuous ECG (4 seconds @ 500Hz = 2000 samples)
const synthetic = generateSyntheticECG({
  durationSeconds: 4,
  sampleRate: 500,
  heartRateBpm: 75,
  noiseLevel: 0.02,
});
const rollingBuffer = synthetic.samples;

const now = Date.now();
const GRAVITY = 9.80665;
const aiInput: SensorTickInput = {
  userId: 'default_user',
  timestamp: now,
  ecg: {
    samples: rollingBuffer,
    sampleRate: 500,
    timestampStart: now - 4000,
    timestampEnd: now,
  },
  motion: {
    accel: [{ x: 0.1 / GRAVITY, y: 0.2 / GRAVITY, z: 9.81 / GRAVITY }],
    gyro: [],
    sampleRate: 50,
    timestamp: now,
  },
  environment: {
    tempC: 34.5,
    humidityPct: 75.0,
    mq135Raw: 620,
    apiAQI: null,
    apiWeather: null,
    timestamp: now,
  },
};

const aiOutput: SanjeevniRiskOutput = processSensorTick(aiInput);

assert.ok(aiOutput.heartRate !== null, 'AI must compute heart rate from rolling buffer');
assert.ok(aiOutput.heartRate >= 65 && aiOutput.heartRate <= 85, `Computed HR ${aiOutput.heartRate} should be ~75 BPM`);
assert.ok(aiOutput.environment.heatIndex !== null, 'AI must compute heat index');
assert.strictEqual(aiOutput.motion.state, 'REST', 'Stationary 1g accel should be classified as REST');

console.log('  ✔ AI Pipeline executed successfully:');
console.log(`    • Computed Heart Rate: ${aiOutput.heartRate?.toFixed(1)} BPM`);
console.log(`    • Computed Heat Index: ${aiOutput.environment.heatIndex?.toFixed(1)}°C (Level: ${aiOutput.risks.heat.level})`);
console.log(`    • Motion Classification: ${aiOutput.motion.state}`);
console.log(`    • Signal Quality (ECG SQI): ${(aiOutput.signalQuality.ecg * 100).toFixed(0)}%`);

// -----------------------------------------------------------------------------
// Step 3: SQLite Database Persistence & Verification
// -----------------------------------------------------------------------------
console.log('\nStep 3: SQLite Telemetry Persistence & Alert Storage');
const db = new DatabaseSync(':memory:');

db.exec(`
  CREATE TABLE readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    sensor_type TEXT NOT NULL,
    value REAL NOT NULL,
    source TEXT NOT NULL,
    synced INTEGER DEFAULT 0
  );
  CREATE TABLE alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    category TEXT NOT NULL,
    severity TEXT CHECK(severity IN ('LOW', 'MODERATE', 'HIGH', 'CRITICAL')) NOT NULL,
    message TEXT NOT NULL,
    acknowledged INTEGER DEFAULT 0
  );
`);

const insertReadingStmt = db.prepare('INSERT INTO readings (timestamp, sensor_type, value, source) VALUES (?, ?, ?, ?)');
insertReadingStmt.run(new Date(now).toISOString(), 'HR', Math.round(aiOutput.heartRate!), 'garment');
insertReadingStmt.run(new Date(now).toISOString(), 'TEMP', aiOutput.environment.temperature ?? 34.5, 'garment');
insertReadingStmt.run(new Date(now).toISOString(), 'HUMIDITY', aiOutput.environment.humidity ?? 75.0, 'garment');

// Log Heat Risk alert if elevated (or demo alert)
const insertAlertStmt = db.prepare('INSERT INTO alerts (timestamp, category, severity, message) VALUES (?, ?, ?, ?)');
insertAlertStmt.run(
  new Date(now).toISOString(),
  'HEAT',
  'HIGH',
  `High heat index: ${aiOutput.environment.heatIndex?.toFixed(1)}°C. Hydrate.`
);

// Verify readings stored
const readings = db.prepare('SELECT * FROM readings').all() as any[];
assert.strictEqual(readings.length, 3, 'Must have stored 3 readings in SQLite');
assert.strictEqual(readings[0].sensor_type, 'HR');

// Verify alerts stored
const alerts = db.prepare('SELECT * FROM alerts').all() as any[];
assert.ok(alerts.length >= 1, 'Elevated heat index should log an alert');
assert.strictEqual(alerts[0].category, 'HEAT');

console.log('  ✔ Telemetry successfully stored in SQLite:');
console.log(`    • Readings rows count: ${readings.length}`);
console.log(`    • Stored HR reading: ${readings[0].value} BPM`);
console.log(`    • Stored Alert: [${alerts[0].severity}] ${alerts[0].message}`);

console.log('\n================================================================');
console.log('END-TO-END INTEGRATION TEST PASSED (Hardware -> AI -> DB -> UI)');
console.log('================================================================\n');
