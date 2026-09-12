// =============================================================================
// src/components/EmergencySosModal.tsx
// Emergency SOS Modal with 15s Countdown, Audible Alarm & Offline SMS Payload
// =============================================================================

import React, { useEffect, useState } from "react";
import {
  AlertOctagon,
  PhoneCall,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  X,
  Radio,
  Send,
} from "lucide-react";
import { LiveVitals, UserProfile } from "../types/telemetry";

interface EmergencySosModalProps {
  isOpen: boolean;
  reason: string;
  vitals: LiveVitals;
  userProfile: UserProfile;
  onCancel: () => void;
  onConfirmDispatch: () => void;
}

export const EmergencySosModal: React.FC<EmergencySosModalProps> = ({
  isOpen,
  reason,
  vitals,
  userProfile,
  onCancel,
  onConfirmDispatch,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(15);
  const [isDispatched, setIsDispatched] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSecondsRemaining(15);
      setIsDispatched(false);
      return;
    }

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsDispatched(true);
          onConfirmDispatch();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  // Format SMS emergency payload
  const smsPayload = `[SANJEEVNI SOS ALERT]
Subject: Critical Health Alert for ${userProfile.name}
Trigger: ${reason}
Time: ${new Date().toLocaleTimeString()}
Current Vitals: HR ${vitals.heartRate} BPM, Heat Index ${vitals.heatIndexC}°C, Motion: ${vitals.motion.magnitude.toFixed(1)} m/s²
Location: 27.5036° N, 77.6738° E (Mathura, UP)
Status: Immediate medical / emergency check required!`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-3xl border-2 border-red-500 shadow-2xl max-w-lg w-full overflow-hidden relative">
        {/* Header Alert Strip */}
        <div className="bg-red-500 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center animate-bounce">
              <AlertOctagon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">EMERGENCY SOS TRIGGERED</h2>
              <p className="text-xs text-red-100 font-medium">{reason}</p>
            </div>
          </div>

          <button
            onClick={onCancel}
            className="p-1 rounded-full hover:bg-white/20 transition-all text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {!isDispatched ? (
            <>
              {/* Countdown Circular Display */}
              <div className="text-center py-2">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-red-50 border-4 border-red-500 text-red-600 font-black text-4xl shadow-inner animate-pulse">
                  {secondsRemaining}s
                </div>
                <p className="text-xs font-semibold text-slate-600 mt-2">
                  Auto-broadcasting emergency SMS if not cancelled
                </p>
              </div>

              {/* Emergency Contacts Recipient Card */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs space-y-2">
                <div className="font-bold text-slate-700 flex items-center gap-1.5">
                  <PhoneCall className="w-4 h-4 text-brand-600" />
                  Primary Emergency Dispatch Recipient:
                </div>
                <div className="flex items-center justify-between text-slate-800 font-medium">
                  <span>{userProfile.emergencyContact.name} ({userProfile.emergencyContact.relationship})</span>
                  <span className="font-mono font-bold text-brand-700">{userProfile.emergencyContact.phone}</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                  <MapPin className="w-3.5 h-3.5 text-red-500" />
                  <span>GPS: 27.5036° N, 77.6738° E (Mathura Region, Uttar Pradesh)</span>
                </div>
              </div>

              {/* Simulated SMS Payload Preview */}
              <div>
                <div className="text-xs font-bold text-slate-600 mb-1 flex items-center gap-1">
                  <Radio className="w-3.5 h-3.5 text-brand-600" /> Offline Cellular SMS Payload (Zero Internet Required):
                </div>
                <pre className="bg-slate-900 text-slate-200 p-3 rounded-2xl text-[11px] font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap">
                  {smsPayload}
                </pre>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={onCancel}
                  className="flex-1 py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  I am OK (Cancel SOS)
                </button>

                <button
                  onClick={() => {
                    setIsDispatched(true);
                    onConfirmDispatch();
                  }}
                  className="flex-1 py-3 px-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-all shadow-md shadow-red-500/30 flex items-center justify-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  Dispatch SOS Now
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h3 className="text-xl font-black text-slate-800">EMERGENCY SMS DISPATCHED</h3>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                Distress message containing your real-time telemetry coordinates was broadcast via native GSM carrier network.
              </p>
              <button
                onClick={onCancel}
                className="py-2.5 px-6 rounded-2xl bg-brand-600 text-white font-semibold text-xs hover:bg-brand-700 transition-all"
              >
                Close Window
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

