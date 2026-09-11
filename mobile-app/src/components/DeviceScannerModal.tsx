// =============================================================================
// src/components/DeviceScannerModal.tsx
// BLE Device Discovery list modal with RSSI indicator and Connect action
// =============================================================================

import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { DiscoveredDevice } from '../types/sensors';

interface DeviceScannerModalProps {
  visible: boolean;
  isScanning: boolean;
  devices: DiscoveredDevice[];
  isNativeBleAvailable: boolean;
  onClose: () => void;
  onRefreshScan: () => void;
  onSelectDevice: (deviceId: string) => void;
}

export const DeviceScannerModal: React.FC<DeviceScannerModalProps> = ({
  visible,
  isScanning,
  devices,
  isNativeBleAvailable,
  onClose,
  onRefreshScan,
  onSelectDevice,
}) => {
  const renderRssi = (rssi: number | null) => {
    if (rssi === null) return null;
    const color = rssi > -65 ? '#10B981' : rssi > -80 ? '#F59E0B' : '#EF4444';
    return (
      <View style={styles.rssiBadge}>
        <Text style={[styles.rssiText, { color }]}>{rssi} dBm</Text>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Bluetooth LE Peripherals</Text>
              <Text style={styles.sub}>Searching Nordic UART & ESP32 hubs</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {!isNativeBleAvailable && (
            <View style={styles.banner}>
              <Text style={styles.bannerTitle}>Notice: Expo Go Sandbox</Text>
              <Text style={styles.bannerText}>
                The standard Expo Go client does not bundle native BLE drivers.
                Select the Simulated Hub below to preview all real-time dashboards, or run{' '}
                <Text style={styles.codeText}>npx expo run:android</Text> to connect to physical hardware.
              </Text>
            </View>
          )}

          {isScanning && (
            <View style={styles.scanningBar}>
              <ActivityIndicator size="small" color="#38BDF8" />
              <Text style={styles.scanningText}>Scanning nearby BLE signals...</Text>
            </View>
          )}

          <FlatList
            data={devices}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {isScanning
                    ? 'Discovering devices...'
                    : 'No ESP32 BLE devices detected yet.'}
                </Text>
                <Text style={styles.emptySubText}>
                  Make sure your ESP32 is powered on and advertising.
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.deviceCard}
                onPress={() => onSelectDevice(item.id)}
                activeOpacity={0.7}
              >
                <View style={styles.deviceInfo}>
                  <Text style={styles.deviceName}>
                    {item.name || 'Unnamed Peripheral'}
                  </Text>
                  <Text style={styles.deviceId}>{item.id}</Text>
                </View>

                <View style={styles.actionBlock}>
                  {renderRssi(item.rssi)}
                  <View style={styles.connectBtn}>
                    <Text style={styles.connectBtnText}>Connect</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.refreshBtn, isScanning && styles.refreshBtnDisabled]}
              onPress={onRefreshScan}
              disabled={isScanning}
            >
              <Text style={styles.refreshBtnText}>
                {isScanning ? 'Scanning...' : 'Rescan Devices'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  sub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  closeText: {
    fontSize: 18,
    color: '#94A3B8',
    fontWeight: 'bold',
  },
  banner: {
    backgroundColor: '#1E293B',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#38BDF8',
  },
  bannerTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#38BDF8',
    marginBottom: 4,
  },
  bannerText: {
    fontSize: 11,
    color: '#CBD5E1',
    lineHeight: 16,
  },
  codeText: {
    fontFamily: 'monospace',
    color: '#F59E0B',
  },
  scanningBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#1E293B',
    gap: 8,
  },
  scanningText: {
    fontSize: 12,
    color: '#38BDF8',
  },
  list: {
    padding: 16,
    gap: 10,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  emptySubText: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  deviceCard: {
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  deviceInfo: {
    flex: 1,
    marginRight: 12,
  },
  deviceName: {
    color: '#F1F5F9',
    fontSize: 15,
    fontWeight: '600',
  },
  deviceId: {
    color: '#64748B',
    fontSize: 11,
    fontFamily: 'monospace',
    marginTop: 3,
  },
  actionBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rssiBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    backgroundColor: '#0F172A',
    borderRadius: 4,
  },
  rssiText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  connectBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  connectBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  refreshBtn: {
    backgroundColor: '#334155',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  refreshBtnDisabled: {
    opacity: 0.6,
  },
  refreshBtnText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '600',
  },
});

