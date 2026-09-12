// =============================================================================
// src/store/aiStore.ts
// Reactive store holding on-device Sanjeevni AI pipeline outputs
// =============================================================================

import { useEffect, useState } from "react";
import type { SanjeevniRiskOutput, RiskLevel, ActivityState } from "../../ai-engine/types";

export const INITIAL_AI_STATE: SanjeevniRiskOutput = {
  timestamp: Date.now(),
  status: "initializing",
  heartRate: null,
  hrv: null,
  spo2: {
    value: null,
    confidence: 0,
  },
  environment: {
    temperature: null,
    humidity: null,
    aqi: null,
    heatIndex: null,
  },
  motion: {
    level: 0,
    state: "REST",
  },
  signalQuality: {
    ecg: 0,
    ppg: 0,
  },
  risks: {
    cardiac: {
      level: "NORMAL",
      score: 0,
      confidence: 0,
      evidence: ["System initializing"],
    },
    heat: {
      level: "NORMAL",
      score: 0,
      confidence: 0,
      evidence: ["System initializing"],
    },
    respiratory: {
      level: "NORMAL",
      score: 0,
      confidence: 0,
      evidence: ["System initializing"],
    },
    fall: {
      detected: false,
      confidence: 0,
    },
  },
  sosRecommended: false,
};

let currentAiState: SanjeevniRiskOutput = { ...INITIAL_AI_STATE };
const listeners: Set<(state: SanjeevniRiskOutput) => void> = new Set();

/**
 * Updates the global AI store and alerts subscribers.
 */
export function setAiOutput(output: SanjeevniRiskOutput): void {
  currentAiState = output;
  listeners.forEach((listener) => {
    try {
      listener(currentAiState);
    } catch (e) {
      console.error("[AiStore] Error notifying subscriber:", e);
    }
  });
}

/**
 * Returns the current synchronous snapshot of the AI output.
 */
export function getAiOutput(): SanjeevniRiskOutput {
  return currentAiState;
}

/**
 * React hook for consuming real-time AI risk analysis and health insights.
 */
export function useAiRisk(): SanjeevniRiskOutput {
  const [state, setState] = useState<SanjeevniRiskOutput>(currentAiState);

  useEffect(() => {
    const handleChange = (nextState: SanjeevniRiskOutput) => {
      setState(nextState);
    };

    listeners.add(handleChange);
    // Sync state in case it updated before mounting
    setState(currentAiState);

    return () => {
      listeners.delete(handleChange);
    };
  }, []);

  return state;
}

