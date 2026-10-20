const { withProjectBuildGradle } = require('expo/config-plugins');

module.exports = function withAppsFlyerKotlin(config) {
  return withProjectBuildGradle(config, cfg => {
    const setting = 'rootProject.ext.kotlin_stdlib_version = rootProject.ext.kotlinVersion';
    if (!cfg.modResults.contents.includes(setting)) cfg.modResults.contents += `\n${setting}\n`;
    return cfg;
  });
};
