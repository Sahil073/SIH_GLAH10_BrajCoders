import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { getLatestReading, insertReading, pruneOldData } from '../database';
import { sendSOS, getEnvironmentalData } from '../utils/network';
import DatabaseDebugScreen from './debug';

export default function HomeScreen() {
  const [hr, setHr] = useState<any>(null);
  const [spo2, setSpo2] = useState<any>(null);
  const [temp, setTemp] = useState<any>(null);
  const [aqi, setAqi] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);

  const loadData = async () => {
    try {
      const latestHr = await getLatestReading('HR');
      const latestSpo2 = await getLatestReading('SpO2');
      const latestTemp = await getLatestReading('TEMP');
      const latestAqi = await getLatestReading('AQI');

      setHr(latestHr ? latestHr.value : '--');
      setSpo2(latestSpo2 ? latestSpo2.value : '--');
      setTemp(latestTemp ? latestTemp.value : '--');
      setAqi(latestAqi ? latestAqi.value : '--');
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    pruneOldData();
    loadData();
    const interval = setInterval(loadData, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleSimulateBLE = async () => {
    await insertReading('HR', Math.floor(Math.random() * (100 - 60 + 1)) + 60, 'garment');
    await insertReading('SpO2', Math.floor(Math.random() * (100 - 95 + 1)) + 95, 'garment');
    await insertReading('TEMP', parseFloat((Math.random() * (38 - 36) + 36).toFixed(1)), 'garment');
    
    // Simulate fetching environmental data with graceful fallback
    await getEnvironmentalData(Math.floor(Math.random() * (150 - 50 + 1)) + 50);
    
    Alert.alert("BLE Data Simulated", "Hardware sensor packets successfully saved to local database.");
    loadData();
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.title}>
          Sanjeevni Dashboard
        </ThemedText>
        <ThemedText style={{ textAlign: 'center', marginBottom: 20 }}>
          Live Unified Sensor Data (P1 Architecture)
        </ThemedText>

        <ScrollView style={{width: '100%'}} contentContainerStyle={{ paddingBottom: 100 }}>
          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="subtitle">Latest Readings</ThemedText>
            
            <View style={styles.row}>
              <ThemedText style={styles.label}>Heart Rate:</ThemedText>
              <ThemedText style={styles.value}>{hr} bpm</ThemedText>
            </View>
            <View style={styles.row}>
              <ThemedText style={styles.label}>SpO2:</ThemedText>
              <ThemedText style={styles.value}>{spo2}%</ThemedText>
            </View>
            <View style={styles.row}>
              <ThemedText style={styles.label}>Body Temp:</ThemedText>
              <ThemedText style={styles.value}>{temp}°C</ThemedText>
            </View>
            <View style={styles.row}>
              <ThemedText style={styles.label}>Air Quality:</ThemedText>
              <ThemedText style={styles.value}>{aqi} AQI</ThemedText>
            </View>
          </ThemedView>

          <TouchableOpacity style={[styles.button, { backgroundColor: '#0a7ea4', marginTop: 20 }]} onPress={handleSimulateBLE}>
            <ThemedText style={styles.buttonText}>Simulate Incoming BLE Data</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, { backgroundColor: '#d9534f' }]} onPress={() => sendSOS('112', 'FALL DETECTED: Patient needs immediate assistance at 28.6139° N, 77.2090° E.')}>
            <ThemedText style={styles.buttonText}>Trigger Offline SMS SOS</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, { backgroundColor: '#333', marginTop: 15 }]} onPress={() => setShowDebug(!showDebug)}>
            <ThemedText style={styles.buttonText}>{showDebug ? "Hide Raw Database Tables" : "👀 View Raw Database Tables"}</ThemedText>
          </TouchableOpacity>

          {showDebug && (
            <View style={{ marginTop: 20, backgroundColor: '#111', padding: 10, borderRadius: 10 }}>
               <DatabaseDebugScreen />
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four, paddingTop: Spacing.four },
  title: { textAlign: 'center' },
  card: { padding: 20, borderRadius: 16, marginTop: 10, gap: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#222', padding: 8, borderRadius: 4 },
  label: { fontWeight: 'bold' },
  value: { fontWeight: 'bold' },
  button: {
    padding: 15,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16
  }
});
