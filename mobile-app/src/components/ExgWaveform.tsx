// =============================================================================
// src/components/ExgWaveform.tsx
// Real-time biopotential waveform visualizer for BioAmp EXG Pill (Sensor ID 1)
// Implemented with pure React Native components for 100% compatibility with Expo Go.
// =============================================================================

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ExgWaveformProps {
  samples: number[];
  rate: number;
  latestSample: number;
  seq: number;
  lastUpdated: number;
}

export const ExgWaveform: React.FC<ExgWaveformProps> = ({
  samples,
  rate,
  latestSample,
  seq,
  lastUpdated,
}) => {
  // Subsample to 64 display bars for clean rendering and high FPS
  const displayPoints = useMemo(() => {
    if (!samples || samples.length === 0) {
      return new Array(48).fill(1850);
    }
    const step = Math.max(1, Math.floor(samples.length / 48));
    const pts: number[] = [];
    for (let i = 0; i < samples.length && pts.length < 48; i += step) {
      pts.push(samples[i]);
    }
    return pts;
  }, [samples]);

  // Compute dynamic min/max and peak-to-peak amplitude
  const { minVal, maxVal, p2p } = useMemo(() => {
    if (!samples || samples.length === 0) {
      return { minVal: 0, maxVal: 4095, p2p: 0 };
    }
    let min = 4095;
    let max = 0;
    for (const s of samples) {
      if (s < min) min = s;
      if (s > max) max = s;
    }
    return { minVal: min, maxVal: max, p2p: max - min };
  }, [samples]);

  const signalQuality = useMemo(() => {
    if (p2p > 2200) return { label: 'High Noise / Clipping', color: '#EF4444' };
    if (p2p > 100) return { label: 'Active Signal (Good)', color: '#10B981' };
    return { label: 'Flatline / Low Activity', color: '#F59E0B' };
  }, [p2p]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <View style={styles.titleRow}>
            <Text style={styles.title}>BioAmp EXG Pill</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{rate || 500} Hz</Text>
            </View>
          </View>
          <Text style={styles.subTitle}>
            Sensor ID 1 • Packet #{seq} • 128-sample Buffer
          </Text>
        </View>

        <View style={styles.valBox}>
          <Text style={styles.primaryVal}>{latestSample || '----'}</Text>
          <Text style={styles.unitText}>Raw ADC (12-bit)</Text>
        </View>
      </View>

      {/* Waveform Graph Area */}
      <View style={styles.graphContainer}>
        <View style={styles.graphGrid}>
          <View style={styles.gridLine} />
          <View style={styles.gridLine} />
          <View style={styles.gridLine} />
        </View>

        <View style={styles.barsRow}>
          {displayPoints.map((val, idx) => {
            // Normalize between 10% and 90% of graph container height (80px)
            const range = Math.max(1, maxVal - minVal);
            const normalized = (val - minVal) / range;
            const barHeight = Math.max(4, Math.min(76, normalized * 76));

            return (
              <View key={idx} style={styles.barColumn}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: barHeight,
                      backgroundColor:
                        val > 2500
                          ? '#EF4444'
                          : val > 1900
                          ? '#38BDF8'
                          : '#0284C7',
                    },
                  ]}
                />
              </View>
            );
          })}
        </View>
      </View>

      {/* Footer Metrics */}
      <View style={styles.footer}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Signal Quality</Text>
          <Text style={[styles.metricValue, { color: signalQuality.color }]}>
            {signalQuality.label}
          </Text>
        </View>

        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Peak-to-Peak (ΔV)</Text>
          <Text style={styles.metricValue}>{p2p} counts</Text>
        </View>

        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Range</Text>
          <Text style={styles.metricValue}>
            {minVal} - {maxVal}
          </Text>
        </View>
      </View>
    </View>
  );
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  badge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
  },
  badgeText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '700',
  },
  subTitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  valBox: {
    alignItems: 'flex-end',
  },
  primaryVal: {
    fontSize: 22,
    fontWeight: '800',
    color: '#38BDF8',
    fontFamily: 'monospace',
  },
  unitText: {
    fontSize: 10,
    color: '#64748B',
  },
  graphContainer: {
    height: 86,
    backgroundColor: '#0F172A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    position: 'relative',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  graphGrid: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  gridLine: {
    height: 1,
    backgroundColor: '#1E293B',
    width: '100%',
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: '100%',
    paddingHorizontal: 6,
    paddingBottom: 4,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  bar: {
    width: 3,
    borderRadius: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  metricItem: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 10,
    color: '#94A3B8',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#E2E8F0',
  },
});

