// =============================================================================
// src/components/SensorCard.tsx
// Modular dashboard cards for ADXL345, DHT11, MQ135, and Soil Moisture sensors
// =============================================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SensorState } from '../types/sensors';

interface SensorCardProps {
  type: 'adxl' | 'dht' | 'mq135' | 'soil';
  data: SensorState;
}

export const SensorCard: React.FC<SensorCardProps> = ({ type, data }) => {
  if (type === 'adxl') {
    const { x, y, z, magnitude, seq } = data.adxl;
    return (
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>ADXL345 Accelerometer</Text>
            <Text style={styles.subTitle}>Sensor ID 2 • Packet #{seq} • 25 Hz</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>|g|: {magnitude.toFixed(2)} m/s²</Text>
          </View>
        </View>

        <View style={styles.axisGrid}>
          <View style={styles.axisBox}>
            <Text style={styles.axisLabel}>X-AXIS</Text>
            <Text style={[styles.axisVal, { color: '#38BDF8' }]}>
              {x.toFixed(2)}
            </Text>
            <Text style={styles.unit}>m/s²</Text>
          </View>

          <View style={styles.axisBox}>
            <Text style={styles.axisLabel}>Y-AXIS</Text>
            <Text style={[styles.axisVal, { color: '#818CF8' }]}>
              {y.toFixed(2)}
            </Text>
            <Text style={styles.unit}>m/s²</Text>
          </View>

          <View style={styles.axisBox}>
            <Text style={styles.axisLabel}>Z-AXIS</Text>
            <Text style={[styles.axisVal, { color: '#34D399' }]}>
              {z.toFixed(2)}
            </Text>
            <Text style={styles.unit}>m/s²</Text>
          </View>
        </View>
      </View>
    );
  }

  if (type === 'dht') {
    const { temperature, humidity, seq } = data.dht;
    const comfort =
      temperature > 32 || humidity > 75
        ? { text: 'Hot / Humid', color: '#EF4444' }
        : temperature < 18
        ? { text: 'Cold', color: '#38BDF8' }
        : { text: 'Optimal', color: '#10B981' };

    return (
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>DHT11 Environment</Text>
            <Text style={styles.subTitle}>Sensor ID 3 • Packet #{seq} • 0.5 Hz</Text>
          </View>
          <View style={[styles.badge, { borderColor: comfort.color }]}>
            <Text style={[styles.badgeText, { color: comfort.color }]}>
              {comfort.text}
            </Text>
          </View>
        </View>

        <View style={styles.splitRow}>
          <View style={styles.metricBlock}>
            <Text style={styles.metricLabel}>Temperature</Text>
            <Text style={[styles.bigVal, { color: '#F97316' }]}>
              {temperature > 0 ? `${temperature.toFixed(1)}°C` : '--'}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.metricBlock}>
            <Text style={styles.metricLabel}>Humidity</Text>
            <Text style={[styles.bigVal, { color: '#06B6D4' }]}>
              {humidity > 0 ? `${humidity.toFixed(1)}%` : '--'}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  if (type === 'mq135') {
    const { raw, seq } = data.mq135;
    // Standard ADC scale 0-4095
    const pct = Math.min(100, Math.round((raw / 4095) * 100));
    const status =
      raw > 2500
        ? { text: 'Hazardous / Smoke', color: '#EF4444' }
        : raw > 1700
        ? { text: 'Moderate AQI', color: '#F59E0B' }
        : { text: 'Clean Air', color: '#10B981' };

    return (
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>MQ135 Gas & Air Quality</Text>
            <Text style={styles.subTitle}>Sensor ID 4 • Packet #{seq} • 1 Hz</Text>
          </View>
          <View style={[styles.badge, { borderColor: status.color }]}>
            <Text style={[styles.badgeText, { color: status.color }]}>
              {status.text}
            </Text>
          </View>
        </View>

        <View style={styles.singleRow}>
          <View>
            <Text style={styles.bigVal}>{raw || '--'}</Text>
            <Text style={styles.unit}>Raw ADC (12-bit)</Text>
          </View>

          <View style={styles.barWrapper}>
            <View style={styles.barBg}>
              <View
                style={[
                  styles.barFill,
                  { width: `${pct}%`, backgroundColor: status.color },
                ]}
              />
            </View>
            <Text style={styles.barPct}>{pct}% of scale</Text>
          </View>
        </View>
      </View>
    );
  }

  if (type === 'soil') {
    const { raw, seq } = data.soil;
    const pct = Math.min(100, Math.round((raw / 4095) * 100));
    const moisture =
      raw > 2800
        ? { text: 'Dry / High Resistance', color: '#F59E0B' }
        : raw > 1500
        ? { text: 'Moist / Conductive', color: '#38BDF8' }
        : { text: 'Saturated (Wet)', color: '#10B981' };

    return (
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Soil Moisture / Sweat Sensor</Text>
            <Text style={styles.subTitle}>Sensor ID 5 • Packet #{seq} • 0.5 Hz</Text>
          </View>
          <View style={[styles.badge, { borderColor: moisture.color }]}>
            <Text style={[styles.badgeText, { color: moisture.color }]}>
              {moisture.text}
            </Text>
          </View>
        </View>

        <View style={styles.singleRow}>
          <View>
            <Text style={styles.bigVal}>{raw || '--'}</Text>
            <Text style={styles.unit}>Raw ADC (12-bit)</Text>
          </View>

          <View style={styles.barWrapper}>
            <View style={styles.barBg}>
              <View
                style={[
                  styles.barFill,
                  { width: `${pct}%`, backgroundColor: moisture.color },
                ]}
              />
            </View>
            <Text style={styles.barPct}>{pct}% reading</Text>
          </View>
        </View>
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  subTitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#475569',
  },
  badgeText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '700',
  },
  axisGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  axisBox: {
    flex: 1,
    backgroundColor: '#0F172A',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  axisLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 2,
  },
  axisVal: {
    fontSize: 17,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 10,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  metricBlock: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 36,
    backgroundColor: '#334155',
  },
  metricLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 4,
  },
  bigVal: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
    fontFamily: 'monospace',
  },
  unit: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  singleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  barWrapper: {
    width: '55%',
    alignItems: 'flex-end',
  },
  barBg: {
    width: '100%',
    height: 10,
    backgroundColor: '#334155',
    borderRadius: 5,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 5,
  },
  barPct: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4,
  },
});

