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
import { useAuth, useSignUp, useSSO } from "@clerk/expo";
import { images } from "@/constants/images";
import { SocialAuthButton, SocialProvider } from "@/components/auth/SocialAuthButton";
import { VerificationModal } from "@/components/auth/VerificationModal";
import { useUserProfile } from "@/store/userProfileStore";
import { MailIcon, LockIcon, EyeIcon, EyeOffIcon } from "@/components/common/AppIcons";

export default function SignUpScreen() {
  const router = useRouter();
  const { isLoaded } = useAuth();
  const { signUp } = useSignUp();
  const { startSSOFlow } = useSSO();
  const { login } = useUserProfile();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  const handleSignUp = async () => {
    if (!isLoaded) return;
    if (!email.trim() || !password) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      if (signUp.status) {
        await signUp.reset();
      }

      const { error } = await signUp.password({
        emailAddress: email.trim(),
        password,
      });

      if (error) {
        setErrorMsg(error.message || "Sign up failed. Please try again.");
        return;
      }

      // Send email verification code
      const { error: sendError } = await signUp.verifications.sendEmailCode();
      if (sendError && !signUp.unverifiedFields?.includes("email_address")) {
        setErrorMsg(sendError.message || "Failed to send verification code.");
        return;
      }

      setShowVerificationModal(true);
    } catch (err: unknown) {
      const clerkError = err as { message?: string };
      setErrorMsg(clerkError?.message || "Sign up failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (code: string) => {
    const { error } = await signUp.verifications.verifyEmailCode({ code });
    if (error) {
      throw new Error(error.message || "Verification code is invalid or expired.");
    }

    if (signUp.status === "complete") {
      const { error: finalizeError } = await signUp.finalize();
      if (finalizeError) {
        throw new Error(finalizeError.message || "Failed to finalize sign up session.");
      }
      await login(email.trim(), email.split("@")[0]);
      setShowVerificationModal(false);
      router.replace("/onboarding-health");
    } else {
      throw new Error("Verification incomplete. Please check the code and try again.");
    }
  };

  const handleResendCode = async () => {
    const { error } = await signUp.verifications.sendEmailCode();
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
        router.replace("/onboarding-health");
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
            Create your account
          </Text>
          <Text className="font-poppins-regular text-[15px] text-[#55695E] text-center mt-1.5">
            Take the first step towards a healthier you 🍃
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

        {/* Form Fields */}
        <View className="w-full mt-2">
          {/* Email Input */}
          <View className="border border-[#E2E8E4] rounded-2xl px-4 py-3 bg-white flex-row items-center mb-3.5 shadow-sm">
            <View className="w-9 h-9 rounded-xl bg-[#F4F7F5] items-center justify-center mr-3 border border-[#E8EEEA]">
              <MailIcon size={18} color="#214332" />
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

          {/* Password Input */}
          <View className="border border-[#E2E8E4] rounded-2xl px-4 py-3 bg-white flex-row items-center mb-5 shadow-sm">
            <View className="w-9 h-9 rounded-xl bg-[#F4F7F5] items-center justify-center mr-3 border border-[#E8EEEA]">
              <LockIcon size={18} color="#214332" />
            </View>
            <View className="flex-1">
              <Text className="font-poppins-regular text-[11px] text-[#6B7E74] leading-tight">
                Password
              </Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholder="•••••••••"
                placeholderTextColor="#A0AFA7"
                autoCapitalize="none"
                className="font-poppins-medium text-[15px] text-[#111C16] p-0 m-0 flex-1"
              />
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowPassword(!showPassword)}
              className="p-2"
            >
              {showPassword ? (
                <EyeOffIcon size={18} color="#64748B" />
              ) : (
                <EyeIcon size={18} color="#64748B" />
              )}
            </TouchableOpacity>
          </View>

          {/* Primary Action Button: Sign Up */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleSignUp}
            disabled={loading}
            className="w-full py-5 px-8 min-h-[66px] bg-[#214332] rounded-full flex-row items-center justify-center relative shadow-md shadow-[#214332]/30 mb-6"
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text className="font-poppins-semibold text-white text-[18px] tracking-wide">
                  Sign Up
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
            onPress={async () => {
              await login(email.trim() || undefined);
              router.replace("/(tabs)");
            }}
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

        {/* Already have an account? Log in */}
        <View className="flex-row justify-center items-center mt-2 mb-4">
          <Text className="font-poppins-regular text-sm text-[#55695E]">
            Already have an account?{" "}
          </Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push("/(auth)/sign-in")}
          >
            <Text className="font-poppins-bold text-sm text-[#1E3A2B] underline">
              Log in
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer Tagline */}
        <View className="items-center mt-2 pt-2 border-t border-[#F0F4F1]">
          <Text className="font-poppins-regular text-[11px] text-[#7A8E82] tracking-wider">
            People | Technology | A Healthier Tomorrow
          </Text>
        </View>

        {/* Captcha Mount Point for Clerk Bot Protection */}
        <View nativeID="clerk-captcha" />

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
