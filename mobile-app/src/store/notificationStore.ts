import { useState, useEffect } from "react";

export interface InAppNotification {
  id: string;
  category: "CARDIAC" | "HEAT" | "RESPIRATORY" | "FALL" | "VITALS" | "SYSTEM";
  severity: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  title: string;
  message: string;
  timestamp: string;
}

let activeNotification: InAppNotification | null = null;
let unreadAlertsCount = 0;
const listeners: Set<() => void> = new Set();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

export function showInAppNotification(notification: Omit<InAppNotification, "id" | "timestamp">): void {
  const item: InAppNotification = {
    ...notification,
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };

  activeNotification = item;
  unreadAlertsCount += 1;
  notifyListeners();
}

export function dismissInAppNotification(): void {
  activeNotification = null;
  notifyListeners();
}

export function markAlertsAsViewed(): void {
  unreadAlertsCount = 0;
  notifyListeners();
}

export function useInAppNotification() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const handler = () => setTick((prev) => prev + 1);
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  return {
    notification: activeNotification,
    unreadCount: unreadAlertsCount,
    dismiss: dismissInAppNotification,
    markViewed: markAlertsAsViewed,
  };
}
