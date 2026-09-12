// =============================================================================
// src/components/PersonalWellnessCard.tsx
// Daily Sanjeevni Health Score, Personal Baseline Drift & Fatigue Monitor
// =============================================================================

import React from "react";
import { Sparkles, TrendingUp, TrendingDown, BatteryCharging, Heart, Shield } from "lucide-react";
import { UserProfile } from "../types/telemetry";

interface PersonalWellnessCardProps {
  healthScore: number;
  baselineDriftPct: number;
  fatigueIndex: number;
  restingHrBaseline: number;
  currentHr: number;
  userProfile: UserProfile;
}

export const PersonalWellnessCard: React.FC<PersonalWellnessCardProps> = ({
  healthScore,
  baselineDriftPct,
  fatigueIndex,
  restingHrBaseline,
  currentHr,
  userProfile,
}) => {
  // Score color gradient
  const getScoreColor = () => {
    if (healthScore >= 80) return "from-emerald-500 to-teal-400 text-emerald-600";
    if (healthScore >= 60) return "from-amber-500 to-yellow-400 text-amber-600";
    return "from-rosebud-500 to-red-500 text-rosebud-600";
  };

  return (
    <div className="glass-card rounded-3xl p-6 transition-all shadow-soft flex flex-col justify-between">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-rosebud-500 to-brand-400 flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Personal Health Index</h3>
              <p className="text-xs text-slate-500">Adaptive Edge Personalization</p>
            </div>
          </div>

          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-purple-50 text-brand-700 border border-purple-200">
            {userProfile.name}
          </span>
        </div>

        {/* Circular Health Score Badge */}
        <div className="bg-gradient-to-r from-purple-50/70 via-pink-50/70 to-white rounded-2xl p-5 border border-purple-100 flex items-center justify-between gap-4 mb-4">
          <div>
            <div className="text-xs font-semibold text-slate-500">Sanjeevni Health Score</div>
            <div className="text-3xl font-black tracking-tight text-brand-900 mt-0.5 flex items-baseline gap-1">
              {healthScore}
              <span className="text-xs font-semibold text-slate-400">/ 100</span>
            </div>
            <div className="text-[11px] font-medium text-slate-600 mt-1">
              {healthScore >= 80
                ? "✨ Vitals & disaster resilience optimal"
                : healthScore >= 60
                ? "⚠️ Mild physiological stress / heat burden"
                : "🚨 High environmental distress or cardiac strain"}
            </div>
          </div>

          <div className="relative w-16 h-16 flex items-center justify-center flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="5"
                className="text-purple-100"
                fill="transparent"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="5"
                strokeDasharray={175.9}
                strokeDashoffset={175.9 - (175.9 * healthScore) / 100}
                strokeLinecap="round"
                className={`transition-all duration-700 ${
                  healthScore >= 80 ? "text-emerald-500" : healthScore >= 60 ? "text-amber-500" : "text-rosebud-500"
                }`}
                fill="transparent"
              />
            </svg>
            <Shield className="w-6 h-6 text-brand-700 absolute" />
          </div>
        </div>

        {/* 2-Metric Grid: Baseline Drift & Fatigue */}
        <div className="grid grid-cols-2 gap-3">
          {/* Baseline Drift */}
          <div className="p-3.5 rounded-2xl bg-white border border-purple-100 shadow-xs">
            <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
              <Heart className="w-3 h-3 text-rosebud-500" />
              Resting HR Drift
            </div>
            <div className="text-lg font-bold text-slate-800 mt-1 flex items-center gap-1">
              {baselineDriftPct > 0 ? `+${baselineDriftPct}%` : `${baselineDriftPct}%`}
              {baselineDriftPct > 15 ? (
                <TrendingUp className="w-4 h-4 text-red-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-emerald-500" />
              )}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Base: {restingHrBaseline} → Now: {currentHr} BPM
            </div>
          </div>

          {/* Autonomic Fatigue */}
          <div className="p-3.5 rounded-2xl bg-white border border-purple-100 shadow-xs">
            <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
              <BatteryCharging className="w-3 h-3 text-brand-600" />
              Fatigue / Stress
            </div>
            <div className="text-lg font-bold text-slate-800 mt-1">
              {fatigueIndex}%
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Derived from HRV RMSSD
            </div>
          </div>
        </div>
      </div>

      {/* Footer Advisory */}
      <div className="mt-5 pt-3 border-t border-purple-100 text-[11px] text-slate-500 flex items-center justify-between">
        <span>Profile: <b>{userProfile.profileType.replace("_", " ")}</b></span>
        <span>Daily Target: <b>{userProfile.dailyWaterIntakeLiters}L fluids</b></span>
      </div>
    </div>
  );
};
