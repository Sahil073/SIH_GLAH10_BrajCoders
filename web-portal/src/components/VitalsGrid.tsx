// =============================================================================
// src/components/VitalsGrid.tsx
// High-Level Overview Grid for Multi-Sensor Telemetry (Real-Data Strict)
// =============================================================================

import React from "react";
import {
  Heart,
  Thermometer,
  CloudRain,
  Flame,
  Wind,
  Droplets,
} from "lucide-react";
import { LiveVitals } from "../types/telemetry";

interface VitalsGridProps {
  vitals: LiveVitals;
}

export const VitalsGrid: React.FC<VitalsGridProps> = ({ vitals }) => {
  const {
    isConnected,
    heartRate,
    hrvRmssd,
    temperatureC,
    humidityPct,
    heatIndexC,
    calculatedAqi,
    aqiCategory,
    moisturePercent,
  } = vitals;

  const cards = [
    {
      title: "Heart Rhythm",
      value: isConnected && heartRate !== null ? `${heartRate}` : "--",
      unit: "BPM",
      subtitle: isConnected && hrvRmssd !== null ? `HRV RMSSD: ${hrvRmssd} ms` : "Awaiting BioAmp EXG",
      icon: Heart,
      gradient: "from-rosebud-500 to-pink-400",
      status: !isConnected || heartRate === null ? "Offline" : heartRate > 100 ? "Elevated" : "Normal",
      statusColor:
        !isConnected || heartRate === null
          ? "text-slate-500 bg-slate-100 border-slate-200"
          : heartRate > 100
          ? "text-red-600 bg-red-50 border-red-200"
          : "text-emerald-700 bg-emerald-50 border-emerald-200",
    },
    {
      title: "Ambient Temp",
      value: isConnected && temperatureC !== null ? `${temperatureC}` : "--",
      unit: "°C",
      subtitle: isConnected && temperatureC !== null ? "DHT11 on-garment" : "Awaiting DHT11",
      icon: Thermometer,
      gradient: "from-amber-500 to-orange-400",
      status: !isConnected || temperatureC === null ? "Offline" : temperatureC > 38 ? "Hot" : "Normal",
      statusColor:
        !isConnected || temperatureC === null
          ? "text-slate-500 bg-slate-100 border-slate-200"
          : temperatureC > 38
          ? "text-orange-700 bg-orange-50 border-orange-200"
          : "text-emerald-700 bg-emerald-50 border-emerald-200",
    },
    {
      title: "Air Humidity",
      value: isConnected && humidityPct !== null ? `${humidityPct}` : "--",
      unit: "%",
      subtitle: isConnected && humidityPct !== null ? "Relative moisture" : "Awaiting DHT11",
      icon: CloudRain,
      gradient: "from-blue-500 to-cyan-400",
      status: !isConnected || humidityPct === null ? "Offline" : humidityPct > 70 ? "Humid" : "Optimal",
      statusColor:
        !isConnected || humidityPct === null
          ? "text-slate-500 bg-slate-100 border-slate-200"
          : humidityPct > 70
          ? "text-blue-700 bg-blue-50 border-blue-200"
          : "text-emerald-700 bg-emerald-50 border-emerald-200",
    },
    {
      title: "Heat Index",
      value: isConnected && heatIndexC !== null ? `${heatIndexC}` : "--",
      unit: "°C",
      subtitle: isConnected && heatIndexC !== null ? "Feels-like thermal stress" : "Awaiting data",
      icon: Flame,
      gradient: "from-orange-500 to-rosebud-500",
      status:
        !isConnected || heatIndexC === null
          ? "Offline"
          : heatIndexC > 40
          ? "Danger"
          : heatIndexC > 33
          ? "Caution"
          : "Safe",
      statusColor:
        !isConnected || heatIndexC === null
          ? "text-slate-500 bg-slate-100 border-slate-200"
          : heatIndexC > 40
          ? "text-red-700 bg-red-50 border-red-200"
          : heatIndexC > 33
          ? "text-amber-700 bg-amber-50 border-amber-200"
          : "text-emerald-700 bg-emerald-50 border-emerald-200",
    },
    {
      title: "Air Quality (AQI)",
      value: isConnected && calculatedAqi !== null ? `${calculatedAqi}` : "--",
      unit: "/ 500",
      subtitle: isConnected && aqiCategory !== null ? `CPCB: ${aqiCategory}` : "Awaiting MQ135",
      icon: Wind,
      gradient: "from-brand-600 to-indigo-500",
      status: !isConnected || calculatedAqi === null ? "Offline" : aqiCategory || "Evaluating",
      statusColor:
        !isConnected || calculatedAqi === null
          ? "text-slate-500 bg-slate-100 border-slate-200"
          : calculatedAqi > 200
          ? "text-red-700 bg-red-50 border-red-200"
          : calculatedAqi > 100
          ? "text-amber-700 bg-amber-50 border-amber-200"
          : "text-emerald-700 bg-emerald-50 border-emerald-200",
    },
    {
      title: "Garment Moisture",
      value: isConnected && moisturePercent !== null ? `${moisturePercent}` : "--",
      unit: "%",
      subtitle: isConnected && moisturePercent !== null ? "Fabric saturation" : "Awaiting Probe",
      icon: Droplets,
      gradient: "from-cyan-500 to-blue-500",
      status: !isConnected || moisturePercent === null ? "Offline" : moisturePercent > 70 ? "Immersed" : "Dry",
      statusColor:
        !isConnected || moisturePercent === null
          ? "text-slate-500 bg-slate-100 border-slate-200"
          : moisturePercent > 70
          ? "text-blue-700 bg-blue-50 border-blue-200"
          : "text-emerald-700 bg-emerald-50 border-emerald-200",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="glass-card glass-card-hover rounded-3xl p-4 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between gap-1 mb-2">
              <div
                className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${card.gradient} flex items-center justify-center text-white shadow-xs opacity-${
                  isConnected ? "100" : "60"
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${card.statusColor}`}>
                {card.status}
              </span>
            </div>

            <div>
              <div className="text-[11px] font-medium text-slate-500">{card.title}</div>
              <div className="text-xl font-black text-slate-800 tracking-tight flex items-baseline gap-1 mt-0.5">
                {card.value}
                <span className="text-[10px] font-semibold text-slate-400">{card.unit}</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1 truncate">{card.subtitle}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
