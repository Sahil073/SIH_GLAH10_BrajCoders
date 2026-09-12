// =============================================================================
// src/ai/motionProcessor.ts
// 3-Axis ADXL345 Motion Processing & 3-Phase Fall Detection State Machine
// =============================================================================

import { ActivityState, FallStage } from "../types/telemetry";

export interface MotionAnalysisResult {
  magnitude: number;
  activity: ActivityState;
  fallDetected: boolean;
  fallStage: FallStage;
  fallConfidence: number;
}

export class MotionProcessor {
  // Thresholds validated against SIH build guide & research papers
  private readonly FREEFALL_THRESHOLD = 4.5;    // m/s^2 (< 0.5g indicates zero-g free fall)
  private readonly IMPACT_THRESHOLD = 23.5;     // m/s^2 (> 2.4g indicates hard floor impact)
  private readonly STILLNESS_MAX_VAR = 0.45;    // post-impact immobility variance

  // State machine tracking
  private state: FallStage = "NONE";
  private freefallTimestamp: number = 0;
  private impactTimestamp: number = 0;
  private postImpactSamples: number[] = [];

  // Rolling motion window for activity classification
  private recentMagnitudes: number[] = [];
  private readonly WINDOW_SIZE = 25; // 1 second at 25Hz TX rate

  /**
   * Process a single 3-axis acceleration sample {x, y, z} in m/s^2
   */
  public processSample(x: number, y: number, z: number, timestampMs: number): MotionAnalysisResult {
    const magnitude = Math.sqrt(x * x + y * y + z * z);

    this.recentMagnitudes.push(magnitude);
    if (this.recentMagnitudes.length > this.WINDOW_SIZE) {
      this.recentMagnitudes.shift();
    }

    // 1. Activity Classification
    let meanMag = 9.8;
    let variance = 0;
    if (this.recentMagnitudes.length > 0) {
      meanMag = this.recentMagnitudes.reduce((a, b) => a + b, 0) / this.recentMagnitudes.length;
      variance = this.recentMagnitudes.reduce((acc, val) => acc + Math.pow(val - meanMag, 2), 0) / this.recentMagnitudes.length;
    }

    let activity: ActivityState = "REST";
    if (variance > 12.0) {
      activity = "VIGOROUS";
    } else if (variance > 1.8) {
      activity = "ACTIVE";
    } else if (variance > 0.4) {
      activity = "LIGHT";
    } else {
      activity = "REST";
    }

    // 2. 3-Phase Fall State Machine
    let fallDetected = false;
    let confidence = 0.0;

    switch (this.state) {
      case "NONE":
        if (magnitude < this.FREEFALL_THRESHOLD) {
          this.state = "FREEFALL";
          this.freefallTimestamp = timestampMs;
        }
        break;

      case "FREEFALL":
        // Look for impact within 120ms to 600ms of freefall
        const elapsedSinceFreefall = timestampMs - this.freefallTimestamp;
        if (magnitude > this.IMPACT_THRESHOLD) {
          if (elapsedSinceFreefall >= 100 && elapsedSinceFreefall <= 800) {
            this.state = "IMPACT";
            this.impactTimestamp = timestampMs;
            this.postImpactSamples = [];
          } else {
            this.state = "NONE";
          }
        } else if (elapsedSinceFreefall > 900) {
          // Timed out without impact
          this.state = "NONE";
        }
        break;

      case "IMPACT":
        this.postImpactSamples.push(magnitude);
        const elapsedSinceImpact = timestampMs - this.impactTimestamp;

        // Monitor stillness for 1.5 seconds post-impact
        if (elapsedSinceImpact >= 1500) {
          // Compute post-impact variance
          const avgPost = this.postImpactSamples.reduce((a, b) => a + b, 0) / this.postImpactSamples.length;
          const postVar = this.postImpactSamples.reduce((acc, v) => acc + Math.pow(v - avgPost, 2), 0) / this.postImpactSamples.length;

          if (postVar < this.STILLNESS_MAX_VAR) {
            this.state = "CONFIRMED";
            fallDetected = true;
            confidence = 0.92;
          } else {
            // Person stood back up or was moving
            this.state = "NONE";
          }
        }
        break;

      case "CONFIRMED":
        // Hold confirmed fall alert until explicitly reset or timeout
        fallDetected = true;
        confidence = 0.95;
        break;
    }

    return {
      magnitude: Math.round(magnitude * 100) / 100,
      activity,
      fallDetected,
      fallStage: this.state,
      fallConfidence: confidence,
    };
  }

  public resetFall(): void {
    this.state = "NONE";
    this.freefallTimestamp = 0;
    this.impactTimestamp = 0;
    this.postImpactSamples = [];
  }
}

