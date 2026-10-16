const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Release JS obfuscation, enabled on CI with ENABLE_JS_OBFUSCATION=true (see codemagic.yaml).
if (process.env.ENABLE_JS_OBFUSCATION === 'true') {
  process.env.UPSTREAM_TRANSFORMER_PATH = config.transformerPath;
  config.transformerPath = require.resolve('./metro.obfuscating-transformer.js');
}

module.exports = config;
