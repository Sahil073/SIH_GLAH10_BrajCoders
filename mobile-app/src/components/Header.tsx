// =============================================================================
// src/components/Header.tsx
// App bar with connection state badge, scan trigger, and terminal toggles
// =============================================================================

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BleConnectionStatus } from '../types/sensors';

interface HeaderProps {
  status: BleConnectionStatus;
  isSimulating: boolean;
  onOpenScanner: () => void;
  onDisconnect: () => void;
  onOpenLogs: () => void;
  onToggleSimulation: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  isSimulating,
  onOpenScanner,
  onDisconnect,
  onOpenLogs,
  onToggleSimulation,
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return '#10B981'; // emerald
      case 'connecting':
        return '#F59E0B'; // amber
      case 'scanning':
        return '#3B82F6'; // blue
      default:
        return '#64748B'; // slate
    }
  };

  const getStatusLabel = () => {
    if (status === 'connected') return isSimulating ? 'SIMULATING' : 'BLE CONNECTED';
    if (status === 'connecting') return 'CONNECTING...';
    if (status === 'scanning') return 'SCANNING...';
    return 'DISCONNECTED';
  };

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <View>
          <Text style={styles.brandTitle}>SANJEEVNI</Text>
          <Text style={styles.subTitle}>ESP32 Telemetry Monitor</Text>
        </View>

        <View style={[styles.statusBadge, { borderColor: getStatusColor() }]}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {getStatusLabel()}
          </Text>
        </View>
      </View>

      <View style={styles.actionRow}>
        {status === 'connected' ? (
          <TouchableOpacity
            style={[styles.btn, styles.btnDanger]}
            onPress={onDisconnect}
            activeOpacity={0.8}
          >
            <Text style={styles.btnText}>Disconnect</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.btn, styles.btnPrimary]}
            onPress={onOpenScanner}
            disabled={status === 'scanning' || status === 'connecting'}
            activeOpacity={0.8}
          >
            <Text style={styles.btnText}>
              {status === 'scanning' ? 'Scanning...' : 'Scan Devices'}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.btn, styles.btnOutline]}
          onPress={onToggleSimulation}
          activeOpacity={0.8}
        >
          <Text style={styles.btnOutlineText}>
            {isSimulating ? 'Stop Demo' : 'Demo Mode'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.btnSecondary]}
          onPress={onOpenLogs}
          activeOpacity={0.8}
        >
          <Text style={styles.btnText}>Raw Logs</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: '#38BDF8',
  },
  subTitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
    borderWidth: 1,
    backgroundColor: '#1E293B',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  btn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: {
    backgroundColor: '#0284C7',
  },
  btnSecondary: {
    backgroundColor: '#334155',
  },
  btnDanger: {
    backgroundColor: '#DC2626',
  },
  btnOutline: {
    borderWidth: 1,
    borderColor: '#38BDF8',
    backgroundColor: 'transparent',
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  btnOutlineText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '600',
  },
});

