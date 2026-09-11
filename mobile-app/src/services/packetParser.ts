// =============================================================================
// src/services/packetParser.ts
// Reassembles segmented BLE streams, handles Base64 decoding, newline delimiters,
// and parses JSON telemetry schemas (Sensors 1-5) and CSV test formats.
// =============================================================================

import { decode as atob } from 'base-64';
import {
  Esp32Packet,
  SensorId,
  ExgPacket,
  AdxlPacket,
  DhtPacket,
  Mq135Packet,
  SoilPacket,
} from '../types/sensors';

export class StreamPacketParser {
  private buffer: string = '';

  /**
   * Resets the internal reassembly buffer on disconnect or reconnection.
   */
  public reset(): void {
    this.buffer = '';
  }

  /**
   * Decodes a Base64-encoded BLE characteristic notification into UTF-8 text.
   */
  public static decodeBase64(base64Payload: string): string {
    try {
      return atob(base64Payload);
    } catch (err) {
      console.warn('Base64 decode failure:', err);
      return '';
    }
  }

  /**
   * Feeds a decoded raw text chunk from BLE notifications,
   * buffers incomplete chunks, and extracts all complete newline-delimited packets.
   */
  public feed(chunk: string): { packets: Esp32Packet[]; rawLines: string[] } {
    this.buffer += chunk;

    const packets: Esp32Packet[] = [];
    const rawLines: string[] = [];

    // Split on newline delimiter \n
    const lines = this.buffer.split('\n');

    // The last element is either incomplete or empty (if ended on newline)
    this.buffer = lines.pop() || '';

    for (const rawLine of lines) {
      const trimmed = rawLine.trim();
      if (!trimmed) continue;

      rawLines.push(trimmed);

      // Attempt 1: Parse standard ESP32_Sensor_Hub JSON packet
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        try {
          const parsed = JSON.parse(trimmed) as any;
          if (parsed && typeof parsed === 'object' && parsed.v === 1 && typeof parsed.sensor === 'number') {
            const validated = this.validateJsonPacket(parsed);
            if (validated) {
              packets.push(validated);
              continue;
            }
          }
        } catch (e) {
          // Incomplete JSON or parsing error, try CSV fallback
        }
      }

      // Attempt 2: Support individual device-testing sketches (CSV / Plain text)
      const fallbackPacket = this.parseFallbackText(trimmed);
      if (fallbackPacket) {
        packets.push(fallbackPacket);
      }
    }

    return { packets, rawLines };
  }

  /**
   * Validates structure according to the official SIH GLAH10 sensor schema
   */
  private validateJsonPacket(obj: any): Esp32Packet | null {
    const sensorId: SensorId = obj.sensor;
    const seq = typeof obj.seq === 'number' ? obj.seq : 0;
    const ts = typeof obj.ts === 'number' ? obj.ts : Date.now();

    switch (sensorId) {
      case SensorId.EXG:
        if (Array.isArray(obj.samples)) {
          return {
            v: 1,
            sensor: SensorId.EXG,
            seq,
            ts,
            rate: typeof obj.rate === 'number' ? obj.rate : 500,
            samples: obj.samples,
          } as ExgPacket;
        }
        break;

      case SensorId.ADXL345:
        if (obj.data && typeof obj.data.x === 'number') {
          return {
            v: 1,
            sensor: SensorId.ADXL345,
            seq,
            ts,
            data: {
              x: Number(obj.data.x),
              y: Number(obj.data.y),
              z: Number(obj.data.z),
            },
          } as AdxlPacket;
        }
        break;

      case SensorId.DHT11:
        if (obj.data && typeof obj.data.temperature === 'number') {
          return {
            v: 1,
            sensor: SensorId.DHT11,
            seq,
            ts,
            data: {
              temperature: Number(obj.data.temperature),
              humidity: Number(obj.data.humidity),
            },
          } as DhtPacket;
        }
        break;

      case SensorId.MQ135:
        if (obj.data && typeof obj.data.raw === 'number') {
          return {
            v: 1,
            sensor: SensorId.MQ135,
            seq,
            ts,
            data: {
              raw: Number(obj.data.raw),
            },
          } as Mq135Packet;
        }
        break;

      case SensorId.SOIL_MOISTURE:
        if (obj.data && typeof obj.data.raw === 'number') {
          return {
            v: 1,
            sensor: SensorId.SOIL_MOISTURE,
            seq,
            ts,
            data: {
              raw: Number(obj.data.raw),
            },
          } as SoilPacket;
        }
        break;
    }

    return null;
  }

  /**
   * Parses legacy / isolated test sketch CSV messages into standard packet structures
   */
  private parseFallbackText(line: string): Esp32Packet | null {
    const ts = Date.now();

    // 1. BioAmp EXG test: "EXG,1842"
    if (line.startsWith('EXG,')) {
      const val = parseInt(line.substring(4), 10);
      if (!isNaN(val)) {
        return {
          v: 1,
          sensor: SensorId.EXG,
          seq: 0,
          ts,
          rate: 100,
          samples: [val],
        } as ExgPacket;
      }
    }

    // 2. ADXL test: "ADXL345,0.12,-0.31,9.76"
    if (line.startsWith('ADXL345,')) {
      const parts = line.split(',');
      if (parts.length >= 4) {
        return {
          v: 1,
          sensor: SensorId.ADXL345,
          seq: 0,
          ts,
          data: {
            x: parseFloat(parts[1]) || 0,
            y: parseFloat(parts[2]) || 0,
            z: parseFloat(parts[3]) || 0,
          },
        } as AdxlPacket;
      }
    }

    // 3. DHT test: "Temperature: 28.4 C, Humidity: 64.0 %"
    if (line.includes('Temperature:') && line.includes('Humidity:')) {
      const tempMatch = line.match(/Temperature:\s*([0-9.]+)/i);
      const humMatch = line.match(/Humidity:\s*([0-9.]+)/i);
      if (tempMatch && humMatch) {
        return {
          v: 1,
          sensor: SensorId.DHT11,
          seq: 0,
          ts,
          data: {
            temperature: parseFloat(tempMatch[1]),
            humidity: parseFloat(humMatch[1]),
          },
        } as DhtPacket;
      }
    }

    // 4. MQ135 test: "MQ135,1854"
    if (line.startsWith('MQ135,')) {
      const val = parseInt(line.substring(6), 10);
      if (!isNaN(val)) {
        return {
          v: 1,
          sensor: SensorId.MQ135,
          seq: 0,
          ts,
          data: { raw: val },
        } as Mq135Packet;
      }
    }

    // 5. Soil moisture test: "SOIL,1842"
    if (line.startsWith('SOIL,')) {
      const val = parseInt(line.substring(5), 10);
      if (!isNaN(val)) {
        return {
          v: 1,
          sensor: SensorId.SOIL_MOISTURE,
          seq: 0,
          ts,
          data: { raw: val },
        } as SoilPacket;
      }
    }

    return null;
  }
}

