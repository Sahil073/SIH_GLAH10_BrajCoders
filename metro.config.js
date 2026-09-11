process.env.EXPO_ROUTER_DISABLE_RN_NAVIGATION_CHECK = "1";

const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add 'wasm' to the asset extensions to support expo-sqlite on the web
config.resolver.assetExts.push('wasm');

module.exports = config;
