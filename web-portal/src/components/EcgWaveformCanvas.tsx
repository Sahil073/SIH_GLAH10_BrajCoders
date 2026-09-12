// =============================================================================
// src/components/EcgWaveformCanvas.tsx
// High-Performance 60 FPS Canvas Oscilloscope for 500 Hz BioAmp EXG Stream
// =============================================================================

import React, { useEffect, useRef } from "react";
import { Heart, ShieldCheck, AlertCircle, Info, Usb, PowerOff } from "lucide-react";
import { SQILabel } from "../types/telemetry";

interface EcgWaveformCanvasProps {
  isConnected: boolean;
  ringBuffer: number[];
  heartRate: number | null;
  rrIntervalMs: number | null;
  hrvRmssd: number | null;
  hrvSdnn: number | null;
  sqi: {
    label: SQILabel;
    score: number;
  };
  onConnectClick?: () => void;
}

export const EcgWaveformCanvas: React.FC<EcgWaveformCanvasProps> = ({
  isConnected,
  ringBuffer,
  heartRate,
  rrIntervalMs,
  hrvRmssd,
  hrvSdnn,
  sqi,
  onConnectClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let sweepX = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      // 1. Clear background
      ctx.fillStyle = "#120d24";
      ctx.fillRect(0, 0, width, height);

      // 2. Draw Medical ECG Paper Millimeter Grid
      ctx.lineWidth = 0.5;
      const smallGrid = 15;
      const largeGrid = 75;

      // Fine grid
      ctx.strokeStyle = "rgba(168, 85, 247, 0.10)";
      ctx.beginPath();
      for (let x = 0; x < width; x += smallGrid) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = 0; y < height; y += smallGrid) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Major grid
      ctx.strokeStyle = "rgba(236, 72, 153, 0.22)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x < width; x += largeGrid) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = 0; y < height; y += largeGrid) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      const centerY = height / 2;

      if (!isConnected) {
        // Draw flat resting baseline with calm horizontal line
        ctx.lineWidth = 1.8;
        ctx.strokeStyle = "rgba(168, 85, 247, 0.35)";
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(width, centerY);
        ctx.stroke();

        // Subtle moving scanner dot indicating standby
        sweepX = (sweepX + 2) % width;
        ctx.fillStyle = "#F472B6";
        ctx.beginPath();
        ctx.arc(sweepX, centerY, 3.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // 3. Draw Real ECG Signal Trace from ring buffer
        const samples = ringBuffer;
        const len = samples.length;
        if (len > 0) {
          ctx.lineWidth = 2.2;
          const gradient = ctx.createLinearGradient(0, 0, width, 0);
          gradient.addColorStop(0, "#C084FC");
          gradient.addColorStop(0.5, "#F472B6");
          gradient.addColorStop(1, "#EC4899");

          ctx.strokeStyle = gradient;
          ctx.shadowColor = "#EC4899";
          ctx.shadowBlur = 8;
          ctx.beginPath();

          const step = width / (len - 1);
          const scaleY = (height / 2) / 1200;

          for (let i = 0; i < len; i++) {
            const raw = samples[i] || 2048;
            const y = centerY - (raw - 2048) * scaleY;
            const x = i * step;

            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [ringBuffer, isConnected]);

  // SQI Badge styling
  const getSqiBadge = () => {
    if (!isConnected) {
      return { bg: "bg-slate-100 text-slate-600 border-slate-200", icon: PowerOff, text: "USB Disconnected" };
    }
    switch (sqi.label) {
      case "EXCELLENT":
        return { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: ShieldCheck, text: "High SQI (95%)" };
      case "GOOD":
        return { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: ShieldCheck, text: "Good SQI" };
      case "USABLE":
        return { bg: "bg-amber-50 text-amber-700 border-amber-200", icon: Info, text: "Usable SQI" };
      case "NOISY":
        return { bg: "bg-orange-50 text-orange-700 border-orange-200", icon: AlertCircle, text: "Motion Noise" };
      default:
        return { bg: "bg-slate-100 text-slate-600 border-slate-200", icon: PowerOff, text: "No Signal" };
    }
  };

  const badge = getSqiBadge();
  const SqiIcon = badge.icon;

  return (
    <div className="glass-card rounded-3xl p-6 relative overflow-hidden transition-all shadow-soft">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-sm ${
              isConnected
                ? "bg-gradient-to-tr from-rosebud-500 to-brand-500 shadow-rosebud-500/30"
                : "bg-slate-400"
            }`}
          >
            <Heart className={`w-5 h-5 ${isConnected ? "animate-pulse" : ""}`} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              Live Cardiac Electrocardiogram (ECG)
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                  isConnected
                    ? "bg-rosebud-100 text-rosebud-700 border-rosebud-200"
                    : "bg-slate-100 text-slate-600 border-slate-200"
                }`}
              >
                {isConnected ? "500 Hz Active" : "Waiting for USB"}
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              BioAmp EXG front-end • Modified Lead-II • Pan-Tompkins QRS Detection
            </p>
          </div>
        </div>

        {/* Real-time stats pills */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Signal Quality Index */}
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${badge.bg}`}>
            <SqiIcon className="w-3.5 h-3.5" />
            <span>{badge.text}</span>
          </div>

          {/* HRV RMSSD */}
          <div className="px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-xs font-medium text-brand-700">
            RMSSD: <span className="font-bold">{isConnected && hrvRmssd !== null ? `${hrvRmssd} ms` : "--"}</span>
          </div>

          {/* HRV SDNN */}
          <div className="px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-xs font-medium text-brand-700">
            SDNN: <span className="font-bold">{isConnected && hrvSdnn !== null ? `${hrvSdnn} ms` : "--"}</span>
          </div>
        </div>
      </div>

      {/* Main Oscilloscope Display */}
      <div className="relative rounded-2xl overflow-hidden border border-purple-900/40 shadow-inner">
        <canvas
          ref={canvasRef}
          width={1000}
          height={260}
          className="w-full h-56 sm:h-64 block"
        />

        {/* Floating Heart Rate HUD (Top-Right of Canvas) */}
        <div className="absolute top-4 right-4 bg-slate-950/80 backdrop-blur-md border border-purple-500/30 rounded-2xl px-4 py-2.5 flex items-center gap-3 shadow-lg">
          <div className={`w-3 h-3 rounded-full ${isConnected ? "bg-rosebud-500 animate-ping" : "bg-slate-600"}`} />
          <div>
            <div className="text-[10px] tracking-wider uppercase font-semibold text-rosebud-300">
              Heart Rate
            </div>
            <div className="text-3xl font-extrabold text-white tracking-tight flex items-baseline gap-1">
              {isConnected && heartRate !== null ? heartRate : "--"}
              <span className="text-xs font-medium text-slate-400">BPM</span>
            </div>
          </div>
          <div className="border-l border-purple-500/30 pl-3">
            <div className="text-[10px] tracking-wider uppercase font-semibold text-purple-300">
              R-R Interval
            </div>
            <div className="text-sm font-bold text-slate-200">
              {isConnected && rrIntervalMs !== null ? rrIntervalMs : "--"} <span className="text-[10px] font-normal text-slate-400">ms</span>
            </div>
          </div>
        </div>

        {/* Center Overlay when USB is not connected */}
        {!isConnected && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-slate-950/60 backdrop-blur-[2px] text-center">
            <div className="w-12 h-12 rounded-2xl bg-purple-950/90 border border-purple-500/40 flex items-center justify-center text-purple-300 mb-3 shadow-glow">
              <Usb className="w-6 h-6 animate-pulse" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
              Hardware Stream Standby
            </h3>
            <p className="text-xs text-purple-200/80 max-w-sm mt-1 mb-4">
              Please connect your ESP32 Sensor Hub via USB cable (Baud: 115200) to begin live 500 Hz ECG oscilloscope streaming.
            </p>
            {onConnectClick && (
              <button
                onClick={onConnectClick}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-rosebud-500 hover:opacity-95 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
              >
                <Usb className="w-4 h-4" />
                Connect ESP32 (USB)
              </button>
            )}
          </div>
        )}

        {/* Lead & Calibration info footer on canvas */}
        <div className="absolute bottom-2 left-4 flex items-center gap-4 text-[10px] font-mono text-purple-300/70">
          <span>Speed: 25mm/s</span>
          <span>Gain: 10mm/mV</span>
          <span>Filter: 50Hz Notch + 0.5-40Hz Bandpass</span>
        </div>
      </div>
    </div>
  );
};
