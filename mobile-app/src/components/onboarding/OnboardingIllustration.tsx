import React from "react";
import { View, StyleSheet } from "react-native";
import Svg, {
  Circle,
  Path,
  Rect,
  G,
  Defs,
  LinearGradient,
  Stop,
} from "react-native-svg";

interface OnboardingIllustrationProps {
  step: 1 | 2 | 3;
}

export function OnboardingIllustration({ step }: OnboardingIllustrationProps) {
  if (step === 1) {
    // Step 1: Relaxed person sitting in a chair with laptop & phone + ringing notification bell (matching reference image)
    return (
      <View style={styles.container}>
        <Svg width="260" height="260" viewBox="0 0 260 260" fill="none">
          <Defs>
            <LinearGradient id="bgGrad1" x1="130" y1="20" x2="130" y2="240" gradientUnits="userSpaceOnUse">
              <Stop offset="0%" stopColor="#EDE6DD" />
              <Stop offset="100%" stopColor="#E2DDD5" />
            </LinearGradient>
            <LinearGradient id="bellGrad" x1="165" y1="40" x2="165" y2="85" gradientUnits="userSpaceOnUse">
              <Stop offset="0%" stopColor="#FFFFFF" />
              <Stop offset="100%" stopColor="#F7F3EE" />
            </LinearGradient>
          </Defs>

          {/* Soft circular background backdrop from reference image */}
          <Circle cx="130" cy="130" r="105" fill="url(#bgGrad1)" opacity={0.9} />

          {/* Background subtle doodle lines */}
          <Path
            d="M95 55 Q 120 40 140 50 T 170 45"
            stroke="#D0C7BC"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d="M135 60 Q 140 70 135 80"
            stroke="#D0C7BC"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* FLOATING NOTIFICATION BELL with ringing waves */}
          {/* Wave Left */}
          <Path
            d="M140 45 C 137 55 137 65 140 72"
            stroke="#B5AAA0"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          {/* Wave Right */}
          <Path
            d="M190 45 C 193 55 193 65 190 72"
            stroke="#B5AAA0"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />

          {/* Bell body */}
          <G x={142} y={36}>
            {/* Bell dome */}
            <Path
              d="M25 10 C 25 10 21 28 14 36 C 11 40 8 44 8 46 L 42 46 C 42 44 39 40 36 36 C 29 28 25 10 25 10 Z"
              fill="url(#bellGrad)"
              stroke="#A89E94"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Bell top loop */}
            <Path
              d="M22 10 C 22 7 28 7 28 10"
              stroke="#A89E94"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            {/* Bell clapper */}
            <Circle cx="25" cy="50" r="4" fill="#A89E94" />
          </G>

          {/* PERSON RELAXED ON MODERN CHAIR (Inspired directly by reference image) */}
          {/* Lounge Chair Base Frame */}
          <Path
            d="M68 185 L 90 145 L 128 148 L 195 188"
            stroke="#8C7A6B"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Chair Backrest */}
          <Path
            d="M86 112 L 102 152"
            stroke="#6E5D4F"
            strokeWidth="11"
            strokeLinecap="round"
          />
          {/* Chair Cushion Seat */}
          <Path
            d="M98 150 L 165 152"
            stroke="#A39384"
            strokeWidth="9"
            strokeLinecap="round"
          />

          {/* Person Head & Hair */}
          <Circle cx="106" cy="100" r="14" fill="#241B18" />
          {/* Beard / Face Profile */}
          <Path
            d="M104 96 C 109 96 115 99 116 105 C 117 111 113 115 108 115 C 104 115 102 111 102 108"
            fill="#5A3D28"
          />
          <Path
            d="M112 105 C 115 107 116 111 113 113 C 109 116 104 115 104 115"
            fill="#241B18"
          />

          {/* Neck & Yellow T-shirt Torso */}
          <Path
            d="M102 114 L 108 122 L 138 126 L 130 152 L 100 150 Z"
            fill="#E5A93C"
          />

          {/* Arm holding phone to ear */}
          <Path
            d="M102 120 L 118 108 L 114 102"
            stroke="#5A3D28"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Phone */}
          <Rect x="111" y="98" width="5" height="11" rx="1.5" fill="#1C1B1F" />

          {/* Relaxed Arm on Lap / typing on laptop */}
          <Path
            d="M125 128 L 135 146 L 152 144"
            stroke="#5A3D28"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* White Laptop open on lap */}
          <Path
            d="M142 148 L 175 148 L 168 128 L 146 128 Z"
            fill="#FFFFFF"
            stroke="#D3CDC5"
            strokeWidth="1.5"
          />
          {/* Laptop Screen reflection */}
          <Path
            d="M149 132 L 164 132 L 166 144 L 146 144 Z"
            fill="#F4F8F6"
          />

          {/* Crossed / Extended Legs in dark trousers */}
          <Path
            d="M126 151 L 168 156 L 196 178 L 190 185"
            stroke="#2B2129"
            strokeWidth="9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Yellow Shoes */}
          <Path
            d="M188 184 L 198 184 L 202 190 L 187 190 Z"
            fill="#E5A93C"
          />

          {/* Floor Shadow */}
          <Circle cx="135" cy="216" r="60" fill="#000000" opacity={0.06} />
        </Svg>
      </View>
    );
  }

  if (step === 2) {
    // Step 2: Emergency Contact & SOS Phone Beacon in soft circular backdrop
    return (
      <View style={styles.container}>
        <Svg width="260" height="260" viewBox="0 0 260 260" fill="none">
          <Defs>
            <LinearGradient id="bgGrad2" x1="130" y1="20" x2="130" y2="240" gradientUnits="userSpaceOnUse">
              <Stop offset="0%" stopColor="#F6ECE7" />
              <Stop offset="100%" stopColor="#EAE1DA" />
            </LinearGradient>
            <LinearGradient id="shieldGrad" x1="130" y1="80" x2="130" y2="180" gradientUnits="userSpaceOnUse">
              <Stop offset="0%" stopColor="#2D5A43" />
              <Stop offset="100%" stopColor="#1E3A2B" />
            </LinearGradient>
          </Defs>

          {/* Soft circular background backdrop */}
          <Circle cx="130" cy="130" r="105" fill="url(#bgGrad2)" opacity={0.9} />

          {/* Radiating Beacon Rings */}
          <Circle cx="130" cy="125" r="78" stroke="#E0C9BF" strokeWidth="1.5" strokeDasharray="4 4" />
          <Circle cx="130" cy="125" r="92" stroke="#EADBD3" strokeWidth="1" strokeDasharray="3 3" />

          {/* Central Shield Protection */}
          <Path
            d="M130 75 L 175 92 C 175 140 148 168 130 180 C 112 168 85 140 85 92 L 130 75 Z"
            fill="url(#shieldGrad)"
          />

          {/* Subtle shield inner highlight */}
          <Path
            d="M130 84 L 166 98 C 166 135 144 158 130 168 C 116 158 94 135 94 98 L 130 84 Z"
            stroke="#4D8365"
            strokeWidth="1.5"
            fill="none"
            opacity={0.6}
          />

          {/* Contact Person Silhouette Inside Shield */}
          <Circle cx="130" cy="115" r="14" fill="#FFFFFF" />
          <Path
            d="M112 148 C 112 135 120 131 130 131 C 140 131 148 135 148 148 Z"
            fill="#FFFFFF"
          />

          {/* Floating SOS Phone Badge */}
          <G x={162} y={75}>
            <Circle cx="16" cy="16" r="20" fill="#E65100" />
            <Circle cx="16" cy="16" r="18" fill="#FF7043" />
            {/* Phone receiver icon */}
            <Path
              d="M11 11 C 11 18 14 21 21 21 L 22 19 C 22.5 18 21.5 17 20 16.5 L 18.5 16 C 17.5 15.5 16.5 16 16 16.5 C 15 15.5 14 14.5 13.5 13.5 C 14 13 14.5 12 14 11 L 13.5 9.5 C 13 8 12 7.5 11 8 L 9 9 C 9 10 10 10.5 11 11 Z"
              fill="#FFFFFF"
            />
          </G>

          {/* Heart Pulse Micro Badge Left */}
          <G x={68} y={140}>
            <Circle cx="14" cy="14" r="16" fill="#FFFFFF" stroke="#EDE4DC" strokeWidth="1.5" />
            <Path
              d="M9 14 L 12 14 L 14 10 L 16 18 L 18 12 L 20 14 L 23 14"
              stroke="#E11D48"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </G>

          {/* Floor Shadow */}
          <Circle cx="130" cy="216" r="55" fill="#000000" opacity={0.05} />
        </Svg>
      </View>
    );
  }

  // Step 3: Personalized Health Calibration & Vital Sensor Learning
  return (
    <View style={styles.container}>
      <Svg width="260" height="260" viewBox="0 0 260 260" fill="none">
        <Defs>
          <LinearGradient id="bgGrad3" x1="130" y1="20" x2="130" y2="240" gradientUnits="userSpaceOnUse">
            <Stop offset="0%" stopColor="#E9F2ED" />
            <Stop offset="100%" stopColor="#DCEDE3" />
          </LinearGradient>
          <LinearGradient id="pulseGrad" x1="60" y1="130" x2="200" y2="130" gradientUnits="userSpaceOnUse">
            <Stop offset="0%" stopColor="#214332" />
            <Stop offset="50%" stopColor="#16A34A" />
            <Stop offset="100%" stopColor="#214332" />
          </LinearGradient>
        </Defs>

        {/* Soft circular background backdrop */}
        <Circle cx="130" cy="130" r="105" fill="url(#bgGrad3)" opacity={0.9} />

        {/* Ambient Ring Wave */}
        <Circle cx="130" cy="130" r="82" stroke="#B8DAC6" strokeWidth="2" strokeDasharray="6 6" />

        {/* Central White Glass Circle */}
        <Circle cx="130" cy="130" r="62" fill="#FFFFFF" stroke="#CCE4D6" strokeWidth="2" />

        {/* Heart icon at center top */}
        <G x={116} y={88}>
          <Path
            d="M14 6 C 14 2 10 0 7 0 C 3 0 0 3 0 7 C 0 13 11 19 14 22 C 17 19 28 13 28 7 C 28 3 25 0 21 0 C 18 0 14 2 14 6 Z"
            fill="#E11D48"
          />
        </G>

        {/* Continuous ECG Rhythm Wave across center */}
        <Path
          d="M78 135 L 98 135 L 105 135 L 112 122 L 120 148 L 127 108 L 134 156 L 140 128 L 146 138 L 152 135 L 182 135"
          stroke="url(#pulseGrad)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Live Calibration Orbit Elements */}
        <Circle cx="130" cy="50" r="5" fill="#214332" />
        <Circle cx="210" cy="130" r="4" fill="#16A34A" />
        <Circle cx="130" cy="210" r="5" fill="#214332" />
        <Circle cx="50" cy="130" r="4" fill="#16A34A" />

        {/* Floor Shadow */}
        <Circle cx="130" cy="216" r="55" fill="#000000" opacity={0.05} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 8,
  },
});
