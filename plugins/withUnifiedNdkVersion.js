const { withProjectBuildGradle } = require('expo/config-plugins');

const MARKER = '// @generated withUnifiedNdkVersion';

// Some native modules (e.g. expo-updates) build C code without setting ndkVersion, so AGP falls back to its
// own default NDK and tries to download it. Make every Android library use the NDK React Native already uses.
const SNIPPET = `
${MARKER}
subprojects { subproject ->
  subproject.plugins.withId('com.android.library') {
    if (rootProject.hasProperty('ndkVersion')) {
      subproject.android.ndkVersion = rootProject.ext.ndkVersion
    }
  }
}
`;

module.exports = function withUnifiedNdkVersion(config) {
  return withProjectBuildGradle(config, (cfg) => {
    if (!cfg.modResults.contents.includes(MARKER)) {
      cfg.modResults.contents += SNIPPET;
    }
    return cfg;
  });
};
