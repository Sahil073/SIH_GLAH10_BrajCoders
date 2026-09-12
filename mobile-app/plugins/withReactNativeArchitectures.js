const { withGradleProperties } = require("@expo/config-plugins");

/**
 * Config plugin that adds reactNativeArchitectures=arm64-v8a to android/gradle.properties.
 * This instructs the React Native Gradle plugin to only compile C++ binaries for 64-bit ARM
 * devices (arm64-v8a), eliminating compilation for armeabi-v7a, x86, and x86_64.
 */
function withReactNativeArchitectures(config) {
  return withGradleProperties(config, (gradleConfig) => {
    const existingIndex = gradleConfig.modResults.findIndex(
      (item) =>
        item.type === "property" && item.key === "reactNativeArchitectures",
    );

    if (existingIndex >= 0) {
      gradleConfig.modResults[existingIndex].value = "arm64-v8a";
    } else {
      gradleConfig.modResults.push({
        type: "property",
        key: "reactNativeArchitectures",
        value: "arm64-v8a",
      });
    }

    return gradleConfig;
  });
}

module.exports = withReactNativeArchitectures;
