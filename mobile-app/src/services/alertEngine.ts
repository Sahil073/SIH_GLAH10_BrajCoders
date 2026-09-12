type AlertDbHandler = (
  category: "CARDIAC" | "HEAT" | "RESPIRATORY" | "FALL" | "VITALS" | "SYSTEM" | string,
  severity: "LOW" | "MODERATE" | "HIGH" | "CRITICAL",
  message: string,
  userId?: string
) => Promise<void>;

type NotificationHandler = (notification: {
  category: "CARDIAC" | "HEAT" | "RESPIRATORY" | "FALL" | "VITALS" | "SYSTEM";
  severity: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  title: string;
  message: string;
}) => void;

let dbInsertHandler: AlertDbHandler = async (category, severity, message, userId) => {
  try {
    const db = require("@/database");
    if (db && typeof db.safeInsertAlert === "function") {
      await db.safeInsertAlert(category, severity, message, userId);
    }
  } catch {
    // Graceful fallback in test runner environments
  }
};

let notificationDispatchHandler: NotificationHandler = (notif) => {
  try {
    const store = require("@/store/notificationStore");
    if (store && typeof store.showInAppNotification === "function") {
      store.showInAppNotification(notif);
    }
  } catch {
    // Graceful fallback in test runner environments
  }
};

export function setAlertDatabaseHandler(handler: AlertDbHandler): void {
  dbInsertHandler = handler;
}

export function setNotificationHandler(handler: NotificationHandler): void {
  notificationDispatchHandler = handler;
}

export interface VitalsAlertEvaluationInput {
  heartRate: number;       // 1. Heart Rate (BPM)
  temperature: number;     // 2. Body / Skin Temperature (°C)
  moisture: number;        // 3. Skin Moisture / Humidity (%)
  aqi: number;             // 4. Air Quality Index (AQI)
  heatIndex: number;       // 5. Heat Index (°C)
  steps: number;           // 6. Steps / Movement
  fallDetected?: boolean;  // Anomaly flag
  userId?: string;
}

export interface GeneratedAlert {
  category: "CARDIAC" | "HEAT" | "RESPIRATORY" | "FALL" | "VITALS" | "SYSTEM";
  severity: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  title: string;
  message: string;
}

// Track last alert dispatch times to prevent spamming
const lastAlertTimes: Record<string, number> = {};
const ALERT_COOLDOWN_MS = 25000; // 25s debounce per category
const OPTIMAL_CHECK_COOLDOWN_MS = 60000; // 60s for baseline check-in

/**
 * Evaluates all 6 vital biometric & environmental parameters,
 * creates appropriate clinical alerts, stores them into SQLite,
 * and triggers interactive in-app notifications.
 */
export async function evaluateAllSixParameters(
  input: VitalsAlertEvaluationInput
): Promise<GeneratedAlert | null> {
  const {
    heartRate,
    temperature,
    moisture,
    aqi,
    heatIndex,
    steps,
    fallDetected = false,
    userId = "offline_local",
  } = input;

  const now = Date.now();
  let candidateAlert: GeneratedAlert | null = null;

  // 1. Check Fall / Impact (Critical Priority)
  if (fallDetected) {
    candidateAlert = {
      category: "FALL",
      severity: "CRITICAL",
      title: "Wearable Fall Alert",
      message: "Sudden impact detected by wearable motion sensors. Emergency SOS protocol ready.",
    };
  }

  // 2. Check Severe Thermal Strain / Heat Stroke (Temperature + Heat Index)
  else if (temperature >= 38.2 || heatIndex >= 42) {
    candidateAlert = {
      category: "HEAT",
      severity: "CRITICAL",
      title: "Heat Stroke Emergency",
      message: `Dangerous thermal strain: Body temp ${temperature.toFixed(1)}°C, Heat Index ${heatIndex}°C. Immediate rest and hydration mandatory.`,
    };
  }

  // 3. Check Cardiac Distress / Tachycardia / Bradycardia (Heart Rate)
  else if (heartRate >= 120) {
    candidateAlert = {
      category: "CARDIAC",
      severity: "CRITICAL",
      title: "Cardiac Strain Warning",
      message: `Severe tachycardia: Heart rate reached ${Math.round(heartRate)} BPM. Sit down and rest immediately.`,
    };
  }

  // 4. Check Hazardous Air Quality (AQI)
  else if (aqi >= 150) {
    candidateAlert = {
      category: "RESPIRATORY",
      severity: "HIGH",
      title: "Hazardous Air Quality Alert",
      message: `Severe pollution detected: AQI reached ${Math.round(aqi)}. Wear an N95 mask or relocate indoors.`,
    };
  }

  // 5. Check High Physical Exertion Under Heat (Steps + Heat Index + Heart Rate)
  else if (steps >= 3000 && heatIndex >= 34 && heartRate >= 100) {
    candidateAlert = {
      category: "HEAT",
      severity: "HIGH",
      title: "Exertion in Severe Heat",
      message: `High exertion detected (${steps} steps, HR ${Math.round(heartRate)} BPM) in dangerous heat (${heatIndex}°C). Take mandatory cool-down break.`,
    };
  }

  // 6. Check Moderate Heat Caution (Temperature + Heat Index)
  else if (temperature >= 37.5 || heatIndex >= 34) {
    candidateAlert = {
      category: "HEAT",
      severity: "MODERATE",
      title: "Thermal Strain Advisory",
      message: `Elevated body temperature (${temperature.toFixed(1)}°C) in heat index ${heatIndex}°C. Stay hydrated and rest in shade.`,
    };
  }

  // 6. Check Elevated Heart Rate (Heart Rate)
  else if (heartRate >= 98) {
    candidateAlert = {
      category: "CARDIAC",
      severity: "MODERATE",
      title: "Elevated Heart Rate",
      message: `Pulse elevated to ${Math.round(heartRate)} BPM. Take a brief resting pause.`,
    };
  }

  // 7. Check Low Pulse (Heart Rate)
  else if (heartRate > 0 && heartRate < 50) {
    candidateAlert = {
      category: "CARDIAC",
      severity: "MODERATE",
      title: "Low Pulse Caution",
      message: `Heart rate dropped to ${Math.round(heartRate)} BPM. Check physical condition.`,
    };
  }

  // 8. Check Dehydration / Extreme Moisture Loss (Moisture + Heat Index)
  else if (moisture >= 85 && (heatIndex >= 30 || temperature >= 33)) {
    candidateAlert = {
      category: "HEAT",
      severity: "MODERATE",
      title: "Heavy Sweat Dehydration Warning",
      message: `Heavy sweat loss detected: Skin moisture ${Math.round(moisture)}%. Risk of dehydration. Drink fluids with electrolytes.`,
    };
  }

  // 9. Check Low Skin Moisture (Moisture)
  else if (moisture > 0 && moisture <= 18 && temperature >= 34) {
    candidateAlert = {
      category: "VITALS",
      severity: "MODERATE",
      title: "Low Skin Moisture Caution",
      message: `Dry skin detected (${Math.round(moisture)}%). Drink water promptly to maintain hydration.`,
    };
  }

  // 10. Check Moderate AQI (AQI)
  else if (aqi >= 90) {
    candidateAlert = {
      category: "RESPIRATORY",
      severity: "MODERATE",
      title: "Elevated AQI Advisory",
      message: `Air pollution elevated: AQI is ${Math.round(aqi)}. Sensitive individuals should limit outdoor exertion.`,
    };
  }

  // 11. Safe & Optimal Baseline Check-in (when all 6 parameters are streaming normally)
  else if (
    heartRate > 50 &&
    heartRate < 95 &&
    temperature >= 32 &&
    temperature < 37.5 &&
    aqi > 0 &&
    aqi < 90 &&
    moisture > 15
  ) {
    const lastCheckTime = lastAlertTimes["OPTIMAL_CHECK"] || 0;
    if (now - lastCheckTime >= OPTIMAL_CHECK_COOLDOWN_MS) {
      lastAlertTimes["OPTIMAL_CHECK"] = now;
      candidateAlert = {
        category: "VITALS",
        severity: "LOW",
        title: "All 6 Vitals Optimal",
        message: `Vitals Safe: HR ${Math.round(heartRate)} BPM, Temp ${temperature.toFixed(1)}°C, Moisture ${Math.round(moisture)}%, AQI ${Math.round(aqi)}, Steps ${steps}. Working in safe baseline.`,
      };
    }
  }

  if (!candidateAlert) {
    return null;
  }

  // Apply category-based cooldown to avoid rapid duplicate spamming
  const cooldownKey = candidateAlert.category + "_" + candidateAlert.severity;
  const lastFired = lastAlertTimes[cooldownKey] || 0;
  if (now - lastFired < ALERT_COOLDOWN_MS) {
    return null;
  }
  lastAlertTimes[cooldownKey] = now;

  // 1. Persist alert into on-device SQLite database
  await dbInsertHandler(
    candidateAlert.category,
    candidateAlert.severity,
    candidateAlert.message,
    userId
  );

  // 2. Dispatch interactive In-App Notification banner
  notificationDispatchHandler({
    category: candidateAlert.category,
    severity: candidateAlert.severity,
    title: candidateAlert.title,
    message: candidateAlert.message,
  });

  return candidateAlert;
}

/**
 * Resets internal debounce cooldowns (useful for testing and user resets).
 */
export function clearAlertCooldowns(): void {
  for (const key of Object.keys(lastAlertTimes)) {
    delete lastAlertTimes[key];
  }
}
