// =============================================================================
// src/components/DisasterAlertCenter.tsx
// SIH 26181: Heatwaves, Air Pollution (AQI), Floods & Disaster Resilience Center
// =============================================================================

import React from "react";
import {
  Flame,
  Wind,
  Droplets,
  AlertTriangle,
  ShieldCheck,
  Thermometer,
  CloudSun,
  Activity,
  HeartCrack,
  CheckCircle,
} from "lucide-react";
import { DisasterAlert, LiveVitals, UserProfile } from "../types/telemetry";

interface DisasterAlertCenterProps {
  vitals: LiveVitals;
  alerts: DisasterAlert[];
  userProfile: UserProfile;
}

export const DisasterAlertCenter: React.FC<DisasterAlertCenterProps> = ({
  vitals,
  alerts,
  userProfile,
}) => {
  const {
    temperatureC,
    humidityPct,
    heatIndexC,
    calculatedAqi,
    aqiCategory,
    moisturePercent,
    heartRate,
  } = vitals;

  // Heat Index Risk evaluation
  const getHeatBadge = () => {
    if (heatIndexC >= 45) {
      return { label: "Danger (Heat Stroke Risk)", color: "bg-red-500 text-white animate-pulse" };
    } else if (heatIndexC >= 39) {
      return { label: "Extreme Caution", color: "bg-orange-500 text-white" };
    } else if (heatIndexC >= 33) {
      return { label: "Caution (Fatigue Likely)", color: "bg-amber-400 text-slate-900" };
    }
    return { label: "Safe / Optimal", color: "bg-emerald-500 text-white" };
  };

  // AQI Risk evaluation
  const getAqiBadge = () => {
    if (calculatedAqi > 300) {
      return { label: "Severe / Hazardous", color: "bg-red-600 text-white animate-pulse" };
    } else if (calculatedAqi > 200) {
      return { label: "Very Poor", color: "bg-purple-600 text-white" };
    } else if (calculatedAqi > 100) {
      return { label: "Moderate", color: "bg-amber-500 text-white" };
    }
    return { label: "Good Air Quality", color: "bg-emerald-500 text-white" };
  };

  // Moisture Risk evaluation
  const getMoistureBadge = () => {
    if (moisturePercent >= 75) {
      return { label: "Severe Saturation (Flood)", color: "bg-blue-600 text-white animate-pulse" };
    } else if (moisturePercent >= 50) {
      return { label: "Damp Clothing", color: "bg-blue-400 text-white" };
    }
    return { label: "Dry / Normal", color: "bg-emerald-500 text-white" };
  };

  const heatBadge = getHeatBadge();
  const aqiBadge = getAqiBadge();
  const moistureBadge = getMoistureBadge();

  return (
    <div className="space-y-6">
      {/* Active High-Priority Disaster Banner (if any) */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`rounded-3xl p-5 border flex items-start gap-4 shadow-sm transition-all ${
                alert.severity === "CRITICAL"
                  ? "bg-red-50/90 border-red-200 text-red-950"
                  : alert.severity === "HIGH"
                  ? "bg-orange-50/90 border-orange-200 text-orange-950"
                  : "bg-purple-50/90 border-purple-200 text-purple-950"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 text-white ${
                  alert.severity === "CRITICAL"
                    ? "bg-red-500 shadow-md shadow-red-500/30 animate-bounce"
                    : alert.severity === "HIGH"
                    ? "bg-orange-500 shadow-md shadow-orange-500/30"
                    : "bg-brand-600"
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>

              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-base font-bold tracking-tight">{alert.title}</h4>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-white/80 border border-current shadow-xs">
                    {alert.severity} EARLY WARNING
                  </span>
                </div>
                <p className="text-sm mt-1 opacity-90">{alert.description}</p>
                <div className="mt-3 p-3 rounded-2xl bg-white/70 border border-current/10 text-xs font-semibold flex items-center gap-2">
                  <span className="font-bold uppercase tracking-wider text-rosebud-600">Action:</span>
                  <span>{alert.actionableGuidance}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3 Core Disaster Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pillar 1: Heatwave & Dehydration */}
        <div className="glass-card glass-card-hover rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-orange-100/50 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-400 flex items-center justify-center text-white shadow-sm">
                <Flame className="w-5 h-5" />
              </div>
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${heatBadge.color}`}>
                {heatBadge.label}
              </span>
            </div>

            <h3 className="text-base font-bold text-slate-800">Heat Stress & Dehydration</h3>
            <p className="text-xs text-slate-500 mt-0.5">Rothfusz Index • IMD Regional Criteria</p>

            <div className="mt-5 space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-medium text-slate-500">Calculated Heat Index:</span>
                <span className="text-2xl font-extrabold text-orange-600">
                  {heatIndexC}°C{" "}
                  <span className="text-xs font-semibold text-slate-500">
                    ({((heatIndexC * 9) / 5 + 32).toFixed(1)}°F)
                  </span>
                </span>
              </div>

              <div className="flex justify-between text-xs text-slate-600">
                <span>Ambient Temp: <b>{temperatureC}°C</b></span>
                <span>Relative Humidity: <b>{humidityPct}%</b></span>
              </div>

              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-400 via-amber-400 to-red-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, (heatIndexC - 20) * 2.5))}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-purple-100 text-xs text-slate-600 bg-orange-50/50 -mx-6 -mb-6 p-4 rounded-b-3xl">
            <span className="font-bold text-orange-800">Hydration Target:</span>{" "}
            {heatIndexC > 40
              ? "750 mL cold electrolyte water every 30 mins; halt direct outdoor labor."
              : heatIndexC > 34
              ? "500 mL water every hour; wear loose cotton clothing."
              : "Standard 2.5L daily hydration regimen sufficient."}
          </div>
        </div>

        {/* Pillar 2: Air Pollution & AQI Respiratory Risk */}
        <div className="glass-card glass-card-hover rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-purple-100/50 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-400 flex items-center justify-center text-white shadow-sm">
                <Wind className="w-5 h-5" />
              </div>
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${aqiBadge.color}`}>
                {aqiBadge.label}
              </span>
            </div>

            <h3 className="text-base font-bold text-slate-800">Air Pollution & AQI</h3>
            <p className="text-xs text-slate-500 mt-0.5">Collar MQ135 • CPCB Air Quality Band</p>

            <div className="mt-5 space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-medium text-slate-500">CPCB AQI Value:</span>
                <span className="text-2xl font-extrabold text-brand-800">
                  {calculatedAqi} <span className="text-xs font-medium text-slate-500">/ 500</span>
                </span>
              </div>

              <div className="flex justify-between text-xs text-slate-600">
                <span>Category: <b>{aqiCategory}</b></span>
                <span>MQ135 ADC: <b>{vitals.rawMq135}</b></span>
              </div>

              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-400 via-amber-400 to-purple-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (calculatedAqi / 450) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-purple-100 text-xs text-slate-600 bg-purple-50/50 -mx-6 -mb-6 p-4 rounded-b-3xl">
            <span className="font-bold text-brand-800">Respiratory Protocol:</span>{" "}
            {calculatedAqi > 300
              ? "Equip certified N95 respirator mask. Severe lung irritants present."
              : calculatedAqi > 150
              ? "Vulnerable individuals & elderly should avoid prolonged outdoor exposure."
              : "Air quality is within acceptable safety parameters."}
          </div>
        </div>

        {/* Pillar 3: Flood, Cyclone & Waterborne Dampness */}
        <div className="glass-card glass-card-hover rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-blue-100/50 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center text-white shadow-sm">
                <Droplets className="w-5 h-5" />
              </div>
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${moistureBadge.color}`}>
                {moistureBadge.label}
              </span>
            </div>

            <h3 className="text-base font-bold text-slate-800">Flood & Garment Dampness</h3>
            <p className="text-xs text-slate-500 mt-0.5">Embedded Moisture Probe • Fungal / Trench Foot</p>

            <div className="mt-5 space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-medium text-slate-500">Fabric Saturation:</span>
                <span className="text-2xl font-extrabold text-blue-600">
                  {moisturePercent}%
                </span>
              </div>

              <div className="flex justify-between text-xs text-slate-600">
                <span>Immersion Status: <b>{moisturePercent > 70 ? "Wet / Immersed" : "Dry Fabric"}</b></span>
                <span>Moisture Raw: <b>{vitals.rawSoilMoisture}</b></span>
              </div>

              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-300 via-blue-400 to-blue-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${moisturePercent}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-purple-100 text-xs text-slate-600 bg-blue-50/50 -mx-6 -mb-6 p-4 rounded-b-3xl">
            <span className="font-bold text-blue-800">Infection Advisory:</span>{" "}
            {moisturePercent > 75
              ? "High risk of fungal dermatitis and immersion foot. Clean skin with antiseptic."
              : "Textile moisture normal. No pathogen stagnation detected."}
          </div>
        </div>
      </div>
    </div>
  );
};
