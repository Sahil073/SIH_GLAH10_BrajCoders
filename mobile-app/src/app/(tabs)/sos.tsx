import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
  TextInput,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";
import { useUserProfile, saveUserProfile } from "@/store/userProfileStore";
import { useTheme } from "@/store/themeStore";
import { useDashboardData } from "@/hooks/useDashboardData";
import {
  ShieldIcon,
  LocationPinIcon,
  CheckCircleIcon,
  BoltIcon,
  PhoneCallIcon,
} from "@/components/common/AppIcons";
import {
  dispatchSOSviaSMS,
  getLiveCoordinates,
  buildSOSTextMessage,
  SOSDispatchResult,
} from "@/services/smsService";

type SOSState = "idle" | "countdown" | "delivered";

export default function SOSScreen() {
  const { profile } = useUserProfile();
  const { colors } = useTheme();
  const { data } = useDashboardData();

  const [sosState, setSosState] = useState<SOSState>("idle");
  const [countdown, setCountdown] = useState<number>(10);
  const [triggerSource, setTriggerSource] = useState<"manual" | "fall">("manual");
  const [isSending, setIsSending] = useState<boolean>(false);
  const [lastDispatch, setLastDispatch] = useState<SOSDispatchResult | null>(null);

  // Phone number state with inline editor for quick testing with personal phone
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [editablePhone, setEditablePhone] = useState(
    profile.emergencyContactPhone || "+91 98765 43210"
  );

  // Live GPS Coordinates state
  const [coords, setCoords] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
    isSimulated: boolean;
  }>({
    latitude: 28.6139,
    longitude: 77.209,
    accuracy: 3.2,
    isSimulated: true,
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch coordinates on mount
  useEffect(() => {
    getLiveCoordinates().then((c) => setCoords(c));
  }, []);

  // Sync profile emergency phone if changed elsewhere
  useEffect(() => {
    if (profile.emergencyContactPhone) {
      setEditablePhone(profile.emergencyContactPhone);
    }
  }, [profile.emergencyContactPhone]);

  // Actual dispatch logic: formats SMS with coordinates & vitals, then launches SMS app
  const executeSMSDispatch = async (source: "manual" | "fall") => {
    setIsSending(true);
    const targetPhone = editablePhone.trim() || profile.emergencyContactPhone || "+91 98765 43210";

    // Refresh coordinates immediately before dispatch
    const currentCoords = await getLiveCoordinates();
    setCoords(currentCoords);

    const result = await dispatchSOSviaSMS({
      recipientPhone: targetPhone,
      recipientName: profile.emergencyContactName || "Primary Emergency Contact",
      userName: profile.name || "Worker",
      userAge: profile.age,
      userGender: profile.gender,
      bloodGroup: profile.bloodGroup,
      medicalCondition: profile.medicalCondition,
      latitude: currentCoords.latitude,
      longitude: currentCoords.longitude,
      heartRate: data.heartRate.value,
      temperature: data.temperature.value,
      moisture: data.moisture.value,
      aqi: data.aqi.value,
      triggerType: source,
    });

    setLastDispatch(result);
    setIsSending(false);
    setSosState("delivered");
  };

  // 10-Second Countdown Timer effect
  useEffect(() => {
    if (sosState === "countdown") {
      setCountdown(10);
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            executeSMSDispatch(triggerSource);
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
  }, [sosState, triggerSource, editablePhone]);

  // Start SOS flow with countdown
  const handleStartCountdown = (source: "manual" | "fall" = "manual") => {
    setTriggerSource(source);
    setSosState("countdown");
  };

  // Instant direct SOS dispatch without waiting 10 seconds
  const handleInstantDispatch = (source: "manual" | "fall" = "manual") => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setTriggerSource(source);
    executeSMSDispatch(source);
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

  const handleSavePhone = async () => {
    const trimmed = editablePhone.trim();
    if (!trimmed) {
      Alert.alert("Phone Number", "Please enter a valid phone number.");
      return;
    }
    await saveUserProfile({ emergencyContactPhone: trimmed });
    setIsEditingPhone(false);
    Alert.alert("Saved", `Emergency contact phone set to ${trimmed}`);
  };

  // SVG circular progress calculation for countdown (radius = 70)
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * (10 - countdown)) / 10;

  const currentPhone = editablePhone.trim() || profile.emergencyContactPhone || "+91 98765 43210";

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
            Broadcasts live GPS coordinates, Google Maps link, and vital status to emergency contact via SMS.
          </Text>
        </View>

        {/* Big Central Emergency Action Button */}
        <View style={styles.heroActionContainer}>
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => handleInstantDispatch("manual")}
            style={styles.mainSosButton}
          >
            <View style={styles.mainSosInner}>
              <Text style={styles.mainSosText}>SOS</Text>
              <Text style={styles.mainSosSub}>PRESS FOR HELP</Text>
            </View>
          </TouchableOpacity>

          {/* Quick Action Buttons: Instant Send or 10s Countdown */}
          <View style={styles.actionButtonGroup}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handleInstantDispatch("manual")}
              style={styles.instantDispatchButton}
            >
              <View style={{ marginRight: 6 }}>
                <PhoneCallIcon size={16} color="#FFFFFF" />
              </View>
              <Text style={styles.instantDispatchText}>
                {isSending ? "SENDING SMS..." : "SEND EMERGENCY SMS NOW"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleStartCountdown("manual")}
              style={styles.countdownTriggerButton}
            >
              <Text style={styles.countdownTriggerText}>
                ⏱ Start 10s Countdown Check
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sosHintText}>
            Tapping SOS sends live coordinates & vitals to {currentPhone}
          </Text>
        </View>

        {/* Recipient Phone Number Card (Stored in App) */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
          ]}
        >
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardTitleWrap}>
              <View style={styles.iconCircleBlue}>
                <PhoneCallIcon size={16} color="#2563EB" />
              </View>
              <View>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                  Emergency SMS Recipient
                </Text>
                <Text style={[styles.cardStatusSub, { color: colors.textMuted }]}>
                  Present inside app profile
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => setIsEditingPhone((prev) => !prev)}
              style={styles.editPhoneBtn}
            >
              <Text style={styles.editPhoneBtnText}>
                {isEditingPhone ? "Cancel" : "Change"}
              </Text>
            </TouchableOpacity>
          </View>

          {isEditingPhone ? (
            <View style={styles.phoneEditRow}>
              <TextInput
                value={editablePhone}
                onChangeText={setEditablePhone}
                placeholder="+91 98765 43210"
                keyboardType="phone-pad"
                style={[
                  styles.phoneInput,
                  { color: colors.textPrimary, borderColor: colors.cardBorder },
                ]}
              />
              <TouchableOpacity
                onPress={handleSavePhone}
                style={styles.savePhoneBtn}
              >
                <Text style={styles.savePhoneBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.phoneDisplayRow}>
              <View>
                <Text style={[styles.phoneDisplayText, { color: colors.textPrimary }]}>
                  {currentPhone}
                </Text>
                <Text style={[styles.phoneContactSub, { color: colors.textSecondary }]}>
                  {profile.emergencyContactName || "Primary Emergency Contact"}
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => handleInstantDispatch("manual")}
                style={styles.quickSendBadge}
              >
                <Text style={styles.quickSendBadgeText}>TEST SMS</Text>
              </TouchableOpacity>
            </View>
          )}
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
                <Text style={[styles.cardStatusSub, { color: "#D97706" }]}>
                  Lat: {coords.latitude.toFixed(4)}° N • Lon: {coords.longitude.toFixed(4)}° E
                </Text>
              </View>
            </View>
            <View style={styles.gpsLockPill}>
              <Text style={styles.gpsLockText}>
                {coords.isSimulated ? "OFFLINE GPS" : "GPS LOCKED"}
              </Text>
            </View>
          </View>

          <View style={styles.locationDetailRow}>
            <Text style={[styles.locationDetailText, { color: colors.textSecondary }]}>
              Maps: https://maps.google.com/?q={coords.latitude.toFixed(4)},{coords.longitude.toFixed(4)}
            </Text>
            <Text style={[styles.locationDetailSub, { color: colors.textMuted }]}>
              Accuracy: ±{coords.accuracy}m • Embedded into emergency SMS
            </Text>
          </View>
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
            If an abrupt impact followed by prolonged immobility is sensed by the wearable,
            an emergency broadcast with coordinates is dispatched to your emergency contact.
          </Text>

          {/* Test / Simulate Button for Exhibition & Verification */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => handleStartCountdown("fall")}
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
              Sending live GPS coordinates ({coords.latitude.toFixed(4)}°, {coords.longitude.toFixed(4)}°) and vital metrics via SMS to {currentPhone}.
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
              onPress={() => executeSMSDispatch(triggerSource)}
              style={styles.sendNowButton}
            >
              <Text style={styles.sendNowButtonText}>Send SMS Immediately ›</Text>
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
              <Text style={styles.deliveredTitle}>SOS Broadcast Dispatched</Text>
              <Text style={styles.deliveredSub}>
                Coordinates, Maps link, and vitals sent to emergency phone via SMS
              </Text>
            </View>

            <View style={styles.smsPreviewBox}>
              <Text style={styles.smsPreviewHeader}>DISPATCHED SMS CONTENT:</Text>
              <Text style={styles.smsPreviewBody}>
                {lastDispatch?.body ||
                  buildSOSTextMessage({
                    recipientPhone: currentPhone,
                    userName: profile.name || "Worker",
                    bloodGroup: profile.bloodGroup,
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                    heartRate: data.heartRate.value,
                    temperature: data.temperature.value,
                    moisture: data.moisture.value,
                    aqi: data.aqi.value,
                    triggerType: triggerSource,
                  })}
              </Text>
            </View>

            <View style={styles.recipientsList}>
              <View style={styles.recipientRow}>
                <Text style={styles.recipientDot}>•</Text>
                <Text style={styles.recipientText}>
                  Recipient: {currentPhone} ({profile.emergencyContactName || "Emergency Contact"}) — Dispatched
                </Text>
              </View>
              <View style={styles.recipientRow}>
                <Text style={styles.recipientDot}>•</Text>
                <Text style={styles.recipientText}>
                  GPS: {coords.latitude.toFixed(4)}° N, {coords.longitude.toFixed(4)}° E (Google Maps Link Attached)
                </Text>
              </View>
            </View>

            <View style={styles.postActionRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => executeSMSDispatch(triggerSource)}
                style={styles.resendButton}
              >
                <Text style={styles.resendButtonText}>Open / Resend SMS</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleResolveAlert}
                style={styles.resolveButton}
              >
                <Text style={styles.resolveButtonText}>Mark as Resolved / I'm Safe</Text>
              </TouchableOpacity>
            </View>
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
    marginBottom: 16,
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
    marginVertical: 10,
  },
  mainSosButton: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 8,
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
  actionButtonGroup: {
    width: "100%",
    marginTop: 16,
    alignItems: "center",
  },
  instantDispatchButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DC2626",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    width: "100%",
    shadowColor: "#DC2626",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  instantDispatchText: {
    fontFamily: "Poppins-Bold",
    fontSize: 13.5,
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  countdownTriggerButton: {
    paddingVertical: 8,
    marginTop: 6,
  },
  countdownTriggerText: {
    fontFamily: "Poppins-Medium",
    fontSize: 12,
    color: "#6B7280",
  },
  sosHintText: {
    fontFamily: "Poppins-Medium",
    fontSize: 11.5,
    color: "#6B7280",
    marginTop: 6,
    textAlign: "center",
    paddingHorizontal: 16,
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
  iconCircleBlue: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
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
  editPhoneBtn: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  editPhoneBtnText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 11,
    color: "#2563EB",
  },
  phoneDisplayRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 4,
  },
  phoneDisplayText: {
    fontFamily: "Poppins-Bold",
    fontSize: 16,
    letterSpacing: 0.5,
  },
  phoneContactSub: {
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    marginTop: 2,
  },
  quickSendBadge: {
    backgroundColor: "#FEE2E2",
    borderColor: "#FECACA",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  quickSendBadgeText: {
    fontFamily: "Poppins-Bold",
    fontSize: 10,
    color: "#DC2626",
    letterSpacing: 0.5,
  },
  phoneEditRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  phoneInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontFamily: "Poppins-Medium",
    fontSize: 14,
    marginRight: 8,
    backgroundColor: "#FFFFFF",
  },
  savePhoneBtn: {
    backgroundColor: "#16A34A",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  savePhoneBtnText: {
    fontFamily: "Poppins-Bold",
    fontSize: 12,
    color: "#FFFFFF",
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
    fontFamily: "Poppins-Medium",
    fontSize: 11,
    color: "#2563EB",
  },
  locationDetailSub: {
    fontFamily: "Poppins-Regular",
    fontSize: 10.5,
    marginTop: 2,
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
    fontSize: 13,
    color: "#D1D5DB",
    textAlign: "center",
    lineHeight: 19,
    marginVertical: 20,
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
    padding: 22,
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
    marginBottom: 14,
  },
  successIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  deliveredTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: 19,
    color: "#111827",
  },
  deliveredSub: {
    fontFamily: "Poppins-Regular",
    fontSize: 12,
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
    marginVertical: 12,
    maxHeight: 180,
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
    fontSize: 11,
    color: "#374151",
    lineHeight: 15,
  },
  recipientsList: {
    marginBottom: 16,
  },
  recipientRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  recipientDot: {
    color: "#16A34A",
    fontSize: 16,
    marginRight: 6,
    lineHeight: 16,
  },
  recipientText: {
    fontFamily: "Poppins-Medium",
    fontSize: 11.5,
    color: "#4B5563",
    flex: 1,
  },
  postActionRow: {
    gap: 8,
  },
  resendButton: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  resendButtonText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 13,
    color: "#2563EB",
  },
  resolveButton: {
    backgroundColor: "#16A34A",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  resolveButtonText: {
    fontFamily: "Poppins-Bold",
    fontSize: 13.5,
    color: "#FFFFFF",
  },
});
