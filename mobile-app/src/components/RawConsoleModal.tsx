// =============================================================================
// src/components/RawConsoleModal.tsx
// Scrolling live terminal modal displaying raw BLE packets, timestamps, and errors
// =============================================================================

import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { RawConsoleLog } from '../types/sensors';

interface RawConsoleModalProps {
  visible: boolean;
  logs: RawConsoleLog[];
  onClose: () => void;
  onClear: () => void;
}

export const RawConsoleModal: React.FC<RawConsoleModalProps> = ({
  visible,
  logs,
  onClose,
  onClear,
}) => {
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
              <Text style={styles.title}>Live BLE Terminal</Text>
              <Text style={styles.sub}>
                Raw Nordic UART Stream ({logs.length} entries)
              </Text>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity onPress={onClear} style={styles.clearBtn}>
                <Text style={styles.clearText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          <FlatList
            data={logs}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.logList}
            inverted={false}
            renderItem={({ item }) => (
              <View style={styles.logItem}>
                <Text style={styles.timestamp}>[{item.time}]</Text>
                <Text
                  style={[
                    styles.logMsg,
                    item.type === 'rx'
                      ? styles.rxColor
                      : item.type === 'error'
                      ? styles.errColor
                      : styles.infoColor,
                  ]}
                  numberOfLines={4}
                >
                  {item.message}
                </Text>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No packets received yet.</Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#020617',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
    paddingBottom: 24,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#38BDF8',
  },
  sub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#1E293B',
    borderRadius: 6,
  },
  clearText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  closeBtn: {
    padding: 6,
  },
  closeText: {
    fontSize: 18,
    color: '#94A3B8',
    fontWeight: 'bold',
  },
  logList: {
    padding: 12,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    gap: 6,
  },
  timestamp: {
    color: '#475569',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  logMsg: {
    flex: 1,
    fontSize: 11,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  rxColor: {
    color: '#38BDF8',
  },
  errColor: {
    color: '#EF4444',
  },
  infoColor: {
    color: '#94A3B8',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#475569',
    fontSize: 13,
  },
});

