const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const parser = require(require.resolve('@babel/parser', { paths: [require.resolve('expo/package.json')] }));
const source = fs.readFileSync(
  require('node:path').join(__dirname, '../src/screens/PreviewScreen.js'),
  'utf8',
);
const ast = parser.parse(source, { sourceType: 'module', plugins: ['jsx'] });
const names = new Set([
  'isValidWebUrl',
  'parseHandoff',
  'augmentEntryUrl',
  'normalizeAttribution',
  'waitAtMost',
  'startAttribution',
]);
const snippets = [];
for (const statement of ast.program.body) {
  const node = statement.declaration || statement;
  if (node.type === 'FunctionDeclaration' && names.has(node.id.name))
    snippets.push(source.slice(node.start, node.end));
  if (
    node.type === 'VariableDeclaration' &&
    node.declarations.some((d) =>
      ['QUERY_FIELDS', 'attributionPromise', 'attributionSnapshot'].includes(d.id.name),
    )
  )
    snippets.push(source.slice(node.start, node.end));
}
function helpers(appsFlyer = {}) {
  const context = vm.createContext({
    URL,
    setTimeout,
    clearTimeout,
    Constants: { expoConfig: { extra: { services: { appsFlyerDevKey: 'test-key' } } } },
    Platform: { OS: 'android' },
    appsFlyer,
  });
  vm.runInContext(`${snippets.join('\n')}\nglobalThis.api = { ${Array.from(names).join(',')} };`, context);
  return context.api;
}
const h = helpers();
const config = {
  enabled: true,
  target_host: 'mirkas.org',
  target_path: '/',
  query: { af_uid: 'af_id', af_status: 'af_status', media_source: 'media_source', campaign: 'campaign' },
};
test('HTTPS entry rejects credentials and plaintext', () => {
  assert.equal(h.isValidWebUrl('https://mirkas.org/'), true);
  assert.equal(h.isValidWebUrl('http://mirkas.org/'), false);
  assert.equal(h.isValidWebUrl('https://user:pass@mirkas.org/'), false);
});
test('handoff validates hosts, paths, booleans and allowed attribution fields', () => {
  for (const bad of [
    { enabled: 'true' },
    { target_host: 'https://mirkas.org' },
    { target_path: '/?key=x' },
    { query: { token: 'secret' } },
    { target_host: 'mirkas.org:443' },
  ])
    assert.equal(h.parseHandoff(JSON.stringify({ ...config, ...bad })), null);
  assert.ok(h.parseHandoff(JSON.stringify(config)));
});
test('augmentation preserves raw existing query, fragments, encoding and idempotence', () => {
  const handoff = h.parseHandoff(JSON.stringify(config));
  const base = 'https://mirkas.org/?key=a%2fb&x=1+2#section';
  const result = h.augmentEntryUrl(base, handoff, {
    af_id: 'id& 1',
    af_status: 'Organic',
    media_source: 'organic',
  });
  assert.ok(result.startsWith('https://mirkas.org/?key=a%2fb&x=1+2&af_uid=id%26%201'));
  assert.ok(result.endsWith('#section'));
  assert.equal(h.augmentEntryUrl(result, handoff, { af_id: 'different' }), result);
  assert.ok(!result.includes('campaign='));
});
test('augmentation never targets other hosts, paths, or nonstandard ports', () => {
  const handoff = h.parseHandoff(JSON.stringify(config));
  for (const url of ['https://evil-mirkas.org/', 'https://mirkas.org/other', 'https://mirkas.org:8443/'])
    assert.equal(h.augmentEntryUrl(url, handoff, { af_id: 'uid' }), url);
});
test('Organic comes from SDK and never invents a campaign or attribution status', () => {
  const result = h.normalizeAttribution({ data: { af_status: 'Organic', media_source: 'unused' } }, 'uid');
  assert.equal(result.af_id, 'uid');
  assert.equal(result.af_status, 'Organic');
  assert.equal(result.media_source, 'organic');
  assert.equal(result.campaign, undefined);
  const fallback = h.normalizeAttribution({}, 'uid');
  assert.equal(fallback.af_status, undefined);
  assert.equal(fallback.media_source, undefined);
});
test('AppsFlyer 7 registers listeners before starting only on session-ready', async () => {
  const calls = [];
  let conversion;
  let session;
  const sdk = {
    init: () => {
      calls.push('init');
      return Promise.resolve();
    },
    registerConversionListener: (cb) => {
      calls.push('conversion');
      conversion = cb;
      return Promise.resolve();
    },
    registerSessionReadyListener: (cb) => {
      calls.push('session');
      session = cb;
      return Promise.resolve();
    },
    start: () => {
      calls.push('start');
      return Promise.resolve();
    },
    getAppsFlyerUID: () => Promise.resolve('uid-7'),
    enableDebug: () => Promise.resolve(),
  };
  const isolated = helpers(sdk);
  const pending = isolated.startAttribution();
  assert.deepEqual(calls, ['init', 'conversion', 'session']);
  session();
  await conversion.onConversionDataSuccess({ af_status: 'Organic' });
  const data = await pending;
  assert.equal(data.af_id, 'uid-7');
  assert.equal(data.media_source, 'organic');
  assert.equal(calls.filter((c) => c === 'start').length, 1);
});
