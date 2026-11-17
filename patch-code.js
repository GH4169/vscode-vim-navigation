'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const VERSION = '1.145.2';
const COMMIT = 'c4453f8ea430795f941c1b2ff6c9321135a74a02';
const MARKER = '/* vim-navigation webview focus */';
const CONTEXT_KEY = 'vimNavigation.focusedWebview';
const WORKBENCH = 'vs/workbench/workbench.desktop.main.js';

function patch(app) {
  const productPath = path.join(app, 'product.json');
  const product = JSON.parse(fs.readFileSync(productPath, 'utf8'));
  if (product.version !== VERSION || product.commit !== COMMIT) {
    throw new Error(
      'Unsupported Code build; requires ' + VERSION + ' / ' + COMMIT
    );
  }

  const file = path.join(app, 'out', WORKBENCH);
  const source = fs.readFileSync(file, 'utf8');
  const checksum = (text) =>
    crypto
      .createHash('sha256')
      .update(text)
      .digest('base64')
      .replace(/=+$/, '');
  if (checksum(source) !== product.checksums[WORKBENCH]) {
    throw new Error(
      'Workbench checksum mismatch; refusing to patch an unknown runtime'
    );
  }
  if (source.includes(MARKER)) return;

  const service = source.match(/([\w$]+)=he\("contextKeyService"\)/);
  const focus = source.match(
    /_updateActiveWebview\(([\w$]+)\)\{\1!==this\._activeWebview&&\(this\._activeWebview=\1,this\._onDidChangeActiveWebview\.fire\(\1\)\)\}/
  );
  if (!service || !focus) {
    throw new Error('Verified webview focus structures are unavailable');
  }
  const view = focus[1];
  const replacement = `_updateActiveWebview(${view}){${MARKER}${view}!==this._activeWebview&&(this._activeWebview=${view},this._instantiationService.invokeFunction(access=>access.get(${service[1]}).createKey("${CONTEXT_KEY}",${view}?.providedViewType??"")),this._onDidChangeActiveWebview.fire(${view}))}`;
  const patched = source.replace(focus[0], replacement);
  product.checksums[WORKBENCH] = checksum(patched);
  // Replace files rather than writing through a possible hard link to a source runtime.
  fs.writeFileSync(file + '.vim-navigation.tmp', patched);
  fs.renameSync(file + '.vim-navigation.tmp', file);
  fs.writeFileSync(
    productPath + '.vim-navigation.tmp',
    JSON.stringify(product, null, 2)
  );
  fs.renameSync(productPath + '.vim-navigation.tmp', productPath);
}

if (require.main === module) patch(process.argv[2]);
module.exports = { patch, VERSION, COMMIT, CONTEXT_KEY };
