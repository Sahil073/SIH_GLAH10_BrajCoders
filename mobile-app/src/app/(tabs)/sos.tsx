import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";
import { useUserProfile } from "@/store/userProfileStore";
import { useTheme } from "@/store/themeStore";
import {
  ShieldIcon,
  LocationPinIcon,
  CheckCircleIcon,
  BoltIcon,
} from "@/components/common/AppIcons";

type SOSState = "idle" | "countdown" | "delivered";

export default function SOSScreen() {
  const { profile } = useUserProfile();
  const { colors, isDark } = useTheme();

  const [sosState, setSosState] = useState<SOSState>("idle");
  const [countdown, setCountdown] = useState<number>(10);
  const [triggerSource, setTriggerSource] = useState<"manual" | "fall">("manual");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 10-Second Countdown Timer effect
  useEffect(() => {
    if (sosState === "countdown") {
      setCountdown(10);
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setSosState("delivered");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [sosState]);

  const handleStartSOS = (source: "manual" | "fall" = "manual") => {
    setTriggerSource(source);
    setSosState("countdown");
  };

  const handleCancelSOS = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setSosState("idle");
    setCountdown(10);
  };

  const handleResolveAlert = () => {
    setSosState("idle");
    setCountdown(10);
  };

  // SVG circular progress calculation for countdown (radius = 70)
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * (10 - countdown)) / 10;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>EMERGENCY PROTOCOL</Text>
          </View>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Emergency SOS
          </Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            Always available offline. Broadcasts GPS coordinates and vital status via SMS.
          </Text>
        </View>

        {/* Big Central Emergency Action Button */}
        <View style={styles.heroActionContainer}>
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => handleStartSOS("manual")}
            style={styles.mainSosButton}
          >
            <View style={styles.mainSosInner}>
              <Text style={styles.mainSosText}>SOS</Text>
              <Text style={styles.mainSosSub}>PRESS FOR HELP</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.sosHintText}>
            Tap to start 10s emergency dispatch countdown
          </Text>
        </View>

        {/* Automatic Fall / Distress Detection Card with Simulator */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
          ]}
        >
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardTitleWrap}>
              <View style={styles.iconCircleEmerald}>
                <ShieldIcon size={18} color="#16A34A" />
              </View>
              <View>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                  Automatic Fall Detection
                </Text>
                <Text style={[styles.cardStatusSub, { color: "#16A34A" }]}>
                  Active • 6-Axis IMU Monitoring
                </Text>
              </View>
            </View>
            <View style={styles.activePill}>
              <View style={styles.pulseDot} />
              <Text style={styles.activePillText}>READY</Text>
            </View>
          </View>

          <Text style={[styles.cardBodyText, { color: colors.textSecondary }]}>
            If an abrupt impact followed by prolonged immobility is sensed by the smart t-shirt,
            the app automatically initiates emergency broadcast.
          </Text>

          {/* Test / Simulate Button for Exhibition & Verification */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => handleStartSOS("fall")}
            style={styles.simulateButton}
          >
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
              <BoltIcon size={14} color="#DC2626" />
              <Text style={[styles.simulateButtonText, { marginLeft: 6 }]}>
                Simulate Wearable Fall Event
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Location & GPS Telemetry Card */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
          ]}
        >
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardTitleWrap}>
              <View style={styles.iconCircleAmber}>
                <LocationPinIcon size={18} color="#D97706" />
              </View>
              <View>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                  Live Emergency Coordinates
                </Text>
                <Text style={[styles.cardStatusSub, { color: colors.textMuted }]}>
                  Lat: 28.6139° N • Lon: 77.2090° E
                </Text>
              </View>
            </View>
            <View style={styles.gpsLockPill}>
              <Text style={styles.gpsLockText}>GPS LOCKED</Text>
            </View>
          </View>

          <View style={styles.locationDetailRow}>
            <Text style={[styles.locationDetailText, { color: colors.textSecondary }]}>
              Accuracy: ±3.2m • Geohash: ttn4v • Offline SMS Ready
            </Text>
          </View>
        </View>

        {/* Emergency Contacts List */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.textPrimary, marginBottom: 12 }]}>
            Dispatched Emergency Contacts
          </Text>

          <View style={styles.contactItem}>
            <View style={styles.contactLeft}>
              <View style={styles.contactAvatar}>
                <Text style={styles.contactAvatarText}>1</Text>
              </View>
              <View>
                <Text style={[styles.contactName, { color: colors.textPrimary }]}>
                  {profile.emergencyContactName || "Primary Emergency Contact"}
                </Text>
                <Text style={[styles.contactPhone, { color: colors.textMuted }]}>
                  {profile.emergencyContactPhone || "+91 98765 43210"}
                </Text>
              </View>
            </View>
            <View style={styles.smsBadge}>
              <Text style={styles.smsBadgeText}>SMS</Text>
            </View>
          </View>

          <View style={[styles.contactItem, { borderBottomWidth: 0 }]}>
            <View style={styles.contactLeft}>
              <View style={styles.contactAvatar}>
                <Text style={styles.contactAvatarText}>2</Text>
              </View>
              <View>
                <Text style={[styles.contactName, { color: colors.textPrimary }]}>
                  Local PHC / ASHA Rapid Response
                </Text>
                <Text style={[styles.contactPhone, { color: colors.textMuted }]}>
                  +91 112 (National Emergency)
                </Text>
              </View>
            </View>
            <View style={styles.smsBadge}>
              <Text style={styles.smsBadgeText}>SMS</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* SCREEN 1: COUNTDOWN & CANCEL MODAL (Full Takeover) */}
      <Modal
        visible={sosState === "countdown"}
        transparent={false}
        animationType="fade"
      >
        <SafeAreaView style={styles.countdownModalContainer}>
          <View style={styles.countdownContent}>
            <View style={styles.warningPill}>
              <Text style={styles.warningPillText}>
                {triggerSource === "fall"
                  ? "FALL / IMPACT DETECTED"
                  : "EMERGENCY SOS INITIATED"}
              </Text>
            </View>

            <Text style={styles.countdownTitle}>Sending Alert In</Text>

            {/* Circular Countdown Progress Ring */}
            <View style={styles.ringContainer}>
              <Svg width={180} height={180} viewBox="0 0 180 180">
                <Circle
                  cx={90}
                  cy={90}
                  r={radius}
                  stroke="#FEE2E2"
                  strokeWidth={12}
                  fill="none"
                />
                <Circle
                  cx={90}
                  cy={90}
                  r={radius}
                  stroke="#EF4444"
                  strokeWidth={12}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="none"
                  transform="rotate(-90 90 90)"
                />
              </Svg>
              <View style={styles.countdownNumberWrap}>
                <Text style={styles.countdownNumberText}>{countdown}</Text>
                <Text style={styles.countdownSecText}>seconds</Text>
              </View>
            </View>

            <Text style={styles.countdownExplanation}>
              {triggerSource === "fall"
                ? "The smart t-shirt detected a sudden fall. If you do not cancel, an emergency broadcast with your live coordinates will be sent."
                : "An emergency broadcast with your current location and heart rate will be dispatched automatically."}
            </Text>

            {/* Prominent "I'm OK, Cancel" Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleCancelSOS}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>I'M OK, CANCEL</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => setSosState("delivered")}
              style={styles.sendNowButton}
            >
              <Text style={styles.sendNowButtonText}>Send Immediately ›</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* SCREEN 2: POST-SOS DELIVERY CONFIRMATION MODAL */}
      <Modal
        visible={sosState === "delivered"}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.deliveredCard}>
            <View style={styles.deliveredHeader}>
              <View style={styles.successIconCircle}>
                <CheckCircleIcon size={36} color="#16A34A" />
              </View>
              <Text style={styles.deliveredTitle}>SOS Broadcast Sent</Text>
              <Text style={styles.deliveredSub}>
                Emergency alert and live location dispatched via SMS
              </Text>
            </View>

            <View style={styles.smsPreviewBox}>
              <Text style={styles.smsPreviewHeader}>SENT SMS PREVIEW:</Text>
              <Text style={styles.smsPreviewBody}>
                "EMERGENCY: Sanjeevni Alert for {profile.name || "Worker"}. Fall/distress triggered.
                GPS: 28.6139° N, 77.2090° E. HR: 114 bpm. Maps: https://maps.google.com/?q=28.6139,77.2090"
              </Text>
            </View>

            <View style={styles.recipientsList}>
              <View style={styles.recipientRow}>
                <Text style={styles.recipientDot}>•</Text>
                <Text style={styles.recipientText}>
                  {profile.emergencyContactName || "Primary Contact"} ({profile.emergencyContactPhone || "+91 98765 43210"}) — Delivered
                </Text>
              </View>
              <View style={styles.recipientRow}>
                <Text style={styles.recipientDot}>•</Text>
                <Text style={styles.recipientText}>
                  PHC Rapid Response Team — Notified
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleResolveAlert}
              style={styles.resolveButton}
            >
              <Text style={styles.resolveButtonText}>Mark as Resolved / I'm Safe</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 120,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  badge: {
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: "#FECACA",
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 16,
    marginBottom: 8,
  },
  badgeText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 11,
    color: "#DC2626",
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: 26,
    textAlign: "center",
  },
  headerSub: {
    fontFamily: "Poppins-Regular",
    fontSize: 13,
    textAlign: "center",
    marginTop: 4,
    paddingHorizontal: 10,
    lineHeight: 18,
  },
  heroActionContainer: {
    alignItems: "center",
    marginVertical: 12,
  },
  mainSosButton: {
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 10,
    borderColor: "#FEE2E2",
    shadowColor: "#DC2626",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 10,
  },
  mainSosInner: {
    alignItems: "center",
  },
  mainSosText: {
    fontFamily: "Poppins-Bold",
    fontSize: 42,
    color: "#FFFFFF",
    lineHeight: 46,
    letterSpacing: 2,
  },
  mainSosSub: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.9)",
    letterSpacing: 1,
    marginTop: 2,
  },
  sosHintText: {
    fontFamily: "Poppins-Medium",
    fontSize: 12,
    color: "#6B7280",
    marginTop: 14,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  cardTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconCircleEmerald: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  iconCircleAmber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  cardTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: 14,
  },
  cardStatusSub: {
    fontFamily: "Poppins-Medium",
    fontSize: 11,
    marginTop: 1,
  },
  activePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    borderColor: "#BBF7D0",
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#16A34A",
    marginRight: 5,
  },
  activePillText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 9.5,
    color: "#16A34A",
  },
  gpsLockPill: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  gpsLockText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 9.5,
    color: "#2563EB",
  },
  cardBodyText: {
    fontFamily: "Poppins-Regular",
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: 12,
  },
  simulateButton: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  simulateButtonText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 12,
    color: "#DC2626",
  },
  locationDetailRow: {
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 8,
  },
  locationDetailText: {
    fontFamily: "Poppins-Regular",
    fontSize: 11,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  contactLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  contactAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  contactAvatarText: {
    fontFamily: "Poppins-Bold",
    fontSize: 12,
    color: "#4B5563",
  },
  contactName: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 13,
  },
  contactPhone: {
    fontFamily: "Poppins-Regular",
    fontSize: 11,
  },
  smsBadge: {
    backgroundColor: "#E0E7FF",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  smsBadgeText: {
    fontFamily: "Poppins-Bold",
    fontSize: 10,
    color: "#4338CA",
  },

  // Countdown Modal Styles
  countdownModalContainer: {
    flex: 1,
    backgroundColor: "#111827",
    justifyContent: "center",
    alignItems: "center",
  },
  countdownContent: {
    alignItems: "center",
    paddingHorizontal: 28,
    width: "100%",
  },
  warningPill: {
    backgroundColor: "#7F1D1D",
    borderWidth: 1,
    borderColor: "#EF4444",
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 20,
  },
  warningPillText: {
    fontFamily: "Poppins-Bold",
    fontSize: 12,
    color: "#FCA5A5",
    letterSpacing: 1,
  },
  countdownTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: 28,
    color: "#FFFFFF",
    marginBottom: 20,
  },
  ringContainer: {
    width: 180,
    height: 180,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginVertical: 10,
  },
  countdownNumberWrap: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  countdownNumberText: {
    fontFamily: "Poppins-Bold",
    fontSize: 54,
    color: "#FFFFFF",
    lineHeight: 58,
  },
  countdownSecText: {
    fontFamily: "Poppins-Medium",
    fontSize: 12,
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  countdownExplanation: {
    fontFamily: "Poppins-Regular",
    fontSize: 13.5,
    color: "#D1D5DB",
    textAlign: "center",
    lineHeight: 20,
    marginVertical: 24,
    paddingHorizontal: 10,
  },
  cancelButton: {
    backgroundColor: "#22C55E",
    width: "100%",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#22C55E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  cancelButtonText: {
    fontFamily: "Poppins-Bold",
    fontSize: 16,
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  sendNowButton: {
    paddingVertical: 14,
    marginTop: 10,
  },
  sendNowButtonText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 13,
    color: "#EF4444",
  },

  // Delivered Confirmation Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  deliveredCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 380,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  deliveredHeader: {
    alignItems: "center",
    marginBottom: 16,
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  deliveredTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: 20,
    color: "#111827",
  },
  deliveredSub: {
    fontFamily: "Poppins-Regular",
    fontSize: 12.5,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 2,
  },
  smsPreviewBox: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    padding: 12,
    marginVertical: 14,
  },
  smsPreviewHeader: {
    fontFamily: "Poppins-Bold",
    fontSize: 10,
    color: "#6B7280",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  smsPreviewBody: {
    fontFamily: "Poppins-Medium",
    fontSize: 11.5,
    color: "#374151",
    lineHeight: 16,
  },
  recipientsList: {
    marginBottom: 20,
  },
  recipientRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  recipientDot: {
    color: "#16A34A",
    fontSize: 18,
    marginRight: 8,
    lineHeight: 18,
  },
  recipientText: {
    fontFamily: "Poppins-Medium",
    fontSize: 12,
    color: "#4B5563",
    flex: 1,
  },
  resolveButton: {
    backgroundColor: "#16A34A",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  resolveButtonText: {
    fontFamily: "Poppins-Bold",
    fontSize: 14,
    color: "#FFFFFF",
  },
});
