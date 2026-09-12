// =============================================================================
// src/components/Navbar.tsx
// Header Navbar with USB Serial, Simulator, Scenario Selector & Profile Switcher
// =============================================================================

import React from "react";
import {
  Usb,
  Radio,
  AlertTriangle,
  HeartPulse,
  User,
  Zap,
  CheckCircle2,
  XCircle,
  Activity,
  Flame,
  Wind,
  Droplets,
} from "lucide-react";
import { SerialConnectionState } from "../services/serialService";
import { DisasterScenario } from "../services/simulatorService";
import { UserProfile, VulnerabilityProfile } from "../types/telemetry";

interface NavbarProps {
  serialState: SerialConnectionState;
  serialMessage: string;
  isSimulatorOn: boolean;
  activeScenario: DisasterScenario;
  userProfile: UserProfile;
  onConnectUsb: () => void;
  onDisconnectUsb: () => void;
  onToggleSimulator: () => void;
  onSelectScenario: (scenario: DisasterScenario) => void;
  onSelectProfile: (profile: VulnerabilityProfile) => void;
  onManualSos: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  serialState,
  serialMessage,
  isSimulatorOn,
  activeScenario,
  userProfile,
  onConnectUsb,
  onDisconnectUsb,
  onToggleSimulator,
  onSelectScenario,
  onSelectProfile,
  onManualSos,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-purple-100 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Left: Branding & SIH Tag */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-600 via-brand-500 to-rosebud-400 flex items-center justify-center shadow-soft text-white shadow-brand-500/20">
            <HeartPulse className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-brand-800 via-brand-600 to-rosebud-500 bg-clip-text text-transparent">
                SANJEEVNI
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 border border-brand-200">
                SIH 26181
              </span>
            </div>
            <p className="text-xs font-medium text-slate-500 hidden sm:block">
              Disaster-Aware Health Companion • Team BrajCoders (ID: 1111)
            </p>
          </div>
        </div>

        {/* Center: Scenario Quick-Selector (Visible when simulator is active) */}
        {isSimulatorOn && (
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-rosebud-50/80 border border-rosebud-200 shadow-inner text-xs">
            <span className="font-semibold text-rosebud-600 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" /> Disaster Scenario:
            </span>
            <select
              value={activeScenario}
              onChange={(e) => onSelectScenario(e.target.value as DisasterScenario)}
              aria-label="Select disaster scenario"
              className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer pr-1"
            >
              <option value="NORMAL_REST">🌿 Normal Baseline (Resting)</option>
              <option value="HEAT_WAVE">🔥 Severe Heat Wave (43.5°C & 72% RH)</option>
              <option value="HAZARDOUS_AQI">💨 Toxic Air Pollution (AQI 340+)</option>
              <option value="FALL_IMPACT">⚠️ Slip & Fall Impact Event</option>
              <option value="CARDIAC_ARRHYTHMIA">💓 Cardiac Tachycardia Spike (145 BPM)</option>
              <option value="FLOOD_SATURATION">🌊 Flood Water Saturation (92% Wet)</option>
            </select>
          </div>
        )}

        {/* Right: Controls & Connection Badges */}
        <div className="flex items-center gap-3">
          {/* Vulnerability Profile Selector */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-xs">
            <User className="w-3.5 h-3.5 text-brand-600" />
            <select
              value={userProfile.profileType}
              onChange={(e) => onSelectProfile(e.target.value as VulnerabilityProfile)}
              aria-label="Select user vulnerability profile"
              className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="STANDARD">General Citizen</option>
              <option value="OUTDOOR_WORKER">Outdoor Worker (High Heat Risk)</option>
              <option value="ELDERLY">Elderly Individual (High Fall/AQI Risk)</option>
              <option value="CHRONIC_CARDIAC">Cardiac Sensitive Profile</option>
            </select>
          </div>

          {/* Demo Simulator Toggle */}
          <button
            onClick={onToggleSimulator}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm ${
              isSimulatorOn
                ? "bg-gradient-to-r from-rosebud-400 to-rosebud-500 text-white shadow-rosebud-400/30"
                : "bg-white text-slate-600 border border-purple-200 hover:bg-purple-50"
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${isSimulatorOn ? "animate-spin" : ""}`} />
            <span>Simulator {isSimulatorOn ? "ON" : "OFF"}</span>
          </button>

          {/* USB Serial Connect / Disconnect */}
          {serialState === "CONNECTED" ? (
            <button
              onClick={onDisconnectUsb}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 transition-all shadow-sm shadow-emerald-500/20"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>USB Online (115200)</span>
            </button>
          ) : (
            <button
              onClick={onConnectUsb}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white text-xs font-semibold transition-all shadow-sm shadow-brand-600/20"
            >
              <Usb className="w-3.5 h-3.5" />
              <span>Connect ESP32 (USB)</span>
            </button>
          )}

          {/* Manual Emergency SOS Trigger */}
          <button
            onClick={onManualSos}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold transition-all"
            title="Trigger Manual SOS Broadcast"
          >
            <AlertTriangle className="w-4 h-4 text-red-500 animate-bounce" />
            <span className="hidden md:inline">SOS</span>
          </button>
        </div>
      </div>
    </header>
  );
};
