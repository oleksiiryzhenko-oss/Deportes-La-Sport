const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
module.exports = defineConfig([
  expoConfig,
  { ignores: ['dist/*'] },
  {
    files: ['*.config.js', 'plugins/**/*.js', 'metro.obfuscating-transformer.js'],
    languageOptions: { sourceType: 'commonjs', globals: { __dirname: 'readonly', Buffer: 'readonly' } },
  },
]);
