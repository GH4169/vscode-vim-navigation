'use strict';
const { test } = require('node:test'),
  assert = require('node:assert/strict');
const { replaceCurrentTab } = require('../replace-tab'),
  { toggleSidebar } = require('../sidebar-toggle');
test('toggle uses explicit visibility and focuses tree on opening', async () => {
  const calls = [];
  await toggleSidebar(false, async (id) => calls.push(id));
  await toggleSidebar(true, async (id) => calls.push(id));
  assert.deepEqual(calls, [
    'workbench.view.explorer',
    'workbench.files.action.focusFilesExplorer',
    'workbench.action.closeSidebar',
    'workbench.action.focusActiveEditorGroup',
  ]);
});
test('dirty tab is protected and clean replacement retains index/pin', async () => {
  const old = { isDirty: true, isPinned: true },
    other = {},
    target = {},
    g = { activeTab: old, tabs: [other, old] },
    calls = [];
  const api = {
    activeGroup: () => g,
    openSelected: async () => {
      g.activeTab = target;
    },
    close: async (t) => {
      calls.push(t);
      return true;
    },
    move: async (n) => calls.push(n),
    pin: async () => calls.push('pin'),
  };
  await assert.rejects(replaceCurrentTab(api), /未保存/);
  assert.equal(g.activeTab, old);
  old.isDirty = false;
  await replaceCurrentTab(api);
  assert.deepEqual(calls, [old, 2, 'pin']);
});
