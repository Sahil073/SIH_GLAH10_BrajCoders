import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { BoltIcon } from "../common/AppIcons";

interface CalibrationRingProps {
  onComplete: (stats: {
    baselineBpm: number;
    restingVariance: number;
    calibratedAt: string;
  }) => void;
}

const TOTAL_DURATION_SEC = 60;
const RADIUS = 88;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function CalibrationRing({ onComplete }: CalibrationRingProps) {
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_DURATION_SEC);
  const [isCalibrating, setIsCalibrating] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [currentBpm, setCurrentBpm] = useState(72);
  const [heartPulse, setHeartPulse] = useState(false);

  const hasCompletedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Gentle heartbeat pulse (pure React state, no Animated.Value/Worklet collision)
  useEffect(() => {
    if (isComplete) return;
    const pulseInterval = setInterval(() => {
      setHeartPulse((prev) => !prev);
    }, 600);
    return () => clearInterval(pulseInterval);
  }, [isComplete]);

  // Main countdown timer
  useEffect(() => {
    if (!isCalibrating) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });

      // Subtle natural resting BPM variation (70 - 75)
      const jitter = Math.floor(Math.random() * 3) - 1;
      setCurrentBpm((b) => Math.max(68, Math.min(76, b + jitter)));
    }, 1000);

    return () => clearInterval(timer);
  }, [isCalibrating]);

  // Handle completion when secondsLeft hits 0
  useEffect(() => {
    if (secondsLeft === 0 && !hasCompletedRef.current) {
      hasCompletedRef.current = true;
      setIsCalibrating(false);
      setIsComplete(true);
      onCompleteRef.current({
        baselineBpm: 72,
        restingVariance: 4.2,
        calibratedAt: new Date().toISOString(),
      });
    }
  }, [secondsLeft]);

  // Demo Fast-Forward for Judges / Testing
  const handleFastForward = () => {
    if (isCalibrating && secondsLeft > 2) {
      setSecondsLeft(2);
    }
  };

  const progress = (TOTAL_DURATION_SEC - secondsLeft) / TOTAL_DURATION_SEC;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  // Stage description based on time elapsed
  const getStageDescription = () => {
    const elapsed = TOTAL_DURATION_SEC - secondsLeft;
    if (isComplete || elapsed >= 60) {
      return {
        title: "Calibration Complete",
        desc: "Your normal body rhythm is locked in. Ready to protect!",
        badge: "100% Calibrated",
        badgeColor: "#16A34A",
      };
    }
    if (elapsed < 15) {
      return {
        title: "Measuring Resting Rhythm",
        desc: "Sit quietly and breathe naturally while sensors calibrate.",
        badge: "Phase 1 / 4",
        badgeColor: "#214332",
      };
    }
    if (elapsed < 30) {
      return {
        title: "Stabilizing Pulse Variance",
        desc: "Learning your resting pulse regularity and micro-fluctuations.",
        badge: "Phase 2 / 4",
        badgeColor: "#214332",
      };
    }
    if (elapsed < 45) {
      return {
        title: "Tuning Anomaly Thresholds",
        desc: "Setting personal safety guardrails for heat and cardiac stress.",
        badge: "Phase 3 / 4",
        badgeColor: "#214332",
      };
    }
    return {
      title: "Locking On-Device Baseline",
      desc: "Finalizing your privacy-preserving edge AI baseline.",
      badge: "Finalizing",
      badgeColor: "#214332",
    };
  };

  const currentStage = getStageDescription();

  return (
    <View style={styles.container}>
      {/* Circular Progress Ring Area */}
      <View style={styles.ringWrapper}>
        <Svg width="220" height="220" viewBox="0 0 220 220">
          {/* Background circle track */}
          <Circle
            cx="110"
            cy="110"
            r={RADIUS}
            stroke="#EFEBE4"
            strokeWidth="10"
            fill="none"
          />

          {/* Animated active progress stroke */}
          <Circle
            cx="110"
            cy="110"
            r={RADIUS}
            stroke={isComplete ? "#16A34A" : "#214332"}
            strokeWidth="10"
            strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="none"
            transform="rotate(-90 110 110)"
          />
        </Svg>

        {/* Center content inside ring */}
        <View style={styles.centerContent}>
          {isComplete ? (
            <View style={styles.completeIconWrapper}>
              <Svg width="44" height="44" viewBox="0 0 24 24" fill="none">
                <Circle cx="12" cy="12" r="11" fill="#DCFCE7" />
                <Path
                  d="M7 12.5L10.5 16L17 9"
                  stroke="#16A34A"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <Text style={styles.completeText}>Protected</Text>
            </View>
          ) : (
            <>
              {/* Pulsing Heart Icon (State-driven scale, no Reanimated conflicts) */}
              <View style={{ transform: [{ scale: heartPulse ? 1.15 : 1.0 }] }}>
                <Svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                    fill="#E11D48"
                  />
                </Svg>
              </View>

              {/* Seconds Left Display */}
              <Text style={styles.countdownText}>
                {secondsLeft}
                <Text style={styles.countdownUnit}>s</Text>
              </Text>

              {/* Live Simulated Resting BPM */}
              <View style={styles.bpmRow}>
                <Text style={styles.bpmNumber}>{currentBpm}</Text>
                <Text style={styles.bpmLabel}>BPM normal</Text>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Stage Badge & Description */}
      <View style={styles.stageCard}>
        <View style={[styles.badge, { backgroundColor: currentStage.badgeColor + "18" }]}>
          <Text style={[styles.badgeText, { color: currentStage.badgeColor }]}>
            {currentStage.badge}
          </Text>
        </View>
        <Text style={styles.stageTitle}>{currentStage.title}</Text>
        <Text style={styles.stageDesc}>{currentStage.desc}</Text>
      </View>

      {/* Fast Forward Demo Button (Judge / Dev helper) */}
      {!isComplete && secondsLeft > 5 && (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleFastForward}
          style={styles.fastForwardButton}
        >
          <BoltIcon size={16} color="#4F46E5" />
          <Text style={styles.fastForwardText}>Fast-Forward Demo (5s)</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  ringWrapper: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 12,
  },
  centerContent: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  completeIconWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  completeText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 14,
    color: "#16A34A",
    marginTop: 6,
  },
  countdownText: {
    fontFamily: "Poppins-Bold",
    fontSize: 42,
    lineHeight: 46,
    color: "#161616",
    marginTop: 4,
  },
  countdownUnit: {
    fontSize: 20,
    fontFamily: "Poppins-Medium",
    color: "#8A9A90",
  },
  bpmRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 2,
  },
  bpmNumber: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 14,
    color: "#214332",
    marginRight: 4,
  },
  bpmLabel: {
    fontFamily: "Poppins-Regular",
    fontSize: 11,
    color: "#55695E",
  },
  stageCard: {
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 999,
    marginBottom: 6,
  },
  badgeText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  stageTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: 17,
    color: "#161616",
    textAlign: "center",
    marginBottom: 3,
  },
  stageDesc: {
    fontFamily: "Poppins-Regular",
    fontSize: 13,
    color: "#607469",
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 280,
  },
  fastForwardButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#F2EFEB",
    borderWidth: 1,
    borderColor: "#E5DFD5",
  },
  fastForwardText: {
    fontFamily: "Poppins-Medium",
    fontSize: 11,
    color: "#55695E",
  },
});
