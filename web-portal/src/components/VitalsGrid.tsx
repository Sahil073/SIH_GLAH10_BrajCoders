// =============================================================================
// src/components/VitalsGrid.tsx
// High-Level Overview Grid for Multi-Sensor Telemetry
// =============================================================================

import React from "react";
import {
  Heart,
  Thermometer,
  CloudRain,
  Flame,
  Wind,
  Droplets,
  Activity,
} from "lucide-react";
import { LiveVitals } from "../types/telemetry";

interface VitalsGridProps {
  vitals: LiveVitals;
}

export const VitalsGrid: React.FC<VitalsGridProps> = ({ vitals }) => {
  const {
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
      value: `${heartRate}`,
      unit: "BPM",
      subtitle: `HRV RMSSD: ${hrvRmssd} ms`,
      icon: Heart,
      gradient: "from-rosebud-500 to-pink-400",
      status: heartRate > 100 ? "Elevated" : "Normal",
      statusColor: heartRate > 100 ? "text-red-600 bg-red-50 border-red-200" : "text-emerald-700 bg-emerald-50 border-emerald-200",
    },
    {
      title: "Ambient Temp",
      value: `${temperatureC}`,
      unit: "°C",
      subtitle: `DHT11 on-garment`,
      icon: Thermometer,
      gradient: "from-amber-500 to-orange-400",
      status: temperatureC > 38 ? "Hot" : "Normal",
      statusColor: temperatureC > 38 ? "text-orange-700 bg-orange-50 border-orange-200" : "text-emerald-700 bg-emerald-50 border-emerald-200",
    },
    {
      title: "Air Humidity",
      value: `${humidityPct}`,
      unit: "%",
      subtitle: `Relative moisture`,
      icon: CloudRain,
      gradient: "from-blue-500 to-cyan-400",
      status: humidityPct > 70 ? "Humid" : "Optimal",
      statusColor: humidityPct > 70 ? "text-blue-700 bg-blue-50 border-blue-200" : "text-emerald-700 bg-emerald-50 border-emerald-200",
    },
    {
      title: "Heat Index",
      value: `${heatIndexC}`,
      unit: "°C",
      subtitle: `Feels-like thermal stress`,
      icon: Flame,
      gradient: "from-orange-500 to-rosebud-500",
      status: heatIndexC > 40 ? "Danger" : heatIndexC > 33 ? "Caution" : "Safe",
      statusColor: heatIndexC > 40 ? "text-red-700 bg-red-50 border-red-200" : heatIndexC > 33 ? "text-amber-700 bg-amber-50 border-amber-200" : "text-emerald-700 bg-emerald-50 border-emerald-200",
    },
    {
      title: "Air Quality (AQI)",
      value: `${calculatedAqi}`,
      unit: "/ 500",
      subtitle: `CPCB: ${aqiCategory}`,
      icon: Wind,
      gradient: "from-brand-600 to-indigo-500",
      status: aqiCategory,
      statusColor: calculatedAqi > 200 ? "text-red-700 bg-red-50 border-red-200" : calculatedAqi > 100 ? "text-amber-700 bg-amber-50 border-amber-200" : "text-emerald-700 bg-emerald-50 border-emerald-200",
    },
    {
      title: "Garment Moisture",
      value: `${moisturePercent}`,
      unit: "%",
      subtitle: `Fabric hydration`,
      icon: Droplets,
      gradient: "from-cyan-500 to-blue-500",
      status: moisturePercent > 70 ? "Immersed" : "Dry",
      statusColor: moisturePercent > 70 ? "text-blue-700 bg-blue-50 border-blue-200" : "text-emerald-700 bg-emerald-50 border-emerald-200",
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
              <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${card.gradient} flex items-center justify-center text-white shadow-xs`}>
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
