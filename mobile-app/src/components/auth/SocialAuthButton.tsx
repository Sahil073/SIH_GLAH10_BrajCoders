import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

export type SocialProvider = "google" | "facebook" | "apple";

interface SocialAuthButtonProps {
  provider: SocialProvider;
  onPress?: () => void;
}

export const SocialAuthButton: React.FC<SocialAuthButtonProps> = ({
  provider,
  onPress,
}) => {
  const getProviderConfig = () => {
    switch (provider) {
      case "google":
        return {
          title: "Continue with Google",
          icon: (
            <View className="w-6 h-6 items-center justify-center">
              <Text className="font-poppins-bold text-[17px] text-[#EA4335]">
                G
              </Text>
            </View>
          ),
        };
      case "facebook":
        return {
          title: "Continue with Facebook",
          icon: (
            <View className="w-6 h-6 rounded-full bg-[#1877F2] items-center justify-center">
              <Text className="font-poppins-bold text-[15px] text-white leading-none">
                f
              </Text>
            </View>
          ),
        };
      case "apple":
        return {
          title: "Continue with Apple",
          icon: (
            <View className="w-6 h-6 items-center justify-center">
              <Text className="text-[17px] text-black leading-none">
                
              </Text>
            </View>
          ),
        };
    }
  };

  const config = getProviderConfig();

  return (
    <TouchableOpacity
      activeOpacity={0.78}
      onPress={onPress}
      className="w-full bg-white border border-[#E2E8E4] rounded-2xl py-3.5 px-5 flex-row items-center justify-center mb-3 shadow-sm"
    >
      <View className="absolute left-5">{config.icon}</View>
      <Text className="font-poppins-medium text-[15px] text-[#111C16]">
        {config.title}
      </Text>
    </TouchableOpacity>
  );
};
