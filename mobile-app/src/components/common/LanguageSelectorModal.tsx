// =============================================================================
// src/components/common/LanguageSelectorModal.tsx
// Interactive Modal allowing users to select from English + Top 5 Indian Languages
// =============================================================================

import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useLanguage, LanguageCode } from "@/i18n/languages";
import { useTheme } from "@/store/themeStore";
import { GlobeIcon, CheckmarkIcon } from "@/components/common/AppIcons";

interface LanguageSelectorModalProps {
  visible: boolean;
  onClose: () => void;
}

export function LanguageSelectorModal({
  visible,
  onClose,
}: LanguageSelectorModalProps) {
  const { language, languages, changeLanguage, t } = useLanguage();
  const { colors, isDark } = useTheme();

  const handleSelect = async (code: LanguageCode) => {
    await changeLanguage(code);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View
        style={{ backgroundColor: "rgba(0, 0, 0, 0.45)" }}
        className="flex-1 justify-center items-center px-4"
      >
        <View
          style={{
            backgroundColor: colors.cardBg,
            borderColor: colors.cardBorder,
            maxWidth: 420,
            width: "100%",
          }}
          className="rounded-[28px] p-5 border shadow-xl"
        >
          {/* Modal Header */}
          <View className="flex-row items-center justify-between pb-3.5 border-b border-[#F0EDE6] mb-4">
            <View className="flex-row items-center">
              <View
                style={{
                  backgroundColor: isDark ? colors.backgroundSecondary : "#EBF5EE",
                  borderColor: colors.cardBorder,
                }}
                className="w-10 h-10 rounded-2xl items-center justify-center mr-3 border"
              >
                <GlobeIcon size={20} color="#16A34A" />
              </View>
              <View>
                <Text
                  style={{ color: colors.textPrimary }}
                  className="font-poppins-bold text-base leading-tight"
                >
                  {t("selectLanguage")}
                </Text>
                <Text
                  style={{ color: colors.textSecondary }}
                  className="font-poppins-regular text-[11px] mt-0.5"
                >
                  {t("languageSubtitle")}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              style={{
                backgroundColor: isDark ? colors.backgroundSecondary : "#F3F4F6",
              }}
              className="w-8 h-8 rounded-full items-center justify-center"
            >
              <Text style={{ color: colors.textSecondary }} className="font-poppins-bold text-sm">
                ✕
              </Text>
            </TouchableOpacity>
          </View>

          {/* Languages List */}
          <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
            <View className="gap-2.5">
              {languages.map((langItem) => {
                const isSelected = language === langItem.code;
                return (
                  <TouchableOpacity
                    key={langItem.code}
                    activeOpacity={0.75}
                    onPress={() => handleSelect(langItem.code)}
                    style={{
                      backgroundColor: isSelected
                        ? isDark
                          ? "#14281E"
                          : "#F0FDF4"
                        : isDark
                        ? colors.backgroundSecondary
                        : "#FAFAF9",
                      borderColor: isSelected
                        ? "#16A34A"
                        : colors.cardBorder,
                    }}
                    className={`flex-row items-center justify-between p-3.5 rounded-2xl border ${
                      isSelected ? "border-[1.8px]" : ""
                    }`}
                  >
                    <View className="flex-row items-center flex-1">
                      {/* Flag / Code Badge */}
                      <View
                        style={{
                          backgroundColor: isSelected ? "#DCFCE7" : "#F3F4F6",
                          borderColor: isSelected ? "#86EFAC" : "#E5E7EB",
                        }}
                        className="w-10 h-10 rounded-xl items-center justify-center mr-3 border"
                      >
                        <Text
                          style={{ color: isSelected ? "#15803D" : "#4B5563" }}
                          className="font-poppins-bold text-xs"
                        >
                          {langItem.flag}
                        </Text>
                      </View>

                      {/* Language Names */}
                      <View className="flex-1">
                        <Text
                          style={{
                            color: isSelected ? "#15803D" : colors.textPrimary,
                          }}
                          className="font-poppins-bold text-[15px] leading-tight"
                        >
                          {langItem.name}
                        </Text>
                        <Text
                          style={{ color: colors.textSecondary }}
                          className="font-poppins-regular text-xs mt-0.5"
                        >
                          {langItem.englishName}
                        </Text>
                      </View>
                    </View>

                    {/* Radio / Selection Indicator */}
                    <View
                      style={{
                        borderColor: isSelected ? "#16A34A" : "#D1D5DB",
                        backgroundColor: isSelected ? "#16A34A" : "transparent",
                      }}
                      className="w-6 h-6 rounded-full border-[1.5px] items-center justify-center ml-2"
                    >
                      {isSelected && (
                        <View className="w-2.5 h-2.5 rounded-full bg-white" />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Close Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onClose}
            style={{
              backgroundColor: colors.textPrimary,
            }}
            className="w-full py-3 rounded-2xl mt-4 items-center justify-center"
          >
            <Text
              style={{
                color: isDark ? "#121212" : "#FFFFFF",
              }}
              className="font-poppins-semibold text-xs tracking-wide"
            >
              {t("close")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
