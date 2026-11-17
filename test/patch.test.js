'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const { patch, VERSION, COMMIT, CONTEXT_KEY } = require('../patch-code');

function runtime(t, source, overrides = {}) {
  const app = fs.mkdtempSync(path.join(os.tmpdir(), 'navigation-patch-'));
  t.after(() => fs.rmSync(app, { recursive: true, force: true }));
  const file = path.join(app, 'out/vs/workbench/workbench.desktop.main.js');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, source);
  fs.writeFileSync(
    path.join(app, 'product.json'),
    JSON.stringify({
      version: VERSION,
      commit: COMMIT,
      checksums: {
        'vs/workbench/workbench.desktop.main.js': crypto
          .createHash('sha256')
          .update(source)
          .digest('base64')
          .replace(/=+$/, ''),
      },
      ...overrides,
    })
  );
  return { app, file };
}

test('focus context follows mouse/keyboard webview focus and clears on blur; patch is idempotent', (t) => {
  const source =
    'var contextService=he("contextKeyService");globalThis.Service=class{_updateActiveWebview(view){view!==this._activeWebview&&(this._activeWebview=view,this._onDidChangeActiveWebview.fire(view))}};';
  const { app, file } = runtime(t, source);
  patch(app);
  const patched = fs.readFileSync(file, 'utf8');
  const values = new Map();
  const sandbox = { he: (id) => id };
  vm.runInNewContext(patched, sandbox);
  const instance = new sandbox.Service();
  instance._onDidChangeActiveWebview = { fire() {} };
  instance._instantiationService = {
    invokeFunction: (fn) =>
      fn({
        get: () => ({ createKey: (key, value) => values.set(key, value) }),
      }),
  };
  instance._updateActiveWebview({
    providedViewType: 'chatgpt.sidebarSecondaryView',
  });
  assert.equal(values.get(CONTEXT_KEY), 'chatgpt.sidebarSecondaryView');
  instance._updateActiveWebview({ providedViewType: 'unrelated.webview' });
  assert.equal(values.get(CONTEXT_KEY), 'unrelated.webview');
  instance._updateActiveWebview(undefined);
  assert.equal(values.get(CONTEXT_KEY), '');
  patch(app);
  assert.equal(fs.readFileSync(file, 'utf8'), patched);
});

test('patch rejects unsupported versions and modified or unrecognized workbenches', (t) => {
  for (const overrides of [{ version: '1.999.0' }, {}]) {
    const { app, file } = runtime(t, 'unknown workbench', overrides);
    assert.throws(() => patch(app), /Unsupported|structures/);
    assert.equal(fs.readFileSync(file, 'utf8'), 'unknown workbench');
  }
  const { app, file } = runtime(t, 'original');
  fs.appendFileSync(file, 'unexpected modification');
  assert.throws(() => patch(app), /checksum/);
});
