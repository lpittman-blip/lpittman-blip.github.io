// Checks the homepage status card (aurora.js) renders from a /api/status payload, including the
// trimmed payload proposed in the 2026-10-31 site audit. Run: node tests/status-card.test.cjs
const fs = require('fs'), path = require('path'), assert = require('assert');
const src = fs.readFileSync(path.join(__dirname, '..', 'aurora.js'), 'utf8');
const IDS = ['st-chat', 'st-model', 'st-search', 'st-fetch', 'st-storage', 'st-voice', 'st-upload', 'st-gw', 'st-queue', 'st-when', 'hero-state', 'hero-dot', 'live-dot'];
async function render(status, health) {
  const nodes = Object.fromEntries(IDS.map(id => [id, { textContent: 'static', className: '' }]));
  let ready;
  const document = {
    documentElement: { setAttribute() {}, removeAttribute() {}, classList: { add() {} } },
    hidden: false, body: { appendChild() {} },
    getElementById: id => nodes[id] || null,
    querySelectorAll: () => ({ length: 0, forEach() {} }),
    querySelector: () => null, createElement: () => ({ setAttribute() {}, getAttribute: () => '', addEventListener() {} }),
    addEventListener: (ev, fn) => { if (ev === 'DOMContentLoaded') ready = fn; },
  };
  const fetch = async url => ({ ok: true, json: async () => (url.endsWith('/api/health') ? health : status) });
  const ctx = { document, window: { matchMedia: () => ({ matches: true }) }, matchMedia: () => ({ matches: true }), localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    fetch, performance: { now: () => 0 }, setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {}, AbortController: undefined, IntersectionObserver: undefined };
  new Function(...Object.keys(ctx), src)(...Object.values(ctx));
  ready();
  await new Promise(r => setImmediate(r)); await new Promise(r => setImmediate(r));
  return Object.fromEntries(Object.entries(nodes).map(([k, v]) => [k, v.textContent]));
}
const live = { configured: true, serving: true, status: 'available', model: 'artemis-bootstrap', provider: 'azure-ai-services', deployment: 'artemis-bootstrap', quality: 'not-artemis', bootstrap: true,
  capabilities: { text_chat: true, tools: { web_search: 'wikipedia', web_fetch: true, run_python: null, research_search: null }, voice_input: false, file_upload: false, read_aloud: 'browser_support_required' },
  storage: 'server', training_collection: false, default_model: 'artemis',
  added_models: { 'artemis-preview': { configured: true, serving: true, status: 'available', step: 1, external: false, provider: 'artemis-preview', model: 'internal-preview-id', } } };
const trimmed = { configured: true, serving: true, status: 'available', bootstrap: true, quality: 'not-artemis',
  capabilities: { text_chat: true, tools: { web_search: 'wikipedia', web_fetch: true }, voice_input: false, file_upload: false, read_aloud: 'browser_support_required' },
  storage: 'server', training_collection: false, default_model: 'artemis',
  added_models: { 'artemis-preview': { configured: true, serving: true, status: 'available' } } };
(async () => {
  const health = { ok: true, queued: 0, generating: 1 };
  const a = await render(live, health), b = await render(trimmed, health);
  for (const k of IDS.filter(k => k !== 'st-when')) assert.strictEqual(b[k], a[k], `${k} differs: ${a[k]} vs ${b[k]}`);
  assert.strictEqual(b['st-chat'], 'Serving');
  assert.match(b['st-model'], /Bootstrap model/);
  assert.strictEqual(b['st-search'], 'On (wikipedia)');
  assert.strictEqual(b['hero-state'], 'Artemis Chat is online');
  assert.ok(!JSON.stringify(trimmed).includes('azure') && !JSON.stringify(trimmed).includes('internal-preview-id'));
  console.log('status card: live and trimmed payloads render identically ✓');
  console.log(JSON.stringify(b));
})().catch(e => { console.error(e); process.exit(1); });
