// =============================================================================
// src/screens/DashboardScreen.tsx
// Main telemetry dashboard organizing all 5 ESP32 sensor tiles
// =============================================================================

import React from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SensorState, BleConnectionStatus } from '../types/sensors';
import { ExgWaveform } from '../components/ExgWaveform';
import { SensorCard } from '../components/SensorCard';

interface DashboardScreenProps {
  sensorData: SensorState;
  connectionStatus: BleConnectionStatus;
  totalPackets: number;
  onOpenScanner: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  sensorData,
  connectionStatus,
  totalPackets,
  onOpenScanner,
}) => {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Disconnected Alert Banner */}
      {connectionStatus === 'disconnected' && (
        <View style={styles.alertBox}>
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>ESP32 Disconnected</Text>
            <Text style={styles.alertSub}>
              Connect to your ESP32 over BLE or toggle Demo Mode in the header.
            </Text>
          </View>
          <TouchableOpacity style={styles.alertBtn} onPress={onOpenScanner}>
            <Text style={styles.alertBtnText}>Scan</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Sensor 1: BioAmp EXG Waveform */}
      <ExgWaveform
        samples={sensorData.exg.samples}
        rate={sensorData.exg.rate}
        latestSample={sensorData.exg.latestSample}
        seq={sensorData.exg.seq}
        lastUpdated={sensorData.exg.lastUpdated}
      />

      {/* Sensor 2: ADXL345 */}
      <SensorCard type="adxl" data={sensorData} />

      {/* Sensor 3: DHT11 */}
      <SensorCard type="dht" data={sensorData} />

      {/* Sensor 4: MQ135 */}
      <SensorCard type="mq135" data={sensorData} />

      {/* Sensor 5: Soil Moisture / Sweat */}
      <SensorCard type="soil" data={sensorData} />

      {/* Summary Footer */}
      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Total Packets</Text>
          <Text style={styles.statVal}>{totalPackets}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Active Sensors</Text>
          <Text style={styles.statVal}>5 of 5</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Protocol</Text>
          <Text style={styles.statVal}>v1 (NUS BLE)</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#0A0F1D',
  },
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  alertBox: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#334155',
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  alertContent: {
    flex: 1,
    marginRight: 10,
  },
  alertTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
  },
  alertSub: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  alertBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  alertBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  statsCard: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#1E293B',
    marginTop: 4,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 2,
  },
  statVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#1E293B',
  },
});

