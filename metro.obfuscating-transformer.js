const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');

// Wraps Expo's Metro transform worker and obfuscates the app's own modules (src/ and App.js) in release bundles.
// node_modules are left alone: obfuscating them is slow and breaks libraries.
const upstream = require(
  process.env.UPSTREAM_TRANSFORMER_PATH || require.resolve('@expo/metro-config/build/transform-worker/transform-worker.js')
);

const PROJECT_ROOT = __dirname;
const TARGETS = [path.join(PROJECT_ROOT, 'src') + path.sep, path.join(PROJECT_ROOT, 'App.js')];

// Conservative settings that keep Hermes and React Native working: no self-defending (needs
// Function.prototype.toString source, unavailable in Hermes), no global renaming, no eval.
const OPTIONS = {
  target: 'browser-no-eval',
  compact: true,
  identifierNamesGenerator: 'hexadecimal',
  renameGlobals: false,
  selfDefending: false,
  debugProtection: false,
  disableConsoleOutput: false,
  stringArray: true,
  stringArrayThreshold: 0.75,
  stringArrayEncoding: ['base64'],
  stringArrayRotate: true,
  stringArrayShuffle: true,
  splitStrings: false,
  controlFlowFlattening: false,
  deadCodeInjection: false,
  transformObjectKeys: false,
  unicodeEscapeSequence: false,
  sourceMap: false,
};

// Module code arrives as `__d(function(...){...});` and Metro's serializer later inserts the module id and
// dependency list before the last `)`. So only the factory function inside `__d(...)` is obfuscated. The
// obfuscator adds top-level helpers (the string array), so the factory is obfuscated as a top-level `var`
// (kept by renameGlobals: false) and returned from an IIFE, keeping `__d(<expression>)` intact.
const HOLDER = '__obfModule';
const DEFINE_CALL = /^\s*__d\(([\s\S]*)\)(;?)\s*$/;

function obfuscateModule(code) {
  const match = DEFINE_CALL.exec(code);
  if (!match) return code;
  const program = JavaScriptObfuscator.obfuscate(`var ${HOLDER}=${match[1]};`, OPTIONS).getObfuscatedCode();
  return `__d((function(){${program}\nreturn ${HOLDER};})())${match[2]}`;
}

function shouldObfuscate(filename, options) {
  if (options.dev) return false;
  const absolute = path.resolve(PROJECT_ROOT, filename);
  return TARGETS.some((t) => absolute === t || absolute.startsWith(t));
}

module.exports = {
  ...upstream,

  async transform(config, projectRoot, filename, data, options) {
    const result = await upstream.transform(config, projectRoot, filename, data, options);
    if (!shouldObfuscate(filename, options)) return result;

    return {
      ...result,
      output: result.output.map((out) => {
        if (!out.type.startsWith('js/') || typeof out.data.code !== 'string') return out;
        const code = obfuscateModule(out.data.code);
        return { ...out, data: { ...out.data, code, lineCount: code.split('\n').length, map: [] } };
      }),
    };
  },

  getCacheKey(config) {
    return `${upstream.getCacheKey(config)}:obfuscated:${JSON.stringify(OPTIONS)}`;
  },
};
