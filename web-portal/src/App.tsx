// =============================================================================
// src/App.tsx
// Sanjeevni Disaster-Aware AI Health Companion — Main Application Dashboard
// Smart India Hackathon 2026 | Problem Statement 26181 | Team BrajCoders
// =============================================================================

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Navbar } from "./components/Navbar";
import { UsbConnectionPrompt } from "./components/UsbConnectionPrompt";
import { VitalsGrid } from "./components/VitalsGrid";
import { EcgWaveformCanvas } from "./components/EcgWaveformCanvas";
import { MotionMonitor } from "./components/MotionMonitor";
import { DisasterAlertCenter } from "./components/DisasterAlertCenter";
import { AiHealthAssistant } from "./components/AiHealthAssistant";
import { PersonalWellnessCard } from "./components/PersonalWellnessCard";
import { EmergencySosModal } from "./components/EmergencySosModal";

import { serialService, SerialConnectionState } from "./services/serialService";
import { EcgProcessor } from "./ai/ecgProcessor";
import { MotionProcessor } from "./ai/motionProcessor";
import { EnvironmentProcessor } from "./ai/environmentProcessor";
import { SensorFusionEngine } from "./ai/sensorFusion";

import {
  LiveVitals,
  RawSensorPacket,
  UserProfile,
  VulnerabilityProfile,
  DisasterAlert,
} from "./types/telemetry";
import { HeartPulse, ShieldCheck, Cpu, HardDrive } from "lucide-react";

export const App: React.FC = () => {
  // ── 1. AI Processors (Instantiated Once) ──────────────────────────────────
  const ecgProcessorRef = useRef<EcgProcessor>(new EcgProcessor());
  const motionProcessorRef = useRef<MotionProcessor>(new MotionProcessor());
  const envProcessorRef = useRef<EnvironmentProcessor>(new EnvironmentProcessor());
  const fusionEngineRef = useRef<SensorFusionEngine>(new SensorFusionEngine());

  // ── 2. State Management ──────────────────────────────────────────────────
  const [serialState, setSerialState] = useState<SerialConnectionState>("DISCONNECTED");
  const [serialMessage, setSerialMessage] = useState<string>("");

  // User Profile
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: "Alamin Sheikh",
    age: 48,
    profileType: "OUTDOOR_WORKER",
    restingHrBaseline: 72,
    dailyWaterIntakeLiters: 3.5,
    emergencyContact: {
      name: "Sunita (Family Contact)",
      phone: "+91 98765 43210",
      relationship: "Spouse",
    },
  });

  // Live Vitals — STRICTLY REAL DATA ONLY (null until real packets arrive)
  const [vitals, setVitals] = useState<LiveVitals>({
    isConnected: false,
    heartRate: null,
    rrIntervalMs: null,
    hrvRmssd: null,
    hrvSdnn: null,
    sqi: { label: "DISCONNECTED", score: 0 },
    temperatureC: null,
    humidityPct: null,
    heatIndexC: null,
    rawMq135: null,
    calculatedAqi: null,
    aqiCategory: null,
    rawSoilMoisture: null,
    moisturePercent: null,
    motion: {
      x: 0,
      y: 0,
      z: 0,
      magnitude: 0,
      activity: "IDLE",
      fallDetected: false,
      fallStage: "NONE",
      fallConfidence: 0.0,
    },
    lastPacketTs: null,
    packetsReceived: 0,
  });

  // Ring buffer of ECG samples for Canvas rendering
  const [ecgRingBuffer, setEcgRingBuffer] = useState<number[]>(() =>
    new Array(1500).fill(2048)
  );

  // Fusion & Alert State
  const [alerts, setAlerts] = useState<DisasterAlert[]>([]);
  const [healthScore, setHealthScore] = useState<number | null>(null);
  const [baselineDriftPct, setBaselineDriftPct] = useState<number | null>(null);
  const [fatigueIndex, setFatigueIndex] = useState<number | null>(null);

  // SOS Modal State
  const [sosModalOpen, setSosModalOpen] = useState<boolean>(false);
  const [sosReason, setSosReason] = useState<string>("Manual Emergency Broadcast");

  // ── 3. Real Telemetry Packet Handler ──────────────────────────────────────
  const handleIncomingPacket = useCallback(
    (packet: RawSensorPacket) => {
      setVitals((prev) => {
        const next: LiveVitals = {
          ...prev,
          isConnected: true,
          lastPacketTs: Date.now(),
          packetsReceived: prev.packetsReceived + 1,
        };

        switch (packet.sensor) {
          case 1: {
            // BioAmp EXG 500 Hz Chunk
            const ecgRes = ecgProcessorRef.current.processChunk(packet.samples);
            next.heartRate = ecgRes.heartRate;
            next.rrIntervalMs = ecgRes.rrIntervalMs;
            next.hrvRmssd = ecgRes.hrvRmssd;
            next.hrvSdnn = ecgRes.hrvSdnn;
            next.sqi = ecgRes.sqi;
            setEcgRingBuffer([...ecgProcessorRef.current.getRingBuffer()]);
            break;
          }

          case 2: {
            // ADXL345 3-Axis Motion
            const motionRes = motionProcessorRef.current.processSample(
              packet.data.x,
              packet.data.y,
              packet.data.z,
              packet.ts
            );
            next.motion = {
              x: packet.data.x,
              y: packet.data.y,
              z: packet.data.z,
              magnitude: motionRes.magnitude,
              activity: motionRes.activity,
              fallDetected: motionRes.fallDetected,
              fallStage: motionRes.fallStage,
              fallConfidence: motionRes.fallConfidence,
            };

            if (motionRes.fallDetected && !sosModalOpen) {
              setSosReason("Severe Fall Impact Detected (Freefall + High-g Impact)");
              setSosModalOpen(true);
            }
            break;
          }

          case 3: {
            // DHT11 Temperature & Humidity
            next.temperatureC = packet.data.temperature;
            next.humidityPct = packet.data.humidity;
            const envRes = envProcessorRef.current.analyze(
              next.temperatureC,
              next.humidityPct,
              next.rawMq135 || 700,
              next.rawSoilMoisture || 2800
            );
            next.heatIndexC = envRes.heatIndexC;
            break;
          }

          case 4: {
            // MQ135 Air Quality Raw ADC
            next.rawMq135 = packet.data.raw;
            const envRes = envProcessorRef.current.analyze(
              next.temperatureC || 27,
              next.humidityPct || 50,
              next.rawMq135,
              next.rawSoilMoisture || 2800
            );
            next.calculatedAqi = envRes.calculatedAqi;
            next.aqiCategory = envRes.aqiCategory;
            break;
          }

          case 5: {
            // Soil Moisture Raw ADC
            next.rawSoilMoisture = packet.data.raw;
            const envRes = envProcessorRef.current.analyze(
              next.temperatureC || 27,
              next.humidityPct || 50,
              next.rawMq135 || 700,
              next.rawSoilMoisture
            );
            next.moisturePercent = envRes.moisturePercent;
            break;
          }
        }

        // Re-evaluate Sensor Fusion & False-Alarm Gate
        const fusion = fusionEngineRef.current.evaluate(next, userProfile);
        setAlerts(fusion.alerts);
        setHealthScore(fusion.healthScore);
        setBaselineDriftPct(fusion.baselineDriftPct);
        setFatigueIndex(fusion.fatigueIndex);

        if (fusion.sosTriggered && !sosModalOpen) {
          setSosReason(fusion.alerts[0]?.title || "Critical Health Anomaly");
          setSosModalOpen(true);
        }

        return next;
      });
    },
    [userProfile, sosModalOpen]
  );

  // ── 4. Lifecycle & Serial Service Setup ───────────────────────────────────
  useEffect(() => {
    serialService.setOnPacket(handleIncomingPacket);
    serialService.setOnState((state, msg) => {
      setSerialState(state);
      setSerialMessage(msg || "");

      if (state === "CONNECTED") {
        setVitals((prev) => ({ ...prev, isConnected: true }));
      } else if (state === "DISCONNECTED" || state === "ERROR") {
        setVitals((prev) => ({
          ...prev,
          isConnected: false,
          heartRate: null,
          rrIntervalMs: null,
          hrvRmssd: null,
          hrvSdnn: null,
          sqi: { label: "DISCONNECTED", score: 0 },
          temperatureC: null,
          humidityPct: null,
          heatIndexC: null,
          rawMq135: null,
          calculatedAqi: null,
          aqiCategory: null,
          rawSoilMoisture: null,
          moisturePercent: null,
          motion: {
            x: 0,
            y: 0,
            z: 0,
            magnitude: 0,
            activity: "IDLE",
            fallDetected: false,
            fallStage: "NONE",
            fallConfidence: 0.0,
          },
        }));
        setHealthScore(null);
        setBaselineDriftPct(null);
        setFatigueIndex(null);
        setAlerts([]);
      }
    });

    return () => {
      serialService.disconnect();
    };
  }, [handleIncomingPacket]);

  // Handle USB Connect
  const handleConnectUsb = async () => {
    await serialService.connect(115200);
  };

  const handleDisconnectUsb = async () => {
    await serialService.disconnect();
  };

  // Handle Profile Switch
  const handleSelectProfile = (profileType: VulnerabilityProfile) => {
    setUserProfile((prev) => ({ ...prev, profileType }));
  };

  // Handle Manual SOS
  const handleManualSos = () => {
    setSosReason("Manual User SOS Triggered via Dashboard");
    setSosModalOpen(true);
  };

  const handleCancelSos = () => {
    setSosModalOpen(false);
    motionProcessorRef.current.resetFall();
  };

  const isConnected = serialState === "CONNECTED";

  return (
    <div className="min-h-screen flex flex-col justify-between">
      {/* 1. Header Navbar */}
      <Navbar
        serialState={serialState}
        serialMessage={serialMessage}
        userProfile={userProfile}
        onConnectUsb={handleConnectUsb}
        onDisconnectUsb={handleDisconnectUsb}
        onSelectProfile={handleSelectProfile}
        onManualSos={handleManualSos}
      />

      {/* 2. Main Dashboard Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 flex-1 w-full">
        {/* Prominent Hardware Connection Prompt (shown until USB is connected) */}
        {!isConnected && (
          <section>
            <UsbConnectionPrompt
              serialState={serialState}
              serialMessage={serialMessage}
              onConnect={handleConnectUsb}
            />
          </section>
        )}

        {/* Banner: Edge Mode Indicator */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 rounded-2xl bg-white/60 backdrop-blur-sm border border-purple-100 text-xs text-slate-600">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1.5 font-bold text-brand-700">
              <Cpu className="w-4 h-4 text-brand-600" /> On-Device DSP Active:
            </span>
            <span>Pan-Tompkins QRS, 50Hz Mains Notch, Rothfusz Heat Index, 3-Phase Fall Machine</span>
          </div>

          <div className="flex items-center gap-4">
            <span
              className={`flex items-center gap-1 font-semibold ${
                isConnected ? "text-emerald-700" : "text-amber-700"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              {isConnected ? "Live USB Telemetry (115200 Baud)" : "Hardware Disconnected (Standby)"}
            </span>
            <span className="text-slate-400 font-mono">
              Packets Ingested: {vitals.packetsReceived}
            </span>
          </div>
        </div>

        {/* 3. Vitals Grid (6 rounded cards) */}
        <section>
          <VitalsGrid vitals={vitals} />
        </section>

        {/* 4. Live Waves & Posture (ECG Oscilloscope + 3-Axis ADXL345) */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <EcgWaveformCanvas
              isConnected={isConnected}
              ringBuffer={ecgRingBuffer}
              heartRate={vitals.heartRate}
              rrIntervalMs={vitals.rrIntervalMs}
              hrvRmssd={vitals.hrvRmssd}
              hrvSdnn={vitals.hrvSdnn}
              sqi={vitals.sqi}
              onConnectClick={handleConnectUsb}
            />
          </div>

          <div>
            <MotionMonitor isConnected={isConnected} motion={vitals.motion} />
          </div>
        </section>

        {/* 5. SIH 26181 Disaster Resilience & Early Warning System */}
        <section>
          <div className="mb-4">
            <h2 className="text-xl font-black tracking-tight text-slate-800">
              Disaster Early Warning & Resilience Center
            </h2>
            <p className="text-xs text-slate-500">
              Continuous environmental hazard detection tailored for Indian heat waves, floodwaters & pollution crises
            </p>
          </div>
          <DisasterAlertCenter
            vitals={vitals}
            alerts={alerts}
            userProfile={userProfile}
          />
        </section>

        {/* 6. AI Health Assistant & Personal Wellness Engine */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <AiHealthAssistant
              vitals={vitals}
              userProfile={userProfile}
            />
          </div>

          <div>
            <PersonalWellnessCard
              isConnected={isConnected}
              healthScore={healthScore}
              baselineDriftPct={baselineDriftPct}
              fatigueIndex={fatigueIndex}
              restingHrBaseline={userProfile.restingHrBaseline}
              currentHr={vitals.heartRate}
              userProfile={userProfile}
            />
          </div>
        </section>
      </main>

      {/* 7. Footer */}
      <footer className="bg-white/70 backdrop-blur-sm border-t border-purple-100 py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-bold text-slate-700">SANJEEVNI</span> • Smart India Hackathon 2026 (Problem Statement 26181)
            <span className="mx-2">|</span>
            Team BrajCoders (ID: 1111)
          </div>

          <div className="flex items-center gap-4">
            <span>Hardware: ESP32 + BioAmp + ADXL345 + DHT11 + MQ135 + Soil</span>
            <span>Baud: 115200 bps UART</span>
          </div>
        </div>
      </footer>

      {/* 8. Emergency SOS Modal Overlay */}
      <EmergencySosModal
        isOpen={sosModalOpen}
        reason={sosReason}
        vitals={vitals}
        userProfile={userProfile}
        onCancel={handleCancelSos}
        onConfirmDispatch={() => {
          console.log("[SOS] Emergency broadcast dispatched successfully!");
        }}
      />
    </div>
  );
};
