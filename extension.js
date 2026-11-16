'use strict';
const vscode = require('vscode');
const { toggleSidebar } = require('./sidebar-toggle');
const { replaceCurrentTab } = require('./replace-tab');
function activate(context) {
  let sidebarVisible = false;
  const run = (name, args) => vscode.commands.executeCommand(name, args);
  const register = (id, fn) =>
    context.subscriptions.push(
      vscode.commands.registerCommand(id, async (...args) => {
        try {
          return await fn(...args);
        } catch (e) {
          vscode.window.showWarningMessage(e.message);
        }
      })
    );
  register('vimNavigation.captureSidebarVisibility', async (args) => {
    sidebarVisible = !!args?.visible;
    await run('vim.remap', { after: ['<space>'] });
  });
  register('vimNavigation.toggleExplorer', async () => {
    const was = sidebarVisible;
    await toggleSidebar(was, run);
    sidebarVisible = !was;
  });
  register('vimNavigation.closeExplorer', async () => {
    await toggleSidebar(true, run);
    sidebarVisible = false;
  });
  register('vimNavigation.replaceCurrentTab', () =>
    replaceCurrentTab({
      activeGroup: () => vscode.window.tabGroups.activeTabGroup,
      openSelected: () => run('explorer.openAndPassFocus'),
      close: (tab) => vscode.window.tabGroups.close(tab, true),
      move: (value) =>
        run('moveActiveEditor', { to: 'position', by: 'tab', value }),
      pin: () => run('workbench.action.pinEditor'),
    })
  );
}
module.exports = { activate };
