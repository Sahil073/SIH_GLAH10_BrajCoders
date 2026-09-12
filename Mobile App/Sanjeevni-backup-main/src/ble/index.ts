// =============================================================================
// src/ble/index.ts
// Central barrel export for the Sanjeevni BLE / Hardware Communication Module.
// Designed for seamless integration into SIH_GLAH10_BrajCoders.
// =============================================================================

// Types & Data Contracts
export * from "./types";

// Packet Parsing Engine
export { StreamPacketParser } from "./packetParser";

// Core BLE Service & Constants
export {
    BleService, bleService, NUS_RX_CHAR_UUID,
    NUS_SERVICE_UUID,
    NUS_TX_CHAR_UUID
} from "./bleManager";

// Reactive State Store & Hooks
export {
    bleActions, BleStoreState, getBleState, INITIAL_SENSOR_STATE, useBle
} from "./bleStore";

// High-level Presentational Hooks for UI Screens
export {
    UIConnectionStatus, useBleConnection, UseBleConnectionResult
} from "./hooks/useBleConnection";

