const { withAppBuildGradle } = require('expo/config-plugins');

const MARKER = '// @generated withCodemagicSigning';

// Codemagic's `android_signing` exposes the uploaded keystore through CM_KEYSTORE_PATH, CM_KEYSTORE_PASSWORD,
// CM_KEY_ALIAS and CM_KEY_PASSWORD. The Expo template signs release builds with the debug key, so release
// builds use the Codemagic keystore when those variables exist and fall back to debug signing locally.
const RELEASE_SIGNING = `
        ${MARKER}
        release {
            if (System.getenv("CM_KEYSTORE_PATH")) {
                storeFile file(System.getenv("CM_KEYSTORE_PATH"))
                storePassword System.getenv("CM_KEYSTORE_PASSWORD")
                keyAlias System.getenv("CM_KEY_ALIAS")
                keyPassword System.getenv("CM_KEY_PASSWORD")
            }
        }`;

module.exports = function withCodemagicSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    let gradle = cfg.modResults.contents;
    if (gradle.includes(MARKER)) return cfg;

    const debugBlock = /(signingConfigs\s*\{\s*debug\s*\{[^}]*\})/;
    const releaseUsesDebug = /(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?)signingConfig signingConfigs\.debug/;
    if (!debugBlock.test(gradle) || !releaseUsesDebug.test(gradle)) {
      throw new Error('withCodemagicSigning: unexpected android/app/build.gradle layout, update the plugin.');
    }

    gradle = gradle.replace(debugBlock, `$1${RELEASE_SIGNING}`);
    gradle = gradle.replace(
      releaseUsesDebug,
      '$1signingConfig System.getenv("CM_KEYSTORE_PATH") ? signingConfigs.release : signingConfigs.debug'
    );
    cfg.modResults.contents = gradle;
    return cfg;
  });
};
