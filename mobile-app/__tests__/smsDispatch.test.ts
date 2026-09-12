import assert from "node:assert";
import { buildSOSTextMessage, SOSDispatchPayload } from "../src/services/smsService";

console.log("================================================================");
console.log("RUNNING SANJEEVNI EMERGENCY SOS & SMS DISPATCH TEST SUITE");
console.log("================================================================\n");

const testPayload: SOSDispatchPayload = {
  recipientPhone: "+91 98765 43210",
  recipientName: "Site Supervisor",
  userName: "Ramesh Kumar",
  userAge: 32,
  userGender: "Male",
  bloodGroup: "O+",
  medicalCondition: "None",
  latitude: 28.6139,
  longitude: 77.209,
  heartRate: 118,
  temperature: 38.2,
  moisture: 82,
  aqi: 145,
  triggerType: "manual",
};

// Test 1: SOS Message format and header
console.log("Test 1: SOS Message Formatting & Header Verification");
const msg = buildSOSTextMessage(testPayload);
assert.ok(msg.includes("🚨 SANJEEVNI EMERGENCY SOS 🚨"), "Header missing");
assert.ok(msg.includes("Ramesh Kumar (Blood: O+)"), "Worker identity missing");
assert.ok(msg.includes("Emergency Distress SOS Triggered"), "Trigger label missing");
console.log("  ✔ Emergency SOS header and worker identity verified");

// Test 2: Live Coordinates & Google Maps Link
console.log("Test 2: GPS Coordinates & Google Maps Link");
assert.ok(msg.includes("Lat: 28.6139° N, Lon: 77.2090° E"), "Coordinates missing");
assert.ok(
  msg.includes("https://maps.google.com/?q=28.613900,77.209000"),
  "Google Maps URL missing"
);
console.log("  ✔ Live GPS coordinates and Google Maps link formatted correctly");

// Test 3: Live Biometrics (Heart Rate, Temperature, Moisture, AQI)
console.log("Test 3: Live Biometric Telemetry Embed");
assert.ok(msg.includes("HR: 118 BPM"), "Heart rate missing");
assert.ok(msg.includes("Temp: 38.2°C"), "Temperature missing");
assert.ok(msg.includes("Moisture: 82%"), "Moisture missing");
assert.ok(msg.includes("AQI: 145"), "AQI missing");
console.log("  ✔ Biometric vitals embedded into SMS body");

// Test 4: Wearable Fall Detection Trigger Label
console.log("Test 4: Wearable Fall Detection Trigger");
const fallMsg = buildSOSTextMessage({
  ...testPayload,
  triggerType: "fall",
});
assert.ok(fallMsg.includes("Wearable Fall / Impact Detected"), "Fall trigger label missing");
console.log("  ✔ Fall anomaly trigger formatted distinctly");

console.log("\n================================================================");
console.log("ALL EMERGENCY SOS & SMS DISPATCH TESTS PASSED (4 / 4)");
console.log("================================================================\n");
