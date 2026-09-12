// =============================================================================
// ai-engine/__tests__/aiPipeline.test.ts
// Comprehensive unit and integration test suite for Sanjeevni Phase-1 AI Engine
// =============================================================================

import assert from 'node:assert';
import { processSensorTick, resetAIEngine } from '../index';
import { generateSyntheticECG } from '../mock/syntheticDataGenerator';
import { ECGFilterChain } from '../ecg/filters';
import { detectRPeaks } from '../ecg/rPeakDetection';
import { validateRRIntervals } from '../ecg/rrValidation';
import { computeHeartRate } from '../ecg/heartRate';
import { computeHRV } from '../ecg/hrv';
import { calculateHeatIndexC } from '../environment/heatIndex';
import { analyzeActivity } from '../motion/activityState';
import { detectFall } from '../motion/fallDetection';

console.log('================================================================');
console.log('RUNNING SANJEEVNI AI ENGINE TEST SUITE');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// Test 1: Biquad Bandpass & 50Hz Notch Filters
// -----------------------------------------------------------------------------
console.log('Test 1: ECG Filter Chain (0.5-40Hz Bandpass + 50Hz Notch)');
{
  const filter = new ECGFilterChain();
  // 500 Hz sample rate, 2 seconds (1000 samples) of 50Hz hum + DC offset
  const sampleRate = 500;
  const samples = Array.from({ length: 1000 }, (_, i) => {
    const t = i / sampleRate;
    return 1000 + 500 * Math.sin(2 * Math.PI * 50 * t); // 1000 DC offset + 500 amplitude 50Hz hum
  });

  const filtered = filter.process({
    samples,
    sampleRate,
    timestampStart: 0,
    timestampEnd: 2000,
  });

  assert.strictEqual(filtered.filteredSamples.length, 1000);
  // Notch filter and high-pass filter should drastically attenuate 50Hz hum and remove DC offset
  const endSlice = filtered.filteredSamples.slice(800); // after filter startup transient settles
  const maxAmp = Math.max(...endSlice.map(Math.abs));
  assert.ok(maxAmp < 50, `Expected 50Hz hum and DC to be attenuated, got max ${maxAmp}`);
  console.log('  ✔ ECG Filter chain suppresses DC baseline wander and 50Hz mains hum\n');
}

// -----------------------------------------------------------------------------
// Test 2: Pan-Tompkins QRS R-Peak Detection & RR Validation
// -----------------------------------------------------------------------------
console.log('Test 2: Pan-Tompkins R-Peak Detection & RR Validation');
{
  const sampleRate = 500;
  const targetBpm = 75; // 800 ms per beat
  const ecg = generateSyntheticECG({
    durationSeconds: 5,
    sampleRate,
    heartRateBpm: targetBpm,
    noiseLevel: 0.01,
  });

  const filter = new ECGFilterChain();
  const filtered = filter.process(ecg);

  const peaks = detectRPeaks(filtered, { timestampStart: 0 });
  assert.ok(peaks.peakIndices.length >= 4, `Expected at least 4 peaks, got ${peaks.peakIndices.length}`);

  const rrResult = validateRRIntervals(peaks);
  assert.ok(rrResult.rrIntervalsMs.length >= 3, `Expected at least 3 validated RR intervals, got ${rrResult.rrIntervalsMs.length}`);

  for (const rr of rrResult.rrIntervalsMs) {
    // 75 BPM = 800 ms interval. Allow ±50 ms detector discretization tolerance for noisy synthetic signal
    assert.ok(Math.abs(rr - 800) < 50, `Expected RR ~800ms (±50ms), got ${rr}ms`);
  }
  console.log(`  ✔ Detected ${peaks.peakIndices.length} R-peaks; validated ${rrResult.rrIntervalsMs.length} intervals (~800ms)\n`);
}

// -----------------------------------------------------------------------------
// Test 3: Heart Rate (BPM) and HRV Metrics
// -----------------------------------------------------------------------------
console.log('Test 3: Heart Rate (BPM) & HRV (RMSSD, SDNN) Calculations');
{
  const intervals = [802, 798, 801, 800, 799, 803, 797]; // ~800ms
  const bpm = computeHeartRate(intervals);
  assert.ok(bpm !== null);
  assert.ok(Math.abs(bpm - 75) < 1.0, `Expected ~75 BPM, got ${bpm}`);

  const hrv = computeHRV(intervals);
  assert.ok(hrv !== null);
  assert.ok(typeof hrv.rmssd === 'number' && hrv.rmssd >= 0, 'RMSSD should be a non-negative number');
  assert.ok(typeof hrv.sdnn === 'number' && hrv.sdnn >= 0, 'SDNN should be a non-negative number');
  console.log(`  ✔ Computed BPM: ${bpm.toFixed(1)}, HRV RMSSD: ${hrv.rmssd?.toFixed(2)}ms, SDNN: ${hrv.sdnn?.toFixed(2)}ms\n`);
}

// -----------------------------------------------------------------------------
// Test 4: Motion Activity Classification & Fall Detection
// -----------------------------------------------------------------------------
console.log('Test 4: Motion Classifier & Fall Detection Engine');
{
  // 4A: Resting posture (steady 1g z-axis gravity)
  const restingAccel = Array.from({ length: 50 }, () => ({ x: 0.02, y: -0.05, z: 0.99 }));
  const restingActivity = analyzeActivity({
    accel: restingAccel,
    gyro: Array.from({ length: 50 }, () => ({ x: 0, y: 0, z: 0 })),
    sampleRate: 50,
    timestamp: Date.now(),
  });
  assert.strictEqual(restingActivity.state, 'REST');

  // 4B: Active movement (high variance across axes)
  const activeAccel = Array.from({ length: 50 }, (_, i) => ({
    x: Math.sin(i * 0.4) * 0.8,
    y: Math.cos(i * 0.4) * 0.9,
    z: 1.0 + Math.sin(i * 0.8) * 0.6,
  }));
  const activeActivity = analyzeActivity({
    accel: activeAccel,
    gyro: Array.from({ length: 50 }, () => ({ x: 0, y: 0, z: 0 })),
    sampleRate: 50,
    timestamp: Date.now(),
  });
  assert.ok(activeActivity.state === 'MODERATE_ACTIVITY' || activeActivity.state === 'VIGOROUS_ACTIVITY' || activeActivity.state === 'LIGHT_ACTIVITY');

  // 4C: Fall detection signature (Freefall <0.5g -> Strong Impact >3.0g -> Still on ground 1.0g)
  const fallSignature = [
    // 10 samples normal
    ...Array.from({ length: 10 }, () => ({ x: 0, y: 0, z: 1.0 })),
    // 10 samples freefall (< 0.5g)
    ...Array.from({ length: 10 }, () => ({ x: 0.05, y: 0.05, z: 0.1 })),
    // 5 samples strong impact spike (> 3.0g)
    ...Array.from({ length: 5 }, () => ({ x: 2.0, y: 1.5, z: 3.5 })),
    // 35 samples lying still on ground (1.0g gravity, dynamicG ~ 0)
    ...Array.from({ length: 35 }, () => ({ x: 0.01, y: 0.01, z: 0.99 })),
  ];
  const fallResult = detectFall({
    accel: fallSignature,
    gyro: Array.from({ length: 60 }, () => ({ x: 0, y: 0, z: 0 })),
    sampleRate: 50,
    timestamp: Date.now(),
  });
  assert.ok(fallResult.detected, 'Expected fall to be detected');
  console.log(`  ✔ Motion classified correctly: Rest -> REST, Motion -> ${activeActivity.state}`);
  console.log(`  ✔ Fall event detected with state: ${fallResult.state}, confidence: ${fallResult.confidence.toFixed(2)}\n`);
}

// -----------------------------------------------------------------------------
// Test 5: Environmental Heat Index
// -----------------------------------------------------------------------------
console.log('Test 5: Environmental Heat Index Calculation (NWS Rothfusz Equation)');
{
  // 32°C at 70% humidity should result in a heat index > 40°C
  const heatIndex = calculateHeatIndexC(32, 70);
  assert.ok(heatIndex !== null && heatIndex > 38 && heatIndex < 46, `Expected ~41°C, got ${heatIndex}`);

  // Normal temperature (22°C at 50% humidity) -> heat index ~22°C
  const normalHeat = calculateHeatIndexC(22, 50);
  assert.ok(normalHeat !== null && Math.abs(normalHeat - 22) < 0.5, `Expected ~22°C, got ${normalHeat}`);
  console.log(`  ✔ Heat Index 32°C @ 70% RH: ${heatIndex?.toFixed(1)}°C (Extreme Caution/Danger)`);
  console.log(`  ✔ Heat Index 22°C @ 50% RH: ${normalHeat?.toFixed(1)}°C (Normal)\n`);
}

// -----------------------------------------------------------------------------
// Test 6: Full Pipeline End-to-End Execution (processSensorTick)
// -----------------------------------------------------------------------------
console.log('Test 6: Full End-to-End Orchestration (processSensorTick)');
{
  resetAIEngine();
  const sampleRate = 500;
  const durationSeconds = 6;
  const ecg = generateSyntheticECG({
    durationSeconds,
    sampleRate,
    heartRateBpm: 72,
  });

  const now = Date.now();
  const input = {
    userId: 'patient_001',
    timestamp: now,
    ecg: {
      samples: ecg.samples,
      sampleRate,
      timestampStart: now,
      timestampEnd: now + durationSeconds * 1000,
    },
    motion: {
      accel: Array.from({ length: 50 }, () => ({ x: 0.01, y: 0.01, z: 1.0 })),
      gyro: Array.from({ length: 50 }, () => ({ x: 0, y: 0, z: 0 })),
      sampleRate: 50,
      timestamp: now,
    },
    environment: {
      tempC: 30.0,
      humidityPct: 65.0,
      mq135Raw: 1200,
      apiAQI: null,
      apiWeather: null,
      timestamp: now,
    },
  };

  const output = processSensorTick(input);

  assert.strictEqual(output.status, 'ready');
  assert.ok(output.heartRate !== null, 'Heart rate should be computed');
  assert.ok(Math.abs(output.heartRate - 72) < 2.0, `Expected ~72 BPM, got ${output.heartRate}`);
  assert.strictEqual(output.motion.state, 'REST');
  assert.ok(output.environment.heatIndex !== null && output.environment.heatIndex > 32);
  assert.ok(output.risks.cardiac.level === 'NORMAL');
  assert.strictEqual(output.risks.fall.detected, false);
  assert.strictEqual(output.sosRecommended, false);

  console.log('  ✔ processSensorTick returned valid SanjeevniRiskOutput:');
  console.log(`    • Heart Rate: ${output.heartRate?.toFixed(1)} BPM`);
  console.log(`    • Motion: ${output.motion.state} (level ${output.motion.level.toFixed(2)})`);
  console.log(`    • Heat Index: ${output.environment.heatIndex?.toFixed(1)}°C`);
  console.log(`    • Cardiac Risk: ${output.risks.cardiac.level} (score: ${output.risks.cardiac.score})`);
  console.log(`    • Heat Risk: ${output.risks.heat.level} (score: ${output.risks.heat.score.toFixed(2)})`);
  console.log(`    • SOS Recommended: ${output.sosRecommended}\n`);
}

// -----------------------------------------------------------------------------
// Test 7: High Risk & Fall Triggers SOS
// -----------------------------------------------------------------------------
console.log('Test 7: Emergency Alarm & SOS Trigger Logic');
{
  resetAIEngine();
  const now = Date.now();
  // Simulate severe fall in g units
  const fallSignature = [
    ...Array.from({ length: 10 }, () => ({ x: 0.01, y: 0.01, z: 0.99 })),
    ...Array.from({ length: 10 }, () => ({ x: 0.05, y: 0.05, z: 0.1 })), // freefall (<0.5g)
    ...Array.from({ length: 5 }, () => ({ x: 1.8, y: 1.5, z: 3.5 })), // severe impact spike (>3.0g)
    ...Array.from({ length: 35 }, () => ({ x: 0.01, y: 0.01, z: 0.99 })), // motionless on ground (~1.0g gravity)
  ];

  const input = {
    userId: 'patient_emergency',
    timestamp: now,
    motion: {
      accel: fallSignature,
      gyro: Array.from({ length: 50 }, () => ({ x: 0, y: 0, z: 0 })),
      sampleRate: 50,
      timestamp: now,
    },
    environment: {
      tempC: 45.0, // Dangerous ambient heat
      humidityPct: 80.0,
      mq135Raw: 3200,
      apiAQI: null,
      apiWeather: null,
      timestamp: now,
    },
  };

  // Window 1: candidate detected, evaluated by false-alarm gate
  processSensorTick(input);

  // Window 2: persistence satisfied (2 consecutive windows) -> SOS triggered
  const output = processSensorTick({
    ...input,
    timestamp: now + 500,
  });

  assert.strictEqual(output.risks.fall.detected, true, 'Fall should be flagged');
  assert.strictEqual(output.sosRecommended, true, 'SOS should be recommended on verified fall');
  console.log('  ✔ Fall detected and SOS Recommended triggered successfully!\n');
}

console.log('================================================================');
console.log('ALL AI ENGINE TESTS PASSED (7 / 7)');
console.log('================================================================');
