import NetInfo from '@react-native-community/netinfo';
import * as SMS from 'expo-sms';
import { insertReading, getPendingReadings, markSynced } from '../database';

// Global variable to debounce SOS texts (Gap #6)
let lastSosTimestamp = 0;
const SOS_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

export function resetSosCooldown() {
  lastSosTimestamp = 0;
  console.log("SOS cooldown reset due to alert acknowledgment.");
}

/**
 * Gap #5: Automatically trigger sync when the internet comes back online.
 */
NetInfo.addEventListener(state => {
  if (state.isConnected && state.isInternetReachable) {
    syncPendingReadings();
  }
});

/**
 * Gap #5: Syncs offline data to the cloud when internet is available.
 */
export async function syncPendingReadings() {
  if (!(await isOnline())) return;
  
  const pending = await getPendingReadings();
  if (pending.length === 0) return;

  try {
    console.log(`Syncing ${pending.length} readings to cloud...`);
    // Simulated API upload: await fetch('https://api.hospital.com/sync', { method: 'POST', body: JSON.stringify(pending) });
    
    // Mark as synced locally
    const ids = pending.map(p => p.id);
    await markSynced(ids);
    console.log('Sync complete.');
  } catch (error) {
    console.error('Sync failed, will retry later.', error);
  }
}

/**
 * Checks if the device currently has an active internet connection.
 * @returns boolean
 */
export async function isOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return !!state.isConnected && !!state.isInternetReachable;
}

/**
 * Sends an SOS text message without needing internet.
 * Gap #6: Includes a 5-minute cooldown debounce to prevent spamming SMS.
 * @param contact The emergency contact phone number
 * @param message The emergency message text
 */
export async function sendSOS(contact: string, message: string) {
  const now = Date.now();
  if (now - lastSosTimestamp < SOS_COOLDOWN_MS) {
    console.log(`SOS blocked by 5-minute cooldown. Wait ${Math.floor((SOS_COOLDOWN_MS - (now - lastSosTimestamp))/1000)}s.`);
    return;
  }

  const isAvailable = await SMS.isAvailableAsync();
  if (isAvailable) {
    await SMS.sendSMSAsync([contact], message);
    console.log(`SOS SMS initiated to ${contact}`);
    lastSosTimestamp = now;
  } else {
    console.error("SMS is not available on this device.");
  }
}

/**
 * Graceful API Fallback:
 * Tries to fetch data from an online API (e.g., Weather/AQI).
 * If offline, it falls back gracefully to the on-garment sensor.
 * 
 * @param sensorReading The local reading from the ESP32 (e.g. MQ135 AQI)
 */
export async function getEnvironmentalData(sensorReading: number) {
  if (await isOnline()) {
    try {
      // Dummy API fetch simulating OpenWeatherMap or AQI API
      console.log('Online: Fetching API data...');
      // const apiData = await fetchWeatherAQI(); 
      const mockApiAqi = 140; // Simulated API result

      await insertReading('AQI', mockApiAqi, 'api');
      return { aqi: mockApiAqi, source: 'api' };
    } catch {
      // API failed even though online — fall through to local sensor
      console.log('Online but API failed. Falling back to local sensor.');
    }
  }

  // Offline OR API failed — use the on-garment sensor value
  console.log('Offline: Falling back to local sensor data.');
  await insertReading('AQI', sensorReading, 'garment');
  return { aqi: sensorReading, source: 'garment' };
}
