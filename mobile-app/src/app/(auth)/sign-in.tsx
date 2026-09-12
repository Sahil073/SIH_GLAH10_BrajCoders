import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth, useSignIn, useSSO } from "@clerk/expo";
import { images } from "@/constants/images";
import { SocialAuthButton, SocialProvider } from "@/components/auth/SocialAuthButton";
import { VerificationModal } from "@/components/auth/VerificationModal";

export default function SignInScreen() {
  const router = useRouter();
  const { isLoaded } = useAuth();
  const { signIn } = useSignIn();
  const { startSSOFlow } = useSSO();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  const handleSignIn = async () => {
    if (!isLoaded) return;
    if (!email.trim()) {
      setErrorMsg("Please enter your email address.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      if (signIn.status) {
        await signIn.reset();
      }

      const { error } = await signIn.emailCode.sendCode({
        emailAddress: email.trim(),
      });

      if (error) {
        setErrorMsg(error.message || "Sign in failed. Please check your email and try again.");
        return;
      }

      setShowVerificationModal(true);
    } catch (err: unknown) {
      const clerkError = err as { message?: string };
      setErrorMsg(clerkError?.message || "Sign in failed. Please check your email and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (code: string) => {
    const { error } = await signIn.emailCode.verifyCode({ code });
    if (error) {
      throw new Error(error.message || "Verification code is invalid or expired.");
    }

    if (signIn.status === "complete") {
      const { error: finalizeError } = await signIn.finalize();
      if (finalizeError) {
        throw new Error(finalizeError.message || "Failed to finalize session.");
      }
      setShowVerificationModal(false);
      router.replace("/connect-device");
    } else {
      throw new Error("Verification incomplete. Please check the code and try again.");
    }
  };

  const handleResendCode = async () => {
    const { error } = await signIn.emailCode.sendCode();
    if (error) {
      throw new Error(error.message || "Failed to resend code.");
    }
  };

  const handleSocialAuth = async (provider: SocialProvider) => {
    const strategyMap: Record<SocialProvider, "oauth_google" | "oauth_facebook" | "oauth_apple"> = {
      google: "oauth_google",
      facebook: "oauth_facebook",
      apple: "oauth_apple",
    };

    try {
      setErrorMsg(null);
      const strategy = strategyMap[provider];
      const { createdSessionId, setActive: setSSOActive } = await startSSOFlow({ strategy });

      if (createdSessionId && setSSOActive) {
        await setSSOActive({ session: createdSessionId });
        router.replace("/connect-device");
      }
    } catch (err: unknown) {
      const clerkError = err as { errors?: { message?: string }[]; message?: string };
      const msg = clerkError?.errors?.[0]?.message || clerkError?.message || "Social sign in failed. Please try again.";
      setErrorMsg(msg);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32, paddingTop: 8 }}
      >
        {/* Header Bar */}
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-[#F5F6F8] items-center justify-center"
          >
            <Text className="text-[#101C16] text-xl font-semibold leading-none">
              ‹
            </Text>
          </TouchableOpacity>

          {/* Logo & App Name Header */}
          <View className="flex-row items-center justify-center flex-1 mr-10">
            <Image
              source={images.leavesLogo}
              className="w-10 h-10"
              resizeMode="contain"
            />
            <View className="ml-2">
              <Text className="font-poppins-bold text-[22px] text-[#1E3A2B] tracking-tight leading-tight">
                Sanjeevni
              </Text>
              <Text className="font-poppins-medium text-[11px] text-[#63776B] tracking-tight">
                A Healthier Tomorrow
              </Text>
            </View>
          </View>
        </View>

        {/* Headline & Subtitle */}
        <View className="items-center mt-2 mb-4">
          <Text className="font-poppins-bold text-[32px] text-[#0D1C15] text-center tracking-tight">
            Welcome back
          </Text>
          <Text className="font-poppins-regular text-[15px] text-[#55695E] text-center mt-1.5">
            Enter your email to access your account 🍃
          </Text>
        </View>

        {/* Mascot Hero with Script Accent */}
        <View className="relative w-full h-44 items-center justify-center my-1">
          <Image
            source={images.mascotAuth}
            className="w-full h-44"
            resizeMode="contain"
          />
          {/* Handwritten Style Accent */}
          <View className="absolute right-2 top-2 items-center rotate-6">
            <Text className="font-poppins-medium text-[12px] text-[#3E6B52] leading-tight italic">
              Care{"\n"}Anywhere{"\n"}Always
            </Text>
            <Text className="text-[#3E6B52] text-sm mt-0.5">♡</Text>
          </View>
        </View>

        {/* Error Banner */}
        {errorMsg && (
          <View className="bg-red-50 border border-red-200 rounded-2xl p-3 mb-3">
            <Text className="font-poppins-regular text-xs text-red-700 text-center">
              {errorMsg}
            </Text>
          </View>
        )}

        {/* Form Fields: Email Only (No Password) */}
        <View className="w-full mt-2">
          {/* Email Input */}
          <View className="border border-[#E2E8E4] rounded-2xl px-4 py-3 bg-white flex-row items-center mb-6 shadow-sm">
            <View className="w-9 h-9 rounded-xl bg-[#F4F7F5] items-center justify-center mr-3 border border-[#E8EEEA]">
              <Text className="text-base">✉️</Text>
            </View>
            <View className="flex-1">
              <Text className="font-poppins-regular text-[11px] text-[#6B7E74] leading-tight">
                Email
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="alex@gmail.com"
                placeholderTextColor="#A0AFA7"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                className="font-poppins-medium text-[15px] text-[#111C16] p-0 m-0"
              />
            </View>
          </View>

          {/* Primary Action Button: Sign In */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleSignIn}
            disabled={loading}
            className="w-full py-5 px-8 min-h-[66px] bg-[#214332] rounded-full flex-row items-center justify-center relative shadow-md shadow-[#214332]/30 mb-6"
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text className="font-poppins-semibold text-white text-[18px] tracking-wide">
                  Sign In
                </Text>
                <View className="absolute right-7 items-center justify-center">
                  <Text className="text-white text-2xl font-light leading-none">
                    ›
                  </Text>
                </View>
              </>
            )}
          </TouchableOpacity>

          {/* Continue Offline (BLE Direct) */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.replace("/(tabs)")}
            className="w-full py-3.5 px-6 -mt-2 mb-5 border border-[#214332]/20 bg-[#F4F7F5] rounded-full flex-row items-center justify-center"
          >
            <Text className="font-poppins-semibold text-[#214332] text-[14px]">
              Continue Offline (BLE Direct) ›
            </Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View className="flex-row items-center justify-center my-2 mb-5">
          <View className="flex-1 h-[1px] bg-[#E5ECE7]" />
          <Text className="font-poppins-regular text-xs text-[#7A8E82] px-4">
            or continue with
          </Text>
          <View className="flex-1 h-[1px] bg-[#E5ECE7]" />
        </View>

        {/* Social Auth Buttons */}
        <View className="w-full mb-4">
          <SocialAuthButton
            provider="google"
            onPress={() => handleSocialAuth("google")}
          />
          <SocialAuthButton
            provider="facebook"
            onPress={() => handleSocialAuth("facebook")}
          />
          <SocialAuthButton
            provider="apple"
            onPress={() => handleSocialAuth("apple")}
          />
        </View>

        {/* Don't have an account? Sign up */}
        <View className="flex-row justify-center items-center mt-2 mb-4">
          <Text className="font-poppins-regular text-sm text-[#55695E]">
            Don{"'"}t have an account?{" "}
          </Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push("/(auth)/sign-up")}
          >
            <Text className="font-poppins-bold text-sm text-[#1E3A2B] underline">
              Sign up
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer Tagline */}
        <View className="items-center mt-2 pt-2 border-t border-[#F0F4F1]">
          <Text className="font-poppins-regular text-[11px] text-[#7A8E82] tracking-wider">
            People | Technology | A Healthier Tomorrow
          </Text>
        </View>

        {/* Verification Modal */}
        <VerificationModal
          visible={showVerificationModal}
          onClose={() => setShowVerificationModal(false)}
          email={email}
          onVerify={handleVerifyCode}
          onResend={handleResendCode}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
