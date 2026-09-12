import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  StyleSheet,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path, Circle } from "react-native-svg";

import { Tabs } from "expo-router";

export type BottomTabBarProps = Parameters<
  NonNullable<React.ComponentProps<typeof Tabs>["tabBar"]>
>[0];

// Tab item icons matching design pixel-perfectly
function HomeIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 10.5L12 3L21 10.5V20C21 20.5523 20.5523 21 20 21H15V15H9V21H4C3.44772 21 3 20.5523 3 20V10.5Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function AlertsIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
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

function HistoryIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      {/* Shield shape */}
      <Path
        d="M12 2L4 5.5V11.5C4 16.5 7.5 20.8 12 22C16.5 20.8 20 16.5 20 11.5V5.5L12 2Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Inner lightning bolt */}
      <Path
        d="M12.5 7L9.5 11.5H13.5L11.5 16.5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ProfileIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 21V19C20 16.7909 18.2091 15 16 15H8C5.79086 15 4 16.7909 4 19V21"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle
        cx="12"
        cy="7"
        r="4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

interface AnimatedTabProps {
  label: string;
  isFocused: boolean;
  onPress: () => void;
  renderIcon: (color: string) => React.ReactNode;
}

function TabItem({ label, isFocused, onPress, renderIcon }: AnimatedTabProps) {
  const [scale] = useState(() => new Animated.Value(1));

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.88,
      useNativeDriver: true,
      speed: 20,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 16,
      bounciness: 8,
    }).start();
  };

  const activeColor = "#214332";
  const inactiveColor = "#8A9A90";
  const color = isFocused ? activeColor : inactiveColor;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      className="flex-1 items-center justify-center pt-2 pb-1"
    >
      <Animated.View
        style={{ transform: [{ scale }] }}
        className="items-center justify-center"
      >
        <View className="items-center justify-center h-6 mb-1">
          {renderIcon(color)}
        </View>
        <Text
          className={`text-[11px] tracking-tight ${
            isFocused
              ? "font-poppins-bold text-[#214332]"
              : "font-poppins-medium text-[#8A9A90]"
          }`}
        >
          {label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

export function UniversalNavBar({ state, navigation }: BottomTabBarProps) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Floating SOS Pulse Animation
  const [sosScale] = useState(() => new Animated.Value(1));
  const [sosPulse] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(sosPulse, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(sosPulse, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [sosPulse]);

  const handleSosPressIn = () => {
    Animated.spring(sosScale, {
      toValue: 0.9,
      useNativeDriver: true,
      speed: 24,
      bounciness: 4,
    }).start();
  };

  const handleSosPressOut = () => {
    Animated.spring(sosScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 16,
      bounciness: 10,
    }).start();
  };

  const pulseRingScale = useMemo(
    () =>
      sosPulse.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.25],
      }),
    [sosPulse]
  );

  const pulseRingOpacity = useMemo(
    () =>
      sosPulse.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0.4, 0.15, 0],
      }),
    [sosPulse]
  );

  // Calculate curved cutout geometry in SVG
  const barHeight = 64;
  const center = width / 2;
  const notchWidth = 44; // Half-width of notch curve
  const notchDepth = 34; // Depth of cutout

  // Smooth bezier curve for cutout
  const pathData = `
    M 0 0
    L ${center - notchWidth} 0
    C ${center - notchWidth + 14} 0, ${center - 28} ${notchDepth}, ${center} ${notchDepth}
    C ${center + 28} ${notchDepth}, ${center + notchWidth - 14} 0, ${center + notchWidth} 0
    L ${width} 0
    L ${width} ${barHeight + insets.bottom + 20}
    L 0 ${barHeight + insets.bottom + 20}
    Z
  `;

  // Filter routes for Home, Alerts, History, Profile and SOS
  const findRouteIndex = (name: string) =>
    state.routes.findIndex((r: { name: string }) => r.name === name);

  const homeIndex = findRouteIndex("index");
  const alertsIndex = findRouteIndex("alerts");
  const sosIndex = findRouteIndex("sos");
  const historyIndex = findRouteIndex("history");
  const profileIndex = findRouteIndex("profile");

  const navigateTo = (routeName: string, targetIndex: number) => {
    if (targetIndex === -1) return;
    const isFocused = state.index === targetIndex;
    const event = navigation.emit({
      type: "tabPress",
      target: state.routes[targetIndex].key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(routeName);
    }
  };

  const isSosFocused = state.index === sosIndex;

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Math.max(insets.bottom, 12),
        },
      ]}
      pointerEvents="box-none"
    >
      {/* Curved Background SVG */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width={width} height={barHeight + insets.bottom + 20}>
          <Path
            d={pathData}
            fill="#FFFFFF"
            stroke="#E9EFEA"
            strokeWidth={1.2}
          />
        </Svg>
      </View>

      {/* Floating Center SOS Button */}
      <View
        style={[
          styles.sosWrapper,
          {
            left: center - 31,
          },
        ]}
        pointerEvents="box-none"
      >
        {/* Breathing Pulse Ring */}
        <Animated.View
          style={[
            styles.sosPulseRing,
            {
              transform: [{ scale: pulseRingScale }],
              opacity: pulseRingOpacity,
            },
          ]}
          pointerEvents="none"
        />

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigateTo("sos", sosIndex)}
          onPressIn={handleSosPressIn}
          onPressOut={handleSosPressOut}
          style={[
            styles.sosButton,
            isSosFocused && styles.sosButtonActive,
          ]}
        >
          <Animated.View
            style={{ transform: [{ scale: sosScale }] }}
            className="items-center justify-center"
          >
            <Text className="font-poppins-bold text-white text-[19px] tracking-wider leading-none">
              SOS
            </Text>
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* Navigation Tab Bar Items */}
      <View className="flex-row items-center w-full h-[64px] px-2">
        {/* Left Side: Home */}
        <TabItem
          label="Home"
          isFocused={state.index === homeIndex}
          onPress={() => navigateTo("index", homeIndex)}
          renderIcon={(color) => <HomeIcon color={color} />}
        />

        {/* Left Side: Alerts */}
        <TabItem
          label="Alerts"
          isFocused={state.index === alertsIndex}
          onPress={() => navigateTo("alerts", alertsIndex)}
          renderIcon={(color) => <AlertsIcon color={color} />}
        />

        {/* Center Spacer for Elevated SOS Button */}
        <View style={{ width: 68 }} pointerEvents="none" />

        {/* Right Side: History */}
        <TabItem
          label="History"
          isFocused={state.index === historyIndex}
          onPress={() => navigateTo("history", historyIndex)}
          renderIcon={(color) => <HistoryIcon color={color} />}
        />

        {/* Right Side: Profile */}
        <TabItem
          label="Profile"
          isFocused={state.index === profileIndex}
          onPress={() => navigateTo("profile", profileIndex)}
          renderIcon={(color) => <ProfileIcon color={color} />}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  sosWrapper: {
    position: "absolute",
    top: -24,
    width: 62,
    height: 62,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },
  sosPulseRing: {
    position: "absolute",
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#214332",
  },
  sosButton: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#214332",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#214332",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.38,
    shadowRadius: 8,
    elevation: 10,
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  sosButtonActive: {
    backgroundColor: "#163024",
    borderColor: "#EBF5EE",
  },
});
