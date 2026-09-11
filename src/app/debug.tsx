import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SQLite from 'expo-sqlite';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { getDb } from '../database';

export default function DatabaseDebugScreen() {
  const [readings, setReadings] = useState<any[]>([]);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const db = await getDb();
        const allReadings = await db.getAllAsync('SELECT * FROM readings ORDER BY timestamp DESC LIMIT 50');
        setReadings(allReadings);
      } catch (e) {
        console.error("Error reading DB for debug screen", e);
      }
    };

    fetchAllData();
    const interval = setInterval(fetchAllData, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.title}>
          Live SQLite Database
        </ThemedText>
        <ThemedText style={{ textAlign: 'center', marginBottom: 20, color: 'gray' }}>
          File Location: Locked securely inside Android App Sandbox.
        </ThemedText>

        <ScrollView style={{ width: '100%' }}>
          <ThemedText type="subtitle" style={{ marginBottom: 10 }}>[Table: readings]</ThemedText>
          
          <View style={styles.tableHeader}>
            <ThemedText style={[styles.headerCell, { flex: 1 }]}>ID</ThemedText>
            <ThemedText style={[styles.headerCell, { flex: 2 }]}>Metric</ThemedText>
            <ThemedText style={[styles.headerCell, { flex: 2 }]}>Value</ThemedText>
            <ThemedText style={[styles.headerCell, { flex: 2 }]}>Synced</ThemedText>
          </View>

          {readings.map((row) => (
            <View key={row.id} style={styles.tableRow}>
              <ThemedText style={[styles.cell, { flex: 1 }]}>{row.id}</ThemedText>
              <ThemedText style={[styles.cell, { flex: 2, fontWeight: 'bold' }]}>{row.sensor_type}</ThemedText>
              <ThemedText style={[styles.cell, { flex: 2 }]}>{row.value}</ThemedText>
              <ThemedText style={[styles.cell, { flex: 2 }]}>{row.synced}</ThemedText>
            </View>
          ))}
          
          {readings.length === 0 && (
             <ThemedText style={{ textAlign: 'center', marginTop: 20 }}>No data yet! Go to the home screen and hit Simulate.</ThemedText>
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
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#333',
    padding: 10,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  headerCell: {
    fontWeight: 'bold',
    color: '#fff',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    padding: 10,
  },
  cell: {
    color: '#ccc',
  }
});
