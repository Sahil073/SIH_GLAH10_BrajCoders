# On-Device AI & Biomedical DSP Engine

This directory contains the core digital signal processing (DSP), statistical feature extraction, sensor fusion, and risk decision engine for Sanjeevni. It is designed as an isolated, zero-dependency TypeScript module that executes entirely on the mobile CPU (100% offline).

---

## Architectural Principles

1. **Deterministic DSP & Statistical Rules (Phase 1)**:
   Avoids heavyweight black-box neural networks in favour of validated biomedical algorithms (Pan-Tompkins QRS detection, Biquad IIR filtering, Welford's online variance, NWS Rothfusz polynomial). This guarantees real-time execution (<5 ms per tick) with minimal battery consumption and predictable failure modes.
2. **Zero Framework Coupling**:
   No dependencies on React Native, Expo, or native OS binaries. The engine can be tested directly in Node.js or run inside a Web Worker, headless service, or mobile JavaScript runtime.
3. **Strict Per-User State Isolation**:
   Filter memories, ring buffers, and baseline tracking are maintained in per-user instances (`runtimeByUser = Map<string, RuntimeState>()`) to eliminate cross-session data contamination.
4. **Physiologically Conservative**:
   Missing or noise-corrupted sensor inputs remain explicitly `null` rather than falling back to default "healthy" constants.

---

## Subsystem Breakdown

```text
ai-engine/
├── baseline/                  # Welford's running baseline & cold-start calibration
│   └── personalBaseline.ts
├── buffers/                   # High-performance sliding-window buffers
│   └── ringBuffer.ts          # O(1) circular ring buffer implementation
├── decision/                  # Alarm confirmation & recommendation generation
│   ├── falseAlarmGate.ts      # Multi-window persistence & motion masking
│   └── riskDecisionEngine.ts  # Final risk stratification and SOS trigger logic
├── ecg/                       # Biomedical signal processing pipeline
│   ├── filters.ts             # Biquad IIR 0.5–40 Hz bandpass + 50 Hz notch filter
│   ├── sqi.ts                 # Motion-aware Signal Quality Index (kurtosis, SNR)
│   ├── rPeakDetection.ts      # Pan-Tompkins adaptive dual-threshold peak detector
│   ├── rrValidation.ts        # 300–2000 ms physiological interval validation
│   ├── heartRate.ts           # Rolling heart rate (BPM) calculation
│   ├── hrv.ts                 # Time-domain HRV extraction (RMSSD, SDNN)
│   └── rhythmAnomaly.ts       # Bradycardia, tachycardia & arrhythmia detection
├── environment/               # Microclimate & environmental hazard modeling
│   ├── aqiSource.ts           # MQ135 ADC mapping to EPA AQI bands
│   ├── heatIndex.ts           # NWS Rothfusz equation & Steadman regression
│   └── respiratoryRisk.ts     # Combined thermal-gas pulmonary hazard scoring
├── fusion/                    # Multi-modal risk aggregation
│   └── sensorFusion.ts        # Weighted cross-domain risk synthesis
├── mock/                      # Hardware simulation for Expo Go
│   └── syntheticDataGenerator.ts # Generates realistic P-Q-R-S-T waves & tilt
├── __tests__/                 # Automated test suite
│   └── aiPipeline.test.ts     # 7-stage pipeline verification
├── types.ts                   # Strict data contracts for all inputs & outputs
├── index.ts                   # Public orchestrator: processSensorTick()
└── package.json               # Standalone package definition
```

---

## Algorithm Details

### 1. ECG Signal Conditioning (`ecg/filters.ts`)
Raw 500 Hz analog samples from the BioAmp EXG Pill undergo a 2-stage digital filtering cascade:
- **0.5–40 Hz Bandpass Filter**: Second-order IIR Biquad filters suppress baseline wander caused by respiration (<0.5 Hz) and electromyographic muscle noise (>40 Hz).
- **50 Hz Notch Filter**: Second-order IIR Notch filter ($Q = 30$) eliminates AC mains hum from nearby electrical wiring.

### 2. Pan-Tompkins QRS Detection (`ecg/rPeakDetection.ts`)
The filtered biopotential stream is evaluated via a classical Pan-Tompkins implementation:
1. **Derivative Operator**: Emphasizes the steep slope of the QRS complex ($y[n] = (2x[n] + x[n-1] - x[n-3] - 2x[n-4]) / 8$).
2. **Squaring Function**: Non-linearly amplifies the high-frequency QRS energy and forces all values positive.
3. **Moving Window Integrator**: Integrates energy over a 150 ms window ($\approx 75$ samples at 500 Hz).
4. **Adaptive Dual Thresholding**: Automatically adapts signal and noise peak thresholds based on running averages:
   $$\text{Threshold} = \text{NoiseLevel} + 0.25 \times (\text{SignalLevel} - \text{NoiseLevel})$$
5. **Refractory Blanking**: Enforces a 200 ms minimum lockout period between adjacent peaks to prevent double-counting T-waves.

### 3. Signal Quality Index (`ecg/sqi.ts`)
Before computing heart metrics, each batch of ECG samples is evaluated against three quality criteria:
- **Saturation / Lead-Off Check**: Flags ADC values locked at rails (`4095` or `0`).
- **Kurtosis & Relative Energy**: Computes 4th-order statistical moment to ensure peakiness characteristic of genuine QRS complexes.
- **Motion Gating**: Reads simultaneous dynamic acceleration from the ADXL345; if motion exceeds threshold, classifies as `MOTION_CORRUPTED` to prevent false arrhythmia triggers.

### 4. Heart Rate & HRV Calculation (`ecg/heartRate.ts`, `ecg/hrv.ts`)
- **RR Interval Validation**: Discards intervals outside 300 ms (200 BPM) to 2000 ms (30 BPM) or exhibiting unphysiological step jumps (>30% variance from previous interval).
- **Heart Rate**: Derived from the median of validated RR intervals over the observation window:
  $$\text{HR} = \frac{60000}{\text{median}(RR_i)} \text{ BPM}$$
- **RMSSD**: Root mean square of successive RR interval differences, reflecting parasympathetic autonomic activity:
  $$\text{RMSSD} = \sqrt{\frac{1}{N-1} \sum_{i=1}^{N-1} (RR_{i+1} - RR_i)^2}$$
- **SDNN**: Standard deviation of all normal-to-normal intervals over the observation window.

### 5. Fall Detection Finite State Machine (`motion/fallDetection.ts`)
Evaluates 3-axis accelerometer vectors $|\vec{a}| = \sqrt{x^2 + y^2 + z^2}$:
1. **Stage 1 (Freefall)**: Total vector drops below $0.5\text{g}$ for $\ge 60\text{ ms}$.
2. **Stage 2 (Impact)**: Vector experiences an abrupt acceleration spike exceeding $2.5\text{g}$ within $500\text{ ms}$ of freefall.
3. **Stage 3 (Post-Impact Immobility)**: Evaluates subsequent motion for $2.0\text{ s}$. If acceleration variance remains $<0.15\text{g}$, flags a `CONFIRMED` fall event.

### 6. Environmental Thermal Index (`environment/heatIndex.ts`)
Uses the comprehensive National Weather Service (NWS) Rothfusz regression equation for temperatures above $26.7^\circ\text{C}$ ($80^\circ\text{F}$) and relative humidity between 0% and 100%:
$$\text{HI} = c_1 + c_2 T + c_3 RH + c_4 T \cdot RH + c_5 T^2 + c_6 RH^2 + c_7 T^2 RH + c_8 T \cdot RH^2 + c_9 T^2 RH^2$$
Applies adjustment factors for low humidity / high temperature and high humidity / moderate temperature regimes.

### 7. False-Alarm Gate & Multi-Sensor Fusion (`decision/falseAlarmGate.ts`, `fusion/sensorFusion.ts`)
- **Persistence Verification**: Isolated anomalous ticks do not trigger high-severity alerts. An event must persist across consecutive evaluation windows.
- **Cross-Domain Correlation**: High heart rate during intense physical activity (high motion RMS) is classified as physiological exertion rather than panic or ventricular tachycardia. Conversely, high heart rate combined with zero motion and elevated ambient heat index increases the heat exhaustion risk score.
- **Emergency SOS Decision**: Recommends triggering the SOS workflow if confirmed fall occurs with sustained immobility, or if severe multi-risk convergence is detected.

---

## Testing

The AI engine includes an automated end-to-end verification script testing all DSP stages:

```bash
# Run from workspace root:
npm run test:ai

# Or run directly:
npx tsx mobile-app/ai-engine/__tests__/aiPipeline.test.ts
```

### Verified Test Cases:
1. **ECG Filter Chain**: Attenuation of 50 Hz noise and DC baseline drift.
2. **Pan-Tompkins Detection**: QRS peak detection and RR interval validation on simulated waveforms.
3. **HR & HRV Computation**: Correct mathematical derivation of BPM, RMSSD, and SDNN.
4. **Motion Classification & Fall Engine**: Rest vs vigorous activity, and 3-stage fall confirmation.
5. **NWS Heat Index**: Validated against NOAA benchmark tables for multiple $(T, RH)$ pairs.
6. **Full Pipeline Orchestration**: Validates `processSensorTick()` output structure and bounds.
7. **SOS Alarm Gating**: Multi-window confirmation under emergency stress conditions.

