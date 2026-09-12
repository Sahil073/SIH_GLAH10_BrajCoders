// =============================================================================
// src/components/MotionMonitor.tsx
// 3-Axis ADXL345 Acceleration, Activity Classification & Fall Detection
// =============================================================================

import React from "react";
import { Activity, ShieldAlert, Move, AlertOctagon, Check, Usb } from "lucide-react";
import { ActivityState, FallStage } from "../types/telemetry";

interface MotionMonitorProps {
  isConnected: boolean;
  motion: {
    x: number;
    y: number;
    z: number;
    magnitude: number;
    activity: ActivityState;
    fallDetected: boolean;
    fallStage: FallStage;
    fallConfidence: number;
  };
}

export const MotionMonitor: React.FC<MotionMonitorProps> = ({ isConnected, motion }) => {
  const { x, y, z, magnitude, activity, fallDetected, fallStage } = motion;

  // Activity pill styling
  const getActivityBadge = () => {
    if (!isConnected) {
      return { text: "USB Disconnected", color: "bg-slate-100 text-slate-600 border-slate-200" };
    }
    switch (activity) {
      case "REST":
        return { text: "Resting / Sedentary", color: "bg-purple-100 text-brand-800 border-purple-200" };
      case "LIGHT":
        return { text: "Light Movement", color: "bg-blue-100 text-blue-800 border-blue-200" };
      case "ACTIVE":
        return { text: "Active Walking", color: "bg-emerald-100 text-emerald-800 border-emerald-200" };
      case "VIGOROUS":
        return { text: "Vigorous Exertion", color: "bg-rosebud-100 text-rosebud-800 border-rosebud-200" };
      default:
        return { text: "Standby", color: "bg-slate-100 text-slate-600 border-slate-200" };
    }
  };

  const activityBadge = getActivityBadge();

  // Normalize bar percentage (-15 m/s^2 to +15 m/s^2 mapped to 0-100%)
  const normalizeBar = (val: number) => {
    if (!isConnected) return 50;
    const clamped = Math.max(-16, Math.min(16, val));
    return ((clamped + 16) / 32) * 100;
  };

  return (
    <div className="glass-card rounded-3xl p-6 transition-all shadow-soft flex flex-col justify-between">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-brand-500 to-purple-400 flex items-center justify-center text-white shadow-sm">
              <Move className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">3-Axis Motion & Posture</h3>
              <p className="text-xs text-slate-500">ADXL345 I2C @ 25 Hz TX</p>
            </div>
          </div>

          <div className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${activityBadge.color}`}>
            {activityBadge.text}
          </div>
        </div>

        {/* Vector Magnitude Overview */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 border border-purple-100/80 mb-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">Acceleration Magnitude</div>
            <div className="text-2xl font-extrabold text-brand-900 tracking-tight flex items-baseline gap-1">
              {isConnected ? magnitude.toFixed(2) : "--"}
              <span className="text-xs font-semibold text-brand-600">m/s²</span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs font-medium text-slate-500">Earth Gravity Norm</div>
            <div className="text-sm font-bold text-slate-700">
              {isConnected ? (magnitude / 9.806).toFixed(2) : "--"}{" "}
              <span className="text-xs font-normal">g</span>
            </div>
          </div>
        </div>

        {/* X, Y, Z Vector Breakdown */}
        <div className="space-y-3">
          {/* X Axis */}
          <div>
            <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
              <span className="font-bold text-brand-700">X-Axis (Lateral):</span>
              <span className="font-mono">{isConnected ? `${x.toFixed(2)} m/s²` : "--"}</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-brand-500 h-full rounded-full transition-all duration-75"
                style={{ width: `${normalizeBar(x)}%` }}
              />
            </div>
          </div>

          {/* Y Axis */}
          <div>
            <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
              <span className="font-bold text-rosebud-600">Y-Axis (Vertical):</span>
              <span className="font-mono">{isConnected ? `${y.toFixed(2)} m/s²` : "--"}</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-rosebud-500 h-full rounded-full transition-all duration-75"
                style={{ width: `${normalizeBar(y)}%` }}
              />
            </div>
          </div>

          {/* Z Axis */}
          <div>
            <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
              <span className="font-bold text-purple-600">Z-Axis (Dorsal/Chest):</span>
              <span className="font-mono">{isConnected ? `${z.toFixed(2)} m/s²` : "--"}</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-purple-600 h-full rounded-full transition-all duration-75"
                style={{ width: `${normalizeBar(z)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Fall Detection State Machine Banner */}
      <div className="mt-5 pt-4 border-t border-purple-100">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-brand-600" /> Fall Guard System:
          </span>

          {!isConnected ? (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
              USB Disconnected
            </span>
          ) : fallDetected || fallStage === "CONFIRMED" ? (
            <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-red-100 text-red-700 border border-red-200 flex items-center gap-1 animate-pulse">
              <AlertOctagon className="w-3.5 h-3.5" /> IMPACT CONFIRMED
            </span>
          ) : fallStage === "FREEFALL" ? (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 animate-bounce">
              Freefall Dip (&lt;4.5m/s²)
            </span>
          ) : fallStage === "IMPACT" ? (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200">
              Impact Spike (&gt;23m/s²)
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Normal Posture
            </span>
          )}
        </div>

        {/* Motion Artifact Gating Explanation */}
        <p className="text-[11px] text-slate-500 mt-2">
          {!isConnected
            ? "Connect USB cable to stream real-time motion vectors from ADXL345."
            : activity === "VIGOROUS" || activity === "ACTIVE"
            ? "⚠️ High motion active — false-alarm gate suppresses non-critical cardiac warnings."
            : "✓ Stable resting baseline — full biopotential sensitivity enabled."}
        </p>
      </div>
    </div>
  );
};
