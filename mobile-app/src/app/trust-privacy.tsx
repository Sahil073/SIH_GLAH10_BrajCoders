import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { useTheme } from "@/store/themeStore";
import {
  LockIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  DownloadArchiveIcon,
} from "@/components/common/AppIcons";

export default function TrustPrivacyScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const [shareWithCaregiver, setShareWithCaregiver] = useState(false);
  const [shareWithAsha, setShareWithAsha] = useState(false);
  const [localEncryption, setLocalEncryption] = useState(true);

  const handleExportData = () => {
    Alert.alert(
      "Export Offline Health Data",
      "Your raw telemetry will be compiled into an on-device encrypted JSON/CSV package. No servers are contacted.",
      [{ text: "OK" }]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          style={[
            styles.backButton,
            { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
          ]}
        >
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path
              d="M15 18L9 12L15 6"
              stroke={colors.textPrimary}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTag}>ZERO-CLOUD ARCHITECTURE</Text>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Trust & Privacy
          </Text>
        </View>

        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* PERSISTENT "NOTHING LEAVES YOUR PHONE" INDICATOR */}
        <View style={styles.privacyHeroCard}>
          <View style={styles.heroIconCircle}>
            <LockIcon size={28} color="#15803D" />
          </View>
          <Text style={styles.heroTitle}>100% On-Device Privacy</Text>
          <View style={styles.heroBadge}>
            <View style={styles.heroDot} />
            <Text style={styles.heroBadgeText}>NOTHING LEAVES YOUR PHONE</Text>
          </View>
          <Text style={styles.heroSub}>
            All biometrics, sensor packets, and AI risk models run entirely inside
            your phone's local processor. No servers, no tracking, no third-party telemetry.
          </Text>
        </View>

        {/* FEATURE 1: PLAIN-LANGUAGE EXPLANATION OF THE APP */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            What Sanjeevni Is & Is Not
          </Text>
          <Text style={[styles.cardSub, { color: colors.textMuted }]}>
            Clear, transparent expectations for worker safety
          </Text>

          <View style={styles.clarificationBox}>
            <View style={styles.clarificationItem}>
              <View style={{ marginRight: 10, marginTop: 2 }}>
                <CheckCircleIcon size={18} color="#16A34A" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.clarificationHeading, { color: colors.textPrimary }]}>
                  What Sanjeevni Is:
                </Text>
                <Text style={[styles.clarificationBody, { color: colors.textSecondary }]}>
                  An on-device early warning safety assistant. It monitors acute physiological
                  strain, extreme heat exposure, and sudden impact falls in high-risk outdoor jobs.
                </Text>
              </View>
            </View>

            <View style={[styles.clarificationItem, { borderBottomWidth: 0, paddingBottom: 0 }]}>
              <View style={{ marginRight: 10, marginTop: 2 }}>
                <AlertTriangleIcon size={18} color="#EF4444" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.clarificationHeading, { color: colors.textPrimary }]}>
                  What Sanjeevni Is Not:
                </Text>
                <Text style={[styles.clarificationBody, { color: colors.textSecondary }]}>
                  Sanjeevni is NOT a medical doctor and does not diagnose disease or prescribe
                  medication. Always seek a qualified healthcare provider for clinical medical conditions.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* FEATURE 3: DATA-SHARING TOGGLES FOR CAREGIVER / PHC */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            User-Controlled Data Sharing
          </Text>
          <Text style={[styles.cardSub, { color: colors.textMuted }]}>
            Opt-in sharing for safety companions and local healthcare workers
          </Text>

          {/* Toggle 1: Caregiver */}
          <View style={styles.toggleRow}>
            <View style={styles.toggleLeft}>
              <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>
                Share Status with Family / Caregiver
              </Text>
              <Text style={[styles.toggleHint, { color: colors.textMuted }]}>
                Allows designated family companion to mirror your traffic light status.
              </Text>
            </View>
            <Switch
              value={shareWithCaregiver}
              onValueChange={setShareWithCaregiver}
              trackColor={{ false: "#D1D5DB", true: "#86EFAC" }}
              thumbColor={shareWithCaregiver ? "#16A34A" : "#F3F4F6"}
            />
          </View>

          {/* Toggle 2: ASHA / PHC */}
          <View style={styles.toggleRow}>
            <View style={styles.toggleLeft}>
              <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>
                Share Risk Alert with Village PHC / ASHA
              </Text>
              <Text style={[styles.toggleHint, { color: colors.textMuted }]}>
                Enables local public health worker to receive high-risk SMS during heat waves.
              </Text>
            </View>
            <Switch
              value={shareWithAsha}
              onValueChange={setShareWithAsha}
              trackColor={{ false: "#D1D5DB", true: "#86EFAC" }}
              thumbColor={shareWithAsha ? "#16A34A" : "#F3F4F6"}
            />
          </View>

          {/* Toggle 3: Local Database Encryption */}
          <View style={[styles.toggleRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
            <View style={styles.toggleLeft}>
              <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>
                AES-256 SQLite Storage Encryption
              </Text>
              <Text style={[styles.toggleHint, { color: colors.textMuted }]}>
                Local hardware security encryption for all biometric records.
              </Text>
            </View>
            <Switch
              value={localEncryption}
              onValueChange={setLocalEncryption}
              trackColor={{ false: "#D1D5DB", true: "#86EFAC" }}
              thumbColor={localEncryption ? "#16A34A" : "#F3F4F6"}
            />
          </View>
        </View>

        {/* Data Ownership & Export */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            Your Data, Your Property
          </Text>
          <Text style={[styles.cardSub, { color: colors.textMuted }]}>
            You own 100% of your telemetry. Export or delete anytime.
          </Text>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleExportData}
            style={[styles.exportButton, { flexDirection: "row", alignItems: "center", justifyContent: "center" }]}
          >
            <DownloadArchiveIcon size={16} color="#374151" />
            <Text style={[styles.exportButtonText, { marginLeft: 8 }]}>Export Encrypted Local Archive</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleWrap: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerTag: {
    fontFamily: "Poppins-Bold",
    fontSize: 9.5,
    color: "#16A34A",
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: 16,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 100,
  },
  privacyHeroCard: {
    backgroundColor: "#F0FDF4",
    borderColor: "#BBF7D0",
    borderWidth: 1.5,
    borderRadius: 24,
    padding: 22,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#16A34A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  heroIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  heroTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: 19,
    color: "#14532D",
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    marginVertical: 8,
  },
  heroDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#16A34A",
    marginRight: 6,
  },
  heroBadgeText: {
    fontFamily: "Poppins-Bold",
    fontSize: 10.5,
    color: "#15803D",
    letterSpacing: 0.6,
  },
  heroSub: {
    fontFamily: "Poppins-Regular",
    fontSize: 12.5,
    color: "#166534",
    textAlign: "center",
    lineHeight: 18,
    marginTop: 4,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: 15,
  },
  cardSub: {
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    marginTop: 1,
    marginBottom: 12,
  },
  clarificationBox: {
    backgroundColor: "rgba(0,0,0,0.02)",
    borderRadius: 14,
    padding: 12,
  },
  clarificationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },
  checkIcon: {
    fontSize: 18,
    marginRight: 10,
    marginTop: 2,
  },
  crossIcon: {
    fontSize: 18,
    marginRight: 10,
    marginTop: 2,
  },
  clarificationHeading: {
    fontFamily: "Poppins-Bold",
    fontSize: 13,
  },
  clarificationBody: {
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  toggleLeft: {
    flex: 1,
    marginRight: 12,
  },
  toggleLabel: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 13,
  },
  toggleHint: {
    fontFamily: "Poppins-Regular",
    fontSize: 11.5,
    marginTop: 2,
    lineHeight: 15,
  },
  exportButton: {
    backgroundColor: "#F3F4F6",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 6,
  },
  exportButtonText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 12.5,
    color: "#374151",
  },
});
