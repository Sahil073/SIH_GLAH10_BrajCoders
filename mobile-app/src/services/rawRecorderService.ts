// =============================================================================
// src/services/rawRecorderService.ts
// Background Raw Telemetry Logger & CSV Export Service.
// Captures full 500 Hz EXG sample chunks, 25 Hz ADXL345 acceleration vectors,
// DHT11, and MQ135 analog telemetry directly into local CSV files for research.
// =============================================================================

import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import { bleService } from "../ble/bleManager";
import { Esp32Packet, SensorId } from "../ble/types";

export interface RawRecorderState {
  isRecording: boolean;
  startTime: number | null;
  sampleCount: number;
  currentFileUri: string | null;
  lastSavedFileUri: string | null;
  fileSizeBytes: number;
}

const CSV_HEADER =
  "timestamp_iso,uptime_ms,sensor_name,sensor_id,seq,metric_x_temp,metric_y_hum,metric_z_raw,exg_samples\n";

class RawRecorderService {
  private isRecording = false;
  private startTime: number | null = null;
  private sampleCount = 0;
  private currentFileUri: string | null = null;
  private lastSavedFileUri: string | null = null;
  private fileSizeBytes = 0;

  private lineBuffer: string[] = [];
  private unsubscribeBle: (() => void) | null = null;
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private isFlushing = false;

  private listeners: Set<(state: RawRecorderState) => void> = new Set();

  public getState(): RawRecorderState {
    return {
      isRecording: this.isRecording,
      startTime: this.startTime,
      sampleCount: this.sampleCount,
      currentFileUri: this.currentFileUri,
      lastSavedFileUri: this.lastSavedFileUri,
      fileSizeBytes: this.fileSizeBytes,
    };
  }

  public subscribe(listener: (state: RawRecorderState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const state = this.getState();
    this.listeners.forEach((l) => {
      try {
        l(state);
      } catch (err) {
        console.warn("[RawRecorder] Error notifying subscriber:", err);
      }
    });
  }

  /**
   * Starts a new raw data recording session.
   */
  public async startRecording(): Promise<string> {
    if (this.isRecording) {
      return this.currentFileUri || "";
    }

    const timestamp = Date.now();
    const docDir = FileSystem.documentDirectory || "";
    const filename = `sanjeevni_raw_${timestamp}.csv`;
    const fileUri = `${docDir}${filename}`;

    this.currentFileUri = fileUri;
    this.startTime = timestamp;
    this.sampleCount = 0;
    this.fileSizeBytes = 0;
    this.lineBuffer = [];
    this.isRecording = true;

    try {
      // Initialize file with CSV header
      if (Platform.OS !== "web") {
        await FileSystem.writeAsStringAsync(fileUri, CSV_HEADER, {
          encoding: FileSystem.EncodingType.UTF8,
        });
      }
    } catch (err) {
      console.warn("[RawRecorder] Error creating CSV file:", err);
    }

    // Subscribe to raw incoming BLE packets
    this.unsubscribeBle = bleService.addPacketListener((packet: Esp32Packet) => {
      this.handleIncomingPacket(packet);
    });

    // Start periodic background flush (every 1.5 seconds)
    this.flushTimer = setInterval(() => {
      void this.flushBuffer();
    }, 1500);

    this.notify();
    console.log(`[RawRecorder] Started session logging to: ${fileUri}`);
    return fileUri;
  }

  /**
   * Handles incoming BLE packet and formats as CSV row.
   */
  private handleIncomingPacket(packet: Esp32Packet): void {
    if (!this.isRecording) return;

    const tsIso = new Date().toISOString();

    switch (packet.sensor) {
      case SensorId.EXG: {
        const samples = packet.samples || [];
        this.sampleCount += samples.length;
        const samplesStr = samples.join(";");
        this.lineBuffer.push(
          `${tsIso},${packet.ts},EXG,1,${packet.seq},,,,${samplesStr}`
        );
        break;
      }

      case SensorId.ADXL345: {
        this.sampleCount += 1;
        this.lineBuffer.push(
          `${tsIso},${packet.ts},ADXL345,2,${packet.seq},${packet.data.x},${packet.data.y},${packet.data.z},`
        );
        break;
      }

      case SensorId.DHT11: {
        this.sampleCount += 1;
        this.lineBuffer.push(
          `${tsIso},${packet.ts},DHT11,3,${packet.seq},${packet.data.temperature},${packet.data.humidity},,`
        );
        break;
      }

      case SensorId.MQ135: {
        this.sampleCount += 1;
        this.lineBuffer.push(
          `${tsIso},${packet.ts},MQ135,4,${packet.seq},,,${packet.data.raw},`
        );
        break;
      }

      case SensorId.SOIL_MOISTURE: {
        this.sampleCount += 1;
        this.lineBuffer.push(
          `${tsIso},${packet.ts},SOIL,5,${packet.seq},,,${packet.data.raw},`
        );
        break;
      }
    }

    // Proactive flush if buffer exceeds 60 lines
    if (this.lineBuffer.length >= 60) {
      void this.flushBuffer();
    }
  }

  /**
   * Appends buffered CSV lines to local disk.
   */
  private async flushBuffer(): Promise<void> {
    if (this.isFlushing || this.lineBuffer.length === 0 || !this.currentFileUri) {
      return;
    }

    this.isFlushing = true;
    const chunk = this.lineBuffer.join("\n") + "\n";
    this.lineBuffer = [];

    try {
      if (Platform.OS !== "web") {
        await FileSystem.writeAsStringAsync(this.currentFileUri, chunk, {
          encoding: FileSystem.EncodingType.UTF8,
          append: true,
        });

        const info = await FileSystem.getInfoAsync(this.currentFileUri);
        if (info.exists && !info.isDirectory) {
          this.fileSizeBytes = info.size;
        }
      }
      this.notify();
    } catch (err) {
      console.warn("[RawRecorder] Error appending CSV chunk:", err);
    } finally {
      this.isFlushing = false;
    }
  }

  /**
   * Stops the active recording session, flushes all remaining samples, and updates state.
   */
  public async stopRecording(): Promise<string | null> {
    if (!this.isRecording) {
      return this.lastSavedFileUri;
    }

    this.isRecording = false;

    if (this.unsubscribeBle) {
      this.unsubscribeBle();
      this.unsubscribeBle = null;
    }

    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    // Final flush
    await this.flushBuffer();

    this.lastSavedFileUri = this.currentFileUri;
    this.currentFileUri = null;

    if (this.lastSavedFileUri && Platform.OS !== "web") {
      try {
        const info = await FileSystem.getInfoAsync(this.lastSavedFileUri);
        if (info.exists && !info.isDirectory) {
          this.fileSizeBytes = info.size;
        }
      } catch {}
    }

    this.notify();
    console.log(
      `[RawRecorder] Stopped session. Total samples: ${this.sampleCount}, file size: ${this.fileSizeBytes} bytes`
    );
    return this.lastSavedFileUri;
  }

  /**
   * Opens native OS Share sheet to export the raw CSV to Google Drive, WhatsApp, Email, USB, or Files.
   */
  public async exportLastSession(): Promise<boolean> {
    const fileUri = this.lastSavedFileUri || this.currentFileUri;
    if (!fileUri) {
      return false;
    }

    try {
      if (Platform.OS === "web") {
        // Fallback for web: not mobile native share
        return false;
      }

      const available = await Sharing.isAvailableAsync();
      if (!available) {
        console.warn("[RawRecorder] Native sharing is not available on this device.");
        return false;
      }

      await Sharing.shareAsync(fileUri, {
        mimeType: "text/csv",
        dialogTitle: "Export Sanjeevni Raw Telemetry CSV",
        UTI: "public.comma-separated-values-text",
      });

      return true;
    } catch (err) {
      console.warn("[RawRecorder] Error sharing raw CSV:", err);
      return false;
    }
  }

  /**
   * Clears current session file state.
   */
  public clearSession(): void {
    this.lastSavedFileUri = null;
    this.sampleCount = 0;
    this.fileSizeBytes = 0;
    this.startTime = null;
    this.notify();
  }
}

export const rawRecorder = new RawRecorderService();
