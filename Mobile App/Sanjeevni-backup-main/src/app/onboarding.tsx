import { images } from "@/constants/images";
import { useAuth } from "@clerk/expo";
import { Redirect, useRouter } from "expo-router";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useUserProfile } from "@/store/userProfileStore";

export default function OnboardingScreen() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const { profile } = useUserProfile();

  const handleGetStarted = () => {
    router.push("/(auth)/sign-up");
  };

  if (!isLoaded) {
    return null;
  }

  if (isSignedIn) {
    if (!profile.isCompleted) {
      return <Redirect href="/onboarding-health" />;
    }
    return <Redirect href="/(tabs)" />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <View className="flex-1 justify-between px-6 pt-2 pb-6">
        {/* Top Header: Logo & App Name */}
        <View className="flex-row items-center justify-center py-2">
          <Image
            source={images.mascotLogo}
            className="w-9 h-9"
            resizeMode="contain"
          />
          <Text className="font-poppins-bold text-[26px] text-[#1E3A2B] tracking-tight ml-2">
            sanjeevni
          </Text>
        </View>

        {/* Title & Subtitle Section */}
        <View className="mt-4 px-2">
          <Text className="font-poppins-bold text-[36px] leading-[42px] text-[#101C16]">
            Your AI
          </Text>
          <Text className="font-poppins-bold text-[36px] leading-[42px] text-[#101C16]">
            Health{" "}
            <Text className="text-[#33684B]">
              Companion.
            </Text>
          </Text>

          <Text className="font-poppins-regular text-[15px] leading-[23px] text-[#55695E] mt-3">
            Real-time monitoring, smarter insights,{"\n"}safer tomorrows.
          </Text>
        </View>

        {/* Hero Section: Mascot & Floating Badges */}
        <View className="relative items-center justify-center my-auto w-full py-4 min-h-[340px]">
          {/* Decorative Sparkle Lines near head */}
          <View className="absolute top-10 left-[26%] flex-row items-center gap-1.5 -rotate-12">
            <View className="w-1 h-3.5 bg-[#4B8361] rounded-full rotate-12 opacity-80" />
            <View className="w-1 h-4.5 bg-[#4B8361] rounded-full -rotate-6 opacity-80" />
          </View>
          <View className="absolute top-10 right-[28%] flex-row items-center gap-1.5 rotate-12">
            <View className="w-1 h-4 bg-[#4B8361] rounded-full rotate-12 opacity-80" />
            <View className="w-1 h-3 bg-[#4B8361] rounded-full -rotate-6 opacity-80" />
          </View>

          {/* Background Foliage Leaves Accents */}
          <View className="absolute bottom-4 left-2 opacity-70">
            <View className="w-10 h-16 bg-[#8FA791] rounded-t-full rotate-[-25deg]" />
            <View className="w-8 h-12 bg-[#6E8D71] rounded-t-full rotate-[15deg] absolute -top-2 left-4" />
          </View>
          <View className="absolute bottom-6 right-3 opacity-70">
            <View className="w-9 h-14 bg-[#8FA791] rounded-t-full rotate-[20deg]" />
            <View className="w-7 h-10 bg-[#6E8D71] rounded-t-full rotate-[-10deg] absolute -top-1 right-3" />
          </View>

          {/* Floating Callout 1: Top Left - Healthier You! */}
          <View className="absolute top-4 left-0 z-20">
            <View className="bg-[#FFF0ED] border border-[#FCD9D1] rounded-2xl px-3 py-2 flex-row items-center shadow-sm">
              <View className="w-7 h-7 rounded-full items-center justify-center mr-2">
                <Text className="text-[18px]">❤️</Text>
              </View>
              <View>
                <Text className="font-poppins-semibold text-[13px] leading-[16px] text-[#1E2E25]">
                  Healthier
                </Text>
                <Text className="font-poppins-semibold text-[13px] leading-[16px] text-[#1E2E25]">
                  You!
                </Text>
              </View>
            </View>
            {/* Speech bubble tail pointing bottom-right */}
            <View className="absolute -bottom-1.5 right-6 w-3 h-3 bg-[#FFF0ED] border-r border-b border-[#FCD9D1] rotate-45" />
          </View>

          {/* Floating Callout 2: Top Right - Safer Always! */}
          <View className="absolute top-2 right-0 z-20">
            <View className="bg-[#EEF7F1] border border-[#D5EBDE] rounded-2xl px-3 py-2 flex-row items-center shadow-sm">
              <View className="w-7 h-7 rounded-full items-center justify-center mr-2">
                <Text className="text-[18px]">🛡️</Text>
              </View>
              <View>
                <Text className="font-poppins-semibold text-[13px] leading-[16px] text-[#1E2E25]">
                  Safer
                </Text>
                <Text className="font-poppins-semibold text-[13px] leading-[16px] text-[#1E2E25]">
                  Always!
                </Text>
              </View>
            </View>
            {/* Speech bubble tail pointing bottom-left */}
            <View className="absolute -bottom-1.5 left-6 w-3 h-3 bg-[#EEF7F1] border-l border-b border-[#D5EBDE] rotate-45" />
          </View>

          {/* Mascot Hero Image */}
          <Image
            source={images.mascotWelcome}
            className="w-72 h-72"
            resizeMode="contain"
          />

          {/* Floating Callout 3: Bottom Left - Cleaner Environment! */}
          <View className="absolute bottom-16 left-[-4px] z-20">
            <View className="bg-[#F0F7ED] border border-[#DDECD7] rounded-2xl px-3 py-2 flex-row items-center shadow-sm">
              <View className="w-7 h-7 rounded-full items-center justify-center mr-2">
                <Text className="text-[18px]">🍃</Text>
              </View>
              <View>
                <Text className="font-poppins-semibold text-[13px] leading-[16px] text-[#1E2E25]">
                  Cleaner
                </Text>
                <Text className="font-poppins-semibold text-[13px] leading-[16px] text-[#1E2E25]">
                  Environment!
                </Text>
              </View>
            </View>
            {/* Speech bubble tail pointing right */}
            <View className="absolute top-4 -right-1.5 w-3 h-3 bg-[#F0F7ED] border-t border-r border-[#DDECD7] rotate-45" />
          </View>

          {/* Floating Callout 4: Bottom Right - Support When You Need It! */}
          <View className="absolute bottom-14 right-[-4px] z-20">
            <View className="bg-[#FDF5E9] border border-[#F7E7CE] rounded-2xl px-3 py-2 flex-row items-center shadow-sm">
              <View className="w-7 h-7 rounded-full items-center justify-center mr-2">
                <Text className="text-[18px]">👥</Text>
              </View>
              <View>
                <Text className="font-poppins-semibold text-[13px] leading-[16px] text-[#1E2E25]">
                  Support
                </Text>
                <Text className="font-poppins-semibold text-[13px] leading-[16px] text-[#1E2E25]">
                  When You
                </Text>
                <Text className="font-poppins-semibold text-[13px] leading-[16px] text-[#1E2E25]">
                  Need It!
                </Text>
              </View>
            </View>
            {/* Speech bubble tail pointing left */}
            <View className="absolute top-4 -left-1.5 w-3 h-3 bg-[#FDF5E9] border-b border-l border-[#F7E7CE] rotate-45" />
          </View>
        </View>

        {/* Bottom Action Section (Without Pagination Dots) */}
        <View className="w-full mt-auto pt-2 pb-2">
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleGetStarted}
            className="w-full py-5 px-8 min-h-[68px] bg-[#214332] rounded-full flex-row items-center justify-center relative shadow-md shadow-[#214332]/30"
          >
            <Text className="font-poppins-semibold text-white text-[18px] tracking-wide">
              Get Started
            </Text>
            <View className="absolute right-7 items-center justify-center">
              <Text className="text-white text-2xl font-light leading-none">
                ›
              </Text>
            </View>
          </TouchableOpacity>

          <Text className="font-poppins-medium text-[13px] text-[#4A6455] text-center mt-4 tracking-tight">
            A Safer, Healthier Tomorrow
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
