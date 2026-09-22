// https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// zustand's ESM build uses `import.meta`, which Metro's web output cannot evaluate.
// Resolve zustand through its CommonJS build on every platform.
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'zustand' || moduleName.startsWith('zustand/')) {
    const resolve = defaultResolveRequest ?? context.resolveRequest;
    return resolve(
      { ...context, unstable_conditionNames: ['react-native', 'require', 'default'] },
      moduleName,
      platform
    );
  }
  return defaultResolveRequest
    ? defaultResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
