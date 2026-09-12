// =============================================================================
// src/components/Navbar.tsx
// Header Navbar with USB Serial Connection & User Profile Switcher
// =============================================================================

import React from "react";
import {
  Usb,
  AlertTriangle,
  HeartPulse,
  User,
  CheckCircle2,
  XCircle,
  Radio,
} from "lucide-react";
import { SerialConnectionState } from "../services/serialService";
import { UserProfile, VulnerabilityProfile } from "../types/telemetry";

interface NavbarProps {
  serialState: SerialConnectionState;
  serialMessage: string;
  userProfile: UserProfile;
  onConnectUsb: () => void;
  onDisconnectUsb: () => void;
  onSelectProfile: (profile: VulnerabilityProfile) => void;
  onManualSos: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  serialState,
  userProfile,
  onConnectUsb,
  onDisconnectUsb,
  onSelectProfile,
  onManualSos,
}) => {
  const isConnected = serialState === "CONNECTED";

  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-purple-100 shadow-sm transition-all">
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

        {/* Center: Hardware Status Indicator */}
        <div className="hidden md:flex items-center gap-2">
          {isConnected ? (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Real-Time Telemetry Streaming (115200 Baud)</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-800 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Hardware Disconnected — Awaiting USB Cable</span>
            </div>
          )}
        </div>

        {/* Right: Controls & Connection Buttons */}
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

          {/* USB Serial Connect / Disconnect */}
          {isConnected ? (
            <button
              onClick={onDisconnectUsb}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all shadow-sm shadow-emerald-600/30"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>USB Connected</span>
            </button>
          ) : (
            <button
              onClick={onConnectUsb}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-brand-600 via-brand-700 to-rosebud-500 hover:opacity-95 text-white text-xs font-bold transition-all shadow-md shadow-brand-500/25 animate-pulse"
            >
              <Usb className="w-4 h-4" />
              <span>Connect ESP32 (USB)</span>
            </button>
          )}

          {/* Manual Emergency SOS Trigger */}
          <button
            onClick={onManualSos}
            className="flex items-center gap-1 px-3 py-2.5 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold transition-all"
            title="Trigger Manual SOS Broadcast"
          >
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="hidden md:inline">SOS</span>
          </button>
        </div>
      </div>
    </header>
  );
};
