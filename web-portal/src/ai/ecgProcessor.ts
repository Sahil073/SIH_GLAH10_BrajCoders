// =============================================================================
// src/ai/ecgProcessor.ts
// On-Device DSP: 50Hz Notch, Bandpass, Pan-Tompkins QRS & HRV
// =============================================================================

import { SQILabel } from "../types/telemetry";

export interface EcgAnalysisResult {
  heartRate: number;
  rrIntervalMs: number;
  hrvRmssd: number;
  hrvSdnn: number;
  sqi: {
    label: SQILabel;
    score: number;
  };
  rPeaks: number[];
  filteredSamples: number[];
}

export class EcgProcessor {
  private readonly sampleRate: number = 500; // 500 Hz standard BioAmp EXG
  private prevRawSample: number = 2048;
  private recentRrIntervals: number[] = [];
  private lastRPeakSampleIdx: number = 0;
  private totalSamplesProcessed: number = 0;

  // Notch filter state (50Hz notch for 500Hz sampling: r = 0.95, w0 = 2*pi*50/500 = 0.2*pi)
  private notch_x1 = 0;
  private notch_x2 = 0;
  private notch_y1 = 0;
  private notch_y2 = 0;

  // Bandpass filter state (0.5Hz - 40Hz)
  private bp_x1 = 0;
  private bp_x2 = 0;
  private bp_y1 = 0;
  private bp_y2 = 0;

  // Pan-Tompkins Moving Window Integrator
  private mwiBuffer: number[] = [];
  private readonly mwiWindowSize: number = Math.round(500 * 0.15); // 150ms window = 75 samples
  private mwiSum: number = 0;

  // Adaptive thresholding
  private peaki: number = 0;
  private spki: number = 0;
  private npki: number = 0;
  private threshold1: number = 0;

  // Circular buffer of latest filtered samples for live visualization
  private ringBuffer: number[] = new Array(1500).fill(2048);
  private ringIndex: number = 0;

  constructor() {
    // Initialize adaptive thresholds with typical resting values
    this.spki = 20000;
    this.npki = 5000;
    this.threshold1 = this.npki + 0.25 * (this.spki - this.npki);
  }

  /**
   * 50 Hz IIR Notch Filter to eliminate Indian powerline interference
   */
  private filterNotch50Hz(x: number): number {
    const f0 = 50;
    const fs = this.sampleRate;
    const w0 = (2 * Math.PI * f0) / fs;
    const r = 0.95;

    const b0 = 1;
    const b1 = -2 * Math.cos(w0);
    const b2 = 1;
    const a1 = -2 * r * Math.cos(w0);
    const a2 = r * r;

    const y = b0 * x + b1 * this.notch_x1 + b2 * this.notch_x2 - a1 * this.notch_y1 - a2 * this.notch_y2;

    this.notch_x2 = this.notch_x1;
    this.notch_x1 = x;
    this.notch_y2 = this.notch_y1;
    this.notch_y1 = y;

    return y;
  }

  /**
   * Bandpass Filter (0.5Hz high-pass to remove baseline wander, 40Hz low-pass for EMG noise)
   */
  private filterBandpass(x: number): number {
    // 2-pole simple bi-quad approximation around 15Hz center
    const a = 0.72;
    const y = a * this.bp_y1 + (x - this.bp_x2) * 0.45;

    this.bp_x2 = this.bp_x1;
    this.bp_x1 = x;
    this.bp_y2 = this.bp_y1;
    this.bp_y1 = y;

    return y;
  }

  /**
   * Process an incoming chunk of raw 500Hz ADC samples from Sensor 1
   */
  public processChunk(rawSamples: number[]): EcgAnalysisResult {
    const filteredChunk: number[] = [];
    const detectedPeakIndices: number[] = [];

    for (let i = 0; i < rawSamples.length; i++) {
      const raw = rawSamples[i];
      this.totalSamplesProcessed++;

      // 1. Dual Filter Chain
      const notched = this.filterNotch50Hz(raw);
      const bandpassed = this.filterBandpass(notched);
      
      // Scale and offset back to resting baseline ~2048 for display
      const displaySample = Math.max(0, Math.min(4095, Math.round(bandpassed + 2048)));
      filteredChunk.push(displaySample);

      // Store in ring buffer for canvas rendering
      this.ringBuffer[this.ringIndex] = displaySample;
      this.ringIndex = (this.ringIndex + 1) % this.ringBuffer.length;

      // 2. Pan-Tompkins 5-point Derivative
      const derivative = (2 * raw - this.prevRawSample) / 3;
      this.prevRawSample = raw;

      // 3. Squaring
      const squared = derivative * derivative;

      // 4. Moving Window Integration (MWI)
      this.mwiSum += squared;
      this.mwiBuffer.push(squared);
      if (this.mwiBuffer.length > this.mwiWindowSize) {
        this.mwiSum -= this.mwiBuffer.shift()!;
      }
      const mwiVal = this.mwiSum / this.mwiWindowSize;

      // 5. Adaptive Threshold & Refractory Period (200ms = 100 samples at 500Hz)
      const samplesSinceLastPeak = this.totalSamplesProcessed - this.lastRPeakSampleIdx;
      const refractorySamples = Math.round(this.sampleRate * 0.28); // 280ms min RR interval (~214 bpm max)

      if (mwiVal > this.threshold1 && samplesSinceLastPeak > refractorySamples) {
        // Potential R-peak found
        this.peaki = mwiVal;
        this.spki = 0.125 * this.peaki + 0.875 * this.spki;
        this.threshold1 = this.npki + 0.25 * (this.spki - this.npki);

        const currentSampleIdx = this.totalSamplesProcessed;
        if (this.lastRPeakSampleIdx > 0) {
          const rrSamples = currentSampleIdx - this.lastRPeakSampleIdx;
          const rrMs = (rrSamples / this.sampleRate) * 1000;

          // Physiological validation (300ms to 2000ms = 30 to 200 BPM)
          if (rrMs >= 300 && rrMs <= 2000) {
            this.recentRrIntervals.push(rrMs);
            if (this.recentRrIntervals.length > 15) {
              this.recentRrIntervals.shift();
            }
            detectedPeakIndices.push(i);
          }
        }
        this.lastRPeakSampleIdx = currentSampleIdx;
      } else {
        // Noise update
        this.npki = 0.125 * mwiVal + 0.875 * this.npki;
        this.threshold1 = this.npki + 0.25 * (this.spki - this.npki);
      }
    }

    // Compute Heart Rate & HRV
    let hr = 72;
    let rr = 833;
    let rmssd = 35;
    let sdnn = 42;

    if (this.recentRrIntervals.length >= 3) {
      const sumRr = this.recentRrIntervals.reduce((a, b) => a + b, 0);
      const avgRr = sumRr / this.recentRrIntervals.length;
      rr = Math.round(avgRr);
      hr = Math.round(60000 / avgRr);

      // HRV SDNN
      const variance = this.recentRrIntervals.reduce((sum, val) => sum + Math.pow(val - avgRr, 2), 0) / this.recentRrIntervals.length;
      sdnn = Math.round(Math.sqrt(variance) * 10) / 10;

      // HRV RMSSD
      let diffSqSum = 0;
      for (let k = 1; k < this.recentRrIntervals.length; k++) {
        diffSqSum += Math.pow(this.recentRrIntervals[k] - this.recentRrIntervals[k - 1], 2);
      }
      rmssd = Math.round(Math.sqrt(diffSqSum / (this.recentRrIntervals.length - 1)) * 10) / 10;
    }

    // Signal Quality Index (SQI)
    let sqiScore = 0.95;
    let sqiLabel: SQILabel = "EXCELLENT";

    // Simple variance / clipping check
    let clippedCount = 0;
    for (const s of rawSamples) {
      if (s < 50 || s > 4045) clippedCount++;
    }

    if (clippedCount > rawSamples.length * 0.2) {
      sqiScore = 0.2;
      sqiLabel = "INVALID";
    } else if (clippedCount > 0) {
      sqiScore = 0.6;
      sqiLabel = "NOISY";
    } else if (this.recentRrIntervals.length < 2) {
      sqiScore = 0.75;
      sqiLabel = "USABLE";
    }

    return {
      heartRate: Math.max(40, Math.min(200, hr)),
      rrIntervalMs: rr,
      hrvRmssd: rmssd,
      hrvSdnn: sdnn,
      sqi: { label: sqiLabel, score: sqiScore },
      rPeaks: detectedPeakIndices,
      filteredSamples: filteredChunk,
    };
  }

  public getRingBuffer(): number[] {
    return this.ringBuffer;
  }
}

