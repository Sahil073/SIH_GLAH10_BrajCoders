import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useInAppNotification } from "@/store/notificationStore";
import { useTheme } from "@/store/themeStore";
import Svg, { Path } from "react-native-svg";

function BellIcon({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 0 0 6 8C6 15 3 17 3 17H21S18 15 18 8Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10.3 21A1.94 1.94 0 0 0 13.7 21"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function CloseIcon({ color, size = 14 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 6L6 18M6 6L18 18"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function InAppNotificationBanner() {
  const { notification, dismiss } = useInAppNotification();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const translateY = useRef(new Animated.Value(-150)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (notification) {
      // Spring down into view
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 70,
          friction: 9,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss after 4.5 seconds
      timerRef.current = setTimeout(() => {
        handleDismiss();
      }, 4500);
    } else {
      handleDismiss();
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [notification]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -150,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      dismiss();
    });
  };

  const handlePress = () => {
    handleDismiss();
    try {
      router.push("/(tabs)/alerts");
    } catch {
      // safe fallback
    }
  };

  if (!notification) {
    return null;
  }

  const severityColor =
    notification.severity === "CRITICAL"
      ? "#EF4444"
      : notification.severity === "HIGH"
      ? "#F97316"
      : notification.severity === "MODERATE"
      ? "#F59E0B"
      : "#10B981";

  const severityBg =
    notification.severity === "CRITICAL"
      ? "bg-red-500/10"
      : notification.severity === "HIGH"
      ? "bg-orange-500/10"
      : notification.severity === "MODERATE"
      ? "bg-amber-500/10"
      : "bg-emerald-500/10";

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.container,
        {
          top: Math.max(insets.top, 16),
          transform: [{ translateY }],
          opacity,
          width: Math.min(width - 32, 480),
          left: (width - Math.min(width - 32, 480)) / 2,
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={handlePress}
        style={[
          styles.bannerCard,
          {
            backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
            borderColor: isDark ? "#374151" : "#E5E7EB",
          },
        ]}
      >
        {/* Severity Color Strip Indicator */}
        <View
          style={[
            styles.strip,
            {
              backgroundColor: severityColor,
            },
          ]}
        />

        <View className="flex-row items-start flex-1 p-3.5 pl-4">
          {/* Icon Badge */}
          <View
            className={`w-9 h-9 rounded-xl ${severityBg} items-center justify-center mr-3 mt-0.5`}
          >
            <BellIcon color={severityColor} size={18} />
          </View>

          {/* Text Content */}
          <View className="flex-1 mr-2">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Text
                  style={{ color: colors.textPrimary }}
                  className="font-poppins-semibold text-xs tracking-tight"
                  numberOfLines={1}
                >
                  {notification.title}
                </Text>
                <View
                  style={{ backgroundColor: severityColor }}
                  className="px-1.5 py-0.2 rounded ml-1.5"
                >
                  <Text className="text-[9px] font-poppins-bold text-white uppercase tracking-wider">
                    {notification.severity}
                  </Text>
                </View>
              </View>
              <Text
                style={{ color: colors.textMuted }}
                className="font-poppins-regular text-[10px]"
              >
                {notification.timestamp}
              </Text>
            </View>

            <Text
              style={{ color: colors.textSecondary }}
              className="font-poppins-regular text-[11px] mt-0.5 leading-4"
              numberOfLines={2}
            >
              {notification.message}
            </Text>

            <View className="flex-row items-center mt-1.5">
              <Text
                style={{ color: severityColor }}
                className="font-poppins-semibold text-[10px]"
              >
                Tap to view in Alerts →
              </Text>
            </View>
          </View>

          {/* Close Action Button */}
          <TouchableOpacity
            hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
            onPress={(e) => {
              e.stopPropagation();
              handleDismiss();
            }}
            className="p-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800"
          >
            <CloseIcon color={colors.textSecondary} size={12} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    zIndex: 9999,
    elevation: 9999,
  },
  bannerCard: {
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
    overflow: "hidden",
    flexDirection: "row",
  },
  strip: {
    width: 5,
    height: "100%",
  },
});
