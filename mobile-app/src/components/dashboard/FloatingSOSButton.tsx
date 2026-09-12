import React from "react";
import { TouchableOpacity, Text, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";

import { PhoneCallIcon } from "../common/AppIcons";

interface FloatingSOSButtonProps {
  onPress?: () => void;
}

export function FloatingSOSButton({ onPress }: FloatingSOSButtonProps) {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push("/(tabs)/sos");
    }
  };

  return (
    <View style={styles.floatingWrapper} pointerEvents="box-none">
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={handlePress}
        style={styles.sosButton}
      >
        <View style={styles.iconCircle}>
          <PhoneCallIcon size={18} color="#FFFFFF" />
        </View>
        <Text style={styles.sosText}>SOS</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingWrapper: {
    position: "absolute",
    bottom: 90, // Placed cleanly above universal bottom nav bar
    right: 20,
    zIndex: 999,
    elevation: 8,
  },
  sosButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DC2626",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: "#FEE2E2",
    shadowColor: "#DC2626",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.38,
    shadowRadius: 10,
    elevation: 8,
  },
  iconCircle: {
    marginRight: 8,
  },
  sosIcon: {
    fontSize: 16,
  },
  sosText: {
    fontFamily: "Poppins-Bold",
    fontSize: 16,
    color: "#FFFFFF",
    letterSpacing: 1.5,
  },
});
