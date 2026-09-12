import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Pressable,
  StyleSheet,
} from "react-native";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseModalIcon,
} from "./HistoryIcons";

interface CalendarPickerModalProps {
  visible: boolean;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onClose: () => void;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function CalendarPickerModal({
  visible,
  selectedDate,
  onSelectDate,
  onClose,
}: CalendarPickerModalProps) {
  const [viewYear, setViewYear] = useState<number>(selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(selectedDate.getMonth());

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Days calculations
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const handleDayPress = (dayNumber: number) => {
    const newDate = new Date(viewYear, viewMonth, dayNumber);
    onSelectDate(newDate);
    onClose();
  };

  const handleSelectToday = () => {
    const today = new Date();
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    onSelectDate(today);
    onClose();
  };

  const isCurrentDay = (day: number) => {
    const now = new Date();
    return (
      now.getFullYear() === viewYear &&
      now.getMonth() === viewMonth &&
      now.getDate() === day
    );
  };

  const isSelectedDay = (day: number) => {
    return (
      selectedDate.getFullYear() === viewYear &&
      selectedDate.getMonth() === viewMonth &&
      selectedDate.getDate() === day
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.45)",
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 20,
        }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-xl border border-[#EDE9E2]"
        >
          {/* Header row */}
          <View className="flex-row items-center justify-between mb-4">
            <Text className="font-poppins-bold text-base text-[#161616]">
              Select Date
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              style={modalStyles.closeBtn}
            >
              <CloseModalIcon size={16} color="#55695E" />
            </TouchableOpacity>
          </View>

          {/* Month / Year Navigator */}
          <View className="flex-row items-center justify-between mb-4 px-1">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handlePrevMonth}
              style={modalStyles.navBtn}
            >
              <ChevronLeftIcon size={16} color="#161616" />
            </TouchableOpacity>

            <Text className="font-poppins-semibold text-sm text-[#161616]">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </Text>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleNextMonth}
              style={modalStyles.navBtn}
            >
              <ChevronRightIcon size={16} color="#161616" />
            </TouchableOpacity>
          </View>

          {/* Weekday headers */}
          <View className="flex-row justify-between mb-2">
            {WEEKDAY_NAMES.map((name, i) => (
              <View
                key={name + i}
                className="w-[14.28%] items-center justify-center"
              >
                <Text className="font-poppins-medium text-xs text-[#8A9A90]">
                  {name}
                </Text>
              </View>
            ))}
          </View>

          {/* Days Grid */}
          <View className="flex-row flex-wrap">
            {/* Empty slots for month start offset */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <View key={`empty-${i}`} className="w-[14.28%] h-10" />
            ))}

            {/* Actual day numbers */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isSelected = isSelectedDay(day);
              const isToday = isCurrentDay(day);

              return (
                <TouchableOpacity
                  key={day}
                  activeOpacity={0.7}
                  onPress={() => handleDayPress(day)}
                  style={modalStyles.dayCell}
                >
                  <View
                    className={`w-8 h-8 rounded-full items-center justify-center ${
                      isSelected
                        ? "bg-[#214332]"
                        : isToday
                        ? "border border-[#214332] bg-[#F3F7F5]"
                        : ""
                    }`}
                  >
                    <Text
                      className={`font-poppins-medium text-xs ${
                        isSelected
                          ? "text-white font-poppins-bold"
                          : isToday
                          ? "text-[#214332] font-poppins-bold"
                          : "text-[#161616]"
                      }`}
                    >
                      {day}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Footer Actions */}
          <View className="flex-row justify-between items-center mt-5 pt-3 border-t border-[#F2EFE9]">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleSelectToday}
              style={modalStyles.todayBtn}
            >
              <Text className="font-poppins-semibold text-xs text-[#214332]">
                Today
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onClose}
              style={modalStyles.doneBtn}
            >
              <Text className="font-poppins-semibold text-xs text-white">
                Done
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F5F2EB",
    alignItems: "center",
    justifyContent: "center",
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F8F7F4",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#EAE6DF",
  },
  dayCell: {
    width: "14.28%",
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  todayBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#F5F2EB",
  },
  doneBtn: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: "#214332",
  },
});
