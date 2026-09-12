// =============================================================================
// src/components/UsbConnectionPrompt.tsx
// Prominent Hardware Connect Banner & Step-by-Step Instructions
// =============================================================================

import React from "react";
import { Usb, ArrowRight, ShieldCheck, Cpu, Cable, CheckCircle2, AlertCircle } from "lucide-react";
import { SerialConnectionState } from "../services/serialService";

interface UsbConnectionPromptProps {
  serialState: SerialConnectionState;
  serialMessage: string;
  onConnect: () => void;
}

export const UsbConnectionPrompt: React.FC<UsbConnectionPromptProps> = ({
  serialState,
  serialMessage,
  onConnect,
}) => {
  if (serialState === "CONNECTED") return null;

  return (
    <div className="glass-card rounded-3xl p-6 md:p-8 border-2 border-brand-200 bg-gradient-to-br from-purple-50/90 via-pink-50/80 to-white shadow-soft transition-all">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        {/* Left column */}
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-rosebud-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/25 flex-shrink-0 animate-pulse">
            <Usb className="w-7 h-7" />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rosebud-100 text-rosebud-700 text-xs font-bold uppercase tracking-wider mb-2 border border-rosebud-200">
              <AlertCircle className="w-3.5 h-3.5" /> Hardware Connection Required
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
              Connect Your ESP32 Wearable via USB
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mt-1 leading-relaxed">
              Sanjeevni streams 100% genuine on-device telemetry. Please plug your ESP32 Sensor Hub into your laptop with a USB cable to activate the 500 Hz BioAmp ECG oscilloscope, 3-axis motion tracking, and disaster early warning system.
            </p>

            {serialMessage && (
              <p className="text-xs font-semibold text-rose-600 mt-2">
                Status: {serialMessage}
              </p>
            )}
          </div>
        </div>

        {/* Right column: Action Button */}
        <div className="flex-shrink-0 w-full lg:w-auto flex flex-col sm:flex-row lg:flex-col gap-3">
          <button
            onClick={onConnect}
            disabled={serialState === "CONNECTING"}
            className="w-full lg:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-brand-700 via-brand-600 to-rosebud-500 hover:opacity-95 text-white font-extrabold text-sm tracking-wide shadow-lg shadow-brand-600/30 transition-all flex items-center justify-center gap-2"
          >
            <Usb className="w-5 h-5" />
            <span>{serialState === "CONNECTING" ? "Opening COM Port..." : "Connect ESP32 (USB)"}</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>

      {/* 3 Step Guide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-purple-200/70">
        <div className="flex items-center gap-3 bg-white/70 p-3.5 rounded-2xl border border-purple-100">
          <div className="w-7 h-7 rounded-xl bg-purple-100 text-brand-700 flex items-center justify-center font-bold text-xs">
            1
          </div>
          <div className="text-xs">
            <span className="font-bold text-slate-800">Plug USB Cable:</span>
            <p className="text-slate-500">Connect ESP32 DevKit to your laptop USB port.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white/70 p-3.5 rounded-2xl border border-purple-100">
          <div className="w-7 h-7 rounded-xl bg-purple-100 text-brand-700 flex items-center justify-center font-bold text-xs">
            2
          </div>
          <div className="text-xs">
            <span className="font-bold text-slate-800">Flash Firmware:</span>
            <p className="text-slate-500">Use <code className="bg-purple-50 px-1 py-0.5 rounded text-[10px]">ESP32_Sensor_Hub_USB.ino</code> at 115200 baud.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white/70 p-3.5 rounded-2xl border border-purple-100">
          <div className="w-7 h-7 rounded-xl bg-purple-100 text-brand-700 flex items-center justify-center font-bold text-xs">
            3
          </div>
          <div className="text-xs">
            <span className="font-bold text-slate-800">Click Authorize:</span>
            <p className="text-slate-500">Select the USB Serial COM port when prompted.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

