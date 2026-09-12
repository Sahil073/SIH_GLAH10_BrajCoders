import React, { useState, useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { MailIcon } from "../common/AppIcons";

interface VerificationModalProps {
  visible: boolean;
  onClose: () => void;
  email?: string;
  onVerify?: (code: string) => Promise<void>;
  onResend?: () => Promise<void>;
  onSuccess?: () => void;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({
  visible,
  onClose,
  email = "alex@gmail.com",
  onVerify,
  onResend,
  onSuccess,
}) => {
  const [code, setCode] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [resending, setResending] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [isFocusedInput, setIsFocusedInput] = useState<boolean>(true);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        setCode("");
        setErrorMsg(null);
        setResendStatus(null);
        setIsFocusedInput(true);
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const submitCode = async (codeToVerify: string) => {
    if (codeToVerify.length !== 6 || loading) return;

    if (onVerify) {
      setLoading(true);
      setErrorMsg(null);
      try {
        await onVerify(codeToVerify);
        onClose();
        if (onSuccess) {
          onSuccess();
        }
      } catch (err: unknown) {
        const clerkError = err as { errors?: { message?: string; longMessage?: string }[]; message?: string };
        const msg =
          clerkError?.errors?.[0]?.longMessage ||
          clerkError?.errors?.[0]?.message ||
          clerkError?.message ||
          "Incorrect verification code. Please try again.";
        setErrorMsg(msg);
        setCode("");
        setTimeout(() => {
          inputRef.current?.focus();
        }, 150);
      } finally {
        setLoading(false);
      }
    } else {
      setTimeout(() => {
        onClose();
        if (onSuccess) {
          onSuccess();
        }
      }, 350);
    }
  };

  const handleCodeChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, "").slice(0, 6);
    setCode(cleaned);
    setErrorMsg(null);

    if (cleaned.length === 6) {
      submitCode(cleaned);
    }
  };

  const handleResend = async () => {
    if (onResend) {
      setResending(true);
      setErrorMsg(null);
      try {
        await onResend();
        setResendStatus("New code sent!");
        setTimeout(() => setResendStatus(null), 3000);
      } catch (err: unknown) {
        const clerkError = err as { errors?: { message?: string }[]; message?: string };
        setErrorMsg(clerkError?.errors?.[0]?.message || clerkError?.message || "Failed to resend code");
      } finally {
        setResending(false);
      }
    } else {
      setResendStatus("Code resent!");
      setTimeout(() => setResendStatus(null), 3000);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <Pressable
          onPress={onClose}
          className="flex-1 bg-black/50 justify-center items-center px-5"
        >
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              inputRef.current?.focus();
            }}
            className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-xl border border-gray-100"
          >
            {/* Top Close Button */}
            <View className="flex-row justify-end">
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={onClose}
                className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
              >
                <Text className="text-gray-500 font-poppins-semibold text-sm">
                  ✕
                </Text>
              </TouchableOpacity>
            </View>

            {/* Email Verification Icon */}
            <View className="items-center -mt-2 mb-3">
              <View className="w-14 h-14 rounded-full bg-[#EBF5EE] items-center justify-center mb-3 border border-[#D5EBDE]">
                <MailIcon size={26} color="#16A34A" />
              </View>
              <Text className="font-poppins-bold text-2xl text-[#101C16] text-center">
                Verify Your Email
              </Text>
              <Text className="font-poppins-regular text-[13px] text-[#55695E] text-center mt-2 leading-relaxed px-2">
                We have sent a 6-digit verification code to{"\n"}
                <Text className="font-poppins-semibold text-[#1E3A2B]">
                  {email}
                </Text>
                . Enter the code below.
              </Text>
            </View>

            {/* 6 Digit Slots Container */}
            <View className="relative my-4 px-1 justify-center">
              {/* Visual Boxes */}
              <View
                pointerEvents="none"
                className="flex-row justify-between items-center"
              >
                {[0, 1, 2, 3, 4, 5].map((index) => {
                  const digit = code[index] || "";
                  const isFocused = isFocusedInput && code.length === index;

                  return (
                    <View
                      key={index}
                      style={{
                        width: 44,
                        height: 56,
                        borderRadius: 16,
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: 2,
                        borderColor: digit ? "#214332" : isFocused ? "#33684B" : "#E2E8E4",
                        backgroundColor: digit ? "#F1F7F3" : isFocused ? "#FFFFFF" : "#FAFAFA",
                      }}
                    >
                      <Text className="font-poppins-bold text-2xl text-[#101C16]">
                        {digit}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {/* Real TextInput directly overlaying all 6 slots */}
              <TextInput
                ref={inputRef}
                value={code}
                onChangeText={handleCodeChange}
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                autoComplete="one-time-code"
                maxLength={6}
                autoFocus={true}
                editable={!loading}
                onFocus={() => setIsFocusedInput(true)}
                onBlur={() => setIsFocusedInput(false)}
                caretHidden={true}
                style={styles.hiddenInput}
              />
            </View>

            {/* Loading or Error Feedback */}
            {loading && (
              <View key="feedback-loading" className="flex-row items-center justify-center my-2">
                <ActivityIndicator size="small" color="#214332" />
                <Text className="font-poppins-medium text-xs text-[#214332] ml-2">
                  Verifying with Clerk...
                </Text>
              </View>
            )}

            {errorMsg && (
              <View key="feedback-error" className="bg-red-50 border border-red-200 rounded-xl p-2.5 mb-3">
                <Text className="font-poppins-regular text-xs text-red-700 text-center">
                  {errorMsg}
                </Text>
              </View>
            )}

            {resendStatus && (
              <View key="feedback-resend" className="bg-green-50 border border-green-200 rounded-xl p-2 mb-3">
                <Text className="font-poppins-medium text-xs text-green-700 text-center">
                  {resendStatus}
                </Text>
              </View>
            )}

            {/* Explicit Verify Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => submitCode(code)}
              disabled={code.length !== 6 || loading}
              style={{
                backgroundColor: code.length === 6 && !loading ? "#214332" : "rgba(33, 67, 50, 0.4)",
              }}
              className="w-full py-3.5 rounded-full items-center justify-center mb-3"
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text className="font-poppins-semibold text-base text-white">
                  Verify Code
                </Text>
              )}
            </TouchableOpacity>

            {/* Resend Code Link */}
            <View className="flex-row justify-center items-center mt-1">
              <Text className="font-poppins-regular text-xs text-[#6B7280]">
                Didn{"'"}t receive code?{" "}
              </Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleResend}
                disabled={resending || loading}
              >
                <Text className="font-poppins-semibold text-xs text-[#214332] underline">
                  {resending ? "Resending..." : "Resend Code"}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  hiddenInput: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    opacity: 0.01,
    color: "transparent",
    fontSize: 24,
  },
});
