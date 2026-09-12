// =============================================================================
// src/services/serialService.ts
// Web Serial API Manager for ESP32 USB UART Communication (Baud 115200)
// =============================================================================

import { RawSensorPacket } from "../types/telemetry";

export type SerialConnectionState = "DISCONNECTED" | "CONNECTING" | "CONNECTED" | "ERROR";

export class SerialService {
  private port: any = null;
  private reader: any = null;
  private keepReading: boolean = false;
  private lineBuffer: string = "";
  private onPacketCallback: ((packet: RawSensorPacket) => void) | null = null;
  private onStateCallback: ((state: SerialConnectionState, message?: string) => void) | null = null;

  public isSupported(): boolean {
    return "serial" in navigator;
  }

  public setOnPacket(cb: (packet: RawSensorPacket) => void): void {
    this.onPacketCallback = cb;
  }

  public setOnState(cb: (state: SerialConnectionState, message?: string) => void): void {
    this.onStateCallback = cb;
  }

  public async connect(baudRate: number = 115200): Promise<boolean> {
    if (!this.isSupported()) {
      this.onStateCallback?.("ERROR", "Web Serial API is not supported in this browser. Please use Chrome or Edge.");
      return false;
    }

    try {
      this.onStateCallback?.("CONNECTING", "Selecting USB serial device...");
      // Prompt user to select ESP32 USB COM Port
      // @ts-ignore
      this.port = await navigator.serial.requestPort();

      await this.port.open({ baudRate });
      this.keepReading = true;
      this.onStateCallback?.("CONNECTED", `Connected at ${baudRate} baud`);

      this.startReading();
      return true;
    } catch (err: any) {
      console.error("[Serial] Connection failed:", err);
      this.onStateCallback?.("ERROR", err.message || "Failed to connect to USB serial device");
      return false;
    }
  }

  private async startReading(): Promise<void> {
    const textDecoder = new TextDecoderStream();
    // @ts-ignore
    const readableStreamClosed = this.port.readable.pipeTo(textDecoder.writable);
    this.reader = textDecoder.readable.getReader();

    try {
      while (this.keepReading) {
        const { value, done } = await this.reader.read();
        if (done) {
          break;
        }
        if (value) {
          this.processChunk(value);
        }
      }
    } catch (err) {
      console.error("[Serial] Stream read error:", err);
    } finally {
      this.reader?.releaseLock();
    }
  }

  private processChunk(chunk: string): void {
    this.lineBuffer += chunk;
    const lines = this.lineBuffer.split("\n");
    // Preserve any partial line remaining at the end
    this.lineBuffer = lines.pop() || "";

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line.startsWith("{") || !line.endsWith("}")) {
        continue;
      }

      try {
        const parsed = JSON.parse(line) as RawSensorPacket;
        if (parsed.v === 1 && typeof parsed.sensor === "number") {
          this.onPacketCallback?.(parsed);
        }
      } catch (e) {
        // Skip malformed lines (e.g. initial power-on noise)
      }
    }
  }

  public async disconnect(): Promise<void> {
    this.keepReading = false;
    try {
      if (this.reader) {
        await this.reader.cancel();
      }
      if (this.port) {
        await this.port.close();
      }
    } catch (err) {
      console.warn("[Serial] Error closing port:", err);
    } finally {
      this.port = null;
      this.reader = null;
      this.onStateCallback?.("DISCONNECTED", "USB disconnected");
    }
  }
}

export const serialService = new SerialService();

