const fs = require('fs');
const path = require('path');
module.exports = ({ config }) => {
  const file = path.join(__dirname, 'app/google-services.json');
  const firebaseConfigured = fs.existsSync(file);
  if (firebaseConfigured) {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (
      !data.client?.some(
        (client) => client.client_info?.android_client_info?.package_name === config.android.package,
      )
    )
      throw new Error(`google-services.json must contain ${config.android.package}`);
  }
  const settings = JSON.parse(fs.readFileSync(path.join(__dirname, 'services.json'), 'utf8'));
  const plugins = config.plugins.filter(
    (plugin) => (Array.isArray(plugin) ? plugin[0] : plugin) !== '@react-native-firebase/app',
  );
  if (firebaseConfigured) plugins.push('@react-native-firebase/app');
  return {
    ...config,
    android: {
      ...config.android,
      ...(firebaseConfigured ? { googleServicesFile: './app/google-services.json' } : {}),
    },
    plugins,
    updates: {
      ...config.updates,
      checkAutomatically: 'NEVER',
      fallbackToCacheTimeout: 0,
      requestHeaders: { ...config.updates?.requestHeaders, 'expo-channel-name': 'production' },
    },
    extra: {
      ...config.extra,
      services: {
        firebaseConfigured,
        appsFlyerDevKey: process.env.APPSFLYER_DEV_KEY || settings.appsFlyerDevKey || '',
      },
    },
  };
};
