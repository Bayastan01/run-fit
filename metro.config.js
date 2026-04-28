const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Required for pnpm-style hoisted node_modules + packages that use the
// `exports` field in their package.json (e.g. expo-linear-gradient,
// @react-navigation/native).
config.resolver.unstable_enablePackageExports = true;
config.resolver.unstable_enableSymlinks = true;

module.exports = withNativeWind(config, { input: "./global.css" });
