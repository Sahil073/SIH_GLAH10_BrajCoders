// =============================================================================
// src/ai/environmentProcessor.ts
// Rothfusz Heat Index Regression, MQ135 AQI & Flood Dampness Algorithms
// =============================================================================

export interface EnvironmentAnalysisResult {
  heatIndexC: number;
  heatRisk: "NORMAL" | "CAUTION" | "HIGH" | "CRITICAL";
  calculatedAqi: number;
  aqiCategory: "Good" | "Moderate" | "Poor" | "Very Poor" | "Severe";
  aqiRisk: "NORMAL" | "CAUTION" | "HIGH" | "CRITICAL";
  moisturePercent: number;
  dampnessRisk: "NORMAL" | "CAUTION" | "HIGH" | "CRITICAL";
}

export class EnvironmentProcessor {
  /**
   * NOAA / NWS Rothfusz polynomial regression for Heat Index in °C
   */
  public calculateHeatIndex(tempC: number, humidityPct: number): number {
    // Standard formula uses Fahrenheit
    const T = (tempC * 9) / 5 + 32;
    const R = Math.max(0, Math.min(100, humidityPct));

    // Simple formula for mild temperatures
    let hiF = 0.5 * (T + 61.0 + (T - 68.0) * 1.2 + R * 0.094);

    if (hiF >= 80) {
      // Full Rothfusz regression
      hiF =
        -42.379 +
        2.04901523 * T +
        10.14333127 * R -
        0.22475541 * T * R -
        0.00683783 * T * T -
        0.05481717 * R * R +
        0.00122874 * T * T * R +
        0.00085282 * T * R * R -
        0.00000199 * T * T * R * R;

      // Adjustments for extreme low/high humidity
      if (R < 13 && T >= 80 && T <= 112) {
        const adj = ((13 - R) / 4) * Math.sqrt((17 - Math.abs(T - 95.0)) / 17);
        hiF -= adj;
      } else if (R > 85 && T >= 80 && T <= 87) {
        const adj = ((R - 85) / 10) * ((87 - T) / 5);
        hiF += adj;
      }
    }

    // Convert back to Celsius
    const hiC = ((hiF - 32) * 5) / 9;
    return Math.round(hiC * 10) / 10;
  }

  /**
   * Calibrate raw MQ135 ADC (0-4095) into estimated AQI (0-500 scale)
   * Baseline clean air ~600-800 ADC, smog/pollution ~2200-3800 ADC
   */
  public calculateAqi(rawMq135: number): {
    aqi: number;
    category: "Good" | "Moderate" | "Poor" | "Very Poor" | "Severe";
  } {
    // Normalization curve
    const clampedRaw = Math.max(400, Math.min(3900, rawMq135));
    // Linear map: 600 -> 35 (Good), 1600 -> 140 (Moderate), 2800 -> 310 (Very Poor), 3700 -> 460 (Severe)
    const normalized = (clampedRaw - 400) / 3300;
    const aqi = Math.round(20 + normalized * 460);

    let category: "Good" | "Moderate" | "Poor" | "Very Poor" | "Severe" = "Good";
    if (aqi <= 50) {
      category = "Good";
    } else if (aqi <= 100) {
      category = "Moderate"; // Satisfactory
    } else if (aqi <= 200) {
      category = "Moderate";
    } else if (aqi <= 300) {
      category = "Poor";
    } else if (aqi <= 400) {
      category = "Very Poor";
    } else {
      category = "Severe";
    }

    return { aqi, category };
  }

  /**
   * Convert raw soil/skin moisture ADC (0-4095) to estimated saturation %
   * Capacitive sensor: lower ADC = higher moisture; Resistive: higher ADC = higher moisture
   */
  public calculateMoisture(rawMoisture: number): number {
    // Assuming typical inverted capacitive analog output (air ~3200, wet cloth/water ~1100)
    const dryVal = 3200;
    const wetVal = 1000;
    const percent = ((dryVal - rawMoisture) / (dryVal - wetVal)) * 100;
    return Math.max(0, Math.min(100, Math.round(percent)));
  }

  /**
   * Run full environment risk assessment
   */
  public analyze(
    tempC: number,
    humidityPct: number,
    rawMq135: number,
    rawMoisture: number
  ): EnvironmentAnalysisResult {
    const heatIndexC = this.calculateHeatIndex(tempC, humidityPct);
    const { aqi, category: aqiCategory } = this.calculateAqi(rawMq135);
    const moisturePercent = this.calculateMoisture(rawMoisture);

    // Heat Index classification (IMD / NOAA Criteria)
    let heatRisk: "NORMAL" | "CAUTION" | "HIGH" | "CRITICAL" = "NORMAL";
    if (heatIndexC >= 45.0) {
      heatRisk = "CRITICAL"; // Danger: Heat stroke imminent
    } else if (heatIndexC >= 39.0) {
      heatRisk = "HIGH";     // Extreme Caution: Heat cramps/exhaustion likely
    } else if (heatIndexC >= 33.0) {
      heatRisk = "CAUTION";  // Caution: Fatigue possible
    }

    // AQI classification
    let aqiRisk: "NORMAL" | "CAUTION" | "HIGH" | "CRITICAL" = "NORMAL";
    if (aqi >= 301) {
      aqiRisk = "CRITICAL";
    } else if (aqi >= 201) {
      aqiRisk = "HIGH";
    } else if (aqi >= 101) {
      aqiRisk = "CAUTION";
    }

    // Dampness / Flood waterborne risk
    let dampnessRisk: "NORMAL" | "CAUTION" | "HIGH" | "CRITICAL" = "NORMAL";
    if (moisturePercent >= 85) {
      dampnessRisk = "CRITICAL"; // Garment saturated, risk of hypothermia or waterborne pathogens
    } else if (moisturePercent >= 65) {
      dampnessRisk = "HIGH";     // Persistent dampness: fungal infection & skin breakdown
    } else if (moisturePercent >= 45) {
      dampnessRisk = "CAUTION";
    }

    return {
      heatIndexC,
      heatRisk,
      calculatedAqi: aqi,
      aqiCategory,
      aqiRisk,
      moisturePercent,
      dampnessRisk,
    };
  }
}
