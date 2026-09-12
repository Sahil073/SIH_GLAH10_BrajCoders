import { useBleConnection } from "@/ble";
import { images } from "@/constants/images";
import { useAuth } from "@clerk/expo";
import { useUserProfile } from "@/store/userProfileStore";
import { Redirect, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    Easing,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ConnectionStatus = "scanning" | "connecting" | "connected";

export default function ConnectDeviceScreen() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const { profile, isOfflineUser } = useUserProfile();
  const {
    isConnected,
    isConnecting,
    discoveredDevices,
    startScan,
    stopScan,
    connectDevice,
  } = useBleConnection();

  const [isConnectingLocally, setIsConnectingLocally] = useState(false);
  const status: ConnectionStatus = isConnected
    ? "connected"
    : isConnecting || isConnectingLocally
      ? "connecting"
      : "scanning";
  const [showTroubleshootModal, setShowTroubleshootModal] = useState(false);

  // Radar Pulse Animation Values (3 staggered wave rings)
  const [pulseAnim1] = useState(() => new Animated.Value(0));
  const [pulseAnim2] = useState(() => new Animated.Value(0));
  const [pulseAnim3] = useState(() => new Animated.Value(0));

  // Rotating spinner animation for scanning ring
  const [spinAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    // Start continuous radar ripple animations
    const createPulseLoop = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 2400,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      );
    };

    const pulse1 = createPulseLoop(pulseAnim1, 0);
    const pulse2 = createPulseLoop(pulseAnim2, 800);
    const pulse3 = createPulseLoop(pulseAnim3, 1600);

    pulse1.start();
    pulse2.start();
    pulse3.start();

    // Spinner animation
    const spinLoop = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    spinLoop.start();

    return () => {
      pulse1.stop();
      pulse2.stop();
      pulse3.stop();
      spinLoop.stop();
    };
  }, [pulseAnim1, pulseAnim2, pulseAnim3, spinAnim]);

  const spinInterpolation = useMemo(
    () =>
      spinAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "360deg"],
      }),
    [spinAnim],
  );

  const ringStyle1 = useMemo(() => {
    const scale = pulseAnim1.interpolate({
      inputRange: [0, 1],
      outputRange: [0.8, 1.45],
    });
    const opacity = pulseAnim1.interpolate({
      inputRange: [0, 0.4, 1],
      outputRange: [0.65, 0.35, 0],
    });
    return { transform: [{ scale }], opacity };
  }, [pulseAnim1]);

  const ringStyle2 = useMemo(() => {
    const scale = pulseAnim2.interpolate({
      inputRange: [0, 1],
      outputRange: [0.8, 1.45],
    });
    const opacity = pulseAnim2.interpolate({
      inputRange: [0, 0.4, 1],
      outputRange: [0.65, 0.35, 0],
    });
    return { transform: [{ scale }], opacity };
  }, [pulseAnim2]);

  const ringStyle3 = useMemo(() => {
    const scale = pulseAnim3.interpolate({
      inputRange: [0, 1],
      outputRange: [0.8, 1.45],
    });
    const opacity = pulseAnim3.interpolate({
      inputRange: [0, 0.4, 1],
      outputRange: [0.65, 0.35, 0],
    });
    return { transform: [{ scale }], opacity };
  }, [pulseAnim3]);

  useEffect(() => {
    startScan();
    return () => {
      stopScan();
    };
  }, [startScan, stopScan]);

  useEffect(() => {
    if (isConnected) {
      const timer = setTimeout(() => {
        router.replace("/");
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [isConnected, router]);

  const targetDevice = useMemo(() => {
    return (
      discoveredDevices.find(
        (d) =>
          d.name?.toUpperCase().startsWith("ESP32") ||
          d.name?.toUpperCase().includes("SANJEEVNI"),
      ) ||
      discoveredDevices[0] ||
      null
    );
  }, [discoveredDevices]);

  const displayDeviceName = targetDevice?.name || "SANJEEVNI_TSHIRT";
  const displayDeviceMac = targetDevice?.id
    ? `ID: ${targetDevice.id}`
    : "MAC: 1A:2B:3C:4D:5E:6F";

  const handleConnect = async () => {
    if (status === "connecting" || status === "connected") return;

    setIsConnectingLocally(true);
    try {
      if (targetDevice) {
        await connectDevice(targetDevice.id);
      } else {
        await connectDevice("SIM-ESP32-HUB");
      }
    } finally {
      setIsConnectingLocally(false);
    }
  };

  const handleSkip = () => {
    router.replace("/");
  };

  if (!isLoaded) {
    return null;
  }

  if (!isSignedIn && !profile.isLoggedIn && !isOfflineUser) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        className="flex-1 px-6"
      >
        {/* Top Header: Skip Button */}
        <View className="flex-row justify-end items-center pt-2 pb-1">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleSkip}
            className="py-1.5 px-3 rounded-full"
          >
            <Text className="font-poppins-semibold text-[17px] text-[#1E6B52]">
              Skip
            </Text>
          </TouchableOpacity>
        </View>

        {/* Title & Subtitle */}
        <View className="items-center mt-2 mb-4">
          <Text className="font-poppins-bold text-[30px] text-[#101C16] text-center tracking-tight">
            Connect Your Device
          </Text>
          <Text className="font-poppins-regular text-[15px] text-[#55695E] text-center mt-2 leading-relaxed px-4">
            Make sure your Sanjeevni{"\n"}wearable is nearby.
          </Text>
        </View>

        {/* Center T-Shirt Graphic with Searching Radar Animation */}
        <View className="items-center justify-center my-4 py-2 relative">
          {/* Concentric Animated Radar Rings */}
          <Animated.View
            style={[styles.radarRing, ringStyle1]}
            pointerEvents="none"
          />
          <Animated.View
            style={[styles.radarRing, ringStyle2]}
            pointerEvents="none"
          />
          <Animated.View
            style={[styles.radarRing, ringStyle3]}
            pointerEvents="none"
          />

          {/* Static Ambient Base Circle */}
          <View style={styles.ambientBaseCircle} pointerEvents="none" />

          {/* T-Shirt Wearable Asset */}
          <View className="w-72 h-72 items-center justify-center">
            <Image
              source={images.tshirt}
              className="w-72 h-72"
              resizeMode="contain"
            />
          </View>

          {/* Device Name and MAC Address */}
          <View className="items-center mt-4">
            <Text className="font-poppins-bold text-[18px] text-[#101C16] tracking-wide text-center">
              {displayDeviceName}
            </Text>
            <Text className="font-poppins-medium text-[13px] text-[#7A8E82] text-center mt-0.5">
              {displayDeviceMac}
            </Text>
          </View>
        </View>

        {/* Bottom Actions Section */}
        <View className="w-full mt-auto pt-4">
          {/* Scanning / Status Card */}
          <View
            style={styles.statusCard}
            className="w-full bg-white rounded-2xl px-5 py-4 flex-row items-center justify-between border border-[#E9EFEA] mb-4"
          >
            <Text className="font-poppins-medium text-[15px] text-[#101C16]">
              {status === "scanning" && "Scanning for devices..."}
              {status === "connecting" && "Connecting to Sanjeevni..."}
              {status === "connected" && "Connected successfully!"}
            </Text>

            {status === "scanning" && (
              <Animated.View
                style={{ transform: [{ rotate: spinInterpolation }] }}
              >
                <View style={styles.spinnerCircle}>
                  <View style={styles.spinnerHead} />
                </View>
              </Animated.View>
            )}

            {status === "connecting" && (
              <ActivityIndicator size="small" color="#214332" />
            )}

            {status === "connected" && (
              <View className="w-7 h-7 rounded-full bg-[#EBF5EE] items-center justify-center border border-[#D5EBDE]">
                <Text className="text-[#214332] font-bold text-sm">✓</Text>
              </View>
            )}
          </View>

          {/* Connect Button */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleConnect}
            disabled={status === "connecting" || status === "connected"}
            className="w-full py-4 px-8 min-h-[60px] bg-[#214332] rounded-full flex-row items-center justify-center shadow-md shadow-[#214332]/30"
          >
            {status === "connecting" ? (
              <View className="flex-row items-center">
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text className="font-poppins-semibold text-white text-[17px] ml-2.5">
                  Connecting...
                </Text>
              </View>
            ) : status === "connected" ? (
              <Text className="font-poppins-semibold text-white text-[17px]">
                Connected!
              </Text>
            ) : (
              <Text className="font-poppins-semibold text-white text-[17px]">
                Connect
              </Text>
            )}
          </TouchableOpacity>

          {/* Can't Find Device Link */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setShowTroubleshootModal(true)}
            className="items-center justify-center mt-4 py-2"
          >
            <Text className="font-poppins-medium text-[15px] text-[#1E6B52] text-center">
              Can{"'"}t find device?
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Troubleshooting Guidance Modal */}
      <Modal
        visible={showTroubleshootModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTroubleshootModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
            <View className="items-center mb-3">
              <View className="w-12 h-12 rounded-full bg-[#EBF5EE] items-center justify-center mb-2 border border-[#D5EBDE]">
                <Text className="text-xl">🔍</Text>
              </View>
              <Text className="font-poppins-bold text-xl text-[#101C16] text-center">
                Troubleshooting
              </Text>
            </View>

            <View className="space-y-3 mb-5">
              <Text className="font-poppins-regular text-sm text-[#4A6455] leading-relaxed">
                • Ensure your Sanjeevni wearable module is powered on and
                charged.
              </Text>
              <Text className="font-poppins-regular text-sm text-[#4A6455] leading-relaxed">
                • Keep your phone within 5 meters of the wearable.
              </Text>
              <Text className="font-poppins-regular text-sm text-[#4A6455] leading-relaxed">
                • Check that Bluetooth is enabled on your phone.
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setShowTroubleshootModal(false)}
              className="w-full py-3.5 bg-[#214332] rounded-full items-center justify-center"
            >
              <Text className="font-poppins-semibold text-white text-base">
                Got it
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  radarRing: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 2,
    borderColor: "rgba(50, 160, 100, 0.4)",
    backgroundColor: "rgba(220, 245, 230, 0.12)",
  },
  ambientBaseCircle: {},
  statusCard: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  spinnerCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2.5,
    borderColor: "#E2E8E4",
    borderTopColor: "#214332",
    alignItems: "center",
    justifyContent: "center",
  },
  spinnerHead: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#214332",
    position: "absolute",
    top: 0,
  },
});
