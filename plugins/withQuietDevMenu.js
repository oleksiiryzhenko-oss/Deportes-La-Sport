const { AndroidConfig, withAndroidManifest } = require('expo/config-plugins');

// expo-dev-menu reads these defaults from the manifest (debug builds only; release builds have no dev menu).
// Hides the floating "Tools button" and the menu that pops up on every launch, so screenshots stay clean.
// The dev menu is still available by shaking the device or pressing Ctrl+M / Cmd+M in the emulator.
const DEFAULTS = {
  EXDevMenuShowFloatingActionButton: 'false',
  EXDevMenuShowsAtLaunch: 'false',
  EXDevMenuIsOnboardingFinished: 'true',
};

module.exports = function withQuietDevMenu(config) {
  return withAndroidManifest(config, (cfg) => {
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(cfg.modResults);
    for (const [name, value] of Object.entries(DEFAULTS)) {
      AndroidConfig.Manifest.addMetaDataItemToMainApplication(app, name, value);
    }
    return cfg;
  });
};
