import assert from "node:assert";
import {
  evaluateAllSixParameters,
  clearAlertCooldowns,
  setAlertDatabaseHandler,
  setNotificationHandler,
  VitalsAlertEvaluationInput,
  GeneratedAlert,
} from "../src/services/alertEngine";

console.log("================================================================");
console.log("RUNNING 6-PARAMETER ALERT ENGINE & NOTIFICATION TEST SUITE");
console.log("================================================================\n");

// Tracking arrays for database and notification dispatches
const dbAlerts: Array<{ category: string; severity: string; message: string; userId?: string }> = [];
const notificationDispatches: Array<{
  category: string;
  severity: string;
  title: string;
  message: string;
}> = [];

setAlertDatabaseHandler(async (category, severity, message, userId) => {
  dbAlerts.push({ category, severity, message, userId });
});

setNotificationHandler((notif) => {
  notificationDispatches.push(notif);
});

// Helper to reset test state
function resetState() {
  dbAlerts.length = 0;
  notificationDispatches.length = 0;
  clearAlertCooldowns();
}

async function runAllTests() {
  // Test 1: Fall Detection (Critical Anomaly)
  console.log("Test 1: Fall / Sudden Impact Anomaly Trigger");
  resetState();
  const fallInput: VitalsAlertEvaluationInput = {
    heartRate: 75,
    temperature: 35.0,
    moisture: 45,
    aqi: 40,
    heatIndex: 28,
    steps: 120,
    fallDetected: true,
    userId: "test_worker_1",
  };
  const fallAlert = await evaluateAllSixParameters(fallInput);
  assert.ok(fallAlert != null, "Fall alert should have fired");
  assert.strictEqual(fallAlert?.category, "FALL");
  assert.strictEqual(fallAlert?.severity, "CRITICAL");
  assert.strictEqual(dbAlerts.length, 1, "Alert must be stored in database");
  assert.strictEqual(notificationDispatches.length, 1, "Notification must be dispatched");
  assert.strictEqual(notificationDispatches[0].title, "Wearable Fall Alert");
  console.log("  ✔ Wearable Fall Alert generated and notification fired successfully\n");

  // Test 2: Severe Thermal Strain / Heat Stroke (Temperature & Heat Index)
  console.log("Test 2: Heat Stroke & Severe Thermal Strain (Temp >= 38.2°C or Heat Index >= 42°C)");
  resetState();
  const heatInput: VitalsAlertEvaluationInput = {
    heartRate: 85,
    temperature: 38.6,
    moisture: 70,
    aqi: 45,
    heatIndex: 43,
    steps: 500,
    fallDetected: false,
    userId: "test_worker_1",
  };
  const heatAlert = await evaluateAllSixParameters(heatInput);
  assert.ok(heatAlert != null, "Heat stroke alert should have fired");
  assert.strictEqual(heatAlert?.category, "HEAT");
  assert.strictEqual(heatAlert?.severity, "CRITICAL");
  assert.strictEqual(notificationDispatches[0].title, "Heat Stroke Emergency");
  console.log("  ✔ Heat Stroke alert stored in DB and notification dispatched\n");

  // Test 3: Cardiac Distress / Tachycardia (Heart Rate >= 120 BPM)
  console.log("Test 3: Cardiac Tachycardia Trigger (Heart Rate >= 120 BPM)");
  resetState();
  const hrInput: VitalsAlertEvaluationInput = {
    heartRate: 132,
    temperature: 36.2,
    moisture: 50,
    aqi: 50,
    heatIndex: 29,
    steps: 800,
    userId: "test_worker_1",
  };
  const hrAlert = await evaluateAllSixParameters(hrInput);
  assert.ok(hrAlert != null, "Tachycardia alert should have fired");
  assert.strictEqual(hrAlert?.category, "CARDIAC");
  assert.strictEqual(hrAlert?.severity, "CRITICAL");
  assert.strictEqual(notificationDispatches[0].title, "Cardiac Strain Warning");
  console.log("  ✔ Cardiac Strain Warning generated with 132 BPM\n");

  // Test 4: Hazardous Air Quality (AQI >= 150)
  console.log("Test 4: Hazardous Air Quality Trigger (AQI >= 150)");
  resetState();
  const aqiInput: VitalsAlertEvaluationInput = {
    heartRate: 72,
    temperature: 33.0,
    moisture: 40,
    aqi: 175,
    heatIndex: 28,
    steps: 1200,
    userId: "test_worker_1",
  };
  const aqiAlert = await evaluateAllSixParameters(aqiInput);
  assert.ok(aqiAlert != null, "AQI alert should have fired");
  assert.strictEqual(aqiAlert?.category, "RESPIRATORY");
  assert.strictEqual(aqiAlert?.severity, "HIGH");
  assert.strictEqual(notificationDispatches[0].title, "Hazardous Air Quality Alert");
  console.log("  ✔ Hazardous Air Quality Alert generated with AQI 175\n");

  // Test 5: Heavy Sweat Dehydration Warning (Moisture >= 85%)
  console.log("Test 5: Heavy Sweat & Dehydration Trigger (Skin Moisture >= 85%)");
  resetState();
  const moistInput: VitalsAlertEvaluationInput = {
    heartRate: 88,
    temperature: 34.2,
    moisture: 91,
    aqi: 45,
    heatIndex: 32,
    steps: 1500,
    userId: "test_worker_1",
  };
  const moistAlert = await evaluateAllSixParameters(moistInput);
  assert.ok(moistAlert != null, "Moisture dehydration alert should have fired");
  assert.strictEqual(moistAlert?.category, "HEAT");
  assert.strictEqual(moistAlert?.severity, "MODERATE");
  assert.strictEqual(notificationDispatches[0].title, "Heavy Sweat Dehydration Warning");
  console.log("  ✔ Heavy Sweat Dehydration Warning generated with Moisture 91%\n");

  // Test 6: High Exertion under Heat (Steps >= 3000, Heat Index >= 34°C, HR >= 100)
  console.log("Test 6: High Exertion under Severe Heat Trigger (Steps + Heat Index + HR)");
  resetState();
  const exertionInput: VitalsAlertEvaluationInput = {
    heartRate: 104,
    temperature: 36.8,
    moisture: 65,
    aqi: 60,
    heatIndex: 35,
    steps: 4200,
    userId: "test_worker_1",
  };
  const exertionAlert = await evaluateAllSixParameters(exertionInput);
  assert.ok(exertionAlert != null, "Exertion in heat alert should have fired");
  assert.strictEqual(exertionAlert?.category, "HEAT");
  assert.strictEqual(exertionAlert?.severity, "HIGH");
  assert.strictEqual(notificationDispatches[0].title, "Exertion in Severe Heat");
  console.log("  ✔ Exertion in Severe Heat alert generated with 4200 steps\n");

  // Test 7: Safe Baseline Check-in (All 6 parameters optimal)
  console.log("Test 7: Safe Baseline Check-in (All 6 Vitals Optimal)");
  resetState();
  const safeInput: VitalsAlertEvaluationInput = {
    heartRate: 72,
    temperature: 35.5,
    moisture: 48,
    aqi: 35,
    heatIndex: 27,
    steps: 1100,
    userId: "test_worker_1",
  };
  const safeAlert = await evaluateAllSixParameters(safeInput);
  assert.ok(safeAlert != null, "Safe baseline alert should have fired");
  assert.strictEqual(safeAlert?.category, "VITALS");
  assert.strictEqual(safeAlert?.severity, "LOW");
  assert.strictEqual(notificationDispatches[0].title, "All 6 Vitals Optimal");
  console.log("  ✔ All 6 Vitals Optimal alert generated and dispatched\n");

  // Test 8: Cooldown Debounce (Prevents duplicate alerts from spamming)
  console.log("Test 8: Alert Cooldown Debounce Verification");
  resetState();
  const firstAlert = await evaluateAllSixParameters(hrInput);
  assert.ok(firstAlert != null, "First alert must succeed");
  // Immediate second call with same critical tachycardia input
  const duplicateAlert = await evaluateAllSixParameters(hrInput);
  assert.strictEqual(duplicateAlert, null, "Duplicate alert must be debounced by cooldown");
  console.log("  ✔ Duplicate alert correctly debounced within cooldown window\n");

  console.log("================================================================");
  console.log("ALL 6-PARAMETER ALERT ENGINE TESTS PASSED (8/8)!");
  console.log("================================================================\n");
}

runAllTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
