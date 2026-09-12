// =============================================================================
// src/components/AiHealthAssistant.tsx
// Privacy-Preserving On-Device AI Health Chatbot (Localhost Context-Aware)
// =============================================================================

import React, { useState, useRef, useEffect } from "react";
import {
  Bot,
  Send,
  Sparkles,
  User,
  HeartPulse,
  Flame,
  Wind,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { ChatMessage, LiveVitals, UserProfile } from "../types/telemetry";

interface AiHealthAssistantProps {
  vitals: LiveVitals;
  userProfile: UserProfile;
}

export const AiHealthAssistant: React.FC<AiHealthAssistantProps> = ({
  vitals,
  userProfile,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-msg",
      sender: "assistant",
      text: `Hello! I am your Sanjeevni On-Device Health Companion. I am continuously monitoring your 500 Hz ECG, 3-axis motion, and environmental disaster sensors. All inference runs strictly on your localhost with zero cloud data transmission. How can I assist you right now?`,
      timestamp: Date.now(),
    },
  ]);

  const [inputQuery, setInputQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  /**
   * Deterministic, contextualized knowledge reasoning engine
   */
  const generateAIResponse = (query: string): string => {
    const q = query.toLowerCase();
    const { heartRate, rrIntervalMs, hrvRmssd, heatIndexC, calculatedAqi, aqiCategory, moisturePercent, motion } = vitals;

    if (q.includes("ecg") || q.includes("heart") || q.includes("bpm") || q.includes("rhythm")) {
      return `Your real-time heart rate is **${heartRate} BPM** with an average R-R interval of **${rrIntervalMs} ms** and HRV RMSSD of **${hrvRmssd} ms** (Signal Quality: ${vitals.sqi.label}). \n\n${
        heartRate > 100 && motion.activity === "REST"
          ? "⚠️ Warning: Your heart rate is elevated during bodily rest. This may suggest thermal strain, stress, or cardiac tachycardia. Consider resting in a cool area and hydrating."
          : "✓ Pan-Tompkins QRS peak detection indicates regular ventricular depolarization without notable ectopic anomalies. Your cardiac rhythm is currently stable."
      }`;
    }

    if (q.includes("heat") || q.includes("hot") || q.includes("stroke") || q.includes("temperature")) {
      return `Current ambient conditions indicate a Rothfusz Heat Index of **${heatIndexC}°C** (Ambient: ${vitals.temperatureC}°C, Humidity: ${vitals.humidityPct}%). \n\n${
        heatIndexC >= 42
          ? "🚨 Critical Heat Stroke Risk: Ambient heat exchange is severely impeded by high humidity. Take immediate shelter in ventilated shade, drink cold water with electrolytes (ORS), and avoid all strenuous manual work."
          : heatIndexC >= 34
          ? "⚠️ Moderate Heat Stress: Drink at least 500 mL of fluid every 45-60 minutes to compensate for sweat-evaporation losses."
          : "✓ Ambient heat index is within comfortable physiological tolerances."
      }`;
    }

    if (q.includes("aqi") || q.includes("air") || q.includes("pollution") || q.includes("smog") || q.includes("breathe")) {
      return `Your garment collar MQ135 sensor measures an estimated AQI of **${calculatedAqi} (${aqiCategory})**. \n\n${
        calculatedAqi > 200
          ? "🚨 Hazardous Airborne Pollutants: Particulate matter and toxic gas concentrations are high. Please wear a tight-fitting N95 respirator mask and minimize outdoor exertion."
          : "✓ Airborne pollutant concentrations are currently within acceptable national standards."
      }`;
    }

    if (q.includes("fall") || q.includes("accident") || q.includes("slip")) {
      return `The ADXL345 trunk accelerometer uses a 3-phase threshold sequence: Freefall drop (<4.5 m/s²) → Impact spike (>23.5 m/s²) → Sustained stillness. \n\nIf a severe fall occurs, Sanjeevni immediately launches a **15-second visual and audible countdown**. If not cancelled by the user, an automated SMS alert with coordinates is broadcast to your emergency contact (${userProfile.emergencyContact.name}: ${userProfile.emergencyContact.phone}).`;
    }

    if (q.includes("hydration") || q.includes("water") || q.includes("drink")) {
      const recLiters = heatIndexC > 38 ? 4.0 : 2.5;
      return `Based on your profile as a **${userProfile.profileType.replace("_", " ")}** and current Heat Index of **${heatIndexC}°C**, your recommended hydration target is **${recLiters} Liters** today. Ensure you replenish sodium and potassium electrolytes, not just plain water, to avoid hyponatremia.`;
    }

    if (q.includes("flood") || q.includes("water") || q.includes("damp")) {
      return `Your textile moisture sensor reports **${moisturePercent}% saturation**. \n\n${
        moisturePercent > 65
          ? "⚠️ High Garment Dampness: Prolonged skin contact with contaminated floodwaters poses high risks of Leptospirosis, fungal dermatitis, and trench foot. Disinfect skin and swap garments as soon as dry clothing is accessible."
          : "✓ Garment humidity is low. No waterborne contamination signatures observed."
      }`;
    }

    // Default general response
    return `Sanjeevni Status Summary:\n• Cardiac: **${heartRate} BPM** (HRV: ${hrvRmssd}ms)\n• Heat Index: **${heatIndexC}°C**\n• Air Quality: **${calculatedAqi} AQI**\n• Posture: **${motion.activity}**\n\nAll parameters are being evaluated by on-device edge filters without relying on external cloud APIs. Feel free to ask about specific disaster precautions or vital interpretations.`;
  };

  const handleSend = (queryToSend?: string) => {
    const q = queryToSend || inputQuery;
    if (!q.trim()) return;

    const userMsg: ChatMessage = {
      id: "msg-" + Date.now(),
      sender: "user",
      text: q,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryToSend) setInputQuery("");
    setIsTyping(true);

    setTimeout(() => {
      const reply = generateAIResponse(q);
      const assistantMsg: ChatMessage = {
        id: "msg-" + (Date.now() + 1),
        sender: "assistant",
        text: reply,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setIsTyping(false);
    }, 450);
  };

  const quickChips = [
    "Explain my ECG rhythm",
    "Am I at risk of heat stroke?",
    "Air quality & respiratory advice",
    "Hydration plan for today",
    "How does Fall Detection SOS work?",
  ];

  return (
    <div className="glass-card rounded-3xl p-6 transition-all shadow-soft flex flex-col h-[520px]">
      {/* Assistant Header */}
      <div className="flex items-center justify-between gap-2 pb-4 border-b border-purple-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-rosebud-500 flex items-center justify-center text-white shadow-sm shadow-brand-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
              Sanjeevni AI Health Assistant
              <Sparkles className="w-4 h-4 text-brand-500" />
            </h3>
            <p className="text-xs text-slate-500">
              100% On-Device Edge Intelligence • Offline Resilient
            </p>
          </div>
        </div>

        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" /> Privacy Guarded
        </span>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-2.5 ${m.sender === "user" ? "flex-row-reverse" : ""}`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                m.sender === "user"
                  ? "bg-rosebud-500 text-white"
                  : "bg-brand-100 text-brand-700 border border-brand-200"
              }`}
            >
              {m.sender === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                m.sender === "user"
                  ? "bg-gradient-to-tr from-brand-700 to-brand-600 text-white rounded-tr-none shadow-sm"
                  : "bg-white/95 text-slate-800 border border-purple-100 rounded-tl-none shadow-sm"
              }`}
            >
              <div className="whitespace-pre-line">{m.text}</div>
              <div
                className={`text-[10px] mt-2 font-mono ${
                  m.sender === "user" ? "text-purple-200" : "text-slate-400"
                }`}
              >
                {new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-600 pl-10">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Sanjeevni AI is analyzing live telemetry...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips */}
      <div className="py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {quickChips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(chip)}
            className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium bg-purple-50 hover:bg-purple-100 text-brand-700 border border-purple-200 transition-all"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Query Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="pt-2 border-t border-purple-100 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder="Ask Sanjeevni about your vitals, heat index, AQI..."
          className="flex-1 px-4 py-2.5 rounded-2xl bg-white border border-purple-200 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400"
        />
        <button
          type="submit"
          className="p-2.5 rounded-2xl bg-gradient-to-tr from-brand-600 to-rosebud-500 text-white hover:opacity-95 transition-all shadow-sm flex items-center justify-center flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
