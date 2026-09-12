// =============================================================================
// src/hooks/useRawRecorder.ts
// Reactive React hook for the Raw Data Recorder & CSV Exporter
// =============================================================================

import { useState, useEffect, useCallback } from "react";
import { rawRecorder, RawRecorderState } from "@/services/rawRecorderService";

export function useRawRecorder() {
  const [state, setState] = useState<RawRecorderState>(rawRecorder.getState());
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  useEffect(() => {
    const unsubscribe = rawRecorder.subscribe((newState) => {
      setState(newState);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Update timer while recording
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;

    if (state.isRecording && state.startTime) {
      const updateElapsed = () => {
        const secs = Math.floor((Date.now() - (state.startTime || Date.now())) / 1000);
        setElapsedSeconds(secs);
      };
      updateElapsed();
      timer = setInterval(updateElapsed, 1000);
    } else {
      setElapsedSeconds(0);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [state.isRecording, state.startTime]);

  const startRecording = useCallback(async () => {
    return await rawRecorder.startRecording();
  }, []);

  const stopRecording = useCallback(async () => {
    return await rawRecorder.stopRecording();
  }, []);

  const exportSession = useCallback(async () => {
    return await rawRecorder.exportLastSession();
  }, []);

  const clearSession = useCallback(() => {
    rawRecorder.clearSession();
  }, []);

  return {
    isRecording: state.isRecording,
    sampleCount: state.sampleCount,
    elapsedSeconds,
    lastSavedFileUri: state.lastSavedFileUri,
    fileSizeBytes: state.fileSizeBytes,
    startRecording,
    stopRecording,
    exportSession,
    clearSession,
  };
}
