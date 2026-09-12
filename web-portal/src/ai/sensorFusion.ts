// =============================================================================
// src/ai/sensorFusion.ts
// Multi-Sensor Fusion Engine, False-Alarm Gate & Sanjeevni Health Score
// =============================================================================

import { DisasterAlert, LiveVitals, UserProfile } from "../types/telemetry";

export interface FusionResult {
  alerts: DisasterAlert[];
  healthScore: number | null;     // null when disconnected / awaiting data
  baselineDriftPct: number | null; // % change in resting HR
  fatigueIndex: number | null;    // 0 to 100
  sosTriggered: boolean;
}

export class SensorFusionEngine {
  /**
   * Run multi-sensor fusion and false-alarm gating (Only evaluates real data)
   */
  public evaluate(vitals: LiveVitals, profile: UserProfile): FusionResult {
    // If USB is not connected or no telemetry packets have arrived yet, return empty
    if (!vitals.isConnected || vitals.packetsReceived === 0) {
      return {
        alerts: [],
        healthScore: null,
        baselineDriftPct: null,
        fatigueIndex: null,
        sosTriggered: false,
      };
    }

    const alerts: DisasterAlert[] = [];
    const now = Date.now();
    let sosTriggered = false;

    // 1. GATED CARDIAC RISK ASSESSMENT
    if (vitals.heartRate !== null) {
      const isExerting = vitals.motion.activity === "ACTIVE" || vitals.motion.activity === "VIGOROUS";
      const baselineHr = profile.restingHrBaseline || 72;
      const hrElevated = vitals.heartRate > baselineHr + 35; // e.g. > 107 BPM at rest

      if (hrElevated && !isExerting && vitals.sqi.score >= 0.5) {
        alerts.push({
          id: "cardiac-tachycardia",
          category: "CARDIAC_ANOMALY",
          severity: vitals.heartRate > 140 ? "CRITICAL" : "HIGH",
          title: "Unexplained Tachycardia Spike",
          description: `Heart rate is elevated (${vitals.heartRate} BPM) despite bodily rest (${vitals.motion.activity}).`,
          actionableGuidance: "Sit or lie down immediately in a cool area. Drink cold water and breathe slowly.",
          timestamp: now,
          active: true,
        });

        if (vitals.heartRate > 155 && profile.profileType === "CHRONIC_CARDIAC") {
          sosTriggered = true;
        }
      }
    }

    // 2. HEAT STRESS & DEHYDRATION FUSION
    if (vitals.heatIndexC !== null) {
      const isOutdoorWorker = profile.profileType === "OUTDOOR_WORKER";
      const heatThresholdCaution = isOutdoorWorker ? 34 : 36;
      const heatThresholdDanger = isOutdoorWorker ? 40 : 42;

      if (vitals.heatIndexC >= heatThresholdDanger) {
        const hrHighUnderHeat = vitals.heartRate !== null && vitals.heartRate > 95;
        alerts.push({
          id: "heat-stroke-danger",
          category: "HEAT_WAVE",
          severity: hrHighUnderHeat ? "CRITICAL" : "HIGH",
          title: "Severe Heatwave & Heat Stroke Warning",
          description: `Extreme ambient heat index of ${vitals.heatIndexC}°C detected. Physiological thermal strain is critical.`,
          actionableGuidance: `Immediate action: Cease physical labor, seek shaded ventilation, and ingest 500mL of ORS electrolyte solution every 30 minutes.`,
          timestamp: now,
          active: true,
        });
      } else if (vitals.heatIndexC >= heatThresholdCaution) {
        alerts.push({
          id: "heat-caution",
          category: "HEAT_WAVE",
          severity: "CAUTION",
          title: "Heat Stress Advisory",
          description: `Current heat index is ${vitals.heatIndexC}°C. Dehydration risk is moderately elevated.`,
          actionableGuidance: "Maintain frequent sips of water. Avoid direct sun exposure between 12:00 PM and 4:00 PM.",
          timestamp: now,
          active: true,
        });
      }
    }

    // 3. AIR POLLUTION & RESPIRATORY RISK
    if (vitals.calculatedAqi !== null) {
      const isElderly = profile.profileType === "ELDERLY";
      const aqiThresholdHigh = isElderly ? 180 : 250;

      if (vitals.calculatedAqi >= 300) {
        alerts.push({
          id: "aqi-severe",
          category: "AIR_POLLUTION",
          severity: "CRITICAL",
          title: "Severe Air Pollution (AQI " + vitals.calculatedAqi + ")",
          description: `Hazardous airborne particulate and toxic gas levels detected by MQ135 collar sensor.`,
          actionableGuidance: "Equip an N95 respirator mask immediately. Stay indoors with closed ventilation if possible.",
          timestamp: now,
          active: true,
        });
      } else if (vitals.calculatedAqi >= aqiThresholdHigh) {
        alerts.push({
          id: "aqi-poor",
          category: "AIR_POLLUTION",
          severity: "HIGH",
          title: "Elevated Airborne Pollutants",
          description: `AQI reached ${vitals.calculatedAqi} (${vitals.aqiCategory || "High"}). Increased respiratory distress hazard.`,
          actionableGuidance: "Minimize vigorous aerobic exertion outdoors. Keep inhaler/medication handy.",
          timestamp: now,
          active: true,
        });
      }
    }

    // 4. FLOOD, CYCLONE & WATERBORNE DAMPNESS
    if (vitals.moisturePercent !== null && vitals.moisturePercent >= 80) {
      alerts.push({
        id: "flood-dampness-critical",
        category: "FLOOD_DAMPNESS",
        severity: "HIGH",
        title: "Garment Saturation Alert",
        description: `Continuous moisture saturation (${vitals.moisturePercent}%) detected on garment sensors.`,
        actionableGuidance: "Risk of contact dermatitis, fungal infection, or trench foot. Change into dry clothing at earliest opportunity.",
        timestamp: now,
        active: true,
      });
    }

    // 5. FALL DETECTION SOS TRIGGER
    if (vitals.motion.fallDetected || vitals.motion.fallStage === "CONFIRMED") {
      alerts.push({
        id: "fall-detected",
        category: "FALL_EVENT",
        severity: "CRITICAL",
        title: "Severe Fall Impact Detected",
        description: `Trunk accelerometer recorded freefall pattern followed by high-g impact and subsequent immobility.`,
        actionableGuidance: "Emergency SOS broadcast initiating. Tap CANCEL on device if you are uninjured.",
        timestamp: now,
        active: true,
      });
      sosTriggered = true;
    }

    // 6. HEALTH SCORE & BASELINE COMPUTATION
    let scoreDeductions = 0;
    if (vitals.heatIndexC !== null && vitals.heatIndexC > 38) scoreDeductions += 15;
    if (vitals.calculatedAqi !== null && vitals.calculatedAqi > 200) scoreDeductions += 15;
    if (vitals.moisturePercent !== null && vitals.moisturePercent > 70) scoreDeductions += 10;
    if (vitals.heartRate !== null && vitals.heartRate > 105) scoreDeductions += 20;
    if (vitals.hrvRmssd !== null && vitals.hrvRmssd < 20) scoreDeductions += 10;

    const healthScore = Math.max(20, Math.min(100, Math.round(100 - scoreDeductions)));

    // Baseline drift
    let baselineDriftPct: number | null = null;
    if (vitals.heartRate !== null) {
      const baselineHr = profile.restingHrBaseline || 72;
      baselineDriftPct = Math.round(((vitals.heartRate - baselineHr) / baselineHr) * 100);
    }

    // Fatigue index
    let fatigueIndex: number | null = null;
    if (vitals.hrvRmssd !== null) {
      fatigueIndex = Math.max(0, Math.min(100, Math.round(100 - (vitals.hrvRmssd / 60) * 100)));
    }

    return {
      alerts,
      healthScore,
      baselineDriftPct,
      fatigueIndex,
      sosTriggered,
    };
  }
}
